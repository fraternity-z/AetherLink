import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ModelProvider } from '../../config/defaultModels';
import { getDefaultModelProviders, getDefaultModelId } from '../../config/defaultModels';
import { getStorageItem } from '../../utils/storage';
import { ensureModelIdentityKey, setDefaultFlags } from './helpers';
import { getInitialState } from './defaults';
import type { SettingsState } from './types';

/**
 * 将保存的设置与默认值深度合并。
 * - 基础类型：saved 有值则覆盖，否则用 defaults
 * - 嵌套对象（如 hapticFeedback, contextCondense）：做一层合并，确保新增子字段自动获得默认值
 * - 数组：saved 有值则直接覆盖（不做元素级合并）
 */
const mergeWithDefaults = (saved: Partial<SettingsState>, defaults: SettingsState): SettingsState => {
  const merged = { ...defaults };

  for (const key of Object.keys(saved) as (keyof SettingsState)[]) {
    const savedValue = saved[key];
    if (savedValue === undefined || savedValue === null) continue;

    const defaultValue = (defaults as any)[key];
    if (
      typeof savedValue === 'object' &&
      !Array.isArray(savedValue) &&
      typeof defaultValue === 'object' &&
      defaultValue !== null &&
      !Array.isArray(defaultValue)
    ) {
      // 嵌套对象：一层合并，新增子字段自动获得默认值
      (merged as any)[key] = { ...defaultValue, ...savedValue };
    } else {
      (merged as any)[key] = savedValue;
    }
  }

  return merged;
};

// 验证并修复可能损坏的枚举值
const sanitizeEnumValues = (settings: SettingsState): void => {
  const validModelSelectorStyles = ['dialog', 'dropdown'] as const;
  if (!validModelSelectorStyles.includes(settings.modelSelectorStyle as any)) {
    console.warn(`[loadSettings] 修复无效的 modelSelectorStyle: "${settings.modelSelectorStyle}", 重置为 "dialog"`);
    settings.modelSelectorStyle = 'dialog';
  }

  if (settings.topToolbar) {
    const validDisplayStyles = ['icon', 'text'] as const;
    const displayStyle = settings.topToolbar.modelSelectorDisplayStyle;
    if (displayStyle !== undefined && !validDisplayStyles.includes(displayStyle as any)) {
      console.warn(`[loadSettings] 修复无效的 modelSelectorDisplayStyle: "${displayStyle}", 重置为 "icon"`);
      settings.topToolbar.modelSelectorDisplayStyle = 'icon';
    }

    const selectorStyle = settings.topToolbar.modelSelectorStyle;
    if (selectorStyle !== undefined && !validModelSelectorStyles.includes(selectorStyle as any)) {
      console.warn(`[loadSettings] 修复无效的 topToolbar.modelSelectorStyle: "${selectorStyle}", 重置为 "dialog"`);
      settings.topToolbar.modelSelectorStyle = 'dialog';
    }
  }

  // 强制使用 integrated 模式
  settings.inputLayoutStyle = 'integrated';
};

// 创建异步加载设置的thunk
export const loadSettings = createAsyncThunk('settings/load', async () => {
  try {
    const savedSettings = await getStorageItem<SettingsState>('settings');
    if (savedSettings) {
      const defaults = getInitialState();
      const initialProviders = getDefaultModelProviders();
      let providers = savedSettings.providers || initialProviders;

      // 确保模型组合供应商始终存在
      const hasModelComboProvider = providers.some((p: ModelProvider) => p.id === 'model-combo');
      if (!hasModelComboProvider) {
        const modelComboProvider = initialProviders.find((p: ModelProvider) => p.id === 'model-combo');
        if (modelComboProvider) {
          providers = [modelComboProvider, ...providers];
        }
      }

      // 用默认值填充所有缺失字段（包括嵌套对象的子字段）
      const merged = mergeWithDefaults(savedSettings, defaults);
      merged.providers = providers;

      // 统一模型标识格式，兼容旧数据
      if (!merged.currentModelId) {
        merged.currentModelId = merged.defaultModelId || getDefaultModelId(providers);
      }
      merged.defaultModelId = ensureModelIdentityKey(merged.defaultModelId || getDefaultModelId(providers), providers);
      merged.currentModelId = ensureModelIdentityKey(merged.currentModelId || merged.defaultModelId, providers);
      merged.topicNamingModelId = ensureModelIdentityKey(merged.topicNamingModelId, providers);
      setDefaultFlags(providers, merged.defaultModelId);

      // 验证并修复可能损坏的枚举值
      sanitizeEnumValues(merged);

      return {
        ...merged,
        isLoading: false
      };
    }

    // 如果没有保存的设置，返回null让reducer使用默认值
    return null;
  } catch (e) {
    console.error('Failed to load settings from storage', e);
    return null;
  }
});
