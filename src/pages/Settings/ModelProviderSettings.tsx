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
  Collapse,
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
  ChevronRight,
  Minus,
  Info
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../shared/store';
import { alpha } from '@mui/material/styles';
import ModelManagementDialog from '../../components/ModelManagementDialog';
import SimpleModelDialog from '../../components/settings/SimpleModelDialog';
import {
  isOpenAIProvider,
  getCompleteApiUrl
} from './ModelProviderSettings/constants';
import {
  AddModelDialog,
  DeleteDialog,
  EditProviderDialog,
  AdvancedAPIConfigDialog,
  CustomEndpointDialog,
  TestResultSnackbar,
  TestResultDialog
} from './ModelProviderSettings/dialogs';
import { useProviderSettings } from './ModelProviderSettings/hooks';
import { useTranslation } from 'react-i18next';

// 模型分组逻辑
const getModelGroup = (modelId: string, modelName: string): string => {
  const id = modelId.toLowerCase();
  const name = modelName.toLowerCase();
  
  // Embeddings
  if (id.includes('embedding') || id.includes('embed') || name.includes('embedding')) {
    return 'Embeddings';
  }
  
  // OpenAI GPT
  if (id.includes('gpt') || /o[134]/.test(id)) {
    if (id.includes('gpt-4') || id.includes('gpt4')) return 'GPT-4';
    if (id.includes('gpt-3') || id.includes('gpt3')) return 'GPT-3';
    if (id.includes('gpt-5') || id.includes('gpt5')) return 'GPT-5';
    if (/o[134]/.test(id)) return 'o 系列';
    return 'GPT';
  }
  
  // Google Gemini
  if (id.includes('gemini')) {
    if (id.includes('gemini-2.0')) return 'Gemini 2.0';
    if (id.includes('gemini-2.5')) return 'Gemini 2.5';
    if (id.includes('gemini-1.5')) return 'Gemini 1.5';
    if (id.includes('gemini-exp')) return 'Gemini Exp';
    return 'Gemini';
  }
  
  // Anthropic Claude
  if (id.includes('claude')) {
    if (id.includes('claude-3.5')) return 'Claude 3.5';
    if (id.includes('claude-3')) return 'Claude 3';
    if (id.includes('claude-4')) return 'Claude 4';
    if (id.includes('sonnet')) return 'Claude Sonnet';
    if (id.includes('opus')) return 'Claude Opus';
    if (id.includes('haiku')) return 'Claude Haiku';
    return 'Claude';
  }
  
  // DeepSeek
  if (id.includes('deepseek')) return 'DeepSeek';
  
  // Qwen
  if (id.includes('qwen') || id.includes('qwq') || id.includes('qvq')) return 'Qwen';
  
  // Doubao
  if (id.includes('doubao') || id.includes('豆包')) return 'Doubao';
  
  // GLM/Zhipu
  if (id.includes('glm') || id.includes('zhipu') || id.includes('智谱')) return 'GLM';
  
  // Mistral
  if (id.includes('mistral')) return 'Mistral';
  
  // Grok
  if (id.includes('grok') || id.includes('xai')) return 'Grok';
  
  // Meta Llama
  if (id.includes('llama')) return 'Llama';
  
  // Yi
  if (id.includes('yi-')) return 'Yi';
  
  // Moonshot/Kimi
  if (id.includes('moonshot') || id.includes('kimi')) return 'Kimi';
  
  // Others
  return '其他模型';
};

interface ModelGroup {
  name: string;
  models: any[];
}

