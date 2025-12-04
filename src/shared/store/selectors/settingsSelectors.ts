import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import type { ModelProvider } from '../../config/defaultModels';

// 稳定的空数组引用，避免每次返回新引用导致不必要的重渲染
const EMPTY_PROVIDERS_ARRAY: ModelProvider[] = [];

// 基础选择器
const selectSettingsState = (state: RootState) => state.settings;

/**
 * 选择 providers 列表
 * 使用 createSelector 进行记忆化，避免每次返回新数组引用
 */
export const selectProviders = createSelector(
  [selectSettingsState],
  (settings) => settings?.providers ?? EMPTY_PROVIDERS_ARRAY
);

/**
 * 选择主题设置
 */
export const selectTheme = createSelector(
  [selectSettingsState],
  (settings) => settings?.theme ?? 'system'
);

/**
 * 选择主题风格
 */
export const selectThemeStyle = createSelector(
  [selectSettingsState],
  (settings) => settings?.themeStyle ?? 'default'
);
