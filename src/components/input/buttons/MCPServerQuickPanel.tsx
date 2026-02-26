import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
  Box,
  Chip,
  Avatar,
  alpha,
  Button,
  Divider,
  Alert,
  IconButton,
  CircularProgress,
  Skeleton,
  useTheme
} from '@mui/material';
import BackButtonDialog from '../../common/BackButtonDialog';
import { ArrowLeft, Plug, Server, Wifi, Cpu, Terminal, Cog, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MCPServer, MCPServerType } from '../../../shared/types';
import { mcpService } from '../../../shared/services/mcp';
import CustomSwitch from '../../CustomSwitch';
import { useMCPServerStateManager } from '../../../hooks/useMCPServerStateManager';

// 服务器类型配置常量 — 颜色与 MCPServerSettings 保持一致
const SERVER_TYPE_CONFIG = {
  httpStream: {
    icon: Wifi,
    color: '#ff5722',
    label: 'HTTP Stream'
  },
  sse: {
    icon: Server,
    color: '#2196f3',
    label: 'SSE'
  },
  streamableHttp: {
    icon: Wifi,
    color: '#00bcd4',
    label: 'Streamable HTTP'
  },
  stdio: {
    icon: Terminal,
    color: '#ff9800',
    label: 'stdio'
  },
  inMemory: {
    icon: Cpu,
    color: '#4CAF50',
    label: 'In Memory'
  },
  default: {
    icon: Cog,
    color: '#9e9e9e',
    label: 'Default'
  }
} as const;

interface MCPServerQuickPanelProps {
  open: boolean;
  onClose: () => void;
  toolsEnabled?: boolean;
  onToolsEnabledChange?: (enabled: boolean) => void;
}

/**
 * MCP 工具服务器对话框组件
 * 可被 MCPToolsButton 和 ToolsMenu 共用
 */
