import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { ThemeStyle } from '../config/themes';
import { getCSSVariable } from './cssVariables';

/**
 * 主题工具函数
 * 
 * 这个文件提供了主题相关的工具函数，主要功能是：
 * 1. 从 CSS Variables 读取颜色值
 * 2. 提供回退机制（fallback）以确保在 CSS Variables 未正确注入时也能正常工作
 * 
 * **注意：**
 * - 优先推荐组件直接使用 CSS Variables (如 var(--primary))
 * - 这里的函数主要用于需要在 JavaScript 中访问颜色值的特殊场景
 * - 回退逻辑（switch-case）是安全措施，确保在 CSS Variables 注入失败时有默认值
 * 
 * **迁移状态：**
 * - ✅ 组件层已完全迁移到 CSS Variables
 * - ✅ getThemeColors 保留用于特殊场景和服务层
 * - ✅ 所有颜色值优先从 CSS Variables 读取
 */

/**
 * 从 CSS Variables 获取基础颜色
 * 优先使用 CSS Variables，如果不存在则回退到 theme.palette
 */
const getBaseColorsFromCSSVars = (theme: Theme) => {
  // 尝试从 CSS Variables 读取
  const cssVarPrimary = getCSSVariable('primary');
  const cssVarSecondary = getCSSVariable('secondary');
  const cssVarBgDefault = getCSSVariable('bg-default');
  const cssVarBgPaper = getCSSVariable('bg-paper');
  const cssVarTextPrimary = getCSSVariable('text-primary');
  const cssVarTextSecondary = getCSSVariable('text-secondary');
  const cssVarBorderDefault = getCSSVariable('border-default');
  
  return {
    primary: cssVarPrimary || theme.palette.primary.main,
    secondary: cssVarSecondary || theme.palette.secondary.main,
    background: cssVarBgDefault || theme.palette.background.default,
    paper: cssVarBgPaper || theme.palette.background.paper,
    textPrimary: cssVarTextPrimary || theme.palette.text.primary,
    textSecondary: cssVarTextSecondary || theme.palette.text.secondary,
    divider: cssVarBorderDefault || theme.palette.divider,
  };
};

/**
 * 从 CSS Variables 获取按钮颜色
 * 优先使用 CSS Variables，如果不存在则回退到硬编码的颜色值
 */
const getButtonColorsFromCSSVars = (theme: Theme, themeStyle?: ThemeStyle) => {
  // 从 CSS Variables 读取
  const cssVarBtnPrimaryBg = getCSSVariable('btn-primary-bg');
  const cssVarBtnSecondaryBg = getCSSVariable('btn-secondary-bg');
  
  // 回退颜色值（如果 CSS Variables 不存在）
  const getButtonPrimaryFallback = () => {
    switch (themeStyle) {
      case 'claude': return '#D97706';
      case 'nature': return '#2D5016';
      case 'tech': return '#3B82F6';
      case 'soft': return '#EC4899';
      case 'ocean': return '#0EA5E9';
      case 'sunset': return '#F97316';
      default: return theme.palette.primary.main;
    }
  };
  
  const getButtonSecondaryFallback = () => {
    switch (themeStyle) {
      case 'claude': return '#059669';
      case 'nature': return '#8B7355';
      case 'tech': return '#8B5CF6';
      case 'soft': return '#14B8A6';
      case 'ocean': return '#06B6D4';
      case 'sunset': return '#FB923C';
      default: return theme.palette.secondary.main;
    }
  };
  
  return {
    buttonPrimary: cssVarBtnPrimaryBg || getButtonPrimaryFallback(),
    buttonSecondary: cssVarBtnSecondaryBg || getButtonSecondaryFallback(),
  };
};

/**
 * 从 CSS Variables 获取交互状态颜色
 * 优先使用 CSS Variables，如果不存在则回退到计算的颜色值
 */
