/**
 * 平台预设规格表（两级：平台 → 规格）
 * --------------------------------------------------
 * 每个规格：id / name / 宽(px) / 高(px) / 说明
 * 新增平台或规格，直接往 PRESETS 里加 group / item，UI 自动渲染。
 * 尺寸为各平台行业通用规范，可按实际运营经验调整。
 * 「自定义」不在此表，由 UI 中的宽高输入框兜底支持所有尺寸。
 */
const PRESETS = {
  common: {
    label: "通用",
    items: [
      { id: "c-1x1",  name: "1:1 方形",          w: 1080, h: 1080, desc: "社交头像 / 方图" },
      { id: "c-4x3",  name: "4:3",               w: 1440, h: 1080, desc: "传统屏幕" },
      { id: "c-3x4",  name: "3:4 竖版",          w: 1080, h: 1440, desc: "竖屏主流" },
      { id: "c-16x9", name: "16:9 宽屏",         w: 1920, h: 1080, desc: "横屏 / 博客头图" },
      { id: "c-9x16", name: "9:16 全屏竖版",     w: 1080, h: 1920, desc: "故事 / 海报" },
      { id: "c-3x2",  name: "3:2",               w: 1200, h: 800,  desc: "单反常用" },
      { id: "c-2x3",  name: "2:3 竖版",          w: 800,  h: 1200, desc: "竖版照片" },
      { id: "c-5x4",  name: "5:4",               w: 500,  h: 400,  desc: "分享卡片" },
      { id: "c-4x5",  name: "4:5 竖版",          w: 1080, h: 1350, desc: "Ins 竖图" },
      { id: "c-2x1",  name: "2:1 横幅",          w: 1200, h: 600,  desc: "Banner" },
      { id: "c-1x2",  name: "1:2 竖幅",          w: 540,  h: 1080, desc: "窄竖条" },
      { id: "c-avatar", name: "正方形头像",       w: 500,  h: 500,  desc: "各类头像" }
    ]
  },
  wechat: {
    label: "微信",
    items: [
      { id: "wx-cover",   name: "公众号封面大图（详情页）", w: 900,  h: 383,  desc: "2.35:1" },
      { id: "wx-square",  name: "公众号封面方形（列表）",   w: 1080, h: 1080, desc: "1:1" },
      { id: "wx-share",   name: "分享 / 朋友圈海报",        w: 1080, h: 1920, desc: "9:16 竖版" },
      { id: "wx-h",       name: "正文横屏配图",            w: 1080, h: 607,  desc: "16:9" },
      { id: "wx-v",       name: "正文竖屏配图",            w: 1080, h: 1440, desc: "3:4" },
      { id: "wx-avatar",  name: "公众号头像",              w: 300,  h: 300,  desc: "1:1" },
      { id: "wx-qrcode",  name: "文中二维码 / 引导图",      w: 1080, h: 1080, desc: "1:1" }
    ]
  },
  weapp: {
    label: "微信小程序",
    items: [
      { id: "wa-share",    name: "分享图片（卡片）",        w: 500,  h: 400,  desc: "5:4 官方推荐" },
      { id: "wa-promo-h",  name: "详细推广图（横版）",      w: 1200, h: 800,  desc: "3:2" },
      { id: "wa-promo-v",  name: "详细推广图（竖版）",      w: 750,  h: 1334, desc: "9:16" },
      { id: "wa-cover",    name: "通用素材封面",            w: 800,  h: 800,  desc: "1:1" },
      { id: "wa-icon",     name: "小程序图标",              w: 144,  h: 144,  desc: "PNG 1:1" },
      { id: "wa-code",     name: "小程序码 / 二维码",        w: 430,  h: 430,  desc: "1:1" }
    ]
  },
  xhs: {
    label: "小红书",
    items: [
      { id: "xhs-v",  name: "竖版封面（推荐）", w: 1242, h: 1660, desc: "3:4，流量最好" },
      { id: "xhs-sq", name: "正方形",          w: 1080, h: 1080, desc: "1:1" },
      { id: "xhs-h",  name: "横版",            w: 1440, h: 1080, desc: "4:3" }
    ]
  },
  douyin: {
    label: "抖音 / 视频号",
    items: [
      { id: "dy-v", name: "竖屏封面", w: 1080, h: 1920, desc: "9:16" },
      { id: "dy-h", name: "横屏封面", w: 1920, h: 1080, desc: "16:9" }
    ]
  },
  weibo: {
    label: "微博",
    items: [
      { id: "wb-cover", name: "主页封面",   w: 920,  h: 300,  desc: "约 3:1" },
      { id: "wb-h",     name: "微博配图横版", w: 1080, h: 607,  desc: "16:9" },
      { id: "wb-sq",    name: "九宫格方图",  w: 1080, h: 1080, desc: "1:1" }
    ]
  },
  bili: {
    label: "哔哩哔哩",
    items: [
      { id: "bili-cover", name: "视频封面",   w: 1146, h: 717,  desc: "16:10" },
      { id: "bili-h",     name: "动态配图横版", w: 1080, h: 607,  desc: "16:9" },
      { id: "bili-head",  name: "专栏头图",   w: 1125, h: 375,  desc: "3:1" }
    ]
  }
};

// 平台顺序（决定下拉排列）
const PLATFORM_ORDER = ["common", "wechat", "weapp", "xhs", "douyin", "weibo", "bili"];

// 扁平化查找表
const PRESET_MAP = {};
PLATFORM_ORDER.forEach((k) => {
  PRESETS[k].items.forEach((it) => { PRESET_MAP[it.id] = it; });
});

// 导出格式
const EXPORT_FORMATS = [
  { value: "image/png",  label: "PNG（无损 / 支持透明）" },
  { value: "image/jpeg", label: "JPEG（体积小 / 照片）" },
  { value: "image/webp", label: "WebP（现代 / 高压缩）" }
];
