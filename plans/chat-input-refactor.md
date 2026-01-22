# 聊天输入框系统重构方案

## 📋 目标

重构现有的3个输入框组件（ChatInput、CompactChatInput、IntegratedChatInput），保留所有UI设计和功能，同时：
- 消除60%的重复代码
- 提高可维护性
- 确保IntegratedChatInput（默认布局）功能完整性
- 使用组合模式而非继承

## 🎯 当前问题分析

### 代码重复率
- **ChatInput**: 883行，约500行重复
- **CompactChatInput**: 1272行，约600行重复  
- **IntegratedChatInput**: 540行，最优设计（已使用Hook抽取）

### 重复功能
1. 图片处理逻辑 (`processImages`)
2. 多模型发送 (`handleMultiModelSend`)
3. 状态管理 (images, files, uploadingMedia, toastMessages)
4. 文件上传处理
5. 知识库上下文管理
6. 语音识别集成

## 🏗️ 新架构设计

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    ChatPageUI (使用层)                           │
│  根据 inputLayoutStyle 选择: default | compact | integrated      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  UnifiedChatInput (统一入口)                     │
│  - 接收统一的 Props                                              │
│  - 根据 layout 渲染对应的布局组件                                │
│  - 提供统一的 Context                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
    │ DefaultLayout│ │CompactLayout │ │IntegratedLayout  │
    │   (UI层)     │ │   (UI层)     │ │    (UI层)        │
    └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘
           │                │                   │
           └────────────────┼───────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────────────┐
    │         ChatInputCore (核心逻辑层)                     │
    │  - useChatInputCore (状态 + 核心逻辑)                 │
    │  - useImageProcessor (图片处理)                        │
    │  - useFileManager (文件管理)                           │
    │  - useMessageSender (消息发送)                         │
    │  - useVoiceInput (语音输入)                            │
    │  - useKnowledgeContext (知识库)                        │
    └───────────────────────────────────────────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────────────────────┐
    │         共享组件层 (Shared Components)                 │
    │  - InputTextArea                                       │
    │  - FileUploadManager                                   │
    │  - KnowledgeChip                                       │
    │  - VoiceButton / EnhancedVoiceInput                    │
    │  - MultiModelSelector                                  │
    └───────────────────────────────────────────────────────┘
```

## 📦 新文件结构

```
src/components/input/
├── index.ts                          # 统一导出
├── UnifiedChatInput.tsx              # 🆕 统一入口组件
├── ChatInputContext.tsx              # 🆕 Context Provider
│
├── core/                             # 🆕 核心逻辑层
│   ├── useChatInputCore.ts          # 核心状态和逻辑
│   ├── useImageProcessor.ts         # 图片处理（提取重复代码）
│   ├── useFileManager.ts            # 文件管理
│   ├── useMessageSender.ts          # 消息发送逻辑
│   └── types.ts                     # 核心类型定义
│
├── layouts/                          # 🆕 布局层（纯UI）
│   ├── DefaultLayout.tsx            # 重构后的 ChatInput UI
│   ├── CompactLayout.tsx            # 重构后的 CompactChatInput UI
│   ├── IntegratedLayout.tsx         # 重构后的 IntegratedChatInput UI
│   └── types.ts                     # 布局Props类型
│
├── features/                         # 🆕 功能模块
│   ├── voice/
│   │   ├── useVoiceInput.ts        # 语音输入逻辑
│   │   └── VoiceControls.tsx       # 语音控制UI
│   ├── multimodel/
│   │   ├── useMultiModel.ts        # 多模型逻辑
│   │   └── ModelSelector.tsx       # 模型选择器
│   ├── knowledge/
│   │   ├── useKnowledge.ts         # 知识库逻辑
│   │   └── KnowledgeDisplay.tsx    # 知识库显示
│   └── toolbar/
│       ├── useToolbar.ts           # 工具栏逻辑
│       └── ToolbarButtons.tsx      # 工具栏按钮
│
├── shared/                           # 现有共享组件
│   ├── InputTextArea.tsx
│   ├── FileUploadManager.tsx
│   └── ...
│
└── legacy/                           # 🆕 旧组件（向后兼容）
    ├── ChatInput.tsx                # 保留原组件作为别名
    ├── CompactChatInput.tsx
    └── IntegratedChatInput.tsx
