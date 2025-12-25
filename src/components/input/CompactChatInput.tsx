import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Box, IconButton, Typography, Collapse } from '@mui/material';
import KnowledgeChip from '../chat/KnowledgeChip';
import { MCPToolsButton, WebSearchButton, KnowledgeButton } from './buttons';
import AIDebateButton from '../AIDebateButton';
import QuickPhraseButton from '../quick-phrase/QuickPhraseButton';
import MultiModelSelector from './MultiModelSelector';
import EnhancedToast, { toastManager } from '../EnhancedToast';
import { useChatInputLogic } from '../../shared/hooks/useChatInputLogic';
import { useFileUpload } from '../../shared/hooks/useFileUpload';
import { useLongTextPaste } from '../../shared/hooks/useLongTextPaste';

import { useInputStyles } from '../../shared/hooks/useInputStyles';
import { useKnowledgeContext } from '../../shared/hooks/useKnowledgeContext';
import { useVoiceRecognition } from '../../shared/hooks/useVoiceRecognition'; // 导入 useVoiceRecognition
import { useKeyboard } from '../../shared/hooks/useKeyboard';
import { getBasicIcons, getExpandedIcons } from '../../shared/config/inputIcons';
import { isIOS as checkIsIOS } from '../../shared/utils/platformDetection';

import { Plus, X, Send, Square, Paperclip, ChevronUp, ChevronDown } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../shared/store';
import type { SiliconFlowImageFormat, ImageContent, FileContent } from '../../shared/types';
import type { DebateConfig } from '../../shared/services/AIDebateService';
import { topicCacheManager } from '../../shared/services/TopicCacheManager';
import { VoiceButton, EnhancedVoiceInput } from '../VoiceRecognition';


