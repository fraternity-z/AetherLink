import type { RootState } from '../index';

// 创建稳定的空数组引用
const EMPTY_PROVIDERS_ARRAY: any[] = [];

/**
 * 选择 providers - 使用稳定的空数组引用避免不必要的重渲染
 */
export const selectProviders = (state: RootState): any[] => {
  return state.settings.providers || EMPTY_PROVIDERS_ARRAY;
};

/**
 * 选择 models - 使用稳定的空数组引用
 */
export const selectModels = (state: RootState): any[] => {
  return state.settings.models || EMPTY_PROVIDERS_ARRAY;
};

/**
 * 选择主题设置
 */
export const selectTheme = (state: RootState) => state.settings.theme;

/**
 * 选择主题样式
 */
export const selectThemeStyle = (state: RootState) => state.settings.themeStyle;

/**
 * 选择整个 settings 状态
 */
export const selectSettings = (state: RootState) => state.settings;
