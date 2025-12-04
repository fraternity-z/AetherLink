import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Paper,
  ListSubheader,
  alpha,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  useTheme as useMuiTheme,
} from '@mui/material';
import BackButtonDialog from '../../components/common/BackButtonDialog';
import { ArrowLeft as ArrowBackIcon, Plus as AddIcon, ChevronRight as ChevronRightIcon, Settings as SettingsIcon, Trash2 as DeleteIcon, X as CloseIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../shared/store';
import { setModelSelectorStyle, reorderProviders, updateProvider, deleteProvider } from '../../shared/store/settingsSlice';
import type { ModelProvider } from '../../shared/config/defaultModels';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { reorderArray } from '../../shared/utils/dragUtils';
import { Bot as SmartToyIcon, AlignLeft as FormattedAlignLeftIcon, List as ViewAgendaIcon, GripVertical as DragIndicatorIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useScrollPosition from '../../hooks/useScrollPosition';
import { getProviderIcon } from '../../shared/utils/providerIcons';
import { SafeAreaContainer } from '../../components/settings/SettingComponents';

/**
 * 默认模型设置组件
 */
const DefaultModelSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const muiTheme = useMuiTheme();
  const providers = useAppSelector(state => state.settings.providers);
  const modelSelectorStyle = useAppSelector(state => state.settings.modelSelectorStyle);
  const [isDragging, setIsDragging] = useState(false);
  
  // 获取当前主题模式
  const isDark = muiTheme.palette.mode === 'dark';

  // 使用滚动位置保存功能
  const {
    containerRef,
    handleScroll
  } = useScrollPosition('settings-default-model-list', {
    autoRestore: true,
    restoreDelay: 0
  });

  // 编辑供应商弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(null);
  const [editProviderName, setEditProviderName] = useState('');
  const [editProviderType, setEditProviderType] = useState('');

  // 多选删除状态
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleBack = () => {
    navigate('/settings');
  };

  const handleAddProvider = () => {
    navigate('/settings/add-provider');
  };

  const handleProviderClick = (providerId: string) => {
    if (!isDragging) {
      navigate(`/settings/model-provider/${providerId}`);
    }
  };

  const toggleModelSelectorStyle = () => {
    // 切换选择器样式
    const newStyle = modelSelectorStyle === 'dialog' ? 'dropdown' : 'dialog';
    dispatch(setModelSelectorStyle(newStyle));
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);

    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    const reorderedProviders = reorderArray(providers, sourceIndex, destinationIndex);
    dispatch(reorderProviders(reorderedProviders));
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  // 编辑供应商相关函数
  const handleEditProvider = (provider: ModelProvider, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡，避免触发provider点击
    setEditingProvider(provider);
    setEditProviderName(provider.name);
    setEditProviderType(provider.providerType || '');
    setEditDialogOpen(true);
  };

  const handleSaveProvider = () => {
    if (editingProvider && editProviderName.trim()) {
      dispatch(updateProvider({
        id: editingProvider.id,
        updates: {
          name: editProviderName.trim(),
          providerType: editProviderType
        }
      }));
      handleCloseEditDialog();
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingProvider(null);
    setEditProviderName('');
    setEditProviderType('');
  };

  // 多选删除相关函数
  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedProviders(new Set());
  };

  const handleToggleProvider = (providerId: string) => {
    const newSelected = new Set(selectedProviders);
    if (newSelected.has(providerId)) {
      newSelected.delete(providerId);
    } else {
      newSelected.add(providerId);
    }
    setSelectedProviders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProviders.size === providers.length) {
      setSelectedProviders(new Set());
    } else {
      setSelectedProviders(new Set(providers.map(p => p.id)));
    }
  };

  const handleDeleteSelected = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    selectedProviders.forEach(providerId => {
      dispatch(deleteProvider(providerId));
    });
    setSelectedProviders(new Set());
    setIsMultiSelectMode(false);
    setDeleteConfirmOpen(false);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
  };

  // 供应商类型选项
  const providerTypeOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'openai-response', label: 'OpenAI (Responses API)' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'zhipu', label: '智谱AI' },
    { value: 'google', label: 'Google' },
    { value: 'azure-openai', label: 'Azure OpenAI' },
    { value: 'siliconflow', label: 'SiliconFlow' },
    { value: 'volcengine', label: '火山引擎' },
    { value: 'grok', label: 'Grok' },
    { value: 'custom', label: '自定义' }
  ];

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
            {t('modelSettings.modelList.title')}
          </Typography>
          {isMultiSelectMode ? (
            <>
              <Button
                startIcon={<CloseIcon />}
                onClick={handleToggleMultiSelect}
                sx={{
                  mr: 1,
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.1),
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.2),
                  },
                  borderRadius: 2,
                }}
              >
                {t('modelSettings.modelList.cancel')}
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                disabled={selectedProviders.size === 0}
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
                  },
                  '&:disabled': {
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.05),
                    color: 'text.disabled',
                  },
                  borderRadius: 2,
                }}
              >
                {t('modelSettings.modelList.deleteCount', { count: selectedProviders.size })}
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleToggleMultiSelect}
                sx={{
                  mr: 1,
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
                  },
                  borderRadius: 2,
                }}
              >
                {t('modelSettings.modelList.batchDelete')}
              </Button>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddProvider}
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                  },
                  borderRadius: 2,
                }}
              >
                {t('modelSettings.modelList.add')}
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Box
        ref={containerRef}
        onScroll={handleScroll}
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
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {t('modelSettings.modelList.providers')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isMultiSelectMode ? t('modelSettings.modelList.selectToDelete') : t('modelSettings.modelList.providersDesc')}
              </Typography>
            </Box>
            {isMultiSelectMode && (
              <Button
                size="small"
                onClick={handleSelectAll}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                {selectedProviders.size === providers.length ? t('modelSettings.modelList.unselectAll') : t('modelSettings.modelList.selectAll')}
              </Button>
            )}
          </Box>

          <Divider />

          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable droppableId="providers-list" isDropDisabled={isMultiSelectMode}>
              {(provided) => (
                <List
                  disablePadding
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {providers.map((provider, index) => (
                    <Draggable
                      key={provider.id}
                      draggableId={provider.id}
                      index={index}
                      isDragDisabled={isMultiSelectMode}
                    >
                      {(provided, snapshot) => (
                        <ListItemButton
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          onClick={() => isMultiSelectMode ? handleToggleProvider(provider.id) : handleProviderClick(provider.id)}
                          sx={{
                            transition: 'all 0.2s',
                            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
                            bgcolor: snapshot.isDragging ? 'background.paper' : selectedProviders.has(provider.id) ? (theme) => alpha(theme.palette.primary.main, 0.08) : 'transparent',
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                            },
                            ...provided.draggableProps.style,
                          }}
                        >
                          {isMultiSelectMode ? (
                            <Checkbox
                              checked={selectedProviders.has(provider.id)}
                              onChange={() => handleToggleProvider(provider.id)}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ mr: 1 }}
                            />
                          ) : (
                            <Box
                              {...provided.dragHandleProps}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mr: 1,
                                cursor: 'grab',
                                '&:active': {
                                  cursor: 'grabbing',
                                },
                                opacity: 0.6,
                                '&:hover': {
                                  opacity: 1,
                                }
                              }}
                            >
                              <DragIndicatorIcon fontSize="small" />
                            </Box>
                          )}
                          <ListItemAvatar>
                            <Avatar
                              src={getProviderIcon(provider.providerType || provider.id, isDark)}
                              alt={provider.name}
                              sx={{
                                bgcolor: 'transparent',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                              }}
                            >
                              {provider.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {provider.name}
                              </Typography>
                            }
                            secondary={
                              <span style={{ display: 'flex', alignItems: 'center' }}>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  sx={{
                                    mr: 1,
                                    color: provider.isEnabled ? 'success.main' : 'text.disabled',
                                    fontWeight: 500
                                  }}
                                >
                                  {provider.isEnabled ? t('modelSettings.modelList.enabled') : t('modelSettings.modelList.disabled')}
                                </Typography>
                                {provider.models.length > 0 && (
                                  <Typography component="span" variant="body2" color="text.secondary">
                                    {t('modelSettings.modelList.modelCount', { count: provider.models.length })}
                                  </Typography>
                                )}
                              </span>
                            }
                          />
                          {!isMultiSelectMode && (
                            <>
                              <IconButton
                                size="small"
                                onClick={(e) => handleEditProvider(provider, e)}
                                sx={{
                                  mr: 1,
                                  color: 'text.secondary',
                                  '&:hover': {
                                    color: 'primary.main',
                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                  },
                                }}
                              >
                                <SettingsIcon size={16} />
                              </IconButton>
                              <ChevronRightIcon size={20} style={{ color: 'rgba(79, 70, 229, 0.5)' }} />
                            </>
                          )}
                        </ListItemButton>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <List
            subheader={
              <ListSubheader
                component="div"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.01)',
                  py: 1,
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                {t('modelSettings.modelList.recommendedActions')}
              </ListSubheader>
            }
          >
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/settings/assistant-model')}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#4f46e5', 0.12),
                    color: '#4f46e5',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <SmartToyIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('modelSettings.modelList.topicNamingSettings')}</Typography>}
                  secondary={t('modelSettings.modelList.topicNamingSettingsDesc')}
                  primaryTypographyProps={{ component: 'div' }}
                />
                <ChevronRightIcon size={20} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              </ListItemButton>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            <ListItem disablePadding>
              <ListItemButton
                onClick={toggleModelSelectorStyle}
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
                    {modelSelectorStyle === 'dialog' ? <ViewAgendaIcon /> : <FormattedAlignLeftIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('modelSettings.modelList.modelSelectorStyle')}</Typography>}
                  secondary={modelSelectorStyle === 'dialog' ? t('modelSettings.modelList.modelSelectorDialog') : t('modelSettings.modelList.modelSelectorDropdown')}
                  primaryTypographyProps={{ component: 'div' }}
                />
              </ListItemButton>
            </ListItem>

            <Divider variant="inset" component="li" sx={{ ml: 0 }} />

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/settings/add-provider')}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: alpha('#9333ea', 0.12),
                    color: '#9333ea',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <AddIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{t('modelSettings.modelList.addProvider')}</Typography>}
                  secondary={t('modelSettings.modelList.addProviderDesc')}
                  primaryTypographyProps={{ component: 'div' }}
                />
                <ChevronRightIcon size={20} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Paper>
      </Box>

      {/* 编辑供应商弹窗 */}
      <BackButtonDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 600,
        }}>
          {t('modelSettings.modelList.editProvider')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label={t('modelSettings.modelList.providerName')}
            placeholder={t('modelSettings.modelList.providerNamePlaceholder')}
            type="text"
            fullWidth
            variant="outlined"
            value={editProviderName}
            onChange={(e) => setEditProviderName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>{t('modelSettings.modelList.providerType')}</InputLabel>
            <Select
              value={editProviderType}
              onChange={(e) => setEditProviderType(e.target.value)}
              label={t('modelSettings.modelList.providerType')}
            >
              {providerTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditDialog}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSaveProvider}
            disabled={!editProviderName.trim()}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
              },
              borderRadius: 2,
            }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </BackButtonDialog>

      {/* 删除确认对话框 */}
      <BackButtonDialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: 'error.main',
        }}>
          {t('modelSettings.modelList.confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }} dangerouslySetInnerHTML={{
            __html: t('modelSettings.modelList.deleteConfirmMessage', { count: selectedProviders.size })
          }} />
          <Typography variant="body2" color="text.secondary">
            {t('modelSettings.modelList.deleteConfirmWarning')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelDelete}>{t('common.cancel')}</Button>
          <Button
            onClick={handleConfirmDelete}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
              color: 'error.main',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
              },
              borderRadius: 2,
            }}
          >
            {t('modelSettings.modelList.confirmDeleteButton')}
          </Button>
        </DialogActions>
      </BackButtonDialog>
    </SafeAreaContainer>
  );
};

export default DefaultModelSettings;