const getInteractionColorsFromCSSVars = (theme: Theme, themeStyle?: ThemeStyle) => {
  const isDark = theme.palette.mode === 'dark';
  
  // 从 CSS Variables 读取
  const cssVarHoverBg = getCSSVariable('hover-bg');
  const cssVarSelectedBg = getCSSVariable('selected-bg');
  const cssVarBorderDefault = getCSSVariable('border-default');
  
  // 回退颜色值（如果 CSS Variables 不存在）
  const getHoverColorFallback = () => {
    switch (themeStyle) {
      case 'claude':
        return isDark ? alpha('#D97706', 0.12) : alpha('#D97706', 0.08);
      case 'nature':
        return isDark ? alpha('#2D5016', 0.12) : alpha('#2D5016', 0.08);
      case 'tech':
        return isDark ? alpha('#3B82F6', 0.12) : alpha('#3B82F6', 0.08);
      case 'soft':
        return isDark ? alpha('#EC4899', 0.12) : alpha('#EC4899', 0.08);
      case 'ocean':
        return isDark ? alpha('#0EA5E9', 0.12) : alpha('#0EA5E9', 0.08);
      case 'sunset':
        return isDark ? alpha('#F97316', 0.12) : alpha('#F97316', 0.08);
      default:
        return isDark ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.08);
    }
  };
  
  const getSelectedColorFallback = () => {
    switch (themeStyle) {
      case 'claude':
        return isDark ? alpha('#D97706', 0.16) : alpha('#D97706', 0.12);
      case 'nature':
        return isDark ? alpha('#2D5016', 0.16) : alpha('#2D5016', 0.12);
      case 'tech':
        return isDark ? alpha('#3B82F6', 0.16) : alpha('#3B82F6', 0.12);
      case 'soft':
        return isDark ? alpha('#EC4899', 0.16) : alpha('#EC4899', 0.12);
      case 'ocean':
        return isDark ? alpha('#0EA5E9', 0.16) : alpha('#0EA5E9', 0.12);
      case 'sunset':
        return isDark ? alpha('#F97316', 0.16) : alpha('#F97316', 0.12);
      default:
        return isDark ? alpha(theme.palette.primary.main, 0.16) : alpha(theme.palette.primary.main, 0.12);
    }
  };
  
  const getBorderColorFallback = () => {
    switch (themeStyle) {
      case 'claude':
        return isDark ? alpha('#D97706', 0.2) : alpha('#D97706', 0.1);
      case 'nature':
        return isDark ? alpha('#2D5016', 0.2) : alpha('#2D5016', 0.1);
      case 'tech':
        return isDark ? alpha('#3B82F6', 0.2) : alpha('#3B82F6', 0.1);
      case 'soft':
        return isDark ? alpha('#EC4899', 0.2) : alpha('#EC4899', 0.1);
      case 'ocean':
        return isDark ? alpha('#0EA5E9', 0.2) : alpha('#0EA5E9', 0.1);
      case 'sunset':
        return isDark ? alpha('#F97316', 0.2) : alpha('#F97316', 0.1);
      default:
        return theme.palette.divider;
    }
  };
  
  return {
    hoverColor: cssVarHoverBg || getHoverColorFallback(),
    selectedColor: cssVarSelectedBg || getSelectedColorFallback(),
    borderColor: cssVarBorderDefault || getBorderColorFallback(),
  };
};

/**
 * 从 CSS Variables 获取图标颜色
 * 优先使用 CSS Variables，如果不存在则回退到硬编码的颜色值
 */
const getIconColorsFromCSSVars = (theme: Theme) => {
  const isDark = theme.palette.mode === 'dark';
  
  // 从 CSS Variables 读取
  const cssVarIconDefault = getCSSVariable('icon-default');
  const cssVarIconSuccess = getCSSVariable('icon-success');
  const cssVarIconWarning = getCSSVariable('icon-warning');
  const cssVarIconError = getCSSVariable('icon-error');
  const cssVarIconInfo = getCSSVariable('icon-info');
  
  return {
    iconColor: cssVarIconDefault || (isDark ? '#64B5F6' : '#1976D2'),
    iconColorSuccess: cssVarIconSuccess || '#4CAF50',
    iconColorWarning: cssVarIconWarning || '#FF9800',
    iconColorError: cssVarIconError || '#f44336',
    iconColorInfo: cssVarIconInfo || '#2196F3',
  };
};

/**
 * 从 CSS Variables 获取工具栏颜色
 * 优先使用 CSS Variables，如果不存在则回退到硬编码的颜色值
 */
const getToolbarColorsFromCSSVars = (theme: Theme) => {
  const isDark = theme.palette.mode === 'dark';
  
  // 从 CSS Variables 读取
  const cssVarToolbarBg = getCSSVariable('toolbar-bg');
  const cssVarToolbarBorder = getCSSVariable('toolbar-border');
  const cssVarToolbarShadow = getCSSVariable('toolbar-shadow');
  
  return {
    toolbarBg: cssVarToolbarBg || (isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)'),
    toolbarBorder: cssVarToolbarBorder || (isDark ? 'rgba(60, 60, 60, 0.8)' : 'rgba(230, 230, 230, 0.8)'),
    toolbarShadow: cssVarToolbarShadow || (isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.07)'),
  };
};

/**
 * 从 CSS Variables 获取消息气泡颜色
 * 优先使用 CSS Variables，如果不存在则回退到硬编码的颜色值
 */
