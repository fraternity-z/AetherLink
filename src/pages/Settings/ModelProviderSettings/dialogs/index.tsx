import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { providerTypeOptions } from '../constants';

// ============================================================================
// 类型定义
// ============================================================================

interface AddModelDialogProps {
  open: boolean;
  onClose: () => void;
  newModelName: string;
  newModelValue: string;
  onModelNameChange: (value: string) => void;
  onModelValueChange: (value: string) => void;
  onAddModel: () => void;
}

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  providerName: string;
  onDelete: () => void;
}

interface EditProviderDialogProps {
  open: boolean;
  onClose: () => void;
  providerName: string;
  providerType: string;
  onProviderNameChange: (value: string) => void;
  onProviderTypeChange: (value: string) => void;
  onSave: () => void;
}

interface HeadersDialogProps {
  open: boolean;
  onClose: () => void;
  extraHeaders: Record<string, string>;
  newHeaderKey: string;
  newHeaderValue: string;
  onNewHeaderKeyChange: (value: string) => void;
  onNewHeaderValueChange: (value: string) => void;
  onAddHeader: () => void;
  onRemoveHeader: (key: string) => void;
  onUpdateHeader: (oldKey: string, newKey: string, newValue: string) => void;
  onSetExtraHeaders: (headers: Record<string, string>) => void;
}

interface CustomEndpointDialogProps {
  open: boolean;
  onClose: () => void;
  customEndpoint: string;
  customEndpointError: string;
  onCustomEndpointChange: (value: string) => void;
  onSave: () => void;
}

interface TestResultSnackbarProps {
  testResult: { success: boolean; message: string } | null;
  testResultDialogOpen: boolean;
  onClose: () => void;
  onOpenDialog: () => void;
}

interface TestResultDialogProps {
  open: boolean;
  onClose: () => void;
  testResult: { success: boolean; message: string } | null;
}

// ============================================================================
// 添加模型对话框
// ============================================================================

export const AddModelDialog: React.FC<AddModelDialogProps> = ({
  open,
  onClose,
  newModelName,
  newModelValue,
  onModelNameChange,
  onModelValueChange,
  onAddModel
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
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
          onChange={(e) => onModelNameChange(e.target.value)}
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
          onChange={(e) => onModelValueChange(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={onAddModel}
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
  );
};

// ============================================================================
// 删除确认对话框
// ============================================================================

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  providerName,
  onDelete
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle fontWeight={600}>删除提供商</DialogTitle>
      <DialogContent>
        <Typography>
          确定要删除 <b>{providerName}</b> 提供商吗？这将同时删除所有相关的模型配置。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={onDelete}
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
  );
};

// ============================================================================
// 编辑供应商对话框
// ============================================================================

export const EditProviderDialog: React.FC<EditProviderDialogProps> = ({
  open,
  onClose,
  providerName,
  providerType,
  onProviderNameChange,
  onProviderTypeChange,
  onSave
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{
        fontWeight: 600,
        backgroundImage: 'linear-gradient(90deg, #9333EA, #754AB4)',
        backgroundClip: 'text',
        color: 'transparent',
      }}>
        编辑供应商
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          autoFocus
          margin="dense"
          label="供应商名称"
          placeholder="例如: 我的智谱AI"
          type="text"
          fullWidth
          variant="outlined"
          value={providerName}
          onChange={(e) => onProviderNameChange(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth variant="outlined">
          <InputLabel>供应商类型</InputLabel>
          <Select
            value={providerType}
            onChange={(e) => onProviderTypeChange(e.target.value)}
            label="供应商类型"
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
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={onSave}
          disabled={!providerName.trim()}
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
  );
};

// ============================================================================
// 自定义请求头对话框
// ============================================================================

export const HeadersDialog: React.FC<HeadersDialogProps> = ({
  open,
  onClose,
  extraHeaders,
  newHeaderKey,
  newHeaderValue,
  onNewHeaderKeyChange,
  onNewHeaderValueChange,
  onAddHeader,
  onRemoveHeader,
  onUpdateHeader,
  onSetExtraHeaders
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
                onSetExtraHeaders({
                  ...extraHeaders,
                  'x-stainless-timeout': 'REMOVE'
                });
              }}
              sx={{ fontSize: '0.75rem' }}
            >
              禁用 x-stainless-timeout
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                onSetExtraHeaders({
                  ...extraHeaders,
                  'x-stainless-retry-count': 'REMOVE'
                });
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
                onSetExtraHeaders({
                  ...extraHeaders,
                  'x-stainless-timeout': 'REMOVE',
                  'x-stainless-retry-count': 'REMOVE',
                  'x-stainless-arch': 'REMOVE',
                  'x-stainless-lang': 'REMOVE',
                  'x-stainless-os': 'REMOVE',
                  'x-stainless-package-version': 'REMOVE',
                  'x-stainless-runtime': 'REMOVE',
                  'x-stainless-runtime-version': 'REMOVE'
                });
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
              onChange={(e) => onUpdateHeader(key, e.target.value, value)}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="请求头值"
              value={value}
              onChange={(e) => onUpdateHeader(key, key, e.target.value)}
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
              onClick={() => onRemoveHeader(key)}
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
            onChange={(e) => onNewHeaderKeyChange(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="新请求头值"
            placeholder="例如: 30000"
            value={newHeaderValue}
            onChange={(e) => onNewHeaderValueChange(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            startIcon={<Plus size={16} />}
            onClick={onAddHeader}
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
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={onClose}
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
  );
};

// ============================================================================
// 自定义端点对话框
// ============================================================================

export const CustomEndpointDialog: React.FC<CustomEndpointDialogProps> = ({
  open,
  onClose,
  customEndpoint,
  customEndpointError,
  onCustomEndpointChange,
  onSave
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          value={customEndpoint}
          onChange={(e) => onCustomEndpointChange(e.target.value)}
          error={!!customEndpointError}
          helperText={customEndpointError || '请输入完整的URL，包括协议（http://或https://）'}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={onSave}
          disabled={!customEndpoint.trim()}
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
  );
};

// ============================================================================
// 测试结果提示条
// ============================================================================

export const TestResultSnackbar: React.FC<TestResultSnackbarProps> = ({
  testResult,
  testResultDialogOpen,
  onClose,
  onOpenDialog
}) => {
  return (
    <Snackbar
      open={testResult !== null && !testResultDialogOpen}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      action={
        <Button color="inherit" size="small" onClick={onOpenDialog}>
          查看详情
        </Button>
      }
    >
      <Alert
        onClose={onClose}
        severity={testResult?.success ? "success" : "error"}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {testResult?.success ? '连接测试成功!' : '连接测试失败'}
      </Alert>
    </Snackbar>
  );
};

// ============================================================================
// 测试结果对话框
// ============================================================================

export const TestResultDialog: React.FC<TestResultDialogProps> = ({
  open,
  onClose,
  testResult
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          onClick={onClose}
          variant="contained"
          color={testResult?.success ? 'success' : 'primary'}
          sx={{ borderRadius: 2 }}
        >
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

