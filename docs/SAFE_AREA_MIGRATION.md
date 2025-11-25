# SafeAreaContainer 迁移进度

## 架构说明
- **顶部安全区域 (30px)**：由 `themes.ts` MuiAppBar 全局配置，自动生效
- **底部安全区域 (34px)**：由 `SafeAreaContainer` 组件统一处理

## 页面迁移清单

### 特殊页面（不需要迁移）
| 页面 | 状态 | 说明 |
|------|------|------|
| ChatPage | ✅ | 输入框 fixed 定位，有独立安全区域逻辑 |
| WelcomePage | ✅ | 欢迎页，居中布局 |

### 已完成迁移
| 页面 | 状态 |
|------|------|
| DevToolsPage | ✅ |
| Settings/index.tsx | ✅ |
| Settings/AboutPage.tsx | ✅ |
| Settings/DataSettings/index.tsx | ✅ |
| Settings/WebSearchSettings.tsx | ✅ |

### 待迁移 - Settings 主要页面
| 页面 | 状态 |
|------|------|
| Settings/AppearanceSettings.tsx | ⬜ |
| Settings/BehaviorSettings.tsx | ⬜ |
| Settings/ChatInterfaceSettings.tsx | ⬜ |
| Settings/AIDebateSettings.tsx | ⬜ |
| Settings/KnowledgeSettings.tsx | ⬜ |
| Settings/MessageBubbleSettings.tsx | ⬜ |
| Settings/ModelComboSettings.tsx | ⬜ |
| Settings/MCPServerSettings.tsx | ⬜ |
| Settings/MCPServerDetail.tsx | ⬜ |
| Settings/NoteSettings.tsx | ⬜ |
| Settings/NoteEditor.tsx | ⬜ |
| Settings/NotionSettings.tsx | ⬜ |
| Settings/ThemeStyleSettings.tsx | ⬜ |
| Settings/ThinkingProcessSettings.tsx | ⬜ |
| Settings/InputBoxSettings.tsx | ⬜ |
| Settings/FilePermissionPage.tsx | ⬜ |
| Settings/DefaultModelSettings.tsx | ⬜ |
| Settings/DefaultModelSettings/index.tsx | ⬜ |

### 待迁移 - Settings/AgentPrompts
| 页面 | 状态 |
|------|------|
| Settings/AgentPrompts/index.tsx | ⬜ |

### 待迁移 - Settings/ModelProviders
| 页面 | 状态 |
|------|------|
| Settings/ModelProviders/index.tsx | ⬜ |
| Settings/ModelProviders/AddProvider.tsx | ⬜ |
| Settings/ModelProviders/AdvancedAPIConfig.tsx | ⬜ |
| Settings/ModelProviders/MultiKeyManagement.tsx | ⬜ |

### 待迁移 - Settings/VoiceSettingsV2
| 页面 | 状态 |
|------|------|
| Settings/VoiceSettingsV2/index.tsx | ⬜ |
| Settings/VoiceSettingsV2/SiliconFlowTTSSettings.tsx | ⬜ |
| Settings/VoiceSettingsV2/OpenAITTSSettings.tsx | ⬜ |
| Settings/VoiceSettingsV2/OpenAIWhisperSettings.tsx | ⬜ |
| Settings/VoiceSettingsV2/AzureTTSSettings.tsx | ⬜ |
| Settings/VoiceSettingsV2/GeminiTTSSettings.tsx | ⬜ |
| Settings/VoiceSettingsV2/CapacitorTTSSettings.tsx | ⬜ |
| Settings/VoiceSettingsV2/CapacitorASRSettings.tsx | ⬜ |

### 待迁移 - Settings/DataSettings
| 页面 | 状态 |
|------|------|
| Settings/DataSettings/AdvancedBackupPage.tsx | ⬜ |

### 待迁移 - Settings/Workspace
| 页面 | 状态 |
|------|------|
| Settings/WorkspaceSettings.tsx | ⬜ |
| Settings/WorkspaceDetail.tsx | ⬜ |

### 待迁移 - Settings/ToolbarCustomization
| 页面 | 状态 |
|------|------|
| Settings/ToolbarCustomization.tsx | ⬜ |
| Settings/TopToolbarDIYSettings.tsx | ⬜ |

### 待迁移 - KnowledgeBase
| 页面 | 状态 |
|------|------|
| KnowledgeBase/KnowledgeBaseDetail.tsx | ⬜ |

### 子组件（不需要迁移）
以下是子组件，由父页面包装，不需要单独迁移：
- ChatPage/components/*
- Settings/DataSettings/components/*
- Settings/ModelProviders/components/*
- Settings/MCPServerSettings/MCPServerDialogs.tsx

---

## 迁移统计
- **已完成**: 5
- **待迁移**: 约 35 个页面
- **不需要迁移**: 约 14 个（子组件 + 特殊页面）

## 迁移方法
```tsx
// 1. 添加导入
import { SafeAreaContainer } from '@/components/settings/SettingComponents';

// 2. 替换外层容器
// 改动前
<Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', ... }}>

// 改动后
<SafeAreaContainer sx={{ ... }}>
```
