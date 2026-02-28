import { ThinkingDisplayStyle } from '../../../components/message/blocks/ThinkingBlock';
import { getDefaultModelProviders, getDefaultModelId } from '../../config/defaultModels';
import type { SettingsState } from './settingsTypes';
import { setDefaultFlags } from './settingsModelIdentity';

export const getInitialSettingsState = (): SettingsState => {
  const initialProviders = getDefaultModelProviders();

  const defaultState: SettingsState = {
    theme: 'system' as 'light' | 'dark' | 'system',
    themeStyle: 'default' as 'default' | 'claude' | 'nature' | 'tech' | 'soft' | 'ocean' | 'sunset',
    fontSize: 16,
    fontFamily: 'system',
    language: 'zh-CN',
    sendWithEnter: true,
    enableNotifications: true,
    mobileInputMethodEnterAsNewline: false,
    models: [],
    providers: initialProviders,
    enableTopicNaming: true,
    topicNamingUseCurrentModel: true,
    topicNamingPrompt: '',
    modelSelectorStyle: 'dialog' as 'dialog' | 'dropdown',
    enableAIIntentAnalysis: false,
    aiIntentAnalysisUseCurrentModel: true,
    aiIntentAnalysisModelId: undefined as string | undefined,
    thinkingDisplayStyle: ThinkingDisplayStyle.COMPACT,
    toolbarDisplayStyle: 'both' as 'icon' | 'text' | 'both',
    inputBoxStyle: 'default' as 'default' | 'modern' | 'minimal',
    inputLayoutStyle: 'integrated' as const,
    codeThemeLight: 'one-light',
    codeThemeDark: 'material-theme-darker',
    editorTheme: 'oneDark',
    editorZoomLevel: 1.0,
    codeEditor: false,
    codeShowLineNumbers: true,
    codeCollapsible: true,
    codeWrappable: true,
    codeDefaultCollapsed: false,
    mermaidEnabled: true,
    useNewCodeBlockView: true,
    showSystemPromptBubble: true,
    showUserAvatar: true,
    showUserName: true,
    showModelAvatar: true,
    showModelName: true,
    messageStyle: 'bubble' as 'plain' | 'bubble',
    renderUserInputAsMarkdown: true,
    autoScrollToBottom: true,
    topToolbar: {
      showSettingsButton: true,
      showModelSelector: true,
      modelSelectorStyle: 'dialog',
      modelSelectorDisplayStyle: 'icon',
      showTopicName: true,
      showNewTopicButton: false,
      showClearButton: false,
      showMenuButton: true,
      leftComponents: ['menuButton', 'topicName', 'newTopicButton', 'clearButton'],
      rightComponents: ['modelSelector', 'settingsButton'],
      componentPositions: [] as Array<{
        id: string;
        x: number;
        y: number;
        width?: number;
        height?: number;
      }>,
    },
    isLoading: true,
    messageBubbleMinWidth: 50,
    messageBubbleMaxWidth: 100,
    userMessageMaxWidth: 80,
    toolbarCollapsed: false,
    versionSwitchStyle: 'popup',
    showAIDebateButton: true,
    showQuickPhraseButton: true,
    showMicroBubbles: true,
    showTTSButton: true,
    messageActionMode: 'bubbles',
    customBubbleColors: {
      userBubbleColor: '',
      userTextColor: '',
      aiBubbleColor: '',
      aiTextColor: ''
    },
    hideUserBubble: false,
    hideAIBubble: true,
    systemPromptVariables: {
      enableTimeVariable: false,
      enableLocationVariable: false,
      customLocation: '',
      enableOSVariable: false
    },
    pasteLongTextAsFile: false,
    pasteLongTextThreshold: 1500,
    toolbarStyle: 'glassmorphism',
    toolbarButtons: {
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
    },
    chatBackground: {
      enabled: false,
      imageUrl: '',
      opacity: 0.7,
      size: 'cover',
      position: 'center',
      repeat: 'no-repeat',
      showOverlay: true,
    },
    showPerformanceMonitor: false,
    showDevToolsFloatingButton: false,
    alwaysShowModelTestButton: false,
    hapticFeedback: {
      enabled: true,
      enableOnSidebar: true,
      enableOnSwitch: true,
      enableOnListItem: false,
      enableOnNavigation: true,
    },
    contextCondense: {
      enabled: false,
      threshold: 80,
      modelId: undefined,
      customPrompt: undefined,
      useCurrentTopicModel: true
    },
    sidebarTabIndex: 0,
    messageGrouping: 'byDate'
  };

  const defaultModelId = getDefaultModelId(initialProviders);
  defaultState.providers = setDefaultFlags(defaultState.providers, defaultModelId);
  return {
    ...defaultState,
    defaultModelId,
    currentModelId: defaultModelId
  };
};

export const initialSettingsState = getInitialSettingsState();
