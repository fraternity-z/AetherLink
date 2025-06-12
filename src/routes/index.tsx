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
const TopToolbarSettings = lazy(() => import('../pages/Settings/TopToolbarSettings'));
const TopToolbarDIYSettings = lazy(() => import('../pages/Settings/TopToolbarDIYSettings'));
const TopToolbarTestPage = lazy(() => import('../pages/Settings/TopToolbarTestPage'));
const DefaultModelSettings = lazy(() => import('../pages/Settings/DefaultModelSettings'));
// 导入知识库页面
const KnowledgeBasePage = lazy(() => import('../pages/KnowledgeBase'));
const KnowledgeSettings = lazy(() => import('../pages/Settings/KnowledgeSettings'));

const DefaultModelSettingsPage = lazy(() => import('../pages/Settings/DefaultModelSettings/index'));
const ModelProviderSettings = lazy(() => import('../pages/Settings/ModelProviderSettings'));
const AddProviderPage = lazy(() => import('../pages/Settings/AddProviderPage'));
const AboutPage = lazy(() => import('../pages/Settings/AboutPage'));
const VoiceSettings = lazy(() => import('../pages/Settings/VoiceSettings'));
const WebSearchSettings = lazy(() => import('../pages/Settings/WebSearchSettings'));
const AgentPromptsSettings = lazy(() => import('../pages/Settings/AgentPrompts'));
const DevToolsPage = lazy(() => import('../pages/DevToolsPage'));
const VueDemoPage = lazy(() => import('../pages/VueDemo'));
import DataSettingsPage from '../pages/Settings/DataSettings';
// 导入高级备份页面
const AdvancedBackupPage = lazy(() => import('../pages/Settings/DataSettings/AdvancedBackupPage'));
// 导入 MCP 相关页面
const MCPServerSettings = lazy(() => import('../pages/Settings/MCPServerSettings'));
const MCPServerDetail = lazy(() => import('../pages/Settings/MCPServerDetail'));
// 导入模型组合页面
const ModelComboSettings = lazy(() => import('../pages/Settings/ModelComboSettings'));
// 导入AI辩论设置页面
const AIDebateSettings = lazy(() => import('../pages/Settings/AIDebateSettings'));
import MessageBubbleSettings from "../pages/Settings/MessageBubbleSettings";
// 导入快捷短语设置页面
const QuickPhraseSettings = lazy(() => import('../components/QuickPhraseSettings'));
// 导入助手设置页面
const AssistantSettings = lazy(() => import('../components/TopicManagement/SettingsTab/AssistantSettings'));
const AssistantModelSettings = lazy(() => import('../components/TopicManagement/SettingsTab/AssistantModelSettings'));
// 导入工作区页面
const WorkspaceSettings = lazy(() => import('../pages/Settings/WorkspaceSettings'));
const WorkspaceDetail = lazy(() => import('../pages/Settings/WorkspaceDetail'));

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
        <Route path="/" element={isFirstTimeUser ? <Navigate to="/welcome" replace /> : <Navigate to="/chat" replace />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/appearance" element={<AppearanceSettings />} />
        <Route path="/settings/appearance/chat-interface" element={<ChatInterfaceSettings />} />
        <Route path="/settings/appearance/message-bubble" element={<MessageBubbleSettings />} />
        <Route path="/settings/appearance/top-toolbar" element={<TopToolbarSettings />} />
        <Route path="/settings/appearance/top-toolbar-diy" element={<TopToolbarDIYSettings />} />
        <Route path="/settings/appearance/top-toolbar-test" element={<TopToolbarTestPage />} />
        <Route path="/settings/behavior" element={<BehaviorSettings />} />
        <Route path="/settings/default-model" element={<DefaultModelSettings />} />
        <Route path="/settings/default-model-settings" element={<DefaultModelSettingsPage />} />
        <Route path="/settings/agent-prompts" element={<AgentPromptsSettings />} />
        <Route path="/settings/ai-debate" element={<AIDebateSettings />} />
        <Route path="/settings/quick-phrases" element={<QuickPhraseSettings />} />
        <Route path="/settings/model-provider/:providerId" element={<ModelProviderSettings />} />
        <Route path="/settings/add-provider" element={<AddProviderPage />} />
        <Route path="/settings/about" element={<AboutPage />} />
        <Route path="/settings/voice" element={<VoiceSettings />} />
        <Route path="/settings/data" element={<DataSettingsPage />} />
        <Route path="/settings/data/advanced-backup" element={<AdvancedBackupPage />} />
        <Route path="/settings/web-search" element={<WebSearchSettings />} />
        <Route path="/settings/mcp-server" element={<MCPServerSettings />} />
        <Route path="/settings/mcp-server/:serverId" element={<MCPServerDetail />} />
        <Route path="/settings/model-combo" element={<ModelComboSettings />} />
        <Route path="/settings/knowledge" element={<KnowledgeSettings />} />
        <Route path="/settings/workspace" element={<WorkspaceSettings />} />
        <Route path="/settings/workspace/:workspaceId" element={<WorkspaceDetail />} />
        <Route path="/settings/assistant-settings" element={<AssistantSettings />} />
        <Route path="/settings/assistant-model-settings" element={<AssistantModelSettings />} />
        <Route path="/devtools" element={<DevToolsPage />} />
        <Route path="/vue-demo" element={<VueDemoPage />} />
        <Route path="/knowledge/*" element={<KnowledgeBasePage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
