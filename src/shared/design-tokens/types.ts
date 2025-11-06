/**
 * Design Tokens 类型定义
 * 
 * 这个文件定义了设计令牌系统的所有 TypeScript 类型
 */

// 主题风格类型
export type ThemeStyle = 'default' | 'claude' | 'nature' | 'tech' | 'soft' | 'ocean' | 'sunset' | 'cinnamonSlate' | 'horizonGreen' | 'cherryCoded';

// 颜色模式类型
export type ColorMode = 'light' | 'dark';

/**
 * 基础颜色令牌
 * 定义了单一颜色值
 */
export interface ColorToken {
  value: string;
  description?: string;
}

/**
 * 颜色对令牌
 * 包含亮色和暗色两种模式
 */
export interface ColorPairToken {
  light: string;
  dark: string;
  description?: string;
}

/**
 * 背景颜色令牌
 */
export interface BackgroundTokens {
  default: ColorPairToken;     // 主背景色
  paper: ColorPairToken;        // 纸张/卡片背景色
  elevated: ColorPairToken;     // 提升背景色（悬浮元素）
}

/**
 * 文字颜色令牌
 */
export interface TextTokens {
  primary: ColorPairToken;      // 主要文字颜色
  secondary: ColorPairToken;    // 次要文字颜色
  disabled: ColorPairToken;     // 禁用文字颜色
  hint: ColorPairToken;         // 提示文字颜色
}

/**
 * 边框颜色令牌
 */
export interface BorderTokens {
  default: ColorPairToken;      // 默认边框
  subtle: ColorPairToken;       // 微妙边框
  strong: ColorPairToken;       // 强调边框
  focus: ColorPairToken;        // 聚焦边框
}

/**
 * 交互状态颜色令牌
 */
export interface InteractionTokens {
  hover: ColorPairToken;        // 悬停状态
  active: ColorPairToken;       // 激活状态
  selected: ColorPairToken;     // 选中状态
  disabled: ColorPairToken;     // 禁用状态
}

/**
 * 消息气泡颜色令牌
 */
export interface MessageTokens {
  ai: {
    background: ColorPairToken;       // AI 消息背景
    backgroundActive: ColorPairToken; // AI 消息激活背景
    text: ColorPairToken;             // AI 消息文字
    border: ColorPairToken;           // AI 消息边框
  };
  user: {
    background: ColorPairToken;       // 用户消息背景
    backgroundActive: ColorPairToken; // 用户消息激活背景
    text: ColorPairToken;             // 用户消息文字
    border: ColorPairToken;           // 用户消息边框
  };
  system: {
    background: ColorPairToken;       // 系统消息背景
    text: ColorPairToken;             // 系统消息文字
    border: ColorPairToken;           // 系统消息边框
  };
}

/**
 * 按钮颜色令牌
 */
export interface ButtonTokens {
  primary: {
    background: ColorPairToken;
    text: ColorPairToken;
    border: ColorPairToken;
    hover: ColorPairToken;
  };
  secondary: {
    background: ColorPairToken;
    text: ColorPairToken;
    border: ColorPairToken;
    hover: ColorPairToken;
  };
}

/**
 * 输入框颜色令牌
 */
export interface InputTokens {
  background: ColorPairToken;
  text: ColorPairToken;
  placeholder: ColorPairToken;
  border: ColorPairToken;
  borderHover: ColorPairToken;
  borderFocus: ColorPairToken;
}

/**
 * 侧边栏颜色令牌
 */
export interface SidebarTokens {
  background: ColorPairToken;
  itemHover: ColorPairToken;
  itemSelected: ColorPairToken;
  itemSelectedHover: ColorPairToken;
  border: ColorPairToken;
}

/**
 * 图标颜色令牌
 */
export interface IconTokens {
  default: ColorPairToken;      // 默认图标颜色
  success: ColorToken;           // 成功图标颜色
  warning: ColorToken;           // 警告图标颜色
  error: ColorToken;             // 错误图标颜色
  info: ColorToken;              // 信息图标颜色
}

