import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Typography,
  Box,
  Chip,
  Avatar,
  alpha,
  Button,
  Divider,
  useTheme
} from '@mui/material';
// Lucide Icons - 按需导入，高端简约设计
import { Wrench, Database, Globe, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../shared/store';
import type { MCPServer, MCPServerType } from '../../shared/types';
import { mcpService } from '../../shared/services/MCPService';

interface MCPToolsButtonProps {
  toolsEnabled?: boolean;
  onToolsEnabledChange?: (enabled: boolean) => void;
}

const MCPToolsButton: React.FC<MCPToolsButtonProps> = ({
  toolsEnabled = true,
  onToolsEnabledChange
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [open, setOpen] = useState(false);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [activeServers, setActiveServers] = useState<MCPServer[]>([]);

  // 获取工具栏显示样式设置
  const toolbarDisplayStyle = useSelector((state: RootState) =>
    (state.settings as any).toolbarDisplayStyle || 'both'
  );

  // 简约小巧的按钮样式 - 与主工具栏保持一致
  const getSimpleButtonStyles = () => {
    return {
      button: {
        background: 'transparent',
        border: 'none',
        borderRadius: '20px',
        padding: '6px 12px',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minHeight: '32px'
      },
      buttonHover: {
        background: isDarkMode
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.04)'
      },
      buttonActive: {
        background: isDarkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.06)',
        transform: 'scale(0.96)'
      }
    };
  };

  const simpleStyles = getSimpleButtonStyles();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = () => {
    const allServers = mcpService.getServers();
    const active = mcpService.getActiveServers();
    setServers(allServers);
    setActiveServers(active);
  };

  const handleOpen = () => {
    setOpen(true);
    loadServers();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleToggleServer = async (serverId: string, isActive: boolean) => {
    try {
      await mcpService.toggleServer(serverId, isActive);
      loadServers();

      // 自动管理总开关逻辑
      if (onToolsEnabledChange) {
        const updatedActiveServers = mcpService.getActiveServers();

        if (isActive && !toolsEnabled) {
          // 开启任何服务器时，如果总开关是关闭的，自动开启
          console.log('[MCP] 开启服务器，自动启用MCP工具总开关');
          onToolsEnabledChange(true);
        } else if (!isActive && updatedActiveServers.length === 0 && toolsEnabled) {
          // 关闭所有服务器时，自动关闭总开关
          console.log('[MCP] 所有服务器已关闭，自动禁用MCP工具总开关');
          onToolsEnabledChange(false);
        }
      }
    } catch (error) {
      console.error('切换服务器状态失败:', error);
    }
  };

  const handleNavigateToSettings = () => {
    setOpen(false);
    navigate('/settings/mcp-server');
  };

  const getServerTypeIcon = (type: MCPServerType) => {
    switch (type) {
      case 'httpStream':
        return <Globe size={16} />;
      case 'inMemory':
        return <Database size={16} />;
      default:
        return <Settings size={16} />;
    }
  };

  const getServerTypeColor = (type: MCPServerType) => {
    switch (type) {
      case 'httpStream':
        return '#9c27b0';
      case 'inMemory':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const hasActiveServers = activeServers.length > 0;

  return (
    <>
      <Box
        onClick={handleOpen}
        sx={{
          ...simpleStyles.button,
          background: hasActiveServers
            ? (isDarkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)')
            : 'transparent',
          margin: '0 2px',
          '&:hover': {
            ...simpleStyles.buttonHover,
            ...(hasActiveServers && {
              background: isDarkMode
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(16, 185, 129, 0.08)'
            })
          },
          '&:active': {
            ...simpleStyles.buttonActive
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
              fontWeight: 500,
              fontSize: '13px',
              color: hasActiveServers
                ? (isDarkMode ? 'rgba(16, 185, 129, 0.9)' : 'rgba(16, 185, 129, 0.8)')
                : (isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)'),
              ml: toolbarDisplayStyle === 'both' ? 0.5 : 0
            }}
          >
            工具
          </Typography>
        )}
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh'
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
              <Switch
                checked={toolsEnabled}
                onChange={(e) => onToolsEnabledChange(e.target.checked)}
                color="primary"
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {servers.length === 0 ? (
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
                    <ListItem sx={{ py: 2 }}>
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
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={server.isActive}
                          onChange={(e) => handleToggleServer(server.id, e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      </ListItemSecondaryAction>
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
      </Dialog>
    </>
  );
};

export default MCPToolsButton;
