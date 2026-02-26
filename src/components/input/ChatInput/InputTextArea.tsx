import React, { useEffect, useCallback, useMemo } from 'react';

// 添加自定义滚动条样式
const addCustomScrollbarStyles = (isDarkMode: boolean) => {
  const styleId = 'custom-thin-scrollbar-styles';

  // 检查是否已经添加了样式
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .custom-thin-scrollbar::-webkit-scrollbar {
      width: 1px;
    }

    .custom-thin-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .custom-thin-scrollbar::-webkit-scrollbar-thumb {
      background: ${isDarkMode ? '#555' : '#ccc'};
      border-radius: 0px;
    }

    .custom-thin-scrollbar::-webkit-scrollbar-thumb:hover {
      background: ${isDarkMode ? '#666' : '#999'};
    }
  `;

  document.head.appendChild(style);
};

interface InputTextAreaProps {
  message: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  textareaHeight: number;
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleCompositionStart: (e: React.CompositionEvent<HTMLTextAreaElement>) => void;
  handleCompositionEnd: (e: React.CompositionEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  allowConsecutiveMessages: boolean;
  imageGenerationMode: boolean;
  videoGenerationMode: boolean;
  webSearchActive: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDarkMode: boolean;
  shouldHideVoiceButton: boolean;
  expanded: boolean;
  onExpandToggle: () => void;
}

const InputTextArea: React.FC<InputTextAreaProps> = ({
  message,
  textareaRef,
  textareaHeight,
  handleChange,
  handleKeyDown,
  handleCompositionStart,
  handleCompositionEnd,
  onPaste,
  isLoading,
  allowConsecutiveMessages,
  imageGenerationMode,
  videoGenerationMode,
  webSearchActive,
  isMobile,
  isTablet,
  isDarkMode,
  shouldHideVoiceButton,
  expanded,
  onExpandToggle
}) => {
  // 注意：移除了 isIOS 状态和检测，因为不再需要 iOS 特殊滚动处理
  // 输入框位置调整由 ChatPageUI 的 InputContainer 通过 keyboardHeight 处理

  // 添加自定义滚动条样式
  useEffect(() => {
    addCustomScrollbarStyles(isDarkMode);
  }, [isDarkMode]);

  // 增强的 handleKeyDown 以支持展开功能 - 使用 useCallback 避免重复创建
  const enhancedHandleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleKeyDown(e);
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onExpandToggle();
    }
  }, [handleKeyDown, onExpandToggle]);

  // 初始化：设置初始高度
  useEffect(() => {
    const currentTextarea = textareaRef.current;
    if (!currentTextarea || currentTextarea.dataset.initialized === 'true') return;

    const initialHeight = isMobile ? 32 : isTablet ? 36 : 34;
    currentTextarea.style.height = `${initialHeight}px`;
    currentTextarea.dataset.initialized = 'true';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 缓存样式对象避免重复创建
  // 🚀 性能优化：移除 margin transition，避免重排
  const containerStyle = useMemo(() => ({
    flexGrow: 1,
    margin: shouldHideVoiceButton
      ? (isTablet ? '0 12px 0 4px' : '0 8px 0 2px')
      : (isTablet ? '0 12px' : '0 8px'),
    position: 'relative' as const,
    // 移除 margin transition，语音按钮切换不需要动画
  }), [shouldHideVoiceButton, isTablet]);

  // 缓存 placeholder 文本避免重复计算
  const placeholderText = useMemo(() => {
    if (imageGenerationMode) return "输入图像生成提示词... (Ctrl+Enter 展开)";
    if (videoGenerationMode) return "输入视频生成提示词... (Ctrl+Enter 展开)";
    if (webSearchActive) return "输入网络搜索内容... (Ctrl+Enter 展开)";
    return "和ai助手说点什么... (Ctrl+Enter 展开)";
  }, [imageGenerationMode, videoGenerationMode, webSearchActive]);

  return (
    <div style={containerStyle}>


      <textarea
        ref={textareaRef}
        className="custom-thin-scrollbar"
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
          minHeight: expanded ? '70vh' : `${isMobile ? 32 : isTablet ? 36 : 34}px`,
          height: expanded ? '70vh' : `${textareaHeight}px`,
          maxHeight: expanded ? '70vh' : `${isMobile ? 200 : 250}px`,
          color: 'var(--theme-text-primary)',
          transition: 'height 0.3s ease-out, min-height 0.3s ease-out, max-height 0.3s ease',
          // Firefox 滚动条样式
          scrollbarWidth: 'thin',
          scrollbarColor: `${isDarkMode ? '#555' : '#ccc'} transparent`
        }}
        placeholder={placeholderText}
        value={message}
        onChange={handleChange}
        onKeyDown={enhancedHandleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onPaste={onPaste}
        disabled={isLoading && !allowConsecutiveMessages}
        rows={1}
      />

    </div>
  );
};

export default InputTextArea;
