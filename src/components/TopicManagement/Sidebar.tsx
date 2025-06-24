import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Box, IconButton, SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { X as CloseIcon } from 'lucide-react';
import SidebarTabs from './SidebarTabs';
import {
  getDrawerContentStyles,
  getCloseButtonStyles,
  getCloseButtonInteractionStyles,
} from './sidebarOptimization';
import { useDialogBackHandler } from '../../hooks/useDialogBackHandler';

// 侧边栏的唯一标识符，用于返回按键处理
const SIDEBAR_DIALOG_ID = 'sidebar-drawer';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
  mcpMode?: 'prompt' | 'function';
  toolsEnabled?: boolean;
  onMCPModeChange?: (mode: 'prompt' | 'function') => void;
  onToolsToggle?: (enabled: boolean) => void;
  // 新增：支持桌面端收起功能
  desktopOpen?: boolean;
  onDesktopToggle?: () => void;
}

// 使用 React.memo 优化组件，避免不必要的重新渲染
const Sidebar = React.memo(function Sidebar({
  mobileOpen = false,
  onMobileToggle,
  mcpMode,
  toolsEnabled,
  onMCPModeChange,
  onToolsToggle,
  // 新增参数
  desktopOpen = true,
  onDesktopToggle
}: SidebarProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // 与ChatPageUI保持一致
  const [showSidebar, setShowSidebar] = useState(!isSmallScreen);

  const drawerWidth = 320;

  useEffect(() => {
    if (isSmallScreen) {
      setShowSidebar(false);
    }
  }, [isSmallScreen]);

  // 优化：减少依赖项，使用更稳定的计算逻辑
  const finalOpen = useMemo(() => {
    if (isSmallScreen) {
      return onMobileToggle ? mobileOpen : showSidebar;
    } else {
      return onDesktopToggle ? desktopOpen : showSidebar;
    }
  }, [isSmallScreen, mobileOpen, showSidebar, desktopOpen]);

  // 使用返回按键处理Hook，只在移动端且侧边栏打开时启用
  useDialogBackHandler(
    SIDEBAR_DIALOG_ID,
    isSmallScreen && mobileOpen, // 直接使用 mobileOpen 状态
    () => {
      // 返回按键关闭侧边栏的逻辑
      if (onMobileToggle) {
        onMobileToggle();
      } else {
        setShowSidebar(false);
      }
    }
  );

  const handleClose = useCallback(() => {
    if (onMobileToggle && isSmallScreen) {
      onMobileToggle();
    } else if (onDesktopToggle && !isSmallScreen) {
      onDesktopToggle();
    } else {
      setShowSidebar(false);
    }
  }, [onMobileToggle, onDesktopToggle, isSmallScreen]);

  const handleOpen = useCallback(() => {
    if (onMobileToggle && isSmallScreen) {
      onMobileToggle();
    } else if (onDesktopToggle && !isSmallScreen) {
      onDesktopToggle();
    } else {
      setShowSidebar(true);
    }
  }, [onMobileToggle, onDesktopToggle, isSmallScreen]);


  // 优化：减少 drawer 的依赖项，避免频繁重新渲染
  const drawer = useMemo(() => (
    <Box sx={getDrawerContentStyles()}>
      {(isSmallScreen || onDesktopToggle) && (
        <Box sx={getCloseButtonStyles()}>
          <IconButton
            onClick={handleClose}
            sx={getCloseButtonInteractionStyles()}
          >
            <CloseIcon size={20} />
          </IconButton>
        </Box>
      )}
      <SidebarTabs
        mcpMode={mcpMode}
        toolsEnabled={toolsEnabled}
        onMCPModeChange={onMCPModeChange}
        onToolsToggle={onToolsToggle}
      />
    </Box>
  ), [isSmallScreen, handleClose, mcpMode, toolsEnabled, onMCPModeChange, onToolsToggle]);

  return (
    <div>
      <SwipeableDrawer
        anchor="left"
        variant={isSmallScreen ? 'temporary' : 'persistent'}
        open={finalOpen}
        onClose={handleClose}
        onOpen={handleOpen}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </SwipeableDrawer>
    </div>
  );
});

export default Sidebar;