```

## 🔧 核心实现

### 1. UnifiedChatInput (统一入口)

```typescript
// src/components/input/UnifiedChatInput.tsx
import React from 'react';
import { ChatInputProvider } from './ChatInputContext';
import DefaultLayout from './layouts/DefaultLayout';
import CompactLayout from './layouts/CompactLayout';
import IntegratedLayout from './layouts/IntegratedLayout';
import type { UnifiedChatInputProps } from './core/types';

const LAYOUT_MAP = {
  default: DefaultLayout,
  compact: CompactLayout,
  integrated: IntegratedLayout,
} as const;

export const UnifiedChatInput: React.FC<UnifiedChatInputProps> = (props) => {
  const { layout = 'integrated', ...restProps } = props;
  const LayoutComponent = LAYOUT_MAP[layout];

  return (
    <ChatInputProvider {...restProps}>
      <LayoutComponent />
    </ChatInputProvider>
  );
};
```

### 2. ChatInputContext (Context Provider)

```typescript
// src/components/input/ChatInputContext.tsx
import React, { createContext, useContext } from 'react';
import { useChatInputCore } from './core/useChatInputCore';
import { useImageProcessor } from './core/useImageProcessor';
import { useFileManager } from './core/useFileManager';
import { useMessageSender } from './core/useMessageSender';
import type { ChatInputContextValue, UnifiedChatInputProps } from './core/types';

const ChatInputContext = createContext<ChatInputContextValue | null>(null);

export const ChatInputProvider: React.FC<UnifiedChatInputProps & { children: React.ReactNode }> = ({
  children,
  ...props
}) => {
  // 核心逻辑
  const core = useChatInputCore(props);
  
  // 图片处理
  const imageProcessor = useImageProcessor({
    images: core.images,
    files: core.files,
  });
  
  // 文件管理
  const fileManager = useFileManager({
    setImages: core.setImages,
    setFiles: core.setFiles,
    setUploadingMedia: core.setUploadingMedia,
  });
  
  // 消息发送
  const messageSender = useMessageSender({
    message: core.message,
    images: core.images,
    files: core.files,
    toolsEnabled: props.toolsEnabled,
    processImages: imageProcessor.processImages,
    onSendMessage: props.onSendMessage,
    onSendMultiModelMessage: props.onSendMultiModelMessage,
    resetState: core.resetState,
  });

  const value: ChatInputContextValue = {
    // 核心状态
    ...core,
    
    // 图片处理
    processImages: imageProcessor.processImages,
    
    // 文件管理
    handleImageUpload: fileManager.handleImageUpload,
    handleFileUpload: fileManager.handleFileUpload,
    handleRemoveImage: fileManager.handleRemoveImage,
    handleRemoveFile: fileManager.handleRemoveFile,
    
    // 消息发送
    handleSubmit: messageSender.handleSubmit,
    handleMultiModelSend: messageSender.handleMultiModelSend,
    canSendMessage: messageSender.canSendMessage,
  };

  return (
    <ChatInputContext.Provider value={value}>
      {children}
    </ChatInputContext.Provider>
  );
};

export const useChatInput = () => {
  const context = useContext(ChatInputContext);
  if (!context) {
    throw new Error('useChatInput must be used within ChatInputProvider');
  }
  return context;
};
```

### 3. useChatInputCore (核心逻辑)

```typescript
// src/components/input/core/useChatInputCore.ts
import { useState, useRef, useCallback } from 'react';
import { useChatInputLogic } from '../../../shared/hooks/useChatInputLogic';
import { useKnowledgeContext } from '../../../shared/hooks/useKnowledgeContext';
import { useInputStyles } from '../../../shared/hooks/useInputStyles';
import type { ImageContent, FileContent } from '../../../shared/types';
import type { UnifiedChatInputProps } from './types';

