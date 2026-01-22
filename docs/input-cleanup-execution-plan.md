# 输入框组件清理执行计划

> 生成时间: 2026-01-22
> 目的: 删除 ChatInput、CompactChatInput、InputToolbar 组件，仅保留 IntegratedChatInput

---

## 📋 项目背景

### 当前状态
项目中存在三种输入框实现：

| 输入框组件 | 按钮数量 | 特点 | 状态 |
|-----------|---------|------|------|
| ChatInput + InputToolbar | 9个 | 2个固定 + 7个工具栏 | ❌ 待删除 |
| CompactChatInput | 12个 | 5基础 + 5扩展 + 2固定 | ❌ 待删除 |
| **IntegratedChatInput** | 16个 | 全部集成，可拖拽自定义 | ✅ 保留 |

### 目标
- 删除冗余的 ChatInput 和 CompactChatInput 组件
- 删除配套的 InputToolbar 滑动工具栏
- 清理仅被这些组件使用的辅助文件
- 保持 IntegratedChatInput 的所有功能完整可用

---

## 🗑️ 第一阶段：删除文件清单

### 1.1 主组件文件（3个）

| 序号 | 文件路径 | 行数 | 说明 |
|-----|----------|-----|------|
| 1 | `src/components/input/ChatInput.tsx` | ~400 | ChatInput 主组件 |
| 2 | `src/components/input/CompactChatInput.tsx` | ~700 | CompactChatInput 主组件 |
| 3 | `src/components/input/InputToolbar.tsx` | ~300 | 滑动工具栏组件 |

### 1.2 专用子组件文件（1个）

| 序号 | 文件路径 | 说明 |
|-----|----------|------|
| 4 | `src/components/input/ChatInput/ChatInputButtons.tsx` | ChatInput 专用按钮组件 |

### 1.3 专用配置文件（1个）

| 序号 | 文件路径 | 说明 | 被谁使用 |
|-----|----------|------|---------|
| 5 | `src/shared/config/inputIcons.tsx` | 图标配置（getBasicIcons/getExpandedIcons） | 仅 CompactChatInput |

### 1.4 专用 Hooks 文件（2个）

| 序号 | 文件路径 | 说明 | 被谁使用 |
|-----|----------|------|---------|
| 6 | `src/shared/hooks/useInputMenus.ts` | 菜单状态管理 | ChatInput, CompactChatInput |
| 7 | `src/shared/hooks/useInputExpand.ts` | 展开/折叠状态管理 | ChatInput, CompactChatInput |

### 📊 删除统计
- **总计删除文件数**: 7 个
- **预计删除代码行数**: ~2000+ 行

---

## ✅ 第二阶段：保留文件清单（IntegratedChatInput 依赖）

### 2.1 IntegratedChatInput 主组件及子组件

| 文件路径 | 说明 | 状态 |
|----------|------|------|
| `src/components/input/IntegratedChatInput.tsx` | 主组件 | ✅ 保留 |
| `src/components/input/IntegratedChatInput/ButtonToolbar.tsx` | 按钮工具栏 hook | ✅ 保留 |
| `src/components/input/IntegratedChatInput/ExpandableContainer.tsx` | 可展开容器 hook | ✅ 保留 |
| `src/components/input/IntegratedChatInput/MenuManager.tsx` | 菜单管理器 hook | ✅ 保留 |
| `src/components/input/IntegratedChatInput/VoiceInputManager.tsx` | 语音输入管理 hook | ✅ 保留 |

### 2.2 共享子组件（被 IntegratedChatInput 使用）

| 文件路径 | 说明 | 使用位置 |
|----------|------|---------|
| `src/components/input/ChatInput/FileUploadManager.tsx` | 文件上传管理器 | IntegratedChatInput:13 |
| `src/components/input/ChatInput/InputTextArea.tsx` | 输入文本框 | IntegratedChatInput:14 |
| `src/components/input/ToolsMenu.tsx` | 工具菜单 | 共享组件 |
| `src/components/input/UploadMenu.tsx` | 上传菜单 | 共享组件 |
| `src/components/input/MultiModelSelector.tsx` | 多模型选择器 | 共享组件 |
| `src/components/input/MentionedModelsDisplay.tsx` | 模型展示 | 共享组件 |

### 2.3 共享按钮组件目录

| 文件路径 | 说明 |
|----------|------|
| `src/components/input/buttons/index.ts` | 按钮组件导出 |
| `src/components/input/buttons/KnowledgeButton.tsx` | 知识库按钮 |
| `src/components/input/buttons/MCPServerQuickPanel.tsx` | MCP 快速面板 |
| `src/components/input/buttons/MCPToolsButton.tsx` | MCP 工具按钮 |
| `src/components/input/buttons/WebSearchButton.tsx` | 网络搜索按钮 |

