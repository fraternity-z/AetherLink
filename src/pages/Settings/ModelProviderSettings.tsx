import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  FormControlLabel,
  CircularProgress,
  InputAdornment,
  Tooltip
} from '@mui/material';
import CustomSwitch from '../../components/CustomSwitch';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Zap,
  CheckCircle,
  Settings,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../shared/store';
import { alpha } from '@mui/material/styles';
import ModelManagementDialog from '../../components/ModelManagementDialog';
import SimpleModelDialog from '../../components/settings/SimpleModelDialog';
import ModelGroup from '../../components/settings/ModelGroup';
import {
  isOpenAIProvider,
  getCompleteApiUrl
} from './ModelProviderSettings/constants';
import {
  AddModelDialog,
  DeleteDialog,
  EditProviderDialog,
  CustomEndpointDialog,
  TestResultSnackbar,
  TestResultDialog
} from './ModelProviderSettings/dialogs';
import { useProviderSettings } from './ModelProviderSettings/hooks';
import { useTranslation } from 'react-i18next';
import type { Model } from '../../shared/types';
import { getDefaultGroupName } from '../../shared/utils/modelUtils';

const ModelProviderSettings: React.FC = () => {
  const { t } = useTranslation();
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  
  // 测试模式开关
  const [testModeEnabled, setTestModeEnabled] = useState(false);

  const provider = useAppSelector(state =>
    state.settings.providers.find(p => p.id === providerId)
  );

  // 使用自定义 hook 管理所有状态和业务逻辑
  const {
    apiKey,
    setApiKey,
    baseUrl,
    setBaseUrl,
    isEnabled,
    setIsEnabled,
    openAddModelDialog,
    setOpenAddModelDialog,
    openDeleteDialog,
    setOpenDeleteDialog,
    openEditModelDialog,
    setOpenEditModelDialog,
    modelToEdit,
    newModelName,
    setNewModelName,
    newModelValue,
    setNewModelValue,
    baseUrlError,
    setBaseUrlError,
    openModelManagementDialog,
    setOpenModelManagementDialog,
    testResult,
    setTestResult,
    testingModelId,
    testResultDialogOpen,
    setTestResultDialogOpen,
    openEditProviderDialog,
    setOpenEditProviderDialog,
    editProviderName,
    editProviderType,
    setEditProviderName,
    setEditProviderType,
    extraHeaders,
    extraBody,
    customModelEndpoint,
    setCustomModelEndpoint,
    openCustomEndpointDialog,
    setOpenCustomEndpointDialog,
    customEndpointError,
    setCustomEndpointError,
    multiKeyEnabled,
    showApiKey,
    buttonStyles,
    handleToggleMultiKey,
    toggleShowApiKey,
    handleBack,
    handleSave,
    handleDelete,
    handleEditProviderName,
    handleSaveProviderName,
    handleOpenCustomEndpointDialog,
    handleSaveCustomEndpoint,
    handleAddModel,
    handleEditModel,
    handleDeleteModel,
    openModelEditDialog,
    handleAddModelFromApi,
    handleBatchAddModels,
    handleBatchRemoveModels,
    handleOpenModelManagement,
    handleTestModelConnection,
  } = useProviderSettings(provider);

  // 计算分组后的模型列表
  const groupedModels = useMemo(() => {
    if (!provider || provider.isSystem) return [];
    
    const groups: Record<string, any[]> = {};
    
    provider.models.forEach((model) => {
      // 使用自动分组逻辑
      const groupName = model.group || getDefaultGroupName(model.id, provider.id);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(model);
    });
    
    // 转换为数组并按字母排序
    const groupArray: [string, Model[]][] = Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map(name => [name, groups[name]]);
    
    return groupArray;
  }, [provider]);

  // 批量删除分组内所有模型
  const handleDeleteGroup = (groupName: string) => {
    const group = groupedModels.find(([name]) => name === groupName);
    if (!group) return;
    
    group[1].forEach(model => {
      handleDeleteModel(model.id);
    });
  };

  // 如果没有找到对应的提供商，显示错误信息
  if (!provider) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t('modelSettings.provider.notFound')}</Typography>
        <Button onClick={handleBack}>{t('common.back')}</Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: (theme) => theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.main, 0.02)
        : alpha(theme.palette.background.default, 0.9),
    }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
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
            sx={{
              color: (theme) => theme.palette.primary.main,
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
            }}
          >
            {provider.name}
          </Typography>
          {!provider.isSystem && (
            <FormControlLabel
              control={
                <CustomSwitch
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                />
              }
              label={isEnabled ? t('modelSettings.provider.enabled') : t('modelSettings.provider.disabled')}
              sx={{ mr: 2 }}
            />
          )}
          <Button
            onClick={handleSave}
            sx={buttonStyles.primary}
          >
            {t('common.save')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          mt: 8,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {/* API配置部分 */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: provider.color || '#9333EA',
                fontSize: '1.5rem',
                mr: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }}
            >
              {provider.avatar || provider.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                {provider.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {provider.isSystem ? t('modelSettings.provider.systemProvider') :
                 `${provider.providerType || 'Custom'} API`}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              {!provider.isSystem && (
                <>
                  <IconButton
                    onClick={handleEditProviderName}
                    sx={{
                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.2),
                      }
                    }}
                  >
                    <Edit size={20} color="#0288d1" />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setOpenDeleteDialog(true)}
                    sx={buttonStyles.error}
                  >
                    <Trash2 size={20} />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>

          {provider.isSystem ? (
            // 系统供应商显示说明信息
            <Box sx={{
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
              borderRadius: 2,
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette.info.main, 0.3)
            }}>
              <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                {t('modelSettings.provider.systemProviderTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('modelSettings.provider.systemProviderDesc')}
              </Typography>
            </Box>
          ) : (
            // 普通供应商显示API配置
            <>
              <Divider sx={{ my: 3 }} />

              <Typography
                variant="subtitle1"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                {t('modelSettings.provider.apiConfig')}
              </Typography>

              {/* API Key 管理模式 - 横向布局 */}
              <Box sx={{ 
                mb: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t('modelSettings.provider.apiKeyMode')}
                  </Typography>
                  <Tooltip 
                    title={multiKeyEnabled
                      ? t('modelSettings.provider.multiKeyDesc')
                      : t('modelSettings.provider.singleKeyDesc')
                    }
                    arrow
                    placement="top"
                  >
                    <IconButton 
                      size="small" 
                      sx={{ 
                        p: 0.5,
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        }
                      }}
                    >
                      <Info size={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <FormControlLabel
                  control={
                    <CustomSwitch
                      checked={multiKeyEnabled}
                      onChange={(e) => handleToggleMultiKey(e.target.checked)}
                    />
                  }
                  label={multiKeyEnabled ? t('modelSettings.provider.multiKeyMode') : t('modelSettings.provider.singleKeyMode')}
                  labelPlacement="start"
                  sx={{ ml: 2, mr: 0 }}
                />
              </Box>

              {/* API Key 配置 */}
              <Box sx={{ mb: 3 }}>
                {multiKeyEnabled ? (
                  // 多 Key 管理入口
                  <Box>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      {t('modelSettings.provider.multiKeyManagement')}
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate(`/settings/model-provider/${provider.id}/multi-key`)}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      {t('modelSettings.provider.manageMultiKey')} ({provider.apiKeys?.length || 0} 个密钥)
                    </Button>
                  </Box>
                ) : (
                  // 单 Key 配置界面
                  <Box>
                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                      {t('modelSettings.provider.apiKeyLabel')}
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder={t('modelSettings.provider.apiKeyPlaceholder')}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      variant="outlined"
                      type={showApiKey ? 'text' : 'password'}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                      slotProps={{
                        input: {
                          'aria-invalid': false,
                          'aria-describedby': 'provider-settings-api-key-helper-text',
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={t('modelSettings.provider.toggleApiKey')}
                                onClick={toggleShowApiKey}
                                edge="end"
                                size="small"
                                sx={{
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    transform: 'scale(1.1)',
                                  },
                                  transition: 'all 0.2s ease-in-out',
                                }}
                              >
                                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                        formHelperText: {
                          id: 'provider-settings-api-key-helper-text'
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* 基础URL配置 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  {t('modelSettings.provider.baseUrlLabel')}
                </Typography>
                <TextField
                  fullWidth
                  placeholder={t('modelSettings.provider.baseUrlPlaceholder')}
                  value={baseUrl}
                  onChange={(e) => {
                    setBaseUrl(e.target.value);
                    setBaseUrlError('');
                  }}
                  error={!!baseUrlError}
                  helperText={
                    <span>
                      {baseUrlError && (
                        <span style={{ display: 'block', color: 'error.main', marginBottom: '4px', fontSize: '0.75rem' }}>
                          {baseUrlError}
                        </span>
                      )}
                      <span style={{ display: 'block', color: 'text.secondary', marginBottom: '4px', fontSize: '0.75rem' }}>
                        {t('modelSettings.provider.baseUrlHint')}
                      </span>
                      {baseUrl && isOpenAIProvider(provider?.providerType) && (
                        <span
                          style={{
                            display: 'inline-block',
                            color: baseUrl.endsWith('#') || baseUrl.endsWith('/') ? '#ed6c02' : '#666',
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginTop: '4px'
                          }}
                        >
                          {baseUrl.endsWith('#') ? t('modelSettings.provider.baseUrlForce') :
                           baseUrl.endsWith('/') ? t('modelSettings.provider.baseUrlKeep') : t('modelSettings.provider.baseUrlComplete')}
                          {getCompleteApiUrl(baseUrl, provider?.providerType)}
                        </span>
                      )}
                    </span>
                  }
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>

              {/* 高级 API 配置按钮 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  {t('modelSettings.provider.advancedAPIConfig')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Settings size={16} />}
                    onClick={() => navigate(`/settings/model-provider/${provider.id}/advanced-api`)}
                    sx={{
                      borderRadius: 2,
                      borderColor: (theme) => alpha(theme.palette.secondary.main, 0.5),
                      color: 'secondary.main',
                      '&:hover': {
                        borderColor: 'secondary.main',
                        bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                      },
                    }}
                  >
                    {t('modelSettings.provider.configureAdvanced')}
                  </Button>
                  {(Object.keys(extraHeaders).length > 0 || Object.keys(extraBody).length > 0) && (
                    <Typography variant="caption" color="text.secondary">
                      {t('modelSettings.provider.advancedConfigured', { 
                        headersCount: Object.keys(extraHeaders).length,
                        bodyCount: Object.keys(extraBody).length
                      })}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 测试模式开关 */}
              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  {t('modelSettings.provider.testMode')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {t('modelSettings.provider.testModeDesc')}
                </Typography>
                <Button
                  variant={testModeEnabled ? "contained" : "outlined"}
                  startIcon={<CheckCircle size={16} />}
                  onClick={() => setTestModeEnabled(!testModeEnabled)}
                  sx={{
                    borderRadius: 2,
                    borderColor: (theme) => alpha(theme.palette.success.main, 0.5),
                    color: testModeEnabled ? 'white' : 'success.main',
                    bgcolor: testModeEnabled ? 'success.main' : 'transparent',
                    '&:hover': {
                      borderColor: 'success.main',
                      bgcolor: testModeEnabled 
                        ? (theme) => alpha(theme.palette.success.main, 0.8)
                        : (theme) => alpha(theme.palette.success.main, 0.1),
                    },
                  }}
                >
                  {testModeEnabled ? t('modelSettings.provider.exitTestMode') : t('modelSettings.provider.testMode')}
                </Button>
              </Box>

            </>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                flex: 1,
                color: 'text.primary'
              }}
            >
              {provider.isSystem ? t('modelSettings.provider.modelCombos') : t('modelSettings.provider.availableModels')}
            </Typography>
            {provider.isSystem ? (
              <Button
                variant="outlined"
                startIcon={<Settings size={16} />}
                onClick={() => window.location.href = '/settings/model-combo'}
                sx={{
                  borderRadius: 2,
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                {t('modelSettings.provider.manageCombos')}
              </Button>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Zap size={16} />}
                  onClick={handleOpenModelManagement}
                  sx={{
                    borderRadius: 2,
                    borderColor: (theme) => alpha(theme.palette.info.main, 0.5),
                    color: 'info.main',
                    '&:hover': {
                      borderColor: 'info.main',
                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                    },
                  }}
                >
                  {t('modelSettings.provider.autoFetch')}
                </Button>
                <IconButton
                  size="small"
                  onClick={handleOpenCustomEndpointDialog}
                  sx={{
                    color: 'info.main',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                    },
                  }}
                  title={t('modelSettings.provider.configureEndpoint')}
                >
                  <Settings size={16} />
                </IconButton>
                <Button
                  startIcon={<Plus size={16} />}
                  onClick={() => setOpenAddModelDialog(true)}
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                    },
                    borderRadius: 2,
                  }}
                >
                  {t('modelSettings.provider.manualAdd')}
                </Button>
              </Box>
            )}
          </Box>

          {/* 系统供应商使用原来的平铺列表 */}
          {provider.isSystem ? (
            <List sx={{ width: '100%' }}>
              {provider.models.map((model) => (
                <Paper
                  key={model.id}
                  elevation={0}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                      borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                    }
                  }}
                >
                  <ListItem
                    secondaryAction={
                      <Box>
                        <IconButton
                          aria-label="edit-combo"
                          onClick={() => navigate('/settings/model-combo')}
                          sx={buttonStyles.primary}
                        >
                          <Settings size={20} color="#1976d2" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {model.name}
                          </Typography>
                          {model.isDefault && (
                            <Box
                              sx={{
                                ml: 1,
                                px: 1,
                                py: 0.2,
                                borderRadius: 1,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                                color: 'success.main',
                              }}
                            >
                              {t('modelSettings.provider.defaultBadge')}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
              {provider.models.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    {t('modelSettings.provider.noCombos')}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Plus size={16} />}
                    onClick={() => window.location.href = '/settings/model-combo'}
                    sx={{ mt: 2 }}
                  >
                    {t('modelSettings.provider.createCombo')}
                  </Button>
                </Box>
              )}
            </List>
          ) : (
            /* 普通供应商 - 使用新的 ModelGroup 组件 */
            <Box sx={{ width: '100%' }}>
              <ModelGroup
                modelGroups={groupedModels}
                showEmptyState={true}
                emptyStateKey={t('modelSettings.provider.noModels')}
                defaultExpanded={[]}
                renderModelItem={(model) => (
                  <Box
                    key={model.id}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      py: { xs: 1.5, sm: 1 },
                      pl: { xs: 2.5, sm: 2 },
                      pr: { xs: testModeEnabled ? 15 : 11, sm: testModeEnabled ? 13 : 9.5 },
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.95rem', sm: '0.875rem' },
                        flex: 1,
                        mr: 1
                      }}
                    >
                      {model.name}
                    </Typography>
                    {model.isDefault && (
                      <Box
                        sx={{
                          px: { xs: 1.25, sm: 1 },
                          py: { xs: 0.5, sm: 0.25 },
                          borderRadius: 1,
                          fontSize: { xs: '0.75rem', sm: '0.7rem' },
                          fontWeight: 600,
                          bgcolor: (theme) => alpha(theme.palette.success.main, 0.12),
                          color: 'success.main',
                          mr: 1
                        }}
                      >
                        {t('modelSettings.provider.defaultBadge')}
                      </Box>
                    )}

                    {/* 按钮组 - 绝对定位 */}
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        right: { xs: 2.5, sm: 2 },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 1, sm: 0.75 }
                      }}
                    >
                      {testModeEnabled && (
                        <IconButton
                          aria-label="test"
                          onClick={() => handleTestModelConnection(model)}
                          disabled={testingModelId !== null}
                          sx={{
                            width: { xs: 40, sm: 36 },
                            height: { xs: 40, sm: 36 },
                            minWidth: { xs: 40, sm: 36 },
                            borderRadius: 1.5,
                            p: 0,
                            bgcolor: (theme) => alpha(theme.palette.success.main, 0.12),
                            color: 'success.main',
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.success.main, 0.2),
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {testingModelId === model.id ? (
                            <CircularProgress size={16} color="success" />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                        </IconButton>
                      )}

                      <IconButton
                        aria-label="edit"
                        onClick={() => openModelEditDialog(model)}
                        sx={{
                          width: { xs: 40, sm: 36 },
                          height: { xs: 40, sm: 36 },
                          minWidth: { xs: 40, sm: 36 },
                          borderRadius: 1.5,
                          p: 0,
                          bgcolor: (theme) => alpha(theme.palette.info.main, 0.12),
                          color: 'info.main',
                          '&:hover': {
                            bgcolor: (theme) => alpha(theme.palette.info.main, 0.2),
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Edit size={18} />
                      </IconButton>

                      <IconButton
                        aria-label="delete"
                        onClick={() => handleDeleteModel(model.id)}
                        sx={{
                          width: { xs: 40, sm: 36 },
                          height: { xs: 40, sm: 36 },
                          minWidth: { xs: 40, sm: 36 },
                          borderRadius: 1.5,
                          p: 0,
                          bgcolor: (theme) => alpha(theme.palette.error.main, 0.12),
                          color: 'error.main',
                          '&:hover': {
                            bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Box>
                  </Box>
                )}
                renderGroupButton={(groupName, models) => (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`确定要删除 ${groupName} 分组中的所有 ${models.length} 个模型吗？`)) {
                        handleDeleteGroup(groupName);
                      }
                    }}
                    sx={{
                      width: { xs: 40, sm: 36 },
                      height: { xs: 40, sm: 36 },
                      minWidth: { xs: 40, sm: 36 },
                      borderRadius: 1.5,
                      p: 0,
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.12),
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
                      },
                      transition: 'all 0.2s ease',
                    }}
                    title={`删除 ${groupName} 组`}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                )}
              />
            </Box>
          )}
        </Paper>

        {/* 测试结果提示条 */}
        <TestResultSnackbar
          testResult={testResult}
          testResultDialogOpen={testResultDialogOpen}
          onClose={() => setTestResult(null)}
          onOpenDialog={() => setTestResultDialogOpen(true)}
        />

        {/* 测试结果对话框 */}
        <TestResultDialog
          open={testResultDialogOpen}
          onClose={() => setTestResultDialogOpen(false)}
          testResult={testResult}
        />
      </Box>

      {/* 添加模型对话框 */}
      <AddModelDialog
        open={openAddModelDialog}
        onClose={() => setOpenAddModelDialog(false)}
        newModelName={newModelName}
        newModelValue={newModelValue}
        onModelNameChange={setNewModelName}
        onModelValueChange={setNewModelValue}
        onAddModel={handleAddModel}
      />

      {/* 编辑模型对话框 */}
      <SimpleModelDialog
        open={openEditModelDialog}
        onClose={() => setOpenEditModelDialog(false)}
        onSave={handleEditModel}
        editModel={modelToEdit}
      />

      {/* 删除确认对话框 */}
      <DeleteDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        providerName={provider.name}
        onDelete={handleDelete}
      />

      {/* 编辑供应商对话框 */}
      <EditProviderDialog
        open={openEditProviderDialog}
        onClose={() => setOpenEditProviderDialog(false)}
        providerName={editProviderName}
        providerType={editProviderType}
        onProviderNameChange={setEditProviderName}
        onProviderTypeChange={setEditProviderType}
        onSave={handleSaveProviderName}
      />

      {/* 自定义模型端点配置对话框 */}
      <CustomEndpointDialog
        open={openCustomEndpointDialog}
        onClose={() => setOpenCustomEndpointDialog(false)}
        customEndpoint={customModelEndpoint}
        customEndpointError={customEndpointError}
        onCustomEndpointChange={(value) => {
          setCustomModelEndpoint(value);
          setCustomEndpointError('');
        }}
        onSave={handleSaveCustomEndpoint}
      />

      {/* 自动获取模型对话框 */}
      {provider && (
        <ModelManagementDialog
          open={openModelManagementDialog}
          onClose={() => setOpenModelManagementDialog(false)}
          provider={provider}
          onAddModel={handleAddModelFromApi}
          onAddModels={handleBatchAddModels}
          onRemoveModel={handleDeleteModel}
          onRemoveModels={handleBatchRemoveModels}
          existingModels={provider.models || []}
        />
      )}
    </Box>
  );
};

export default ModelProviderSettings;