export const useChatInputCore = (props: UnifiedChatInputProps) => {
  // 状态管理
  const [images, setImages] = useState<ImageContent[]>([]);
  const [files, setFiles] = useState<FileContent[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [toastMessages, setToastMessages] = useState<any[]>([]);
  const [knowledgeRefreshKey, setKnowledgeRefreshKey] = useState(0);
  
  // Refs
  const fileUploadManagerRef = useRef<any>(null);
  
  // 共享Hooks
  const inputLogic = useChatInputLogic({
    onSendMessage: props.onSendMessage,
    onSendMultiModelMessage: props.onSendMultiModelMessage,
    onSendImagePrompt: props.onSendImagePrompt,
    isLoading: props.isLoading,
    allowConsecutiveMessages: props.allowConsecutiveMessages,
    imageGenerationMode: props.imageGenerationMode,
    videoGenerationMode: props.videoGenerationMode,
    toolsEnabled: props.toolsEnabled,
    images,
    files,
    setImages,
    setFiles,
    enableTextareaResize: true,
    enableCompositionHandling: true,
    enableCharacterCount: true,
    availableModels: props.availableModels,
  });
  
  const knowledgeContext = useKnowledgeContext();
  const styles = useInputStyles();
  
  // 重置状态
  const resetState = useCallback(() => {
    inputLogic.setMessage('');
    setImages([]);
    setFiles([]);
    setUploadingMedia(false);
  }, [inputLogic]);
  
  return {
    // 状态
    images,
    setImages,
    files,
    setFiles,
    uploadingMedia,
    setUploadingMedia,
    toastMessages,
    setToastMessages,
    knowledgeRefreshKey,
    setKnowledgeRefreshKey,
    
    // Refs
    fileUploadManagerRef,
    
    // 输入逻辑
    ...inputLogic,
    
    // 知识库
    ...knowledgeContext,
    
    // 样式
    ...styles,
    
    // 方法
    resetState,
  };
};
```

### 4. useImageProcessor (图片处理 - 提取重复代码)

```typescript
// src/components/input/core/useImageProcessor.ts
import { useCallback } from 'react';
import { dexieStorage } from '../../../shared/services/storage/DexieStorageService';
import type { ImageContent, FileContent, SiliconFlowImageFormat } from '../../../shared/types';

interface UseImageProcessorProps {
  images: ImageContent[];
  files: FileContent[];
}

export const useImageProcessor = ({ images, files }: UseImageProcessorProps) => {
  /**
   * 统一的图片处理逻辑
   * 合并 images 和 files 中的图片，处理引用格式，转换为 API 格式
   */
  const processImages = useCallback(async (): Promise<SiliconFlowImageFormat[]> => {
    // 合并所有图片
    const allImages = [
      ...images,
      ...files
        .filter(f => f.mimeType.startsWith('image/'))
        .map(file => ({
          base64Data: file.base64Data,
          url: file.url || '',
          width: file.width,
          height: file.height,
        } as ImageContent))
    ];

    // 处理每个图片
    const formattedImages: SiliconFlowImageFormat[] = await Promise.all(
      allImages.map(async (img) => {
        let imageUrl = img.base64Data || img.url;

        // 处理图片引用格式 [图片:id]
        if (img.url && img.url.match(/\[图片:([a-zA-Z0-9_-]+)\]/)) {
          const refMatch = img.url.match(/\[图片:([a-zA-Z0-9_-]+)\]/);
          if (refMatch && refMatch[1]) {
            try {
              const imageId = refMatch[1];
              const blob = await dexieStorage.getImageBlob(imageId);
              if (blob) {
                // 将Blob转换为base64
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
                imageUrl = base64;
              }
            } catch (error) {
              console.error('加载图片引用失败:', error);
            }
          }
        }

        return {
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        } as SiliconFlowImageFormat;
      })
    );

    return formattedImages;
  }, [images, files]);

  return {
    processImages,
  };
};
```

### 5. IntegratedLayout (集成布局 - 保留所有功能)

```typescript
// src/components/input/layouts/IntegratedLayout.tsx
import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useChatInput } from '../ChatInputContext';
import { useKeyboard } from '../../../shared/hooks/useKeyboard';
import useVoiceInputManager from '../IntegratedChatInput/VoiceInputManager';
import useMenuManager from '../IntegratedChatInput/MenuManager';
import useButtonToolbar from '../IntegratedChatInput/ButtonToolbar';
import useExpandableContainer from '../IntegratedChatInput/ExpandableContainer';
import InputTextArea from '../shared/InputTextArea';
import FileUploadManager from '../shared/FileUploadManager';
import KnowledgeChip from '../../chat/KnowledgeChip';
import EnhancedToast, { toastManager } from '../../EnhancedToast';

/**
 * 集成布局 - 保留所有原有功能
 * 这是默认布局，必须确保功能完整性
 */
