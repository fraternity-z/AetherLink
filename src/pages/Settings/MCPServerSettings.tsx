import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemAvatar,
  Chip,
  Avatar,
  alpha,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import BackButtonDialog from '../../components/common/BackButtonDialog';
import { nanoid } from 'nanoid';
import CustomSwitch from '../../components/CustomSwitch';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft as ArrowBackIcon,
  Plus as AddIcon,
  Cog as SettingsIcon,
  Cpu as StorageIcon,
  Server as ServerIcon,
  Wifi as WifiIcon,
  Trash2 as DeleteIcon,
  Terminal as TerminalIcon
} from 'lucide-react';

import type { MCPServer, MCPServerType } from '../../shared/types';
import { mcpService } from '../../shared/services/mcp';
import { useTranslation } from '../../i18n';
import { SafeAreaContainer, CARD_STYLES } from '../../components/settings/SettingComponents';
import { isTauri, isDesktop } from '../../shared/utils/platformDetection';

const MCPServerSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [builtinDialogOpen, setBuiltinDialogOpen] = useState(false);
  const [builtinServers, setBuiltinServers] = useState<MCPServer[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);





  // 新服务器表单状态
  const [newServer, setNewServer] = useState<Partial<MCPServer>>({
    id: nanoid(),
    name: '',
    type: 'sse',
    description: '',
    baseUrl: '',
    command: '',
    isActive: false
  });

  // 检测是否为 Tauri 桌面端（仅在此环境下显示 stdio 选项）
  const isTauriDesktop = isTauri() && isDesktop();

  useEffect(() => {
    loadServers();
    loadBuiltinServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadServers = async () => {
    // 🔧 修复：使用异步方法确保数据完整加载，避免竞态条件
    const serverList = await mcpService.getServersAsync();
    setServers(serverList);
  };

  const loadBuiltinServers = () => {
    try {
      const builtinList = mcpService.getBuiltinServers();
      setBuiltinServers(builtinList);
    } catch (error) {
      console.error(t('settings.mcpServer.messages.loadBuiltinFailed'), error);
    }
  };

  const handleBack = () => {
    navigate('/settings');
  };

  const handleToggleServer = async (serverId: string, isActive: boolean) => {
    try {
      await mcpService.toggleServer(serverId, isActive);
      loadServers();
      setSnackbar({
        open: true,
        message: isActive ? t('settings.mcpServer.messages.serverEnabled') : t('settings.mcpServer.messages.serverDisabled'),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.operationFailed'),
        severity: 'error'
      });
    }
  };

  const handleAddServer = async () => {
    if (!newServer.name || !newServer.type) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.fillRequiredInfo'),
        severity: 'error'
      });
      return;
    }

    if ((newServer.type === 'sse' || newServer.type === 'streamableHttp' || newServer.type === 'httpStream') && !newServer.baseUrl) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.urlRequired'),
        severity: 'error'
      });
      return;
    }

    // stdio 类型需要 command
    if (newServer.type === 'stdio' && !newServer.command) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.commandRequired') || '请输入要执行的命令',
        severity: 'error'
      });
      return;
    }

    try {
      const server: MCPServer = {
        id: Date.now().toString(),
        name: newServer.name!,
        type: newServer.type!,
        description: newServer.description,
        baseUrl: newServer.baseUrl,
        command: newServer.command,
        isActive: false,
        headers: {},
        env: {},
        args: []
      };

      await mcpService.addServer(server);
      loadServers();
      setAddDialogOpen(false);
      setNewServer({
        id: nanoid(),
        name: '',
        type: 'sse',
        description: '',
        baseUrl: '',
        command: '',
        isActive: false
      });
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.serverAdded'),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.addFailed'),
        severity: 'error'
      });
    }
  };

  // 检查内置服务器是否已添加
  const isBuiltinServerAdded = (builtinServerName: string): boolean => {
    return servers.some(server => server.name === builtinServerName);
  };

  const handleAddBuiltinServer = async (builtinServer: MCPServer) => {
    // 检查是否已添加
    if (isBuiltinServerAdded(builtinServer.name)) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.serverExists', { name: builtinServer.name }),
        severity: 'warning'
      });
      return;
    }

    try {
      await mcpService.addBuiltinServer(builtinServer.name, {
        description: builtinServer.description,
        env: builtinServer.env,
        args: builtinServer.args,
        tags: builtinServer.tags,
        provider: builtinServer.provider
      });

      loadServers();
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.builtinServerAdded', { name: builtinServer.name }),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.builtinAddFailed'),
        severity: 'error'
      });
    }
  };

  const handleEditServer = (server: MCPServer) => {
    navigate(`/settings/mcp-server/${server.id}`, { state: { server } });
  };

  // 处理删除服务器
  const handleDeleteServer = async (server: MCPServer) => {
    if (deletingId) return; // 防止重复进入
    setDeletingId(server.id); // 标记为忙碌

    try {
      await mcpService.removeServer(server.id);
      loadServers();
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.serverDeleted', { name: server.name }),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.deleteFailed'),
        severity: 'error'
      });
    } finally {
      setDeletingId(null); // 重置
    }
  };



  const handleImportJson = async () => {
    try {
      const config = JSON.parse(importJson);

      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        throw new Error(t('settings.mcpServer.messages.jsonFormatError'));
      }

      // 类型规范化函数：支持多种格式
      const normalizeType = (type: string | undefined): MCPServerType => {
        if (!type) return 'sse';
        
        // 转换为小写便于比较
        const lowerType = type.toLowerCase().replace(/[-_]/g, '');
        
        // 映射各种格式到标准类型
        if (lowerType === 'streamablehttp' || lowerType === 'streamable') {
          return 'streamableHttp';
        }
        if (lowerType === 'httpstream') {
          return 'httpStream';
        }
        if (lowerType === 'inmemory' || lowerType === 'memory') {
          return 'inMemory';
        }
        if (lowerType === 'sse' || lowerType === 'serversent' || lowerType === 'serversentevents') {
          return 'sse';
        }
        if (lowerType === 'stdio' || lowerType === 'standardio') {
          return 'stdio';
        }
        
        // 默认返回 sse
        return 'sse';
      };

      let importCount = 0;
      const errors: string[] = [];

      for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        try {
          const configAny = serverConfig as any;
          const server: MCPServer = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            name: serverName,
            type: normalizeType(configAny.type),
            baseUrl: configAny.url || configAny.baseUrl,
            command: configAny.command,
            description: t('settings.mcpServer.messages.importFromJson', { name: serverName }),
            isActive: false,
            headers: configAny.headers || {},
            env: configAny.env || {},
            args: configAny.args || []
          };

          await mcpService.addServer(server);
          importCount++;
        } catch (error) {
          errors.push(`${serverName}: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      loadServers();
      setImportDialogOpen(false);
      setImportJson('');

      if (importCount > 0) {
        setSnackbar({
          open: true,
          message: errors.length > 0 
            ? t('settings.mcpServer.messages.importPartial', { count: importCount, errors: errors.length })
            : t('settings.mcpServer.messages.importSuccess', { count: importCount }),
          severity: errors.length > 0 ? 'error' : 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: t('settings.mcpServer.messages.importFailed', { errors: errors.join('; ') }),
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('settings.mcpServer.messages.jsonParseError', { error: error instanceof Error ? error.message : t('settings.mcpServer.messages.operationFailed') }),
        severity: 'error'
      });
    }
  };

  const getServerTypeIcon = (type: MCPServerType) => {
    switch (type) {
      case 'sse':
        return <ServerIcon size={20} />;
      case 'streamableHttp':
      case 'httpStream':
        return <WifiIcon size={20} />;
      case 'stdio':
        return <TerminalIcon size={20} />;
      case 'inMemory':
        return <StorageIcon size={20} />;
      default:
        return <SettingsIcon size={20} />;
    }
  };

  const getServerTypeLabel = (type: MCPServerType) => {
    switch (type) {
      case 'sse':
        return t('settings.mcpServer.serverTypes.sse');
      case 'streamableHttp':
        return t('settings.mcpServer.serverTypes.streamableHttp');
      case 'httpStream':
        return t('settings.mcpServer.serverTypes.httpStream');
      case 'stdio':
        return t('settings.mcpServer.serverTypes.stdio');
      case 'inMemory':
        return t('settings.mcpServer.serverTypes.inMemory');
      default:
        return t('settings.mcpServer.serverTypes.unknown');
    }
  };

  const getServerTypeColor = (type: MCPServerType) => {
    switch (type) {
      case 'sse':
        return '#2196f3'; // 蓝色
      case 'streamableHttp':
        return '#00bcd4'; // 青色
      case 'httpStream':
        return '#ff5722'; // 橙红色 (废弃标记)
      case 'stdio':
        return '#ff9800'; // 橙色
      case 'inMemory':
        return '#4CAF50'; // 绿色
      default:
        return '#9e9e9e';
    }
  };

  // 获取内置服务器的翻译描述
  const getBuiltinServerDescription = (serverName: string): string => {
    const key = `settings.mcpServer.builtinDialog.servers.${serverName}.description`;
    const translated = t(key);
    // 如果翻译键不存在，返回原始描述（fallback）
    return translated === key ? '' : translated;
  };

  // 获取标签的翻译
  const getTagTranslation = (tag: string, serverName?: string): string => {
    // 如果提供了服务器名称，优先从该服务器查找
    if (serverName) {
      const key = `settings.mcpServer.builtinDialog.servers.${serverName}.tags.${tag}`;
      const translated = t(key);
      if (translated !== key) {
        return translated;
      }
    }
    // 如果没有提供或找不到，尝试从所有内置服务器中查找
    const servers = ['@aether/time', '@aether/fetch', '@aether/calculator'];
    for (const srvName of servers) {
      const key = `settings.mcpServer.builtinDialog.servers.${srvName}.tags.${tag}`;
      const translated = t(key);
      if (translated !== key) {
        return translated;
      }
    }
    // 如果找不到翻译，返回原始标签
    return tag;
  };

  return (
    <SafeAreaContainer>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label="back"
            sx={{
              color: (theme) => theme.palette.primary.main,
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
              }}
            >
              {t('settings.mcpServer.pageTitle')}
            </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
              },
              borderRadius: 2,
            }}
          >
            {t('settings.mcpServer.addButton')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          pb: 'var(--content-bottom-padding)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {servers.length === 0 ? (
          <Paper elevation={0} sx={CARD_STYLES.elevated}>
            <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <SettingsIcon size={48} style={{ color: '#9333EA' }} />
              </Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                {t('settings.mcpServer.emptyState.title')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: { xs: 2.5, sm: 3 },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' }
                }}
              >
                {t('settings.mcpServer.emptyState.description')}
              </Typography>
              <Box sx={{
                display: 'flex',
                gap: { xs: 1.5, sm: 2 },
                flexWrap: 'wrap',
                justifyContent: 'center',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center'
              }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                  fullWidth={window.innerWidth < 600}
                  sx={{
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                    minHeight: { xs: 44, sm: 36 },
                    fontSize: { xs: '0.9rem', sm: '0.875rem' }
                  }}
                >
                  {t('settings.mcpServer.emptyState.addServer')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setImportDialogOpen(true)}
                  fullWidth={window.innerWidth < 600}
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': { borderColor: 'primary.dark', color: 'primary.dark' },
                    minHeight: { xs: 44, sm: 36 },
                    fontSize: { xs: '0.9rem', sm: '0.875rem' }
                  }}
                >
                  {t('settings.mcpServer.emptyState.importConfig')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setBuiltinDialogOpen(true)}
                  fullWidth={window.innerWidth < 600}
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': { borderColor: 'primary.dark', color: 'primary.dark' },
                    minHeight: { xs: 44, sm: 36 },
                    fontSize: { xs: '0.9rem', sm: '0.875rem' }
                  }}
                >
                  {t('settings.mcpServer.emptyState.builtinServers')}
                </Button>
              </Box>
            </Box>
          </Paper>
        ) : (
          <Paper elevation={0} sx={CARD_STYLES.elevated}>
            <Box sx={CARD_STYLES.header}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                {t('settings.mcpServer.serverList.title')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                {t('settings.mcpServer.serverList.description')}
              </Typography>
            </Box>

            <Divider />

            <List disablePadding>
              {servers.map((server, index) => (
                <React.Fragment key={server.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleEditServer(server)}
                      sx={{ flex: 1 }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alpha(getServerTypeColor(server.type), 0.12),
                            color: getServerTypeColor(server.type),
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                          }}
                        >
                          {getServerTypeIcon(server.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 0.5, sm: 1 },
                            flexWrap: 'wrap'
                          }}>
                            <Typography sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              fontSize: { xs: '0.9rem', sm: '1rem' }
                            }}>
                              {server.name}
                            </Typography>
                            <Chip
                              label={getServerTypeLabel(server.type)}
                              size="small"
                              sx={{
                                bgcolor: alpha(getServerTypeColor(server.type), 0.1),
                                color: getServerTypeColor(server.type),
                                fontWeight: 500,
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: { xs: 20, sm: 24 }
                              }}
                            />
                            {server.isActive && (
                              <Chip
                                label={t('settings.mcpServer.status.active')}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 20, sm: 24 }
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box component="div" sx={{ mt: { xs: 0.5, sm: 1 } }}>
                            {server.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                component="div"
                                sx={{
                                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                  lineHeight: 1.4,
                                  display: '-webkit-box',
                                  WebkitLineClamp: { xs: 2, sm: 3 },
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {server.description}
                              </Typography>
                            )}
                            {server.baseUrl && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                component="div"
                                sx={{
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  mt: 0.5,
                                  wordBreak: 'break-all'
                                }}
                              >
                                {server.baseUrl}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItemButton>

                    {/* 操作按钮区域 */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      pr: 2
                    }}>
                      <CustomSwitch
                        checked={server.isActive}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleServer(server.id, e.target.checked);
                        }}
                      />
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteServer(server);
                        }}
                        size="small"
                        disabled={deletingId === server.id}
                        sx={{
                          color: deletingId === server.id ? 'text.disabled' : 'error.main',
                          '&:hover': {
                            bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                          }
                        }}
                      >
                        <DeleteIcon size={18} />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < servers.length - 1 && <Divider variant="inset" component="li" sx={{ ml: 0 }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        {/* 快捷操作 */}
        <Paper elevation={0} sx={CARD_STYLES.elevated}>
          <Box sx={CARD_STYLES.header}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.1rem' }
              }}
            >
              {t('settings.mcpServer.quickActions.title')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {t('settings.mcpServer.quickActions.description')}
            </Typography>
          </Box>

          <Divider />

          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setImportDialogOpen(true)}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#06b6d4', 0.12),
                    color: '#06b6d4',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <AddIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      {t('settings.mcpServer.quickActions.import.title')}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {t('settings.mcpServer.quickActions.import.description')}
                    </Typography>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItemButton>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setBuiltinDialogOpen(true)}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#8b5cf6', 0.12),
                    color: '#8b5cf6',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <SettingsIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}>
                      {t('settings.mcpServer.quickActions.builtin.title')}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      {t('settings.mcpServer.quickActions.builtin.description')}
                    </Typography>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Paper>
      </Box>

      {/* 添加服务器对话框 */}
      <BackButtonDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('settings.mcpServer.addDialog.title')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('settings.mcpServer.addDialog.serverName')}
            fullWidth
            variant="outlined"
            value={newServer.name}
            onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('settings.mcpServer.addDialog.serverType')}</InputLabel>
            <Select
              value={newServer.type}
              label={t('settings.mcpServer.addDialog.serverType')}
              onChange={(e) => setNewServer({ ...newServer, type: e.target.value as MCPServerType })}
            >
              <MenuItem value="sse">{t('settings.mcpServer.addDialog.types.sse')}</MenuItem>
              <MenuItem value="streamableHttp">{t('settings.mcpServer.addDialog.types.streamableHttp')}</MenuItem>
              <MenuItem value="inMemory">{t('settings.mcpServer.addDialog.types.inMemory')}</MenuItem>
              {/* stdio 类型仅在 Tauri 桌面端显示 */}
              {isTauriDesktop && (
                <MenuItem value="stdio">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TerminalIcon size={16} />
                    {t('settings.mcpServer.addDialog.types.stdio') || '标准输入/输出 (stdio)'}
                  </Box>
                </MenuItem>
              )}
            </Select>
          </FormControl>
          {(newServer.type === 'sse' || newServer.type === 'streamableHttp' || newServer.type === 'httpStream') && (
            <TextField
              margin="dense"
              label={t('settings.mcpServer.addDialog.serverUrl')}
              fullWidth
              variant="outlined"
              value={newServer.baseUrl}
              onChange={(e) => setNewServer({ ...newServer, baseUrl: e.target.value })}
              placeholder={t('settings.mcpServer.addDialog.placeholders.url')}
              sx={{ mb: 2 }}
            />
          )}
          {/* stdio 类型的命令输入 */}
          {newServer.type === 'stdio' && (
            <>
              <TextField
                margin="dense"
                label={t('settings.mcpServer.addDialog.command') || '命令'}
                fullWidth
                variant="outlined"
                value={newServer.command}
                onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                placeholder="npx, node, python, uvx..."
                helperText={t('settings.mcpServer.addDialog.commandHelp') || '要执行的命令程序，如 npx、node、python 等'}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label={t('settings.mcpServer.addDialog.args') || '命令参数'}
                fullWidth
                variant="outlined"
                value={(newServer.args || []).join(' ')}
                onChange={(e) => setNewServer({ ...newServer, args: e.target.value.split(' ').filter(Boolean) })}
                placeholder="-y @anthropic/mcp-server-fetch"
                helperText={t('settings.mcpServer.addDialog.argsHelp') || '命令参数，用空格分隔'}
                sx={{ mb: 2 }}
              />
            </>
          )}
          <TextField
            margin="dense"
            label={t('settings.mcpServer.addDialog.description')}
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={newServer.description}
            onChange={(e) => setNewServer({ ...newServer, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>{t('settings.mcpServer.addDialog.cancel')}</Button>
          <Button onClick={handleAddServer} variant="contained">{t('settings.mcpServer.addDialog.add')}</Button>
        </DialogActions>
      </BackButtonDialog>

      {/* JSON 导入对话框 */}
      <BackButtonDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('settings.mcpServer.importDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('settings.mcpServer.importDialog.description')}
          </Typography>
          <Box
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              mb: 2,
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
          >
            {`{
  "mcpServers": {
    "fetch": {
      "type": "sse",
      "url": "https://mcp.api-inference.modelscope.cn/sse/89261d74d6814a"
    },
    "memory": {
      "type": "streamableHttp",
      "url": "https://example.com/mcp/memory"
    }
  }
}`}
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label={t('settings.mcpServer.importDialog.label')}
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder={t('settings.mcpServer.importDialog.placeholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>{t('settings.mcpServer.importDialog.cancel')}</Button>
          <Button
            onClick={handleImportJson}
            variant="contained"
            disabled={!importJson.trim()}
          >
            {t('settings.mcpServer.importDialog.import')}
          </Button>
        </DialogActions>
      </BackButtonDialog>

      {/* 内置服务器对话框 */}
      <BackButtonDialog
        open={builtinDialogOpen}
        onClose={() => setBuiltinDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={window.innerWidth < 600}
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: { xs: '100vh', sm: '90vh' },
            margin: { xs: 0, sm: 2 },
            borderRadius: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          // 移动端全屏时添加顶部安全区域
          pt: { xs: 'calc(var(--safe-area-top) + 16px)', sm: 2.5 },
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          fontWeight: 600,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          {t('settings.mcpServer.builtinDialog.title')}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              lineHeight: 1.5
            }}
          >
            {t('settings.mcpServer.builtinDialog.description')}
          </Typography>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1.5, sm: 2 },
            maxHeight: { xs: 'calc(100vh - 200px)', sm: '70vh', md: '80vh' },
            overflow: 'auto',
            pr: { xs: 0.5, sm: 1 },
            // 移动端滚动优化
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': {
              width: { xs: '2px', sm: '4px' }
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '2px'
            }
          }}>
            {builtinServers.map((builtinServer) => {
              const isAdded = isBuiltinServerAdded(builtinServer.name);
              return (
                <Paper
                  key={builtinServer.id}
                  elevation={0}
                  sx={(theme) => ({
                    border: '1px solid',
                    borderColor: isAdded 
                      ? (theme.palette.mode === 'dark' ? alpha('#10b981', 0.3) : '#d1fae5') 
                      : 'divider',
                    borderRadius: { xs: 2, sm: 2 },
                    transition: 'all 0.2s ease-in-out',
                    backgroundColor: isAdded 
                      ? (theme.palette.mode === 'dark' ? alpha('#10b981', 0.1) : '#f0fdf4') 
                      : theme.palette.background.paper,
                    cursor: 'pointer',
                    // 移动端触摸优化
                    touchAction: 'manipulation',
                    '&:hover': {
                      borderColor: isAdded 
                        ? (theme.palette.mode === 'dark' ? alpha('#10b981', 0.5) : '#a7f3d0') 
                        : '#10b981',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 4px 12px rgba(0,0,0,0.3)' 
                        : { xs: '0 2px 8px rgba(0,0,0,0.06)', sm: '0 4px 12px rgba(0,0,0,0.08)' }
                    },
                    '&:active': {
                      transform: { xs: 'scale(0.98)', sm: 'none' }
                    }
                  })}
                >
                <Box
                  sx={{
                    p: { xs: 2, sm: 2.5, md: 3 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'flex-start' },
                    gap: { xs: 2, sm: 2.5 }
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* 服务器名称 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.75, sm: 1 } }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                          color: 'text.primary',
                          lineHeight: 1.3,
                          wordBreak: 'break-word'
                        }}
                      >
                        {builtinServer.name}
                      </Typography>
                      {isAdded && (
                        <Chip
                          label={t('settings.mcpServer.builtinDialog.added')}
                          size="small"
                          sx={(theme) => ({
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: theme.palette.mode === 'dark' ? alpha('#10b981', 0.2) : '#dcfce7',
                            color: theme.palette.mode === 'dark' ? '#6ee7b7' : '#166534',
                            border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#10b981', 0.3) : '#bbf7d0'}`,
                            fontWeight: 500
                          })}
                        />
                      )}
                    </Box>

                    {/* 描述 */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: { xs: 1.5, sm: 2 },
                        lineHeight: 1.6,
                        fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.9rem' },
                        display: '-webkit-box',
                        WebkitLineClamp: { xs: 3, sm: 2 },
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {getBuiltinServerDescription(builtinServer.name) || builtinServer.description}
                    </Typography>

                    {/* 标签 */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 0.75, sm: 1 },
                      flexWrap: 'wrap'
                    }}>
                      {builtinServer.tags && builtinServer.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={getTagTranslation(tag, builtinServer.name)}
                          size="small"
                          variant="outlined"
                          sx={(theme) => ({
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            height: { xs: 22, sm: 24 },
                            borderColor: 'divider',
                            color: 'text.secondary',
                            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : '#f9fafb',
                            fontWeight: 500,
                            '& .MuiChip-label': {
                              px: { xs: 1, sm: 1.5 }
                            },
                            '&:hover': {
                              borderColor: '#10b981',
                              backgroundColor: alpha('#10b981', 0.05)
                            }
                          })}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* 添加按钮 */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    flexShrink: 0,
                    mt: { xs: 1, sm: 0 }
                  }}>
                    {isBuiltinServerAdded(builtinServer.name) ? (
                      <Button
                        variant="outlined"
                        size={window.innerWidth < 600 ? 'medium' : 'small'}
                        fullWidth={window.innerWidth < 600}
                        disabled
                        sx={{
                          borderColor: 'divider',
                          color: 'text.secondary',
                          borderRadius: { xs: 2, sm: 1.5 },
                          px: { xs: 3, sm: 2 },
                          py: { xs: 1, sm: 0.75 },
                          fontWeight: 500,
                          fontSize: { xs: '0.9rem', sm: '0.875rem' },
                          textTransform: 'none',
                          minWidth: { xs: 'auto', sm: 'auto' },
                          minHeight: { xs: 44, sm: 'auto' },
                          cursor: 'default'
                        }}
                      >
                        {t('settings.mcpServer.builtinDialog.added')}
                      </Button>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddBuiltinServer(builtinServer);
                        }}
                        variant="contained"
                        size={window.innerWidth < 600 ? 'medium' : 'small'}
                        fullWidth={window.innerWidth < 600}
                        sx={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          borderRadius: { xs: 2, sm: 1.5 },
                          px: { xs: 3, sm: 2 },
                          py: { xs: 1, sm: 0.75 },
                          fontWeight: 500,
                          fontSize: { xs: '0.9rem', sm: '0.875rem' },
                          textTransform: 'none',
                          minWidth: { xs: 'auto', sm: 'auto' },
                          minHeight: { xs: 44, sm: 'auto' },
                          '&:hover': {
                            backgroundColor: '#059669'
                          }
                        }}
                      >
                        {t('settings.mcpServer.builtinDialog.add')}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          // 移动端全屏时添加底部安全区域
          pb: { xs: 'calc(var(--safe-area-bottom-computed) + 16px)', sm: 2.5 },
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: { xs: 1, sm: 2 }
        }}>
          <Button
            onClick={() => setBuiltinDialogOpen(false)}
            variant="outlined"
            fullWidth={window.innerWidth < 600}
            sx={{
              minHeight: { xs: 44, sm: 36 },
              fontSize: { xs: '1rem', sm: '0.875rem' }
            }}
          >
            {t('settings.mcpServer.builtinDialog.close')}
          </Button>
        </DialogActions>
      </BackButtonDialog>



      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SafeAreaContainer>
  );
};

export default MCPServerSettings;
