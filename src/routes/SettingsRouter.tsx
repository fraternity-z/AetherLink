/**
 * SettingsRouter - 设置页面的独立路由系统
 * 🚀 性能优化：在全屏抽屉内使用 MemoryRouter，避免影响主应用路由
 * 这样从任何设置子页面返回聊天界面时，都不会触发 ChatPage 重新渲染
 */
import React, { Suspense, lazy } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// 懒加载所有设置页面组件
const SettingsPage = lazy(() => import('../pages/Settings'));
const AppearanceSettings = lazy(() => import('../pages/Settings/AppearanceSettings'));
const BehaviorSettings = lazy(() => import('../pages/Settings/BehaviorSettings'));
const ChatInterfaceSettings = lazy(() => import('../pages/Settings/ChatInterfaceSettings'));
const TopToolbarDIYSettings = lazy(() => import('../pages/Settings/TopToolbarDIYSettings'));
const DefaultModelSettings = lazy(() => import('../pages/Settings/DefaultModelSettings'));
const KnowledgeSettings = lazy(() => import('../pages/Settings/KnowledgeSettings'));
const AssistantModelSettingsPage = lazy(() => import('../pages/Settings/DefaultModelSettings/index'));
const ModelProviderSettings = lazy(() => import('../pages/Settings/ModelProviders'));
const MultiKeyManagementPage = lazy(() => import('../pages/Settings/ModelProviders/MultiKeyManagement'));
const AdvancedAPIConfigPage = lazy(() => import('../pages/Settings/ModelProviders/AdvancedAPIConfig'));
const AddProviderPage = lazy(() => import('../pages/Settings/ModelProviders/AddProvider'));
const AboutPage = lazy(() => import('../pages/Settings/AboutPage'));
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
import DataSettingsPage from '../pages/Settings/DataSettings';
const AdvancedBackupPage = lazy(() => import('../pages/Settings/DataSettings/AdvancedBackupPage'));
const MCPServerSettings = lazy(() => import('../pages/Settings/MCPServerSettings'));
const MCPServerDetail = lazy(() => import('../pages/Settings/MCPServerDetail'));
const ModelComboSettings = lazy(() => import('../pages/Settings/ModelComboSettings'));
const ModelComboEditPage = lazy(() => import('../pages/Settings/ModelComboEditPage'));
const AIDebateSettings = lazy(() => import('../pages/Settings/AIDebateSettings'));
const ContextCondenseSettings = lazy(() => import('../pages/Settings/ContextCondenseSettings'));
import MessageBubbleSettings from '../pages/Settings/MessageBubbleSettings';
const ToolbarCustomization = lazy(() => import('../pages/Settings/ToolbarCustomization'));
const QuickPhraseSettings = lazy(() => import('../components/QuickPhraseSettings'));
const AssistantModelSettings = lazy(() => import('../components/TopicManagement/SettingsTab/AssistantModelSettings'));
const WorkspaceSettings = lazy(() => import('../pages/Settings/WorkspaceSettings'));
const WorkspaceDetail = lazy(() => import('../pages/Settings/WorkspaceDetail'));
const NoteSettings = lazy(() => import('../pages/Settings/NoteSettings'));
const NoteEditor = lazy(() => import('../pages/Settings/NoteEditor'));
const FilePermissionPage = lazy(() => import('../pages/Settings/FilePermissionPage'));
const ThinkingProcessSettings = lazy(() => import('../pages/Settings/ThinkingProcessSettings'));
const InputBoxSettings = lazy(() => import('../pages/Settings/InputBoxSettings'));
const ThemeStyleSettings = lazy(() => import('../pages/Settings/ThemeStyleSettings'));
const NotionSettings = lazy(() => import('../pages/Settings/NotionSettings'));
const NetworkProxySettings = lazy(() => import('../pages/Settings/NetworkProxySettings'));
const KnowledgeBaseDetail = lazy(() => import('../pages/KnowledgeBase/KnowledgeBaseDetail'));