export const IntegratedLayout: React.FC = () => {
  // 从Context获取所有状态和方法
  const context = useChatInput();
  const {
    message,
    setMessage,
    textareaRef,
    images,
    files,
    setImages,
    setFiles,
    uploadingMedia,
    setUploadingMedia,
    fileStatuses,
    setFileStatuses,
    toastMessages,
    setToastMessages,
    knowledgeRefreshKey,
    setKnowledgeRefreshKey,
    fileUploadManagerRef,
    isDarkMode,
    inputBoxStyle,
    border,
    borderRadius,
    boxShadow,
    hasKnowledgeContext,
    getStoredKnowledgeContext,
    clearStoredKnowledgeContext,
    handleChange,
    handleKeyDown,
    textareaHeight,
    showCharCount,
    handleCompositionStart,
    handleCompositionEnd,
    isMobile,
    isTablet,
    canSendMessage,
    handleSubmit,
    processImages,
    handleImageUpload,
    handleFileUpload,
  } = context;

  const { hideKeyboard } = useKeyboard();
  
  // Toast订阅
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToastMessages);
    return unsubscribe;
  }, [setToastMessages]);

  // 知识库事件监听
  useEffect(() => {
    const handleKnowledgeBaseSelected = () => {
      setKnowledgeRefreshKey(prev => prev + 1);
    };
    window.addEventListener('knowledgeBaseSelected', handleKnowledgeBaseSelected);
    return () => {
      window.removeEventListener('knowledgeBaseSelected', handleKnowledgeBaseSelected);
    };
  }, [setKnowledgeRefreshKey]);

  const iconColor = isDarkMode ? '#ffffff' : '#000000';
  const disabledColor = isDarkMode ? '#555' : '#ccc';

  // 语音输入管理 - 保留原有实现
  const voiceInputManager = useVoiceInputManager({
    message,
    setMessage,
    isDarkMode,
    isLoading: context.isLoading,
    allowConsecutiveMessages: context.allowConsecutiveMessages,
    uploadingMedia,
    files,
    setImages,
    setFiles,
    setUploadingMedia,
    processImages,
    onSendMessage: context.onSendMessage,
    toolsEnabled: context.toolsEnabled,
    iconColor,
  });

  // 菜单管理 - 保留原有实现
  const menuManager = useMenuManager({
    message,
    isStreaming: context.isStreaming,
    isDebating: context.isDebating,
    canSendMessage: canSendMessage as () => boolean,
    imageGenerationMode: context.imageGenerationMode,
    videoGenerationMode: context.videoGenerationMode,
    webSearchActive: context.webSearchActive,
    toolsEnabled: context.toolsEnabled,
    availableModels: context.availableModels,
    onSendMultiModelMessage: context.onSendMultiModelMessage,
    handleImageUploadLocal: handleImageUpload,
    handleFileUploadLocal: handleFileUpload,
    onStartDebate: context.onStartDebate,
    onStopDebate: context.onStopDebate,
    handleInsertPhrase: context.handleInsertPhrase,
    currentAssistant: context.currentAssistant,
    onClearTopic: context.onClearTopic,
    toggleImageGenerationMode: context.toggleImageGenerationMode,
    toggleVideoGenerationMode: context.toggleVideoGenerationMode,
    toggleWebSearch: context.toggleWebSearch,
    onToolsEnabledChange: context.onToolsEnabledChange,
    showAIDebateButton: context.showAIDebateButton,
    showQuickPhraseButton: context.showQuickPhraseButton,
    processImages,
    files,
    setImages,
    setFiles,
    setUploadingMedia,
    setMessage,
  });

  // 智能发送函数
  const smartHandleSubmit = async () => {
    hideKeyboard();
    if (menuManager.mentionedModels.length > 0 && context.onSendMultiModelMessage) {
      const formattedImages = await processImages();
      const nonImageFiles = files.filter(f => !f.mimeType.startsWith('image/'));
      context.onSendMultiModelMessage(
        message.trim(),
        menuManager.mentionedModels,
        formattedImages.length > 0 ? formattedImages : undefined,
        context.toolsEnabled,
        nonImageFiles.length > 0 ? nonImageFiles : undefined
      );
      setMessage('');
      setImages([]);
      setFiles([]);
      setUploadingMedia(false);
      menuManager.setMentionedModels([]);
    } else {
      handleSubmit();
    }
  };

  // 展开容器管理
  const expandableContainer = useExpandableContainer({
    message,
    isMobile,
    isTablet,
    isIOS: context.isIOS,
    isDarkMode,
    iconColor,
    inputBoxStyle,
    border,
    borderRadius,
    boxShadow,
    handleChange,
  });

  // 按钮工具栏
  const buttonToolbar = useButtonToolbar({
    isLoading: context.isLoading,
    allowConsecutiveMessages: context.allowConsecutiveMessages,
    isStreaming: context.isStreaming,
    uploadingMedia,
    imageGenerationMode: context.imageGenerationMode,
    videoGenerationMode: context.videoGenerationMode,
    webSearchActive: context.webSearchActive,
    toolsEnabled: context.toolsEnabled,
    images,
    files,
    handleSubmit: smartHandleSubmit,
    onStopResponse: context.onStopResponse,
    handleImageUploadLocal: handleImageUpload,
    handleFileUploadLocal: handleFileUpload,
    onClearTopic: context.onClearTopic,
    onToolsEnabledChange: context.onToolsEnabledChange,
    handleQuickWebSearchToggle: context.handleQuickWebSearchToggle,
    toggleImageGenerationMode: context.toggleImageGenerationMode,
    toggleVideoGenerationMode: context.toggleVideoGenerationMode,
    menuManager,
    voiceInputManager,
    canSendMessage: canSendMessage as () => boolean,
    isDarkMode,
    iconColor,
    disabledColor,
    showLoadingIndicator: context.isLoading && !context.allowConsecutiveMessages,
    isDebating: context.isDebating,
  });

  return expandableContainer.renderContainer(
    <>
      {/* 知识库显示 */}
      {hasKnowledgeContext() && (() => {
        const contextData = getStoredKnowledgeContext();
        const knowledgeBaseName = contextData?.knowledgeBase?.name || '未知知识库';
        return (
          <Box key={`knowledge-${knowledgeRefreshKey}`} sx={{ px: 1, mb: 1 }}>
            <KnowledgeChip
              knowledgeBaseName={knowledgeBaseName}
              onRemove={() => {
                clearStoredKnowledgeContext();
                setKnowledgeRefreshKey(prev => prev + 1);
              }}
            />
          </Box>
        );
      })()}

      {/* 已选多模型显示 */}
      {menuManager.renderMentionedModels()}

      {/* 文件上传管理器 */}
      <FileUploadManager
        ref={fileUploadManagerRef}
        images={images}
        files={files}
        setImages={setImages}
        setFiles={setFiles}
        setUploadingMedia={setUploadingMedia}
        fileStatuses={fileStatuses}
        setFileStatuses={setFileStatuses}
        isDarkMode={isDarkMode}
        isMobile={isMobile}
        borderRadius={borderRadius}
      />

      {/* 输入区域 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '0px',
        minHeight: '36px',
        height: '36px',
        flex: '1'
      }}>
        {voiceInputManager.isVoiceRecording ? (
          voiceInputManager.renderVoiceInput()
        ) : (
          <InputTextArea
            message={message}
            textareaRef={textareaRef}
            textareaHeight={textareaHeight}
            showCharCount={showCharCount}
            handleChange={expandableContainer.enhancedHandleChange}
            handleKeyDown={handleKeyDown}
            handleCompositionStart={handleCompositionStart}
            handleCompositionEnd={handleCompositionEnd}
            placeholder="助手说点什么... (Ctrl+Enter 展开)"
            isDarkMode={isDarkMode}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* 按钮工具栏 */}
      {buttonToolbar.renderToolbar()}

      {/* Toast消息 */}
      {toastMessages.map((toast) => (
        <EnhancedToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => toastManager.remove(toast.id)}
        />
      ))}
    </>
  );
};

