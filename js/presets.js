/**
 * 平台预设规格表（两级：平台 → 规格）
 * --------------------------------------------------
 * - 每个平台 label 与每个规格 name 均为 { zh, en }，供多语言切换
 * - 每个规格：id / name / 宽(px) / 高(px) / desc（比例，仅展示用）
 * - 新增平台或规格，直接往 PRESETS 里加 group / item，UI 自动渲染（含中英文）
 * - 尺寸为各平台行业通用规范，可按实际运营经验调整
 * - 「自定义」不在此表，由 UI 中的宽高输入框兜底支持所有尺寸
 */
const PRESETS = {
  common: {
    label: { zh: "通用", en: "Common" },
    items: [
      { id: "c-1x1",  name: { zh: "1:1 方形",          en: "1:1 square" },         w: 1080, h: 1080, desc: "1:1" },
      { id: "c-4x3",  name: { zh: "4:3",               en: "4:3" },                w: 1440, h: 1080, desc: "4:3" },
      { id: "c-3x4",  name: { zh: "3:4 竖版",          en: "3:4 portrait" },       w: 1080, h: 1440, desc: "3:4" },
      { id: "c-16x9", name: { zh: "16:9 宽屏",         en: "16:9 landscape" },     w: 1920, h: 1080, desc: "16:9" },
      { id: "c-9x16", name: { zh: "9:16 全屏竖版",     en: "9:16 full portrait" }, w: 1080, h: 1920, desc: "9:16" },
      { id: "c-3x2",  name: { zh: "3:2",               en: "3:2" },                w: 1200, h: 800,  desc: "3:2" },
      { id: "c-2x3",  name: { zh: "2:3 竖版",          en: "2:3 portrait" },       w: 800,  h: 1200, desc: "2:3" },
      { id: "c-5x4",  name: { zh: "5:4",               en: "5:4" },                w: 500,  h: 400,  desc: "5:4" },
      { id: "c-4x5",  name: { zh: "4:5 竖版",          en: "4:5 portrait" },       w: 1080, h: 1350, desc: "4:5" },
      { id: "c-2x1",  name: { zh: "2:1 横幅",          en: "2:1 banner" },         w: 1200, h: 600,  desc: "2:1" },
      { id: "c-1x2",  name: { zh: "1:2 竖幅",          en: "1:2 strip" },          w: 540,  h: 1080, desc: "1:2" },
      { id: "c-avatar", name: { zh: "正方形头像",       en: "Square avatar" },       w: 500,  h: 500,  desc: "1:1" }
    ]
  },
  wechat: {
    label: { zh: "微信", en: "WeChat" },
    items: [
      { id: "wx-cover",   name: { zh: "公众号封面大图（详情页）", en: "Official Account cover (article)" },     w: 900,  h: 383,  desc: "2.35:1" },
      { id: "wx-square",  name: { zh: "公众号封面方形（列表）",   en: "Official Account square (feed)" },       w: 1080, h: 1080, desc: "1:1" },
      { id: "wx-share",   name: { zh: "分享 / 朋友圈海报",        en: "Share / Moments poster" },              w: 1080, h: 1920, desc: "9:16" },
      { id: "wx-h",       name: { zh: "正文横屏配图",            en: "In-article landscape" },                 w: 1080, h: 607,  desc: "16:9" },
      { id: "wx-v",       name: { zh: "正文竖屏配图",            en: "In-article portrait" },                  w: 1080, h: 1440, desc: "3:4" },
      { id: "wx-avatar",  name: { zh: "公众号头像",              en: "Official Account avatar" },              w: 300,  h: 300,  desc: "1:1" },
      { id: "wx-qrcode",  name: { zh: "文中二维码 / 引导图",      en: "QR code / guide image" },                w: 1080, h: 1080, desc: "1:1" }
    ]
  },
  weapp: {
    label: { zh: "微信小程序", en: "WeChat Mini Program" },
    items: [
      { id: "wa-share",    name: { zh: "分享图片（卡片）",        en: "Share card" },                w: 500,  h: 400,  desc: "5:4" },
      { id: "wa-promo-h",  name: { zh: "详细推广图（横版）",      en: "Promo (landscape)" },         w: 1200, h: 800,  desc: "3:2" },
      { id: "wa-promo-v",  name: { zh: "详细推广图（竖版）",      en: "Promo (portrait)" },          w: 750,  h: 1334, desc: "9:16" },
      { id: "wa-cover",    name: { zh: "通用素材封面",            en: "Generic cover" },             w: 800,  h: 800,  desc: "1:1" },
      { id: "wa-icon",     name: { zh: "小程序图标",              en: "App icon" },                  w: 144,  h: 144,  desc: "PNG 1:1" },
      { id: "wa-code",     name: { zh: "小程序码 / 二维码",        en: "Mini Program code" },         w: 430,  h: 430,  desc: "1:1" }
    ]
  },
  xhs: {
    label: { zh: "小红书", en: "Xiaohongshu (RED)" },
    items: [
      { id: "xhs-v",  name: { zh: "竖版封面（推荐）", en: "Portrait cover (recommended)" }, w: 1242, h: 1660, desc: "3:4" },
      { id: "xhs-sq", name: { zh: "正方形",          en: "Square" },                      w: 1080, h: 1080, desc: "1:1" },
      { id: "xhs-h",  name: { zh: "横版",            en: "Landscape" },                    w: 1440, h: 1080, desc: "4:3" }
    ]
  },
  douyin: {
    label: { zh: "抖音 / 视频号", en: "Douyin / Video Account" },
    items: [
      { id: "dy-v", name: { zh: "竖屏封面", en: "Portrait cover" },   w: 1080, h: 1920, desc: "9:16" },
      { id: "dy-h", name: { zh: "横屏封面", en: "Landscape cover" }, w: 1920, h: 1080, desc: "16:9" }
    ]
  },
  weibo: {
    label: { zh: "微博", en: "Weibo" },
    items: [
      { id: "wb-cover", name: { zh: "主页封面",   en: "Profile banner" }, w: 920,  h: 300,  desc: "≈3:1" },
      { id: "wb-h",     name: { zh: "微博配图横版", en: "Landscape post" }, w: 1080, h: 607,  desc: "16:9" },
      { id: "wb-sq",    name: { zh: "九宫格方图",  en: "Square (grid)" },  w: 1080, h: 1080, desc: "1:1" }
    ]
  },
  bili: {
    label: { zh: "哔哩哔哩", en: "Bilibili" },
    items: [
      { id: "bili-cover", name: { zh: "视频封面",   en: "Video thumbnail" }, w: 1146, h: 717,  desc: "16:10" },
      { id: "bili-h",     name: { zh: "动态配图横版", en: "Dynamic post (landscape)" }, w: 1080, h: 607,  desc: "16:9" },
      { id: "bili-head",  name: { zh: "专栏头图",   en: "Column header" },  w: 1125, h: 375,  desc: "3:1" }
    ]
  },
  youtube: {
    label: { zh: "YouTube", en: "YouTube" },
    items: [
      { id: "yt-banner",   name: { zh: "频道封面（频道艺术）", en: "Channel art / banner" }, w: 2560, h: 1440, desc: "16:9" },
      { id: "yt-thumb",    name: { zh: "视频缩略图",          en: "Video thumbnail" },      w: 1280, h: 720,  desc: "16:9" },
      { id: "yt-shorts",   name: { zh: "Shorts（竖版）",       en: "Shorts (portrait)" },    w: 1080, h: 1920, desc: "9:16" },
      { id: "yt-community",name: { zh: "社区帖子图片",          en: "Community post" },       w: 1080, h: 1080, desc: "1:1" },
      { id: "yt-icon",     name: { zh: "频道头像",            en: "Channel icon" },         w: 800,  h: 800,  desc: "1:1" }
    ]
  },
  instagram: {
    label: { zh: "Instagram", en: "Instagram" },
    items: [
      { id: "ig-square",  name: { zh: "方形帖子",        en: "Square post" },             w: 1080, h: 1080, desc: "1:1" },
      { id: "ig-portrait",name: { zh: "竖版帖子（推荐）", en: "Portrait post (recommended)" }, w: 1080, h: 1350, desc: "4:5" },
      { id: "ig-landscape",name:{ zh: "横版帖子",        en: "Landscape post" },          w: 1080, h: 566,  desc: "1.91:1" },
      { id: "ig-story",   name: { zh: "Story / Reels",   en: "Story / Reels" },            w: 1080, h: 1920, desc: "9:16" }
    ]
  },
  facebook: {
    label: { zh: "Facebook", en: "Facebook" },
    items: [
      { id: "fb-cover",  name: { zh: "主页封面",     en: "Page cover" },          w: 820,  h: 312,  desc: "2.63:1" },
      { id: "fb-profile",name: { zh: "头像",         en: "Profile picture" },     w: 500,  h: 500,  desc: "1:1" },
      { id: "fb-post",   name: { zh: "配图 / 链接分享", en: "Shared image / link" }, w: 1200, h: 630,  desc: "1.91:1" },
      { id: "fb-story",  name: { zh: "Story",        en: "Story" },               w: 1080, h: 1920, desc: "9:16" }
    ]
  },
  twitter: {
    label: { zh: "X（Twitter）", en: "X (Twitter)" },
    items: [
      { id: "tw-header", name: { zh: "主页头图",   en: "Header photo" },   w: 1500, h: 500,  desc: "3:1" },
      { id: "tw-profile",name: { zh: "头像",       en: "Profile photo" }, w: 400,  h: 400,  desc: "1:1" },
      { id: "tw-post",   name: { zh: "推文配图",   en: "In-stream image" }, w: 1200, h: 675,  desc: "16:9" }
    ]
  },
  linkedin: {
    label: { zh: "LinkedIn", en: "LinkedIn" },
    items: [
      { id: "li-banner",  name: { zh: "个人主页横幅", en: "Profile banner" }, w: 1584, h: 396,  desc: "4:1" },
      { id: "li-profile", name: { zh: "头像",       en: "Profile photo" },  w: 400,  h: 400,  desc: "1:1" },
      { id: "li-post",    name: { zh: "动态配图",   en: "Shared image" },   w: 1200, h: 1200, desc: "1:1" }
    ]
  },
  pinterest: {
    label: { zh: "Pinterest", en: "Pinterest" },
    items: [
      { id: "pin-square",  name: { zh: "方形 Pin",        en: "Square pin" },          w: 1000, h: 1000, desc: "1:1" },
      { id: "pin-vertical",name: { zh: "竖版 Pin（推荐）", en: "Vertical pin (recommended)" }, w: 1000, h: 1500, desc: "2:3" },
      { id: "pin-story",   name: { zh: "Story Pin",       en: "Story pin" },           w: 1080, h: 1920, desc: "9:16" }
    ]
  },
  tiktok: {
    label: { zh: "TikTok", en: "TikTok" },
    items: [
      { id: "tk-cover",   name: { zh: "视频封面",   en: "Video cover" },    w: 1080, h: 1920, desc: "9:16" },
      { id: "tk-profile", name: { zh: "头像",       en: "Profile photo" }, w: 1080, h: 1080, desc: "1:1" }
    ]
  }
};

