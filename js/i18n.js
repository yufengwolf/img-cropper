/**
 * 多语言词典（中文 / 英文）
 * --------------------------------------------------
 * 用法：t("key") 返回当前语言的文案；缺失时回退中文。
 * 带占位符的串（如 %Y、%s）由调用方用 .replace 填充。
 * 语言持久化在 localStorage；首次访问按浏览器语言自动选（中文浏览器→中文，其余→英文）。
 */
const I18N = {
  meta_title: {
    zh: "多平台配图裁剪工具 | 公众号/小程序/小红书/抖音封面配图在线裁剪",
    en: "Free Online Image Cropper — Covers for WeChat, YouTube, Instagram & more"
  },
  meta_desc: {
    zh: "免费在线图片裁剪工具，覆盖微信、微信小程序、小红书、抖音/视频号、微博、哔哩哔哩等平台。内置封面图、分享图、推广图、竖屏/横屏配图预设尺寸，支持按比例或自定义像素裁剪，导出 PNG / JPEG / WebP。图片全程在本地浏览器处理，不上传服务器，安全隐私。",
    en: "Free online image cropper for WeChat, Xiaohongshu, Douyin, YouTube, Instagram, Facebook and more. Pick a preset size, crop by ratio or exact pixels, export PNG/JPEG/WebP. Everything runs in your browser — nothing is uploaded."
  },
  tagline: {
    zh: "公众号 · 小程序 · 小红书 · 抖音 等平台封面/配图，一键按比例或像素裁剪导出",
    en: "Cover & post images for WeChat, Xiaohongshu, Douyin, YouTube, Instagram… crop & export in one click"
  },
  meta_title_short: {
    zh: "多平台配图裁剪工具",
    en: "Online Image Cropper"
  },

  panel_preset: { zh: "① 选择平台与规格", en: "① Platform & size" },
  platform_label: { zh: "平台", en: "Platform" },
  preset_label: { zh: "规格（决定裁剪比例）", en: "Size (sets crop ratio)" },
  custom_opt: { zh: "自定义（兜底 / 自由裁剪）", en: "Custom (free crop)" },
  custom_hint: {
    zh: "自由裁剪模式：可手动输入宽高（自动按比例锁定），也可直接拖拽图片选择区域，下方实时显示当前比例。",
    en: "Free crop: enter width/height (ratio auto-locks) or drag on the image; the current ratio shows below."
  },
  outsize_title: { zh: "输出尺寸（像素，可自定义）", en: "Output size (px, customizable)" },
  outsize_tip: {
    zh: "比例由上方规格锁定；此处仅调整最终导出像素，例如同为 1:1 可设为 1080×1080 或 540×540。",
    en: "Ratio is locked by the size above; here only the export resolution changes, e.g. 1:1 can be 1080×1080 or 540×540."
  },
  width_label: { zh: "宽 (px)", en: "Width (px)" },
  height_label: { zh: "高 (px)", en: "Height (px)" },
  ratio_lock_label: { zh: "锁定比例（取消可自由裁剪）", en: "Lock ratio (uncheck for free crop)" },
  ratio_none: { zh: "当前比例：—", en: "Ratio: —" },
  ratio_free: { zh: "当前比例：自由裁剪（拖拽实时更新）", en: "Ratio: free crop (updates live)" },
  ratio_live: { zh: "当前比例", en: "Ratio" },
  ratio_lock_prefix: { zh: "锁定比例", en: "Locked" },
  live_update: { zh: "拖拽实时更新", en: "updates live" },

  panel_export: { zh: "② 导出设置", en: "② Export" },
  fmt_label: { zh: "格式", en: "Format" },
  fmt_png: { zh: "PNG（无损 / 支持透明）", en: "PNG (lossless / transparent)" },
  fmt_jpeg: { zh: "JPEG（体积小 / 照片）", en: "JPEG (small / photos)" },
  fmt_webp: { zh: "WebP（现代 / 高压缩）", en: "WebP (modern / compact)" },
  quality_label: { zh: "质量", en: "Quality" },
  size_est_label: { zh: "预计导出大小：", en: "Estimated size: " },
  export_btn: { zh: "裁剪并导出", en: "Crop & export" },

  panel_text: { zh: "③ 文字图层", en: "③ Text layers" },
  add_layer: { zh: "+ 添加文字", en: "+ Add text" },
  save_tpl: { zh: "保存模板", en: "Save template" },
  tpl_placeholder: { zh: "— 套用模板 —", en: "— Apply template —" },
  tpl_builtin: { zh: "内置：", en: "Built-in: " },
  tpl_mine: { zh: "我的：", en: "Mine: " },
  layer_text_label: { zh: "文字内容（支持换行）", en: "Text (multiline)" },
  font_label: { zh: "字号", en: "Font size" },
  color_label: { zh: "颜色", en: "Color" },
  align_label: { zh: "对齐", en: "Align" },
  align_left: { zh: "左", en: "Left" },
  align_center: { zh: "居中", en: "Center" },
  align_right: { zh: "右", en: "Right" },
  opacity_label: { zh: "透明度", en: "Opacity" },
  rotation_label: { zh: "旋转", en: "Rotation" },
  boxw_label: { zh: "换行宽", en: "Wrap width" },
  bold_label: { zh: "加粗", en: "Bold" },
  bg_label: { zh: "半透明底条", en: "Backing bar" },
  bg_color_label: { zh: "底条色", en: "Bar color" },
  bg_opacity_label: { zh: "底条透明度", en: "Bar opacity" },
  tiled_label: { zh: "平铺水印", en: "Tiled watermark" },
  layer_empty: { zh: "暂无文字图层，点「+ 添加文字」", en: "No text layer yet — click “+ Add text”" },

  reupload: { zh: "↺ 重新上传图片", en: "↺ Re-upload" },
  drop_title: { zh: "点击或拖拽图片到此处上传", en: "Click or drop an image here" },
  drop_sub: { zh: "支持 JPG / PNG / WebP / GIF 等常见格式", en: "JPG / PNG / WebP / GIF supported" },
  cell_cap_crop: { zh: "图片处理", en: "Image" },
  crop_tip: { zh: "拖动图片移动 · 双指缩放 · 拉四角调整裁剪框", en: "Drag to move · pinch to zoom · drag corners to resize" },
  cell_cap_text: { zh: "文字预览（可直接拖拽文字框定位）", en: "Text preview (drag to position)" },
  tp_empty: { zh: "上传图片并添加文字后<br />这里实时显示合成预览", en: "Preview shows here after you<br />upload and add text" },
  dl_text: { zh: "⬇ 下载图片", en: "⬇ Download" },
  dl_text_with: { zh: "⬇ 下载图片（%s）", en: "⬇ Download (%s)" },

  features_h2: { zh: "为什么用这个工具？", en: "Why this tool?" },
  f1_t: { zh: "🎯 多平台预设尺寸", en: "🎯 Multi-platform presets" },
  f1_p: {
    zh: "覆盖微信、微信小程序、小红书、抖音/视频号、微博、B站，以及 YouTube、Instagram、Facebook 等的封面、分享图、推广图、竖屏/横屏配图，选完直接裁。",
    en: "Covers, share & promo images, portrait/landscape for WeChat, Mini Program, Xiaohongshu, Douyin, Weibo, Bilibili, YouTube, Instagram, Facebook and more — pick and crop."
  },
  f2_t: { zh: "🔒 本地处理，隐私安全", en: "🔒 Private, local processing" },
  f2_p: {
    zh: "所有图片仅在你的浏览器内用 Canvas 处理，不会上传到任何服务器，素材不外泄。",
    en: "Everything runs in your browser via Canvas — nothing is uploaded, your images stay private."
  },
  f3_t: { zh: "📐 比例 / 像素双模式", en: "📐 Ratio & pixel modes" },
  f3_p: {
    zh: "既能按常用比例一键锁定，也能输入精确的像素宽高，输出严格等于目标尺寸；自定义兜底支持任意尺寸。",
    en: "Lock common ratios in one tap, or enter exact pixel dimensions; custom mode supports any size."
  },
  f4_t: { zh: "📦 多格式 + 大小预估", en: "📦 Formats & size estimate" },
  f4_p: {
    zh: "支持 PNG（无损/透明）、JPEG、WebP，并实时预估导出文件大小，清晰与体积一目了然。",
    en: "PNG (lossless/transparent), JPEG, WebP, with a live file-size estimate."
  },
  f5_t: { zh: "📱 持续扩展", en: "📱 Easily extended" },
  f5_p: {
    zh: "平台与规格以数据表维护，新增平台或尺寸只需改一处，后续可持续扩展。",
    en: "Platforms and sizes live in a data table — add a new one in a single place."
  },
  f6_t: { zh: "⚡ 纯静态，秒开", en: "⚡ Static & instant" },
  f6_p: {
    zh: "无后端、无数据库，部署在 CDN 边缘，打开即用，手机电脑都适配。",
    en: "No backend, no database, served from the CDN edge — instant load on mobile and desktop."
  },

  spec_h2: { zh: "常见尺寸速查", en: "Common sizes at a glance" },
  spec_th_platform: { zh: "平台", en: "Platform" },
  spec_th_use: { zh: "用途", en: "Use" },
  spec_th_size: { zh: "尺寸", en: "Size" },
  spec_th_ratio: { zh: "比例", en: "Ratio" },

  footer: { zh: "本地图片处理工具 · 图片不上传服务器 · © %Y img-cropper", en: "Local image tool · nothing uploaded · © %Y img-cropper" },

  lang_switch_label: { zh: "语言", en: "Language" }
};

(function () {
  const KEY = "imgcropper_lang";
  let _lang = null;
  try { _lang = localStorage.getItem(KEY); } catch (e) {}
  if (!_lang) {
    const nav = (navigator.language || "zh").toLowerCase();
    _lang = nav.startsWith("zh") ? "zh" : "en";
  }

  window.getLang = function () { return _lang; };
  window.setLang = function (l) {
    _lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
  };
  window.t = function (k) {
    const d = I18N[k];
    if (!d) return k;
    return d[_lang] || d.zh || k;
  };
  // 取平台/规格在当前语言下的名称
  window.tName = function (obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[_lang] || obj.zh || "";
  };
})();