### 2.4 共享 Hooks（必须保留）

| Hook 名称 | 文件路径 | IntegratedChatInput 使用行 |
|----------|---------|--------------------------|
| `useChatInputLogic` | `src/shared/hooks/useChatInputLogic.ts` | 第 5 行导入，第 101-132 行使用 |
| `useInputState` | `src/shared/hooks/useInputState.ts` | 第 8 行导入，第 53-65 行使用 |
| `useInputStyles` | `src/shared/hooks/useInputStyles.ts` | 第 7 行导入，第 83 行使用 |
| `useKnowledgeContext` | `src/shared/hooks/useKnowledgeContext.ts` | 第 6 行导入，第 84 行使用 |

---

## ✏️ 第三阶段：修改文件清单

### 3.1 组件导出文件

**文件**: `src/components/input/index.ts`

**当前内容**:
```typescript
// 输入框组件统一导出
export { default as ChatInput } from './ChatInput';
export { default as CompactChatInput } from './CompactChatInput';
export { default as IntegratedChatInput } from './IntegratedChatInput';
export { default as ToolsMenu } from './ToolsMenu';
export { default as UploadMenu } from './UploadMenu';
export { default as MultiModelSelector } from './MultiModelSelector';
export { default as InputToolbar, getGlassmorphismToolbarStyles, getTransparentToolbarStyles } from './InputToolbar';

// 向后兼容的别名导出
export { default as ChatToolbar } from './InputToolbar';

// 重新导出类型
export type { default as ChatInputProps } from './ChatInput';
export type { default as CompactChatInputProps } from './CompactChatInput';
export type { default as UploadMenuProps } from './UploadMenu';
export type { MultiModelSelectorProps } from './MultiModelSelector';
```

**修改后**:
```typescript
// 输入框组件统一导出
export { default as IntegratedChatInput } from './IntegratedChatInput';
export { default as ToolsMenu } from './ToolsMenu';
export { default as UploadMenu } from './UploadMenu';
export { default as MultiModelSelector } from './MultiModelSelector';

// 重新导出类型
export type { IntegratedChatInputProps } from '../shared/types/inputProps';
export type { default as UploadMenuProps } from './UploadMenu';
export type { MultiModelSelectorProps } from './MultiModelSelector';
```

---

### 3.2 聊天页面 UI 文件

**文件**: `src/pages/ChatPage/components/ChatPageUI.tsx`

**修改位置**: 第 8 行

**当前导入**:
```typescript
import { ChatInput, CompactChatInput, IntegratedChatInput, InputToolbar } from '../../../components/input';
```

**修改后**:
```typescript
import { IntegratedChatInput } from '../../../components/input';
```

**其他修改**:
1. 移除 `shouldShowToolbar` 相关逻辑（约第 306 行）
2. 移除根据 `inputLayoutStyle` 切换输入框的条件渲染逻辑
3. 统一使用 `IntegratedChatInput` 组件

---

### 3.3 输入框设置页面

**文件**: `src/pages/Settings/InputBoxSettings.tsx`

**修改位置**: 第 22 行

**当前导入**:
```typescript
import { ChatInput, CompactChatInput, IntegratedChatInput, InputToolbar } from '../../components/input';
```

**修改后**:
```typescript
import { IntegratedChatInput } from '../../components/input';
```

**其他修改**:
1. 移除 `InputBoxPreview` 组件中的 case 'compact' 和 default 分支
2. 移除输入框样式选择器中的 'default' 和 'compact' 选项
3. 或者完全移除样式选择功能，因为只有一种输入框

---

### 3.4 Hooks 导出文件

**文件**: `src/shared/hooks/index.ts`

**当前内容**:
```typescript
// 导出所有钩子函数

// 助手相关
export { useAssistant } from './useAssistant';

// 输入框相关 - 重构后的统一hooks
export { useChatInputLogic } from './useChatInputLogic';
export { useInputState } from './useInputState';
export { useInputMenus } from './useInputMenus';
export { useInputExpand, type UseInputExpandOptions, type UseInputExpandReturn } from './useInputExpand';
export { useInputStyles } from './useInputStyles';
export { useKnowledgeContext } from './useKnowledgeContext';

// 长文本粘贴
export { useLongTextPaste, type UseLongTextPasteOptions, type UseLongTextPasteReturn } from './useLongTextPaste';

// 文件上传
export { useFileUpload } from './useFileUpload';

// 语音识别
export { useVoiceRecognition } from './useVoiceRecognition';
```

