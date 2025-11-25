# 设置页面安全区域迁移计划

## 问题描述

当前子设置页面在 `SafeAreaContainer` 上设置了 `bgcolor`，导致底部安全区域不透明。
需要修改为：`SafeAreaContainer` 透明 + 内容区域使用 `Container` 组件（有底部 padding）。

## 目标效果

```
┌─────────────────────────┐
│      HeaderBar          │
├─────────────────────────┤
│                         │
│    Container 内容       │  ← 可滚动，有底部 padding
│                         │
├─────────────────────────┤
│   透明安全区域 48px     │  ← 透明，可以看到下面
└─────────────────────────┘
```

## 统一的 CSS 变量（定义在 GlobalStyles.tsx）

```css
--safe-area-bottom-min: 48px;                                    /* 最小底部安全区域 */
--safe-area-bottom-computed: max(env(...), 48px);               /* 计算后的底部安全区域 */
--content-bottom-padding: calc(var(--safe-area-bottom-computed) + 16px);  /* 内容区域底部 padding */
```

## 正确用法示例

```tsx
// ✅ 方式1：使用 Container 组件（推荐）
<SafeAreaContainer>
  <HeaderBar title="标题" onBackPress={handleBack} />
  <Container ref={containerRef} onScroll={handleScroll}>
    {/* 内容 */}
  </Container>
</SafeAreaContainer>

// ✅ 方式2：使用 Box + 统一变量
<SafeAreaContainer>
  <AppBar>...</AppBar>
  <Box sx={{ pb: 'var(--content-bottom-padding)' }}>
    {/* 内容 */}
  </Box>
</SafeAreaContainer>

// ❌ 错误 - 不要在 SafeAreaContainer 上设置 bgcolor
<SafeAreaContainer sx={{ bgcolor: 'xxx' }}>
  ...
</SafeAreaContainer>

// ❌ 错误 - 不要硬编码 padding 值
<Box sx={{ pb: 'calc(var(--safe-area-bottom-computed) + 16px)' }}>
```

## 需要修改的文件列表 (32个)

### 外观设置相关 (8个)
| 文件 | 路径 | 状态 |
|------|------|------|
| AppearanceSettings | `src/pages/Settings/AppearanceSettings.tsx` | ⬜ 待修改 |
| ThemeStyleSettings | `src/pages/Settings/ThemeStyleSettings.tsx` | ⬜ 待修改 |
| ChatInterfaceSettings | `src/pages/Settings/ChatInterfaceSettings.tsx` | ⬜ 待修改 |
| MessageBubbleSettings | `src/pages/Settings/MessageBubbleSettings.tsx` | ⬜ 待修改 |
| ThinkingProcessSettings | `src/pages/Settings/ThinkingProcessSettings.tsx` | ⬜ 待修改 |
| InputBoxSettings | `src/pages/Settings/InputBoxSettings.tsx` | ⬜ 待修改 |
| ToolbarCustomization | `src/pages/Settings/ToolbarCustomization.tsx` | ⬜ 待修改 |
| TopToolbarDIYSettings | `src/pages/Settings/TopToolbarDIYSettings.tsx` | ⬜ 待修改 |

### 行为设置 (1个)
| 文件 | 路径 | 状态 |
|------|------|------|
| BehaviorSettings | `src/pages/Settings/BehaviorSettings.tsx` | ⬜ 待修改 |

### 模型相关 (5个)
| 文件 | 路径 | 状态 |
|------|------|------|
| DefaultModelSettings | `src/pages/Settings/DefaultModelSettings.tsx` | ⬜ 待修改 |
| ModelComboSettings | `src/pages/Settings/ModelComboSettings.tsx` | ⬜ 待修改 |
| ModelProviders/index | `src/pages/Settings/ModelProviders/index.tsx` | ⬜ 待修改 |
| ModelProviders/AddProvider | `src/pages/Settings/ModelProviders/AddProvider.tsx` | ⬜ 待修改 |
| ModelProviders/AdvancedAPIConfig | `src/pages/Settings/ModelProviders/AdvancedAPIConfig.tsx` | ⬜ 待修改 |
| ModelProviders/MultiKeyManagement | `src/pages/Settings/ModelProviders/MultiKeyManagement.tsx` | ⬜ 待修改 |

### MCP 设置 (2个)
| 文件 | 路径 | 状态 |
|------|------|------|
| MCPServerSettings | `src/pages/Settings/MCPServerSettings.tsx` | ⬜ 待修改 |
| MCPServerDetail | `src/pages/Settings/MCPServerDetail.tsx` | ⬜ 待修改 |

### 数据设置 (1个)
| 文件 | 路径 | 状态 |
|------|------|------|
| DataSettings/AdvancedBackupPage | `src/pages/Settings/DataSettings/AdvancedBackupPage.tsx` | ⬜ 待修改 |

### 笔记设置 (3个)
| 文件 | 路径 | 状态 |
|------|------|------|
| NoteSettings | `src/pages/Settings/NoteSettings.tsx` | ⬜ 待修改 |
| NoteEditor | `src/pages/Settings/NoteEditor.tsx` | ⬜ 待修改 |
| NotionSettings | `src/pages/Settings/NotionSettings.tsx` | ⬜ 待修改 |

### 语音设置 (8个)
| 文件 | 路径 | 状态 |
|------|------|------|
| VoiceSettingsV2/index | `src/pages/Settings/VoiceSettingsV2/index.tsx` | ⬜ 待修改 |
| VoiceSettingsV2/AzureTTSSettings | `src/pages/Settings/VoiceSettingsV2/AzureTTSSettings.tsx` | ⬜ 待修改 |
| VoiceSettingsV2/GeminiTTSSettings | `src/pages/Settings/VoiceSettingsV2/GeminiTTSSettings.tsx` | ⬜ 待修改 |
| VoiceSettingsV2/OpenAITTSSettings | `src/pages/Settings/VoiceSettingsV2/OpenAITTSSettings.tsx` | ⬜ 待修改 |
| VoiceSettingsV2/SiliconFlowTTSSettings | `src/pages/Settings/VoiceSettingsV2/SiliconFlowTTSSettings.tsx` | ⬜ 待修改 |
| VoiceSettingsV2/CapacitorTTSSettings | `src/pages/Settings/VoiceSettingsV2/CapacitorTTSSettings.tsx` | ⬜ 待修改 |
| VoiceSettingsV2/OpenAIWhisperSettings | `src/pages/Settings/VoiceSettingsV2/OpenAIWhisperSettings.tsx` | ⬜ 待修改 |
| VoiceSettingsV2/CapacitorASRSettings | `src/pages/Settings/VoiceSettingsV2/CapacitorASRSettings.tsx` | ⬜ 待修改 |

## 修改步骤

每个文件需要：
1. 移除 `SafeAreaContainer` 上的 `sx={{ bgcolor: ... }}`
2. 将内容区域的 `Box` 替换为 `Container` 组件
3. 确保 `Container` 有正确的 `ref` 和 `onScroll` 绑定

## 已完成
- ✅ `src/pages/Settings/index.tsx` (主设置页面)
- ✅ `src/components/settings/SettingComponents.tsx` (SafeAreaContainer + Container 组件)
