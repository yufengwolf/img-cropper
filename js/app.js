/* 主逻辑：上传 → 平台/规格选择 → 裁剪 → 比例锁定 + 像素尺寸 → 多格式导出（含大小预估）
 * 关键设计：
 *  - 规格 = 裁剪比例（锁定裁剪框比例）
 *  - 输出尺寸（宽/高）= 可自定义的像素大小，锁定比例时改一个维度自动同步另一个
 *  - 自定义模式：手动输入即按比例锁定；不锁定时拖拽图片，下方实时显示当前比例
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

  let cropper = null;
  let lastBlobUrl = null;
  let estTimer = null;
  const state = { targetW: null, targetH: null, lockRatio: null };

  // 常见比例表（用于把小数比例标注成易读形式）
  const COMMON_RATIOS = [
    [1,1],[4,3],[3,2],[16,9],[3,4],[2,3],[9,16],[5,4],[4,5],
    [2,1],[1,2],[3,1],[1,3],[16,10],[5,3],[3,5],[7,5],[5,7]
  ];
  function ratioLabel(r) {
    if (!isFinite(r) || r <= 0) return "—";
    const wide = r >= 1 ? `${r.toFixed(2)} : 1` : `1 : ${(1 / r).toFixed(2)}`;
    let best = null, bestd = 1e9;
    for (const [a, b] of COMMON_RATIOS) {
      const d = Math.abs(r - a / b);
      if (d < bestd) { bestd = d; best = [a, b]; }
    }
    const tag = bestd < 0.04 ? `（${best[0]}:${best[1]}）` : "";
    return wide + tag;
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
      o.textContent = `${it.name}（${it.w}×${it.h} · ${ratioLabel(it.w / it.h)}）`;
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
        ratioReadout.textContent = "当前比例：" + ratioLabel(d.width / d.height) + "（拖拽实时更新）";
        return;
      }
    }
    if (state.lockRatio) {
      ratioReadout.textContent = "锁定比例：" + ratioLabel(state.lockRatio);
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
    scheduleEstimate();
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
    scheduleEstimate();
  }

  function setRatio(r) {
    if (cropper) cropper.setAspectRatio(isNaN(r) ? NaN : r);
  }

  function onRatioLockToggle() {
    if (ratioLock.checked) {
      if (state.targetW && state.targetH) {
        state.lockRatio = state.targetW / state.targetH;
      }
      setRatio(state.lockRatio || NaN);
    } else {
      state.lockRatio = null;
      setRatio(NaN);
    }
    updateRatioReadout();
    scheduleEstimate();
  }

  // 把当前面板选择应用到裁剪框（图片加载完成后调用，不重建下拉，保留用户已选规格）
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
    estimateSize();
  }

  // ---------- 上传 ----------
  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) { alert("请选择图片文件"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      cropImg.src = e.target.result;
      dropZone.style.display = "none";      // 上传后隐藏上传区
      reUpload.style.display = "inline-block";
      cropStage.style.display = "block";
      emptyHint.style.display = "none";
      if (cropper) cropper.destroy();
      cropper = new Cropper(cropImg, {
        viewMode: 1, autoCropArea: 0.85, background: true,
        responsive: true, checkOrientation: true,
        ready() { applyCurrentToCropper(); },
        crop() { updateRatioReadout(); scheduleEstimate(); }  // 拖拽时实时更新比例与大小预估
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

  // ---------- 导出参数 / 大小预估 ----------
  function currentOpts() {
    if (ratioLock.checked && state.targetW && state.targetH) {
      return {
        width: state.targetW, height: state.targetH,
        imageSmoothingEnabled: true, imageSmoothingQuality: "high"
      };
    }
    return {};  // 自由模式：按裁剪框自然尺寸输出
  }

  function computeEstimate() {
    if (!cropper) { sizeEst.textContent = "上传图片后显示"; return; }
    const canvas = cropper.getCroppedCanvas(currentOpts());
    if (!canvas) { sizeEst.textContent = "—"; return; }
    const fmt = fmtSel.value;
    const q = fmt === "image/png" ? undefined : parseFloat(quality.value);
    canvas.toBlob((blob) => {
      if (!blob) { sizeEst.textContent = "—"; return; }
      sizeEst.textContent = `${(blob.size / 1024).toFixed(0)} KB（${canvas.width}×${canvas.height}px）`;
    }, fmt, q);
  }

  function scheduleEstimate() {
    clearTimeout(estTimer);
    estTimer = setTimeout(computeEstimate, 250);
  }
  function estimateSize() { computeEstimate(); }

  // ---------- 导出 ----------
  function doExport() {
    if (!cropper) { alert("请先上传图片"); return; }
    const opts = currentOpts();
    const canvas = cropper.getCroppedCanvas(opts);
    if (!canvas) { alert("裁剪失败，请重试"); return; }
    const fmt = fmtSel.value;
    const q = fmt === "image/png" ? undefined : parseFloat(quality.value);
    const ext = fmt === "image/png" ? "png" : fmt === "image/jpeg" ? "jpg" : "webp";
    canvas.toBlob((blob) => {
      if (!blob) { alert("导出失败，浏览器可能不支持该格式"); return; }
      if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
      lastBlobUrl = URL.createObjectURL(blob);
      resultImg.src = lastBlobUrl;
      resultMeta.textContent =
        `输出 ${canvas.width}×${canvas.height}px · ${(blob.size / 1024).toFixed(0)} KB · ${fmt.split("/")[1].toUpperCase()}`;
      dlLink.href = lastBlobUrl;
      dlLink.download = `cropped-${canvas.width}x${canvas.height}.${ext}`;
      resultWrap.style.display = "block";
    }, fmt, q);
  }

  // ---------- 绑定 ----------
  function bind() {
    buildPlatformSelect();
    buildFormatSelect();

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

    qualityRow.style.display = fmtSel.value === "image/png" ? "none" : "flex";
    onPlatformChange();           // 初始化面板（通用 + 首个规格）
    updateRatioReadout();
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
