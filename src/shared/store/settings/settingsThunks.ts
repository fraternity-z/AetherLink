import { createAsyncThunk } from '@reduxjs/toolkit';
import { ThinkingDisplayStyle } from '../../../components/message/blocks/ThinkingBlock';
import { getDefaultModelProviders, getDefaultModelId, type ModelProvider } from '../../config/defaultModels';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import type { SettingsState } from './settingsTypes';
import { ensureModelIdentityKey, setDefaultFlags } from './settingsModelIdentity';

const ensureModelComboProvider = (providers: ModelProvider[]): ModelProvider[] => {
  const hasModelComboProvider = providers.some((provider: ModelProvider) => provider.id === 'model-combo');
  if (hasModelComboProvider) {
    return providers;
  }

  const initialProviders = getDefaultModelProviders();
  const modelComboProvider = initialProviders.find((provider: ModelProvider) => provider.id === 'model-combo');
  if (!modelComboProvider) {
    return providers;
  }

  return [modelComboProvider, ...providers];
};

const normalizeSettings = (savedSettings: SettingsState): SettingsState => {
  const initialProviders = getDefaultModelProviders();
  const providers = ensureModelComboProvider(savedSettings.providers || initialProviders);

  if (!savedSettings.currentModelId) {
    savedSettings.currentModelId = savedSettings.defaultModelId || getDefaultModelId(providers);
  }

  savedSettings.defaultModelId = ensureModelIdentityKey(savedSettings.defaultModelId || getDefaultModelId(providers), providers);
  savedSettings.currentModelId = ensureModelIdentityKey(savedSettings.currentModelId || savedSettings.defaultModelId, providers);
  savedSettings.topicNamingModelId = ensureModelIdentityKey(savedSettings.topicNamingModelId, providers);
  setDefaultFlags(providers, savedSettings.defaultModelId);

  if (!savedSettings.thinkingDisplayStyle) {
    savedSettings.thinkingDisplayStyle = ThinkingDisplayStyle.COMPACT;
  }

  if (!savedSettings.toolbarDisplayStyle) {
    savedSettings.toolbarDisplayStyle = 'both';
  }

  if (!savedSettings.inputBoxStyle) {
    savedSettings.inputBoxStyle = 'default';
  }

  savedSettings.inputLayoutStyle = 'integrated';

  if (savedSettings.showSystemPromptBubble === undefined) {
    savedSettings.showSystemPromptBubble = true;
  }

  if (!savedSettings.modelSelectorStyle) {
    savedSettings.modelSelectorStyle = 'dialog';
  }

  const validModelSelectorStyles = ['dialog', 'dropdown'] as const;
  if (!validModelSelectorStyles.includes(savedSettings.modelSelectorStyle as any)) {
    console.warn(`[loadSettings] 修复无效的 modelSelectorStyle: "${savedSettings.modelSelectorStyle}", 重置为 "dialog"`);
    savedSettings.modelSelectorStyle = 'dialog';
  }

  if (savedSettings.topToolbar) {
    const validDisplayStyles = ['icon', 'text'] as const;
    const displayStyle = savedSettings.topToolbar.modelSelectorDisplayStyle;
    if (displayStyle !== undefined && !validDisplayStyles.includes(displayStyle as any)) {
      console.warn(`[loadSettings] 修复无效的 modelSelectorDisplayStyle: "${displayStyle}", 重置为 "icon"`);
      savedSettings.topToolbar.modelSelectorDisplayStyle = 'icon';
    }

    const selectorStyle = savedSettings.topToolbar.modelSelectorStyle;
    if (selectorStyle !== undefined && !validModelSelectorStyles.includes(selectorStyle as any)) {
      console.warn(`[loadSettings] 修复无效的 topToolbar.modelSelectorStyle: "${selectorStyle}", 重置为 "dialog"`);
      savedSettings.topToolbar.modelSelectorStyle = 'dialog';
    }
  }

  if (savedSettings.messageBubbleMinWidth === undefined) {
    savedSettings.messageBubbleMinWidth = 50;
  }
  if (savedSettings.messageBubbleMaxWidth === undefined) {
    savedSettings.messageBubbleMaxWidth = 100;
  }
  if (savedSettings.userMessageMaxWidth === undefined) {
    savedSettings.userMessageMaxWidth = 80;
  }

  if (savedSettings.toolbarCollapsed === undefined) {
    savedSettings.toolbarCollapsed = false;
  }

  if (savedSettings.versionSwitchStyle === undefined) {
    savedSettings.versionSwitchStyle = 'popup';
  }

  if (!savedSettings.messageStyle) {
    savedSettings.messageStyle = 'bubble';
  }

  if (savedSettings.autoScrollToBottom === undefined) {
    savedSettings.autoScrollToBottom = true;
  }

  if (savedSettings.showAIDebateButton === undefined) {
    savedSettings.showAIDebateButton = true;
  }

  if (savedSettings.showQuickPhraseButton === undefined) {
    savedSettings.showQuickPhraseButton = true;
  }

  if (savedSettings.codeDefaultCollapsed === undefined) {
    savedSettings.codeDefaultCollapsed = false;
  }

  if (savedSettings.useNewCodeBlockView === undefined) {
    savedSettings.useNewCodeBlockView = true;
  }

  if (savedSettings.showMicroBubbles === undefined) {
    savedSettings.showMicroBubbles = true;
  }

  if (savedSettings.showTTSButton === undefined) {
    savedSettings.showTTSButton = true;
  }

  if (savedSettings.hideUserBubble === undefined) {
    savedSettings.hideUserBubble = false;
  }
  if (savedSettings.hideAIBubble === undefined) {
    savedSettings.hideAIBubble = true;
  }

  if (!savedSettings.systemPromptVariables) {
    savedSettings.systemPromptVariables = {
      enableTimeVariable: false,
      enableLocationVariable: false,
      customLocation: '',
      enableOSVariable: false
    };
  }

  if (!savedSettings.fontFamily) {
    savedSettings.fontFamily = 'system';
  }

  if (savedSettings.pasteLongTextAsFile === undefined) {
    savedSettings.pasteLongTextAsFile = false;
  }
  if (savedSettings.pasteLongTextThreshold === undefined) {
    savedSettings.pasteLongTextThreshold = 1500;
  }

  if (!savedSettings.toolbarStyle) {
    savedSettings.toolbarStyle = 'glassmorphism';
  }

  if (!savedSettings.toolbarButtons) {
    savedSettings.toolbarButtons = {
      order: ['mcp-tools', 'new-topic', 'clear-topic', 'generate-image', 'generate-video', 'knowledge', 'web-search'],
      visibility: {
        'mcp-tools': true,
        'new-topic': true,
        'clear-topic': true,
        'generate-image': true,
        'generate-video': true,
        'knowledge': true,
        'web-search': true
      }
    };
  }

  if (savedSettings.showPerformanceMonitor === undefined) {
    savedSettings.showPerformanceMonitor = false;
  }

  if (!savedSettings.hapticFeedback) {
    savedSettings.hapticFeedback = {
      enabled: true,
      enableOnSidebar: true,
      enableOnSwitch: true,
      enableOnListItem: false,
      enableOnNavigation: true
    };
  } else if (savedSettings.hapticFeedback.enableOnNavigation === undefined) {
    savedSettings.hapticFeedback.enableOnNavigation = true;
  }

  if (!savedSettings.contextCondense) {
    savedSettings.contextCondense = {
      enabled: false,
      threshold: 80,
      modelId: undefined,
      customPrompt: undefined,
      useCurrentTopicModel: true
    };
  } else if (savedSettings.contextCondense.useCurrentTopicModel === undefined) {
    savedSettings.contextCondense.useCurrentTopicModel = true;
  }

  return {
    ...savedSettings,
    providers,
    isLoading: false
  };
};

export const loadSettings = createAsyncThunk('settings/load', async () => {
  try {
    const savedSettings = await getStorageItem<SettingsState>('settings');
    if (!savedSettings) {
      return null;
    }

    return normalizeSettings(savedSettings);
  } catch (error) {
    console.error('Failed to load settings from storage', error);
    return null;
  }
});

export const saveSettings = createAsyncThunk('settings/save', async (state: SettingsState) => {
  try {
    await setStorageItem('settings', state);
    return true;
  } catch (error) {
    console.error('Failed to save settings to storage', error);
    return false;
  }
});