const MCPServerQuickPanelInner: React.FC<MCPServerQuickPanelProps> = ({
  open,
  onClose,
  toolsEnabled = false,
  onToolsEnabledChange
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loadingServers, setLoadingServers] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 使用共享的MCP状态管理Hook
  const { createMCPToggleHandler } = useMCPServerStateManager();

  // 计算活跃服务器
  const activeServers = useMemo(
    () => servers.filter(server => server.isActive),
    [servers]
  );

  const hasActiveServers = activeServers.length > 0;

  // 加载服务器列表
  const loadServers = useCallback(async () => {
    try {
      const allServers = await mcpService.getServersAsync();
      setServers(allServers);
      setError(null);
    } catch (err) {
      console.error('加载服务器列表失败:', err);
      setError('加载服务器列表失败');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // 打开时加载服务器
  useEffect(() => {
    if (open) {
      loadServers();
    }
  }, [open, loadServers]);

  // 切换服务器状态
  const handleToggleServer = useCallback(async (serverId: string, isActive: boolean) => {
    setLoadingServers(prev => ({ ...prev, [serverId]: true }));
    setError(null);

    try {
      await mcpService.toggleServer(serverId, isActive);
      loadServers();

      // 自动管理总开关逻辑
      if (onToolsEnabledChange) {
        const updatedActiveServers = mcpService.getActiveServers();

        if (isActive && !toolsEnabled) {
          console.log('[MCP] 开启服务器，自动启用MCP工具总开关');
          onToolsEnabledChange(true);
        } else if (!isActive && updatedActiveServers.length === 0 && toolsEnabled) {
          console.log('[MCP] 所有服务器已关闭，自动禁用MCP工具总开关');
          onToolsEnabledChange(false);
        }
      }
    } catch (err) {
      console.error('切换服务器状态失败:', err);
      setError(`切换服务器状态失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoadingServers(prev => {
        const { [serverId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [loadServers, onToolsEnabledChange, toolsEnabled]);

  // 导航到设置页面
  const handleNavigateToSettings = useCallback(() => {
    onClose();
    navigate('/settings/mcp-server');
  }, [navigate, onClose]);

  // 使用共享的MCP状态管理逻辑
  const handleToolsEnabledChange = useCallback(
    (checked: boolean) => {
      const handler = createMCPToggleHandler(loadServers, onToolsEnabledChange);
      return handler(checked);
    },
    [createMCPToggleHandler, loadServers, onToolsEnabledChange]
  );

  // 获取服务器类型配置
  const getServerConfig = useCallback((type: MCPServerType) => {
    return SERVER_TYPE_CONFIG[type as keyof typeof SERVER_TYPE_CONFIG] || SERVER_TYPE_CONFIG.default;
  }, []);

  return (
    <BackButtonDialog
      open={open}
      onClose={onClose}
      fullScreen
      safeArea={false}
    >
      {/* 顶部导航栏 */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          paddingTop: 'max(var(--titlebar-height, 0px), var(--safe-area-top, 0px))',
        }}
      >
        <Toolbar sx={{ minHeight: 56, px: 1 }}>
          <IconButton onClick={onClose} edge="start" sx={{ mr: 0.5, color: 'text.primary' }}>
            <ArrowLeft size={22} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, color: 'text.primary' }}>
            MCP 工具
          </Typography>
          {hasActiveServers && (
            <Chip
              label={`${activeServers.length} 运行中`}
              size="small"
              sx={{
                mr: 1,
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 500,
                bgcolor: isDark ? alpha('#10b981', 0.15) : '#dcfce7',
                color: isDark ? '#6ee7b7' : '#166534',
                border: `1px solid ${isDark ? alpha('#10b981', 0.3) : '#bbf7d0'}`,
              }}
            />
          )}
          {onToolsEnabledChange && (
            <CustomSwitch
              checked={toolsEnabled}
              onChange={(e) => handleToolsEnabledChange(e.target.checked)}
            />
          )}
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
        {/* 错误提示 */}
        {error && (
          <Box sx={{ px: 2, pt: 2, flexShrink: 0 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* 可滚动的服务器列表区域 */}
        <Box sx={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          {isInitialLoading ? (
            <List disablePadding>
              {[1, 2, 3, 4].map((index) => (
                <ListItem key={index} sx={{ px: 2, py: 1.5 }}>
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Skeleton variant="circular" width={36} height={36} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Skeleton variant="text" width="50%" height={22} />}
                    secondary={<Skeleton variant="text" width={60} height={18} />}
                  />
                  <Skeleton variant="rectangular" width={40} height={22} sx={{ borderRadius: '11px' }} />
                </ListItem>
              ))}
            </List>
          ) : servers.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 4,
              color: 'text.secondary',
            }}>
              <Plug size={56} style={{ opacity: 0.3, marginBottom: 16 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                还没有配置 MCP 服务器
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                MCP 服务器可以为 AI 提供额外的工具和能力
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Settings size={16} />}
                onClick={handleNavigateToSettings}
              >
                前往配置
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {servers.map((server, index) => {
                const config = getServerConfig(server.type);
                const typeColor = config.color;
                return (
                  <React.Fragment key={server.id}>
                    <ListItem
                      sx={{
                        px: 2,
                        py: 1.5,
                        '&:active': { bgcolor: alpha(theme.palette.action.active, 0.05) },
                      }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {loadingServers[server.id] && (
                            <CircularProgress size={16} sx={{ color: 'text.secondary' }} />
                          )}
                          <CustomSwitch
                            checked={server.isActive}
                            onChange={(e) => handleToggleServer(server.id, e.target.checked)}
                            disabled={loadingServers[server.id] || false}
                          />
                        </Box>
                      }
                    >
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(typeColor, 0.12),
                            color: typeColor,
                            width: 36,
                            height: 36,
                          }}
                        >
                          <config.icon size={18} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>
                            {server.name}
                          </Typography>
                        }
                        secondary={
                          <Chip
                            label={config.label}
                            size="small"
                            sx={{
                              mt: 0.5,
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              bgcolor: alpha(typeColor, 0.08),
                              color: typeColor,
                              border: 'none',
                            }}
                          />
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                    {index < servers.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>
      </DialogContent>

      {/* 固定底部按钮 */}
      <DialogActions sx={{
        flexDirection: 'column',
        gap: 1,
        p: 2,
        pb: 'calc(var(--safe-area-bottom-computed, 0px) + 16px)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <Button
          fullWidth
          startIcon={<Settings size={16} />}
          onClick={handleNavigateToSettings}
          sx={{
            background: '#10b981',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2,
            py: 1.2,
            textTransform: 'none',
            '&:hover': { background: '#059669' },
          }}
        >
          管理 MCP 服务器
        </Button>
        <Button fullWidth variant="outlined" onClick={onClose}>
          关闭
        </Button>
      </DialogActions>
    </BackButtonDialog>
  );
};

// 使用 React.memo 包装，避免父组件重渲染时的不必要更新
const MCPServerQuickPanel = React.memo(MCPServerQuickPanelInner);

export default MCPServerQuickPanel;
