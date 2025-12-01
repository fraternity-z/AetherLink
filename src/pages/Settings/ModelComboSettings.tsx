import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  alpha,
  useMediaQuery,
  useTheme
} from '@mui/material';
import BackButtonDialog from '../../components/common/BackButtonDialog';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Bot,
  Wand2,
  ArrowLeftRight,
  GitBranch,
  ArrowRight
} from 'lucide-react';

import { modelComboService } from '../../shared/services/ModelComboService';
import type { ModelComboConfig, ModelComboTemplate, ModelComboStrategy } from '../../shared/types/ModelCombo';
import { useModelComboSync } from '../../shared/hooks/useModelComboSync';
import { useTranslation } from 'react-i18next';
import useScrollPosition from '../../hooks/useScrollPosition';
import { SafeAreaContainer } from '../../components/settings/SettingComponents';

const ModelComboSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // 小于960px为移动端
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm')); // 小于600px为小屏手机

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-model-combo', {
    autoRestore: true,
    restoreDelay: 0
  });

  const [combos, setCombos] = useState<ModelComboConfig[]>([]);
  const [templates, setTemplates] = useState<ModelComboTemplate[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [comboToDelete, setComboToDelete] = useState<ModelComboConfig | null>(null);
  const location = useLocation();

  // 使用同步Hook来自动同步模型组合到Redux store
  const { syncModelCombos } = useModelComboSync();

  // 加载数据，当从编辑页面返回时也会刷新
  useEffect(() => {
    loadData();
  }, [location.key]);

  const loadData = async () => {
    try {
      const [combosData, templatesData] = await Promise.all([
        modelComboService.getAllCombos(),
        Promise.resolve(modelComboService.getTemplates())
      ]);
      setCombos(combosData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('加载模型组合数据失败:', error);
    }
  };

  const handleBack = () => {
    navigate('/settings');
  };

  const handleCreateCombo = () => {
    navigate('/settings/model-combo/new');
  };

  const handleEditCombo = (combo: ModelComboConfig) => {
    navigate(`/settings/model-combo/${combo.id}`);
  };

  const handleDeleteCombo = (combo: ModelComboConfig) => {
    setComboToDelete(combo);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (comboToDelete) {
      try {
        await modelComboService.deleteCombo(comboToDelete.id);
        await loadData();
        await syncModelCombos();
        setDeleteDialogOpen(false);
        setComboToDelete(null);
      } catch (error) {
        console.error('删除模型组合失败:', error);
      }
    }
  };

  const handleCreateFromTemplate = async (template: ModelComboTemplate) => {
    try {
      const comboData = {
        ...template.template,
        name: template.name,
        description: template.description
      };
      await modelComboService.createCombo(comboData);
      await loadData();
      // 触发同步到Redux store
      await syncModelCombos();
    } catch (error) {
      console.error('从模板创建模型组合失败:', error);
    }
  };

  const getStrategyIcon = (strategy: ModelComboStrategy) => {
    switch (strategy) {
      case 'routing': return <Bot size={20} />;
      case 'ensemble': return <GitBranch size={20} />;
      case 'comparison': return <ArrowLeftRight size={20} />;
      case 'cascade': return <Wand2 size={20} />;
      case 'sequential': return <ArrowRight size={20} />;
      default: return <Bot size={20} />;
    }
  };

  const getStrategyLabel = (strategy: ModelComboStrategy) => {
    switch (strategy) {
      case 'routing': return t('modelSettings.combo.strategy.routing');
      case 'ensemble': return t('modelSettings.combo.strategy.ensemble');
      case 'comparison': return t('modelSettings.combo.strategy.comparison');
      case 'cascade': return t('modelSettings.combo.strategy.cascade');
      case 'sequential': return t('modelSettings.combo.strategy.sequential');
      default: return strategy;
    }
  };

  const getStrategyColor = (strategy: ModelComboStrategy) => {
    switch (strategy) {
      case 'routing': return '#2196f3';
      case 'ensemble': return '#4caf50';
      case 'comparison': return '#ff9800';
      case 'cascade': return '#9c27b0';
      case 'sequential': return '#f44336';
      default: return '#757575';
    }
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
            onClick={handleBack}
            aria-label="back"
            sx={{ color: (theme) => theme.palette.primary.main }}
          >
            <ArrowLeft size={24} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
              }}
            >
            {t('modelSettings.combo.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          px: isMobile ? 1 : 2,
          py: isMobile ? 1 : 2,
          pb: 'var(--content-bottom-padding)',
        }}
      >
        {/* 预设模板区域 */}
        {templates.length > 0 && (
          <Box sx={{ mb: isMobile ? 2 : 4 }}>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              sx={{
                mb: isMobile ? 1 : 2,
                fontWeight: 600,
                fontSize: isMobile ? '1.1rem' : undefined
              }}
            >
              {t('modelSettings.combo.presetTemplates')}
            </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: isSmallMobile ? '1fr' : 'repeat(2, 1fr)',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: isMobile ? 1 : 2
            }}>
              {templates.map((template) => (
                <Box key={template.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: isMobile ? 'none' : 'translateY(-2px)',
                        boxShadow: isMobile ? 1 : 2,
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <CardContent sx={{
                      flexGrow: 1,
                      p: isMobile ? 1.5 : 2,
                      '&:last-child': { pb: isMobile ? 1.5 : 2 }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 0.5 : 1 }}>
                        <Box sx={{
                          mr: 1,
                          fontSize: isMobile ? '1.2rem' : '1.5rem'
                        }}>
                          {template.icon}
                        </Box>
                        <Typography
                          variant={isMobile ? "subtitle1" : "h6"}
                          component="div"
                          sx={{
                            fontWeight: 600,
                            fontSize: isMobile ? '1rem' : undefined
                          }}
                        >
                          {template.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: isMobile ? 1 : 2,
                          fontSize: isMobile ? '0.8rem' : undefined,
                          lineHeight: isMobile ? 1.3 : undefined
                        }}
                      >
                        {template.description}
                      </Typography>
                      <Chip
                        icon={getStrategyIcon(template.strategy)}
                        label={getStrategyLabel(template.strategy)}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStrategyColor(template.strategy), 0.1),
                          color: getStrategyColor(template.strategy),
                          fontSize: isMobile ? '0.7rem' : undefined,
                          height: isMobile ? 24 : undefined,
                          '& .MuiChip-icon': {
                            fontSize: isMobile ? '0.9rem' : undefined
                          }
                        }}
                      />
                    </CardContent>
                    <CardActions sx={{
                      p: isMobile ? 1 : 2,
                      pt: 0
                    }}>
                      <Button
                        size={isMobile ? "small" : "small"}
                        startIcon={<Plus size={16} />}
                        onClick={() => handleCreateFromTemplate(template)}
                        sx={{
                          ml: 'auto',
                          fontSize: isMobile ? '0.75rem' : undefined,
                          px: isMobile ? 1 : undefined
                        }}
                      >
                        {t('modelSettings.combo.useTemplate')}
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* 我的组合区域 */}
        <Box>
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{
              mb: isMobile ? 1 : 2,
              fontWeight: 600,
              fontSize: isMobile ? '1.1rem' : undefined
            }}
          >
            {t('modelSettings.combo.myCombos')}
          </Typography>

          {combos.length === 0 ? (
            <Paper
              sx={{
                p: isMobile ? 2 : 4,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
              }}
            >
              <Bot
                size={isMobile ? 36 : 48}
                color="currentColor"
                style={{
                  color: 'var(--mui-palette-text-secondary)',
                  marginBottom: isMobile ? 8 : 16
                }}
              />
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                color="text.secondary"
                gutterBottom
                sx={{ fontSize: isMobile ? '1rem' : undefined }}
              >
                {t('modelSettings.combo.noComboYet')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: isMobile ? 2 : 3,
                  fontSize: isMobile ? '0.8rem' : undefined
                }}
              >
                {t('modelSettings.combo.createComboDesc')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={handleCreateCombo}
                size={isMobile ? "small" : "medium"}
                sx={{ fontSize: isMobile ? '0.8rem' : undefined }}
              >
                {t('modelSettings.combo.createFirst')}
              </Button>
            </Paper>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: isSmallMobile ? '1fr' : 'repeat(2, 1fr)',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: isMobile ? 1 : 2
            }}>
              {combos.map((combo) => (
                <Box key={combo.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid',
                      borderColor: combo.enabled ? 'success.main' : 'divider',
                      opacity: combo.enabled ? 1 : 0.7,
                    }}
                  >
                    <CardContent sx={{
                      flexGrow: 1,
                      p: isMobile ? 1.5 : 2,
                      '&:last-child': { pb: isMobile ? 1.5 : 2 }
                    }}>
                      <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        component="div"
                        sx={{
                          fontWeight: 600,
                          mb: isMobile ? 0.5 : 1,
                          fontSize: isMobile ? '1rem' : undefined
                        }}
                      >
                        {combo.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: isMobile ? 1 : 2,
                          fontSize: isMobile ? '0.8rem' : undefined,
                          lineHeight: isMobile ? 1.3 : undefined
                        }}
                      >
                        {combo.description}
                      </Typography>
                      <Chip
                        icon={getStrategyIcon(combo.strategy)}
                        label={getStrategyLabel(combo.strategy)}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStrategyColor(combo.strategy), 0.1),
                          color: getStrategyColor(combo.strategy),
                          mb: isMobile ? 0.5 : 1,
                          fontSize: isMobile ? '0.7rem' : undefined,
                          height: isMobile ? 24 : undefined,
                          '& .MuiChip-icon': {
                            fontSize: isMobile ? '0.9rem' : undefined
                          }
                        }}
                      />
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? '0.7rem' : undefined }}
                      >
                        {t('modelSettings.combo.modelCount', { count: combo.models.length })}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{
                      p: isMobile ? 1.5 : 2,
                      pt: 0,
                      justifyContent: 'flex-end',
                      gap: 1
                    }}>
                      <IconButton
                        size="medium"
                        onClick={() => handleEditCombo(combo)}
                        color="primary"
                        sx={{
                          bgcolor: 'action.hover',
                          '&:hover': { bgcolor: 'primary.main', color: 'white' }
                        }}
                      >
                        <Edit size={isMobile ? 18 : 22} />
                      </IconButton>
                      <IconButton
                        size="medium"
                        onClick={() => handleDeleteCombo(combo)}
                        color="error"
                        sx={{
                          bgcolor: 'action.hover',
                          '&:hover': { bgcolor: 'error.main', color: 'white' }
                        }}
                      >
                        <Trash2 size={isMobile ? 18 : 22} />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* 浮动添加按钮 */}
      <Fab
        color="primary"
        aria-label="add"
        size={isMobile ? "medium" : "large"}
        sx={{
          position: 'fixed',
          bottom: `calc(${isMobile ? 12 : 16}px + var(--safe-area-bottom-computed, 0px))`,
          right: isMobile ? 12 : 16,
          width: isMobile ? 48 : undefined,
          height: isMobile ? 48 : undefined
        }}
        onClick={handleCreateCombo}
      >
        <Plus size={isMobile ? 20 : 24} />
      </Fab>

      {/* 删除确认对话框 */}
      <BackButtonDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('modelSettings.combo.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('modelSettings.combo.deleteMessage', { name: comboToDelete?.name || '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </BackButtonDialog>
    </SafeAreaContainer>
  );
};

export default ModelComboSettings;
