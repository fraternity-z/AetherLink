import React, { useEffect, useCallback, useMemo } from 'react';
import Scrollbar from '../../Scrollbar';

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
  isDarkMode: _isDarkMode,
  shouldHideVoiceButton,
  expanded,
  onExpandToggle
}) => {
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
      ? (isTablet ? '0 4px 0 4px' : '0 2px 0 2px')
      : (isTablet ? '0 4px 0 12px' : '0 2px 0 8px'),
    position: 'relative' as const,
  }), [shouldHideVoiceButton, isTablet]);

  // 缓存 placeholder 文本避免重复计算
  const placeholderText = useMemo(() => {
    if (imageGenerationMode) return "输入图像生成提示词... (Ctrl+Enter 展开)";
    if (videoGenerationMode) return "输入视频生成提示词... (Ctrl+Enter 展开)";
    if (webSearchActive) return "输入网络搜索内容... (Ctrl+Enter 展开)";
    return "和ai助手说点什么... (Ctrl+Enter 展开)";
  }, [imageGenerationMode, videoGenerationMode, webSearchActive]);

  // Scrollbar 容器样式：控制最大高度和滚动
  const scrollbarStyle = useMemo(() => ({
    minHeight: expanded ? '70vh' : `${isMobile ? 32 : isTablet ? 36 : 34}px`,
    maxHeight: expanded ? '70vh' : `${isMobile ? 200 : 250}px`,
    transition: 'min-height 0.3s ease-out, max-height 0.3s ease',
  }), [expanded, isMobile, isTablet]);

  return (
    <div style={containerStyle}>
      <Scrollbar style={scrollbarStyle}>
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
            overflow: 'hidden',
            minHeight: `${isMobile ? 32 : isTablet ? 36 : 34}px`,
            height: expanded ? '70vh' : `${textareaHeight}px`,
            color: 'var(--theme-text-primary)',
            transition: 'height 0.3s ease-out',
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
      </Scrollbar>
    </div>
  );
};

export default InputTextArea;
