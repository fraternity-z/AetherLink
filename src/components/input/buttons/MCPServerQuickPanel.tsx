import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import BackButtonDialog from '../../common/BackButtonDialog';
import { ArrowLeft, Plug, Server, Wifi, Cpu, Terminal, Cog, Settings, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../shared/store';
import type { MCPServer, MCPServerType } from '../../../shared/types';
import type { Skill } from '../../../shared/types/Skill';
import { mcpService } from '../../../shared/services/mcp';
import { SkillManager } from '../../../shared/services/skills/SkillManager';
import { updateAssistant } from '../../../shared/store/slices/assistantsSlice';
import { dexieStorage } from '../../../shared/services/storage/DexieStorageService';
import CustomSwitch from '../../CustomSwitch';
import { useMCPServerStateManager } from '../../../hooks/useMCPServerStateManager';
import { getStorageItem, setStorageItem } from '../../../shared/utils/storage';

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
  const dispatch = useDispatch();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loadingServers, setLoadingServers] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Tab 状态：0=MCP工具, 1=技能
  const [activeTab, setActiveTab] = useState(0);
  const TAB_COUNT = 2;

  // 移动端滑动切换 Tab
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // 水平滑动 > 50px 且水平距离大于垂直距离（避免与滚动冲突）
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        setActiveTab(prev => Math.min(prev + 1, TAB_COUNT - 1));
      } else {
        setActiveTab(prev => Math.max(prev - 1, 0));
      }
    }
  }, []);

  // 技能相关状态
  const currentAssistant = useSelector((state: RootState) => state.assistants.currentAssistant);
  const [allEnabledSkills, setAllEnabledSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // 技能独立开关
  const [skillsEnabled, setSkillsEnabledState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skills-enabled') || 'false'); }
    catch { return false; }
  });
  useEffect(() => {
    if (open) {
      try { setSkillsEnabledState(JSON.parse(localStorage.getItem('skills-enabled') || 'false')); }
      catch { setSkillsEnabledState(false); }
    }
  }, [open]);
  const handleSkillsEnabledChange = useCallback(async (enabled: boolean) => {
    if (!enabled && currentAssistant) {
      // 关闭时：保存当前绑定的技能 ID，然后清空
      const currentSkillIds = currentAssistant.skillIds || [];
      if (currentSkillIds.length > 0) {
        localStorage.setItem('skills-saved-ids', JSON.stringify(currentSkillIds));
        const updated = { ...currentAssistant, skillIds: [] };
        dispatch(updateAssistant(updated));
        try { await dexieStorage.saveAssistant(updated); } catch (e) { console.error('[Skills] 保存失败:', e); }
        console.log(`[Skills] 开关关闭，已保存 ${currentSkillIds.length} 个技能绑定`);
      }
    } else if (enabled && currentAssistant) {
      // 开启时：恢复之前保存的技能绑定
      try {
        const saved = JSON.parse(localStorage.getItem('skills-saved-ids') || '[]') as string[];
        if (saved.length > 0) {
          const updated = { ...currentAssistant, skillIds: saved };
          dispatch(updateAssistant(updated));
          await dexieStorage.saveAssistant(updated);
          localStorage.removeItem('skills-saved-ids');
          console.log(`[Skills] 开关开启，已恢复 ${saved.length} 个技能绑定`);
        }
      } catch (e) { console.error('[Skills] 恢复失败:', e); }
    }
    setSkillsEnabledState(enabled);
    localStorage.setItem('skills-enabled', JSON.stringify(enabled));
    window.dispatchEvent(new Event('skills-enabled-changed'));
  }, [currentAssistant, dispatch]);

  // 🔌 桥梁模式状态（本地管理，存储到 IndexedDB）
  const [bridgeMode, setBridgeModeState] = useState(false);

  useEffect(() => {
    if (open) {
      getStorageItem<boolean>('mcp-bridge-mode').then(val => {
        setBridgeModeState(val ?? false);
      });
    }
  }, [open]);

  // 加载所有已启用的技能
  const loadAllEnabledSkills = useCallback(async () => {
    setSkillsLoading(true);
    try {
      const skills = await SkillManager.getEnabledSkills();
      setAllEnabledSkills(skills);
    } catch (error) {
      console.error('[MCPPanel] 加载技能失败:', error);
      setAllEnabledSkills([]);
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && activeTab === 1) {
      loadAllEnabledSkills();
    }
  }, [open, activeTab, loadAllEnabledSkills]);

  // 切换技能绑定状态
  const handleToggleSkillBinding = useCallback(async (skillId: string, bind: boolean) => {
    if (!currentAssistant) return;
    const currentSkillIds = currentAssistant.skillIds || [];
    const newSkillIds = bind
      ? [...currentSkillIds, skillId]
      : currentSkillIds.filter(id => id !== skillId);

    const updated = { ...currentAssistant, skillIds: newSkillIds };
    dispatch(updateAssistant(updated));
    try {
      await dexieStorage.saveAssistant(updated);
    } catch (err) {
      console.error('[MCPPanel] 保存技能绑定失败:', err);
    }
  }, [currentAssistant, dispatch]);

  // 当前助手绑定的技能 ID
  const boundSkillIds = useMemo(() => new Set(currentAssistant?.skillIds || []), [currentAssistant?.skillIds]);
  const boundSkillCount = boundSkillIds.size;

  const handleBridgeModeChange = useCallback((enabled: boolean) => {
    setBridgeModeState(enabled);
    setStorageItem('mcp-bridge-mode', enabled);
  }, []);

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
    } catch (err) {
      console.error('切换服务器状态失败:', err);
      setError(`切换服务器状态失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoadingServers(prev => {
        const { [serverId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [loadServers]);

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
          {activeTab === 0 && hasActiveServers && (
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
          {activeTab === 1 && boundSkillCount > 0 && (
            <Chip
              label={`${boundSkillCount} 个已绑定`}
              size="small"
              sx={{
                mr: 1,
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 500,
                bgcolor: isDark ? alpha('#f59e0b', 0.15) : '#fef3c7',
                color: isDark ? '#fbbf24' : '#92400e',
                border: `1px solid ${isDark ? alpha('#f59e0b', 0.3) : '#fde68a'}`,
              }}
            />
          )}
          {activeTab === 0 && onToolsEnabledChange && (
            <CustomSwitch
              checked={toolsEnabled}
              onChange={(e) => handleToolsEnabledChange(e.target.checked)}
            />
          )}
          {activeTab === 1 && (
            <CustomSwitch
              checked={skillsEnabled}
              onChange={(e) => handleSkillsEnabledChange(e.target.checked)}
            />
          )}
        </Toolbar>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            px: 2,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
            },
          }}
        >
          <Tab icon={<Plug size={15} />} iconPosition="start" label="工具" />
          <Tab icon={<Zap size={15} />} iconPosition="start" label="技能" />
        </Tabs>
      </AppBar>

      <DialogContent
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}
      >
        {/* ===== Tab 0: MCP 工具 ===== */}
        {activeTab === 0 && (
          <>
            {/* 桥梁模式开关 */}
            <Box sx={{
              mx: 2,
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: bridgeMode
                ? (isDark ? alpha('#8b5cf6', 0.1) : alpha('#8b5cf6', 0.06))
                : (isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02)),
              border: '1px solid',
              borderColor: bridgeMode
                ? (isDark ? alpha('#8b5cf6', 0.3) : alpha('#8b5cf6', 0.2))
                : 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: bridgeMode ? '#8b5cf6' : 'text.primary' }}>
                  🔌 桥梁模式
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                  {bridgeMode ? '已启用 — 1 个工具替代全部，按需动态调用' : '关闭 — 使用传统模式注入所有工具'}
                </Typography>
              </Box>
              <CustomSwitch
                checked={bridgeMode}
                onChange={(e) => handleBridgeModeChange(e.target.checked)}
              />
            </Box>

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
          </>
        )}

        {/* ===== Tab 1: 技能 ===== */}
        {activeTab === 1 && (
          <Box sx={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {skillsLoading ? (
              <List disablePadding>
                {[1, 2, 3].map((index) => (
                  <ListItem key={index} sx={{ px: 2, py: 1.5 }}>
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Skeleton variant="text" width="60%" height={22} />}
                      secondary={<Skeleton variant="text" width="80%" height={18} />}
                    />
                  </ListItem>
                ))}
              </List>
            ) : allEnabledSkills.length === 0 ? (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 4,
                color: 'text.secondary',
              }}>
                <Zap size={56} style={{ opacity: 0.3, marginBottom: 16 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                  还没有启用任何技能
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  在设置 → 技能管理中启用技能
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Settings size={16} />}
                  onClick={() => { onClose(); navigate('/settings/skills'); }}
                >
                  前往技能管理
                </Button>
              </Box>
            ) : (
              <List disablePadding>
                {allEnabledSkills.map((skill: Skill, index: number) => {
                  const isBound = boundSkillIds.has(skill.id);
                  return (
                    <React.Fragment key={skill.id}>
                      <ListItem
                        sx={{
                          px: 2,
                          py: 1.5,
                          opacity: isBound ? 1 : 0.6,
                          transition: 'opacity 0.2s',
                        }}
                        secondaryAction={
                          <CustomSwitch
                            checked={isBound}
                            onChange={(e) => handleToggleSkillBinding(skill.id, e.target.checked)}
                          />
                        }
                      >
                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <Avatar
                            sx={{
                              bgcolor: isBound
                                ? (isDark ? alpha('#f59e0b', 0.15) : alpha('#f59e0b', 0.1))
                                : (isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04)),
                              color: isBound
                                ? (isDark ? '#fbbf24' : '#d97706')
                                : 'text.disabled',
                              width: 36,
                              height: 36,
                              fontSize: '1.1rem',
                            }}
                          >
                            {skill.emoji || '🔧'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.925rem' }}>
                              {skill.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {skill.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < allEnabledSkills.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  );
                })}

                {/* 工作原理说明 */}
                <Box sx={{ mx: 2, my: 2, p: 1.5, borderRadius: 2, bgcolor: isDark ? alpha('#f59e0b', 0.06) : alpha('#f59e0b', 0.04), border: '1px solid', borderColor: isDark ? alpha('#f59e0b', 0.15) : alpha('#f59e0b', 0.1) }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    开关控制技能是否绑定到当前助手。绑定后 AI 会自动匹配并通过 <b>read_skill</b> 读取指令。
                  </Typography>
                </Box>
              </List>
            )}
          </Box>
        )}
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
          onClick={() => { onClose(); navigate(activeTab === 0 ? '/settings/mcp-server' : '/settings/skills'); }}
          sx={{
            background: activeTab === 0 ? '#10b981' : '#f59e0b',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2,
            py: 1.2,
            textTransform: 'none',
            '&:hover': { background: activeTab === 0 ? '#059669' : '#d97706' },
          }}
        >
          {activeTab === 0 ? '管理 MCP 服务器' : '管理技能'}
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
