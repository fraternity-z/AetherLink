import type { PayloadAction } from '@reduxjs/toolkit';
import type { Model } from '../../types';
import type { GeneratedImage } from '../../types';
import type { ModelProvider } from '../../config/defaultModels';
import type { ThemeStyle } from '../../config/themes';
import type { SettingsState } from './settingsTypes';
import { findModelInProviders, getModelIdentityKey, modelMatchesIdentity, parseModelIdentityKey } from '../../utils/modelUtils';
import { canonicalModelKey, ensureModelIdentityKey, setDefaultFlags } from './settingsModelIdentity';

const reconcileModelSelection = (state: SettingsState): void => {
  const defaultMatch = findModelInProviders(state.providers, state.defaultModelId, { includeDisabled: true });

  if (defaultMatch) {
    state.defaultModelId = canonicalModelKey(defaultMatch.model, defaultMatch.provider.id);
  } else {
    const replacement = state.providers
      .flatMap((provider: ModelProvider) => provider.models.map(model => ({ model, provider })))
      .find(({ model }) => model.enabled);

    state.defaultModelId = replacement
      ? canonicalModelKey(replacement.model, replacement.provider.id)
      : undefined;
  }

  state.providers = setDefaultFlags(state.providers, state.defaultModelId);

  if (!findModelInProviders(state.providers, state.currentModelId, { includeDisabled: true })) {
    state.currentModelId = state.defaultModelId;
  }
};

const getScopedModelIdentity = (modelId: string, providerId: string) => {
  const identity = parseModelIdentityKey(modelId);
  if (!identity) {
    return null;
  }

  return identity.provider ? identity : { ...identity, provider: providerId };
};

