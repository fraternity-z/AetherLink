import React, { useState, useEffect } from 'react';
import { Box, Typography, Fade, useTheme } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { getThemeColors } from '../shared/utils/themeUtils';
import { useSelector } from 'react-redux';
import type { RootState } from '../shared/store';

interface SwipeIndicatorProps {
  show?: boolean;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  storageKey?: string; // 用于记住用户已看过提示的存储键
}

/**
 * 滑动提示组件
 * 显示右滑打开侧边栏的提示
 */
export const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({
  show = true,
  onDismiss,
  autoHide = true,
  autoHideDelay = 3000,
  storageKey = 'swipe-indicator-dismissed'
}) => {
  const theme = useTheme();
  const themeStyle = useSelector((state: RootState) => state.settings.themeStyle);
  const themeColors = getThemeColors(theme, themeStyle);

  // 检查用户是否已经看过这个提示
  const [hasSeenBefore, setHasSeenBefore] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  const [visible, setVisible] = useState(show && !hasSeenBefore);

  useEffect(() => {
    setVisible(show && !hasSeenBefore);
  }, [show, hasSeenBefore]);

  useEffect(() => {
    if (autoHide && visible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, visible]);

  const handleDismiss = () => {
    setVisible(false);
    setHasSeenBefore(true);

    // 保存到本地存储，记住用户已经看过这个提示
    try {
      localStorage.setItem(storageKey, 'true');
    } catch (error) {
      console.warn('无法保存滑动提示状态到本地存储:', error);
    }

    onDismiss?.();
  };

  const handleClick = () => {
    handleDismiss();
  };

  return (
    <Fade in={visible} timeout={300}>
      <Box
        onClick={handleClick}
        sx={{
          position: 'fixed',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: themeColors.paper,
          border: `1px solid ${themeColors.borderColor}`,
          borderLeft: 'none',
          borderRadius: '0 12px 12px 0',
          padding: '8px 12px 8px 8px',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: themeColors.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            transform: 'translateY(-50%) translateX(4px)',
          },
          // 防止文本选择
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <ChevronRight 
          size={16} 
          style={{ 
            color: themeColors.textSecondary,
            marginRight: '4px'
          }} 
        />
        <Typography
          variant="caption"
          sx={{
            color: themeColors.textSecondary,
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
        >
          右滑打开
        </Typography>
      </Box>
    </Fade>
  );
};

/**
 * 滑动进度指示器
 * 在用户滑动时显示进度
 */
interface SwipeProgressIndicatorProps {
  progress: number; // 0-100
  show: boolean;
  direction: 'left' | 'right';
}

export const SwipeProgressIndicator: React.FC<SwipeProgressIndicatorProps> = ({
  progress,
  show,
  direction
}) => {
  const theme = useTheme();
  const themeStyle = useSelector((state: RootState) => state.settings.themeStyle);
  const themeColors = getThemeColors(theme, themeStyle);

  return (
    <Fade in={show} timeout={150}>
      <Box
        sx={{
          position: 'fixed',
          left: direction === 'right' ? 0 : 'auto',
          right: direction === 'left' ? 0 : 'auto',
          top: 0,
          bottom: 0,
          width: `${Math.min(progress, 100)}px`,
          maxWidth: '80px',
          backgroundColor: `${themeColors.primary}20`,
          borderRight: direction === 'right' ? `2px solid ${themeColors.primary}` : 'none',
          borderLeft: direction === 'left' ? `2px solid ${themeColors.primary}` : 'none',
          zIndex: 1000,
          transition: 'all 0.1s ease-out',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: direction === 'right' ? 'flex-end' : 'flex-start',
          paddingLeft: direction === 'right' ? '0' : '8px',
          paddingRight: direction === 'right' ? '8px' : '0'
        }}
      >
        {progress > 30 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: themeColors.primary,
              color: 'white',
              borderRadius: '12px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 500,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            <ChevronRight 
              size={14} 
              style={{ 
                transform: direction === 'left' ? 'rotate(180deg)' : 'none',
                marginRight: direction === 'right' ? '2px' : '0',
                marginLeft: direction === 'left' ? '2px' : '0'
              }} 
            />
            {direction === 'right' ? '打开' : '关闭'}
          </Box>
        )}
      </Box>
    </Fade>
  );
};

export default SwipeIndicator;
