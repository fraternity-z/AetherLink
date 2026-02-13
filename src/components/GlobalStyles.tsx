import React from 'react';
import { Global, css } from '@emotion/react';

interface GlobalStylesProps {
  fontSize: number;
  theme: any;
}

const GlobalStyles: React.FC<GlobalStylesProps> = ({ fontSize, theme }) => {
  const globalStyles = css`
    :root {
      --global-font-size: ${fontSize}px;
      --global-font-scale: ${fontSize / 16};
      --global-font-family: ${theme.typography.fontFamily};
      /* 主题颜色变量已通过 applyCSSVariables() 注入，不再重复定义 */
      
      /* ============================================
         统一安全区域变量 - 全局使用
         ============================================ */
      /* 原生安全区域（浏览器 env() 变量） */
      --safe-area-top: env(safe-area-inset-top, 0px);
      --safe-area-right: env(safe-area-inset-right, 0px);
      --safe-area-bottom: env(safe-area-inset-bottom, 0px);
      --safe-area-left: env(safe-area-inset-left, 0px);
      
      /* 统一的最小底部安全区域值（默认0，由 SafeAreaService 根据平台动态设置） */
      --safe-area-bottom-min: 0px;
      
      /* 计算后的底部安全区域（所有页面统一使用，由 SafeAreaService 动态设置） */
      --safe-area-bottom-computed: env(safe-area-inset-bottom, 0px);
      
      /* 内容区域底部 padding（设置页面统一使用，由 SafeAreaService 动态设置） */
      --content-bottom-padding: 16px;
      
      /* ============================================
         统一工具栏和内容区域间距变量
         ============================================ */
      /* 工具栏高度（与 themes.ts 中 MuiToolbar 配置保持一致） */
      --toolbar-height: 56px;
      
      /* 内容区域顶部间距（工具栏高度 + 额外间距） */
      --content-top-spacing: calc(var(--toolbar-height) + 16px);
      
      /* ============================================
         Tauri 桌面端标题栏高度
         ============================================ */
      --titlebar-height: 0px;
    }
    
    /* Tauri 环境下设置标题栏高度，并给 body 添加顶部 padding */
    body[data-tauri="true"] {
      --titlebar-height: 44px;
      padding-top: var(--titlebar-height);
      box-sizing: border-box;
    }

    body {
      font-size: var(--global-font-size) !important;
      font-family: var(--global-font-family) !important;
      /* 背景色使用 CSS Variable，已在 useTheme 中注入 */
      background-color: var(--theme-bg-default) !important;
    }

    /* 强制应用主题背景色到根容器 */
    #root {
      background-color: var(--theme-bg-default) !important;
    }

    /* 全局字体设置 - 排除数学公式元素 */
    *:not(.katex):not(.katex *):not(mjx-container):not(mjx-container *) {
      font-family: var(--global-font-family) !important;
    }

    /* 聊天消息字体 */
    .message-content {
      font-size: var(--global-font-size) !important;
      font-family: var(--global-font-family) !important;
    }

    /* 代码块字体 */
    .code-block {
      font-size: calc(var(--global-font-size) * 0.875) !important;
      /* 代码块保持等宽字体 */
    }

    /* 输入框字体 */
    .chat-input {
      font-size: var(--global-font-size) !important;
      font-family: var(--global-font-family) !important;
    }

    /* 按钮字体 */
    .MuiButton-root {
      font-size: calc(var(--global-font-size) * 0.875) !important;
      font-family: var(--global-font-family) !important;
    }

    /* 表单控件字体 */
    .MuiFormControl-root .MuiInputBase-input {
      font-size: var(--global-font-size) !important;
      font-family: var(--global-font-family) !important;
    }

    /* 菜单项字体 */
    .MuiMenuItem-root {
      font-size: var(--global-font-size) !important;
      font-family: var(--global-font-family) !important;
    }

    /* 工具提示字体 */
    .MuiTooltip-tooltip {
      font-size: calc(var(--global-font-size) * 0.75) !important;
      font-family: var(--global-font-family) !important;
    }

    /* 隐藏滚动条样式 - 无感滑动 */
    .hide-scrollbar {
      /* Firefox */
      scrollbar-width: none;
      /* IE/Edge */
      -ms-overflow-style: none;
    }

    /* WebKit浏览器 (Chrome, Safari, Opera) */
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }

    /* 防止 placeholder 文字被选择和复制 */
    textarea::placeholder,
    input::placeholder {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      pointer-events: none !important;
    }

    /* 防止通过特殊方式复制 placeholder */
    textarea::-webkit-input-placeholder,
    input::-webkit-input-placeholder {
      user-select: none !important;
      -webkit-user-select: none !important;
      pointer-events: none !important;
    }

    textarea::-moz-placeholder,
    input::-moz-placeholder {
      user-select: none !important;
      -moz-user-select: none !important;
      pointer-events: none !important;
    }

    textarea:-ms-input-placeholder,
    input:-ms-input-placeholder {
      user-select: none !important;
      -ms-user-select: none !important;
      pointer-events: none !important;
    }
  `;

  return <Global styles={globalStyles} />;
};

export default GlobalStyles;
