import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Button
} from '@mui/material';
import { useTranslation } from '../../../../../i18n';
import {
  RotateCcw as RestoreIcon,
  Trash2 as DeleteIcon,
  ExternalLink as OpenInNewIcon,
  RefreshCw as RefreshIcon
} from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { performFullRestore } from '../../utils/restoreUtils';

// 备份文件接口
interface BackupFile {
  name: string;
  path: string;
  uri: string;
  ctime: number;
  directory?: string; // 添加文件所在目录信息
}

interface BackupFilesListProps {
  onRestoreSuccess: (message: string) => void;
  onRestoreError: (message: string) => void;
  onFileDeleted: () => void;
  refreshTrigger?: number; // 刷新触发器
}

/**
 * 备份文件列表组件
 */
const BackupFilesList: React.FC<BackupFilesListProps> = ({
  onRestoreSuccess,
  onRestoreError,
  onFileDeleted,
  refreshTrigger = 0
}) => {
  const { t } = useTranslation();
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [restoreProgress, setRestoreProgress] = useState({
    active: false,
    stage: '',
    progress: 0
  });

  // 需要搜索的目录列表
  const directories = [
    { path: 'Download', directory: Directory.External, label: '下载目录' },
    { path: '', directory: Directory.External, label: '存储根目录' },
    { path: 'AetherLink/backups', directory: Directory.External, label: '应用备份目录' },
    { path: 'data/bin.mt.plus/temp/CleanOnExit', directory: Directory.External, label: '清理缓存目录' },
    { path: '', directory: Directory.Documents, label: '文档目录' }
  ];

  // 加载备份文件列表 - 使用useCallback以便可以在外部调用
  const loadBackupFiles = useCallback(async () => {
    try {
      setLoading(true);
      let allFiles: BackupFile[] = [];

      // 搜索多个目录
      for (const dir of directories) {
        try {
          // 列出目录中的备份文件
          const result = await Filesystem.readdir({
            path: dir.path,
            directory: dir.directory
          });

          if (!result.files) continue;

          // 过滤AetherLink备份文件
          const backups = result.files
            .filter(file => file.name && file.name.startsWith('AetherLink_Backup') && file.name.endsWith('.json'))
            .map(file => ({
              name: file.name,
              path: file.uri.split('/').pop() || file.name,
              uri: file.uri,
              ctime: file.mtime || Date.now(), // 使用修改时间或当前时间
              directory: dir.label // 记录文件所在目录
            }));

          allFiles = [...allFiles, ...backups];
          console.log(`在${dir.label}中找到${backups.length}个备份文件`);
        } catch (error) {
          // 忽略目录不存在等错误，继续检查下一个目录
          console.log(`搜索${dir.label}失败:`, error);
        }
      }

      // 按时间降序排序
      allFiles.sort((a, b) => b.ctime - a.ctime);
      console.log(`总共找到${allFiles.length}个备份文件`);

      setBackupFiles(allFiles);
    } catch (error) {
      console.error('加载备份文件失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载和刷新触发时重新加载
  useEffect(() => {
    loadBackupFiles();
  }, [loadBackupFiles, refreshTrigger]);

  // 手动刷新列表
  const handleRefresh = () => {
    loadBackupFiles();
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    if (!timestamp) return t('dataSettings.messages.dateUnknown');

    try {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return t('dataSettings.messages.dateInvalid');
    }
  };

  // 从文件路径提取备份类型
  const getBackupType = (fileName: string) => {
    if (fileName.includes('_Full_')) return t('dataSettings.backupFilesList.types.full');
    if (fileName.includes('_Custom_')) return t('dataSettings.backupFilesList.types.custom');
    return t('dataSettings.backupFilesList.types.basic');
  };

  // 打开文件
  const handleOpenFile = async (file: BackupFile) => {
    try {
      await FileOpener.open({
        filePath: file.uri,
        contentType: 'application/json'
      });
    } catch (error) {
      console.error('打开文件失败:', error);
      onRestoreError(t('dataSettings.messages.fileNotFound'));
    }
  };

  // 读取文件内容并恢复
  const handleRestoreFile = async (file: BackupFile) => {
    try {
      setProcessingFile(file.name);
      setRestoreProgress({
        active: true,
        stage: t('dataSettings.restoreProgress.readingFile'),
        progress: 0.05
      });

      // 获取文件内容
      const fileContent = await Filesystem.readFile({
        path: file.path,
        directory: Directory.External,
        encoding: Encoding.UTF8
      });

      if (!fileContent.data) {
        throw new Error(t('dataSettings.messages.fileEmpty'));
      }

      // 确保我们有字符串类型
      const jsonString = typeof fileContent.data === 'string'
        ? fileContent.data
        : JSON.stringify(fileContent.data);

      // 解析JSON数据
      const backupData = JSON.parse(jsonString);

      setRestoreProgress({
        active: true,
        stage: t('dataSettings.restoreProgress.validating'),
        progress: 0.1
      });

      // 使用新的完整恢复过程
      const result = await performFullRestore(backupData, (stage, progress) => {
        setRestoreProgress({
          active: true,
          stage,
          progress
        });
      });

      // 处理恢复结果
      if (result.success) {
        // 生成成功消息
        let restoreMessage = '';

        if (result.topicsCount > 0) {
          restoreMessage += `• ${t('dataSettings.restoreProgress.restoredTopics', { count: result.topicsCount })}\n`;
        }

        if (result.assistantsCount > 0) {
          restoreMessage += `• ${t('dataSettings.restoreProgress.restoredAssistants', { count: result.assistantsCount })}\n`;
        }

        if (result.settingsRestored) {
          restoreMessage += `• ${t('dataSettings.restoreProgress.restoredSettings')}\n`;
        }

        if (result.localStorageCount > 0) {
          restoreMessage += `• ${t('dataSettings.restoreProgress.restoredLocalStorage', { count: result.localStorageCount })}\n`;
        }

        onRestoreSuccess(`${t('dataSettings.restoreProgress.success.full')}\n${restoreMessage}\n${t('dataSettings.restoreProgress.restartRequired')}`);
      } else {
        // 显示错误信息
        onRestoreError(`${t('dataSettings.messages.restoreFailed')}: ${result.error || t('dataSettings.errors.unknown')}`);
      }
    } catch (error) {
      console.error('从文件恢复失败:', error);
      onRestoreError(`${t('dataSettings.messages.restoreFailed')}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setProcessingFile(null);
      // 恢复完成后重置进度条
      setTimeout(() => {
        setRestoreProgress({
          active: false,
          stage: '',
          progress: 0
        });
      }, 1000);
    }
  };

  // 删除备份文件
  const handleDeleteFile = async (file: BackupFile) => {
    try {
      setProcessingFile(file.name);

      await Filesystem.deleteFile({
        path: file.path,
        directory: Directory.External
      });

      // 刷新文件列表
      setBackupFiles(prev => prev.filter(f => f.name !== file.name));
      onFileDeleted();
    } catch (error) {
      console.error('删除文件失败:', error);
      onRestoreError(`${t('dataSettings.webdav.backupManager.errors.deleteFailed')}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setProcessingFile(null);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mt: 3,
        mb: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          {t('dataSettings.backupFilesList.title')}
        </Typography>

        <Button
          startIcon={<RefreshIcon size={16} />}
          onClick={handleRefresh}
          size="small"
          disabled={loading}
          sx={{
            color: '#9333EA',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(147, 51, 234, 0.08)'
            }
          }}
        >
          {t('dataSettings.backupFilesList.refresh')}
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 恢复进度 */}
      {restoreProgress.active && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {restoreProgress.stage}
          </Typography>
          <Box sx={{
            height: 6,
            width: '100%',
            bgcolor: '#E9D5FF',
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            {/* 🚀 性能优化：使用 transform: scaleX 替代 width 动画，避免重排 */}
            <Box
              sx={{
                height: '100%',
                width: '100%',
                bgcolor: '#9333EA',
                borderRadius: 3,
                transformOrigin: 'left center',
                transform: `scaleX(${restoreProgress.progress})`,
                transition: 'transform 0.3s ease-in-out',
                willChange: 'transform'
              }}
            />
          </Box>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} sx={{ color: '#9333EA' }} />
        </Box>
      ) : backupFiles.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('dataSettings.backupFilesList.noFiles')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
            {t('dataSettings.backupFilesList.noFilesHint')}
          </Typography>
        </Box>
      ) : (
        <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
          {backupFiles.map((file) => (
            <Box key={file.uri}>
              <ListItem
                sx={{
                  py: 1.5,
                  '& .MuiListItemText-root': {
                    maxWidth: 'calc(100% - 120px)' // 为按钮留出足够空间
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span" variant="body1" sx={{ fontWeight: 500 }}>
                        {getBackupType(file.name)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box component="div">
                      <Tooltip title={file.name} placement="top">
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{
                            display: 'block',
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%'
                          }}
                        >
                          {formatDate(file.ctime)}
                        </Typography>
                      </Tooltip>
                      {file.directory && (
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{
                            display: 'block',
                            fontSize: '0.7rem',
                            color: 'text.secondary',
                            mt: 0.5
                          }}
                        >
                          {t('dataSettings.backupFilesList.location')}: {file.directory}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
                <ListItemSecondaryAction sx={{ right: 8 }}>
                  <Tooltip title={t('dataSettings.backupFilesList.actions.restore')}>
                    <IconButton
                      size="small"
                      aria-label="restore"
                      onClick={() => handleRestoreFile(file)}
                      disabled={!!processingFile}
                      sx={{
                        color: '#9333EA',
                        padding: '4px'
                      }}
                    >
                      {processingFile === file.name ? (
                        <CircularProgress size={20} sx={{ color: '#9333EA' }} />
                      ) : (
                        <RestoreIcon size={16} />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('dataSettings.backupFilesList.actions.open')}>
                    <IconButton
                      size="small"
                      aria-label="open"
                      onClick={() => handleOpenFile(file)}
                      disabled={!!processingFile}
                      sx={{
                        color: 'text.secondary',
                        padding: '4px',
                        ml: 0.5
                      }}
                    >
                      <OpenInNewIcon size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('dataSettings.backupFilesList.actions.delete')}>
                    <IconButton
                      size="small"
                      aria-label="delete"
                      onClick={() => handleDeleteFile(file)}
                      disabled={!!processingFile}
                      sx={{
                        color: 'error.main',
                        padding: '4px',
                        ml: 0.5
                      }}
                    >
                      <DeleteIcon size={16} />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </Box>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default BackupFilesList;