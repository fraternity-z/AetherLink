import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { getStorageItem } from '../shared/utils/storage';
import { useSelector } from 'react-redux'; // 导入 useSelector
import type { RootState } from '../shared/store'; // 导入 RootState 类型
import { statusBarService } from '../shared/services/StatusBarService'; // 导入 statusBarService
// 使用懒加载导入组件
const ChatPage = lazy(() => import('../pages/ChatPage'));
const WelcomePage = lazy(() => import('../pages/WelcomePage'));
const SettingsPage = lazy(() => import('../pages/Settings'));
const AppearanceSettings = lazy(() => import('../pages/Settings/AppearanceSettings.tsx'));
const BehaviorSettings = lazy(() => import('../pages/Settings/BehaviorSettings'));
const ChatInterfaceSettings = lazy(() => import('../pages/Settings/ChatInterfaceSettings'));
const TopToolbarDIYSettings = lazy(() => import('../pages/Settings/TopToolbarDIYSettings'));
const DefaultModelSettings = lazy(() => import('../pages/Settings/DefaultModelSettings'));
// 导入知识库页面
const KnowledgeBaseDetail = lazy(() => import('../pages/KnowledgeBase/KnowledgeBaseDetail'));
const KnowledgeSettings = lazy(() => import('../pages/Settings/KnowledgeSettings'));

// 辅助模型设置（话题命名、AI意图分析等）
const AssistantModelSettingsPage = lazy(() => import('../pages/Settings/DefaultModelSettings/index'));
const ModelProviderSettings = lazy(() => import('../pages/Settings/ModelProviders'));
const MultiKeyManagementPage = lazy(() => import('../pages/Settings/ModelProviders/MultiKeyManagement'));
const AdvancedAPIConfigPage = lazy(() => import('../pages/Settings/ModelProviders/AdvancedAPIConfig'));
const AddProviderPage = lazy(() => import('../pages/Settings/ModelProviders/AddProvider'));
const AboutPage = lazy(() => import('../pages/Settings/AboutPage'));
// 导入语音设置页面
const VoiceSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2'));
const SiliconFlowTTSSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/SiliconFlowTTSSettings'));
const OpenAITTSSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/OpenAITTSSettings'));
const AzureTTSSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/AzureTTSSettings'));
const GeminiTTSSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/GeminiTTSSettings'));
const ElevenLabsTTSSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/ElevenLabsTTSSettings'));
const MiniMaxTTSSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/MiniMaxTTSSettings'));
const VolcanoTTSSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/VolcanoTTSSettings'));
const CapacitorTTSSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/CapacitorTTSSettings'));
const CapacitorASRSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/CapacitorASRSettings'));
const OpenAIWhisperSettings = lazy(() => import('../pages/Settings/VoiceSettingsV2/OpenAIWhisperSettings'));
const WebSearchSettings = lazy(() => import('../pages/Settings/WebSearchSettings'));
const AgentPromptsSettings = lazy(() => import('../pages/Settings/AgentPrompts'));
const DevToolsPage = lazy(() => import('../pages/DevToolsPage'));
import DataSettingsPage from '../pages/Settings/DataSettings';
// 导入高级备份页面
const AdvancedBackupPage = lazy(() => import('../pages/Settings/DataSettings/AdvancedBackupPage'));
// 导入 MCP 相关页面
const MCPServerSettings = lazy(() => import('../pages/Settings/MCPServerSettings'));
const MCPServerDetail = lazy(() => import('../pages/Settings/MCPServerDetail'));
// 导入模型组合页面
const ModelComboSettings = lazy(() => import('../pages/Settings/ModelComboSettings'));
const ModelComboEditPage = lazy(() => import('../pages/Settings/ModelComboEditPage'));
// 导入AI辩论设置页面
const AIDebateSettings = lazy(() => import('../pages/Settings/AIDebateSettings'));
// 导入上下文压缩设置页面
const ContextCondenseSettings = lazy(() => import('../pages/Settings/ContextCondenseSettings'));
import MessageBubbleSettings from "../pages/Settings/MessageBubbleSettings";
// 导入工具栏定制页面
const ToolbarCustomization = lazy(() => import('../pages/Settings/ToolbarCustomization'));
// 导入快捷短语设置页面
const QuickPhraseSettings = lazy(() => import('../components/quick-phrase/QuickPhraseSettings'));
// 导入助手模型设置页面
const AssistantModelSettings = lazy(() => import('../components/TopicManagement/SettingsTab/AssistantModelSettings'));
// 导入工作区页面
const WorkspaceSettings = lazy(() => import('../pages/Settings/WorkspaceSettings'));
const WorkspaceDetail = lazy(() => import('../pages/Settings/WorkspaceDetail'));
// APK 内容浏览器
const ApkBrowser = lazy(() => import('../pages/ApkBrowser'));
// DEX 编辑器
const DexEditor = lazy(() => import('../pages/DexEditor'));
// 导入笔记设置页面
const NoteSettings = lazy(() => import('../pages/Settings/NoteSettings'));
const NoteEditor = lazy(() => import('../pages/Settings/NoteEditor'));
// 导入权限管理页面
const FilePermissionPage = lazy(() => import('../pages/Settings/FilePermissionPage'));
// 导入思考过程设置页面
const ThinkingProcessSettings = lazy(() => import('../pages/Settings/ThinkingProcessSettings'));
// 导入输入框管理设置页面
const InputBoxSettings = lazy(() => import('../pages/Settings/InputBoxSettings'));
// 导入主题风格设置页面
const ThemeStyleSettings = lazy(() => import('../pages/Settings/ThemeStyleSettings'));
// 导入Notion设置页面
const NotionSettings = lazy(() => import('../pages/Settings/NotionSettings'));
const NetworkProxySettings = lazy(() => import('../pages/Settings/NetworkProxySettings'));
// 导入记忆设置页面
const MemorySettings = lazy(() => import('../pages/Settings/MemorySettings'));
// 导入翻译页面
const TranslatePage = lazy(() => import('../pages/TranslatePage'));

