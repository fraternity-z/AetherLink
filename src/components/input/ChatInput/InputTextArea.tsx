import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

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
  showCharCount: boolean;
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
  showCharCount,
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
  const [isIOS, setIsIOS] = useState(false);

  // 检测iOS设备
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                       (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    setIsIOS(isIOSDevice);
  }, []);

  // 添加自定义滚动条样式
  useEffect(() => {
    addCustomScrollbarStyles(isDarkMode);
  }, [isDarkMode]);

  // 修复折叠时高度异常：只在expanded变化时执行，避免每次输入都触发
  // 注意：这个组件中不需要额外处理，因为父组件已经处理了
  // 这里保留是为了确保IntegratedChatInput也能正确工作
  const prevExpandedRef = useRef(expanded);
  useEffect(() => {
    // 只处理从展开到折叠的状态变化
    if (prevExpandedRef.current && !expanded && textareaRef.current) {
      // 使用requestAnimationFrame确保DOM更新完成
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          // 重置高度，让CSS的height属性重新生效
          textareaRef.current.style.height = 'auto';
        }
      });
    }
    // 更新上一次的expanded状态
    prevExpandedRef.current = expanded;
  }, [expanded, textareaRef]); // 移除message依赖，避免每次输入都触发

  // 增强的 handleKeyDown 以支持展开功能 - 使用 useCallback 避免重复创建
  const enhancedHandleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleKeyDown(e);
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onExpandToggle();
    }
  }, [handleKeyDown, onExpandToggle]);

  // 增强的焦点处理，适应iOS设备 - 添加初始化防护
  useEffect(() => {
    const currentTextarea = textareaRef.current; // 保存当前的 ref 值

    // 添加初始化标记，避免重复初始化
    if (!currentTextarea) {
      return;
    }

    // 检查是否已经初始化过
    if (currentTextarea.dataset.initialized === 'true') {
      return;
    }

    // 只设置初始高度，不执行焦点操作避免闪烁
    const timer = setTimeout(() => {
      if (currentTextarea && currentTextarea.dataset.initialized !== 'true') {
        // 确保初始高度正确设置，以显示完整的placeholder
        const initialHeight = isMobile ? 32 : isTablet ? 36 : 34;
        currentTextarea.style.height = `${initialHeight}px`;

        // 标记为已初始化
        currentTextarea.dataset.initialized = 'true';

        // 初始化完成
      }
    }, 100); // 减少延迟时间

    // 添加键盘显示检测
    const handleFocus = () => {

      // iOS设备特殊处理
      if (isIOS && textareaRef.current) {
        // 延迟执行，确保输入法已弹出
        setTimeout(() => {
          if (!textareaRef.current) return;

          // 滚动到输入框位置
          textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // 额外处理：尝试滚动页面到底部
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });

          // iOS特有：确保输入框在可视区域内
          const viewportHeight = window.innerHeight;
          const keyboardHeight = viewportHeight * 0.4; // 估计键盘高度约为视口的40%

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
        }, 300); // 减少延迟时间
      }
    };

    const handleBlur = () => {
      // 输入框失去焦点处理
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
        // 不要重置初始化标记，保持已初始化状态
      }
    };
  }, []); // 移除所有依赖，只在组件挂载时执行一次

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
    </div>
  );
};

export default InputTextArea;
