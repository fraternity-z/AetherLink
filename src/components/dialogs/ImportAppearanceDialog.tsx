import React, { useState } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  Tabs,
  Tab,
  alpha,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import BackButtonDialog from '../common/BackButtonDialog';
import { X, Upload, FileText, Link as LinkIcon } from 'lucide-react';
import type { AppearanceConfig } from '../../shared/utils/appearanceConfig';
import { decodeAppearanceConfig, validateAppearanceConfig, importAppearanceConfigFromFile } from '../../shared/utils/appearanceConfig';

interface ImportAppearanceDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (config: AppearanceConfig) => void;
}

const ImportAppearanceDialog: React.FC<ImportAppearanceDialogProps> = ({ open, onClose, onImport }) => {
  const [tabValue, setTabValue] = useState(0);
  const [shareCode, setShareCode] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [error, setError] = useState('');
  const [previewConfig, setPreviewConfig] = useState<AppearanceConfig | null>(null);

  const handleShareCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShareCode(event.target.value);
    setError('');
    setPreviewConfig(null);
  };

  const handleShareLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShareLink(event.target.value);
    setError('');
    setPreviewConfig(null);
  };

  const handlePreview = () => {
    try {
      const config = decodeAppearanceConfig(shareCode.trim());
      if (!validateAppearanceConfig(config)) {
        setError('无效的外观配置');
        return;
      }
      setPreviewConfig(config);
      setError('');
    } catch (err) {
      setError('解析失败，请检查分享码是否正确');
      setPreviewConfig(null);
    }
  };

  const handlePreviewFromLink = () => {
    try {
      // 从链接中提取分享码
      const url = shareLink.trim();
      const match = url.match(/[?&]share=([^&]+)/);
      if (!match) {
        setError('链接格式不正确，请确保包含分享参数');
        return;
      }
      const code = match[1];
      const config = decodeAppearanceConfig(code);
      if (!validateAppearanceConfig(config)) {
        setError('无效的外观配置');
        return;
      }
      setPreviewConfig(config);
      setError('');
    } catch (err) {
      setError('解析失败，请检查链接是否正确');
      setPreviewConfig(null);
    }
  };

  const handleImportFromCode = () => {
    if (previewConfig) {
      onImport(previewConfig);
      handleClose();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const config = await importAppearanceConfigFromFile(file);
      setPreviewConfig(config);
      setError('');
      // 保持在当前标签页（上传文件）
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入文件失败');
      setPreviewConfig(null);
    }
  };

  const handleClose = () => {
    setShareCode('');
    setShareLink('');
    setError('');
    setPreviewConfig(null);
    setTabValue(0);
    onClose();
  };

  const renderConfigPreview = (config: AppearanceConfig) => {
    return (
      <List dense>
        <ListItem>
          <ListItemText 
            primary="主题模式" 
            secondary={
              <Chip 
                label={config.theme === 'light' ? '浅色' : config.theme === 'dark' ? '深色' : '跟随系统'} 
                size="small" 
                sx={{ mt: 0.5 }}
              />
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="主题风格" 
            secondary={
              <Chip 
                label={config.themeStyle} 
                size="small" 
                sx={{ mt: 0.5 }}
              />
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="字体大小" 
            secondary={`${config.fontSize}px`}
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="字体家族" 
            secondary={config.fontFamily}
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="消息样式" 
            secondary={config.messageStyle === 'bubble' ? '气泡' : '简洁'}
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="输入框风格" 
            secondary={config.inputBoxStyle}
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="工具栏样式" 
            secondary={config.toolbarStyle === 'glassmorphism' ? '毛玻璃' : '透明'}
          />
        </ListItem>
      </List>
    );
  };

  return (
    <BackButtonDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Upload size={24} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            导入外观设置
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="粘贴分享码" />
          <Tab label="粘贴链接" icon={<LinkIcon size={16} />} iconPosition="start" />
          <Tab label="上传文件" />
        </Tabs>

        {/* 粘贴分享码 */}
        {tabValue === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              粘贴好友分享的外观配置码，预览后即可应用
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={shareCode}
              onChange={handleShareCodeChange}
              placeholder="粘贴分享码到这里..."
              InputProps={{
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                }
              }}
              sx={{ mb: 2 }}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {previewConfig && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  配置预览
                </Typography>
                <Box sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
                  maxHeight: 300,
                  overflow: 'auto'
                }}>
                  {renderConfigPreview(previewConfig)}
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handlePreview}
                disabled={!shareCode.trim()}
              >
                预览配置
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleImportFromCode}
                disabled={!previewConfig}
              >
                应用配置
              </Button>
            </Box>
          </Box>
        )}

        {/* 粘贴链接 */}
        {tabValue === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              粘贴好友分享的完整链接
            </Alert>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              value={shareLink}
              onChange={handleShareLinkChange}
              placeholder="粘贴分享链接到这里，例如：https://example.com/#/settings/appearance?share=..."
              InputProps={{
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                }
              }}
              sx={{ mb: 2 }}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {previewConfig && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  配置预览
                </Typography>
                <Box sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
                  maxHeight: 300,
                  overflow: 'auto'
                }}>
                  {renderConfigPreview(previewConfig)}
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handlePreviewFromLink}
                disabled={!shareLink.trim()}
              >
                预览配置
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleImportFromCode}
                disabled={!previewConfig}
              >
                应用配置
              </Button>
            </Box>
          </Box>
        )}

        {/* 上传文件 */}
        {tabValue === 2 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              选择之前导出的外观配置 JSON 文件
            </Alert>
            <Box
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                }
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <FileText size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                点击选择文件
              </Typography>
              <Typography variant="body2" color="text.secondary">
                支持 .json 格式
              </Typography>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </Box>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {previewConfig && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  配置预览
                </Typography>
                <Box sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
                  maxHeight: 300,
                  overflow: 'auto'
                }}>
                  {renderConfigPreview(previewConfig)}
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleImportFromCode}
                  sx={{ mt: 2 }}
                >
                  应用配置
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text">
          取消
        </Button>
      </DialogActions>
    </BackButtonDialog>
  );
};

export default ImportAppearanceDialog;