const getMessageColorsFromCSSVars = (theme: Theme, themeStyle?: ThemeStyle) => {
  const isDark = theme.palette.mode === 'dark';
  
  // 从 CSS Variables 读取
  const cssVarAiBg = getCSSVariable('msg-ai-bg');
  const cssVarAiBgActive = getCSSVariable('msg-ai-bg-active');
  const cssVarUserBg = getCSSVariable('msg-user-bg');
  const cssVarUserBgActive = getCSSVariable('msg-user-bg-active');
  
  // 回退颜色值（如果 CSS Variables 不存在）
  const getAiBubbleFallback = () => {
    switch (themeStyle) {
      case 'claude':
        return isDark ? '#2A1F1A' : '#FEF3E2';
      case 'nature':
        return isDark ? '#252B20' : '#F7F5F3';
      case 'tech':
        return isDark ? '#1E293B' : '#F0F4F8';
      case 'soft':
        return isDark ? '#2D1B3D' : '#FDF2F8';
      case 'ocean':
        return isDark ? '#1E3A5F' : '#E0F2FE';
      case 'sunset':
        return isDark ? '#292524' : '#FFEDD5';
      default:
        return isDark ? 'rgba(26, 59, 97, 0.9)' : 'rgba(230, 244, 255, 0.9)';
    }
  };
  
  const getAiBubbleActiveFallback = () => {
    switch (themeStyle) {
      case 'claude':
        return isDark ? '#3A2B20' : '#FDE8C7';
      case 'nature':
        return isDark ? '#2F3725' : '#EFEBE6';
      case 'tech':
        return isDark ? '#273548' : '#E0E8F0';
      case 'soft':
        return isDark ? '#3A2748' : '#FCE7F3';
      case 'ocean':
        return isDark ? '#2C5282' : '#BAE6FD';
      case 'sunset':
        return isDark ? '#3F3F46' : '#FED7AA';
      default:
        return isDark ? '#234b79' : '#d3e9ff';
    }
  };
  
  const getUserBubbleFallback = () => {
    switch (themeStyle) {
      case 'claude':
        return isDark ? '#1A2E26' : '#E6F7F1';
      case 'nature':
        return isDark ? '#1F2A1E' : '#E8F5E3';
      case 'tech':
        return isDark ? '#1A2438' : '#E0E8F5';
      case 'soft':
        return isDark ? '#2A1F3D' : '#FCE7F3';
      case 'ocean':
        return isDark ? '#164E63' : '#CFFAFE';
      case 'sunset':
        return isDark ? '#713F12' : '#FEF3C7';
      default:
        return isDark ? 'rgba(51, 51, 51, 0.95)' : 'rgba(227, 242, 253, 0.95)';
    }
  };
  
  const getUserBubbleActiveFallback = () => {
    switch (themeStyle) {
      case 'claude':
        return isDark ? '#234A3D' : '#CCEEE2';
      case 'nature':
        return isDark ? '#2A3828' : '#D6EECE';
      case 'tech':
        return isDark ? '#243450' : '#C8D8EB';
      case 'soft':
        return isDark ? '#382D52' : '#FBDCF1';
      case 'ocean':
        return isDark ? '#22D3EE' : '#A5F3FC';
      case 'sunset':
        return isDark ? '#A16207' : '#FDE68A';
      default:
        return isDark ? alpha('rgba(51, 51, 51, 0.95)', 0.8) : alpha('rgba(227, 242, 253, 0.95)', 0.8);
    }
  };
  
  return {
    aiBubbleColor: cssVarAiBg || getAiBubbleFallback(),
    aiBubbleActiveColor: cssVarAiBgActive || getAiBubbleActiveFallback(),
    userBubbleColor: cssVarUserBg || getUserBubbleFallback(),
    userBubbleActiveColor: cssVarUserBgActive || getUserBubbleActiveFallback(),
  };
};

// 获取主题适配的颜色
export const getThemeColors = (theme: Theme, themeStyle?: ThemeStyle) => {
  const isDark = theme.palette.mode === 'dark';
  
  // 基础颜色 - 从 CSS Variables 读取
  const baseColors = getBaseColorsFromCSSVars(theme);

  // 消息气泡颜色 - 从 CSS Variables 读取
  const messageColors = getMessageColorsFromCSSVars(theme, themeStyle);

  // 按钮颜色 - 从 CSS Variables 读取
  const buttonColors = getButtonColorsFromCSSVars(theme, themeStyle);

  // 交互状态颜色 - 从 CSS Variables 读取
  const interactionColors = getInteractionColorsFromCSSVars(theme, themeStyle);

  // 图标颜色 - 从 CSS Variables 读取
  const iconColors = getIconColorsFromCSSVars(theme);

  // 工具栏颜色 - 从 CSS Variables 读取
  const toolbarColors = getToolbarColorsFromCSSVars(theme);

  return {
    ...baseColors,
    ...messageColors,
    ...buttonColors,
    ...interactionColors,
    ...iconColors,
    ...toolbarColors,
    isDark,
  };
};
