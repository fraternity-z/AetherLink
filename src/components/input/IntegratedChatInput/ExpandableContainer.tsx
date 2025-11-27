import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useKeyboard } from '../../../shared/hooks/useKeyboard';

interface ExpandableContainerProps {
  // 基础状态
  message: string;
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  
  // 样式相关
  isDarkMode: boolean;
  iconColor: string;
  inputBoxStyle: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
  
  // 事件处理
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  
  // 子组件
  children: React.ReactNode;
}

const useExpandableContainer = ({
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
}: Omit<ExpandableContainerProps, 'children'>) => {
  // 展开状态管理
  const [expanded, setExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);

  // 键盘管理 - 模仿 rikkahub
  const { isKeyboardVisible } = useKeyboard();

  /**
   * 键盘弹出时自动折叠输入框 - 模仿 rikkahub 的逻辑
   * 
   * 参考：rikkahub ChatInput.kt - LaunchedEffect(imeVisible)
   * 原因：展开的输入框（70vh）+ 键盘会占满整个屏幕，自动折叠提供更好的用户体验
   */
  useEffect(() => {
    if (isKeyboardVisible && expanded) {
      setExpanded(false);
    }
  }, [isKeyboardVisible, expanded]);

  // 窗口大小监听已移除，将重新实现

  // 性能优化：使用useMemo缓存按钮可见性计算结果，避免重复计算
  const buttonVisibility = useMemo(() => {
    const textLength = message.length;
    const containerWidth = isMobile ? 280 : isTablet ? 400 : 500;
    const charsPerLine = Math.floor(containerWidth / (isTablet ? 17 : 16));
    
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
      showExpandButton: expanded ? true : estimatedLines > 4
    };
  }, [message, isMobile, isTablet, expanded]);

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

  // 优化的 handleChange - 移除重复调用，只保留核心逻辑
  const enhancedHandleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // 调用 hook 提供的 handleChange
    handleChange(e);
    // 移除重复的checkButtonVisibility调用，由useEffect统一处理
  }, [handleChange]);

  // 展开切换函数
  const handleExpandToggle = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  // 根据屏幕尺寸调整样式
  const getResponsiveStyles = () => {
    if (isMobile) {
      return {
        paddingTop: '0px',
        paddingBottom: isIOS ? '34px' : '4px', // 为iOS设备增加底部padding
        maxWidth: '100%', // 移动端占满屏幕宽度
        marginTop: '0',
        marginLeft: '0', // 移动端不需要居中边距
        marginRight: '0', // 移动端不需要居中边距
        paddingLeft: '8px', // 使用padding代替margin
        paddingRight: '8px' // 使用padding代替margin
      };
    } else if (isTablet) {
      return {
        paddingTop: '0px',
        paddingBottom: isIOS ? '34px' : '4px', // 为iOS设备增加底部padding
        maxWidth: 'calc(100% - 40px)', // 确保有足够的左右边距
        marginTop: '0',
        marginLeft: 'auto', // 水平居中
        marginRight: 'auto' // 水平居中
      };
    } else {
      return {
        paddingTop: '0px',
        paddingBottom: isIOS ? '34px' : '6px', // 为iOS设备增加底部padding
        maxWidth: 'calc(100% - 32px)', // 确保有足够的左右边距
        marginTop: '0',
        marginLeft: 'auto', // 水平居中
        marginRight: 'auto' // 水平居中
      };
    }
  };

  // 渲染展开按钮
  const renderExpandButton = useCallback(() => {
    if (!showExpandButton) return null;

    return (
      <div style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        zIndex: 10
      }}>
        <Tooltip title={expanded ? "收起输入框" : "展开输入框"}>
          <IconButton
            onClick={handleExpandToggle}
            size="small"
            style={{
              color: expanded ? '#2196F3' : iconColor,
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
            {expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronUp size={14} />
            )}
          </IconButton>
        </Tooltip>
      </div>
    );
  }, [showExpandButton, expanded, handleExpandToggle, iconColor, isDarkMode]);

  // 渲染容器
  const renderContainer = useCallback((children: React.ReactNode) => {
    const responsiveStyles = getResponsiveStyles();

    return (
      <div
        className="chat-input-container"
        style={{
          backgroundColor: 'transparent',
          ...responsiveStyles,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          marginBottom: '0',
          // 键盘显示时移除底部 padding，避免与键盘高度叠加导致双重空白
          paddingBottom: isIOS ? (isKeyboardVisible ? '0' : '34px') : '0',
          border: 'none'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: isTablet ? '8px 12px' : isMobile ? '6px 8px' : '7px 10px',
          borderRadius: borderRadius,
          background: 'var(--theme-bg-paper)',
          border: border,
          minHeight: isTablet ? '72px' : isMobile ? '64px' : '68px',
          boxShadow: boxShadow,
          width: '100%',
          maxWidth: '100%',
          backdropFilter: inputBoxStyle === 'modern' ? 'blur(10px)' : 'none',
          WebkitBackdropFilter: inputBoxStyle === 'modern' ? 'blur(10px)' : 'none',
          transition: 'all 0.3s ease',
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}>
          {renderExpandButton()}
          {children}
        </div>
      </div>
    );
  }, [
    getResponsiveStyles, isMobile, isTablet, isIOS,
    border, boxShadow, inputBoxStyle, borderRadius, renderExpandButton
  ]);

  return {
    expanded,
    showExpandButton,
    enhancedHandleChange,
    handleExpandToggle,
    renderContainer
  };
};

export default useExpandableContainer;
