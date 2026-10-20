/* 主逻辑：上传 → 平台/规格选择 → 裁剪 → 比例锁定 + 像素尺寸 → 文字图层 → 多格式导出（含大小预估）
 * 关键设计：
 *  - 规格 = 裁剪比例（锁定裁剪框），输出尺寸（宽/高）可自定义，锁定比例时改一维自动同步另一维
 *  - 自定义模式：手动输入即按比例锁定；不锁定时拖拽图片，下方实时显示当前比例 + 选区像素
 *  - 文字图层：多图层 + 平铺水印 + 模板（localStorage），预览上可拖拽定位，系统字体栈
 */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const fileInput   = $("#fileInput");
  const dropZone    = $("#dropZone");
  const reUpload    = $("#reUpload");
  const cropImg     = $("#cropImg");
  const cropStage   = $("#cropStage");
  const platformSel = $("#platformSel");
  const presetWrap  = $("#presetWrap");
  const presetSel   = $("#presetSel");
  const customHint  = $("#customHint");
  const inW         = $("#inW");
  const inH         = $("#inH");
  const ratioLock   = $("#ratioLock");
  const ratioReadout= $("#ratioReadout");
  const fmtSel      = $("#fmtSel");
  const qualityRow  = $("#qualityRow");
  const quality     = $("#quality");
  const qualityVal  = $("#qualityVal");
  const sizeEst     = $("#sizeEst");
  const exportBtn   = $("#exportBtn");
  const resultWrap  = $("#resultWrap");
  const resultImg   = $("#resultImg");
  const resultMeta  = $("#resultMeta");
  const dlLink      = $("#dlLink");
  const emptyHint   = $("#emptyHint");
  // 文字图层
  const textPreview = $("#textPreview");
  const tpImg       = $("#tpImg");
  const tpOverlay   = $("#tpOverlay");
  const addLayerBtn = $("#addLayer");
  const templateSel = $("#templateSel");
  const saveTemplateBtn = $("#saveTemplate");
  const layerList   = $("#layerList");
  const layerEditor = $("#layerEditor");
  const layerText   = $("#layerText");
  const layerFont   = $("#layerFont");   const layerFontVal = $("#layerFontVal");
  const layerColor  = $("#layerColor");
  const layerAlign  = $("#layerAlign");
  const layerOpacity= $("#layerOpacity"); const layerOpacityVal = $("#layerOpacityVal");
  const layerRotation= $("#layerRotation"); const layerRotationVal = $("#layerRotationVal");
  const layerBoxW   = $("#layerBoxW");   const layerBoxWVal = $("#layerBoxWVal");
  const layerBold   = $("#layerBold");
  const layerBg     = $("#layerBg");     const bgRow = $("#bgRow");
  const layerBgColor= $("#layerBgColor");
  const layerBgOpacity = $("#layerBgOpacity"); const layerBgOpacityVal = $("#layerBgOpacityVal");
  const layerTiled  = $("#layerTiled");

  let cropper = null;
  let lastBlobUrl = null;
  let estTimer = null;
  let refreshTimer = null;
  let layerSeq = 0;
  const state = { targetW: null, targetH: null, lockRatio: null, layers: [], selLayer: null };

  // ---------- 工具 ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function hexA(hex, a) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ---------- 比例显示 ----------
  // 比例读数：简单 X.XX:Y 形式，小数点后 2 位
  function ratioLabel(r) {
    if (!isFinite(r) || r <= 0) return "—";
    return r >= 1 ? `${r.toFixed(2)}:1` : `1:${(1 / r).toFixed(2)}`;
  }
  // 规格选项用的干净比例：整数比优先（1:1 / 16:9…），否则两位小数 X.XX:1
  function cleanRatio(w, h) {
    const r = w / h;
    const common = [[1,1],[4,3],[3,2],[16,9],[3,4],[2,3],[9,16],[5,4],[4,5],
      [2,1],[1,2],[3,1],[1,3],[16,10],[5,3],[3,5],[7,5],[5,7]];
    let best = null, bestd = 1e9;
    for (const [a, b] of common) {
      const d = Math.abs(r - a / b);
      if (d < bestd) { bestd = d; best = [a, b]; }
    }
    if (bestd < 0.02) return `${best[0]}:${best[1]}`;
    return r >= 1 ? `${r.toFixed(2)}:1` : `1:${(1 / r).toFixed(2)}`;
  }

  // ---------- 构建下拉 ----------
  function buildPlatformSelect() {
    PLATFORM_ORDER.forEach((k) => {
      const o = document.createElement("option");
      o.value = k; o.textContent = PRESETS[k].label;
      platformSel.appendChild(o);
    });
    const oc = document.createElement("option");
    oc.value = "custom";
    oc.textContent = "自定义（兜底 / 自由裁剪）";
    platformSel.appendChild(oc);
  }

  function buildSpecSelect(platformKey) {
    presetSel.innerHTML = "";
    PRESETS[platformKey].items.forEach((it) => {
      const o = document.createElement("option");
      o.value = it.id;
      o.textContent = it.name.includes(":") ? it.name : `${it.name} ${cleanRatio(it.w, it.h)}`;
      presetSel.appendChild(o);
    });
  }

  function buildFormatSelect() {
    EXPORT_FORMATS.forEach((f) => {
      const o = document.createElement("option");
      o.value = f.value; o.textContent = f.label;
      fmtSel.appendChild(o);
    });
  }

  // ---------- 比例读数 ----------
  function updateRatioReadout() {
    if (cropper && !ratioLock.checked) {
      const d = cropper.getData();
      if (d && d.width && d.height) {
        const rw = Math.round(d.width), rh = Math.round(d.height);
        ratioReadout.textContent = `当前比例 ${ratioLabel(d.width / d.height)} · 选区 ${rw}×${rh}px（拖拽实时更新）`;
        return;
      }
    }
    if (state.lockRatio) {
      ratioReadout.textContent = "锁定比例 " + ratioLabel(state.lockRatio);
    } else {
      ratioReadout.textContent = "当前比例：自由裁剪（拖拽实时更新）";
    }
  }

  // ---------- 选择逻辑（两级） ----------
  function onPlatformChange() {
    const p = platformSel.value;
    if (p === "custom") {
      presetWrap.style.display = "none";
      customHint.style.display = "block";
      presetSel.innerHTML = "";
      ratioLock.checked = false;
      state.lockRatio = null;
      inW.value = ""; inH.value = "";
      state.targetW = state.targetH = null;
      setRatio(NaN);
      updateRatioReadout();
      return;
    }
    presetWrap.style.display = "block";
    customHint.style.display = "none";
    buildSpecSelect(p);
    presetSel.selectedIndex = 0;
    onPresetChange();
  }

  function onPresetChange() {
    const it = PRESET_MAP[presetSel.value];
    if (!it) return;
    inW.value = it.w;
    inH.value = it.h;
    state.targetW = it.w;
    state.targetH = it.h;
    state.lockRatio = it.w / it.h;     // 比例由规格决定
    ratioLock.checked = true;
    setRatio(state.lockRatio);
    updateRatioReadout();
    scheduleRefresh();
  }

  // 输出尺寸输入：锁定比例时自动同步另一个维度，保持比例不变
  function onSizeInput(edited) {
    const w = parseInt(inW.value, 10);
    const h = parseInt(inH.value, 10);
    if (ratioLock.checked && state.lockRatio) {
      if (edited === "w" && w > 0) {
        const nh = Math.round(w / state.lockRatio);
        inH.value = nh; state.targetH = nh; state.targetW = w;
      } else if (edited === "h" && h > 0) {
        const nw = Math.round(h * state.lockRatio);
        inW.value = nw; state.targetW = nw; state.targetH = h;
      }
    } else {
      state.targetW = w > 0 ? w : null;
      state.targetH = h > 0 ? h : null;
    }
    // 自定义模式下，手动输入即按输入比例锁定（满足“手动输入改变比例”）
    if (platformSel.value === "custom" && state.targetW && state.targetH) {
      ratioLock.checked = true;
      state.lockRatio = state.targetW / state.targetH;
      setRatio(state.lockRatio);
    }
    updateRatioReadout();
    scheduleRefresh();
  }

  function setRatio(r) {
    if (cropper) cropper.setAspectRatio(isNaN(r) ? NaN : r);
  }

  function onRatioLockToggle() {
    if (ratioLock.checked) {
      if (state.targetW && state.targetH) state.lockRatio = state.targetW / state.targetH;
      setRatio(state.lockRatio || NaN);
    } else {
      state.lockRatio = null;
      setRatio(NaN);
    }
    updateRatioReadout();
    scheduleRefresh();
  }

  // 把当前面板选择应用到裁剪框
  function applyCurrentToCropper() {
    if (platformSel.value === "custom") {
      ratioLock.checked = false;
      state.lockRatio = null;
      setRatio(NaN);
    } else {
      const it = PRESET_MAP[presetSel.value];
      if (it) {
        inW.value = it.w; inH.value = it.h;
        state.targetW = it.w; state.targetH = it.h;
        state.lockRatio = it.w / it.h;
        ratioLock.checked = true;
        setRatio(state.lockRatio);
      }
    }
    updateRatioReadout();
  }

  // ---------- 上传 ----------
  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) { alert("请选择图片文件"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      cropImg.src = e.target.result;
      dropZone.style.display = "none";
      reUpload.style.display = "inline-block";
      cropStage.style.display = "block";
      emptyHint.style.display = "none";
      state.layers = [];          // 换图重置文字图层（模板可重新套用）
      state.selLayer = null;
      renderLayerList();
      if (cropper) cropper.destroy();
      cropper = new Cropper(cropImg, {
        viewMode: 1, autoCropArea: 0.85, background: true,
        responsive: true, checkOrientation: true,
        ready() { applyCurrentToCropper(); scheduleRefresh(); },
        crop() { updateRatioReadout(); scheduleRefresh(); }
      });
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e) {
    e.preventDefault();
    dropZone.classList.remove("drag");
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  // ---------- 文字图层模型 ----------
  function defaultLayer() {
    return {
      id: ++layerSeq, text: "双击编辑文字", xPct: 50, yPct: 50,
      fontPct: 6, color: "#ffffff", bold: true, align: "center",
      opacity: 1, rotation: 0, boxWpct: 0,
      bgOn: false, bgColor: "#000000", bgOpacity: 0.5, tiled: false
    };
  }
  const selLayer = () => state.layers.find((l) => l.id === state.selLayer) || null;

  function addLayer() {
    const l = defaultLayer();
    state.layers.push(l);
    selectLayer(l.id);
    renderTextPreview();
  }
  function delLayer(i) {
    state.layers.splice(i, 1);
    if (state.selLayer && !state.layers.some((l) => l.id === state.selLayer)) state.selLayer = null;
    renderLayerList();
    renderTextPreview();
  }
  function moveLayer(i, d) {
    const j = i + d;
    if (j < 0 || j >= state.layers.length) return;
    [state.layers[i], state.layers[j]] = [state.layers[j], state.layers[i]];
    renderLayerList();
  }
  function dupLayer(i) {
    const copy = { ...state.layers[i], id: ++layerSeq };
    state.layers.splice(i + 1, 0, copy);
    selectLayer(copy.id);
    renderTextPreview();
  }

  function renderLayerList() {
    layerList.innerHTML = "";
    if (!state.layers.length) {
      layerList.innerHTML = '<li class="muted tiny">暂无文字图层，点「+ 添加文字」</li>';
      layerEditor.style.display = "none";
      return;
    }
    state.layers.forEach((l, i) => {
      const li = document.createElement("li");
      li.className = "layer-item" + (l.id === state.selLayer ? " active" : "");
      const name = (l.text || "未命名").split("\n")[0].slice(0, 12) || "未命名";
      const nm = document.createElement("span");
      nm.className = "li-name";
      nm.innerHTML = escapeHtml(name) + (l.tiled ? " 〔水印〕" : "");
      li.appendChild(nm);
      const mk = (t, cls, title, fn) => {
        const b = document.createElement("button");
        b.textContent = t; b.className = "li-btn" + (cls ? " " + cls : "");
        if (title) b.title = title;
        b.addEventListener("click", (ev) => { ev.stopPropagation(); fn(); });
        li.appendChild(b);
      };
      mk("↑", "", "上移", () => moveLayer(i, -1));
      mk("↓", "", "下移", () => moveLayer(i, 1));
      mk("⧉", "", "复制", () => dupLayer(i));
      mk("✕", "del", "删除", () => delLayer(i));
      li.addEventListener("click", () => selectLayer(l.id));
      layerList.appendChild(li);
    });
  }

  function selectLayer(id) {
    state.selLayer = id;
    const l = selLayer();
    if (!l) { layerEditor.style.display = "none"; renderLayerList(); return; }
    layerEditor.style.display = "block";
    layerText.value = l.text;
    layerFont.value = l.fontPct; layerFontVal.textContent = l.fontPct + "%";
    layerColor.value = l.color;
    layerAlign.value = l.align;
    layerOpacity.value = l.opacity; layerOpacityVal.textContent = Math.round(l.opacity * 100) + "%";
    layerRotation.value = l.rotation; layerRotationVal.textContent = l.rotation + "°";
    layerBoxW.value = l.boxWpct; layerBoxWVal.textContent = l.boxWpct + "%";
    layerBold.checked = l.bold;
    layerBg.checked = l.bgOn; bgRow.style.display = l.bgOn ? "flex" : "none";
    layerBgColor.value = l.bgColor;
    layerBgOpacity.value = l.bgOpacity; layerBgOpacityVal.textContent = Math.round(l.bgOpacity * 100) + "%";
    layerTiled.checked = l.tiled;
    renderLayerList();
  }

  // 图层编辑输入 → 实时写回 + 刷新预览（不重建 overlay，避免打断拖拽）
  function bindLayerInputs() {
    addLayerBtn.addEventListener("click", addLayer);
    saveTemplateBtn.addEventListener("click", saveTemplate);
    templateSel.addEventListener("change", (e) => applyTemplate(e.target.value));

    const live = (el, key, label, transform) => {
      el.addEventListener("input", () => {
        const l = selLayer(); if (!l) return;
        const v = transform ? transform(el.value) : el.value;
        l[key] = v;
        if (label) label(el.value);
        renderTextPreview();
      });
    };
    layerText.addEventListener("input", () => { const l = selLayer(); if (!l) return; l.text = layerText.value; renderTextPreview(); });
    live(layerFont, "fontPct", (v) => layerFontVal.textContent = v + "%", (v) => parseFloat(v));
    layerColor.addEventListener("input", () => { const l = selLayer(); if (!l) return; l.color = layerColor.value; renderTextPreview(); });
    layerAlign.addEventListener("change", () => { const l = selLayer(); if (!l) return; l.align = layerAlign.value; renderTextPreview(); });
    live(layerOpacity, "opacity", (v) => layerOpacityVal.textContent = Math.round(v * 100) + "%", (v) => parseFloat(v));
    live(layerRotation, "rotation", (v) => layerRotationVal.textContent = v + "°", (v) => parseInt(v, 10));
    live(layerBoxW, "boxWpct", (v) => layerBoxWVal.textContent = v + "%", (v) => parseInt(v, 10));
    layerBold.addEventListener("change", () => { const l = selLayer(); if (!l) return; l.bold = layerBold.checked; renderTextPreview(); });
    layerBg.addEventListener("change", () => {
      const l = selLayer(); if (!l) return; l.bgOn = layerBg.checked;
      bgRow.style.display = layerBg.checked ? "flex" : "none"; renderTextPreview();
    });
    layerBgColor.addEventListener("input", () => { const l = selLayer(); if (!l) return; l.bgColor = layerBgColor.value; renderTextPreview(); });
    live(layerBgOpacity, "bgOpacity", (v) => layerBgOpacityVal.textContent = Math.round(v * 100) + "%", (v) => parseFloat(v));
    layerTiled.addEventListener("change", () => { const l = selLayer(); if (!l) return; l.tiled = layerTiled.checked; renderTextPreview(); });
  }

  // ---------- 模板 ----------
  const BUILTIN_TEMPLATES = {
    "封面标题+署名": [
      { text: "在这里输入标题", xPct: 50, yPct: 12, fontPct: 8, color: "#ffffff", bold: true, align: "center", opacity: 1, rotation: 0, boxWpct: 90, bgOn: true, bgColor: "#000000", bgOpacity: 0.45, tiled: false },
      { text: "@你的署名", xPct: 88, yPct: 92, fontPct: 4, color: "#ffffff", bold: false, align: "right", opacity: 0.92, rotation: 0, boxWpct: 0, bgOn: false, bgColor: "#000000", bgOpacity: 0.5, tiled: false }
    ],
    "居中水印": [
      { text: "仅供预览 · 请勿转载", xPct: 50, yPct: 50, fontPct: 5, color: "#ffffff", bold: false, align: "center", opacity: 0.18, rotation: -30, boxWpct: 0, bgOn: false, bgColor: "#000000", bgOpacity: 0.5, tiled: true }
    ]
  };
  const TPL_KEY = "imgcropper_templates";
  function loadTemplates() {
    try { return JSON.parse(localStorage.getItem(TPL_KEY)) || {}; } catch (e) { return {}; }
  }
  function buildTemplateSel() {
    templateSel.innerHTML = '<option value="">— 套用模板 —</option>';
    Object.keys(BUILTIN_TEMPLATES).forEach((k) => {
      const o = document.createElement("option"); o.value = k; o.textContent = "内置：" + k; templateSel.appendChild(o);
    });
    const saved = loadTemplates();
    Object.keys(saved).forEach((k) => {
      const o = document.createElement("option"); o.value = k; o.textContent = "我的：" + k; templateSel.appendChild(o);
    });
  }
  function applyTemplate(name) {
    if (!name) return;
    const tpl = BUILTIN_TEMPLATES[name] || loadTemplates()[name];
    if (!tpl) return;
    state.layers = tpl.map((o) => ({ ...o, id: ++layerSeq }));
    selectLayer(state.layers[0] ? state.layers[0].id : null);
    renderTextPreview();
  }
  function saveTemplate() {
    if (!state.layers.length) { alert("先添加文字图层再保存"); return; }
    const name = prompt("模板名称：", "我的模板");
    if (!name) return;
    const all = loadTemplates();
    all[name] = state.layers.map(({ id, ...rest }) => rest);
    localStorage.setItem(TPL_KEY, JSON.stringify(all));
    buildTemplateSel();
    templateSel.value = name;
  }

  // ---------- 文字绘制 ----------
  function wrapText(ctx, text, maxWidth) {
    const out = [];
    (text || "").split("\n").forEach((para) => {
      if (para === "") { out.push(""); return; }
      let line = "";
      for (const ch of para) {
        const test = line + ch;
        if (maxWidth && ctx.measureText(test).width > maxWidth && line) { out.push(line); line = ch; }
        else line = test;
      }
      if (line) out.push(line);
    });
    return out;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawLayer(ctx, layer, W, H) {
    if (layer.tiled) { drawTiled(ctx, layer, W, H); return; }
    const fontSize = layer.fontPct / 100 * W;
    const boxW = layer.boxWpct > 0 ? layer.boxWpct / 100 * W : 0;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.font = `${layer.bold ? "bold " : ""}${fontSize}px "PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = layer.align;
    ctx.fillStyle = layer.color;
    const x = layer.xPct / 100 * W;
    const y = layer.yPct / 100 * H;
    if (layer.rotation) {
      ctx.translate(x, y); ctx.rotate(layer.rotation * Math.PI / 180); ctx.translate(-x, -y);
    }
    const lines = wrapText(ctx, layer.text, boxW);
    const lineH = fontSize * 1.25;
    if (layer.bgOn) {
      let maxW = 0;
      lines.forEach((l) => { maxW = Math.max(maxW, ctx.measureText(l).width); });
      const padX = fontSize * 0.3, padY = fontSize * 0.2;
      let bx = x;
      if (layer.align === "center") bx = x - maxW / 2;
      else if (layer.align === "right") bx = x - maxW;
      ctx.save();
      ctx.globalAlpha = layer.opacity * layer.bgOpacity;
      ctx.fillStyle = layer.bgColor;
      roundRect(ctx, bx - padX, y - padY, maxW + padX * 2, lines.length * lineH + padY * 2, fontSize * 0.15);
      ctx.fill();
      ctx.restore();
    }
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
    ctx.restore();
  }
  function drawTiled(ctx, layer, W, H) {
    const fontSize = layer.fontPct / 100 * W;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.font = `${layer.bold ? "bold " : ""}${fontSize}px "PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.fillStyle = layer.color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const angle = (layer.rotation || -30) * Math.PI / 180;
    const stepX = Math.max(fontSize * 4, ctx.measureText(layer.text).width + fontSize * 4);
    const stepY = fontSize * 3;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(angle);
    const diag = Math.sqrt(W * W + H * H);
    for (let yy = -diag; yy <= diag; yy += stepY) {
      const off = (Math.round(yy / stepY) % 2) * stepX / 2;
      for (let xx = -diag; xx <= diag; xx += stepX) ctx.fillText(layer.text, xx + off, yy);
    }
    ctx.restore();
  }
  function composeText(srcCanvas, layers) {
    const c = document.createElement("canvas");
    c.width = srcCanvas.width; c.height = srcCanvas.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(srcCanvas, 0, 0);
    (layers || []).forEach((l) => drawLayer(ctx, l, c.width, c.height));
    return c;
  }

  // ---------- 文字预览（叠层可拖拽） ----------
  function renderTextPreview() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas(currentOpts());
    if (!canvas) return;
    textPreview.style.display = "block";
    tpImg.onload = () => buildOverlay();
    tpImg.src = canvas.toDataURL("image/jpeg", 0.85);
  }
  function buildOverlay() {
    tpOverlay.innerHTML = "";
    const pw = tpImg.clientWidth || 1;
    state.layers.forEach((l) => {
      const div = document.createElement("div");
      div.className = "tp-text" + (l.tiled ? " tiled" : "") + (l.id === state.selLayer ? " sel" : "");
      div.textContent = l.text;
      const tx = l.align === "center" ? "-50%" : l.align === "right" ? "-100%" : "0";
      div.style.left = l.xPct + "%";
      div.style.top = l.yPct + "%";
      div.style.transform = `translate(${tx},0) rotate(${l.rotation}deg)`;
      div.style.fontSize = (l.fontPct / 100 * pw) + "px";
      div.style.color = l.color;
      div.style.fontWeight = l.bold ? "bold" : "normal";
      div.style.textAlign = l.align;
      if (l.boxWpct > 0) div.style.maxWidth = (l.boxWpct / 100 * pw) + "px";
      if (l.bgOn) { div.style.background = hexA(l.bgColor, l.bgOpacity * l.opacity); div.style.padding = "0.2em 0.4em"; }
      makeDraggable(div, l);
      tpOverlay.appendChild(div);
    });
  }
  function makeDraggable(div, layer) {
    div.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      selectLayer(layer.id);
      const rect = tpOverlay.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY, ox = layer.xPct, oy = layer.yPct;
      const mv = (ev) => {
        layer.xPct = clamp(ox + (ev.clientX - sx) / rect.width * 100, -20, 120);
        layer.yPct = clamp(oy + (ev.clientY - sy) / rect.height * 100, -20, 120);
        div.style.left = layer.xPct + "%";
        div.style.top = layer.yPct + "%";
      };
      const up = () => {
        document.removeEventListener("pointermove", mv);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", mv);
      document.addEventListener("pointerup", up);
    });
  }

  // ---------- 导出参数 / 大小预估 ----------
  function currentOpts() {
    if (ratioLock.checked && state.targetW && state.targetH) {
      return { width: state.targetW, height: state.targetH, imageSmoothingEnabled: true, imageSmoothingQuality: "high" };
    }
    return {};  // 自由模式：按裁剪框自然尺寸输出
  }

  function computeEstimate() {
    if (!cropper) { sizeEst.textContent = "上传图片后显示"; return; }
    const canvas = cropper.getCroppedCanvas(currentOpts());
    if (!canvas) { sizeEst.textContent = "—"; return; }
    const composed = composeText(canvas, state.layers);
    const fmt = fmtSel.value;
    const q = fmt === "image/png" ? undefined : parseFloat(quality.value);
    composed.toBlob((blob) => {
      if (!blob) { sizeEst.textContent = "—"; return; }
      sizeEst.textContent = `${(blob.size / 1024).toFixed(0)} KB（${composed.width}×${composed.height}px）`;
    }, fmt, q);
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { computeEstimate(); renderTextPreview(); }, 200);
  }
  function scheduleEstimate() {
    clearTimeout(estTimer);
    estTimer = setTimeout(computeEstimate, 250);
  }

  // ---------- 导出 ----------
  function doExport() {
    if (!cropper) { alert("请先上传图片"); return; }
    const opts = currentOpts();
    const canvas = cropper.getCroppedCanvas(opts);
    if (!canvas) { alert("裁剪失败，请重试"); return; }
    const composed = composeText(canvas, state.layers);
    const fmt = fmtSel.value;
    const q = fmt === "image/png" ? undefined : parseFloat(quality.value);
    const ext = fmt === "image/png" ? "png" : fmt === "image/jpeg" ? "jpg" : "webp";
    composed.toBlob((blob) => {
      if (!blob) { alert("导出失败，浏览器可能不支持该格式"); return; }
      if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
      lastBlobUrl = URL.createObjectURL(blob);
      resultImg.src = lastBlobUrl;
      resultMeta.textContent =
        `输出 ${composed.width}×${composed.height}px · ${(blob.size / 1024).toFixed(0)} KB · ${fmt.split("/")[1].toUpperCase()}`;
      dlLink.href = lastBlobUrl;
      dlLink.download = `cropped-${composed.width}x${composed.height}.${ext}`;
      resultWrap.style.display = "block";
    }, fmt, q);
  }

  // ---------- 绑定 ----------
  function bind() {
    buildPlatformSelect();
    buildFormatSelect();
    buildTemplateSel();
    bindLayerInputs();

    fileInput.addEventListener("change", (e) => loadFile(e.target.files[0]));
    reUpload.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag"));
    dropZone.addEventListener("drop", onDrop);

    platformSel.addEventListener("change", onPlatformChange);
    presetSel.addEventListener("change", onPresetChange);
    inW.addEventListener("input", () => onSizeInput("w"));
    inH.addEventListener("input", () => onSizeInput("h"));
    ratioLock.addEventListener("change", onRatioLockToggle);

    fmtSel.addEventListener("change", () => {
      qualityRow.style.display = fmtSel.value === "image/png" ? "none" : "flex";
    });
    quality.addEventListener("input", () => {
      qualityVal.textContent = Math.round(quality.value * 100) + "%";
      scheduleEstimate();
    });

    exportBtn.addEventListener("click", doExport);
    window.addEventListener("resize", () => { if (cropper) buildOverlay(); });

    qualityRow.style.display = fmtSel.value === "image/png" ? "none" : "flex";
    onPlatformChange();
    updateRatioReadout();
    renderLayerList();
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
