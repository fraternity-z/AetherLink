import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';

/**
 * 处理聊天页面布局相关逻辑的钩子
 * 负责响应式布局、导航跳转等功能
 * 优化：减少不必要的状态变化和重新渲染
 */
export const useChatPageLayout = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  // 优化：使用 useCallback 稳定函数引用
  const handleSetDrawerOpen = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setDrawerOpen(open);
  }, []);

  // 当屏幕尺寸变化时更新抽屉状态，但避免不必要的更新
  useEffect(() => {
    setDrawerOpen(prev => {
      const newValue = !isMobile;
      // 只有当值真正改变时才更新
      return prev !== newValue ? newValue : prev;
    });
  }, [isMobile]);

  return {
    isMobile,
    drawerOpen,
    setDrawerOpen: handleSetDrawerOpen,
    navigate
  };
};