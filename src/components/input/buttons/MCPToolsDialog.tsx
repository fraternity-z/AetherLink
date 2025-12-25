import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Avatar,
  alpha,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Skeleton
} from '@mui/material';
import BackButtonDialog from '../../common/BackButtonDialog';
import { Wrench, Database, Globe, Plus, Settings, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MCPServer, MCPServerType } from '../../../shared/types';
import { mcpService } from '../../../shared/services/mcp';
import CustomSwitch from '../../CustomSwitch';
import { useMCPServerStateManager } from '../../../hooks/useMCPServerStateManager';

// 服务器类型配置常量
const SERVER_TYPE_CONFIG = {
  httpStream: {
    icon: Globe,
    color: '#9c27b0',
    label: 'HTTP Stream'
  },
  sse: {
    icon: Globe,
    color: '#2196f3',
    label: 'SSE'
  },
  streamableHttp: {
    icon: Globe,
    color: '#00bcd4',
    label: 'Streamable HTTP'
  },
  stdio: {
    icon: Terminal,
    color: '#ff9800',
    label: 'stdio'
  },
  inMemory: {
    icon: Database,
    color: '#4CAF50',
    label: 'In Memory'
  },
  default: {
    icon: Settings,
    color: '#9e9e9e',
    label: 'Default'
  }
} as const;

interface MCPToolsDialogProps {
  open: boolean;
  onClose: () => void;
  toolsEnabled?: boolean;
  onToolsEnabledChange?: (enabled: boolean) => void;
}

/**
 * MCP 工具服务器对话框组件
 * 可被 MCPToolsButton 和 ToolsMenu 共用
 */
const MCPToolsDialogInner: React.FC<MCPToolsDialogProps> = ({
  open,
  onClose,
  toolsEnabled = false,
  onToolsEnabledChange
}) => {
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
  const loadServers = useCallback(() => {
    try {
      const allServers = mcpService.getServers();
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

  // 获取服务器类型图标
  const getServerTypeIcon = useCallback((type: MCPServerType) => {
    const config = SERVER_TYPE_CONFIG[type as keyof typeof SERVER_TYPE_CONFIG] || SERVER_TYPE_CONFIG.default;
    const IconComponent = config.icon;
    return <IconComponent size={16} />;
  }, []);

  // 获取服务器类型颜色
  const getServerTypeColor = useCallback((type: MCPServerType) => {
    const config = SERVER_TYPE_CONFIG[type as keyof typeof SERVER_TYPE_CONFIG] || SERVER_TYPE_CONFIG.default;
    return config.color;
  }, []);

  return (
    <BackButtonDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      transitionDuration={0}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            maxHeight: '80vh'
          }
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Wrench size={20} color="#10b981" />
            <Typography variant="h6" fontWeight={600}>
              MCP 工具服务器
            </Typography>
            {hasActiveServers && (
              <Chip
                label={`${activeServers.length} 个运行中`}
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
          {onToolsEnabledChange && (
            <CustomSwitch
              checked={toolsEnabled}
              onChange={(e) => handleToolsEnabledChange(e.target.checked)}
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* 错误提示 */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {isInitialLoading ? (
          // 骨架屏加载状态
          <List sx={{ py: 0 }}>
            {[1, 2, 3].map((index) => (
              <ListItem key={index} sx={{ py: 2 }}>
                <ListItemIcon>
                  <Skeleton variant="circular" width={32} height={32} />
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" height={24} />}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: '10px' }} />
                      <Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: '10px' }} />
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
                <Box sx={{ ml: 'auto' }}>
                  <Skeleton variant="rectangular" width={40} height={24} sx={{ borderRadius: '12px' }} />
                </Box>
              </ListItem>
            ))}
          </List>
        ) : servers.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Wrench size={48} color="rgba(0,0,0,0.4)" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              还没有配置 MCP 服务器
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              MCP 服务器可以为 AI 提供额外的工具和功能
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={handleNavigateToSettings}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              添加服务器
            </Button>
          </Box>
        ) : (
          <>
            <List sx={{ py: 0 }}>
              {servers.map((server, index) => (
                <React.Fragment key={server.id}>
                  <ListItem
                    sx={{ py: 2 }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {loadingServers[server.id] && (
                          <CircularProgress size={16} />
                        )}
                        <CustomSwitch
                          checked={server.isActive}
                          onChange={(e) => handleToggleServer(server.id, e.target.checked)}
                          disabled={loadingServers[server.id] || false}
                        />
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: alpha(getServerTypeColor(server.type), 0.1),
                          color: getServerTypeColor(server.type),
                          width: 32,
                          height: 32
                        }}
                      >
                        {getServerTypeIcon(server.type)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {server.name}
                          </Typography>
                          {server.isActive && (
                            <Chip
                              label="运行中"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box component="div">
                          {server.description && (
                            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                              {server.description}
                            </Typography>
                          )}
                          {server.baseUrl && (
                            <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                              {server.baseUrl}
                            </Typography>
                          )}
                        </Box>
                      }
                      slotProps={{
                        secondary: { component: 'div' }
                      }}
                    />
                  </ListItem>
                  {index < servers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Settings size={16} />}
                onClick={handleNavigateToSettings}
                size="small"
              >
                管理 MCP 服务器
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </BackButtonDialog>
  );
};

// 使用 React.memo 包装，避免父组件重渲染时的不必要更新
const MCPToolsDialog = React.memo(MCPToolsDialogInner);

export default MCPToolsDialog;
