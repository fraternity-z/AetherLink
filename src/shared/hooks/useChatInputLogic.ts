import { useState, useRef, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import type { SiliconFlowImageFormat, ImageContent, FileContent } from '../types';

interface UseChatInputLogicProps {
  onSendMessage: (message: string, images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void;
  onSendMultiModelMessage?: (message: string, models: any[], images?: SiliconFlowImageFormat[], toolsEnabled?: boolean, files?: any[]) => void;
  onSendImagePrompt?: (prompt: string) => void;
  isLoading?: boolean;
  allowConsecutiveMessages?: boolean;
  imageGenerationMode?: boolean;
  toolsEnabled?: boolean;
  parsedContent?: string;
  images: ImageContent[];
  files: FileContent[];
  setImages: React.Dispatch<React.SetStateAction<ImageContent[]>>;
  setFiles: React.Dispatch<React.SetStateAction<FileContent[]>>;
  resetUrlScraper?: () => void;
  // ChatInput 特有的功能
  enableTextareaResize?: boolean;
  enableCompositionHandling?: boolean;
  enableCharacterCount?: boolean;
  availableModels?: any[];
}

export const useChatInputLogic = ({
  onSendMessage,
  onSendImagePrompt,
  isLoading = false,
  allowConsecutiveMessages = true,
  imageGenerationMode = false,
  toolsEnabled = true,
  parsedContent = '',
  images,
  files,
  setImages,
  setFiles,
  resetUrlScraper,
  enableTextareaResize = false,
  enableCompositionHandling = false,
  enableCharacterCount = false
}: UseChatInputLogicProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 主题和响应式
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // ChatInput 特有的状态
  const [textareaHeight, setTextareaHeight] = useState<number>(
    enableTextareaResize ? (isMobile ? 32 : isTablet ? 36 : 34) : 40
  );
  const [isComposing, setIsComposing] = useState(false);
  const [showCharCount, setShowCharCount] = useState(false);

  // 判断是否允许发送消息
  const canSendMessage = () => {
    const hasContent = message.trim() || images.length > 0 || files.length > 0 || parsedContent.trim();
    return hasContent && (allowConsecutiveMessages || !isLoading);
  };

  // 文本区域高度自适应（ChatInput 特有）
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    if (!enableTextareaResize) return;

    // 重置高度以获取正确的scrollHeight
    textarea.style.height = 'auto';

    // 计算新高度
    const newHeight = Math.max(
      isMobile ? 32 : isTablet ? 36 : 34, // 最小高度
      Math.min(textarea.scrollHeight, 120) // 最大高度120px
    );

    setTextareaHeight(newHeight);
    textarea.style.height = `${newHeight}px`;
  };

  // 处理消息发送
  const handleSubmit = async () => {
    if ((!message.trim() && images.length === 0 && files.length === 0 && !parsedContent) ||
        (isLoading && !allowConsecutiveMessages)) {
      return;
    }

    let processedMessage = message.trim();

    // 如果有解析的内容，添加到消息中
    if (parsedContent) {
      processedMessage = `${processedMessage}\n\n${parsedContent}`;
      resetUrlScraper?.();
    }

    // 如果是图像生成模式，则调用生成图像的回调
    if (imageGenerationMode && onSendImagePrompt) {
      onSendImagePrompt(processedMessage);
      setMessage('');

      // 重置输入框高度到默认值（ChatInput 特有）
      if (enableTextareaResize) {
        const defaultHeight = isMobile ? 24 : 28;
        setTextareaHeight(defaultHeight);
        if (textareaRef.current) {
          textareaRef.current.style.height = `${defaultHeight}px`;
        }
      }
      return;
    }

    // 注意：不在这里搜索知识库！
    // 的逻辑是：用户消息先发送，然后在AI处理前搜索知识库
    // 知识库搜索应该在消息处理阶段进行，而不是在发送阶段

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
              const { dexieStorage } = await import('../services/DexieStorageService');
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

    // 调用父组件的回调
    onSendMessage(processedMessage, formattedImages.length > 0 ? formattedImages : undefined, toolsEnabled, nonImageFiles);

    // 重置状态
    setMessage('');
    setImages([]);
    setFiles([]);

    // 重置输入框高度到默认值（ChatInput 特有）
    if (enableTextareaResize) {
      const defaultHeight = isMobile ? 24 : 28;
      setTextareaHeight(defaultHeight);
      if (textareaRef.current) {
        textareaRef.current.style.height = `${defaultHeight}px`;
      }
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 处理快捷键（ChatInput 特有）
    if (enableCompositionHandling && (e.ctrlKey || e.metaKey)) {
      switch (e.key) {
        case 'a':
        case 'z':
        case 'y':
          // 浏览器默认行为，不需要阻止
          break;
      }
    }

    // Enter键发送消息（非输入法组合状态且非Shift+Enter）
    if (e.key === 'Enter' && !e.shiftKey && (!enableCompositionHandling || !isComposing)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 输入法组合开始（ChatInput 特有）
  const handleCompositionStart = () => {
    if (enableCompositionHandling) {
      setIsComposing(true);
    }
  };

  // 输入法组合结束（ChatInput 特有）
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    if (enableCompositionHandling) {
      setIsComposing(false);
      // 组合结束后重新调整高度
      adjustTextareaHeight(e.target as HTMLTextAreaElement);
    }
  };

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // 字符计数显示控制（ChatInput 特有）
    if (enableCharacterCount) {
      setShowCharCount(newValue.length > 500);
    }

    // 自动调整高度（ChatInput 特有）
    if (enableTextareaResize) {
      adjustTextareaHeight(e.target);
    }
  };

  // 监听消息变化以检测字符数（ChatInput 特有）
  useEffect(() => {
    if (enableCharacterCount && message.length <= 500) {
      setShowCharCount(false);
    }
  }, [message, enableCharacterCount]);

  return {
    message,
    setMessage,
    textareaRef,
    canSendMessage,
    handleSubmit,
    handleKeyDown,
    handleChange,
    // ChatInput 特有的返回值
    textareaHeight,
    isComposing,
    showCharCount,
    adjustTextareaHeight,
    handleCompositionStart,
    handleCompositionEnd,
    // 主题相关
    isDarkMode,
    isMobile,
    isTablet
  };
};
