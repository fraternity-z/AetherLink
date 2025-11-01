import React from 'react';
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
  Tabs,
  Tab,
  InputAdornment
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
  EyeOff
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../shared/store';
import { alpha } from '@mui/material/styles';
import ModelManagementDialog from '../../components/ModelManagementDialog';
import SimpleModelDialog from '../../components/settings/SimpleModelDialog';
import MultiKeyManager from '../../components/settings/MultiKeyManager';
import {
  isOpenAIProvider,
  getCompleteApiUrl
} from './ModelProviderSettings/constants';
import {
  AddModelDialog,
  DeleteDialog,
  EditProviderDialog,
  HeadersDialog,
  CustomEndpointDialog,
  TestResultSnackbar,
  TestResultDialog
} from './ModelProviderSettings/dialogs';
import { useProviderSettings } from './ModelProviderSettings/hooks';

const ModelProviderSettings: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();

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
    isTesting,
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
    openHeadersDialog,
    setOpenHeadersDialog,
    customModelEndpoint,
    setCustomModelEndpoint,
    openCustomEndpointDialog,
    setOpenCustomEndpointDialog,
    customEndpointError,
    setCustomEndpointError,
    currentTab,
    setCurrentTab,
    multiKeyEnabled,
    showApiKey,
    buttonStyles,
    handleApiKeysChange,
    handleStrategyChange,
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
    handleTestConnection,
    handleTestModelConnection,
  } = useProviderSettings(provider);

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
            sx={buttonStyles.primary}
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
              {provider.avatar || provider.name.charAt(0).toUpperCase()}
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
                 `${provider.providerType || 'Custom'} API`}
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
                    <CustomSwitch
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
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
                    <CustomSwitch
                      checked={multiKeyEnabled}
                      onChange={(e) => handleToggleMultiKey(e.target.checked)}
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
                                    aria-label="切换API密钥可见性"
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
                          onClick={() => navigate('/settings/model-combo')}
                          sx={buttonStyles.primary}
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

      {/* 自定义请求头对话框 */}
      <HeadersDialog
        open={openHeadersDialog}
        onClose={() => setOpenHeadersDialog(false)}
        extraHeaders={extraHeaders}
        newHeaderKey={newHeaderKey}
        newHeaderValue={newHeaderValue}
        onNewHeaderKeyChange={setNewHeaderKey}
        onNewHeaderValueChange={setNewHeaderValue}
        onAddHeader={handleAddHeader}
        onRemoveHeader={handleRemoveHeader}
        onUpdateHeader={handleUpdateHeader}
        onSetExtraHeaders={setExtraHeaders}
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