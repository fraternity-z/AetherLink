import React, { useState } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Container,
  Paper,
  Button,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControlLabel,
  Avatar
} from '@mui/material';
import CustomSwitch from '../../../components/CustomSwitch';
import {
  ArrowLeft as ArrowBackIcon,
  Upload as BackupIcon,
  RotateCcw as SettingsBackupRestoreIcon,
  Folder as FolderIcon,
  Database as DataSaverOnIcon,
  CloudUpload as CloudUploadIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';
import { getAllTopicsFromDB, getAllAssistantsFromDB } from '../../../shared/services/storage/storageService';
import { alpha } from '@mui/material/styles';
import { SafeAreaContainer } from '../../../components/settings/SettingComponents';

const DEFAULT_BACKUP_DIRECTORY = 'AetherLink/backups';

const AdvancedBackupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info'
  });

  // 备份选项
  const [backupOptions, setBackupOptions] = useState({
    includeChats: true,
    includeAssistants: true,
    includeSettings: true,
    includeLocalStorage: true,
    includeIndexedDB: true
  });

  // 返回上一级页面
  const handleBack = () => {
    navigate('/settings/data');
  };

  // 显示提示信息
  const showMessage = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 关闭提示信息
  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  // 复制到剪贴板功能
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      // 备用方法
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch (fallbackError) {
        console.error('备用剪贴板方法也失败:', fallbackError);
        return false;
      }
    }
  };

  // 更新备份选项
  const handleOptionChange = (option: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackupOptions({
      ...backupOptions,
      [option]: event.target.checked
    });
  };

  // 创建完整备份
  const createFullBackup = async () => {
    try {
      setIsLoading(true);

      // 准备备份数据
      const backupData: Record<string, any> = {
        timestamp: Date.now(),
        appInfo: {
          version: '1.0.0',
          name: 'AetherLink',
          backupVersion: 3 // 新的备份版本，用于识别
        }
      };

      // 1. 备份对话和助手数据 (如果选中)
      if (backupOptions.includeChats) {
        const allTopics = await getAllTopicsFromDB();
        backupData.topics = allTopics;
      }

      if (backupOptions.includeAssistants) {
        const allAssistants = await getAllAssistantsFromDB();
        backupData.assistants = allAssistants;
      }

      // 2. 备份设置数据 (如果选中)
      if (backupOptions.includeSettings) {
        const settingsJson = localStorage.getItem('settings');
        backupData.settings = settingsJson ? JSON.parse(settingsJson) : {};
      }

      // 3. 备份其他localStorage数据 (如果选中)
      if (backupOptions.includeLocalStorage) {
        const localStorageItems: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key !== 'settings' && !key.startsWith('aetherlink-migration') && key !== 'idb-migration-done') {
            try {
              const value = localStorage.getItem(key);
              if (value) {
                // 尝试解析JSON，如果失败则存储原始字符串
                try {
                  localStorageItems[key] = JSON.parse(value);
                } catch {
                  localStorageItems[key] = value;
                }
              }
            } catch (e) {
              console.error(`读取localStorage项 "${key}" 失败:`, e);
            }
          }
        }
        backupData.localStorage = localStorageItems;
      }

      // 备份设置位置信息
      backupData.backupSettings = {
        location: localStorage.getItem('backup-location') || DEFAULT_BACKUP_DIRECTORY,
        storageType: localStorage.getItem('backup-storage-type') || 'documents'
      };

      // 创建文件名 - 包含更多详细信息
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupTypes = [];
      if (backupOptions.includeChats) backupTypes.push('Chats');
      if (backupOptions.includeAssistants) backupTypes.push('Assistants');
      if (backupOptions.includeSettings) backupTypes.push('Settings');
      if (backupOptions.includeLocalStorage) backupTypes.push('LocalStorage');

      const fileName = `AetherLink_FullBackup_${backupTypes.join('_')}_${timestamp}.json`;

      // 将JSON转换为字符串
      const jsonString = JSON.stringify(backupData, null, 2); // 美化JSON格式，方便查看

      // 首先创建临时文件
      const tempPath = fileName;

      await Filesystem.writeFile({
        path: tempPath,
        data: jsonString,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      // 获取临时文件URI
      const tempFileResult = await Filesystem.getUri({
        path: tempPath,
        directory: Directory.Cache
      });

      if (tempFileResult && tempFileResult.uri) {
        try {
          // 尝试使用Share API调用系统的分享/保存功能
          await Share.share({
            title: t('dataSettings.messages.backupCreated'),
            text: t('dataSettings.advancedBackup.fullBackup.description'),
            url: tempFileResult.uri,
            dialogTitle: t('common.selectSaveLocation', { defaultValue: '选择保存位置' })
          });

          showMessage(t('dataSettings.messages.pleaseSelectSaveLocation'), 'info');
        } catch (shareError) {
          console.error('分享文件失败:', shareError);

          // 尝试使用文件打开器
          try {
            await FileOpener.open({
              filePath: tempFileResult.uri,
              contentType: 'application/json'
            });

            showMessage(t('dataSettings.messages.fileOpened'), 'info');
          } catch (openError) {
            console.error('打开文件失败:', openError);
            // 回退到保存到下载目录
            await saveToDownloadDirectory(fileName, jsonString);
          }
        }
      } else {
        // 无法获取临时文件URI，回退到下载目录
        await saveToDownloadDirectory(fileName, jsonString);
      }
    } catch (error) {
      console.error('创建完整备份失败:', error);
      showMessage(t('dataSettings.messages.backupFailed') + ': ' + (error as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存到下载目录
  const saveToDownloadDirectory = async (fileName: string, jsonString: string) => {
    try {
      // 确保下载目录存在
      const downloadDir = "Download";
      try {
        await Filesystem.mkdir({
          path: downloadDir,
          directory: Directory.External,
          recursive: true
        });
      } catch (mkdirError) {
        console.log('目录可能已存在:', mkdirError);
      }

      // 写入文件到下载目录
      const filePath = `${downloadDir}/${fileName}`;
      await Filesystem.writeFile({
        path: filePath,
        data: jsonString,
        directory: Directory.External,
        encoding: Encoding.UTF8
      });

      // 获取完整URI以显示
      const uriResult = await Filesystem.getUri({
        path: filePath,
        directory: Directory.External
      });

      if (uriResult && uriResult.uri) {
        // 尝试使用FileOpener打开文件所在目录
        try {
          await FileOpener.open({
            filePath: uriResult.uri,
            contentType: 'application/json'
          });

          const copied = await copyToClipboard(uriResult.uri);
          showMessage(
            `${t('dataSettings.messages.backupSavedToDownload')}: ${uriResult.uri}${copied ? t('dataSettings.messages.copiedToClipboard') : ''}`,
            'success'
          );
        } catch (openError) {
          console.error('打开文件失败，但文件已保存:', openError);
          const copied = await copyToClipboard(uriResult.uri);
          showMessage(
            `${t('dataSettings.messages.backupSavedToDownload')}: ${uriResult.uri}${copied ? t('dataSettings.messages.copiedToClipboard') : ''}`,
            'success'
          );
        }
      } else {
        showMessage(t('dataSettings.messages.backupSavedToDownload'), 'success');
      }
    } catch (error) {
      console.error('保存到下载目录失败:', error);

      // 回退到保存到内部存储根目录
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.External,
          encoding: Encoding.UTF8
        });

        const uriResult = await Filesystem.getUri({
          path: fileName,
          directory: Directory.External
        });

        if (uriResult && uriResult.uri) {
          const copied = await copyToClipboard(uriResult.uri);
          showMessage(
            `${t('dataSettings.messages.backupSavedToRoot')}: ${uriResult.uri}${copied ? t('dataSettings.messages.copiedToClipboard') : ''}`,
            'success'
          );
        } else {
          showMessage(t('dataSettings.messages.backupSavedToRoot'), 'success');
        }
      } catch (fallbackError) {
        console.error('保存到内部存储根目录也失败:', fallbackError);
        showMessage(t('dataSettings.messages.backupFailed') + ': ' + (fallbackError as Error).message, 'error');
      }
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
            {t('dataSettings.advancedBackup.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{
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
      }}>
        <Container maxWidth="sm" sx={{ my: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: '#9333EA',
                  fontSize: '1.5rem',
                  mr: 2,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                }}
              >
                <CloudUploadIcon />
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {t('dataSettings.advancedBackup.fullBackup.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dataSettings.advancedBackup.fullBackup.description')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Alert
              severity="info"
              variant="outlined"
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  color: '#9333EA',
                }
              }}
            >
              {t('dataSettings.advancedBackup.fullBackup.info')}
            </Alert>

            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              {t('dataSettings.advancedBackup.fullBackup.selectData')}
            </Typography>

            <List sx={{ mb: 3 }}>
              <Paper
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
                <ListItem sx={{ p: 0 }}>
                  <FormControlLabel
                    control={
                      <Box sx={{ ml: 2 }}>
                        <CustomSwitch
                          checked={backupOptions.includeChats}
                          onChange={handleOptionChange('includeChats')}
                        />
                      </Box>
                    }
                    label={
                      <Box sx={{ py: 1 }}>
                        <Typography variant="body1" fontWeight={500}>{t('dataSettings.advancedBackup.fullBackup.chats.label')}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('dataSettings.advancedBackup.fullBackup.chats.description')}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%' }}
                  />
                </ListItem>
              </Paper>

              <Paper
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
                <ListItem sx={{ p: 0 }}>
                  <FormControlLabel
                    control={
                      <Box sx={{ ml: 2 }}>
                        <CustomSwitch
                          checked={backupOptions.includeAssistants}
                          onChange={handleOptionChange('includeAssistants')}
                        />
                      </Box>
                    }
                    label={
                      <Box sx={{ py: 1 }}>
                        <Typography variant="body1" fontWeight={500}>{t('dataSettings.advancedBackup.fullBackup.assistants.label')}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('dataSettings.advancedBackup.fullBackup.assistants.description')}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%' }}
                  />
                </ListItem>
              </Paper>

              <Paper
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
                <ListItem sx={{ p: 0 }}>
                  <FormControlLabel
                    control={
                      <Box sx={{ ml: 2 }}>
                        <CustomSwitch
                          checked={backupOptions.includeSettings}
                          onChange={handleOptionChange('includeSettings')}
                        />
                      </Box>
                    }
                    label={
                      <Box sx={{ py: 1 }}>
                        <Typography variant="body1" fontWeight={500}>{t('dataSettings.advancedBackup.fullBackup.settings.label')}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('dataSettings.advancedBackup.fullBackup.settings.description')}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%' }}
                  />
                </ListItem>
              </Paper>

              <Paper
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
                <ListItem sx={{ p: 0 }}>
                  <FormControlLabel
                    control={
                      <Box sx={{ ml: 2 }}>
                        <CustomSwitch
                          checked={backupOptions.includeLocalStorage}
                          onChange={handleOptionChange('includeLocalStorage')}
                        />
                      </Box>
                    }
                    label={
                      <Box sx={{ py: 1 }}>
                        <Typography variant="body1" fontWeight={500}>{t('dataSettings.advancedBackup.fullBackup.localStorage.label')}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('dataSettings.advancedBackup.fullBackup.localStorage.description')}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%' }}
                  />
                </ListItem>
              </Paper>
            </List>

            <Button
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <BackupIcon />}
              onClick={createFullBackup}
              disabled={isLoading || (!backupOptions.includeChats && !backupOptions.includeAssistants &&
                                    !backupOptions.includeSettings && !backupOptions.includeLocalStorage)}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #9333EA, #754AB4)',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(90deg, #8324DB, #6D3CAF)',
                },
              }}
            >
              {isLoading ? t('dataSettings.advancedBackup.fullBackup.creating') : t('dataSettings.advancedBackup.fullBackup.createButton')}
            </Button>
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
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
              }}
            >
              {t('dataSettings.advancedBackup.fullBackup.instructions.title')}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List disablePadding>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemIcon>
                  <SettingsBackupRestoreIcon style={{ color: '#9333EA' }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body1" fontWeight={500}>{t('dataSettings.advancedBackup.fullBackup.instructions.jsonFile.primary')}</Typography>}
                  secondary={t('dataSettings.advancedBackup.fullBackup.instructions.jsonFile.secondary')}
                  primaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>

              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemIcon>
                  <FolderIcon style={{ color: '#9333EA' }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body1" fontWeight={500}>{t('dataSettings.advancedBackup.fullBackup.instructions.cloud.primary')}</Typography>}
                  secondary={t('dataSettings.advancedBackup.fullBackup.instructions.cloud.secondary')}
                  primaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>

              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemIcon>
                  <DataSaverOnIcon style={{ color: '#9333EA' }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body1" fontWeight={500}>{t('dataSettings.advancedBackup.fullBackup.instructions.regular.primary')}</Typography>}
                  secondary={t('dataSettings.advancedBackup.fullBackup.instructions.regular.secondary')}
                  primaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Container>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SafeAreaContainer>
  );
};

export default AdvancedBackupPage;