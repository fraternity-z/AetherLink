// 字体配置文件
// 整合 Google Fonts 动态加载方案

import { 
  fetchGoogleFonts, 
  loadFont as loadGoogleFont,
  getCustomFonts,
  getCustomFontFamily,
  isCustomFont,
  type GoogleFont,
  type CustomFont
} from '../services/GoogleFontsService';

// 字体分类类型
export type FontCategory = 'system' | 'custom' | 'sans-serif' | 'serif' | 'monospace' | 'monospace-cn' | 'display' | 'handwriting';

// 字体选项接口
export interface FontOption {
  id: string;
  name: string;
  description?: string;
  fontFamily: string[];
  preview: string;
  category: FontCategory;
  isGoogleFont?: boolean;
  variants?: string[];
}

// 系统默认字体（兜底）
const SYSTEM_FONT: FontOption = {
  id: 'system',
  name: '系统默认',
  description: '跟随系统字体设置，兼容性最佳',
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ],
  preview: '系统默认字体 System Font Aa字',
  category: 'system',
  isGoogleFont: false,
};

// 中文等宽字体（通过 CDN 加载）
const CHINESE_MONOSPACE_FONTS: FontOption[] = [
  {
    id: 'Sarasa Mono SC',
    name: '更纱黑体 Mono',
    description: '基于 Iosevka 和思源黑体的中文等宽字体',
    fontFamily: ['"Sarasa Mono SC"', '"Sarasa Mono"', 'monospace'],
    preview: '更纱黑体 Mono 中文等宽 Code',
    category: 'monospace-cn',
    isGoogleFont: false,
  },
  {
    id: 'LXGW WenKai Mono',
    name: '霞鹜文楷等宽',
    description: '开源中文仿宋/楷体等宽字体',
    fontFamily: ['"LXGW WenKai Mono"', '"LXGW WenKai"', 'monospace'],
    preview: '霞鹜文楷 等宽 中文 Code',
    category: 'monospace-cn',
    isGoogleFont: false,
  },
  {
    id: 'Maple Mono NF CN',
    name: 'Maple Mono 中文',
    description: '枫叶等宽字体，支持中文和 Nerd Fonts',
    fontFamily: ['"Maple Mono NF CN"', '"Maple Mono"', 'monospace'],
    preview: 'Maple Mono 枫叶等宽 Code',
    category: 'monospace-cn',
    isGoogleFont: false,
  },
  {
    id: 'Source Han Mono SC',
    name: '思源等宽',
    description: 'Adobe 与 Google 合作开发的等宽字体',
    fontFamily: ['"Source Han Mono SC"', '"Source Han Mono"', 'monospace'],
    preview: '思源等宽 中文 Code',
    category: 'monospace-cn',
    isGoogleFont: false,
  },
];

// 静态字体选项（系统字体 + 中文等宽字体）
export const staticFontOptions: FontOption[] = [SYSTEM_FONT, ...CHINESE_MONOSPACE_FONTS];

// 字体分类标签
export const fontCategoryLabels: Record<FontCategory, string> = {
  'system': '系统字体',
  'custom': '自定义字体',
  'sans-serif': '无衬线体',
  'serif': '衬线体',
  'monospace': '等宽字体',
  'monospace-cn': '中文等宽',
  'display': '展示字体',
  'handwriting': '手写体',
};

// 分类图标（可选）
export const fontCategoryIcons: Record<FontCategory, string> = {
  'system': '⚙️',
  'custom': '📁',
  'sans-serif': 'Aa',
  'serif': 'Aa',
  'monospace': '</>',
  'monospace-cn': '中',
  'display': '✨',
  'handwriting': '✍️',
};

// 默认字体ID
export const DEFAULT_FONT_ID = 'system';

/**
 * 将 Google Font 转换为 FontOption
 * 注意：使用原始字体名称作为 ID，避免大小写转换问题
 */