interface CompactChatInputProps {
  onSendMessage: (message: string, images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[], voiceRecognitionText?: string) => void;
  onSendMultiModelMessage?: (message: string, models: any[], images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void;
  onStartDebate?: (question: string, config: DebateConfig) => void; // 开始AI辩论回调
  onStopDebate?: () => void; // 停止AI辩论回调
  isLoading?: boolean;
  allowConsecutiveMessages?: boolean;
  imageGenerationMode?: boolean;
  onSendImagePrompt?: (prompt: string) => void;
  webSearchActive?: boolean;
  onStopResponse?: () => void;
  isStreaming?: boolean;
  isDebating?: boolean; // 是否在辩论中
  toolsEnabled?: boolean;
  availableModels?: any[];
  onClearTopic?: () => void;
  onNewTopic?: () => void;
  toggleImageGenerationMode?: () => void;
  toggleWebSearch?: () => void;
  toggleToolsEnabled?: () => void;
}

const CompactChatInput: React.FC<CompactChatInputProps> = ({
  onSendMessage,
  onSendMultiModelMessage, // 启用多模型功能
  onStartDebate, // 启用AI辩论功能
  onStopDebate, // 启用AI辩论功能
  isLoading = false,
  allowConsecutiveMessages = true,
  imageGenerationMode = false,
  onSendImagePrompt,
  webSearchActive = false,
  onStopResponse,
  isStreaming = false,
  isDebating = false, // 启用辩论状态
  toolsEnabled = false,
  availableModels = [], // 启用多模型功能
  onClearTopic,
  onNewTopic,
  toggleImageGenerationMode,
  toggleWebSearch,
  toggleToolsEnabled
}) => {
  const [expanded, setExpanded] = useState(false);
  // 注意：网络搜索和知识库选择器已集成到独立按钮组件中
  const [showExpandButton, setShowExpandButton] = useState(false); // 是否显示展开按钮
  const [textareaExpanded, setTextareaExpanded] = useState(false); // 文本区域展开状态
  const [inputHeight, setInputHeight] = useState(40); // 输入框容器高度
  const [isFullExpanded, setIsFullExpanded] = useState(false); // 是否全展开
  const [isActivated, setIsActivated] = useState(false); // 冷激活状态
  const [isVoiceMode, setIsVoiceMode] = useState(false); // 语音输入模式状态
  
  // 使用统一的平台检测，用 useMemo 缓存结果避免重复计算
  const isIOS = useMemo(() => checkIsIOS(), []);

  // 新增功能状态
  const [multiModelSelectorOpen, setMultiModelSelectorOpen] = useState(false); // 多模型选择器
  const [toastMessages, setToastMessages] = useState<any[]>([]); // Toast消息


  // 文件和图片上传相关状态
  const [images, setImages] = useState<ImageContent[]>([]);
  const [files, setFiles] = useState<FileContent[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // 知识库状态刷新标记
  const [knowledgeRefreshKey, setKnowledgeRefreshKey] = useState(0);

  // 获取当前话题状态
  const currentTopicId = useSelector((state: RootState) => state.messages.currentTopicId);
  const [currentTopicState, setCurrentTopicState] = useState<any>(null);

  // 使用自定义hooks
  const { styles, isDarkMode, inputBoxStyle } = useInputStyles();
  const { hasKnowledgeContext, getStoredKnowledgeContext, clearStoredKnowledgeContext } = useKnowledgeContext();

  // 获取设置控制状态
  const showAIDebateButton = useSelector((state: RootState) => state.settings.showAIDebateButton ?? true);
  const showQuickPhraseButton = useSelector((state: RootState) => state.settings.showQuickPhraseButton ?? true);
  const currentAssistant = useSelector((state: RootState) => state.assistants.currentAssistant);

  // 移除URL解析功能以提升性能

  // 文件上传功能
  const { handleImageUpload: uploadImages, handleFileUpload: uploadFiles } = useFileUpload({
    currentTopicState,
    setUploadingMedia
  });

  // 聊天输入逻辑 - 启用CompactChatInput的高级功能
  const {
    message,
    setMessage,
    textareaRef,
    canSendMessage,
    handleSubmit,
    handleKeyDown,
    handleChange,
    showCharCount,
    handleCompositionStart,
    handleCompositionEnd
  } = useChatInputLogic({
    onSendMessage,
    onSendMultiModelMessage,
    onSendImagePrompt,
    isLoading,
    allowConsecutiveMessages,
    imageGenerationMode,
    toolsEnabled,
    images,
    files,
    setImages,
    setFiles,
    enableTextareaResize: true, // 启用文本区域自动调整
    enableCompositionHandling: true, // 启用输入法处理
    enableCharacterCount: true, // 启用字符计数
    availableModels
  });

  // 语音识别功能
  const {
    isListening,
    error: voiceRecognitionError,
    startRecognition,
    stopRecognition,
  } = useVoiceRecognition();

  // 极简键盘管理 - 模仿 rikkahub
  const { isKeyboardVisible, hideKeyboard } = useKeyboard();

  // 包装 handleSubmit，在发送时隐藏键盘
  const wrappedHandleSubmit = useCallback(() => {
    hideKeyboard();
    handleSubmit();
  }, [hideKeyboard, handleSubmit]);

  /**
   * 键盘弹出时自动折叠输入框 - 模仿 rikkahub 的逻辑
   * 
   * 参考：rikkahub ChatInput.kt - LaunchedEffect(imeVisible)
   * 原因：展开的输入框（70vh）+ 键盘会占满整个屏幕，自动折叠提供更好的用户体验
   */
  useEffect(() => {
    if (isKeyboardVisible && textareaExpanded) {
      setTextareaExpanded(false);
    }
  }, [isKeyboardVisible, textareaExpanded]);

  // 使用重命名的变量来消除未使用警告
  useEffect(() => {
    // 仅用于显示可能的语音识别错误，防止未使用警告
    if (voiceRecognitionError) {
      // 静默处理错误
    }
  }, [voiceRecognitionError]);

  // Toast管理器订阅
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToastMessages);
    return unsubscribe;
  }, []);

  // 当话题ID变化时，从数据库获取话题信息
  useEffect(() => {
    const loadTopic = async () => {
      if (!currentTopicId) return;

      try {
        const topic = await topicCacheManager.getTopic(currentTopicId);
        if (topic) {
          setCurrentTopicState(topic);
        }
      } catch (error) {
        console.error('加载话题信息失败:', error);
      }
    };

    loadTopic();
  }, [currentTopicId]);

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



  // 窗口大小监听已移除，将重新实现

  // 注意：网络搜索和知识库功能已集成到独立按钮组件中

  // 修复折叠时高度异常：只在textareaExpanded变化时执行，避免每次输入都触发
  const prevTextareaExpandedRef = useRef(textareaExpanded);
  useEffect(() => {
    // 只处理从展开到折叠的状态变化
    if (prevTextareaExpandedRef.current && !textareaExpanded && textareaRef.current) {
      // 使用requestAnimationFrame确保DOM更新完成
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          // 重置高度以触发重新计算
          textareaRef.current.style.height = 'auto';
          // 下面的自动调整高度useEffect会处理实际的高度设置
        }
      });
    }
    // 更新上一次的textareaExpanded状态
    prevTextareaExpandedRef.current = textareaExpanded;
  }, [textareaExpanded, textareaRef]); // 移除message和isActivated依赖，避免每次输入都触发

  // 自动调整文本框和容器高度
  useEffect(() => {
    if (textareaRef.current) {
      // 冷激活状态下使用固定的小高度
      if (!isActivated && !message.trim()) {
        const coldHeight = 40; // 增加未激活状态下的高度到40px
        textareaRef.current.style.height = `${coldHeight}px`;
        setInputHeight(coldHeight + 16); // 容器高度
        return;
      }

      // 激活状态下的动态高度计算
      // 重置高度以获取真实的scrollHeight
      textareaRef.current.style.height = 'auto';

      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 24; // 最小高度（单行）
      const maxHeight = textareaExpanded ? (window.innerHeight * 0.7) : isFullExpanded ? 200 : 120; // 文本区域展开时使用屏幕高度的70%

      // 计算textarea的实际高度
      let textareaHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));

      // 如果内容超出最大高度，保持最大高度并启用滚动
      if (scrollHeight > maxHeight) {
        textareaHeight = maxHeight;
      }

      // 如果文本区域展开，不需要设置高度，由CSS样式控制
      if (!textareaExpanded) {
        textareaRef.current.style.height = `${textareaHeight}px`;
      }

      // 计算容器高度（textarea高度 + padding）
      const containerHeight = textareaExpanded ? (window.innerHeight * 0.7 + 16) : textareaHeight + 16; // 8px上下padding
      setInputHeight(containerHeight);
    }
  }, [message, isFullExpanded, isActivated, textareaExpanded]);

  // 处理输入框激活
  // 注意：移除了 iOS 特殊滚动处理，因为输入框已使用 position: fixed + bottom: keyboardHeight
  // 通过 useKeyboard hook 正确处理键盘弹出，不需要手动滚动页面
  const handleInputFocus = () => {
    console.log('[CompactChatInput] 输入框获得焦点');
    setIsActivated(true);
    // 键盘弹出时的位置调整由 ChatPageUI 的 InputContainer 通过 keyboardHeight 处理
  };

  // 处理输入框失活
  const handleInputBlur = () => {
    // 如果没有内容且不在加载状态，可以回到冷激活状态
    if (!message.trim() && !isLoading && !isStreaming) {
      setIsActivated(false);
    }
  };

  // 处理输入框点击（确保激活）
  const handleInputClick = () => {
    setIsActivated(true);
  };

  // 性能优化：使用useMemo缓存按钮可见性计算结果，避免重复计算
  const buttonVisibility = useMemo(() => {
    if (!textareaExpanded) {
      const textLength = message.length;
      const containerWidth = 280; // CompactChatInput 的估算容器宽度
      const charsPerLine = Math.floor(containerWidth / 14); // 根据字体大小估算每行字符数
      
      // 性能优化：使用字符串操作替代正则表达式（大文本时更快）
      let newlineCount = 0;
      if (textLength < 1000) {
        // 小文本使用split（快速）
        newlineCount = message.split('\n').length - 1;
      } else {
        // 大文本时使用循环（避免创建大量数组）
        for (let i = 0; i < Math.min(textLength, 10000); i++) {
          if (message[i] === '\n') newlineCount++;
        }
      }
      
      const estimatedLines = Math.ceil(textLength / charsPerLine) + newlineCount;
      return {
        showExpandButton: estimatedLines > 4
      };
    } else {
      // 展开状态下始终显示按钮（用于收起）
      return {
        showExpandButton: true
      };
    }
  }, [textareaExpanded, message]);

  // 使用防抖更新按钮可见性状态，避免频繁setState
  const buttonVisibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 清除之前的定时器
    if (buttonVisibilityTimeoutRef.current) {
      clearTimeout(buttonVisibilityTimeoutRef.current);
    }
    
    // 使用requestAnimationFrame + 防抖优化
    buttonVisibilityTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        setShowExpandButton(buttonVisibility.showExpandButton);
      });
    }, 100); // 防抖延迟
    
    return () => {
      if (buttonVisibilityTimeoutRef.current) {
        clearTimeout(buttonVisibilityTimeoutRef.current);
      }
    };
  }, [buttonVisibility]);

  // 优化的输入变化处理 - 移除重复调用，只保留核心逻辑
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleChange(e);
    // 有内容时保持激活状态
    if (e.target.value.trim()) {
      setIsActivated(true);
    }
    // 移除重复的checkShowExpandButton调用，由useEffect统一处理
  }, [handleChange]);

  // 处理键盘事件，包含全展开功能
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleKeyDown(e);
    // Ctrl/Cmd + Enter 切换全展开模式
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsFullExpanded(!isFullExpanded);
    }
  };



  // 处理图片上传
  const handleImageUpload = async (source: 'camera' | 'photos' = 'photos') => {
    try {
      const newImages = await uploadImages(source);
      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    }
  };

  // 处理文件上传
  const handleFileUpload = async () => {
    try {
      const newFiles = await uploadFiles();
      setFiles(prev => [...prev, ...newFiles]);
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败，请重试');
    }
  };

  // 删除已选择的图片
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 删除已选择的文件
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 语音识别处理函数
  const handleToggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    // 如果退出语音模式，停止录音
    if (isVoiceMode && isListening) {
      stopRecognition();
    }
  };



  const handleVoiceSendMessage = (voiceMessage: string) => {
    // 发送语音识别的消息
    if (voiceMessage.trim()) {
      // 创建正确的图片格式
      const formattedImages: SiliconFlowImageFormat[] = [...images, ...files.filter(f => f.mimeType.startsWith('image/'))].map(img => ({
        type: 'image_url',
        image_url: {
          url: img.base64Data || img.url
        }
      }));

      onSendMessage(
        voiceMessage.trim(),
        formattedImages.length > 0 ? formattedImages : undefined,
        toolsEnabled,
        files
      );

      // 重置状态
      setImages([]);
      setFiles([]);
      setUploadingMedia(false);
      setIsVoiceMode(false); // 发送后退出语音模式
    }
  };

  // 多模型发送处理
  const handleMultiModelSend = (selectedModels: any[]) => {
    if (onSendMultiModelMessage && message.trim()) {
      // 创建正确的图片格式
      const formattedImages: SiliconFlowImageFormat[] = [...images, ...files.filter(f => f.mimeType.startsWith('image/'))].map(img => ({
        type: 'image_url',
        image_url: {
          url: img.base64Data || img.url
        }
      }));

      onSendMultiModelMessage(
        message.trim(),
        selectedModels,
        formattedImages.length > 0 ? formattedImages : undefined,
        toolsEnabled,
        files
      );

      // 重置状态
      setMessage('');
      setImages([]);
      setFiles([]);
      setUploadingMedia(false);
      setMultiModelSelectorOpen(false);
    }
  };

  // 快捷短语插入处理
  const handleInsertPhrase = (content: string) => {
    setMessage(prev => prev + content);
    setIsActivated(true); // 插入短语后激活输入框
  };

  // 使用统一的长文本粘贴 Hook
  const { handlePaste: handleLongTextPaste, shouldConvertToFile } = useLongTextPaste({
    onFileAdd: (file) => {
      setFiles(prev => [...prev, file]);
    },
    onSuccess: (message) => {
      toastManager.show({
        message,
        type: 'success',
        duration: 3000
      });
    },
    onError: (error) => {
      console.error('长文本转文件失败:', error);
      toastManager.show({
        message: '长文本转文件失败，请重试',
        type: 'error',
        duration: 3000
      });
    }
  });

  // 剪贴板粘贴事件处理函数
  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 获取粘贴的文本
    const textData = clipboardData.getData('text');
    
    // 检查是否需要转换为文件（同步检查，异步处理）
    // 必须在异步操作前调用 preventDefault，否则文本会被粘贴到输入框
    if (textData && shouldConvertToFile(textData)) {
      e.preventDefault(); // 立即阻止默认粘贴行为
      
      setUploadingMedia(true);
      try {
        await handleLongTextPaste(e);
      } finally {
        setUploadingMedia(false);
      }
      return;
    }

    // 处理图片粘贴
    const items = Array.from(clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length === 0) return;

    e.preventDefault(); // 阻止默认粘贴行为

    try {
      setUploadingMedia(true);

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            const timestamp = Date.now();
            const uniqueId = `paste-img-${timestamp}-${Math.random().toString(36).substring(2, 11)}`;
            const newImage: ImageContent = {
              id: uniqueId,
              url: base64Data,
              base64Data: base64Data,
              mimeType: file.type,
              name: `粘贴的图片_${timestamp}.${file.type && typeof file.type === 'string' && file.type.includes('/') ? file.type.split('/')[1] : 'png'}`,
              size: file.size
            };
            setImages(prev => [...prev, newImage]);
          };
          reader.readAsDataURL(file);
        }
      }

      toastManager.show({
        message: `成功粘贴 ${imageItems.length} 张图片`,
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('粘贴图片处理失败:', error);
      toastManager.show({
        message: '粘贴图片失败，请重试',
        type: 'error',
        duration: 3000
      });
    } finally {
      setUploadingMedia(false);
    }
  };



  // 使用配置文件获取图标
  // 注意：网络搜索和知识库按钮已替换为独立组件
  const basicIcons = getBasicIcons({
    toolsEnabled,
    webSearchActive,
    imageGenerationMode,
    onNewTopic,
    onClearTopic,
    handleWebSearchClick: () => {}, // 占位，实际由 WebSearchButton 处理
    toggleImageGenerationMode
  });

  const expandedIcons = getExpandedIcons({
    toolsEnabled,
    uploadingMedia,
    toggleToolsEnabled,
    handleImageUpload,
    handleFileUpload,
    handleKnowledgeClick: () => {} // 占位，实际由 KnowledgeButton 处理
  });



  return (
    <Box
      className="chat-input-container"
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '800px' }, // 移动端占满宽度，桌面端限制最大宽度
        margin: { xs: '0', sm: '0 auto' }, // 移动端无边距，桌面端居中
        paddingLeft: { xs: '8px', sm: '0' }, // 移动端使用padding
        paddingRight: { xs: '8px', sm: '0' }, // 移动端使用padding
      // 添加全局滚动条样式
      '& textarea::-webkit-scrollbar': {
        width: '6px',
      },
      '& textarea::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '& textarea::-webkit-scrollbar-thumb': {
        background: isDarkMode ? '#555' : '#ccc',
        borderRadius: '3px',
      },
      '& textarea::-webkit-scrollbar-thumb:hover': {
        background: isDarkMode ? '#666' : '#999',
      },
      // 添加iOS设备上的特殊样式
      ...(isIOS ? {
        position: 'relative',
        zIndex: 1000, // 确保输入框在较高层级
        marginBottom: '34px', // 为iOS设备增加底部边距，避开底部返回横条
        paddingBottom: '10px' // 额外的内边距
      } : {})
    }}>
      {/* 知识库状态显示 */}
      {hasKnowledgeContext() && (() => {
        const contextData = getStoredKnowledgeContext();
        const knowledgeBaseName = contextData?.knowledgeBase?.name || '未知知识库';
        return (
          <Box key={`knowledge-${knowledgeRefreshKey}`} sx={{ px: 1 }}>
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

      {/* 输入框区域 */}
      {isVoiceMode ? (
        /* 增强语音输入模式 */
        <EnhancedVoiceInput
          isDarkMode={isDarkMode}
          onClose={() => setIsVoiceMode(false)}
          onSendMessage={handleVoiceSendMessage}
          onInsertText={(text: string) => {
            setMessage(prev => prev + text);
            setIsVoiceMode(false);
          }}
          startRecognition={startRecognition}
          currentMessage={message}
        />
      ) : (
        /* 文本输入模式 */
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end', // 改为底部对齐，让按钮固定在底部
            background: isDarkMode ? '#2A2A2A' : '#FFFFFF', // 不透明背景
            border: styles.border,
            borderRadius: isActivated || expanded || message.trim().length > 0
              ? `${styles.borderRadius} ${styles.borderRadius} 0 0` // 激活时只有上边圆角
              : styles.borderRadius, // 冷激活时全圆角
            boxShadow: styles.boxShadow,
            padding: '8px 12px',
            marginBottom: '0', // 移除间距，让它们贴合
            borderBottom: isActivated || expanded || message.trim().length > 0 ? 'none' : styles.border, // 冷激活时保留底部边框
            minHeight: '40px', // 最小高度
            height: `${inputHeight}px`, // 动态高度
            transition: 'all 0.2s ease', // 平滑过渡
            cursor: !isActivated && !message.trim() ? 'pointer' : 'text', // 冷激活时显示指针
            position: 'relative', // 添加相对定位，用于放置展开按钮
            '&:hover': !isActivated && !message.trim() ? {
              borderColor: isDarkMode ? '#555' : '#ddd',
              boxShadow: `0 2px 8px ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            } : {}
          }}
          onClick={!isActivated ? handleInputClick : undefined} // 冷激活时整个区域可点击
        >
          {/* 展开/收起按钮 - 显示在输入框容器右上角 */}
          {showExpandButton && (
            <Box sx={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              zIndex: 10
            }}>
              <IconButton
                onClick={() => setTextareaExpanded(!textareaExpanded)}
                size="small"
                sx={{
                  color: textareaExpanded ? '#2196F3' : (isDarkMode ? '#B0B0B0' : '#555'),
                  padding: '2px',
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  backgroundColor: isDarkMode
                    ? 'rgba(42, 42, 42, 0.9)'
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                {textareaExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronUp size={14} />
                )}
              </IconButton>
            </Box>
          )}
        <Box sx={{
          flex: 1,
          marginRight: '8px',
          // 添加样式来防止 placeholder 被选择
          '& textarea::placeholder': {
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            pointerEvents: 'none'
          }
        }}>
          <textarea
            ref={textareaRef}
            className="hide-scrollbar"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              resize: 'none',
              fontSize: '14px',
              lineHeight: '1.4',
              fontFamily: 'inherit',
              color: isDarkMode ? '#ffffff' : '#000000',
              minHeight: textareaExpanded ? '70vh' : (isActivated ? '24px' : '40px'), // 展开时使用大高度
              height: textareaExpanded ? '70vh' : 'auto', // 展开时固定高度
              maxHeight: textareaExpanded ? '70vh' : (isActivated ? '120px' : '40px'), // 展开时使用大高度
              overflow: textareaExpanded || isActivated ? 'auto' : 'hidden', // 展开或激活时显示滚动条
              padding: '0',
              transition: 'all 0.3s ease', // 添加过渡动画
            }}
            placeholder={
              !isActivated
                ? "和ai助手说点什么..." // 冷激活状态的简化placeholder
                : imageGenerationMode
                  ? "输入图像生成提示词... (Ctrl+Enter 全展开)"
                  : webSearchActive
                    ? "输入网络搜索内容... (Ctrl+Enter 全展开)"
                    : "和ai助手说点什么... (Ctrl+Enter 全展开)"
            }
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onClick={handleInputClick}
            onPaste={handlePaste}
            disabled={isLoading && !allowConsecutiveMessages}
          />

          {/* 字符计数显示 */}
          {showCharCount && (
            <div
              style={{
                position: 'absolute',
                bottom: '-20px',
                right: '0',
                fontSize: '12px',
                color: message.length > 1000 ? '#f44336' : isDarkMode ? '#888' : '#666',
                opacity: 0.8,
                transition: 'all 0.2s ease'
              }}
            >
              {message.length}{message.length > 1000 ? ' (过长)' : ''}
            </div>
          )}
        </Box>

        {/* 语音识别和发送按钮 */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', paddingBottom: '4px' }}>
          {/* 语音识别按钮 */}
          <VoiceButton
            isVoiceMode={isVoiceMode}
            isDisabled={uploadingMedia || (isLoading && !allowConsecutiveMessages)}
            onToggleVoiceMode={handleToggleVoiceMode}
            size="small"
            color="default"
            tooltip={isVoiceMode ? "退出语音输入模式" : "切换到语音输入模式"}
          />

          {/* 发送按钮 */}
          <IconButton
            onClick={isStreaming && onStopResponse ? onStopResponse : wrappedHandleSubmit}
            disabled={!isStreaming && (!canSendMessage() || (isLoading && !allowConsecutiveMessages))}
            sx={{
              backgroundColor: isStreaming
                ? '#ff4d4f'
                : !canSendMessage() || (isLoading && !allowConsecutiveMessages)
                  ? 'rgba(0,0,0,0.1)'
                  : imageGenerationMode
                    ? '#9C27B0'
                    : webSearchActive
                      ? '#3b82f6'
                      : '#4CAF50',
              color: 'white',
              width: 32,
              height: 32,
              '&:hover': {
                backgroundColor: isStreaming
                  ? '#ff7875'
                  : !canSendMessage() || (isLoading && !allowConsecutiveMessages)
                    ? 'rgba(0,0,0,0.1)'
                    : imageGenerationMode
                      ? '#AB47BC'
                      : webSearchActive
                        ? '#1976d2'
                        : '#66BB6A',
              },
              '&:disabled': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                color: 'rgba(0,0,0,0.3)'
              }
            }}
          >
            {isStreaming ? <Square size={18} /> : <Send size={18} />}
          </IconButton>
        </Box>
        </Box>
      )}

      {/* 文件预览显示 */}
      {(images.length > 0 || files.length > 0) && (
        <Box
          sx={{
            padding: '8px 12px',
            background: isDarkMode ? '#2A2A2A' : '#FFFFFF',
            border: styles.border,
            borderTop: 'none',
            borderBottom: 'none',
            maxHeight: '120px',
            overflowY: 'auto'
          }}
        >
          {/* 移除URL解析状态显示以提升性能 */}

          {/* 图片预览 */}
          {images.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                已选择 {images.length} 张图片
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {images.map((image, index) => {
                  // 创建唯一的 key，避免第三个图片重复显示问题
                  const imageKey = `image-${index}-${image.name || 'unnamed'}-${image.size || Date.now()}`;
                  // 添加时间戳防止缓存问题
                  const imageSrc = image.base64Data || (image.url ? `${image.url}?t=${Date.now()}` : '');

                  return (
                    <Box
                      key={imageKey}
                      sx={{
                        position: 'relative',
                        width: 60,
                        height: 60,
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <img
                        src={imageSrc}
                        alt={`预览 ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          // 图片加载失败时的处理
                          console.warn('图片加载失败:', image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index)}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'error.main',
                          color: 'white',
                          width: 20,
                          height: 20,
                          '&:hover': { backgroundColor: 'error.dark' }
                        }}
                      >
                        <X size={12} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* 文件预览 */}
          {files.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                已选择 {files.length} 个文件
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {files.map((file, index) => {
                  // 创建唯一的 key，避免第三个文件重复显示问题
                  const fileKey = `file-${index}-${file.name}-${file.size || Date.now()}`;

                  return (
                    <Box
                      key={fileKey}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Paperclip size={16} style={{ color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFile(index)}
                        sx={{ p: 0.5 }}
                      >
                        <X size={12} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* 功能图标行 - 优化视觉层次和对比度，冷激活时可选择性显示 */}
      <Collapse in={isActivated || expanded || message.trim().length > 0}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px', // 增加padding
            background: isDarkMode ? '#2A2A2A' : '#FFFFFF',
            border: styles.border,
            borderTop: 'none',
            borderRadius: expanded ? 'none' : `0 0 ${styles.borderRadius} ${styles.borderRadius}`, // 展开时移除下圆角
            boxShadow: styles.boxShadow,
            minHeight: '40px', // 增加高度，与输入框保持一致
            transition: 'all 0.2s ease', // 添加过渡动画
          }}
        >
        {/* 基础功能图标 */}
        {basicIcons.map((item, index) => {
          // 如果是工具按钮，使用 MCPToolsButton 组件
          if (item.label === '工具') {
            return (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                <MCPToolsButton
                  toolsEnabled={toolsEnabled}
                  onToolsEnabledChange={toggleToolsEnabled ? () => toggleToolsEnabled() : undefined}
                  variant="icon-button-compact"
                />
              </Box>
            );
          }

          // 如果是网络搜索按钮，使用 WebSearchButton 组件
          if (item.label === '网络搜索') {
            return (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                <WebSearchButton
                  webSearchActive={webSearchActive}
                  toggleWebSearch={toggleWebSearch}
                  variant="icon-button-compact"
                />
              </Box>
            );
          }

          return (
            <IconButton
              key={index}
              onClick={item.onClick}
              size="small"
              sx={{
                color: item.active
                  ? item.color
                  : isDarkMode ? '#B0B0B0' : '#555', // 提高对比度
                backgroundColor: item.active ? `${item.color}15` : 'transparent',
                border: item.active ? `1px solid ${item.color}30` : '1px solid transparent',
                width: 34, // 稍微增大
                height: 34,
                borderRadius: '8px', // 更圆润
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: `${item.color}20`,
                  borderColor: `${item.color}50`,
                  color: item.color,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 2px 8px ${item.color}20`
                }
              }}
            >
              {item.icon}
            </IconButton>
          );
        })}

        {/* AI辩论按钮 */}
        {showAIDebateButton && (
          <AIDebateButton
            onStartDebate={onStartDebate}
            onStopDebate={onStopDebate}
            isDebating={isDebating}
            disabled={uploadingMedia || (isLoading && !allowConsecutiveMessages)}
            question={message}
          />
        )}

        {/* 快捷短语按钮 */}
        {showQuickPhraseButton && (
          <QuickPhraseButton
            onInsertPhrase={handleInsertPhrase}
            assistant={currentAssistant}
            disabled={uploadingMedia || (isLoading && !allowConsecutiveMessages)}
            size="small"
          />
        )}

        {/* 展开/收起按钮 */}
        <IconButton
          onClick={() => setExpanded(!expanded)}
          size="small"
          sx={{
            color: expanded ? '#2196F3' : isDarkMode ? '#B0B0B0' : '#555',
            backgroundColor: expanded ? '#2196F315' : 'transparent',
            border: expanded ? '1px solid #2196F330' : '1px solid transparent',
            width: 30,
            height: 30,
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#2196F320',
              borderColor: '#2196F350',
              color: '#2196F3',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px #2196F320'
            }
          }}
        >
          {expanded ? <X size={20} /> : <Plus size={20} />}
        </IconButton>
        </Box>
      </Collapse>

      {/* 扩展功能面板 - 优化为紧凑的横向布局 */}
      <Collapse in={expanded}>
        <Box
          sx={{
            marginTop: '0',
            padding: '8px 12px', // 减少padding
            background: isDarkMode ? '#2A2A2A' : '#FFFFFF', // 与主体保持一致
            border: styles.border,
            borderTop: 'none',
            borderRadius: `0 0 ${styles.borderRadius} ${styles.borderRadius}`,
            boxShadow: styles.boxShadow,
            backdropFilter: inputBoxStyle === 'modern' ? 'blur(10px)' : 'none',
            WebkitBackdropFilter: inputBoxStyle === 'modern' ? 'blur(10px)' : 'none',
          }}
        >
          {/* 紧凑的横向布局 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 2, // 增加间距
              flexWrap: 'wrap' // 允许换行
            }}
          >
            {expandedIcons.map((item, index) => {
              // 如果是知识库按钮，使用 KnowledgeButton 组件
              if (item.label === '知识库') {
                return (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                    <KnowledgeButton variant="icon-button-compact" />
                  </Box>
                );
              }

              return (
              <Box
                key={index}
                onClick={item.disabled ? undefined : item.onClick}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  padding: '6px 12px', // 横向padding
                  borderRadius: '12px', // 更圆润的边角
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.5 : 1,
                  backgroundColor: item.active
                    ? `${item.color}15` // 更淡的背景色
                    : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: item.active
                    ? `1px solid ${item.color}40`
                    : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  transition: 'all 0.2s ease',
                  minWidth: 'fit-content',
                  '&:hover': item.disabled ? {} : {
                    backgroundColor: `${item.color}20`,
                    borderColor: `${item.color}60`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 2px 8px ${item.color}20`
                  }
                }}
              >
                <Box
                  sx={{
                    width: 20, // 更小的图标
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.active ? item.color : isDarkMode ? '#B0B0B0' : '#666',
                    '& svg': {
                      fontSize: '18px' // 明确设置图标大小
                    }
                  }}
                >
                  {item.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: item.active ? item.color : isDarkMode ? '#B0B0B0' : '#666',
                    fontSize: '12px',
                    fontWeight: item.active ? 500 : 400,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
              );
            })}

            {/* 多模型选择按钮 */}
            {onSendMultiModelMessage && availableModels.length > 1 && (
              <Box
                onClick={() => setMultiModelSelectorOpen(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  padding: '6px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  transition: 'all 0.2s ease',
                  minWidth: 'fit-content',
                  '&:hover': {
                    backgroundColor: '#FF9800' + '20',
                    borderColor: '#FF9800' + '60',
                    transform: 'translateY(-1px)',
                    boxShadow: `0 2px 8px ${'#FF9800'}20`
                  }
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDarkMode ? '#B0B0B0' : '#666',
                    '& svg': {
                      fontSize: '18px'
                    }
                  }}
                >
                  <Send size={18} />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: isDarkMode ? '#B0B0B0' : '#666',
                    fontSize: '12px',
                    fontWeight: 400,
                    whiteSpace: 'nowrap'
                  }}
                >
                  多模型
                </Typography>
              </Box>
            )}

            {/* 添加一个提示文字，说明这里可以添加更多功能 */}
            <Typography
              variant="caption"
              sx={{
                color: isDarkMode ? '#666' : '#999',
                fontSize: '11px',
                fontStyle: 'italic',
                marginLeft: 'auto'
              }}
            >
              更多功能即将推出...
            </Typography>
          </Box>
        </Box>
      </Collapse>

      {/* 注意：网络搜索和知识库选择器已集成到独立按钮组件中 */}

      {/* 多模型选择器 */}
      <MultiModelSelector
        open={multiModelSelectorOpen}
        onClose={() => setMultiModelSelectorOpen(false)}
        availableModels={availableModels}
        onSelectionChange={handleMultiModelSend}
        maxSelection={5}
      />

      {/* Toast通知 */}
      <EnhancedToast
        messages={toastMessages}
        onClose={(id) => toastManager.remove(id)}
        maxVisible={3}
      />

    </Box>
  );
};

export default CompactChatInput;
