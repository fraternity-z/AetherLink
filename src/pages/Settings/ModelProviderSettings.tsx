import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Divider,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Zap,
  CheckCircle,
  Settings
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../shared/store';
import {
  updateProvider,
  deleteProvider
} from '../../shared/store/settingsSlice';
import type { Model } from '../../shared/types';
import type { ApiKeyConfig, LoadBalanceStrategy } from '../../shared/config/defaultModels';
import { isValidUrl } from '../../shared/utils';
import MultiKeyManager from '../../components/settings/MultiKeyManager';
import ApiKeyManager from '../../shared/services/ApiKeyManager';
import { alpha } from '@mui/material/styles';
import ModelManagementDialog from '../../components/ModelManagementDialog';
import SimpleModelDialog from '../../components/settings/SimpleModelDialog';
import { testApiConnection } from '../../shared/api';
import { sendChatRequest } from '../../shared/api';
import { getProviderDisplayName } from '../../shared/api/providerFactory';

// API调用注意: 配置中保存原始URL，实际请求时使用formatApiHost处理URL并添加正确路径

/**
 * 格式化API主机地址
 * @param host 输入的基础URL
 * @returns 格式化后的URL
 */
const formatApiHost = (host: string) => {
  const forceUseOriginalHost = () => {
    if (host.endsWith('/')) {
      return true;
    }

    // 特定URL保持原样
    return host.endsWith('volces.com/api/v3');
  };

  // 如果强制使用原始主机地址，直接返回
  if (forceUseOriginalHost()) {
    return host;
  }

  // 正确处理URL格式
  // 1. 确保URL不以/结尾
  let normalizedUrl = host.trim();
  if (normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }

  // 2. 添加/v1/
  return `${normalizedUrl}/v1/`;
};

/**
 * 生成预览URL
 */
const hostPreview = (baseUrl: string) => {
  if (baseUrl.endsWith('#')) {
    return baseUrl.replace('#', '');
  }

  // 所有OpenAI兼容的API都使用 /v1/chat/completions 端点
  return formatApiHost(baseUrl) + 'chat/completions';
};



/**
 * 判断是否为OpenAI类型的提供商（参考电脑版逻辑）
 * @param providerType 供应商类型
 * @returns 是否为OpenAI类型
 */
const isOpenAIProvider = (providerType?: string): boolean => {
  return !['anthropic', 'gemini'].includes(providerType || '');
};

/**
 * 显示用的URL补全函数 - 仅用于显示完整的API端点
 * @param baseUrl 基础URL
 * @returns 显示用的完整API端点
 */
const getCompleteApiUrl = (baseUrl: string): string => {
  if (!baseUrl.trim()) return '';
  return hostPreview(baseUrl);
};

const ModelProviderSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { providerId } = useParams<{ providerId: string }>();

  const provider = useAppSelector(state =>
    state.settings.providers.find(p => p.id === providerId)
  );

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [openAddModelDialog, setOpenAddModelDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditModelDialog, setOpenEditModelDialog] = useState(false);
  const [modelToEdit, setModelToEdit] = useState<Model | undefined>(undefined);
  const [newModelName, setNewModelName] = useState('');
  const [newModelValue, setNewModelValue] = useState('');
  const [baseUrlError, setBaseUrlError] = useState('');
  const [openModelManagementDialog, setOpenModelManagementDialog] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testResultDialogOpen, setTestResultDialogOpen] = useState(false);

  // 编辑供应商名称相关状态
  const [openEditProviderDialog, setOpenEditProviderDialog] = useState(false);
  const [editProviderName, setEditProviderName] = useState('');

  // 自定义请求头相关状态
  const [extraHeaders, setExtraHeaders] = useState<Record<string, string>>({});
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [openHeadersDialog, setOpenHeadersDialog] = useState(false);

  // 自定义模型端点相关状态
  const [customModelEndpoint, setCustomModelEndpoint] = useState('');
  const [openCustomEndpointDialog, setOpenCustomEndpointDialog] = useState(false);
  const [customEndpointError, setCustomEndpointError] = useState('');

  // 多 Key 管理相关状态
  const [currentTab, setCurrentTab] = useState(0);
  const [multiKeyEnabled, setMultiKeyEnabled] = useState(false);
  const keyManager = ApiKeyManager.getInstance();

  // 当provider加载完成后初始化状态
  useEffect(() => {
    if (provider) {
      setApiKey(provider.apiKey || '');
      setBaseUrl(provider.baseUrl || '');
      setIsEnabled(provider.isEnabled);
      setExtraHeaders(provider.extraHeaders || {});

      // 检查是否启用了多 Key 模式
      setMultiKeyEnabled(!!(provider.apiKeys && provider.apiKeys.length > 0));
    }
  }, [provider]);

  // 多 Key 管理函数
  const handleApiKeysChange = (keys: ApiKeyConfig[]) => {
    if (provider) {
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          apiKeys: keys,
          // 如果有多个 Key，更新主 apiKey 为第一个启用的 Key
          apiKey: keys.find(k => k.isEnabled)?.key || keys[0]?.key || ''
        }
      }));
    }
  };

  const handleStrategyChange = (strategy: LoadBalanceStrategy) => {
    if (provider) {
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          keyManagement: {
            strategy,
            maxFailuresBeforeDisable: provider.keyManagement?.maxFailuresBeforeDisable || 3,
            failureRecoveryTime: provider.keyManagement?.failureRecoveryTime || 5,
            enableAutoRecovery: provider.keyManagement?.enableAutoRecovery || true
          }
        }
      }));
    }
  };

  const handleToggleMultiKey = (enabled: boolean) => {
    setMultiKeyEnabled(enabled);
    if (provider) {
      if (enabled) {
        // 启用多 Key 模式：将当前单个 Key 转换为多 Key 配置
        const currentKey = provider.apiKey;
        if (currentKey) {
          const initialKeys = [keyManager.createApiKeyConfig(currentKey, '主要密钥', 1)];
          dispatch(updateProvider({
            id: provider.id,
            updates: {
              apiKeys: initialKeys,
              keyManagement: {
                strategy: 'round_robin' as LoadBalanceStrategy,
                maxFailuresBeforeDisable: 3,
                failureRecoveryTime: 5,
                enableAutoRecovery: true
              }
            }
          }));
        }
      } else {
        // 禁用多 Key 模式：保留第一个 Key 作为单个 Key
        const firstKey = provider.apiKeys?.[0];
        dispatch(updateProvider({
          id: provider.id,
          updates: {
            apiKey: firstKey?.key || '',
            apiKeys: undefined,
            keyManagement: undefined
          }
        }));
      }
    }
  };

  const handleBack = () => {
    navigate('/settings/default-model', { replace: true });
  };

  // 保存API配置
  const saveApiConfig = () => {
    if (provider) {
      // 验证baseUrl是否有效（如果已输入）
      if (baseUrl && !isValidUrl(baseUrl)) {
        setBaseUrlError('请输入有效的URL');
        return false;
      }

      // 直接保存原始URL，不进行预处理（与新行为一致）
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          apiKey,
          baseUrl: baseUrl.trim(), // 保存原始URL，只去除前后空格
          isEnabled,
          extraHeaders
        }
      }));
      return true;
    }
    return false;
  };

  const handleSave = () => {
    if (saveApiConfig()) {
      navigate('/settings/default-model', { replace: true });
    }
  };

  const handleDelete = () => {
    if (provider) {
      dispatch(deleteProvider(provider.id));
    }
    setOpenDeleteDialog(false);
    navigate('/settings/default-model', { replace: true });
  };

  // 编辑供应商名称相关函数
  const handleEditProviderName = () => {
    if (provider) {
      setEditProviderName(provider.name);
      setOpenEditProviderDialog(true);
    }
  };

  const handleSaveProviderName = () => {
    if (provider && editProviderName.trim()) {
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          name: editProviderName.trim()
        }
      }));
      setOpenEditProviderDialog(false);
      setEditProviderName('');
    }
  };

  // 自定义请求头相关函数
  const handleAddHeader = () => {
    if (newHeaderKey.trim() && newHeaderValue.trim()) {
      setExtraHeaders(prev => ({
        ...prev,
        [newHeaderKey.trim()]: newHeaderValue.trim()
      }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    setExtraHeaders(prev => {
      const newHeaders = { ...prev };
      delete newHeaders[key];
      return newHeaders;
    });
  };

  const handleUpdateHeader = (oldKey: string, newKey: string, newValue: string) => {
    setExtraHeaders(prev => {
      const newHeaders = { ...prev };
      if (oldKey !== newKey) {
        delete newHeaders[oldKey];
      }
      newHeaders[newKey] = newValue;
      return newHeaders;
    });
  };

  // 自定义模型端点相关函数
  const handleOpenCustomEndpointDialog = () => {
    setCustomModelEndpoint('');
    setCustomEndpointError('');
    setOpenCustomEndpointDialog(true);
  };

  const handleSaveCustomEndpoint = () => {
    const endpoint = customModelEndpoint.trim();

    // 验证URL是否完整
    if (!endpoint) {
      setCustomEndpointError('请输入端点URL');
      return;
    }

    if (!isValidUrl(endpoint)) {
      setCustomEndpointError('请输入有效的完整URL');
      return;
    }

    // 保存自定义端点并打开模型管理对话框
    if (provider) {
      // 临时保存自定义端点到provider中
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          customModelEndpoint: endpoint
        }
      }));

      setOpenCustomEndpointDialog(false);
      setOpenModelManagementDialog(true);
    }
  };

  const handleAddModel = () => {
    if (provider && newModelName && newModelValue) {
      // 创建新模型对象
      const newModel: Model = {
        id: newModelValue,
        name: newModelName,
        provider: provider.id,
        providerType: provider.providerType,
        enabled: true,
        isDefault: false
      };

      // 创建更新后的模型数组
      const updatedModels = [...provider.models, newModel];

      // 更新provider
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          models: updatedModels
        }
      }));

      // 清理状态
      setNewModelName('');
      setNewModelValue('');
      setOpenAddModelDialog(false);
    }
  };

  const handleEditModel = (updatedModel: Model) => {
    if (provider && updatedModel) {
      // 从provider的models数组中删除旧模型
      const updatedModels = provider.models.filter(m =>
        modelToEdit ? m.id !== modelToEdit.id : true
      );

      // 添加更新后的模型到provider的models数组
      updatedModels.push(updatedModel);

      // 更新provider
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          models: updatedModels
        }
      }));

      // 清理状态
      setModelToEdit(undefined);
      setOpenEditModelDialog(false);
    }
  };

  const handleDeleteModel = (modelId: string) => {
    if (provider) {
      // 使用provider的更新方法，直接从provider的models数组中删除模型
      const updatedModels = provider.models.filter(model => model.id !== modelId);

      dispatch(updateProvider({
        id: provider.id,
        updates: {
          models: updatedModels
        }
      }));
    }
  };

  const openModelEditDialog = (model: Model) => {
    setModelToEdit(model);
    setNewModelName(model.name);
    setNewModelValue(model.id); // 使用模型ID作为value
    setOpenEditModelDialog(true);
  };

  const handleAddModelFromApi = useCallback((model: Model) => {
    if (provider) {
      // 创建新模型对象
      const newModel: Model = {
        ...model,
        provider: provider.id,
        providerType: provider.providerType,
        enabled: true
      };

      // 检查模型是否已存在
      const modelExists = provider.models.some(m => m.id === model.id);
      if (modelExists) {
        // 如果模型已存在，不添加
        return;
      }

      // 创建更新后的模型数组
      const updatedModels = [...provider.models, newModel];

      // 更新provider
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          models: updatedModels
        }
      }));
    }
  }, [provider, dispatch]);

  // 批量添加多个模型
  const handleBatchAddModels = useCallback((addedModels: Model[]) => {
    if (provider && addedModels.length > 0) {
      // 获取所有不存在的模型
      const newModels = addedModels.filter(model =>
        !provider.models.some(m => m.id === model.id)
      ).map(model => ({
        ...model,
        provider: provider.id,
        providerType: provider.providerType,
        enabled: true
      }));

      if (newModels.length === 0) return;

      // 创建更新后的模型数组
      const updatedModels = [...provider.models, ...newModels];

      // 更新provider
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          models: updatedModels
        }
      }));
    }
  }, [provider, dispatch]);

  // 批量删除多个模型
  const handleBatchRemoveModels = useCallback((modelIds: string[]) => {
    if (provider && modelIds.length > 0) {
      // 过滤掉要删除的模型
      const updatedModels = provider.models.filter(model => !modelIds.includes(model.id));

      // 更新provider
      dispatch(updateProvider({
        id: provider.id,
        updates: {
          models: updatedModels
        }
      }));
    }
  }, [provider, dispatch]);

  // 打开模型管理对话框前先保存当前API配置
  const handleOpenModelManagement = () => {
    if (saveApiConfig()) {
      setOpenModelManagementDialog(true);
    } else {
      // 如果保存失败（例如URL无效），提示用户
      if (baseUrlError) {
        alert('请输入有效的基础URL');
      }
    }
  };

  // API测试功能
  const handleTestConnection = async () => {
    if (provider) {
      // 先保存当前配置
      const configSaved = saveApiConfig();
      if (!configSaved) {
        // 如果保存失败（例如URL无效），提示用户
        if (baseUrlError) {
          setTestResult({ success: false, message: '请输入有效的基础URL' });
          return;
        }
      }

      // 开始测试
      setIsTesting(true);
      setTestResult(null);

      try {
        // 创建一个模拟模型对象，包含当前输入的API配置
        const testModel = {
          id: provider.models.length > 0 ? provider.models[0].id : 'gpt-3.5-turbo',
          name: provider.name,
          provider: provider.id,
          providerType: provider.providerType,
          apiKey: apiKey,
          baseUrl: baseUrl,
          enabled: true
        };

        // 调用测试连接API
        const success = await testApiConnection(testModel);

        if (success) {
          setTestResult({ success: true, message: '连接成功！API配置有效。' });
        } else {
          setTestResult({ success: false, message: '连接失败，请检查API密钥和基础URL是否正确。' });
        }
      } catch (error) {
        console.error('测试API连接时出错:', error);
        setTestResult({
          success: false,
          message: `连接错误: ${error instanceof Error ? error.message : String(error)}`
        });
      } finally {
        setIsTesting(false);
      }
    }
  };

  // 增强的测试单个模型的函数
  const handleTestModelConnection = async (model: Model) => {
    if (!provider) return;

    // 保存当前测试的模型ID
    setTestingModelId(model.id);
    setTestResult(null);

    try {
      // 创建测试模型对象，使用当前保存的API配置
      const testModel = {
        ...model,
        apiKey: apiKey,
        baseUrl: baseUrl,
        enabled: true
      };

      // 直接发送真实的API请求，而不仅仅是测试连接
      const testResponse = await sendChatRequest({
        messages: [{
          role: 'user',
          content: '这是一条API测试消息，请简短回复以验证连接。'
        }],
        modelId: testModel.id
      });

      if (testResponse.success) {
        // 显示成功信息和API响应内容
        setTestResult({
          success: true,
          message: `模型 ${model.name} 连接成功!\n\n响应内容: "${testResponse.content?.substring(0, 100)}${testResponse.content && testResponse.content.length > 100 ? '...' : ''}"`
        });
      } else {
        // 显示失败信息和错误原因
        setTestResult({
          success: false,
          message: `模型 ${model.name} 连接失败：${testResponse.error || '未知错误'}`
        });
      }
    } catch (error) {
      console.error('测试模型连接时出错:', error);
      setTestResult({
        success: false,
        message: `连接错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setTestingModelId(null);
    }
  };

  // 更新原有的Snackbar处理
  useEffect(() => {
    // 当有测试结果时，如果内容较长则自动打开详细对话框
    if (testResult && testResult.message && testResult.message.length > 80) {
      setTestResultDialogOpen(true);
    }
  }, [testResult]);

  // 如果没有找到对应的提供商，显示错误信息
  if (!provider) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>未找到该提供商，请返回设置页面</Typography>
        <Button onClick={handleBack}>返回</Button>
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
              backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {provider.name}
          </Typography>
          <Button
            onClick={handleSave}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
              },
              borderRadius: 2,
            }}
          >
            保存
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
              {provider.avatar}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {provider.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {provider.isSystem ? '系统供应商' :
                 `${getProviderDisplayName({ providerType: provider.providerType } as any)} API`}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
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
                    sx={{
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
                      }
                    }}
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
                🧠 系统供应商说明
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                模型组合供应商是系统内置的虚拟供应商，它使用您配置的模型组合来提供服务。
                模型组合中的各个模型会使用它们各自配置的 API 密钥和基础 URL。
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
                API配置
              </Typography>

              {/* 启用状态 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  启用状态
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={isEnabled ? '已启用' : '已禁用'}
                />
              </Box>

              {/* 多 Key 模式切换 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  API Key 管理模式
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={multiKeyEnabled}
                      onChange={(e) => handleToggleMultiKey(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={multiKeyEnabled ? '多 Key 负载均衡模式' : '单 Key 模式'}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {multiKeyEnabled
                    ? '启用多个 API Key 进行负载均衡和故障转移'
                    : '使用单个 API Key（传统模式）'
                  }
                </Typography>
              </Box>

              {/* API Key 配置标签页 */}
              <Box sx={{ mb: 3 }}>
                <Tabs
                  value={currentTab}
                  onChange={(_, newValue) => setCurrentTab(newValue)}
                  sx={{ mb: 2 }}
                >
                  <Tab label={multiKeyEnabled ? "多 Key 管理" : "API 密钥"} />
                  <Tab label="基础配置" />
                </Tabs>

                {currentTab === 0 && (
                  <Box>
                    {multiKeyEnabled ? (
                      // 多 Key 管理界面
                      <MultiKeyManager
                        providerName={provider.name}
                        providerType={provider.providerType || 'openai'}
                        apiKeys={provider.apiKeys || []}
                        strategy={provider.keyManagement?.strategy || 'round_robin'}
                        onKeysChange={handleApiKeysChange}
                        onStrategyChange={handleStrategyChange}
                      />
                    ) : (
                      // 单 Key 配置界面
                      <Box>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                          API密钥
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="输入API密钥"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          variant="outlined"
                          type="password"
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                          slotProps={{
                            input: {
                              'aria-invalid': false,
                              'aria-describedby': 'provider-settings-api-key-helper-text'
                            },
                            formHelperText: {
                              id: 'provider-settings-api-key-helper-text'
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}

                {currentTab === 1 && (
                  <Box>
                    {/* 基础URL配置 */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom color="text.secondary">
                        基础URL (可选)
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="输入基础URL，例如: https://tow.bt6.top"
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
                              在URL末尾添加#可强制使用自定义格式，末尾添加/也可保持原格式
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
                                {baseUrl.endsWith('#') ? '强制使用: ' :
                                 baseUrl.endsWith('/') ? '保持原格式: ' : '完整地址: '}
                                {getCompleteApiUrl(baseUrl)}
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

                    {/* 自定义请求头按钮 */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom color="text.secondary">
                        自定义请求头 (可选)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Settings size={16} />}
                          onClick={() => setOpenHeadersDialog(true)}
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
                          配置请求头
                        </Button>
                        {Object.keys(extraHeaders).length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            已配置 {Object.keys(extraHeaders).length} 个请求头
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* API测试按钮 */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={isTesting ? <CircularProgress size={16} /> : <CheckCircle size={16} />}
                        onClick={handleTestConnection}
                        disabled={isTesting || (!apiKey && (!provider.apiKeys || provider.apiKeys.length === 0))}
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
                        {isTesting ? '测试中...' : '测试连接'}
                      </Button>
                    </Box>
                  </Box>
                )}
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
              {provider.isSystem ? '模型组合' : '可用模型'}
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
                管理组合
              </Button>
            ) : (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
                >
                  点击✓测试单个模型
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
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
                    自动获取
                  </Button>
                  <IconButton
                    size="small"
                    onClick={handleOpenCustomEndpointDialog}
                    sx={{
                      ml: 0.5,
                      color: 'info.main',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                      },
                    }}
                    title="配置自定义模型端点"
                  >
                    <Settings size={16} />
                  </IconButton>
                </Box>
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
                  手动添加
                </Button>
              </>
            )}
          </Box>

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
                    provider.isSystem ? (
                      // 系统供应商（模型组合）显示不同的操作按钮
                      <Box>
                        <IconButton
                          aria-label="edit-combo"
                          onClick={() => window.location.href = '/settings/model-combo'}
                          sx={{
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                            }
                          }}
                        >
                          <Settings size={20} color="#1976d2" />
                        </IconButton>
                      </Box>
                    ) : (
                      // 普通供应商显示原有的操作按钮
                      <Box>
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
                    )
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
                            默认
                          </Box>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                        ID: {model.id}
                      </Typography>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
            {provider.models.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary">
                  {provider.isSystem ? '尚未创建任何模型组合' : '尚未添加任何模型'}
                </Typography>
                {provider.isSystem && (
                  <Button
                    variant="outlined"
                    startIcon={<Plus size={16} />}
                    onClick={() => window.location.href = '/settings/model-combo'}
                    sx={{ mt: 2 }}
                  >
                    创建模型组合
                  </Button>
                )}
              </Box>
            )}
          </List>
        </Paper>

        {/* 修改Snackbar，简短显示结果并添加查看详情按钮 */}
        <Snackbar
          open={testResult !== null && !testResultDialogOpen}
          autoHideDuration={6000}
          onClose={() => setTestResult(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          action={
            <Button color="inherit" size="small" onClick={() => setTestResultDialogOpen(true)}>
              查看详情
            </Button>
          }
        >
          <Alert
            onClose={() => setTestResult(null)}
            severity={testResult?.success ? "success" : "error"}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {testResult?.success ? '连接测试成功!' : '连接测试失败'}
          </Alert>
        </Snackbar>

        {/* 添加测试结果详细对话框 */}
        <Dialog
          open={testResultDialogOpen}
          onClose={() => setTestResultDialogOpen(false)}
          maxWidth="md"
          slotProps={{
            paper: {
              sx: {
                width: '100%',
                maxWidth: 500,
                borderRadius: 2
              }
            }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 600,
            color: testResult?.success ? 'success.main' : 'error.main',
            display: 'flex',
            alignItems: 'center'
          }}>
            {testResult?.success ? <CheckCircle size={20} style={{marginRight: 8}} color="#2e7d32" /> : null}
            API测试结果
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>
              {testResult?.message || ''}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setTestResultDialogOpen(false)}
              variant="contained"
              color={testResult?.success ? 'success' : 'primary'}
              sx={{ borderRadius: 2 }}
            >
              确定
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* 添加模型对话框 */}
      <Dialog open={openAddModelDialog} onClose={() => setOpenAddModelDialog(false)}>
        <DialogTitle sx={{
          fontWeight: 600,
          backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
          backgroundClip: 'text',
          color: 'transparent',
        }}>
          添加模型
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="模型名称"
            placeholder="例如: GPT-4o"
            type="text"
            fullWidth
            variant="outlined"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            margin="dense"
            label="模型ID"
            placeholder="例如: gpt-4o"
            type="text"
            fullWidth
            variant="outlined"
            value={newModelValue}
            onChange={(e) => setNewModelValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddModelDialog(false)}>取消</Button>
          <Button
            onClick={handleAddModel}
            disabled={!newModelName || !newModelValue}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
              },
              borderRadius: 2,
            }}
          >
            添加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑模型对话框 */}
      <SimpleModelDialog
        open={openEditModelDialog}
        onClose={() => setOpenEditModelDialog(false)}
        onSave={handleEditModel}
        editModel={modelToEdit}
      />

      {/* 删除确认对话框 */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle fontWeight={600}>删除提供商</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除 <b>{provider.name}</b> 提供商吗？这将同时删除所有相关的模型配置。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>取消</Button>
          <Button
            onClick={handleDelete}
            color="error"
            sx={{
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
              },
              borderRadius: 2,
            }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑供应商名称对话框 */}
      <Dialog open={openEditProviderDialog} onClose={() => setOpenEditProviderDialog(false)}>
        <DialogTitle sx={{
          fontWeight: 600,
          backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
          backgroundClip: 'text',
          color: 'transparent',
        }}>
          编辑供应商名称
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="供应商名称"
            placeholder="例如: 我的智谱AI"
            type="text"
            fullWidth
            variant="outlined"
            value={editProviderName}
            onChange={(e) => setEditProviderName(e.target.value)}
            sx={{ mb: 2, mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditProviderDialog(false)}>取消</Button>
          <Button
            onClick={handleSaveProviderName}
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
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 自定义请求头对话框 */}
      <Dialog
        open={openHeadersDialog}
        onClose={() => setOpenHeadersDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
          backgroundClip: 'text',
          color: 'transparent',
        }}>
          配置自定义请求头
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            用于解决 CORS 问题或添加特殊认证头
          </Typography>

          {/* 快速操作按钮 */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              快速操作
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setExtraHeaders(prev => ({
                    ...prev,
                    'x-stainless-timeout': 'REMOVE'
                  }));
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                禁用 x-stainless-timeout
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setExtraHeaders(prev => ({
                    ...prev,
                    'x-stainless-retry-count': 'REMOVE'
                  }));
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                禁用 x-stainless-retry-count
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => {
                  setExtraHeaders(prev => ({
                    ...prev,
                    'x-stainless-timeout': 'REMOVE',
                    'x-stainless-retry-count': 'REMOVE',
                    'x-stainless-arch': 'REMOVE',
                    'x-stainless-lang': 'REMOVE',
                    'x-stainless-os': 'REMOVE',
                    'x-stainless-package-version': 'REMOVE',
                    'x-stainless-runtime': 'REMOVE',
                    'x-stainless-runtime-version': 'REMOVE'
                  }));
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                禁用所有 stainless 头部
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              设置值为 "REMOVE" 可以禁用默认的请求头
            </Typography>
          </Box>

          {/* 现有请求头列表 */}
          {Object.entries(extraHeaders).map(([key, value]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <TextField
                size="small"
                label="请求头名称"
                value={key}
                onChange={(e) => handleUpdateHeader(key, e.target.value, value)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="请求头值"
                value={value}
                onChange={(e) => handleUpdateHeader(key, key, e.target.value)}
                sx={{
                  flex: 1,
                  '& .MuiInputBase-input': {
                    color: value === 'REMOVE' ? 'error.main' : 'inherit'
                  }
                }}
                helperText={value === 'REMOVE' ? '此头部将被禁用' : ''}
                slotProps={{
                  formHelperText: {
                    sx: { color: 'error.main', fontSize: '0.7rem' }
                  }
                }}
              />
              <IconButton
                onClick={() => handleRemoveHeader(key)}
                sx={{
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  }
                }}
              >
                <Trash2 size={20} />
              </IconButton>
            </Box>
          ))}

          {/* 添加新请求头 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <TextField
              size="small"
              label="新请求头名称"
              placeholder="例如: x-stainless-timeout"
              value={newHeaderKey}
              onChange={(e) => setNewHeaderKey(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="新请求头值"
              placeholder="例如: 30000"
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              startIcon={<Plus size={16} />}
              onClick={handleAddHeader}
              disabled={!newHeaderKey.trim() || !newHeaderValue.trim()}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                },
                borderRadius: 2,
              }}
            >
              添加
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenHeadersDialog(false)}>取消</Button>
          <Button
            onClick={() => setOpenHeadersDialog(false)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
              },
              borderRadius: 2,
            }}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 自定义模型端点配置对话框 */}
      <Dialog
        open={openCustomEndpointDialog}
        onClose={() => setOpenCustomEndpointDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
          backgroundClip: 'text',
          color: 'transparent',
        }}>
          配置自定义模型端点
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            输入完整的模型端点URL，系统将同时从默认端点和自定义端点获取模型列表并合并。
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
            示例：https://api.example.com/v1/models
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="自定义端点URL"
            placeholder="https://api.example.com/v1/models"
            type="url"
            fullWidth
            variant="outlined"
            value={customModelEndpoint}
            onChange={(e) => {
              setCustomModelEndpoint(e.target.value);
              setCustomEndpointError('');
            }}
            error={!!customEndpointError}
            helperText={customEndpointError || '请输入完整的URL，包括协议（http://或https://）'}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCustomEndpointDialog(false)}>取消</Button>
          <Button
            onClick={handleSaveCustomEndpoint}
            disabled={!customModelEndpoint.trim()}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
              },
              borderRadius: 2,
            }}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

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