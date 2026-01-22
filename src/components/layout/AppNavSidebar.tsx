/**
 * AppNavSidebar - 应用级导航侧边栏
 * 仅在 Tauri 桌面端显示，形成 L 形包边效果
 */
import React, { memo } from 'react';
import { Box, IconButton, Tooltip, useTheme, alpha } from '@mui/material';
import { 
  MessageSquare, 
  Bot, 
  FolderOpen, 
  Settings,
  Languages
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface AppNavSidebarProps {
  shellBgColor?: string; // L 形包边背景色
}

const AppNavSidebar: React.FC<AppNavSidebarProps> = memo(({ shellBgColor }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // 导航项配置
  const navItems: NavItem[] = [
    { icon: <MessageSquare size={22} />, label: '聊天', path: '/chat' },
    { icon: <Bot size={22} />, label: '助手', path: '/chat' }, // 助手管理在聊天页面侧边栏
    { icon: <Languages size={22} />, label: '翻译', path: '/translate' },
    { icon: <FolderOpen size={22} />, label: '知识库', path: '/settings/knowledge' },
  ];

  const bottomNavItems: NavItem[] = [
    { icon: <Settings size={22} />, label: '设置', path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/chat') {
      return location.pathname === '/chat' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    
    return (
      <Tooltip title={item.label} placement="right" arrow>
        <IconButton
          onClick={() => navigate(item.path)}
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            color: active 
              ? theme.palette.primary.main 
              : theme.palette.text.secondary,
            backgroundColor: active 
              ? alpha(theme.palette.primary.main, 0.12)
              : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: active
                ? alpha(theme.palette.primary.main, 0.18)
                : alpha(theme.palette.action.hover, 0.08),
              color: active
                ? theme.palette.primary.main
                : theme.palette.text.primary,
            },
          }}
        >
          {item.icon}
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Box
      sx={{
        width: 60,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1.5,
        gap: 0.5,
        backgroundColor: shellBgColor || theme.palette.background.default,
        // 融合效果：不显示右侧边框
        borderRight: 'none',
        flexShrink: 0,
        // 确保应用侧边栏始终在聊天侧边栏之上
        zIndex: 100,
        position: 'relative',
      }}
    >
      {/* 顶部导航项 */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 0.5,
        flex: 1,
      }}>
        {navItems.map((item, index) => (
          <NavButton key={index} item={item} />
        ))}
      </Box>

      {/* 底部导航项 */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 0.5,
        pb: 1,
      }}>
        {bottomNavItems.map((item, index) => (
          <NavButton key={index} item={item} />
        ))}
      </Box>
    </Box>
  );
});

AppNavSidebar.displayName = 'AppNavSidebar';

export default AppNavSidebar;
