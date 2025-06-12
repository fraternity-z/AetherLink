/**
 * 工作区创建对话框
 * 提供创建新工作区的界面，包括预设文件夹选择和自定义路径输入
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Icon
} from '@mui/material';
import {
  Folder as FolderIcon,
  Download as DownloadIcon,
  FileText as DescriptionIcon,
  Image as ImageIcon,
  Camera as CameraAltIcon,
  Music as MusicNoteIcon,
  FolderOpen as FolderOpenIcon
} from 'lucide-react';
import { workspaceService } from '../shared/services/WorkspaceService';
import type { PresetFolder, WorkspaceCreateRequest } from '../shared/types/workspace';

interface WorkspaceCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = ['选择文件夹', '配置工作区'];

const iconMap: Record<string, React.ReactElement> = {
  download: <DownloadIcon />,
  description: <DescriptionIcon />,
  image: <ImageIcon />,
  camera_alt: <CameraAltIcon />,
  music_note: <MusicNoteIcon />,
  folder_open: <FolderOpenIcon />
};

export const WorkspaceCreateDialog: React.FC<WorkspaceCreateDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState<PresetFolder | null>(null);
  const [customPath, setCustomPath] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const presetFolders = workspaceService.getPresetFolders();

  // 重置对话框状态
  const resetDialog = () => {
    setActiveStep(0);
    setSelectedFolder(null);
    setCustomPath('');
    setWorkspaceName('');
    setWorkspaceDescription('');
    setError(null);
    setLoading(false);
    setValidating(false);
  };

  // 处理关闭
  const handleClose = () => {
    if (!loading) {
      resetDialog();
      onClose();
    }
  };

  // 选择预设文件夹
  const selectPresetFolder = (folder: PresetFolder) => {
    setSelectedFolder(folder);
    setError(null);
    
    // 如果是自定义路径，不自动进入下一步
    if (folder.path === '') {
      return;
    }
    
    // 自动生成工作区名称
    if (!workspaceName) {
      setWorkspaceName(folder.label);
    }
    
    // 进入下一步
    setActiveStep(1);
  };

  // 验证自定义路径
  const validateCustomPath = async () => {
    if (!customPath.trim()) {
      setError('请输入文件夹路径');
      return false;
    }

    setValidating(true);
    setError(null);

    try {
      const result = await workspaceService.validateFolderPath(customPath);
      if (!result.success) {
        setError(result.error || '路径验证失败');
        return false;
      }
      
      // 验证成功，进入下一步
      setSelectedFolder({
        label: '自定义路径',
        path: customPath,
        description: `自定义路径: ${customPath}`,
        icon: 'folder_open'
      });
      
      if (!workspaceName) {
        // 从路径中提取文件夹名作为默认名称
        const folderName = customPath.split('/').pop() || '自定义工作区';
        setWorkspaceName(folderName);
      }
      
      setActiveStep(1);
      return true;
    } catch (err) {
      setError('路径验证失败，请重试');
      return false;
    } finally {
      setValidating(false);
    }
  };

  // 创建工作区
  const createWorkspace = async () => {
    if (!selectedFolder || !workspaceName.trim()) {
      setError('请填写完整信息');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: WorkspaceCreateRequest = {
        name: workspaceName.trim(),
        path: selectedFolder.path === '' ? customPath : selectedFolder.path,
        description: workspaceDescription.trim() || undefined
      };

      const result = await workspaceService.createWorkspace(request);
      
      if (result.success) {
        resetDialog();
        onSuccess();
      } else {
        setError(result.error || '创建工作区失败');
      }
    } catch (err) {
      setError('创建工作区失败，请重试');
      console.error('创建工作区失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 返回上一步
  const handleBack = () => {
    setActiveStep(activeStep - 1);
    setError(null);
  };

  // 下一步
  const handleNext = () => {
    if (activeStep === 0) {
      if (selectedFolder?.path === '') {
        validateCustomPath();
      } else {
        setActiveStep(1);
      }
    } else {
      createWorkspace();
    }
  };

  const canProceed = () => {
    if (activeStep === 0) {
      return selectedFolder && (selectedFolder.path !== '' || customPath.trim());
    } else {
      return workspaceName.trim();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">创建新工作区</Typography>
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
              选择要作为工作区的文件夹：
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {presetFolders.map((folder) => (
                <Box key={folder.path || 'custom'}>
                  <Card 
                    variant={selectedFolder?.path === folder.path ? "outlined" : "elevation"}
                    sx={{ 
                      border: selectedFolder?.path === folder.path ? 2 : 0,
                      borderColor: 'primary.main'
                    }}
                  >
                    <CardActionArea onClick={() => selectPresetFolder(folder)}>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Icon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }}>
                          {iconMap[folder.icon] || <FolderIcon />}
                        </Icon>
                        <Typography variant="subtitle1" gutterBottom>
                          {folder.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {folder.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Box>
              ))}
            </Box>

            {selectedFolder?.path === '' && (
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="文件夹路径"
                  placeholder="例如: Download/MyFiles"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  helperText="输入相对于外部存储根目录的路径"
                  disabled={validating}
                />
              </Box>
            )}
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
              配置工作区信息：
            </Typography>
            
            <TextField
              fullWidth
              label="工作区名称"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              fullWidth
              label="描述（可选）"
              value={workspaceDescription}
              onChange={(e) => setWorkspaceDescription(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            {selectedFolder && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>文件夹路径：</strong> {selectedFolder.path || customPath}
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            上一步
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={!canProceed() || loading || validating}
          startIcon={loading || validating ? <CircularProgress size={16} /> : undefined}
        >
          {validating ? '验证中...' : loading ? '创建中...' : activeStep === steps.length - 1 ? '创建工作区' : '下一步'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
