import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Box } from '@mui/material';
import KnowledgeChip from '../chat/KnowledgeChip';

import { useChatInputLogic } from '../../shared/hooks/useChatInputLogic';
import { useKnowledgeContext } from '../../shared/hooks/useKnowledgeContext';
import { useInputStyles } from '../../shared/hooks/useInputStyles';
import { isIOS as checkIsIOS } from '../../shared/utils/platformDetection';
import type { ImageContent, SiliconFlowImageFormat, FileContent } from '../../shared/types';

import type { FileStatus } from '../preview/FilePreview';
import FileUploadManager, { type FileUploadManagerRef } from './ChatInput/FileUploadManager';
import InputTextArea from './ChatInput/InputTextArea';
import EnhancedToast, { toastManager } from '../EnhancedToast';
import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../shared/store';
import { toggleWebSearchEnabled, setWebSearchProvider } from '../../shared/store/slices/webSearchSlice';
import type { DebateConfig } from '../../shared/services/AIDebateService';
import { useKeyboard } from '../../shared/hooks/useKeyboard';
import useVoiceInputManager from './IntegratedChatInput/VoiceInputManager';
import useMenuManager from './IntegratedChatInput/MenuManager';
import useButtonToolbar from './IntegratedChatInput/ButtonToolbar';
import useExpandableContainer from './IntegratedChatInput/ExpandableContainer';

interface IntegratedChatInputProps {
  onSendMessage: (message: string, images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void;
  onSendMultiModelMessage?: (message: string, models: any[], images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void; // 多模型发送回调
  onStartDebate?: (question: string, config: DebateConfig) => void; // 开始AI辩论回调
  onStopDebate?: () => void; // 停止AI辩论回调
  isLoading?: boolean;
  allowConsecutiveMessages?: boolean; // 允许连续发送消息，即使AI尚未回复
  imageGenerationMode?: boolean; // 是否处于图像生成模式
  videoGenerationMode?: boolean; // 是否处于视频生成模式
  onSendImagePrompt?: (prompt: string) => void; // 发送图像生成提示词的回调
  webSearchActive?: boolean; // 是否处于网络搜索模式
  onStopResponse?: () => void; // 停止AI回复的回调
  isStreaming?: boolean; // 是否正在流式响应中
  isDebating?: boolean; // 是否正在AI辩论中
  toolsEnabled?: boolean; // 工具开关状态
  availableModels?: any[]; // 可用模型列表
  // 工具栏相关props
  onClearTopic?: () => void;
  toggleImageGenerationMode?: () => void;
  toggleVideoGenerationMode?: () => void;
  toggleWebSearch?: () => void;
  onToolsEnabledChange?: (enabled: boolean) => void;
}

const IntegratedChatInput: React.FC<IntegratedChatInputProps> = ({
  onSendMessage,
  onSendMultiModelMessage,
  onStartDebate,
  onStopDebate,
  isLoading = false,
  allowConsecutiveMessages = true, // 默认允许连续发送
  imageGenerationMode = false, // 默认不是图像生成模式
  videoGenerationMode = false, // 默认不是视频生成模式
  onSendImagePrompt,
  webSearchActive = false, // 默认不是网络搜索模式
  onStopResponse,
  isStreaming = false,
  isDebating = false, // 默认不在辩论中
  toolsEnabled = false, // 默认关闭工具
  availableModels = [], // 默认空数组
  // 工具栏相关props
  onClearTopic,
  toggleImageGenerationMode,
  toggleVideoGenerationMode,
  toggleWebSearch,
  onToolsEnabledChange
}) => {
  // 使用统一的平台检测，用 useMemo 缓存结果避免重复计算
  const isIOS = useMemo(() => checkIsIOS(), []);

  // 知识库状态刷新标记
  const [knowledgeRefreshKey, setKnowledgeRefreshKey] = useState(0);



  // 文件和图片状态
  const [images, setImages] = useState<ImageContent[]>([]);
  const [files, setFiles] = useState<FileContent[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // 文件状态管理
  const [fileStatuses, setFileStatuses] = useState<Record<string, { status: FileStatus; progress?: number; error?: string }>>({});

  // Toast消息管理
  const [toastMessages, setToastMessages] = useState<any[]>([]);

  // FileUploadManager 引用
  const fileUploadManagerRef = useRef<FileUploadManagerRef>(null);

  // 用于标记是否需要触发Web搜索的状态
  const [pendingWebSearchToggle, setPendingWebSearchToggle] = useState(false);

  // 获取当前助手状态
  const currentAssistant = useSelector((state: RootState) => state.assistants.currentAssistant);

  // Redux dispatch
  const dispatch = useDispatch();

  // 获取网络搜索设置
  const webSearchSettings = useSelector((state: RootState) => state.webSearch);

  // 使用共享的 hooks
  const { styles, isDarkMode, inputBoxStyle } = useInputStyles();
  const { hasKnowledgeContext, getStoredKnowledgeContext, clearStoredKnowledgeContext } = useKnowledgeContext();

  // 获取AI辩论按钮显示设置
  const showAIDebateButton = useSelector((state: RootState) => state.settings.showAIDebateButton ?? true);

  // 获取快捷短语按钮显示设置
  const showQuickPhraseButton = useSelector((state: RootState) => state.settings.showQuickPhraseButton ?? true);

  // 监听Web搜索设置变化，当设置完成后触发搜索
  useEffect(() => {
    if (pendingWebSearchToggle && webSearchSettings?.enabled && webSearchSettings?.provider && webSearchSettings.provider !== 'custom') {
      toggleWebSearch?.();
      setPendingWebSearchToggle(false);
    }
  }, [webSearchSettings?.enabled, webSearchSettings?.provider, pendingWebSearchToggle, toggleWebSearch]);

  // 聊天输入逻辑 - 启用 ChatInput 特有功能
  const {
    message,
    setMessage,
    textareaRef,
    canSendMessage,
    handleSubmit,
    handleKeyDown,
    handleChange,
    textareaHeight,
    showCharCount,
    handleCompositionStart,
    handleCompositionEnd,
    isMobile,
    isTablet
  } = useChatInputLogic({
    onSendMessage,
    onSendMultiModelMessage,
    onSendImagePrompt,
    isLoading,
    allowConsecutiveMessages,
    imageGenerationMode,
    videoGenerationMode,
    toolsEnabled,
    images,
    files,
    setImages,
    setFiles,
    enableTextareaResize: true,
    enableCompositionHandling: true,
    enableCharacterCount: true,
    availableModels
  });



  // 极简键盘管理 - 模仿 rikkahub
  const { hideKeyboard } = useKeyboard();

  // Toast消息订阅
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToastMessages);
    return unsubscribe;
  }, []);

