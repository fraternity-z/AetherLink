/**
 * 工作区详情页面
 * 显示工作区内的文件和文件夹，支持文件夹导航
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  AppBar,
  Toolbar,
  IconButton,
  Breadcrumbs,
  Link,
  Alert,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import {
  ArrowLeft as ArrowBackIcon,
  Folder as FolderIcon,
  File as FileIcon,
  Home as HomeIcon,
  ChevronRight as NavigateNextIcon,
  FolderOpen as FolderOpenIcon
} from 'lucide-react';
import { workspaceService } from '../../shared/services/WorkspaceService';
import type { Workspace, WorkspaceFile } from '../../shared/types/workspace';
import dayjs from 'dayjs';

const WorkspaceDetail: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [parentPath, setParentPath] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  // 加载工作区信息
  const loadWorkspace = async () => {
    if (!workspaceId) return;
    
    try {
      const ws = await workspaceService.getWorkspace(workspaceId);
      if (!ws) {
        setError('工作区不存在');
        return;
      }
      setWorkspace(ws);
    } catch (err) {
      setError('加载工作区信息失败');
      console.error('加载工作区失败:', err);
    }
  };

  // 加载文件列表
  const loadFiles = async (subPath: string = '') => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await workspaceService.getWorkspaceFiles(workspaceId, subPath);
      setFiles(result.files);
      setCurrentPath(result.currentPath);
      setParentPath(result.parentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文件列表失败');
      console.error('加载文件失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
    loadFiles();
  }, [workspaceId]);

  // 处理返回
  const handleBack = () => {
    navigate('/settings/workspace');
  };

  // 进入文件夹
  const enterFolder = (file: WorkspaceFile) => {
    if (!file.isDirectory) return;

    const newSubPath = currentPath === workspace?.path 
      ? file.name 
      : `${currentPath.replace(workspace?.path || '', '').replace(/^\//, '')}/${file.name}`;
    
    setPathHistory([...pathHistory, currentPath]);
    loadFiles(newSubPath);
  };

  // 返回上级目录
  const goBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      const newHistory = pathHistory.slice(0, -1);
      setPathHistory(newHistory);
      
      const subPath = previousPath === workspace?.path 
        ? '' 
        : previousPath.replace(workspace?.path || '', '').replace(/^\//, '');
      
      loadFiles(subPath);
    } else if (parentPath !== undefined) {
      loadFiles(parentPath);
    }
  };

  // 返回根目录
  const goToRoot = () => {
    setPathHistory([]);
    loadFiles();
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件图标
  const getFileIcon = (file: WorkspaceFile) => {
    if (file.isDirectory) {
      return <FolderIcon color="primary" />;
    }
    return <FileIcon color="action" />;
  };

  // 生成面包屑导航
  const generateBreadcrumbs = () => {
    if (!workspace) return [];

    const breadcrumbs = [
      {
        label: workspace.name,
        path: workspace.path,
        isRoot: true
      }
    ];

    if (currentPath !== workspace.path) {
      const relativePath = currentPath.replace(workspace.path, '').replace(/^\//, '');
      const pathParts = relativePath.split('/').filter(part => part);
      
      pathParts.forEach((part, index) => {
        breadcrumbs.push({
          label: part,
          path: `${workspace.path}/${pathParts.slice(0, index + 1).join('/')}`,
          isRoot: false
        });
      });
    }

    return breadcrumbs;
  };

  if (!workspace) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">工作区不存在</Alert>
      </Box>
    );
  }

  const breadcrumbs = generateBreadcrumbs();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部导航栏 */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" noWrap>
              {workspace.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {workspace.path}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 面包屑导航 */}
      <Paper sx={{ p: 2, borderRadius: 0 }} elevation={0}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={index}
              component="button"
              variant="body2"
              onClick={() => {
                if (crumb.isRoot) {
                  goToRoot();
                } else {
                  // 导航到特定路径的逻辑可以在这里实现
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: index === breadcrumbs.length - 1 ? 'text.primary' : 'primary.main',
                '&:hover': {
                  textDecoration: index === breadcrumbs.length - 1 ? 'none' : 'underline'
                }
              }}
            >
              {crumb.isRoot && <HomeIcon size={16} style={{ marginRight: 4 }} />}
              {crumb.label}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>

      {/* 主要内容 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 文件列表 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography>加载中...</Typography>
          </Box>
        ) : files.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8, px: 2 }}>
            <FolderOpenIcon size={64} style={{ color: '#666', marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              文件夹为空
            </Typography>
            <Typography variant="body2" color="text.secondary">
              此文件夹中没有文件或子文件夹
            </Typography>
          </Box>
        ) : (
          <List>
            {/* 返回上级目录按钮 */}
            {(pathHistory.length > 0 || parentPath !== undefined) && (
              <>
                <ListItem>
                  <ListItemButton onClick={goBack}>
                    <ListItemIcon>
                      <ArrowBackIcon />
                    </ListItemIcon>
                    <ListItemText primary="返回上级目录" />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </>
            )}

            {/* 文件和文件夹列表 */}
            {files.map((file, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => file.isDirectory ? enterFolder(file) : undefined}
                  disabled={!file.isDirectory}
                >
                  <ListItemIcon>
                    {getFileIcon(file)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" noWrap>
                          {file.name}
                        </Typography>
                        {file.isDirectory && (
                          <Chip label="文件夹" size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      !file.isDirectory && (
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)} • {dayjs(file.modifiedTime).format('YYYY-MM-DD HH:mm')}
                        </Typography>
                      )
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default WorkspaceDetail;