**修改后**:
```typescript
// 导出所有钩子函数

// 助手相关
export { useAssistant } from './useAssistant';

// 输入框相关 - 重构后的统一hooks
export { useChatInputLogic } from './useChatInputLogic';
export { useInputState } from './useInputState';
export { useInputStyles } from './useInputStyles';
export { useKnowledgeContext } from './useKnowledgeContext';

// 长文本粘贴
export { useLongTextPaste, type UseLongTextPasteOptions, type UseLongTextPasteReturn } from './useLongTextPaste';

// 文件上传
export { useFileUpload } from './useFileUpload';

// 语音识别
export { useVoiceRecognition } from './useVoiceRecognition';
```

---

### 3.5 类型定义文件

**文件**: `src/shared/types/inputProps.ts`

**修改内容**: 移除 `ChatInputProps` 和 `CompactChatInputProps` 类型定义

**当前内容（第91-114行）**:
```typescript
/**
 * ChatInput组件的Props接口
 * 扩展自BaseChatInputProps，添加ChatInput特有的属性
 */
export interface ChatInputProps extends BaseChatInputProps {
  /** 是否处于视频生成模式 */
  videoGenerationMode?: boolean;
}

/**
 * CompactChatInput组件的Props接口
 * 扩展自BaseChatInputProps，添加CompactChatInput特有的属性
 */
export interface CompactChatInputProps extends BaseChatInputProps {
  /** 清除当前话题回调 */
  onClearTopic?: () => void;
  // ... 其他属性
}
```

**修改后**: 删除上述两个接口定义，仅保留 `BaseChatInputProps` 和 `IntegratedChatInputProps`

---

### 3.6 样式函数提取

**问题**: `InputToolbar.tsx` 导出的样式函数被其他保留组件使用

**被使用位置**:
- `src/components/input/buttons/KnowledgeButton.tsx:8`
- `src/components/input/buttons/MCPToolsButton.tsx:14`
- `src/components/input/buttons/WebSearchButton.tsx:8`

**解决方案**: 创建新文件提取样式函数

**新建文件**: `src/shared/styles/toolbarStyles.ts`

```typescript
// 从 InputToolbar.tsx 提取的共享样式函数

// iOS 26 液体玻璃UI工具栏样式
export const getGlassmorphismToolbarStyles = (isDarkMode: boolean) => {
  // ... 原有实现
};

// 透明工具栏样式
export const getTransparentToolbarStyles = (isDarkMode: boolean) => {
  // ... 原有实现
};
```

**修改按钮组件导入**:

```typescript
// 修改前
import { getGlassmorphismToolbarStyles, getTransparentToolbarStyles } from '../InputToolbar';

// 修改后
import { getGlassmorphismToolbarStyles, getTransparentToolbarStyles } from '../../../shared/styles/toolbarStyles';
```

---

### 3.7 设置状态管理文件

**文件**: `src/shared/store/settingsSlice.ts`

**修改位置1**: 第39行类型定义

**当前内容**:
```typescript
inputLayoutStyle: 'default' | 'compact' | 'integrated'; // 输入框布局样式
```

**修改后**:
```typescript
inputLayoutStyle: 'integrated'; // 输入框布局样式（仅保留集成模式）
```

**修改位置2**: 第276行默认值

**当前内容**:
```typescript
inputLayoutStyle: 'integrated' as 'default' | 'compact' | 'integrated',
```

**修改后**:
```typescript
inputLayoutStyle: 'integrated' as const,
```

**修改位置3**: 第491-492行初始化逻辑

**当前内容**:
```typescript
if (!savedSettings.inputLayoutStyle) {
  savedSettings.inputLayoutStyle = 'default';
}
```

**修改后**:
```typescript
// 强制使用 integrated 模式
savedSettings.inputLayoutStyle = 'integrated';
```

---

### 3.8 外观配置文件

**文件**: `src/shared/utils/appearanceConfig.ts`

**修改位置**: 第62行类型定义

**当前内容**:
```typescript
inputLayoutStyle: 'default' | 'compact' | 'integrated';
```

**修改后**:
```typescript
inputLayoutStyle: 'integrated';
```

---

## 🔍 第四阶段：依赖关系验证

### 4.1 待删除 Hooks 的使用情况

**useInputMenus** 使用位置:
- `src/components/input/ChatInput.tsx:8` ✅ 将删除
- `src/components/input/CompactChatInput.tsx:11` ✅ 将删除

**useInputExpand** 使用位置:
- `src/components/input/ChatInput.tsx:9` ✅ 将删除
- `src/components/input/CompactChatInput.tsx:12` ✅ 将删除

**结论**: 这两个 hooks 可以安全删除

---

### 4.2 待删除配置的使用情况

**inputIcons.tsx (getBasicIcons/getExpandedIcons)** 使用位置:
- `src/components/input/CompactChatInput.tsx:19` ✅ 将删除

**结论**: 该配置文件可以安全删除

---

### 4.3 共享组件的使用确认

**FileUploadManager.tsx** 使用位置:
- `src/components/input/ChatInput.tsx:19` ❌ 将删除
- `src/components/input/IntegratedChatInput.tsx:13` ✅ 保留

