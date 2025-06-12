/**
 * 工作区设置页面
 * 显示工作区列表，提供创建、删除工作区功能
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Stack,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Plus as AddIcon,
  Folder as FolderIcon,
  Trash2 as DeleteIcon,
  ArrowLeft as ArrowBackIcon,
  Clock as AccessTimeIcon,
  FolderOpen as FolderOpenIcon
} from 'lucide-react';
import { workspaceService } from '../../shared/services/WorkspaceService';
import { WorkspaceCreateDialog } from '../../components/WorkspaceCreateDialog';
import type { Workspace } from '../../shared/types/workspace';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const WorkspaceSettings: React.FC = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);

  // 加载工作区列表
  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await workspaceService.getWorkspaces();
      setWorkspaces(result.workspaces);
    } catch (err) {
      setError('加载工作区列表失败');
      console.error('加载工作区失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // 处理返回
  const handleBack = () => {
    navigate('/settings');
  };

  // 处理创建工作区
  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    loadWorkspaces();
  };

  // 处理删除工作区
  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    try {
      const result = await workspaceService.deleteWorkspace(workspaceToDelete.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setWorkspaceToDelete(null);
        loadWorkspaces();
      } else {
        setError(result.error || '删除工作区失败');
      }
    } catch (err) {
      setError('删除工作区失败');
      console.error('删除工作区失败:', err);
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
    setDeleteDialogOpen(true);
  };

  // 进入工作区详情
  const enterWorkspace = (workspace: Workspace) => {
    navigate(`/settings/workspace/${workspace.id}`);
  };

  // 格式化文件路径显示
  const formatPath = (path: string) => {
    if (path.length > 30) {
      return `...${path.slice(-27)}`;
    }
    return path;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部导航栏 */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            工作区管理
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 主要内容 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 工作区列表 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography>加载中...</Typography>
          </Box>
        ) : workspaces.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <FolderOpenIcon size={64} style={{ color: '#666', marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              还没有工作区
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              创建工作区来管理您的文件和文档
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              创建第一个工作区
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {workspaces.map((workspace) => (
              <Card key={workspace.id} elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <FolderIcon size={20} style={{ marginRight: 8, marginTop: 4, color: '#1976d2' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {workspace.name}
                      </Typography>
                      {workspace.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {workspace.description}
                        </Typography>
                      )}
                      <Chip
                        label={formatPath(workspace.path)}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <AccessTimeIcon size={16} style={{ marginRight: 4, color: '#666' }} />
                        <Typography variant="caption" color="text.secondary">
                          {workspace.lastAccessedAt 
                            ? `最后访问 ${dayjs(workspace.lastAccessedAt).fromNow()}`
                            : `创建于 ${dayjs(workspace.createdAt).fromNow()}`
                          }
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => enterWorkspace(workspace)}
                    startIcon={<FolderOpenIcon />}
                  >
                    打开工作区
                  </Button>
                  <IconButton
                    color="error"
                    onClick={() => openDeleteDialog(workspace)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* 浮动添加按钮 */}
      {workspaces.length > 0 && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setCreateDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* 创建工作区对话框 */}
      <WorkspaceCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>删除工作区</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除工作区 "{workspaceToDelete?.name}" 吗？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            这只会删除工作区配置，不会删除实际的文件。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDeleteWorkspace} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspaceSettings;