export function googleFontToOption(gf: GoogleFont): FontOption {
  return {
    id: gf.family, // 使用原始名称作为 ID，保持大小写
    name: gf.family,
    fontFamily: [`"${gf.family}"`, 'sans-serif'],
    preview: `${gf.family} Aa字 中文`,
    category: gf.category as FontCategory,
    isGoogleFont: true,
    variants: gf.variants,
  };
}

/**
 * 将自定义字体转换为 FontOption
 */
function customFontToOption(cf: CustomFont): FontOption {
  return {
    id: cf.id,
    name: cf.name,
    description: '本地自定义字体',
    fontFamily: [cf.fontFamily, 'sans-serif'],
    preview: `${cf.name} 自定义字体 Aa`,
    category: 'custom',
    isGoogleFont: false,
  };
}

/**
 * 获取所有字体选项（静态 + 自定义 + Google Fonts）
 */
export async function getAllFontOptions(): Promise<FontOption[]> {
  try {
    // 获取自定义字体
    const customFonts = getCustomFonts();
    const customOptions = customFonts.map(customFontToOption);
    
    // 获取 Google Fonts
    const googleFonts = await fetchGoogleFonts();
    const googleOptions = googleFonts.map(googleFontToOption);
    
    return [...staticFontOptions, ...customOptions, ...googleOptions];
  } catch (error) {
    console.error('[Fonts] 获取字体列表失败:', error);
    const customFonts = getCustomFonts();
    const customOptions = customFonts.map(customFontToOption);
    return [...staticFontOptions, ...customOptions];
  }
}

/**
 * 按分类获取字体选项
 */
export async function getFontsByCategory(category: FontCategory): Promise<FontOption[]> {
  const allFonts = await getAllFontOptions();
  return allFonts.filter(font => font.category === category);
}

/**
 * 根据ID获取字体选项
 */
export async function getFontById(id: string): Promise<FontOption | undefined> {
  if (id === 'system') return SYSTEM_FONT;
  
  const allFonts = await getAllFontOptions();
  return allFonts.find(font => font.id === id);
}

/**
 * 同步获取字体（仅静态字体，用于初始渲染）
 */
export function getFontByIdSync(id: string): FontOption | undefined {
  if (id === 'system') return SYSTEM_FONT;
  return staticFontOptions.find(font => font.id === id);
}

/**
 * 获取字体的CSS字符串
 */
export function getFontFamilyString(fontId: string): string {
  // 检查静态字体
  const font = getFontByIdSync(fontId);
  if (font) {
    return font.fontFamily.join(', ');
  }
  
  // 检查自定义字体
  if (isCustomFont(fontId)) {
    const customFamily = getCustomFontFamily(fontId);
    if (customFamily) {
      return `${customFamily}, sans-serif`;
    }
  }
  
  // 其他情况，fontId 就是 Google Font 的原始名称
  return `"${fontId}", sans-serif`;
}

/**
 * 加载字体（自动判断是否需要从 Google Fonts 加载）
 */
export async function loadFont(fontId: string): Promise<boolean> {
  if (fontId === 'system') return true;
  
  // 自定义字体已经在添加时加载，无需再次加载
  if (isCustomFont(fontId)) {
    return true;
  }
  
  // Google Font，通过 CDN 加载
  return loadGoogleFont(fontId);
}

/**
 * 搜索字体
 */
export async function searchFonts(query: string): Promise<FontOption[]> {
  const allFonts = await getAllFontOptions();
  const q = query.toLowerCase().trim();
  if (!q) return allFonts;
  return allFonts.filter(f => 
    f.name.toLowerCase().includes(q) || 
    f.id.toLowerCase().includes(q)
  );
}

/**
 * 获取热门字体
 */
export async function getPopularFonts(limit = 30): Promise<FontOption[]> {
  const allFonts = await getAllFontOptions();
  // 系统字体 + 前 N 个 Google Fonts（已按人气排序）
  return allFonts.slice(0, limit + 1);
}

// 兼容旧版：导出静态 fontOptions
export const fontOptions = staticFontOptions;
