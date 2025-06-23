import { useState, useMemo } from 'react';
import { Box, IconButton, Drawer, SwipeableDrawer, useMediaQuery, useTheme } from '@mui/material';
import { X as CloseIcon } from 'lucide-react';
import SidebarTabs from './SidebarTabs';
import {
  getDesktopDrawerStyles,
  getDrawerContentStyles,
  getCloseButtonStyles,
  getCloseButtonInteractionStyles,
} from './sidebarOptimization';
import { useSidebarToggle, useSidebarKeyboardShortcuts } from './hooks/useSidebarToggle';

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

export default function Sidebar({
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [localMobileOpen, setLocalMobileOpen] = useState(false);
  const [localDesktopOpen, setLocalDesktopOpen] = useState(true);

  const drawerWidth = 320;

  // 计算滑动区域宽度：屏幕宽度的1/3，符合主流应用标准
  const swipeAreaWidth = useMemo(() => {
    if (typeof window !== 'undefined') {
      return Math.min(window.innerWidth * 0.33, 150); // 最大150px，避免过大
    }
    return 120; // 服务端渲染时的默认值
  }, []);

  // 使用优化的侧边栏切换Hook
  const { handleToggle: handleDrawerToggle } = useSidebarToggle({
    isMobile,
    onMobileToggle,
    onDesktopToggle,
    localMobileOpen,
    localDesktopOpen,
    setLocalMobileOpen,
    setLocalDesktopOpen,
  });

  // 添加键盘快捷键支持
  useSidebarKeyboardShortcuts(handleDrawerToggle, true);

  // 使用 useMemo 缓存计算结果
  const isOpen = useMemo(() => {
    return isMobile
      ? (onMobileToggle ? mobileOpen : localMobileOpen)
      : (onDesktopToggle ? desktopOpen : localDesktopOpen);
  }, [isMobile, onMobileToggle, mobileOpen, localMobileOpen, onDesktopToggle, desktopOpen, localDesktopOpen]);

  // 使用 useMemo 缓存抽屉内容，避免不必要的重新渲染
  // 🔥 关键优化：减少依赖项，避免频繁重新创建
  const drawer = useMemo(() => (
    <Box sx={getDrawerContentStyles()}>
      {/* 显示收起按钮：移动端始终显示，桌面端在有控制函数时显示 */}
      {(isMobile || onDesktopToggle) && (
        <Box sx={getCloseButtonStyles()}>
          <IconButton
            onClick={handleDrawerToggle}
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
  ), [isMobile, onDesktopToggle, handleDrawerToggle]); // 🔥 移除频繁变化的props依赖

  // 优化的桌面端样式
  const desktopDrawerSx = useMemo(() => getDesktopDrawerStyles(drawerWidth, isOpen), [drawerWidth, isOpen]);

  return (
    <>
      {isMobile ? (
        <SwipeableDrawer
          anchor="left"
          variant="temporary"
          open={isOpen}
          onClose={handleDrawerToggle}
          onOpen={handleDrawerToggle}
          // 性能优化配置
          disableBackdropTransition={true} // 提升低端设备FPS
          disableDiscovery={false} // 保持边缘发现功能
          disableSwipeToOpen={false} // 允许滑动打开
          hysteresis={0.4} // 降低阈值，更容易触发打开/关闭
          minFlingVelocity={300} // 降低速度阈值，更容易触发滑动
          swipeAreaWidth={swipeAreaWidth} // 屏幕宽度的1/3，符合主流应用标准
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
            disableScrollLock: true, // 避免滚动锁定，提升性能
            disableEnforceFocus: true, // 减少焦点管理开销
            disableAutoFocus: true, // 避免自动焦点，减少重绘
            disableRestoreFocus: true, // 避免焦点恢复开销
            disablePortal: false, // 保持Portal，但优化其他方面
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              // 🔥 关键性能优化：CSS containment
              contain: 'layout style paint',
              // 硬件加速
              willChange: 'transform',
              transform: 'translateZ(0)',
              // 避免重绘
              backfaceVisibility: 'hidden',
            },
          }}
        >
          {drawer}
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="persistent"
          sx={desktopDrawerSx}
          open={isOpen}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
}