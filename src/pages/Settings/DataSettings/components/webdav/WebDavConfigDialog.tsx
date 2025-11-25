import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import BackButtonDialog from '../../../../../components/common/BackButtonDialog';
import { ChevronDown, Cloud, HelpCircle } from 'lucide-react';
import type { WebDavConfig } from '../../../../../shared/types';
import { WebDavBackupService } from '../../../../../shared/services/storage/WebDavBackupService';
import { validateWebDavConfig } from '../../../../../shared/utils/webdavUtils';

interface WebDavConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: WebDavConfig) => void;
  initialConfig?: WebDavConfig | null;
}

const WebDavConfigDialog: React.FC<WebDavConfigDialogProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<WebDavConfig>({
    webdavHost: '',
    webdavUser: '',
    webdavPass: '',
    webdavPath: '/AetherLink'
  });

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const webdavService = WebDavBackupService.getInstance();

  useEffect(() => {
    if (open) {
      if (initialConfig) {
        setConfig(initialConfig);
      } else {
        setConfig({
          webdavHost: '',
          webdavUser: '',
          webdavPass: '',
          webdavPath: '/AetherLink'
        });
      }
      setTestResult(null);
      setErrors([]);
    }
  }, [open, initialConfig]);

  const handleConfigChange = (field: keyof WebDavConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
    setErrors([]);
  };

  const testConnection = async () => {
    const validationErrors = validateWebDavConfig(config);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setTesting(true);
    setTestResult(null);
    setErrors([]);

    try {
      const success = await webdavService.checkConnection(config);
      setTestResult({
        success,
        message: success ? '连接成功！WebDAV 服务器可以正常访问。' : '连接失败，请检查服务器地址、用户名和密码。'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `连接错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const validationErrors = validateWebDavConfig(config);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      // 先测试连接
      const success = await webdavService.checkConnection(config);
      if (!success) {
        setErrors(['无法连接到 WebDAV 服务器，请检查配置']);
        return;
      }

      onSave(config);
      onClose();
    } catch (error) {
      setErrors([`保存失败: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!testing && !saving) {
      onClose();
    }
  };

  return (
    <BackButtonDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Cloud style={{ marginRight: 8 }} size={20} />
          WebDAV 服务器配置
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          配置您的 WebDAV 服务器信息，用于云端备份和同步
        </Typography>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {testResult && (
          <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            {testResult.message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="WebDAV 服务器地址"
            placeholder="https://your-server.com/webdav"
            value={config.webdavHost}
            onChange={(e) => handleConfigChange('webdavHost', e.target.value)}
            fullWidth
            required
            helperText="完整的 WebDAV 服务器 URL"
          />

          <TextField
            label="用户名"
            value={config.webdavUser}
            onChange={(e) => handleConfigChange('webdavUser', e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="密码"
            type="password"
            value={config.webdavPass}
            onChange={(e) => handleConfigChange('webdavPass', e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="备份路径"
            value={config.webdavPath}
            onChange={(e) => handleConfigChange('webdavPath', e.target.value)}
            fullWidth
            required
            helperText="在服务器上存储备份文件的目录路径"
          />

          <Button
            variant="outlined"
            onClick={testConnection}
            disabled={testing || saving}
            startIcon={testing ? <CircularProgress size={20} /> : undefined}
            sx={{ mt: 1 }}
          >
            {testing ? '测试连接中...' : '测试连接'}
          </Button>
        </Box>

        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HelpCircle style={{ marginRight: 8 }} size={20} />
              <Typography variant="subtitle2">配置说明</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="textSecondary">
              <strong>常见 WebDAV 服务器配置示例：</strong>
              <br /><br />
              
              <strong>123 云盘 (需要 VIP):</strong><br />
              服务器地址: https://webdav.123pan.cn/webdav<br />
              用户名: 您的 123 云盘用户名<br />
              密码: 应用密码（在 123 云盘中生成）<br />
              备份路径: /AetherLink（需要先在 123 云盘根目录创建此目录）<br />
              <br />
              
              <strong>坚果云:</strong><br />
              服务器地址: https://dav.jianguoyun.com/dav<br />
              用户名: 您的坚果云邮箱<br />
              密码: 应用密码（在坚果云中生成）<br />
              备份路径: /AetherLink<br />
              <br />
              
              <strong>Nextcloud:</strong><br />
              服务器地址: https://your-domain.com/remote.php/webdav<br />
              用户名: 您的 Nextcloud 用户名<br />
              密码: 您的 Nextcloud 密码或应用密码<br />
              备份路径: /AetherLink<br />
              <br />
              
              <strong>ownCloud:</strong><br />
              服务器地址: https://your-domain.com/remote.php/webdav<br />
              备份路径: /AetherLink<br />
              <br />
              
              <strong>Synology NAS:</strong><br />
              服务器地址: https://your-nas-ip:5006/webdav<br />
              备份路径: /AetherLink<br />
              <br />
              
              <strong>重要提示：</strong><br />
              • 备份路径必须以 / 开头（如 /AetherLink）<br />
              • 对于 123 云盘和坚果云，需要先在服务器根目录创建对应的目录<br />
              • 建议使用应用专用密码而非主密码<br />
              • 确保服务器支持 HTTPS 连接
            </Typography>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={testing || saving}>
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={testing || saving}
          startIcon={saving ? <CircularProgress size={20} /> : undefined}
        >
          {saving ? '保存中...' : '保存配置'}
        </Button>
      </DialogActions>
    </BackButtonDialog>
  );
};

export default WebDavConfigDialog;