/**
 * 工具栏颜色令牌
 */
export interface ToolbarTokens {
  background: ColorPairToken;    // 工具栏背景
  border: ColorPairToken;        // 工具栏边框
  shadow: ColorPairToken;        // 工具栏阴影
}

/**
 * 消息块颜色令牌（ToolBlock, ThinkingBlock, CitationBlock 等）
 */
export interface MessageBlockTokens {
  background: ColorPairToken;         // 消息块背景色（极浅）
  backgroundHover: ColorPairToken;    // 消息块悬停背景色
  backgroundContent: ColorPairToken;  // 消息块内容区背景色
  backgroundHeader: ColorPairToken;   // 消息块头部背景色
  codeBackground: ColorPairToken;     // 代码/预格式化文本背景色
  scrollbarThumb: ColorPairToken;     // 滚动条颜色
  scrollbarTrack: ColorPairToken;     // 滚动条轨道颜色
}

/**
 * 主题颜色令牌集合
 * 包含一个主题的所有颜色定义
 */
export interface ThemeColorTokens {
  // 品牌颜色
  primary: ColorToken;
  secondary: ColorToken;
  accent?: ColorToken;
  
  // 语义颜色
  background: BackgroundTokens;
  text: TextTokens;
  border: BorderTokens;
  interaction: InteractionTokens;
  
  // 功能模块颜色
  message: MessageTokens;
  messageBlock: MessageBlockTokens;
  button: ButtonTokens;
  input: InputTokens;
  sidebar: SidebarTokens;
  icon: IconTokens;
  toolbar: ToolbarTokens;
  
  // 渐变
  gradients?: {
    primary: string;
    secondary?: string;
  };
}

/**
 * 设计令牌集合
 * 包含所有主题风格的颜色定义
 */
export type DesignTokens = Record<ThemeStyle, ThemeColorTokens>;

/**
 * CSS 变量名称映射
 */
export interface CSSVariableNames {
  // 品牌颜色
  primary: string;
  secondary: string;
  accent: string;
  
  // 背景
  bgDefault: string;
  bgPaper: string;
  bgElevated: string;
  
  // 文字
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textHint: string;
  
  // 边框
  borderDefault: string;
  borderSubtle: string;
  borderStrong: string;
  borderFocus: string;
  
  // 交互
  hoverBg: string;
  activeBg: string;
  selectedBg: string;
  disabledBg: string;
  
  // 消息
  msgAiBg: string;
  msgAiBgActive: string;
  msgAiText: string;
  msgAiBorder: string;
  msgUserBg: string;
  msgUserBgActive: string;
  msgUserText: string;
  msgUserBorder: string;
  msgSystemBg: string;
  msgSystemText: string;
  msgSystemBorder: string;
  
  // 按钮
  btnPrimaryBg: string;
  btnPrimaryText: string;
  btnPrimaryBorder: string;
  btnPrimaryHover: string;
  btnSecondaryBg: string;
  btnSecondaryText: string;
  btnSecondaryBorder: string;
  btnSecondaryHover: string;
  
  // 输入框
  inputBg: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  inputBorderHover: string;
  inputBorderFocus: string;
  
  // 侧边栏
  sidebarBg: string;
  sidebarItemHover: string;
  sidebarItemSelected: string;
  sidebarItemSelectedHover: string;
  sidebarBorder: string;
  
  // 图标
  iconDefault: string;
  iconSuccess: string;
  iconWarning: string;
  iconError: string;
  iconInfo: string;
  
  // 工具栏
  toolbarBg: string;
  toolbarBorder: string;
  toolbarShadow: string;
  
  // 消息块
  msgBlockBg: string;
  msgBlockBgHover: string;
  msgBlockBgContent: string;
  msgBlockBgHeader: string;
  msgBlockCodeBg: string;
  msgBlockScrollbarThumb: string;
  msgBlockScrollbarTrack: string;
  
  // 渐变
  gradientPrimary: string;
  gradientSecondary: string;
}

