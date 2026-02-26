# Step 001: 输入框系统企业级重构

## 动机

对项目中聊天输入框系统进行企业级标准审查后，发现以下核心问题：
1. `processImages` 图片处理逻辑在两处完全重复（违反 DRY）
2. `FileUploadManager` 的 `useImperativeHandle` 空依赖数组导致闭包陷阱 Bug
3. `ButtonToolbar` 左右按钮渲染逻辑完全重复（~120 行重复代码）
4. 关键接口中大量使用 `any` 类型，破坏类型安全
5. Redux selector 使用 `as any` 类型断言访问未声明的字段
6. 知识库选择状态通过 `sessionStorage + CustomEvent` 管理，绕过 Redux，违反单一数据源原则

## 实现细节

### Phase 1: 安全重构（消除重复代码 + 修复 Bug）

**1.1 提取 `processImages` 为共享工具函数**
- 创建 `src/shared/utils/imageProcessor.ts`
- 提供 `processImages()`, `mergeImageSources()`, `getNonImageFiles()` 三个导出函数
- 更新 `IntegratedChatInput.tsx` 和 `useChatInputLogic.ts` 使用共享函数
- 移除两处重复的 ~45 行图片处理逻辑

**1.2 修复 `useImperativeHandle` 空依赖 Bug**
- 用 `useCallback` 包装 `handleImageUploadLocal`, `handleFileUploadLocal`, `handlePaste`
- 将 `useImperativeHandle` 移到所有暴露函数定义之后
- 添加正确的依赖数组 `[handleImageUploadLocal, handleFileUploadLocal, handlePaste]`

**1.3 提取按钮渲染逻辑为统一函数**
- 创建 `componentRenderers` 映射表替代字符串 if/else 判断
- 提取 `renderButton()` 统一渲染函数
- 左右按钮列表直接 `.map(renderButton)` 调用
- 消除 ~120 行重复代码

### Phase 2: 类型安全改进

**2.1 消除关键接口中的 `any` 类型**
- `useChatInputLogic.ts`: `files?: any[]` → `FileContent[]`, `models: any[]` → `Model[]`, `availableModels?: any[]` → `Model[]`
- `MenuManager.tsx`: `availableModels: any[]` → `Model[]`, `currentAssistant: any` → `Assistant | null`
- `VoiceInputManager.tsx`: `files?: any[]` → `FileContent[]`
- `KnowledgeButton.tsx`: `knowledgeBase: any` → `KnowledgeBaseSelection`
- `ToolsMenu.tsx`: `knowledgeBase: any` → `{ id: string; name: string }`
- `MentionedModelsDisplay.tsx`: `(p: any)` → `(p: { id: string; name?: string })`
- `IntegratedChatInput.tsx`: `actions: any[]` → 具体 Redux action 类型

**2.2 Redux selector 类型安全化**
- 在 `SettingsState` 中添加 `integratedInputLeftButtons`, `integratedInputRightButtons`, `toolbarButtons` 显式字段
- 移除 `ButtonToolbar.tsx` 中的 `as any` 类型断言

### Phase 3: 架构改善

**3.1 知识库状态迁移到 Redux**
- 创建 `knowledgeSelectionSlice.ts`，定义 `SelectedKnowledgeInfo` 和 `KnowledgeSelectionState`
- 注册到 Redux store 并添加到 blacklist（会话级状态不需要持久化）
- 更新 6 个写入/读取方文件，移除所有 `sessionStorage` 和 `CustomEvent` 用法
- 为 thunks 提供非 Hook 版本 `getKnowledgeSelectionFromStore()`

## 修改文件列表

| 文件 | 操作 |
|---|---|
| `src/shared/utils/imageProcessor.ts` | 新建 |
| `src/shared/store/slices/knowledgeSelectionSlice.ts` | 新建 |
| `src/shared/store/index.ts` | 修改（注册新 slice） |
| `src/shared/store/slices/settingsSlice.ts` | 修改（添加字段类型） |
| `src/shared/hooks/useChatInputLogic.ts` | 修改（使用共享函数 + 类型修复） |
| `src/shared/hooks/useKnowledgeContext.ts` | 修改（迁移到 Redux） |
| `src/shared/hooks/useInputState.ts` | 修改（移除 CustomEvent 监听） |
| `src/components/input/IntegratedChatInput.tsx` | 修改（使用共享函数） |
| `src/components/input/IntegratedChatInput/ButtonToolbar.tsx` | 修改（提取渲染函数 + 类型修复） |
| `src/components/input/IntegratedChatInput/MenuManager.tsx` | 修改（类型修复） |
| `src/components/input/IntegratedChatInput/VoiceInputManager.tsx` | 修改（类型修复） |
| `src/components/input/ChatInput/FileUploadManager.tsx` | 修改（修复 useImperativeHandle） |
| `src/components/input/buttons/KnowledgeButton.tsx` | 修改（Redux 迁移 + 类型修复） |
| `src/components/input/ToolsMenu.tsx` | 修改（Redux 迁移 + 类型修复） |
| `src/components/input/MentionedModelsDisplay.tsx` | 修改（类型修复） |
| `src/components/chat/KnowledgeSelector.tsx` | 修改（Redux 迁移） |
| `src/shared/store/thunks/message/knowledgeIntegration.ts` | 修改（Redux 迁移） |
| `src/shared/store/thunks/message/apiPreparation.ts` | 修改（Redux 迁移） |
