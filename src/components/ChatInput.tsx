import React, { useState, useEffect, useCallback } from 'react';
import { IconButton, CircularProgress, Badge, Tooltip } from '@mui/material';
import { Send, Plus, Link, Square, ChevronDown, ChevronUp, Keyboard, Mic } from 'lucide-react';

import { useChatInputLogic } from '../shared/hooks/useChatInputLogic';
import { useFileUpload } from '../shared/hooks/useFileUpload';
import { useUrlScraper } from '../shared/hooks/useUrlScraper';
import { useInputStyles } from '../shared/hooks/useInputStyles';
import MultiModelSelector from './MultiModelSelector';
import type { ImageContent, SiliconFlowImageFormat, FileContent } from '../shared/types';
import { Image, Search } from 'lucide-react';
import UrlScraperStatus from './UrlScraperStatus';
import type { FileStatus } from './FilePreview';
import IntegratedFilePreview from './IntegratedFilePreview';
import UploadMenu from './UploadMenu';
import EnhancedToast, { toastManager } from './EnhancedToast';
import { dexieStorage } from '../shared/services/DexieStorageService';
import { useSelector } from 'react-redux';
import type { RootState } from '../shared/store';
import AIDebateButton from './AIDebateButton';
import type { DebateConfig } from '../shared/services/AIDebateService';
import QuickPhraseButton from './QuickPhraseButton';
import { useVoiceRecognition } from '../shared/hooks/useVoiceRecognition';
import { EnhancedVoiceInput } from './VoiceRecognition';
import { getThemeColors } from '../shared/utils/themeUtils';
import { useTheme } from '@mui/material/styles';

interface ChatInputProps {
  onSendMessage: (message: string, images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void;
  onSendMultiModelMessage?: (message: string, models: any[], images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void; // 多模型发送回调
  onStartDebate?: (question: string, config: DebateConfig) => void; // 开始AI辩论回调
  onStopDebate?: () => void; // 停止AI辩论回调
  isLoading?: boolean;
  allowConsecutiveMessages?: boolean; // 允许连续发送消息，即使AI尚未回复
  imageGenerationMode?: boolean; // 是否处于图像生成模式
  onSendImagePrompt?: (prompt: string) => void; // 发送图像生成提示词的回调
  webSearchActive?: boolean; // 是否处于网络搜索模式
  onDetectUrl?: (url: string) => Promise<string>; // 用于检测并解析URL的回调
  onStopResponse?: () => void; // 停止AI回复的回调
  isStreaming?: boolean; // 是否正在流式响应中
  isDebating?: boolean; // 是否正在AI辩论中
  toolsEnabled?: boolean; // 工具开关状态
  availableModels?: any[]; // 可用模型列表
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendMultiModelMessage,
  onStartDebate,
  onStopDebate,
  isLoading = false,
  allowConsecutiveMessages = true, // 默认允许连续发送
  imageGenerationMode = false, // 默认不是图像生成模式
  onSendImagePrompt,
  webSearchActive = false, // 默认不是网络搜索模式
  onDetectUrl,
  onStopResponse,
  isStreaming = false,
  isDebating = false, // 默认不在辩论中
  toolsEnabled = true, // 默认启用工具
  availableModels = [] // 默认空数组
}) => {
  // 基础状态
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [uploadMenuAnchorEl, setUploadMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [multiModelSelectorOpen, setMultiModelSelectorOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false); // 新增: 是否是iOS设备
  // 语音识别三状态管理
  const [voiceState, setVoiceState] = useState<'normal' | 'voice-mode' | 'recording'>('normal');
  const [expanded, setExpanded] = useState(false); // 新增: 扩展显示状态
  const [expandedHeight, setExpandedHeight] = useState(Math.floor(window.innerHeight * 0.7)); // 展开时的高度
  const [showExpandButton, setShowExpandButton] = useState(false); // 是否显示展开按钮

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);


  // 文件和图片状态
  const [images, setImages] = useState<ImageContent[]>([]);
  const [files, setFiles] = useState<FileContent[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // 文件状态管理
  const [fileStatuses, setFileStatuses] = useState<Record<string, { status: FileStatus; progress?: number; error?: string }>>({});

  // Toast消息管理
  const [toastMessages, setToastMessages] = useState<any[]>([]);

  // 获取当前话题状态
  const currentTopicId = useSelector((state: RootState) => state.messages.currentTopicId);
  const [currentTopicState, setCurrentTopicState] = useState<any>(null);

  // 获取当前助手状态
  const currentAssistant = useSelector((state: RootState) => state.assistants.currentAssistant);

  // 获取设置状态
  const settings = useSelector((state: RootState) => state.settings);

  // 使用共享的 hooks
  const { styles, isDarkMode, inputBoxStyle } = useInputStyles();

  // 获取主题和主题工具
  const theme = useTheme();
  const themeStyle = useSelector((state: RootState) => state.settings.themeStyle);
  const themeColors = getThemeColors(theme, themeStyle);

  // 获取AI辩论按钮显示设置
  const showAIDebateButton = useSelector((state: RootState) => state.settings.showAIDebateButton ?? true);

  // 获取快捷短语按钮显示设置
  const showQuickPhraseButton = useSelector((state: RootState) => state.settings.showQuickPhraseButton ?? true);

  // URL解析功能
  const {
    detectedUrl,
    parsedContent,
    urlScraperStatus,
    scraperError,
    resetUrlScraper,
    detectUrlInMessage
  } = useUrlScraper({ onDetectUrl });

  // 文件上传功能
  const { handleImageUpload, handleFileUpload } = useFileUpload({
    currentTopicState,
    setUploadingMedia
  });

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
    toolsEnabled,
    parsedContent,
    images,
    files,
    setImages,
    setFiles,
    resetUrlScraper,
    enableTextareaResize: true,
    enableCompositionHandling: true,
    enableCharacterCount: true,
    availableModels
  });