export default IntegratedLayout;
```

## 🔄 迁移步骤

### 阶段1: 准备工作（不影响现有功能）
1. ✅ 创建新的目录结构
2. ✅ 实现核心逻辑层（useChatInputCore, useImageProcessor等）
3. ✅ 创建UnifiedChatInput和ChatInputContext
4. ✅ 实现IntegratedLayout（保留所有功能）

### 阶段2: 测试验证
1. 在开发环境中测试IntegratedLayout
2. 确保所有功能正常：
   - ✅ 文本输入和发送
   - ✅ 图片上传和预览
   - ✅ 文件上传和管理
   - ✅ 语音输入
   - ✅ 多模型选择
   - ✅ 知识库集成
   - ✅ 工具栏按钮
   - ✅ 展开/折叠
   - ✅ 键盘适配

### 阶段3: 逐步迁移
1. 实现CompactLayout
2. 实现DefaultLayout
3. 更新ChatPageUI使用UnifiedChatInput
4. 保留旧组件作为别名（向后兼容）

### 阶段4: 清理
1. 标记旧组件为@deprecated
2. 更新文档
3. 删除重复代码

## 📊 预期收益

### 代码量对比
| 组件 | 当前行数 | 重构后行数 | 减少 |
|------|---------|-----------|------|
| ChatInput | 883 | ~200 (Layout) | -77% |
| CompactChatInput | 1272 | ~250 (Layout) | -80% |
| IntegratedChatInput | 540 | ~300 (Layout) | -44% |
| **核心逻辑** | 分散在3处 | ~600 (共享) | - |
| **总计** | 2695 | ~1350 | **-50%** |

### 维护性提升
- ✅ 单一数据源（Context）
- ✅ 逻辑复用（Hooks）
- ✅ UI分离（Layout组件）
- ✅ 类型安全（统一类型定义）
- ✅ 易于测试（独立的Hook和组件）

### 扩展性提升
- ✅ 新增布局只需实现UI层（~200行）
- ✅ 新增功能在核心层实现，所有布局自动获得
- ✅ 功能模块化，可独立开发和测试

## 🎯 关键原则

1. **零功能丢失**: 所有现有功能必须保留
2. **IntegratedLayout优先**: 作为默认布局，必须最先完成且功能完整
3. **向后兼容**: 保留旧组件作为别名，不破坏现有代码
4. **渐进式迁移**: 分阶段实施，每个阶段都可独立验证
5. **类型安全**: 使用TypeScript确保类型正确性

## 📝 类型定义

```typescript
// src/components/input/core/types.ts