  // 监听知识库选择事件，刷新显示
  useEffect(() => {
    const handleKnowledgeBaseSelected = () => {
      setKnowledgeRefreshKey(prev => prev + 1);
    };

    window.addEventListener('knowledgeBaseSelected', handleKnowledgeBaseSelected);
    return () => {
      window.removeEventListener('knowledgeBaseSelected', handleKnowledgeBaseSelected);
    };
  }, []);

  // 从 useInputStyles hook 获取样式
  const { border, borderRadius, boxShadow } = styles;
  const iconColor = isDarkMode ? '#ffffff' : '#000000'; // 深色主题用白色，浅色主题用黑色
  const disabledColor = isDarkMode ? '#555' : '#ccc';

  // 图片处理公共函数
  const processImages = async () => {
    const allImages = [
      ...images,
      ...files.filter(f => f.mimeType.startsWith('image/')).map(file => ({
        base64Data: file.base64Data,
        url: file.url || '',
        width: file.width,
        height: file.height
      } as ImageContent))
    ];

    const formattedImages: SiliconFlowImageFormat[] = await Promise.all(
      allImages.map(async (img) => {
        let imageUrl = img.base64Data || img.url;

        if (img.url && img.url.match(/\[图片:([a-zA-Z0-9_-]+)\]/)) {
          const refMatch = img.url.match(/\[图片:([a-zA-Z0-9_-]+)\]/);
          if (refMatch && refMatch[1]) {
            try {
              const imageId = refMatch[1];
              const blob = await dexieStorage.getImageBlob(imageId);
              if (blob) {
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
  };

  // 语音输入管理
  const voiceInputManager = useVoiceInputManager({
    message,
    setMessage,
    isDarkMode,
    isLoading,
    allowConsecutiveMessages,
    uploadingMedia,
    files,
    setImages,
    setFiles,
    setUploadingMedia,
    processImages,
    onSendMessage,
    toolsEnabled,
    iconColor
  });





  // 文件上传处理函数 - 通过 ref 调用 FileUploadManager 的方法
  const handleImageUploadLocal = async (source: 'camera' | 'photos' = 'photos') => {
    if (fileUploadManagerRef.current) {
      await fileUploadManagerRef.current.handleImageUpload(source);
    }
  };

  const handleFileUploadLocal = async () => {
    if (fileUploadManagerRef.current) {
      await fileUploadManagerRef.current.handleFileUpload();
    }
  };

  // 处理快速网络搜索切换
  const handleQuickWebSearchToggle = useCallback(() => {
    if (webSearchActive) {
      // 如果当前网络搜索处于激活状态，则关闭它
      toggleWebSearch?.();
    } else {
      // 如果当前网络搜索未激活，检查是否有可用的搜索提供商
      const enabled = webSearchSettings?.enabled || false;
      const currentProvider = webSearchSettings?.provider;

      if (enabled && currentProvider && currentProvider !== 'custom') {
        // 如果网络搜索已启用且有有效的提供商，直接激活
        toggleWebSearch?.();
      } else {
        // 如果没有配置或未启用，需要先启用网络搜索和设置默认提供商
        const actions: any[] = [];
        if (!enabled) {
          actions.push(toggleWebSearchEnabled());
        }
        if (!currentProvider || currentProvider === 'custom') {
          actions.push(setWebSearchProvider('bing-free'));
        }

        // 批量dispatch并设置等待标记
        actions.forEach(action => dispatch(action));
        setPendingWebSearchToggle(true);
      }
    }
  }, [webSearchActive, webSearchSettings, toggleWebSearch, dispatch, setPendingWebSearchToggle]);

  // 快捷短语插入处理函数
  const handleInsertPhrase = useCallback((content: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = message;

    // 在光标位置插入内容
    const newValue = currentValue.slice(0, start) + content + currentValue.slice(end);
    setMessage(newValue);

    // 设置新的光标位置（在插入内容的末尾）
    setTimeout(() => {
      if (textarea) {
        const newCursorPosition = start + content.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 10);
  }, [message, setMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  // 菜单管理
  const menuManager = useMenuManager({
    message,
    isStreaming,
    isDebating,
    canSendMessage: canSendMessage as () => boolean,
    imageGenerationMode,
    videoGenerationMode,
    webSearchActive,
    toolsEnabled,
    availableModels,
    onSendMultiModelMessage,
    handleImageUploadLocal,
    handleFileUploadLocal,
    onStartDebate,
    onStopDebate,
    handleInsertPhrase,
    currentAssistant,
    onClearTopic,
    toggleImageGenerationMode,
    toggleVideoGenerationMode,
    toggleWebSearch,
    onToolsEnabledChange,
    showAIDebateButton,
    showQuickPhraseButton,
    processImages,
    files,
    setImages,
    setFiles,
    setUploadingMedia,
    setMessage
  });

  // 显示正在加载的指示器，但不禁用输入框
  const showLoadingIndicator = isLoading && !allowConsecutiveMessages;

  // 智能发送函数：如果有已选模型则使用多模型发送，否则使用普通发送
  const smartHandleSubmit = useCallback(async () => {
    hideKeyboard();
    
    // 检查是否有已选的多模型
    if (menuManager.mentionedModels.length > 0 && onSendMultiModelMessage) {
      // 使用多模型发送
      const formattedImages = await processImages();
      const nonImageFiles = files.filter((f: FileContent) => !f.mimeType.startsWith('image/'));
      
      console.log('智能发送：使用多模型模式', {
        models: menuManager.mentionedModels.map(m => m.id),
        message: message.trim()
      });
      
      onSendMultiModelMessage(
        message.trim(),
        menuManager.mentionedModels,
        formattedImages.length > 0 ? formattedImages : undefined,
        toolsEnabled,
        nonImageFiles.length > 0 ? nonImageFiles : undefined
      );
      
      // 清空状态
      setMessage('');
      setImages([]);
      setFiles([]);
      setUploadingMedia(false);
      menuManager.setMentionedModels([]); // 清空已选模型
    } else {
      // 使用普通发送
      handleSubmit();
    }
  }, [hideKeyboard, menuManager.mentionedModels, onSendMultiModelMessage, processImages, files, message, toolsEnabled, setMessage, setImages, setFiles, setUploadingMedia, handleSubmit]);

  // 展开容器管理
  const expandableContainer = useExpandableContainer({
    message,
    isMobile,
    isTablet,
    isIOS,
    isDarkMode,
    iconColor,
    inputBoxStyle,
    border,
    borderRadius,
    boxShadow,
    handleChange
  });

  // 按钮工具栏管理
  const buttonToolbar = useButtonToolbar({
    isLoading,
    allowConsecutiveMessages,
    isStreaming,
    uploadingMedia,
    imageGenerationMode,
    videoGenerationMode,
    webSearchActive,
    toolsEnabled,
    images,
    files,
    handleSubmit: smartHandleSubmit, // 使用智能发送函数
    onStopResponse,
    handleImageUploadLocal,
    handleFileUploadLocal,
    onClearTopic,
    onToolsEnabledChange,
    handleQuickWebSearchToggle,
    toggleImageGenerationMode,
    toggleVideoGenerationMode,
    menuManager,
    voiceInputManager,
    canSendMessage: canSendMessage as () => boolean,
    isDarkMode,
    iconColor,
    disabledColor,
    showLoadingIndicator,
    isDebating
  });



  return expandableContainer.renderContainer(
    <>
      {/* 知识库状态显示 */}
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

      {/* 文件上传管理器 - 包含文件预览、拖拽上传、粘贴处理等功能 */}
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

        {/* 上层：文本输入区域 */}
        <div style={{
          display: 'flex',
          alignItems: 'center', // 改为center，让内容垂直居中
          marginBottom: '0px', // 移除间距，让两层紧密相连
          minHeight: '36px', // 设置固定高度
          height: '36px', // 确保高度一致
          flex: '1' // 让上层占据可用空间
        }}>
          {/* 输入区域 - 根据三状态显示不同的输入方式 */}
          {voiceInputManager.isVoiceRecording ? (
            /* 录音状态 - 显示增强语音输入组件 */
            voiceInputManager.renderVoiceInput()
          ) : (
            /* 正常输入框 - 使用 InputTextArea 组件 */
            <InputTextArea
              message={message}
              textareaRef={textareaRef}
              textareaHeight={textareaHeight}
              showCharCount={showCharCount}
              handleChange={expandableContainer.enhancedHandleChange}
              handleKeyDown={handleKeyDown}
              handleCompositionStart={handleCompositionStart}
              handleCompositionEnd={handleCompositionEnd}
              onPaste={(e) => {
                // 将粘贴事件转发给 FileUploadManager
                if (fileUploadManagerRef.current) {
                  fileUploadManagerRef.current.handlePaste(e);
                }
              }}
              isLoading={isLoading}
              allowConsecutiveMessages={allowConsecutiveMessages}
              imageGenerationMode={imageGenerationMode}
              videoGenerationMode={videoGenerationMode}
              webSearchActive={webSearchActive}
              isMobile={isMobile}
              isTablet={isTablet}
              isDarkMode={isDarkMode}
              shouldHideVoiceButton={false}
              expanded={expandableContainer.expanded}
              onExpandToggle={expandableContainer.handleExpandToggle}
            />
          )}
        </div>

      {/* 下层：功能按钮区域 */}
      {!voiceInputManager.isVoiceRecording && buttonToolbar.renderButtonToolbar()}

      {/* 菜单组件 */}
      {menuManager.renderMenus()}

      {/* Toast通知 */}
      <EnhancedToast
        messages={toastMessages}
        onClose={(id) => toastManager.remove(id)}
        maxVisible={3}
      />
    </>
  );
};

export default IntegratedChatInput;
