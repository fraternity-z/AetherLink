import type { Model } from '../../types';
import type { GeneratedImage } from '../../types';
import type { ThemeStyle } from '../../config/themes';
import type { ModelProvider } from '../../config/defaultModels';

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  themeStyle: ThemeStyle;
  fontSize: number;
  fontFamily: string;
  language: string;
  sendWithEnter: boolean;
  enableNotifications: boolean;
  mobileInputMethodEnterAsNewline: boolean;
  models: Model[];
  providers: ModelProvider[];
  defaultModelId?: string;
  currentModelId?: string;
  generatedImages?: GeneratedImage[];
  enableTopicNaming: boolean;
  topicNamingModelId?: string;
  topicNamingUseCurrentModel?: boolean;
  topicNamingPrompt: string;
  modelSelectorStyle: 'dialog' | 'dropdown';
  enableAIIntentAnalysis?: boolean;
  aiIntentAnalysisUseCurrentModel?: boolean;
  aiIntentAnalysisModelId?: string;
  thinkingDisplayStyle: string;
  toolbarDisplayStyle: 'icon' | 'text' | 'both';
  inputBoxStyle: 'default' | 'modern' | 'minimal';
  inputLayoutStyle: 'integrated';
  codeThemeLight: string;
  codeThemeDark: string;
  editorTheme: string;
  editorZoomLevel: number;
  codeEditor: boolean;
  codeShowLineNumbers: boolean;
  codeCollapsible: boolean;
  codeWrappable: boolean;
  codeDefaultCollapsed: boolean;
  mermaidEnabled: boolean;
  useNewCodeBlockView: boolean;
  showSystemPromptBubble: boolean;
  showUserAvatar: boolean;
  showUserName: boolean;
  showModelAvatar: boolean;
  showModelName: boolean;
  messageStyle: 'plain' | 'bubble';
  renderUserInputAsMarkdown: boolean;
  autoScrollToBottom: boolean;
  topToolbar: {
    showSettingsButton: boolean;
    showModelSelector: boolean;
    modelSelectorStyle: 'dialog' | 'dropdown';
    modelSelectorDisplayStyle?: 'icon' | 'text';
    showTopicName: boolean;
    showNewTopicButton: boolean;
    showClearButton: boolean;
    showMenuButton: boolean;
    leftComponents: string[];
    rightComponents: string[];
    componentPositions?: Array<{
      id: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
    }>;
  };
  isLoading: boolean;
  thoughtAutoCollapse?: boolean;
  multiModelDisplayStyle?: 'horizontal' | 'grid' | 'vertical';
  showToolDetails?: boolean;
  showCitationDetails?: boolean;
  messageBubbleMinWidth?: number;
  messageBubbleMaxWidth?: number;
  userMessageMaxWidth?: number;
  toolbarCollapsed?: boolean;
  versionSwitchStyle?: 'popup' | 'arrows';
  showAIDebateButton?: boolean;
  showQuickPhraseButton?: boolean;
  showMicroBubbles?: boolean;
  showTTSButton?: boolean;
  messageActionMode?: 'bubbles' | 'toolbar';
  customBubbleColors?: {
    userBubbleColor?: string;
    userTextColor?: string;
    aiBubbleColor?: string;
    aiTextColor?: string;
  };
  hideUserBubble?: boolean;
  hideAIBubble?: boolean;
  systemPromptVariables?: {
    enableTimeVariable?: boolean;
    enableLocationVariable?: boolean;
    customLocation?: string;
    enableOSVariable?: boolean;
  };
  pasteLongTextAsFile?: boolean;
  pasteLongTextThreshold?: number;
  toolbarStyle?: 'glassmorphism' | 'transparent';
  toolbarButtons?: {
    order: string[];
    visibility: { [key: string]: boolean };
  };
  chatBackground?: {
    enabled: boolean;
    imageUrl: string;
    opacity: number;
    size: 'cover' | 'contain' | 'auto';
    position: 'center' | 'top' | 'bottom' | 'left' | 'right';
    repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    showOverlay?: boolean;
  };
  notion?: {
    enabled: boolean;
    apiKey: string;
    databaseId: string;
    pageTitleField: string;
    dateField?: string;
  };
  showPerformanceMonitor?: boolean;
  showDevToolsFloatingButton?: boolean;
  alwaysShowModelTestButton?: boolean;
  hapticFeedback?: {
    enabled: boolean;
    enableOnSidebar: boolean;
    enableOnSwitch: boolean;
    enableOnListItem: boolean;
    enableOnNavigation: boolean;
  };
  contextCondense?: {
    enabled: boolean;
    threshold: number;
    modelId?: string;
    customPrompt?: string;
    useCurrentTopicModel?: boolean;
  };
  sidebarTabIndex?: number;
  messageGrouping?: 'byDate' | 'disabled' | 'none';
  integratedInputLeftButtons?: string[];
  integratedInputRightButtons?: string[];
  ENABLE_WORKSPACE_SIDEBAR?: boolean;
  ENABLE_NOTE_SIDEBAR?: boolean;
  showNavigationOnScroll?: boolean;
}

export interface SettingsRootState {
  settings: SettingsState;
}