  // 语音识别功能
  const {
    isListening,
    startRecognition,
    stopRecognition,
  } = useVoiceRecognition();

  // 当话题ID变化时，从数据库获取话题信息
  useEffect(() => {
    const loadTopic = async () => {
      if (!currentTopicId) return;

      try {
        const topic = await dexieStorage.getTopic(currentTopicId);
        if (topic) {
          setCurrentTopicState(topic);
        }
      } catch (error) {
        console.error('加载话题信息失败:', error);
      }
    };

    loadTopic();
  }, [currentTopicId]);

  // Toast消息订阅
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToastMessages);
    return unsubscribe;
  }, []);

  // 从 useInputStyles hook 获取样式
  const { border, borderRadius, boxShadow } = styles;
  const iconColor = themeColors.iconColor;
  const textColor = themeColors.textPrimary;
  const disabledColor = themeColors.isDark ? '#555' : '#ccc';

  // 检测iOS设备
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                       (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    setIsIOS(isIOSDevice);
  }, []);

  // 监听窗口大小变化，更新展开高度
  useEffect(() => {
    const updateExpandedHeight = () => {
      setExpandedHeight(Math.floor(window.innerHeight * 0.7));
    };

    window.addEventListener('resize', updateExpandedHeight);
    return () => window.removeEventListener('resize', updateExpandedHeight);
  }, []);

  // handleSubmit 现在由 useChatInputLogic hook 提供

  // 处理多模型发送
  const handleMultiModelSend = async (selectedModels: any[]) => {
    if (!message.trim() && images.length === 0 && files.length === 0) return;
    if (!onSendMultiModelMessage) return;

    let processedMessage = message.trim();

    // 如果有解析的内容，添加到消息中
    if (parsedContent && urlScraperStatus === 'success') {
      processedMessage = `${processedMessage}\n\n${parsedContent}`;
      // 重置URL解析状态 - 使用 hook 提供的函数
      resetUrlScraper();
    }

    // 合并images数组和files中的图片文件
    const allImages = [
      ...images,
      ...files.filter(f => f.mimeType.startsWith('image/')).map(file => ({
        base64Data: file.base64Data,
        url: file.url || '',
        width: file.width,
        height: file.height
      } as ImageContent))
    ];

    // 创建正确的图片格式，避免重复处理
    const formattedImages: SiliconFlowImageFormat[] = await Promise.all(
      allImages.map(async (img) => {
        let imageUrl = img.base64Data || img.url;

        // 如果是图片引用格式，需要从数据库加载实际图片
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

    // 过滤掉图片文件，避免重复发送
    const nonImageFiles = files.filter(f => !f.mimeType.startsWith('image/'));

    console.log('发送多模型消息:', {
      message: processedMessage,
      models: selectedModels.map(m => `${m.provider || m.providerType}:${m.id}`),
      images: formattedImages.length,
      files: files.length,
      toolsEnabled: toolsEnabled
    });

    onSendMultiModelMessage(
      processedMessage,
      selectedModels,
      formattedImages.length > 0 ? formattedImages : undefined,
      toolsEnabled,
      nonImageFiles
    );

    // 重置状态 - 使用 hook 提供的函数
    setMessage('');
    setImages([]);
    setFiles([]);
    setUploadingMedia(false);
  };

  // 输入处理逻辑现在由 useChatInputLogic 和 useUrlScraper hooks 提供

  // 检测是否需要显示展开按钮
  const checkShowExpandButton = useCallback(() => {
    if (textareaRef.current && !expanded) {
      const textarea = textareaRef.current;
      // 检查是否出现滚动条
      const hasScroll = textarea.scrollHeight > textarea.clientHeight + 2; // 添加2px容差
      setShowExpandButton(hasScroll);
    } else if (expanded) {
      // 展开状态下始终显示按钮（用于收起）
      setShowExpandButton(true);
    } else {
      setShowExpandButton(false);
    }
  }, [expanded]);

  // 监听消息内容变化，检测是否显示展开按钮
  useEffect(() => {
    checkShowExpandButton();
  }, [message, checkShowExpandButton]);

  // 监听展开状态变化
  useEffect(() => {
    // 延迟检测，确保DOM更新完成
    setTimeout(checkShowExpandButton, 100);
  }, [expanded, checkShowExpandButton]);

  // 增强的 handleChange 以支持 URL 检测和展开按钮检测
  const enhancedHandleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // 调用 hook 提供的 handleChange
    handleChange(e);
    // 检测 URL
    detectUrlInMessage(e.target.value);
    // 延迟检测展开按钮显示（等待高度调整完成）
    setTimeout(checkShowExpandButton, 50);
  };

  // 增强的 handleKeyDown 以支持展开功能
  const enhancedHandleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 调用原始的 handleKeyDown
    handleKeyDown(e);

    // Ctrl/Cmd + Enter 切换展开模式
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setExpanded(!expanded);
    }
  };

  // 增强的焦点处理，适应iOS设备
  useEffect(() => {
    const currentTextarea = textareaRef.current; // 保存当前的 ref 值

    // 设置一个延迟以确保组件挂载后聚焦生效
    const timer = setTimeout(() => {
      if (currentTextarea) {
        // 聚焦后立即模糊，这有助于解决某些Android设备上的复制粘贴问题
        currentTextarea.focus();
        currentTextarea.blur();

        // 确保初始高度正确设置，以显示完整的placeholder
        const initialHeight = isMobile ? 32 : isTablet ? 36 : 34;
        currentTextarea.style.height = `${initialHeight}px`;
      }
    }, 300);

    // 添加键盘显示检测
    const handleFocus = () => {
      setIsKeyboardVisible(true);

      // iOS设备特殊处理
      if (isIOS && textareaRef.current) {
        // 延迟执行，确保输入法已弹出
        setTimeout(() => {
          // 滚动到输入框位置
          textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // 额外处理：尝试滚动页面到底部
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });

          // iOS特有：确保输入框在可视区域内
          const viewportHeight = window.innerHeight;
          const keyboardHeight = viewportHeight * 0.4; // 估计键盘高度约为视口的40%

          if (textareaRef.current) {
            const inputRect = textareaRef.current.getBoundingClientRect();
            const inputBottom = inputRect.bottom;

            // 如果输入框底部被键盘遮挡，则滚动页面
            if (inputBottom > viewportHeight - keyboardHeight) {
              const scrollAmount = inputBottom - (viewportHeight - keyboardHeight) + 20; // 额外20px空间
              window.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
              });
            }
          }
        }, 400); // 增加延迟时间，确保键盘完全弹出
      }
    };

    const handleBlur = () => {
      setIsKeyboardVisible(false);
    };

    if (currentTextarea) {
      currentTextarea.addEventListener('focus', handleFocus);
      currentTextarea.addEventListener('blur', handleBlur);
    }

    return () => {
      clearTimeout(timer);
      if (currentTextarea) {
        currentTextarea.removeEventListener('focus', handleFocus);
        currentTextarea.removeEventListener('blur', handleBlur);
      }
    };
  }, [isMobile, isTablet, isIOS]); // eslint-disable-line react-hooks/exhaustive-deps

  // 处理上传菜单
  const handleOpenUploadMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setUploadMenuAnchorEl(event.currentTarget);
  };

  const handleCloseUploadMenu = () => {
    setUploadMenuAnchorEl(null);
  };

  // 文件上传处理函数 - 包装 hook 提供的函数以更新本地状态
  const handleImageUploadLocal = async (source: 'camera' | 'photos' = 'photos') => {
    try {
      const uploadedImages = await handleImageUpload(source);
      // 只有当实际上传了图片时才更新状态
      if (uploadedImages && uploadedImages.length > 0) {
        setImages(prev => [...prev, ...uploadedImages]);
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      // 确保在错误情况下重置上传状态
      setUploadingMedia(false);
    }
  };

  const handleFileUploadLocal = async () => {
    try {
      const uploadedFiles = await handleFileUpload();
      // 只有当实际上传了文件时才更新状态
      if (uploadedFiles && uploadedFiles.length > 0) {
        setFiles(prev => [...prev, ...uploadedFiles]);
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      // 确保在错误情况下重置上传状态
      setUploadingMedia(false);
    }
  };

  // 删除已选择的图片
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 删除已选择的文件
  const handleRemoveFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove) {
      const fileKey = `${fileToRemove.name}-${fileToRemove.size}`;
      // 清理文件状态
      setFileStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[fileKey];
        return newStatuses;
      });
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

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

  // 语音识别处理函数
  const handleToggleVoiceMode = () => {
    if (voiceState === 'normal') {
      // 直接进入录音模式
      setVoiceState('recording');
    } else if (voiceState === 'recording') {
      // 停止录音并退出
      if (isListening) {
        stopRecognition().catch(err => console.error('停止语音识别出错:', err));
      }
      setVoiceState('normal');
    }
  };





  const handleVoiceSendMessage = async (voiceMessage: string) => {
    // 确保有内容才发送
    if (voiceMessage && voiceMessage.trim()) {
      // 合并images数组和files中的图片文件
      const allImages = [
        ...images,
        ...files.filter(f => f.mimeType.startsWith('image/')).map(file => ({
          base64Data: file.base64Data,
          url: file.url || '',
          width: file.width,
          height: file.height
        } as ImageContent))
      ];

      // 创建正确的图片格式，避免重复处理
      const formattedImages: SiliconFlowImageFormat[] = await Promise.all(
        allImages.map(async (img) => {
          let imageUrl = img.base64Data || img.url;

          // 如果是图片引用格式，需要从数据库加载实际图片
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

      // 过滤掉图片文件，避免重复发送
      const nonImageFiles = files.filter(f => !f.mimeType.startsWith('image/'));

      onSendMessage(
        voiceMessage.trim(),
        formattedImages.length > 0 ? formattedImages : undefined,
        toolsEnabled,
        nonImageFiles
      );

      // 重置状态
      setImages([]);
      setFiles([]);
      setUploadingMedia(false);
      setVoiceState('normal'); // 发送后退出语音模式

      // 添加触觉反馈 (如果支持)
      if ('navigator' in window && 'vibrate' in navigator) {
        try {
          navigator.vibrate(50); // 短振动反馈
        } catch (e) {
          // 忽略振动API错误
        }
      }
    }
  };

  // 拖拽事件处理函数
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    try {
      setUploadingMedia(true);

      for (const file of droppedFiles) {
        if (file.type.startsWith('image/')) {
          // 处理图片文件
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            const newImage: ImageContent = {
              id: `${Date.now()}-${Math.random()}`,
              url: base64Data,
              base64Data: base64Data,
              mimeType: file.type,
              name: file.name,
              size: file.size
            };
            setImages(prev => [...prev, newImage]);
          };
          reader.readAsDataURL(file);
        } else {
          // 处理其他文件
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            const newFile: FileContent = {
              id: `${Date.now()}-${Math.random()}`,
              name: file.name,
              mimeType: file.type,
              extension: file.name.split('.').pop() || '',
              size: file.size,
              base64Data: base64Data,
              url: ''
            };
            setFiles(prev => [...prev, newFile]);
          };
          reader.readAsDataURL(file);
        }
      }

      toastManager.show({
        message: `成功添加 ${droppedFiles.length} 个文件`,
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('拖拽文件处理失败:', error);
      toastManager.show({
        message: '文件处理失败，请重试',
        type: 'error',
        duration: 3000
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  // 剪贴板粘贴事件处理函数
  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 获取长文本粘贴设置
    const pasteLongTextAsFile = settings.pasteLongTextAsFile ?? false;
    const pasteLongTextThreshold = settings.pasteLongTextThreshold ?? 1500;

    // 优先处理文本粘贴（长文本转文件功能）
    const textData = clipboardData.getData('text');
    if (textData && pasteLongTextAsFile && textData.length > pasteLongTextThreshold) {
      e.preventDefault(); // 阻止默认粘贴行为

      try {
        setUploadingMedia(true);

        // 使用移动端文件存储服务创建文件
        const { MobileFileStorageService } = await import('../shared/services/MobileFileStorageService');
        const fileStorageService = MobileFileStorageService.getInstance();

        const fileName = `粘贴的文本_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.txt`;

        // 将文本转换为 base64 (支持中文等多字节字符)
        const encoder = new TextEncoder();
        const data = encoder.encode(textData);
        const base64Data = btoa(String.fromCharCode(...data));

        const fileData = {
          name: fileName,
          size: new Blob([textData], { type: 'text/plain' }).size,
          mimeType: 'text/plain',
          base64Data: `data:text/plain;base64,${base64Data}`
        };

        const fileRecord = await fileStorageService.uploadFile(fileData);

        // 转换为 FileContent 格式
        const fileContent = {
          name: fileRecord.origin_name,
          mimeType: fileRecord.mimeType || 'text/plain',
          extension: fileRecord.ext || '.txt',
          size: fileRecord.size,
          base64Data: fileRecord.base64Data,
          url: fileRecord.path || '',
          fileId: fileRecord.id,
          fileRecord: fileRecord
        };

        setFiles(prev => [...prev, fileContent]);

        toastManager.show({
          message: `长文本已转换为文件: ${fileName}`,
          type: 'success',
          duration: 3000
        });
      } catch (error) {
        console.error('长文本转文件失败:', error);
        toastManager.show({
          message: '长文本转文件失败，请重试',
          type: 'error',
          duration: 3000
        });
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
            const newImage: ImageContent = {
              id: `${Date.now()}-${Math.random()}`,
              url: base64Data,
              base64Data: base64Data,
              mimeType: file.type,
              name: `粘贴的图片_${Date.now()}.${file.type.split('/')[1]}`,
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

  // 显示正在加载的指示器，但不禁用输入框
  const showLoadingIndicator = isLoading && !allowConsecutiveMessages;

  // 根据屏幕尺寸调整样式
  const getResponsiveStyles = () => {
    if (isMobile) {
      return {
        paddingTop: '0px',
        paddingBottom: isIOS ? '34px' : '4px', // 为iOS设备增加底部padding
        maxWidth: 'calc(100% - 24px)', // 确保有足够的左右边距
        marginTop: '0',
        marginLeft: 'auto', // 移动端保持居中
        marginRight: 'auto' // 移动端保持居中
      };
    } else if (isTablet) {
      return {
        paddingTop: '0px',
        paddingBottom: isIOS ? '34px' : '4px', // 为iOS设备增加底部padding
        maxWidth: 'calc(100% - 40px)', // 确保有足够的左右边距
        marginTop: '0',
        marginLeft: '20px', // 平板端左对齐，避免被侧边栏遮挡
        marginRight: '20px' // 平板端右边距
      };
    } else {
      return {
        paddingTop: '0px',
        paddingBottom: isIOS ? '34px' : '6px', // 为iOS设备增加底部padding
        maxWidth: 'calc(100% - 32px)', // 确保有足够的左右边距
        marginTop: '0',
        marginLeft: '16px', // 桌面端左对齐，避免被侧边栏遮挡
        marginRight: '16px' // 桌面端右边距
      };
    }
  };

  const responsiveStyles = getResponsiveStyles();

  return (
    <div
      style={{
        backgroundColor: 'transparent',
        ...responsiveStyles,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        boxShadow: 'none',
        transition: 'all 0.3s ease',
        marginBottom: isKeyboardVisible ? '0' : (isMobile ? '0' : isTablet ? '0' : '0'),
        paddingBottom: isKeyboardVisible && isMobile ? 'env(safe-area-inset-bottom)' : (isIOS ? '34px' : '0'), // 为iOS设备增加底部安全区域
        // 确保没有任何背景色或边框
        border: 'none',
        // 拖拽时的视觉反馈
        position: 'relative'
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* URL解析状态显示 */}
      {urlScraperStatus !== 'idle' && (
        <UrlScraperStatus
          status={urlScraperStatus}
          url={detectedUrl}
          error={scraperError}
          onClose={resetUrlScraper}
        />
      )}

      {/* 集成的文件预览区域 */}
      <IntegratedFilePreview
        files={files}
        images={images}
        onRemoveFile={handleRemoveFile}
        onRemoveImage={handleRemoveImage}
        fileStatuses={fileStatuses}
        compact={true}
        maxVisibleItems={isMobile ? 2 : 3}
      />

      {/* 拖拽覆盖层 */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
          border: `2px dashed ${isDarkMode ? '#2196F3' : '#1976D2'}`,
          borderRadius: borderRadius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002,
          pointerEvents: 'none'
        }}>
          <div style={{
            color: isDarkMode ? '#2196F3' : '#1976D2',
            fontSize: '16px',
            fontWeight: 500,
            textAlign: 'center',
            padding: '20px'
          }}>
            📁 拖拽文件到这里上传
          </div>
        </div>
      )}

      <div style={{
          display: 'flex',
          alignItems: 'center',
        padding: isTablet ? '6px 12px' : isMobile ? '5px 8px' : '5px 8px',
        borderRadius: borderRadius,
        /* 使用主题颜色作为背景，防止输入框与底部消息重叠或产生视觉干扰 */
        background: themeColors.paper,
          border: isDragging ? `2px solid ${isDarkMode ? '#2196F3' : '#1976D2'}` : border,
        minHeight: isTablet ? '56px' : isMobile ? '48px' : '50px', // 增加容器最小高度以适应新的textarea高度
        boxShadow: isDragging ? `0 0 20px ${isDarkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)'}` : boxShadow,
        width: '100%',
        maxWidth: '100%', // 使用100%宽度，与外部容器一致
        backdropFilter: inputBoxStyle === 'modern' ? 'blur(10px)' : 'none',
        WebkitBackdropFilter: inputBoxStyle === 'modern' ? 'blur(10px)' : 'none',
        transition: 'all 0.3s ease',
        // 防止文本选择
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}>
        {/* 语音识别按钮 - 根据状态显示不同图标 */}
        <IconButton
          onClick={handleToggleVoiceMode}
          disabled={uploadingMedia || (isLoading && !allowConsecutiveMessages)}
          size={isTablet ? "large" : "medium"}
          style={{
            color: voiceState !== 'normal' ? '#f44336' : iconColor,
            padding: isTablet ? '10px' : '8px',
            backgroundColor: voiceState !== 'normal' ? 'rgba(211, 47, 47, 0.15)' : 'transparent',
            transition: 'all 0.25s ease-in-out'
          }}
        >
          {voiceState === 'normal' ? (
            <Tooltip title="切换到语音输入模式">
              <Mic size={isTablet ? 28 : 24} />
            </Tooltip>
          ) : (
            <Tooltip title="退出语音输入模式">
              <Keyboard size={isTablet ? 28 : 24} />
            </Tooltip>
          )}
        </IconButton>

        {/* 输入区域 - 根据三状态显示不同的输入方式 */}
        <div style={{
          flexGrow: 1,
          margin: isTablet ? '0 12px' : '0 8px',
          position: 'relative'
        }}>
          {voiceState === 'recording' ? (
            /* 录音状态 - 显示增强语音输入组件 */
            <EnhancedVoiceInput
              isDarkMode={isDarkMode}
              onClose={() => setVoiceState('normal')}
              onSendMessage={handleVoiceSendMessage}
              onInsertText={(text: string) => {
                setMessage(prev => prev + text);
                setVoiceState('normal');
              }}
              startRecognition={startRecognition}
            />
          ) : (
            /* 状态1：正常输入框 */
            <>
              <textarea
                ref={textareaRef}
                style={{
                  fontSize: isTablet ? '17px' : '16px',
                  padding: isTablet ? '10px 0' : '8px 0',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  backgroundColor: 'transparent',
                  lineHeight: '1.4',
                  fontFamily: 'inherit',
                  resize: 'none',
                  overflow: message.trim().length > 0 ? 'auto' : 'hidden',
                  minHeight: expanded ? `${expandedHeight}px` : `${isMobile ? 32 : isTablet ? 36 : 34}px`,
                  height: expanded ? `${expandedHeight}px` : `${textareaHeight}px`,
                  maxHeight: expanded ? `${expandedHeight}px` : `${isMobile ? 200 : 250}px`,
                  color: textColor,
                  transition: 'height 0.3s ease-out, min-height 0.3s ease-out, max-height 0.3s ease',
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${isDarkMode ? '#555 transparent' : '#ccc transparent'}`
                }}
                placeholder={
                  imageGenerationMode
                    ? "输入图像生成提示词... (Ctrl+Enter 展开)"
                    : webSearchActive
                      ? "输入网络搜索内容... (Ctrl+Enter 展开)"
                      : "和ai助手说点什么... (Ctrl+Enter 展开)"
                }
                value={message}
                onChange={enhancedHandleChange}
                onKeyDown={enhancedHandleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onPaste={handlePaste}
                disabled={isLoading && !allowConsecutiveMessages}
                rows={1}
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
            </>
          )}
        </div>

        {/* 在非录音状态下显示其他按钮 */}
        {voiceState !== 'recording' && (
          <>
            {/* 添加按钮，打开上传菜单 */}
            <Tooltip title="添加图片或文件">
              <IconButton
                size={isTablet ? "large" : "medium"}
                onClick={handleOpenUploadMenu}
                disabled={uploadingMedia || (isLoading && !allowConsecutiveMessages)}
                style={{
                  color: uploadingMedia ? disabledColor : iconColor,
                  padding: isTablet ? '10px' : '8px',
                  position: 'relative',
                  marginRight: isTablet ? '4px' : '0'
                }}
              >
                {uploadingMedia ? (
                  <CircularProgress size={isTablet ? 28 : 24} />
                ) : (
                  <Badge badgeContent={images.length + files.length} color="primary" max={9} invisible={images.length + files.length === 0}>
                    <Plus size={isTablet ? 28 : 24} />
                  </Badge>
                )}
              </IconButton>
            </Tooltip>

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
                size={isTablet ? "large" : "medium"}
              />
            )}

            {/* 展开/收起按钮 - 只在需要时显示 */}
            {showExpandButton && (
              <Tooltip title={expanded ? "收起输入框" : "展开输入框"}>
                <IconButton
                  onClick={() => setExpanded(!expanded)}
                  size={isTablet ? "large" : "medium"}
                  style={{
                    color: expanded ? '#2196F3' : iconColor,
                    padding: isTablet ? '10px' : '8px',
                    marginRight: isTablet ? '4px' : '2px'
                  }}
                >
                  {expanded ? (
                    <ChevronDown size={isTablet ? 20 : 18} />
                  ) : (
                    <ChevronUp size={isTablet ? 20 : 18} />
                  )}
                </IconButton>
              </Tooltip>
            )}

            {/* 发送按钮或停止按钮 */}
            <IconButton
              onClick={isStreaming && onStopResponse ? onStopResponse : handleSubmit}
              disabled={!isStreaming && (!canSendMessage() || (isLoading && !allowConsecutiveMessages))}
              size={isTablet ? "large" : "medium"}
              style={{
                color: isStreaming ? '#ff4d4f' : !canSendMessage() || (isLoading && !allowConsecutiveMessages) ? disabledColor : imageGenerationMode ? '#9C27B0' : webSearchActive ? '#3b82f6' : urlScraperStatus === 'success' ? '#26C6DA' : isDarkMode ? '#4CAF50' : '#09bb07',
                padding: isTablet ? '10px' : '8px'
              }}
            >
              {isStreaming ? (
                <Tooltip title="停止生成">
                  <Square size={isTablet ? 20 : 18} />
                </Tooltip>
              ) : showLoadingIndicator ? (
                <CircularProgress size={isTablet ? 28 : 24} color="inherit" />
              ) : imageGenerationMode ? (
                <Tooltip title="生成图像">
                  <Image size={isTablet ? 20 : 18} />
                </Tooltip>
              ) : webSearchActive ? (
                <Tooltip title="搜索网络">
                  <Search size={isTablet ? 20 : 18} />
                </Tooltip>
              ) : urlScraperStatus === 'success' ? (
                <Tooltip title="发送解析的网页内容">
                  <Link size={isTablet ? 20 : 18} />
                </Tooltip>
              ) : (
                <Send size={isTablet ? 20 : 18} />
              )}
            </IconButton>
          </>
        )}
      </div>

      {/* 上传选择菜单 */}
      <UploadMenu
        anchorEl={uploadMenuAnchorEl}
        open={Boolean(uploadMenuAnchorEl)}
        onClose={handleCloseUploadMenu}
        onImageUpload={handleImageUploadLocal}
        onFileUpload={handleFileUploadLocal}
        onMultiModelSend={() => setMultiModelSelectorOpen(true)}
        showMultiModel={!!(onSendMultiModelMessage && availableModels.length > 1 && !isStreaming && canSendMessage())}
      />

      {/* 多模型选择器 */}
      <MultiModelSelector
        open={multiModelSelectorOpen}
        onClose={() => setMultiModelSelectorOpen(false)}
        availableModels={availableModels}
        onConfirm={handleMultiModelSend}
        maxSelection={5}
      />

      {/* Toast通知 */}
      <EnhancedToast
        messages={toastMessages}
        onClose={(id) => toastManager.remove(id)}
        maxVisible={3}
      />


    </div>
  );
};

export default ChatInput;
