import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer
} from '@mui/material';
import { X as CloseIcon } from 'lucide-react';
import SidebarTabs from './SidebarTabs';
import { useDialogBackHandler } from '../../hooks/useDialogBackHandler';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useAppSelector } from '../../shared/store';
import { Haptics } from '../../shared/utils/hapticFeedback';

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
  // 🔧 渲染计数器，监控重复渲染
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`🎬 MotionSidebar渲染 #${renderCount.current}`, { mobileOpen, desktopOpen });

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // 与ChatPageUI保持一致
  const [showSidebar, setShowSidebar] = useState(!isSmallScreen);
  
  // 获取触觉反馈设置
  const hapticSettings = useAppSelector((state) => state.settings.hapticFeedback);
  
  // 用于追踪上一次的打开状态，避免初次渲染时触发反馈
  const prevOpenRef = useRef<boolean | null>(null);

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
  
  // 监听侧边栏打开/关闭状态变化，触发触觉反馈
  useEffect(() => {
    // 跳过初次渲染
    if (prevOpenRef.current === null) {
      console.log('🎵 [Haptic] 初次渲染，跳过触觉反馈');
      prevOpenRef.current = finalOpen;
      return;
    }
    
    // 检查状态是否真的发生了变化
    if (prevOpenRef.current !== finalOpen) {
      console.log('🎵 [Haptic] 侧边栏状态变化:', {
        from: prevOpenRef.current,
        to: finalOpen,
        hapticSettings,
        enabled: hapticSettings?.enabled,
        enableOnSidebar: hapticSettings?.enableOnSidebar
      });
      
      // 检查是否启用了触觉反馈
      if (hapticSettings?.enabled && hapticSettings?.enableOnSidebar) {
        console.log('🎵 [Haptic] 触发侧边栏触觉反馈！');
        // 触发侧边栏专用的触觉反馈
        Haptics.drawerPulse();
      } else {
        console.log('🎵 [Haptic] 触觉反馈未启用或侧边栏反馈已关闭');
      }
      
      prevOpenRef.current = finalOpen;
    }
  }, [finalOpen, hapticSettings]);

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

  // 🎯 拖拽进度状态（用于跟随手指移动）
  const [dragProgress, setDragProgress] = useState<number | null>(null);

  // 🎯 使用新的手势系统
  const { isDragging } = useSwipeGesture(
    finalOpen,
    {
      onDragStart: () => {
        console.log('🎯 [Gesture] 开始拖拽');
        // 触发触觉反馈
        if (hapticSettings?.enabled && hapticSettings?.enableOnSidebar) {
          Haptics.light();
        }
      },
      onDragMove: (offset: number, progress: number) => {
        console.log('🎯 [Gesture] 拖拽中', { offset, progress: progress.toFixed(2) });
        // 更新拖拽进度，实现跟随效果
        setDragProgress(progress);
      },
      onDragEnd: (shouldOpen: boolean) => {
        console.log('🎯 [Gesture] 拖拽结束', { shouldOpen });
        // 清除拖拽进度
        setDragProgress(null);
        
        // 根据结果打开或关闭侧边栏
        if (shouldOpen !== finalOpen) {
          if (isSmallScreen) {
            onMobileToggleRef.current?.();
          } else {
            onDesktopToggleRef.current?.();
          }
        }
        
        // ✅ 触发触觉反馈（使用中等强度）
        if (hapticSettings?.enabled && hapticSettings?.enableOnSidebar) {
          Haptics.medium();
        }
      },
      onCancel: () => {
        console.log('🎯 [Gesture] 手势取消');
        // 清除拖拽进度
        setDragProgress(null);
      },
    },
    {
      edgeWidth: 30,
      minSwipeDistance: 50,
      minSwipeVelocity: 0.3,
      hysteresis: 0.52,
      drawerWidth: drawerWidth,
      enabled: isSmallScreen, // 只在移动端启用
      debug: true, // 开发时启用调试
    }
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

  // 🎯 计算实际的 transform 值（考虑拖拽进度）
  const getDrawerTransform = useCallback(() => {
    if (dragProgress !== null) {
      // 拖拽中：根据进度计算位置
      const offset = -drawerWidth * (1 - dragProgress);
      return `translateX(${offset}px)`;
    }
    // 非拖拽状态：根据打开/关闭状态
    return finalOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`;
  }, [dragProgress, finalOpen, drawerWidth]);

  if (isSmallScreen) {
    // 🚀 移动端：高性能Drawer + 完整手势支持
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={finalOpen || isDragging} // 拖拽时也保持打开
        onClose={handleClose}
        ModalProps={{
          keepMounted: true, // 保持DOM挂载，提升性能
          disablePortal: false,
          // 🔧 优化背景遮罩性能
          BackdropProps: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              // 拖拽时根据进度调整透明度
              opacity: dragProgress !== null ? dragProgress * 0.5 : (finalOpen ? 0.5 : 0),
              // ✅ 改为线性过渡，更丝滑
              transition: dragProgress !== null ? 'none' : 'opacity 200ms linear',
            }
          },
          // 🔧 移动端性能优化
          disableScrollLock: true, // 避免滚动锁定开销
          disableEnforceFocus: true, // 减少焦点管理开销
          disableAutoFocus: true, // 避免自动聚焦开销
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            borderRadius: '0 16px 16px 0',
            boxShadow: theme.shadows[16],
            // 🚀 关键优化：使用transform实现拖拽跟随
            transform: getDrawerTransform(),
            // ✅ 拖拽时禁用过渡，非拖拽时使用线性过渡（更丝滑）
            transition: dragProgress !== null ? 'none' : 'transform 200ms linear',
            // 🔧 移动端优化
            willChange: 'transform', // 提示浏览器优化
            backfaceVisibility: 'hidden', // 避免闪烁
          },
        }}
      >
        {drawer}
      </Drawer>
    );
  }

  // 🚀 桌面端：直接用Box，完全避免Modal层阻挡点击
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
        // 🚀 关键优化：使用transform而不是width变化
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
