/**
 * DesktopLayout - 桌面端 L 形包边布局
 * 包含顶部标题栏 + 左侧导航栏，内容区域有圆角包裹效果
 * 仅在 Tauri 桌面端使用
 * 
 * 布局结构：
 * ┌─────────────────────────────────────┐
 * │          TitleBar (全宽)             │
 * ├────┬────────────────────────────────┤
 * │    │                                │
 * │ Nav│      内容区域（圆角）           │
 * │ Bar│                                │
 * │    │                                │
 * └────┴────────────────────────────────┘
 */
import React, { memo, useEffect, useState } from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import { isTauri } from '../../shared/utils/platformDetection';
import TitleBar from '../common/TitleBar';
import AppNavSidebar from './AppNavSidebar';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

const TITLE_BAR_HEIGHT = 44;
const NAV_SIDEBAR_WIDTH = 60;

const DesktopLayout: React.FC<DesktopLayoutProps> = memo(({ children }) => {
  const theme = useTheme();
  const [isTauriEnv, setIsTauriEnv] = useState(false);
  
  // L 形包边的背景色 - 根据主题模式选择
  const shellBgColor = theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.9)
    : alpha(theme.palette.grey[100], 0.95);

  useEffect(() => {
    const tauriDetected = isTauri();
    setIsTauriEnv(tauriDetected);
    
    // 设置 body 属性供其他组件检测
    if (tauriDetected) {
      document.body.setAttribute('data-tauri', 'true');
      document.body.setAttribute('data-desktop-layout', 'true');
    }
    return () => {
      document.body.removeAttribute('data-tauri');
      document.body.removeAttribute('data-desktop-layout');
    };
  }, []);

  // 非 Tauri 环境直接渲染子内容
  if (!isTauriEnv) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* 顶部标题栏 - 横跨全宽，与左侧导航融合 */}
      <TitleBar shellBgColor={shellBgColor} />

      {/* 主体区域：左侧导航 + 内容 */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* 左侧导航侧边栏 - 与顶部标题栏融合 */}
        <AppNavSidebar shellBgColor={shellBgColor} />

        {/* 内容区域容器 - 带圆角包裹效果 */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            // L 形包边效果：只在右侧和底部有间距
            marginTop: 0,
            marginLeft: 0,
            marginRight: '8px',
            marginBottom: '8px',
            // 四角圆角，聊天侧边栏打开时会覆盖左侧
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.6)
              : theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? 'inset 0 1px 0 rgba(255,255,255,0.05)'
              : 'inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
});

DesktopLayout.displayName = 'DesktopLayout';

export default DesktopLayout;

export { TITLE_BAR_HEIGHT, NAV_SIDEBAR_WIDTH };
