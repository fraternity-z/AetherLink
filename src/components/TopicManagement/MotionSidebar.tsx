import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  SwipeableDrawer
} from '@mui/material';
import { X as CloseIcon } from 'lucide-react';
import SidebarTabs from './SidebarTabs';
import { useDialogBackHandler } from '../../hooks/useDialogBackHandler';

// 侧边栏的唯一标识符，用于返回按键处理
const SIDEBAR_DIALOG_ID = 'sidebar-drawer';

interface MotionSidebarProps {
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

// 自定义比较函数，只比较关键props - 更精确的比较
const areMotionSidebarPropsEqual = (prevProps: MotionSidebarProps, nextProps: MotionSidebarProps) => {
  const result = (
    prevProps.mobileOpen === nextProps.mobileOpen &&
    prevProps.desktopOpen === nextProps.desktopOpen &&
    prevProps.mcpMode === nextProps.mcpMode &&
    prevProps.toolsEnabled === nextProps.toolsEnabled
  );

  // 🔧 调试日志：记录比较结果
  if (!result) {
    console.log('🔄 MotionSidebar props变化，需要重新渲染', {
      mobileOpen: { prev: prevProps.mobileOpen, next: nextProps.mobileOpen },
      desktopOpen: { prev: prevProps.desktopOpen, next: nextProps.desktopOpen },
      mcpMode: { prev: prevProps.mcpMode, next: nextProps.mcpMode },
      toolsEnabled: { prev: prevProps.toolsEnabled, next: nextProps.toolsEnabled }
    });
  }

  return result;
};

// 使用 React.memo 优化组件，避免不必要的重新渲染
const MotionSidebar = React.memo(function MotionSidebar({
  mobileOpen = false,
  onMobileToggle,
  mcpMode,
  toolsEnabled,
  onMCPModeChange,
  onToolsToggle,
  // 新增参数
  desktopOpen = true,
  onDesktopToggle
}: MotionSidebarProps) {


  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // 与ChatPageUI保持一致
  const [showSidebar, setShowSidebar] = useState(!isSmallScreen);

  const drawerWidth = 320;

  useEffect(() => {
    if (isSmallScreen) {
      setShowSidebar(false);
    }
  }, [isSmallScreen]);

  // 使用 useRef 来稳定回调函数引用，避免无限重新渲染
  const onMobileToggleRef = useRef(onMobileToggle);
  const onDesktopToggleRef = useRef(onDesktopToggle);

  // 更新 ref 的值
  useEffect(() => {
    onMobileToggleRef.current = onMobileToggle;
  }, [onMobileToggle]);

  useEffect(() => {
    onDesktopToggleRef.current = onDesktopToggle;
  }, [onDesktopToggle]);

  // 优化：使用稳定的计算逻辑，避免回调函数依赖导致的重新渲染
  const finalOpen = useMemo(() => {
    if (isSmallScreen) {
      return onMobileToggleRef.current ? mobileOpen : showSidebar;
    } else {
      return onDesktopToggleRef.current ? desktopOpen : showSidebar;
    }
  }, [isSmallScreen, mobileOpen, showSidebar, desktopOpen]);

  // 统一的关闭处理函数
  const handleClose = useCallback(() => {
    if (isSmallScreen) {
      // 移动端：优先使用 onMobileToggle，否则使用本地状态
      if (onMobileToggleRef.current) {
        onMobileToggleRef.current();
      } else {
        setShowSidebar(false);
      }
    } else {
      // 桌面端：优先使用 onDesktopToggle，否则使用本地状态
      if (onDesktopToggleRef.current) {
        onDesktopToggleRef.current();
      } else {
        setShowSidebar(false);
      }
    }
  }, [isSmallScreen]);

  // 使用返回按键处理Hook，只在移动端且侧边栏打开时启用
  useDialogBackHandler(
    SIDEBAR_DIALOG_ID,
    isSmallScreen && finalOpen, // 使用统一的 finalOpen 状态
    handleClose // 使用统一的关闭处理函数
  );



  // 优化：减少 drawer 的依赖项，避免频繁重新渲染
  const drawer = useMemo(() => (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      // 自定义滚动条样式
      '&::-webkit-scrollbar': {
        width: '1px', // 故意设计为1px以隐藏滚动条
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '3px',
        '&:hover': {
          background: 'rgba(0, 0, 0, 0.3)',
        },
      },
      // Firefox 滚动条样式
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
    }}>
      {(isSmallScreen || onDesktopToggle) && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 1,
          minHeight: 48,
          alignItems: 'center',
        }}>
          <IconButton
            onClick={handleClose}
            sx={{
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                transform: 'scale(1.05)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              // 移动端优化
              '@media (hover: none)': {
                '&:hover': {
                  backgroundColor: 'transparent',
                  transform: 'none',
                },
                '&:active': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  transform: 'scale(0.95)',
                },
              },
            }}
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
  ), [isSmallScreen, handleClose, mcpMode, toolsEnabled, onMCPModeChange, onToolsToggle, onDesktopToggle]);

  if (isSmallScreen) {
    // 移动端：使用 SwipeableDrawer，支持右滑打开
    return (
      <SwipeableDrawer
        anchor="left"
        open={finalOpen}
        onClose={handleClose}
        onOpen={() => {
          // 滑动打开时的处理
          if (onMobileToggleRef.current) {
            onMobileToggleRef.current();
          } else {
            setShowSidebar(true);
          }
        }}
        disableSwipeToOpen={false} // 启用滑动打开功能
        swipeAreaWidth={30} // 设置滑动区域宽度为30px，更容易触发
        disableBackdropTransition={false} // 启用背景过渡动画
        disableDiscovery={false} // 启用发现模式，显示滑动提示
        ModalProps={{
          keepMounted: true, // 提升移动端性能
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            borderRadius: '0 16px 16px 0',
            boxShadow: theme.shadows[16],
          },
        }}
      >
        {drawer}
      </SwipeableDrawer>
    );
  }

  // 🚀 桌面端：直接用Box，不用Modal层
  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: drawerWidth,
        height: '100vh',
        zIndex: 0,
        boxSizing: 'border-box',
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        // 🚀 关键优化：使用transform而不是width变化，避免重新布局
        transform: finalOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
        transition: theme.transitions.create(['transform'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      {drawer}
    </Box>
  );
}, areMotionSidebarPropsEqual);

export default MotionSidebar;
