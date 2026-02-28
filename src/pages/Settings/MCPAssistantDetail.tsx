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
  ListItemIcon,
  Chip,
  alpha,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Badge
} from '@mui/material';
import CustomSwitch from '../../components/CustomSwitch';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft as ArrowBackIcon,
  Bot as BotIcon,
  Eye as ReadIcon,
  Pencil as WriteIcon,
  ShieldAlert as ConfirmIcon,
  Navigation as NavIcon,
  ChevronDown as ExpandMoreIcon,
  Search as SearchIcon,
  X as ClearIcon
} from 'lucide-react';

import type { MCPServer, MCPTool } from '../../shared/types';
import { mcpService } from '../../shared/services/mcp';
import { useTranslation } from '../../i18n';
import { SafeAreaContainer, CARD_STYLES } from '../../components/settings/SettingComponents';
import Scrollbar from '../../components/Scrollbar';

/** 权限级别对应的颜色和标签 */
const PERMISSION_CONFIG: Record<string, { color: string; label: string; labelEn: string }> = {
  read:    { color: '#4CAF50', label: '只读',   labelEn: 'Read' },
  write:   { color: '#ff9800', label: '写入',   labelEn: 'Write' },
  confirm: { color: '#f44336', label: '需确认', labelEn: 'Confirm' },
  navigate:{ color: '#2196f3', label: '导航',   labelEn: 'Navigate' }
};

/** 从工具名推断权限级别（回退用，正常情况服务端会提供） */
function inferPermission(toolName: string): string {
  if (toolName.startsWith('delete_') || toolName.startsWith('create_') || toolName.startsWith('add_')) return 'confirm';
  if (toolName.startsWith('update_')) return 'write';
  if (toolName.startsWith('list_') || toolName.startsWith('get_') || toolName.startsWith('search_')) return 'read';
  return 'read';
}

/** 从工具名推断所属领域 */
function inferDomain(toolName: string): string {
  if (toolName.includes('knowledge') || toolName.includes('document')) return 'knowledge';
  if (toolName.includes('appearance') || toolName.includes('theme')) return 'appearance';
  if (toolName.includes('provider') || toolName.includes('model')) return 'providers';
  return 'general';
}

const DOMAIN_LABELS: Record<string, { zh: string; en: string }> = {
  knowledge:  { zh: '知识库管理', en: 'Knowledge Base' },
  appearance: { zh: '外观设置',   en: 'Appearance' },
  providers:  { zh: '模型管理',   en: 'Model Providers' },
  general:    { zh: '通用工具',   en: 'General Tools' }
};

const MCPAssistantDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { serverId } = useParams<{ serverId: string }>();
  const location = useLocation();
  const [server, setServer] = useState<MCPServer | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const initServer = async () => {
      if (location.state?.server) {
        setServer(location.state.server);
        loadTools(location.state.server);
      } else if (serverId) {
        const foundServer = await mcpService.getServerByIdAsync(serverId);
        if (foundServer) {
          setServer(foundServer);
          loadTools(foundServer);
        }
      }
    };
    initServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, location.state]);

  const loadTools = async (serverData: MCPServer) => {
    if (!serverData.isActive) return;
    setLoading(true);
    try {
      const toolsList = await mcpService.listTools(serverData);
      setTools(toolsList);
    } catch (error) {
      console.error('加载工具列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/settings/mcp-server');
  };

  const handleToggleActive = async (isActive: boolean) => {
    if (!server) return;
    try {
      await mcpService.toggleServer(server.id, isActive);
      const updated = { ...server, isActive };
      setServer(updated);
      if (isActive) {
        await loadTools(updated);
      } else {
        setTools([]);
      }
      setSnackbar({
        open: true,
        message: isActive ? t('settings.mcpServer.messages.serverEnabled') : t('settings.mcpServer.messages.serverDisabled'),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({ open: true, message: t('settings.mcpServer.messages.operationFailed'), severity: 'error' });
    }
  };

  const isToolDisabled = (toolName: string): boolean => {
    return server?.disabledTools?.includes(toolName) ?? false;
  };

  const handleToggleTool = async (toolName: string, enabled: boolean) => {
    if (!server) return;
    try {
      const currentDisabled = server.disabledTools || [];
      const newDisabled = enabled
        ? currentDisabled.filter(t => t !== toolName)
        : [...currentDisabled, toolName];

      const updated = { ...server, disabledTools: newDisabled };
      await mcpService.updateServer(updated);
      setServer(updated);
    } catch (error) {
      setSnackbar({ open: true, message: t('settings.mcpServer.messages.saveFailed'), severity: 'error' });
    }
  };

  // 搜索过滤
  const filteredTools = searchQuery.trim()
    ? tools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tools;

  // 按领域分组工具
  const groupedTools = filteredTools.reduce<Record<string, MCPTool[]>>((acc, tool) => {
    const domain = inferDomain(tool.name);
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(tool);
    return acc;
  }, {});

  // 初始化时展开所有分组
  useEffect(() => {
    if (tools.length > 0 && Object.keys(expandedDomains).length === 0) {
      const initial: Record<string, boolean> = {};
      for (const tool of tools) {
        initial[inferDomain(tool.name)] = true;
      }
      setExpandedDomains(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tools]);

  // 搜索时自动展开所有匹配分组
  useEffect(() => {
    if (searchQuery.trim()) {
      const allExpanded: Record<string, boolean> = {};
      Object.keys(groupedTools).forEach(d => { allExpanded[d] = true; });
      setExpandedDomains(allExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleToggleDomain = (domain: string) => {
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'read': return <ReadIcon size={16} />;
      case 'write': return <WriteIcon size={16} />;
      case 'confirm': return <ConfirmIcon size={16} />;
      case 'navigate': return <NavIcon size={16} />;
      default: return <ReadIcon size={16} />;
    }
  };

  if (!server) {
    return (
      <SafeAreaContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </SafeAreaContainer>
    );
  }

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
            sx={{ color: (theme) => theme.palette.primary.main }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {server.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Scrollbar
        style={{
          flexGrow: 1,
          padding: '16px',
          paddingBottom: 'var(--content-bottom-padding)',
        }}
      >
        {/* ─── 服务器信息卡片 ─── */}
        <Paper elevation={0} sx={CARD_STYLES.elevated}>
          <Box sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha('#8b5cf6', 0.12), color: '#8b5cf6'
            }}>
              <BotIcon size={24} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>{server.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                {server.description}
              </Typography>
            </Box>
            <CustomSwitch checked={server.isActive} onChange={(e) => handleToggleActive(e.target.checked)} />
          </Box>
        </Paper>

        {/* ─── 搜索栏 ─── */}
        {server.isActive && tools.length > 0 && (
          <TextField
            fullWidth
            size="small"
            placeholder="搜索工具名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={18} style={{ opacity: 0.5 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
        )}

        {/* ─── 工具列表（按领域可折叠分组） ─── */}
        {!server.isActive ? (
          <Paper elevation={0} sx={{ ...CARD_STYLES.elevated, mt: 2 }}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                启用服务器后可查看和管理工具
              </Typography>
            </Box>
          </Paper>
        ) : loading ? (
          <Paper elevation={0} sx={{ ...CARD_STYLES.elevated, mt: 2 }}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress size={24} sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">加载工具列表...</Typography>
            </Box>
          </Paper>
        ) : Object.keys(groupedTools).length === 0 && searchQuery.trim() ? (
          <Paper elevation={0} sx={{ ...CARD_STYLES.elevated, mt: 2 }}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <SearchIcon size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <Typography variant="body2" color="text.secondary">
                没有找到匹配「{searchQuery}」的工具
              </Typography>
            </Box>
          </Paper>
        ) : (
          Object.entries(groupedTools).map(([domain, domainTools]) => {
            const enabledCount = domainTools.filter(t => !isToolDisabled(t.name)).length;
            return (
              <Accordion
                key={domain}
                expanded={expandedDomains[domain] ?? true}
                onChange={() => handleToggleDomain(domain)}
                disableGutters
                elevation={0}
                sx={{
                  mt: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': { margin: '16px 0 0 0' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon size={18} />}
                  sx={{
                    px: { xs: 2, sm: 2.5 },
                    minHeight: 56,
                    '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 }
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                    {DOMAIN_LABELS[domain]?.zh || domain}
                  </Typography>
                  <Badge
                    badgeContent={`${enabledCount}/${domainTools.length}`}
                    sx={{
                      '& .MuiBadge-badge': {
                        position: 'static',
                        transform: 'none',
                        fontSize: '0.7rem',
                        height: 20,
                        minWidth: 36,
                        borderRadius: 10,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main'
                      }
                    }}
                  />
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Divider />
                  <List disablePadding>
                    {domainTools.map((tool, index) => {
                      const permission = inferPermission(tool.name);
                      const permConfig = PERMISSION_CONFIG[permission] || PERMISSION_CONFIG['read'];
                      const disabled = isToolDisabled(tool.name);

                      return (
                        <React.Fragment key={tool.name}>
                          <ListItem sx={{
                            py: 1.5,
                            px: { xs: 2, sm: 2.5 },
                            opacity: disabled ? 0.5 : 1,
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) }
                          }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Box sx={{ color: permConfig.color }}>
                                {getPermissionIcon(permission)}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem' }, fontFamily: 'monospace' }}>
                                    {tool.name}
                                  </Typography>
                                  <Chip
                                    label={permConfig.label}
                                    size="small"
                                    sx={{
                                      height: 20, fontSize: '0.65rem', fontWeight: 600,
                                      bgcolor: alpha(permConfig.color, 0.1),
                                      color: permConfig.color,
                                      border: `1px solid ${alpha(permConfig.color, 0.3)}`
                                    }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary" component="div"
                                  sx={{
                                    mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.8rem' }, lineHeight: 1.4,
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                  }}
                                >
                                  {tool.description || '无描述'}
                                </Typography>
                              }
                              secondaryTypographyProps={{ component: 'div' }}
                            />
                            <CustomSwitch
                              checked={!disabled}
                              onChange={(e) => handleToggleTool(tool.name, e.target.checked)}
                            />
                          </ListItem>
                          {index < domainTools.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                </AccordionDetails>
              </Accordion>
            );
          })
        )}

        {/* ─── 权限说明 ─── */}
        <Paper elevation={0} sx={{ ...CARD_STYLES.elevated, mt: 2 }}>
          <Box sx={CARD_STYLES.header}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              权限说明
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Object.entries(PERMISSION_CONFIG).map(([key, config]) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: config.color, display: 'flex', alignItems: 'center' }}>
                  {getPermissionIcon(key)}
                </Box>
                <Chip label={config.label} size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: alpha(config.color, 0.1), color: config.color }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {key === 'read' && '只读取数据，不修改任何内容'}
                  {key === 'write' && '可修改数据，但不涉及创建或删除'}
                  {key === 'confirm' && '敏感操作（创建/删除），执行前需要用户确认'}
                  {key === 'navigate' && '页面跳转操作'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Scrollbar>

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

export default MCPAssistantDetail;
