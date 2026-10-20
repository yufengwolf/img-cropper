/* 主逻辑：上传 → 平台/规格选择 → 裁剪 → 比例/像素锁定 → 多格式导出（含大小预估） */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const fileInput  = $("#fileInput");
  const dropZone   = $("#dropZone");
  const cropImg    = $("#cropImg");
  const cropStage  = $("#cropStage");
  const platformSel= $("#platformSel");
  const presetWrap = $("#presetWrap");
  const presetSel  = $("#presetSel");
  const customHint = $("#customHint");
  const inW        = $("#inW");
  const inH        = $("#inH");
  const ratioLock  = $("#ratioLock");
  const fmtSel     = $("#fmtSel");
  const qualityRow = $("#qualityRow");
  const quality    = $("#quality");
  const qualityVal = $("#qualityVal");
  const sizeEst    = $("#sizeEst");
  const exportBtn  = $("#exportBtn");
  const resultWrap = $("#resultWrap");
  const resultImg  = $("#resultImg");
  const resultMeta = $("#resultMeta");
  const dlLink     = $("#dlLink");
  const emptyHint  = $("#emptyHint");

  let cropper = null;
  let lastBlobUrl = null;
  let estTimer = null;
  const state = { targetW: null, targetH: null };

  // ---------- 构建下拉 ----------
  function buildPlatformSelect() {
    PLATFORM_ORDER.forEach((k) => {
      const o = document.createElement("option");
      o.value = k;
      o.textContent = PRESETS[k].label;
      platformSel.appendChild(o);
    });
    const oc = document.createElement("option");
    oc.value = "custom";
    oc.textContent = "自定义（兜底）";
    platformSel.appendChild(oc);
  }

  function buildSpecSelect(platformKey) {
    presetSel.innerHTML = "";
    PRESETS[platformKey].items.forEach((it) => {
      const o = document.createElement("option");
      o.value = it.id;
      o.textContent = `${it.name} · ${it.w}×${it.h}`;
      presetSel.appendChild(o);
    });
  }

  function buildFormatSelect() {
    EXPORT_FORMATS.forEach((f) => {
      const o = document.createElement("option");
      o.value = f.value;
      o.textContent = f.label;
      fmtSel.appendChild(o);
    });
  }

  // ---------- 选择逻辑（两级） ----------
  function onPlatformChange() {
    const p = platformSel.value;
    if (p === "custom") {
      presetWrap.style.display = "none";
      customHint.style.display = "block";
      presetSel.innerHTML = "";
      ratioLock.checked = false;
      state.targetW = state.targetH = null;
      setRatio(NaN);
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
    ratioLock.checked = true;
    applyTarget(it.w, it.h);
  }

  function readCustom() {
    const w = parseInt(inW.value, 10);
    const h = parseInt(inH.value, 10);
    if (w > 0 && h > 0) {
      applyTarget(w, h);
      ratioLock.checked = true;
    } else {
      state.targetW = state.targetH = null;
      if (!ratioLock.checked) setRatio(NaN);
    }
  }

  function applyTarget(w, h) {
    state.targetW = w;
    state.targetH = h;
    if (ratioLock.checked) setRatio(w / h);
  }

  function setRatio(r) {
    if (cropper) cropper.setAspectRatio(isNaN(r) ? NaN : r);
  }

  function onCustomInput() {
    readCustom();
    scheduleEstimate();
  }

  function onRatioLockToggle() {
    if (ratioLock.checked) {
      if (state.targetW && state.targetH) setRatio(state.targetW / state.targetH);
    } else {
      setRatio(NaN);
    }
    scheduleEstimate();
  }

  // ---------- 上传 ----------
  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) { alert("请选择图片文件"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      cropImg.src = e.target.result;
      cropStage.style.display = "block";
      emptyHint.style.display = "none";
      if (cropper) cropper.destroy();
      cropper = new Cropper(cropImg, {
        viewMode: 1, autoCropArea: 0.85, background: true,
        responsive: true, checkOrientation: true,
        ready() { onPlatformChange(); estimateSize(); },
        crop() { scheduleEstimate(); }   // 拖动时实时预估（已防抖）
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
    return {};
  }

  function computeEstimate() {
    if (!cropper) { sizeEst.textContent = "上传图片后显示"; return; }
    const canvas = cropper.getCroppedCanvas(currentOpts());
    if (!canvas) { sizeEst.textContent = "—"; return; }
    const fmt = fmtSel.value;
    const q = fmt === "image/png" ? undefined : parseFloat(quality.value);
    canvas.toBlob((blob) => {
      if (!blob) { sizeEst.textContent = "—"; return; }
      sizeEst.textContent = (blob.size / 1024).toFixed(0) + " KB";
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
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag"));
    dropZone.addEventListener("drop", onDrop);

    platformSel.addEventListener("change", onPlatformChange);
    presetSel.addEventListener("change", onPresetChange);
    inW.addEventListener("input", onCustomInput);
    inH.addEventListener("input", onCustomInput);
    ratioLock.addEventListener("change", onRatioLockToggle);

    fmtSel.addEventListener("change", () => {
      qualityRow.style.display = fmtSel.value === "image/png" ? "none" : "flex";
    });
    quality.addEventListener("input", () => {
      qualityVal.textContent = Math.round(quality.value * 100) + "%";
      scheduleEstimate();
    });

    exportBtn.addEventListener("click", doExport);

    // 初始：PNG 时隐藏质量；默认通用平台 + 首个规格
    qualityRow.style.display = fmtSel.value === "image/png" ? "none" : "flex";
    onPlatformChange();
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