// 加载中的占位组件
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

interface SettingsRouterProps {
  onClose: () => void;
}

/**
 * 设置页面的独立路由组件
 * 使用 MemoryRouter 在抽屉内管理导航，不影响主应用路由
 */
const SettingsRouter: React.FC<SettingsRouterProps> = ({ onClose }) => {
  return (
    <MemoryRouter initialEntries={['/settings']}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 设置主页 */}
          <Route path="/settings" element={<SettingsPage onClose={onClose} />} />
          
          {/* 外观设置 */}
          <Route path="/settings/appearance" element={<AppearanceSettings />} />
          <Route path="/settings/appearance/theme-style" element={<ThemeStyleSettings />} />
          <Route path="/settings/appearance/chat-interface" element={<ChatInterfaceSettings />} />
          <Route path="/settings/appearance/message-bubble" element={<MessageBubbleSettings />} />
          <Route path="/settings/appearance/toolbar-customization" element={<ToolbarCustomization />} />
          <Route path="/settings/appearance/thinking-process" element={<ThinkingProcessSettings />} />
          <Route path="/settings/appearance/input-box" element={<InputBoxSettings />} />
          <Route path="/settings/appearance/top-toolbar" element={<TopToolbarDIYSettings />} />
          
          {/* 行为设置 */}
          <Route path="/settings/behavior" element={<BehaviorSettings />} />
          
          {/* 模型设置 */}
          <Route path="/settings/default-model" element={<DefaultModelSettings />} />
          <Route path="/settings/assistant-model" element={<AssistantModelSettingsPage />} />
          <Route path="/settings/agent-prompts" element={<AgentPromptsSettings />} />
          <Route path="/settings/ai-debate" element={<AIDebateSettings />} />
          <Route path="/settings/model-combo" element={<ModelComboSettings />} />
          <Route path="/settings/model-combo/:comboId" element={<ModelComboEditPage />} />
          <Route path="/settings/context-condense" element={<ContextCondenseSettings />} />
          
          {/* 模型提供商 */}
          <Route path="/settings/model-provider/:providerId" element={<ModelProviderSettings />} />
          <Route path="/settings/model-provider/:providerId/multi-key" element={<MultiKeyManagementPage />} />
          <Route path="/settings/model-provider/:providerId/advanced-api" element={<AdvancedAPIConfigPage />} />
          <Route path="/settings/add-provider" element={<AddProviderPage />} />
          
          {/* 快捷设置 */}
          <Route path="/settings/quick-phrases" element={<QuickPhraseSettings />} />
          
          {/* 语音设置 */}
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
          
          {/* 数据设置 */}
          <Route path="/settings/data" element={<DataSettingsPage />} />
          <Route path="/settings/data/advanced-backup" element={<AdvancedBackupPage />} />
          
          {/* 其他设置 */}
          <Route path="/settings/workspace" element={<WorkspaceSettings />} />
          <Route path="/settings/workspace/:workspaceId" element={<WorkspaceDetail />} />
          <Route path="/settings/knowledge" element={<KnowledgeSettings />} />
          <Route path="/settings/notes" element={<NoteSettings />} />
          <Route path="/settings/notes/edit" element={<NoteEditor />} />
          <Route path="/settings/notion" element={<NotionSettings />} />
          <Route path="/settings/network-proxy" element={<NetworkProxySettings />} />
          <Route path="/settings/web-search" element={<WebSearchSettings />} />
          <Route path="/settings/mcp-server" element={<MCPServerSettings />} />
          <Route path="/settings/mcp-server/:serverId" element={<MCPServerDetail />} />
          <Route path="/settings/file-permission" element={<FilePermissionPage />} />
          <Route path="/settings/assistant-model-settings" element={<AssistantModelSettings />} />
          <Route path="/settings/about" element={<AboutPage />} />
          
          {/* 知识库详情页 */}
          <Route path="/knowledge/:id" element={<KnowledgeBaseDetail />} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
};

export default SettingsRouter;