**InputTextArea.tsx** 使用位置:
- `src/components/input/ChatInput.tsx:20` ❌ 将删除
- `src/components/input/IntegratedChatInput.tsx:14` ✅ 保留

**结论**: 这些共享组件必须保留

---

## 📝 第五阶段：执行步骤

### 步骤 1: 备份（可选）
```bash
# 创建备份分支
git checkout -b backup/before-input-cleanup
git add .
git commit -m "Backup before input component cleanup"
git checkout main
```

### 步骤 2: 提取共享样式函数（必须先执行）
```bash
# 1. 创建样式目录
mkdir src\shared\styles

# 2. 从 InputToolbar.tsx 提取 getGlassmorphismToolbarStyles 和 getTransparentToolbarStyles
#    到新文件 src\shared\styles\toolbarStyles.ts

# 3. 更新按钮组件导入路径
#    - src\components\input\buttons\KnowledgeButton.tsx
#    - src\components\input\buttons\MCPToolsButton.tsx
#    - src\components\input\buttons\WebSearchButton.tsx
```

### 步骤 3: 删除文件
```bash
# 删除主组件
del src\components\input\ChatInput.tsx
del src\components\input\CompactChatInput.tsx
del src\components\input\InputToolbar.tsx

# 删除专用子组件
del src\components\input\ChatInput\ChatInputButtons.tsx

# 删除专用配置
del src\shared\config\inputIcons.tsx

# 删除专用 hooks
del src\shared\hooks\useInputMenus.ts
del src\shared\hooks\useInputExpand.ts
```

### 步骤 4: 修改导出和配置文件
按照上述 3.1 - 3.8 的说明修改相关文件，包括：
- 3.1 组件导出文件 `index.ts`
- 3.2 聊天页面 `ChatPageUI.tsx`
- 3.3 设置页面 `InputBoxSettings.tsx`
- 3.4 Hooks导出 `hooks/index.ts`
- 3.5 类型定义 `inputProps.ts`
- 3.6 样式函数提取（已在步骤2完成）
- 3.7 设置状态 `settingsSlice.ts`
- 3.8 外观配置 `appearanceConfig.ts`

### 步骤 5: 验证编译
```bash
npm run build
# 或
yarn build
```

### 步骤 6: 运行测试
```bash
npm test
# 或
yarn test
```

---

## ✅ 第六阶段：验证检查点

### 6.0 样式函数提取检查
- [ ] `src/shared/styles/toolbarStyles.ts` 已创建
- [ ] `getGlassmorphismToolbarStyles` 函数正常导出
- [ ] `getTransparentToolbarStyles` 函数正常导出
- [ ] KnowledgeButton、MCPToolsButton、WebSearchButton 导入路径已更新

### 6.1 编译检查
- [ ] `npm run build` 无错误
- [ ] `npm run type-check` 无类型错误

### 6.2 功能检查
- [ ] IntegratedChatInput 正常显示
- [ ] 消息发送功能正常
- [ ] 图片/文件上传功能正常
- [ ] 语音输入功能正常
- [ ] 多模型选择功能正常
- [ ] MCP 工具按钮功能正常
- [ ] 网络搜索按钮功能正常
- [ ] 知识库按钮功能正常
- [ ] 按钮拖拽配置功能正常

### 6.3 设置页面检查
- [ ] 输入框设置页面正常显示
- [ ] 输入框预览正常工作

---

## ⚠️ 风险提示

1. **ChatInput 目录**: 删除后 `src/components/input/ChatInput/` 目录仍存在（包含 FileUploadManager 和 InputTextArea），建议后续重命名为 `shared/` 以避免混淆

2. **设置持久化**: 用户如果之前选择了 'default' 或 'compact' 样式，删除后需要处理默认值回退

3. **getGlassmorphismToolbarStyles**: ~~InputToolbar 导出了这个样式函数，需要检查是否有其他地方使用~~ ✅ 已在 3.6 节给出解决方案

---

## 📊 清理效果预估

| 指标 | 清理前 | 清理后 | 减少 |
|-----|-------|-------|-----|
| 组件文件数 | 10+ | 6 | ~40% |
| 代码行数 | ~3000 | ~1000 | ~2000行 |
| Hooks 数量 | 7+ | 5 | 2个 |
| 配置文件 | 2 | 1 | 1个 |
| 样式文件 | 0 | 1 | +1个（提取共享样式） |

---

## 📅 后续建议

1. 重命名 `ChatInput/` 目录为 `shared/` 或 `common/`
2. 更新相关文档
3. 移除 settings 中的 `inputLayoutStyle` 选项（如果不再需要）
4. 清理可能存在的死代码

---

*文档生成完毕，请交由其他 AI 进行遗漏检查*