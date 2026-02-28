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
  Divider,
  Tabs,
  Tab
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
  Terminal as TerminalIcon,
  Wrench as ToolIcon,
  Bot as BotIcon
} from 'lucide-react';

import type { MCPServer, MCPServerType } from '../../shared/types';
import { mcpService } from '../../shared/services/mcp';
import { useTranslation } from '../../i18n';
import { SafeAreaContainer, CARD_STYLES } from '../../components/settings/SettingComponents';
import Scrollbar from '../../components/Scrollbar';
import { isTauri, isDesktop } from '../../shared/utils/platformDetection';

const MCPServerSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [builtinServers, setBuiltinServers] = useState<MCPServer[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);





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
      // 需要传入配置对象来智能推断类型
      const normalizeType = (type: string | undefined, serverConfig?: any): MCPServerType => {
        // 如果有明确的 type 字段
        if (type) {
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
        }
        
        // 🔧 智能推断：如果有 command 字段，说明是 stdio 类型（Claude Desktop 标准格式）
        if (serverConfig?.command) {
          return 'stdio';
        }
        
        // 如果有 url 或 baseUrl 字段，说明是 HTTP 类型
        if (serverConfig?.url || serverConfig?.baseUrl) {
          return 'sse';
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
            type: normalizeType(configAny.type, configAny),
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

  // ─── 分类过滤 ───
  const externalServers = servers.filter(s => !mcpService.isBuiltinServer(s.name));
  const builtinTemplates = builtinServers.filter(s => s.category !== 'assistant');
  const assistantTemplates = builtinServers.filter(s => s.category === 'assistant');

  const getAddedServer = (templateName: string): MCPServer | undefined => {
    return servers.find(s => s.name === templateName);
  };

  // ─── 内置/助手列表项渲染（与外部服务器 Tab 统一风格） ───
  const renderServerListItem = (template: MCPServer, index: number, total: number) => {
    const addedServer = getAddedServer(template.name);
    const isAdded = !!addedServer;
    const categoryColor = template.category === 'assistant' ? '#8b5cf6' : '#4CAF50';

    return (
      <React.Fragment key={template.id}>
        <ListItem disablePadding sx={{ transition: 'all 0.2s', '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) } }}>
          <ListItemButton onClick={() => {
            if (isAdded) {
              if (template.category === 'assistant') {
                navigate(`/settings/mcp-assistant/${addedServer!.id}`, { state: { server: addedServer! } });
              } else {
                handleEditServer(addedServer!);
              }
            }
          }} sx={{ flex: 1, cursor: isAdded ? 'pointer' : 'default' }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: alpha(categoryColor, 0.12), color: categoryColor, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                {template.category === 'assistant' ? <BotIcon size={20} /> : <StorageIcon size={20} />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    {template.name}
                  </Typography>
                  <Chip
                    label={getServerTypeLabel('inMemory')}
                    size="small"
                    sx={{ bgcolor: alpha(categoryColor, 0.1), color: categoryColor, fontWeight: 500, fontSize: '0.7rem', height: { xs: 20, sm: 24 } }}
                  />
                  {isAdded && addedServer!.isActive && (
                    <Chip label={t('settings.mcpServer.status.active')} size="small" color="success" variant="outlined"
                      sx={{ fontSize: '0.7rem', height: { xs: 20, sm: 24 } }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box component="div" sx={{ mt: { xs: 0.5, sm: 1 } }}>
                  <Typography variant="body2" color="text.secondary" component="div"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {getBuiltinServerDescription(template.name) || template.description}
                  </Typography>
                  {template.tags && template.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.75 }}>
                      {template.tags.map((tag) => (
                        <Chip key={tag} label={getTagTranslation(tag, template.name)} size="small" variant="outlined"
                          sx={(theme) => ({ fontSize: '0.65rem', height: 20, borderColor: 'divider', color: 'text.secondary',
                            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : '#f9fafb' })}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              }
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItemButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 2 }}>
            {isAdded ? (
              <>
                <CustomSwitch checked={addedServer!.isActive}
                  onChange={(e) => { e.stopPropagation(); handleToggleServer(addedServer!.id, e.target.checked); }}
                />
                <IconButton size="small" disabled={deletingId === addedServer!.id}
                  onClick={(e) => { e.stopPropagation(); handleDeleteServer(addedServer!); }}
                  sx={{ color: deletingId === addedServer!.id ? 'text.disabled' : 'error.main', '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) } }}
                >
                  <DeleteIcon size={18} />
                </IconButton>
              </>
            ) : (
              <Button onClick={(e) => { e.stopPropagation(); handleAddBuiltinServer(template); }}
                variant="contained" size="small"
                sx={{ backgroundColor: '#10b981', color: 'white', textTransform: 'none', px: 2,
                  minHeight: { xs: 36, sm: 32 }, '&:hover': { backgroundColor: '#059669' } }}
              >
                {t('settings.mcpServer.builtinDialog.add')}
              </Button>
            )}
          </Box>
        </ListItem>
        {index < total - 1 && <Divider variant="inset" component="li" sx={{ ml: 0 }} />}
      </React.Fragment>
    );
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
          {activeTab === 0 && (
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
          )}
        </Toolbar>
      </AppBar>

      {/* ─── Tab 导航栏 ─── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{ minHeight: 42 }}
        >
          <Tab
            icon={<ServerIcon size={16} />} iconPosition="start"
            label={t('settings.mcpServer.tabs.external') || '外部服务器'}
            sx={{ minHeight: 42, textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          />
          <Tab
            icon={<ToolIcon size={16} />} iconPosition="start"
            label={t('settings.mcpServer.tabs.builtin') || '内置工具'}
            sx={{ minHeight: 42, textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          />
          <Tab
            icon={<BotIcon size={16} />} iconPosition="start"
            label={t('settings.mcpServer.tabs.assistant') || '智能助手'}
            sx={{ minHeight: 42, textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          />
        </Tabs>
      </Box>

      <Scrollbar
        style={{
          flexGrow: 1,
          padding: '16px',
          paddingBottom: 'var(--content-bottom-padding)',
        }}
      >
        {/* ═══════ Tab 0: 外部服务器 ═══════ */}
        {activeTab === 0 && (
          <>
            {externalServers.length === 0 ? (
              <Paper elevation={0} sx={CARD_STYLES.elevated}>
                <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                  <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                    <ServerIcon size={48} style={{ color: '#2196f3' }} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {t('settings.mcpServer.emptyState.title')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2.5, sm: 3 } }}>
                    {t('settings.mcpServer.emptyState.description')}
                  </Typography>
                  <Box sx={{
                    display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap',
                    justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center'
                  }}>
                    <Button variant="contained" startIcon={<AddIcon />}
                      onClick={() => setAddDialogOpen(true)}
                      fullWidth={window.innerWidth < 600}
                      sx={{ minHeight: { xs: 44, sm: 36 } }}
                    >
                      {t('settings.mcpServer.emptyState.addServer')}
                    </Button>
                    <Button variant="outlined"
                      onClick={() => setImportDialogOpen(true)}
                      fullWidth={window.innerWidth < 600}
                      sx={{ minHeight: { xs: 44, sm: 36 } }}
                    >
                      {t('settings.mcpServer.emptyState.importConfig')}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            ) : (
              <Paper elevation={0} sx={CARD_STYLES.elevated}>
                <Box sx={CARD_STYLES.header}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    {t('settings.mcpServer.serverList.title')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {t('settings.mcpServer.serverList.description')}
                  </Typography>
                </Box>
                <Divider />
                <List disablePadding>
                  {externalServers.map((server, index) => (
                    <React.Fragment key={server.id}>
                      <ListItem disablePadding sx={{ transition: 'all 0.2s', '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) } }}>
                        <ListItemButton onClick={() => handleEditServer(server)} sx={{ flex: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: alpha(getServerTypeColor(server.type), 0.12), color: getServerTypeColor(server.type), boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                              {getServerTypeIcon(server.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                  {server.name}
                                </Typography>
                                <Chip label={getServerTypeLabel(server.type)} size="small"
                                  sx={{ bgcolor: alpha(getServerTypeColor(server.type), 0.1), color: getServerTypeColor(server.type), fontWeight: 500, fontSize: '0.7rem', height: { xs: 20, sm: 24 } }}
                                />
                                {server.isActive && (
                                  <Chip label={t('settings.mcpServer.status.active')} size="small" color="success" variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: { xs: 20, sm: 24 } }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box component="div" sx={{ mt: { xs: 0.5, sm: 1 } }}>
                                {server.description && (
                                  <Typography variant="body2" color="text.secondary" component="div"
                                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                  >
                                    {server.description}
                                  </Typography>
                                )}
                                {server.baseUrl && (
                                  <Typography variant="caption" color="text.secondary" component="div"
                                    sx={{ fontSize: '0.7rem', mt: 0.5, wordBreak: 'break-all' }}
                                  >
                                    {server.baseUrl}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItemButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 2 }}>
                          <CustomSwitch checked={server.isActive}
                            onChange={(e) => { e.stopPropagation(); handleToggleServer(server.id, e.target.checked); }}
                          />
                          <IconButton size="small" disabled={deletingId === server.id}
                            onClick={(e) => { e.stopPropagation(); handleDeleteServer(server); }}
                            sx={{ color: deletingId === server.id ? 'text.disabled' : 'error.main', '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) } }}
                          >
                            <DeleteIcon size={18} />
                          </IconButton>
                        </Box>
                      </ListItem>
                      {index < externalServers.length - 1 && <Divider variant="inset" component="li" sx={{ ml: 0 }} />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}

            {/* 快捷操作 */}
            <Paper elevation={0} sx={{ ...CARD_STYLES.elevated, mt: 2 }}>
              <List disablePadding>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => setImportDialogOpen(true)}
                    sx={{ transition: 'all 0.2s', '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) } }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: alpha('#06b6d4', 0.12), color: '#06b6d4' }}><AddIcon /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>{t('settings.mcpServer.quickActions.import.title')}</Typography>}
                      secondary={<Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{t('settings.mcpServer.quickActions.import.description')}</Typography>}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItemButton>
                </ListItem>
              </List>
            </Paper>
          </>
        )}

        {/* ═══════ Tab 1: 内置工具 ═══════ */}
        {activeTab === 1 && (
          <Paper elevation={0} sx={CARD_STYLES.elevated}>
            <Box sx={CARD_STYLES.header}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                {t('settings.mcpServer.builtinDialog.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                {t('settings.mcpServer.builtinDialog.description') || '选择并启用内置工具，无需配置即可使用'}
              </Typography>
            </Box>
            <Divider />
            <List disablePadding>
              {builtinTemplates.map((tpl, i) => renderServerListItem(tpl, i, builtinTemplates.length))}
            </List>
          </Paper>
        )}

        {/* ═══════ Tab 2: 智能助手 ═══════ */}
        {activeTab === 2 && (
          <Paper elevation={0} sx={CARD_STYLES.elevated}>
            <Box sx={CARD_STYLES.header}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                {t('settings.mcpServer.tabs.assistant')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                AI 智能助手可以在对话中直接管理应用设置，敏感操作需要用户确认
              </Typography>
            </Box>
            <Divider />
            {assistantTemplates.length > 0 ? (
              <List disablePadding>
                {assistantTemplates.map((tpl, i) => renderServerListItem(tpl, i, assistantTemplates.length))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <BotIcon size={40} style={{ color: '#8b5cf6', marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  暂无智能助手工具
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Scrollbar>

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