// 平台顺序（决定下拉排列）
const PLATFORM_ORDER = [
  "common", "wechat", "weapp", "xhs", "douyin", "weibo", "bili",
  "youtube", "instagram", "facebook", "twitter", "linkedin", "pinterest", "tiktok"
];

// 扁平化查找表：id → 规格对象（含其所属平台键，便于国际化取平台名）
const PRESET_MAP = {};
PLATFORM_ORDER.forEach((k) => {
  PRESETS[k].items.forEach((it) => { PRESET_MAP[it.id] = Object.assign({ _platform: k }, it); });
});

// 尺寸速查表数据源：[平台键, 规格 id]（JS 按语言渲染，自动覆盖国内外平台）
const SPEC_ROWS = [
  ["wechat", "wx-cover"], ["wechat", "wx-square"], ["wechat", "wx-share"],
  ["weapp", "wa-share"], ["xhs", "xhs-v"], ["xhs", "xhs-sq"],
  ["douyin", "dy-v"], ["weibo", "wb-cover"], ["bili", "bili-cover"],
  ["youtube", "yt-banner"], ["youtube", "yt-thumb"], ["youtube", "yt-shorts"],
  ["instagram", "ig-square"], ["instagram", "ig-portrait"], ["instagram", "ig-story"],
  ["facebook", "fb-cover"], ["facebook", "fb-post"],
  ["twitter", "tw-header"], ["twitter", "tw-post"],
  ["linkedin", "li-banner"], ["pinterest", "pin-vertical"], ["tiktok", "tk-cover"]
];

// 导出格式（label 走 i18n）
const EXPORT_FORMATS = [
  { value: "image/png",  labelKey: "fmt_png" },
  { value: "image/jpeg", labelKey: "fmt_jpeg" },
  { value: "image/webp", labelKey: "fmt_webp" }
];