const ModelProviderSettings: React.FC = () => {
  const { t } = useTranslation();
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  
  // 分组折叠状态
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
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
    setExtraHeaders,
    newHeaderKey,
    setNewHeaderKey,
    newHeaderValue,
    setNewHeaderValue,
    extraBody,
    newBodyKey,
    setNewBodyKey,
    newBodyValue,
    setNewBodyValue,
    openAdvancedConfigDialog,
    setOpenAdvancedConfigDialog,
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
    handleAddHeader,
    handleRemoveHeader,
    handleUpdateHeader,
    handleAddBody,
    handleRemoveBody,
    handleUpdateBody,
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
      const groupName = getModelGroup(model.id, model.name);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(model);
    });
    
    // 转换为数组并排序
    const groupArray: ModelGroup[] = Object.keys(groups)
      .sort((a, b) => {
        // Embeddings 放最前面
        if (a === 'Embeddings') return -1;
        if (b === 'Embeddings') return 1;
        // 其他模型放最后面
        if (a === '其他模型') return 1;
        if (b === '其他模型') return -1;
        // 其他按字母排序
        return a.localeCompare(b);
      })
      .map(name => ({
        name,
        models: groups[name]
      }));
    
    return groupArray;
  }, [provider]);

  // 切换分组折叠状态
  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // 批量删除分组内所有模型
  const handleDeleteGroup = (groupName: string) => {
    const group = groupedModels.find(g => g.name === groupName);
    if (!group) return;
    
    group.models.forEach(model => {
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
                    onClick={() => setOpenAdvancedConfigDialog(true)}
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
            p: 3,
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
            /* 普通供应商使用分组列表 */
            <Box sx={{ width: '100%' }}>
              {groupedModels.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    {t('modelSettings.provider.noModels')}
                  </Typography>
                </Box>
              ) : (
                groupedModels.map((group) => (
                  <Box key={group.name} sx={{ mb: 2 }}>
                    {/* 分组标题 */}
                    <Paper
                      elevation={0}
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                      onClick={() => toggleGroup(group.name)}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          py: 1.5,
                        }}
                      >
                        {/* 折叠箭头 */}
                        <IconButton
                          size="small"
                          sx={{
                            mr: 1,
                            transform: collapsedGroups[group.name] ? 'rotate(0deg)' : 'rotate(90deg)',
                            transition: 'transform 0.3s ease',
                            p: 0.5,
                          }}
                        >
                          <ChevronRight size={20} />
                        </IconButton>
                        
                        {/* 分组名称 */}
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          {group.name}
                          <Typography 
                            component="span" 
                            variant="caption" 
                            sx={{ 
                              ml: 1, 
                              color: 'text.secondary',
                              fontWeight: 400,
                            }}
                          >
                            ({group.models.length})
                          </Typography>
                        </Typography>
                        
                        {/* 批量删除按钮 */}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`确定要删除 ${group.name} 分组中的所有 ${group.models.length} 个模型吗？`)) {
                              handleDeleteGroup(group.name);
                            }
                          }}
                          sx={{
                            bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
                            }
                          }}
                          title={`删除 ${group.name} 组`}
                        >
                          <Minus size={18} />
                        </IconButton>
                      </Box>
                    </Paper>

                    {/* 分组内的模型列表 */}
                    <Collapse in={!collapsedGroups[group.name]} timeout={300}>
                      <Box sx={{ pl: 1 }}>
                        {group.models.map((model) => (
                          <Paper
                            key={model.id}
                            elevation={0}
                            sx={{
                              mb: 1.5,
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
                                  {/* 只在测试模式开启时显示测试按钮 */}
                                  {testModeEnabled && (
                                    <IconButton
                                      aria-label="test"
                                      onClick={() => handleTestModelConnection(model)}
                                      disabled={testingModelId !== null}
                                      sx={{
                                        mr: 1,
                                        bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                                        '&:hover': {
                                          bgcolor: (theme) => alpha(theme.palette.success.main, 0.2),
                                        }
                                      }}
                                    >
                                      {testingModelId === model.id ? <CircularProgress size={16} color="success" /> : <CheckCircle size={16} color="#2e7d32" />}
                                    </IconButton>
                                  )}
                                  <IconButton
                                    aria-label="edit"
                                    onClick={() => openModelEditDialog(model)}
                                    sx={{
                                      mr: 1,
                                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                                      '&:hover': {
                                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.2),
                                      }
                                    }}
                                  >
                                    <Edit size={20} color="#0288d1" />
                                  </IconButton>
                                  <IconButton
                                    aria-label="delete"
                                    onClick={() => handleDeleteModel(model.id)}
                                    sx={{
                                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                                      '&:hover': {
                                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
                                      }
                                    }}
                                  >
                                    <Trash2 size={20} color="#d32f2f" />
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
                      </Box>
                    </Collapse>
                  </Box>
                ))
              )}
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

      {/* 高级 API 配置对话框（合并版） */}
      <AdvancedAPIConfigDialog
        open={openAdvancedConfigDialog}
        onClose={() => setOpenAdvancedConfigDialog(false)}
        extraHeaders={extraHeaders}
        newHeaderKey={newHeaderKey}
        newHeaderValue={newHeaderValue}
        onNewHeaderKeyChange={setNewHeaderKey}
        onNewHeaderValueChange={setNewHeaderValue}
        onAddHeader={handleAddHeader}
        onRemoveHeader={handleRemoveHeader}
        onUpdateHeader={handleUpdateHeader}
        onSetExtraHeaders={setExtraHeaders}
        extraBody={extraBody}
        newBodyKey={newBodyKey}
        newBodyValue={newBodyValue}
        onNewBodyKeyChange={setNewBodyKey}
        onNewBodyValueChange={setNewBodyValue}
        onAddBody={handleAddBody}
        onRemoveBody={handleRemoveBody}
        onUpdateBody={handleUpdateBody}
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