export const settingsReducers = {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      // 异步操作将通过 extraReducers 处理
    },
    setThemeStyle: (state, action: PayloadAction<ThemeStyle>) => {
      state.themeStyle = action.payload;
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },
    setFontFamily: (state, action: PayloadAction<string>) => {
      state.fontFamily = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setSendWithEnter: (state, action: PayloadAction<boolean>) => {
      state.sendWithEnter = action.payload;
    },
    setEnableNotifications: (state, action: PayloadAction<boolean>) => {
      state.enableNotifications = action.payload;
    },
    setMobileInputMethodEnterAsNewline: (state, action: PayloadAction<boolean>) => {
      state.mobileInputMethodEnterAsNewline = action.payload;
    },
    addModel: (state, action: PayloadAction<Model>) => {
        state.models.push(action.payload);
    },
    updateModel: (state, action: PayloadAction<{ id: string; updates: Partial<Model> }>) => {
      const { id, updates } = action.payload;
      const identity = parseModelIdentityKey(id);
      
      if (identity) {
        const modelIndex = state.models.findIndex(model => 
          modelMatchesIdentity(model, identity, model.provider)
        );
        if (modelIndex !== -1) {
          state.models[modelIndex] = { ...state.models[modelIndex], ...updates };
        }
      }
    },
    deleteModel: (state, action: PayloadAction<string>) => {
      const modelId = action.payload;
      const identity = parseModelIdentityKey(modelId);

      if (identity) {
        // 从全局models数组中删除模型
        state.models = state.models.filter(model => 
          !modelMatchesIdentity(model, identity, model.provider)
        );

        // 从所有provider的models数组中删除模型
        state.providers.forEach((provider: ModelProvider, index: number) => {
          state.providers[index].models = provider.models.filter((model: Model) => 
            !modelMatchesIdentity(model, identity, provider.id)
          );
        });
      }
      reconcileModelSelection(state);
    },
    setDefaultModel: (state, action: PayloadAction<string>) => {
      const identity = parseModelIdentityKey(action.payload);
      state.models.forEach(model => {
        model.isDefault = modelMatchesIdentity(model, identity);
      });
      state.providers = setDefaultFlags(state.providers, action.payload);
      state.defaultModelId = identity ? getModelIdentityKey(identity) : action.payload;
    },
    setCurrentModel: (state, action: PayloadAction<string>) => {
      state.currentModelId = ensureModelIdentityKey(action.payload, state.providers) || action.payload;
    },
    addProvider: (state, action: PayloadAction<ModelProvider>) => {
      state.providers.push(action.payload);
    },
    updateProvider: (state, action: PayloadAction<{ id: string; updates: Partial<ModelProvider> }>) => {
      const { id, updates } = action.payload;
      const providerIndex = state.providers.findIndex((provider: ModelProvider) => provider.id === id);
      if (providerIndex !== -1) {
        state.providers[providerIndex] = { ...state.providers[providerIndex], ...updates };

        // 如果apiKey、baseUrl、extraHeaders、extraBody、apiKeys、useCorsPlugin或providerType更新了，也要更新所有关联模型
        if (updates.apiKey !== undefined || updates.baseUrl !== undefined || updates.extraHeaders !== undefined || updates.extraBody !== undefined || updates.apiKeys !== undefined || updates.useCorsPlugin !== undefined || updates.providerType !== undefined) {
          state.providers[providerIndex].models = state.providers[providerIndex].models.map((model: Model) => ({
            ...model,
            apiKey: updates.apiKey !== undefined ? updates.apiKey : model.apiKey,
            baseUrl: updates.baseUrl !== undefined ? updates.baseUrl : model.baseUrl,
            extraHeaders: updates.extraHeaders !== undefined ? updates.extraHeaders : model.extraHeaders,
            extraBody: updates.extraBody !== undefined ? updates.extraBody : model.extraBody,
            useCorsPlugin: updates.useCorsPlugin !== undefined ? updates.useCorsPlugin : model.useCorsPlugin,
            providerType: updates.providerType !== undefined ? updates.providerType : model.providerType
          }));
        }
      }
    },
    deleteProvider: (state, action: PayloadAction<string>) => {
      const providerId = action.payload;
      const providerToDelete = state.providers.find((provider: ModelProvider) => provider.id === providerId);
      if (!providerToDelete) {
        return;
      }

      const removedModelIds = new Set(providerToDelete.models.map((model: Model) => model.id));
      state.providers = state.providers.filter((provider: ModelProvider) => provider.id !== providerId);
      state.models = state.models.filter((model: Model) =>
        model.provider !== providerId && (model.provider || !removedModelIds.has(model.id))
      );

      reconcileModelSelection(state);
    },
    reorderProviders: (state, action: PayloadAction<ModelProvider[]>) => {
      state.providers = action.payload;
    },
    toggleProviderEnabled: (state, action: PayloadAction<{ id: string; enabled: boolean }>) => {
      const { id, enabled } = action.payload;
      const providerIndex = state.providers.findIndex((provider: ModelProvider) => provider.id === id);
      if (providerIndex !== -1) {
        state.providers[providerIndex].isEnabled = enabled;
      }
    },
    addModelToProvider: (state, action: PayloadAction<{ providerId: string; model: Model }>) => {
      const { providerId, model } = action.payload;
      const providerIndex = state.providers.findIndex((provider: ModelProvider) => provider.id === providerId);
      if (providerIndex !== -1) {
        const provider = state.providers[providerIndex];
        state.providers[providerIndex].models.push({
          ...model,
          provider: providerId,
          providerType: provider.providerType || providerId,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl
        });
      }
    },
    setProviderDefaultModel: (state, action: PayloadAction<{ providerId: string; modelId: string }>) => {
      const { providerId, modelId } = action.payload;
      const providerIndex = state.providers.findIndex((provider: ModelProvider) => provider.id === providerId);
      if (providerIndex !== -1) {
        const identity = parseModelIdentityKey(modelId);
        state.providers[providerIndex].models.forEach((model: Model) => {
          model.isDefault = modelMatchesIdentity(model, identity, providerId);
        });
      }
    },
    deleteModelFromProvider: (state, action: PayloadAction<{ providerId: string; modelId: string }>) => {
      const { providerId, modelId } = action.payload;
      const providerIndex = state.providers.findIndex((provider: ModelProvider) => provider.id === providerId);

      if (providerIndex !== -1) {
        const identity = getScopedModelIdentity(modelId, providerId);
        if (!identity) {
          return;
        }

        // 从provider的models数组中删除模型
        state.providers[providerIndex].models = state.providers[providerIndex].models.filter(
          (model: Model) => !modelMatchesIdentity(model, identity, providerId)
        );
        state.models = state.models.filter((model: Model) => !modelMatchesIdentity(model, identity, providerId));

        reconcileModelSelection(state);
      }
    },
    addGeneratedImage: (state, action: PayloadAction<GeneratedImage>) => {
      // 初始化generatedImages数组（如果不存在）
      if (!state.generatedImages) {
        state.generatedImages = [];
      }

      // 添加新生成的图像
      state.generatedImages.unshift(action.payload);

      // 限制保存的历史图像数量（保存最近的50张）
      if (state.generatedImages.length > 50) {
        state.generatedImages = state.generatedImages.slice(0, 50);
      }
    },
    deleteGeneratedImage: (state, action: PayloadAction<string>) => {
      // 如果generatedImages不存在，直接返回
      if (!state.generatedImages) {
        return;
      }

      // 根据图像URL删除
      state.generatedImages = state.generatedImages.filter(
        image => image.url !== action.payload
      );
    },
    clearGeneratedImages: (state) => {
      state.generatedImages = [];
    },
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      const updates: Partial<SettingsState> = { ...action.payload };

      if (updates.defaultModelId !== undefined) {
        updates.defaultModelId = ensureModelIdentityKey(updates.defaultModelId, state.providers);
        state.providers = setDefaultFlags(state.providers, updates.defaultModelId);
      }

      if (updates.currentModelId !== undefined) {
        updates.currentModelId = ensureModelIdentityKey(updates.currentModelId, state.providers);
      }

      if (updates.topicNamingModelId !== undefined) {
        updates.topicNamingModelId = ensureModelIdentityKey(updates.topicNamingModelId, state.providers);
      }

      // 🔥 修复损坏的 topToolbar 设置
      if (updates.topToolbar) {
        const validModelSelectorDisplayStyles = ['icon', 'text'] as const;
        const displayStyle = updates.topToolbar.modelSelectorDisplayStyle;
        if (displayStyle !== undefined && !validModelSelectorDisplayStyles.includes(displayStyle as any)) {
          console.warn(`[settingsSlice] 修复无效的 modelSelectorDisplayStyle: "${displayStyle}", 重置为 "icon"`);
          updates.topToolbar = {
            ...updates.topToolbar,
            modelSelectorDisplayStyle: 'icon'
          };
        }
        
        const validModelSelectorStyles = ['dialog', 'dropdown'] as const;
        const selectorStyle = updates.topToolbar.modelSelectorStyle;
        if (selectorStyle !== undefined && !validModelSelectorStyles.includes(selectorStyle as any)) {
          console.warn(`[settingsSlice] 修复无效的 modelSelectorStyle: "${selectorStyle}", 重置为 "dialog"`);
          updates.topToolbar = {
            ...updates.topToolbar,
            modelSelectorStyle: 'dialog'
          };
        }
      }

      // 🔥 修复损坏的全局 modelSelectorStyle 设置
      if (updates.modelSelectorStyle !== undefined) {
        const validStyles = ['dialog', 'dropdown'] as const;
        if (!validStyles.includes(updates.modelSelectorStyle as any)) {
          console.warn(`[settingsSlice] 修复无效的全局 modelSelectorStyle: "${updates.modelSelectorStyle}", 重置为 "dialog"`);
          updates.modelSelectorStyle = 'dialog';
        }
      }

      Object.assign(state, updates);
    },
    setModelSelectorStyle: (state, action: PayloadAction<'dialog' | 'dropdown'>) => {
      state.modelSelectorStyle = action.payload;
    },

    // 更新模型组合供应商的模型列表
    updateModelComboModels: (state, action: PayloadAction<Model[]>) => {
      const comboProvider = state.providers.find((p: ModelProvider) => p.id === 'model-combo');
      if (comboProvider) {
        comboProvider.models = action.payload;
      }
    },
    // 话题命名相关的action creators
    setEnableTopicNaming: (state, action: PayloadAction<boolean>) => {
      state.enableTopicNaming = action.payload;
    },
    setTopicNamingPrompt: (state, action: PayloadAction<string>) => {
      state.topicNamingPrompt = action.payload;
    },
    setTopicNamingModelId: (state, action: PayloadAction<string>) => {
      state.topicNamingModelId = action.payload;
    },
    setMessageStyle: (state, action: PayloadAction<'plain' | 'bubble'>) => {
      state.messageStyle = action.payload;
    },
    setRenderUserInputAsMarkdown: (state, action: PayloadAction<boolean>) => {
      state.renderUserInputAsMarkdown = action.payload;
    },
    // 自动滚动控制
    setAutoScrollToBottom: (state, action: PayloadAction<boolean>) => {
      state.autoScrollToBottom = action.payload;
    },
    // AI辩论按钮显示控制
    setShowAIDebateButton: (state, action: PayloadAction<boolean>) => {
      state.showAIDebateButton = action.payload;
    },
    // 快捷短语按钮显示控制
    setShowQuickPhraseButton: (state, action: PayloadAction<boolean>) => {
      state.showQuickPhraseButton = action.payload;
    },

    // 代码块设置 actions
    setCodeThemeLight: (state, action: PayloadAction<string>) => {
      state.codeThemeLight = action.payload;
    },
    setCodeThemeDark: (state, action: PayloadAction<string>) => {
      state.codeThemeDark = action.payload;
    },
    setEditorTheme: (state, action: PayloadAction<string>) => {
      state.editorTheme = action.payload;
    },
    setEditorZoomLevel: (state, action: PayloadAction<number>) => {
      state.editorZoomLevel = action.payload;
    },
    setCodeEditor: (state, action: PayloadAction<boolean>) => {
      state.codeEditor = action.payload;
    },
    setCodeShowLineNumbers: (state, action: PayloadAction<boolean>) => {
      state.codeShowLineNumbers = action.payload;
    },
    setCodeCollapsible: (state, action: PayloadAction<boolean>) => {
      state.codeCollapsible = action.payload;
    },
    setCodeWrappable: (state, action: PayloadAction<boolean>) => {
      state.codeWrappable = action.payload;
    },
    setCodeDefaultCollapsed: (state, action: PayloadAction<boolean>) => {
      state.codeDefaultCollapsed = action.payload;
    },
    setMermaidEnabled: (state, action: PayloadAction<boolean>) => {
      state.mermaidEnabled = action.payload;
    },

    // 长文本粘贴为文件功能设置 actions
    setPasteLongTextAsFile: (state, action: PayloadAction<boolean>) => {
      state.pasteLongTextAsFile = action.payload;
    },
    setPasteLongTextThreshold: (state, action: PayloadAction<number>) => {
      state.pasteLongTextThreshold = action.payload;
    },

    // 工具栏样式设置 actions
    setToolbarStyle: (state, action: PayloadAction<'glassmorphism' | 'transparent'>) => {
      state.toolbarStyle = action.payload;
    },

    // 工具栏按钮配置 actions
    setToolbarButtonOrder: (state, action: PayloadAction<string[]>) => {
      if (!state.toolbarButtons) {
        state.toolbarButtons = {
          order: action.payload,
          visibility: {}
        };
      } else {
        state.toolbarButtons.order = action.payload;
      }
    },
    setToolbarButtonVisibility: (state, action: PayloadAction<{ buttonId: string; visible: boolean }>) => {
      const { buttonId, visible } = action.payload;
      if (!state.toolbarButtons) {
        state.toolbarButtons = {
          order: [],
          visibility: { [buttonId]: visible }
        };
      } else {
        state.toolbarButtons.visibility[buttonId] = visible;
      }
    },
    updateToolbarButtons: (state, action: PayloadAction<{ order: string[]; visibility: { [key: string]: boolean } }>) => {
      state.toolbarButtons = action.payload;
    },

    // 性能监控显示控制
    setShowPerformanceMonitor: (state, action: PayloadAction<boolean>) => {
      state.showPerformanceMonitor = action.payload;
    },

    // 开发者工具悬浮窗显示控制
    setShowDevToolsFloatingButton: (state, action: PayloadAction<boolean>) => {
      state.showDevToolsFloatingButton = action.payload;
    },
    
    // 触觉反馈设置控制
    setHapticFeedbackEnabled: (state, action: PayloadAction<boolean>) => {
      if (!state.hapticFeedback) {
        state.hapticFeedback = {
          enabled: action.payload,
          enableOnSidebar: true,
          enableOnSwitch: true,
          enableOnListItem: false,
          enableOnNavigation: true
        };
      } else {
        state.hapticFeedback.enabled = action.payload;
      }
    },
    setHapticFeedbackOnSidebar: (state, action: PayloadAction<boolean>) => {
      if (!state.hapticFeedback) {
        state.hapticFeedback = {
          enabled: true,
          enableOnSidebar: action.payload,
          enableOnSwitch: true,
          enableOnListItem: false,
          enableOnNavigation: true
        };
      } else {
        state.hapticFeedback.enableOnSidebar = action.payload;
      }
    },
    setHapticFeedbackOnSwitch: (state, action: PayloadAction<boolean>) => {
      if (!state.hapticFeedback) {
        state.hapticFeedback = {
          enabled: true,
          enableOnSidebar: true,
          enableOnSwitch: action.payload,
          enableOnListItem: false,
          enableOnNavigation: true
        };
      } else {
        state.hapticFeedback.enableOnSwitch = action.payload;
      }
    },
    setHapticFeedbackOnListItem: (state, action: PayloadAction<boolean>) => {
      if (!state.hapticFeedback) {
        state.hapticFeedback = {
          enabled: true,
          enableOnSidebar: true,
          enableOnSwitch: true,
          enableOnListItem: action.payload,
          enableOnNavigation: true
        };
      } else {
        state.hapticFeedback.enableOnListItem = action.payload;
      }
    },
    setHapticFeedbackOnNavigation: (state, action: PayloadAction<boolean>) => {
      if (!state.hapticFeedback) {
        state.hapticFeedback = {
          enabled: true,
          enableOnSidebar: true,
          enableOnSwitch: true,
          enableOnListItem: false,
          enableOnNavigation: action.payload
        };
      } else {
        state.hapticFeedback.enableOnNavigation = action.payload;
      }
    },

    // 侧边栏 tab 索引设置
    setSidebarTabIndex: (state, action: PayloadAction<number>) => {
      state.sidebarTabIndex = action.payload;
    },

    // 上下文压缩设置 actions
    setContextCondenseEnabled: (state, action: PayloadAction<boolean>) => {
      if (!state.contextCondense) {
        state.contextCondense = {
          enabled: action.payload,
          threshold: 80
        };
      } else {
        state.contextCondense.enabled = action.payload;
      }
    },
    setContextCondenseThreshold: (state, action: PayloadAction<number>) => {
      if (!state.contextCondense) {
        state.contextCondense = {
          enabled: false,
          threshold: action.payload
        };
      } else {
        state.contextCondense.threshold = action.payload;
      }
    },
    setContextCondenseModelId: (state, action: PayloadAction<string | undefined>) => {
      if (!state.contextCondense) {
        state.contextCondense = {
          enabled: false,
          threshold: 80,
          modelId: action.payload
        };
      } else {
        state.contextCondense.modelId = action.payload;
      }
    },
    setContextCondenseCustomPrompt: (state, action: PayloadAction<string | undefined>) => {
      if (!state.contextCondense) {
        state.contextCondense = {
          enabled: false,
          threshold: 80,
          customPrompt: action.payload
        };
      } else {
        state.contextCondense.customPrompt = action.payload;
      }
    },
    updateContextCondenseSettings: (state, action: PayloadAction<Partial<NonNullable<SettingsState['contextCondense']>>>) => {
      if (!state.contextCondense) {
        state.contextCondense = {
          enabled: false,
          threshold: 80,
          ...action.payload
        };
      } else {
        state.contextCondense = {
          ...state.contextCondense,
          ...action.payload
        };
      }
    },
};