// 加载中组件
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#f5f5f5'
  }}>
    <div>加载中...</div>
  </div>
);

// 路由提供者组件
const AppRouter: React.FC = () => {
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean | null>(null);
  const theme = useSelector((state: RootState) => state.settings.theme);
  const themeStyle = useSelector((state: RootState) => state.settings.themeStyle);

  useEffect(() => {
    async function checkFirstTimeUser() {
      try {
        const firstTimeUserValue = await getStorageItem<string>('first-time-user');
        setIsFirstTimeUser(firstTimeUserValue === null);
      } catch (error) {
        console.error('检查首次用户状态出错:', error);
        setIsFirstTimeUser(false); // 出错时默认为非首次用户
      }
    }

    checkFirstTimeUser();
  }, []);

  // 监听主题变化并更新状态栏
  useEffect(() => {
    const currentTheme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

    // 只更新主题，不重复初始化
    if (statusBarService.isReady()) {
      statusBarService.updateTheme(currentTheme, themeStyle);
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        statusBarService.updateTheme(e.matches ? 'dark' : 'light', themeStyle);
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, themeStyle]); // 依赖项包括 theme 和 themeStyle

  if (isFirstTimeUser === null) {
    // 显示加载状态
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* 🚀 性能优化：首屏路由优先渲染 */}
        <Route path="/" element={isFirstTimeUser ? <Navigate to="/welcome" replace /> : <Navigate to="/chat" replace />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/appearance" element={<AppearanceSettings />} />
        <Route path="/settings/appearance/theme-style" element={<ThemeStyleSettings />} />
        <Route path="/settings/appearance/chat-interface" element={<ChatInterfaceSettings />} />
        <Route path="/settings/appearance/message-bubble" element={<MessageBubbleSettings />} />
        <Route path="/settings/appearance/toolbar-customization" element={<ToolbarCustomization />} />
        <Route path="/settings/appearance/thinking-process" element={<ThinkingProcessSettings />} />
        <Route path="/settings/appearance/input-box" element={<InputBoxSettings />} />
        <Route path="/settings/appearance/top-toolbar" element={<TopToolbarDIYSettings />} />
        <Route path="/settings/behavior" element={<BehaviorSettings />} />
        <Route path="/settings/default-model" element={<DefaultModelSettings />} />
        <Route path="/settings/assistant-model" element={<AssistantModelSettingsPage />} />
        <Route path="/settings/agent-prompts" element={<AgentPromptsSettings />} />
        <Route path="/settings/ai-debate" element={<AIDebateSettings />} />
        <Route path="/settings/quick-phrases" element={<QuickPhraseSettings />} />
        <Route path="/settings/model-provider/:providerId" element={<ModelProviderSettings />} />
        <Route path="/settings/model-provider/:providerId/multi-key" element={<MultiKeyManagementPage />} />
        <Route path="/settings/model-provider/:providerId/advanced-api" element={<AdvancedAPIConfigPage />} />
        <Route path="/settings/add-provider" element={<AddProviderPage />} />
        <Route path="/settings/about" element={<AboutPage />} />
        <Route path="/settings/voice" element={<VoiceSettings />} />
        <Route path="/settings/voice/tts/capacitor" element={<CapacitorTTSSettings />} />
        <Route path="/settings/voice/tts/siliconflow" element={<SiliconFlowTTSSettings />} />
        <Route path="/settings/voice/tts/openai" element={<OpenAITTSSettings />} />
        <Route path="/settings/voice/tts/azure" element={<AzureTTSSettings />} />
        <Route path="/settings/voice/tts/gemini" element={<GeminiTTSSettings />} />
        <Route path="/settings/voice/tts/elevenlabs" element={<ElevenLabsTTSSettings />} />
        <Route path="/settings/voice/tts/minimax" element={<MiniMaxTTSSettings />} />
        <Route path="/settings/voice/tts/volcano" element={<VolcanoTTSSettings />} />
        <Route path="/settings/voice/asr/capacitor" element={<CapacitorASRSettings />} />
        <Route path="/settings/voice/asr/openai-whisper" element={<OpenAIWhisperSettings />} />
        <Route path="/settings/data" element={<DataSettingsPage />} />
        <Route path="/settings/data/advanced-backup" element={<AdvancedBackupPage />} />
        <Route path="/settings/notion" element={<NotionSettings />} />
        <Route path="/settings/network-proxy" element={<NetworkProxySettings />} />
        <Route path="/settings/memory" element={<MemorySettings />} />
        <Route path="/settings/web-search" element={<WebSearchSettings />} />
        <Route path="/settings/mcp-server" element={<MCPServerSettings />} />
        <Route path="/settings/mcp-server/:serverId" element={<MCPServerDetail />} />
        <Route path="/settings/model-combo" element={<ModelComboSettings />} />
        <Route path="/settings/model-combo/:comboId" element={<ModelComboEditPage />} />
        <Route path="/settings/context-condense" element={<ContextCondenseSettings />} />
        <Route path="/settings/knowledge" element={<KnowledgeSettings />} />
        <Route path="/settings/workspace" element={<WorkspaceSettings />} />
        <Route path="/settings/workspace/:workspaceId" element={<WorkspaceDetail />} />
        <Route path="/apk-browser" element={<ApkBrowser />} />
        <Route path="/dex-editor" element={<DexEditor />} />
        <Route path="/settings/notes" element={<NoteSettings />} />
        <Route path="/settings/notes/edit" element={<NoteEditor />} />
        <Route path="/settings/file-permission" element={<FilePermissionPage />} />
        <Route path="/settings/assistant-model-settings" element={<AssistantModelSettings />} />
        <Route path="/devtools" element={<DevToolsPage />} />
        {/* 翻译页面 */}
        <Route path="/translate" element={<TranslatePage />} />
        {/* 知识库详情页 - 从设置页跳转 */}
        <Route path="/knowledge/:id" element={<KnowledgeBaseDetail />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