export interface UnifiedChatInputProps {
  // 布局选择
  layout?: 'default' | 'compact' | 'integrated';
  
  // 消息发送
  onSendMessage: (message: string, images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void;
  onSendMultiModelMessage?: (message: string, models: any[], images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void;
  onSendImagePrompt?: (prompt: string) => void;
  
  // AI辩论
  onStartDebate?: (question: string, config: DebateConfig) => void;
  onStopDebate?: () => void;
  
  // 状态
  isLoading?: boolean;
  isStreaming?: boolean;
  isDebating?: boolean;
  allowConsecutiveMessages?: boolean;
  
  // 模式
  imageGenerationMode?: boolean;
  videoGenerationMode?: boolean;
  webSearchActive?: boolean;
  toolsEnabled?: boolean;
  
  // 控制
  onStopResponse?: () => void;
  onClearTopic?: () => void;
  toggleImageGenerationMode?: () => void;
  toggleVideoGenerationMode?: () => void;
  toggleWebSearch?: () => void;
  onToolsEnabledChange?: (enabled: boolean) => void;
  
  // 数据
  availableModels?: any[];
}

export interface ChatInputContextValue {
  // 核心状态
  message: string;
  setMessage: (message: string) => void;
  images: ImageContent[];
  setImages: React.Dispatch<React.SetStateAction<ImageContent[]>>;
  files: FileContent[];
  setFiles: React.Dispatch<React.SetStateAction<FileContent[]>>;
  uploadingMedia: boolean;
  setUploadingMedia: (uploading: boolean) => void;
  
  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileUploadManagerRef: React.RefObject<any>;
  
  // 输入逻辑
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleCompositionStart: () => void;
  handleCompositionEnd: () => void;
  textareaHeight: number;
  showCharCount: boolean;
  
  // 样式
  isDarkMode: boolean;
  inputBoxStyle: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
  
  // 知识库
  hasKnowledgeContext: () => boolean;
  getStoredKnowledgeContext: () => any;
  clearStoredKnowledgeContext: () => void;
  
  // 图片处理
  processImages: () => Promise<SiliconFlowImageFormat[]>;
  
  // 文件管理
  handleImageUpload: (source?: 'camera' | 'photos') => Promise<void>;
  handleFileUpload: () => Promise<void>;
  handleRemoveImage: (index: number) => void;
  handleRemoveFile: (index: number) => void;
  
  // 消息发送
  handleSubmit: () => void;
  handleMultiModelSend: (models: any[]) => void;
  canSendMessage: () => boolean;
  
  // 其他
  resetState: () => void;
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  
  // Props透传
  isLoading?: boolean;
  isStreaming?: boolean;
  isDebating?: boolean;
  allowConsecutiveMessages?: boolean;
  imageGenerationMode?: boolean;
  videoGenerationMode?: boolean;
  webSearchActive?: boolean;
  toolsEnabled?: boolean;
  onSendMessage: UnifiedChatInputProps['onSendMessage'];
  onSendMultiModelMessage?: UnifiedChatInputProps['onSendMultiModelMessage'];
  onStartDebate?: UnifiedChatInputProps['onStartDebate'];
  onStopDebate?: UnifiedChatInputProps['onStopDebate'];
  onStopResponse?: UnifiedChatInputProps['onStopResponse'];
  onClearTopic?: UnifiedChatInputProps['onClearTopic'];
  toggleImageGenerationMode?: UnifiedChatInputProps['toggleImageGenerationMode'];
  toggleVideoGenerationMode?: UnifiedChatInputProps['toggleVideoGenerationMode'];
  toggleWebSearch?: UnifiedChatInputProps['toggleWebSearch'];
  onToolsEnabledChange?: UnifiedChatInputProps['onToolsEnabledChange'];
  availableModels?: any[];
}
```

## 🚀 使用示例

### 在ChatPageUI中使用

```typescript
// src/pages/ChatPage/components/ChatPageUI.tsx

import { UnifiedChatInput } from '../../../components/input';

// ...

const inputComponent = useMemo(() => {
  return (
    <UnifiedChatInput
      layout={settings.inputLayoutStyle} // 'default' | 'compact' | 'integrated'
      onSendMessage={handleSendMessage}
      onSendMultiModelMessage={handleSendMultiModelMessage}
      onStartDebate={handleStartDebate}
      onStopDebate={handleStopDebate}
      isLoading={isLoading}
      isStreaming={isStreaming}
      isDebating={isDebating}
      allowConsecutiveMessages={true}
      imageGenerationMode={imageGenerationMode}
      videoGenerationMode={videoGenerationMode}
      webSearchActive={webSearchActive}
      toolsEnabled={toolsEnabled}
      onStopResponse={handleStopResponse}
      onClearTopic={handleClearTopic}
      toggleImageGenerationMode={toggleImageGenerationMode}
      toggleVideoGenerationMode={toggleVideoGenerationMode}
      toggleWebSearch={toggleWebSearch}
      onToolsEnabledChange={setToolsEnabled}
      availableModels={availableModels}
    />
  );
}, [settings.inputLayoutStyle, /* 其他依赖 */]);
```

### 向后兼容（可选）

```typescript
// src/components/input/legacy/IntegratedChatInput.tsx

/**
 * @deprecated 请使用 UnifiedChatInput with layout="integrated"
 * 此组件保留用于向后兼容
 */
export const IntegratedChatInput: React.FC<IntegratedChatInputProps> = (props) => {
  return <UnifiedChatInput layout="integrated" {...props} />;
};
```

## ✅ 验收标准

### 功能完整性
- [ ] 所有输入方式正常（文本、语音、粘贴）
- [ ] 文件上传功能完整（图片、文档、拖拽）
- [ ] 多模型选择和发送正常
- [ ] 知识库集成正常
- [ ] 工具栏所有按钮功能正常
- [ ] 展开/折叠动画流畅
- [ ] 键盘适配正确（iOS/Android）
- [ ] 响应式布局正常（移动端/平板/桌面）

### 性能标准
- [ ] 输入延迟 < 50ms
- [ ] 图片处理时间 < 500ms
- [ ] 组件渲染次数优化（使用React DevTools验证）
- [ ] 内存泄漏检查通过

### 代码质量
- [ ] TypeScript类型覆盖100%
- [ ] 所有Hook遵循React规范
- [ ] 无ESLint警告
- [ ] 代码注释完整

## 📚 相关文档

- [React Context最佳实践](https://react.dev/learn/passing-data-deeply-with-context)
- [自定义Hook设计模式](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [组合vs继承](https://react.dev/learn/thinking-in-react#step-2-build-a-static-version-in-react)

## 🤝 贡献指南

重构过程中请遵循：
1. 每个阶段独立提交
2. 充分测试后再进入下一阶段
3. 保持向后兼容
4. 更新相关文档

---

**最后更新**: 2026-01-22
**状态**: 设计阶段
**负责人**: 开发团队