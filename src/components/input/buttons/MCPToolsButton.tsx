import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Box,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import { Wrench } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../shared/store';
import type { MCPServer } from '../../../shared/types';
import { mcpService } from '../../../shared/services/mcp';
import { getGlassmorphismToolbarStyles, getTransparentToolbarStyles } from '../InputToolbar';
import MCPToolsDialog from './MCPToolsDialog';

// 稳定的选择器函数，避免每次渲染创建新引用
const selectToolbarDisplayStyle = (state: RootState) => 
  state.settings?.toolbarDisplayStyle || 'both';
const selectToolbarStyle = (state: RootState) => 
  state.settings?.toolbarStyle || 'glassmorphism';

interface MCPToolsButtonProps {
  toolsEnabled?: boolean;
  onToolsEnabledChange?: (enabled: boolean) => void;
  variant?: 'toolbar' | 'icon-button-compact' | 'icon-button-integrated';
}

const MCPToolsButtonInner: React.FC<MCPToolsButtonProps> = ({
  toolsEnabled = false,
  onToolsEnabledChange,
  variant = 'toolbar'
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [open, setOpen] = useState(false);
  const [servers, setServers] = useState<MCPServer[]>([]);

  // 使用稳定的选择器
  const toolbarDisplayStyle = useSelector(selectToolbarDisplayStyle) as 'icon' | 'text' | 'both';
  const toolbarStyle = useSelector(selectToolbarStyle) as 'glassmorphism' | 'transparent';

  // 计算活跃服务器
  const activeServers = useMemo(
    () => servers.filter(server => server.isActive),
    [servers]
  );

  // 根据设置选择样式
  const currentStyles = useMemo(() =>
    toolbarStyle === 'glassmorphism'
      ? getGlassmorphismToolbarStyles(isDarkMode)
      : getTransparentToolbarStyles(isDarkMode),
    [toolbarStyle, isDarkMode]
  );

  // 加载服务器列表
  const loadServers = useCallback(() => {
    try {
      const allServers = mcpService.getServers();
      setServers(allServers);
    } catch (error) {
      console.error('加载服务器列表失败:', error);
    }
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    // 移除这里的 loadServers() 调用
    // MCPToolsDialog 在 open 变为 true 时会自动加载
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    loadServers(); // 关闭时刷新状态
  }, [loadServers]);

  // 键盘导航处理
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  }, [handleOpen]);

  const hasActiveServers = activeServers.length > 0;

  // 根据 variant 渲染不同的按钮样式
  const renderButton = () => {
    if (variant === 'icon-button-compact') {
      const iconColor = hasActiveServers
        ? '#4CAF50'
        : (isDarkMode ? '#B0B0B0' : '#555');
      
      return (
        <Tooltip title="MCP工具">
          <IconButton
            size="small"
            onClick={handleOpen}
            sx={{
              color: iconColor,
              backgroundColor: hasActiveServers ? `${iconColor}15` : 'transparent',
              border: hasActiveServers ? `1px solid ${iconColor}30` : '1px solid transparent',
              width: 34,
              height: 34,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: `${iconColor}20`,
                borderColor: `${iconColor}50`,
                color: iconColor,
                transform: 'translateY(-1px)',
                boxShadow: `0 2px 8px ${iconColor}20`
              }
            }}
          >
            <Wrench size={20} />
          </IconButton>
        </Tooltip>
      );
    }

    if (variant === 'icon-button-integrated') {
      const iconColor = hasActiveServers
        ? '#4CAF50'
        : (isDarkMode ? '#ffffff' : '#000000');
      
      return (
        <Tooltip title="MCP工具">
          <span>
            <IconButton
              size="medium"
              onClick={handleOpen}
              disabled={false}
              style={{
                color: iconColor,
                padding: '6px',
                backgroundColor: hasActiveServers ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Wrench size={20} />
            </IconButton>
          </span>
        </Tooltip>
      );
    }

    // toolbar 样式
    return (
      <Box
        role="button"
        tabIndex={0}
        aria-label="打开 MCP 工具管理"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        sx={{
          ...currentStyles.button,
          ...(hasActiveServers && toolbarStyle === 'glassmorphism' && {
            background: isDarkMode
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(16, 185, 129, 0.2)',
            border: isDarkMode
              ? '1px solid rgba(16, 185, 129, 0.25)'
              : '1px solid rgba(16, 185, 129, 0.35)',
            boxShadow: isDarkMode
              ? '0 4px 16px rgba(16, 185, 129, 0.1), 0 1px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(16, 185, 129, 0.2)'
              : '0 4px 16px rgba(16, 185, 129, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(16, 185, 129, 0.3)'
          }),
          ...(hasActiveServers && toolbarStyle === 'transparent' && {
            background: isDarkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)'
          }),
          margin: toolbarStyle === 'glassmorphism' ? '0 4px' : '0 2px',
          '&:hover': {
            ...currentStyles.buttonHover,
            ...(hasActiveServers && toolbarStyle === 'glassmorphism' && {
              background: isDarkMode
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(16, 185, 129, 0.25)',
              border: isDarkMode
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: isDarkMode
                ? '0 6px 24px rgba(16, 185, 129, 0.15), 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(16, 185, 129, 0.25)'
                : '0 6px 24px rgba(16, 185, 129, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(16, 185, 129, 0.4)'
            }),
            ...(hasActiveServers && toolbarStyle === 'transparent' && {
              background: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)'
            })
          },
          '&:active': {
            ...currentStyles.buttonActive
          },
          '&:focus': {
            outline: `2px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.6)'}`,
            outlineOffset: '2px',
          }
        }}
        title="MCP 工具"
      >
        {toolbarDisplayStyle !== 'text' && (
          <Wrench
            size={16}
            color={hasActiveServers
              ? (isDarkMode ? 'rgba(16, 185, 129, 0.9)' : 'rgba(16, 185, 129, 0.8)')
              : (isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)')
            }
          />
        )}
        {toolbarDisplayStyle !== 'icon' && (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '13px',
              color: hasActiveServers
                ? (isDarkMode ? 'rgba(16, 185, 129, 0.95)' : 'rgba(16, 185, 129, 0.9)')
                : (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'),
              textShadow: isDarkMode
                ? '0 1px 2px rgba(0, 0, 0, 0.3)'
                : '0 1px 2px rgba(255, 255, 255, 0.8)',
              letterSpacing: '0.01em',
              ml: toolbarDisplayStyle === 'both' ? 0.5 : 0
            }}
          >
            工具
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <>
      {renderButton()}

      <MCPToolsDialog
        open={open}
        onClose={handleClose}
        toolsEnabled={toolsEnabled}
        onToolsEnabledChange={onToolsEnabledChange}
      />
    </>
  );
};

// 使用 React.memo 避免父组件重渲染时的不必要更新
const MCPToolsButton = React.memo(MCPToolsButtonInner);

export default MCPToolsButton;
