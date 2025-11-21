import React, { useCallback, useEffect, useState } from 'react';
import {
  alpha,
  AppBar,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft as ArrowBackIcon,
  FolderOpen as FolderIcon,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderPlus,
  FilePlus,
  ArrowUpAZ,
  Star,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { simpleNoteService } from '../../shared/services/notes/SimpleNoteService';
import { advancedFileManagerService } from '../../shared/services/AdvancedFileManagerService';
import { toastManager } from '../../components/EnhancedToast';
import { updateSettings } from '../../shared/store/slices/settingsSlice';
import { ENABLE_NOTE_SIDEBAR_KEY } from '../../shared/services/notes/SimpleNoteService';
import type { NoteFile } from '../../shared/types/note';

interface FolderCache {
  [path: string]: NoteFile[];
}

const NoteSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 基础设置
  const [storagePath, setStoragePath] = useState<string>('');
  const [sidebarEnabled, setSidebarEnabled] = useState(false);

  // 文件管理状态
  const [folderCache, setFolderCache] = useState<FolderCache>({});
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']));
  const [loadingPaths, setLoadingPaths] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<NoteFile | null>(null);
  const [sortType, setSortType] = useState<'name' | 'date'>('name');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [createTargetDir, setCreateTargetDir] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTargetItem, setMenuTargetItem] = useState<NoteFile | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const hasStorage = Boolean(storagePath);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (hasStorage) {
      // 重置展开状态和缓存
      setExpandedPaths(new Set(['']));
      setFolderCache({});
      void loadFolder('');
    } else {
      setFolderCache({});
      setSelectedItem(null);
    }
  }, [hasStorage]);

  const loadSettings = async () => {
    const path = await simpleNoteService.getStoragePath();
    const enabled = await simpleNoteService.isSidebarEnabled();
    setStoragePath(path || '');
    setSidebarEnabled(enabled);
  };

  const handleBack = () => {
    navigate('/settings');
  };

  const handleSelectPath = async () => {
    try {
      const result = await advancedFileManagerService.openSystemFilePicker({
        type: 'directory',
        multiple: false,
        title: '选择笔记存储目录'
      });

      if (!result.cancelled && result.directories && result.directories.length > 0) {
        const selectedDir = result.directories[0];
        const pathToUse = selectedDir.displayPath || selectedDir.path || selectedDir.uri;

        if (!pathToUse) {
          toastManager.error('无法获取有效的目录路径', '错误');
          return;
        }

        await simpleNoteService.setStoragePath(pathToUse);
        setStoragePath(pathToUse);
        toastManager.success('存储路径已更新', '设置成功');
      }
    } catch (error) {
      console.error('选择目录失败:', error);
      toastManager.error('选择目录失败', '错误');
    }
  };

  const handleSidebarToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    await simpleNoteService.setSidebarEnabled(enabled);
    dispatch(updateSettings({ [ENABLE_NOTE_SIDEBAR_KEY]: enabled }));
    setSidebarEnabled(enabled);
    toastManager.success(`侧边栏入口已${enabled ? '启用' : '禁用'}`, '设置成功');
  };

  const setLoadingFlag = useCallback((path: string, value: boolean) => {
    setLoadingPaths((prev) => ({ ...prev, [path]: value }));
  }, []);

  const loadFolder = useCallback(async (path: string) => {
    setLoadingFlag(path, true);
    try {
      const items = await simpleNoteService.listNotes(path);
      setFolderCache((prev) => ({ ...prev, [path]: items }));
    } catch (error) {
      console.error(`加载目录 ${path} 失败:`, error);
      toastManager.error('加载目录失败', '错误');
    } finally {
      setLoadingFlag(path, false);
    }
  }, [setLoadingFlag]);

  const refreshFolder = async (path: string) => {
    await loadFolder(path);
  };

  const getParentPath = (path: string) => {
    if (!path) return '';
    return path.split('/').slice(0, -1).join('/');
  };

  const handleToggleFolder = async (path: string) => {
    const nextExpanded = new Set(expandedPaths);
    if (nextExpanded.has(path)) {
      nextExpanded.delete(path);
    } else {
      nextExpanded.add(path);
      if (!folderCache[path]) {
        await loadFolder(path);
      }
    }
    setExpandedPaths(nextExpanded);
  };

  const openCreateDialog = (type: 'file' | 'folder') => {
    if (!hasStorage) {
      toastManager.warning('请先设置存储目录', '提示');
      return;
    }
    let targetDir = '';
    if (selectedItem) {
      targetDir = selectedItem.isDirectory ? selectedItem.path : getParentPath(selectedItem.path);
    }
    setCreateTargetDir(targetDir);
    setCreateType(type);
    setNewItemName('');
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!newItemName) return;
    try {
      if (createType === 'folder') {
        await simpleNoteService.createFolder(createTargetDir, newItemName);
      } else {
        await simpleNoteService.createNote(createTargetDir, newItemName);
      }
      setCreateDialogOpen(false);
      setNewItemName('');
      await refreshFolder(createTargetDir);
      toastManager.success('创建成功', '成功');
    } catch (error) {
      console.error('创建失败:', error);
      toastManager.error('创建失败', '错误');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: NoteFile) => {
    event.stopPropagation();
    event.preventDefault();
    setMenuAnchorEl(event.currentTarget);
    setMenuTargetItem(item);
    setNewItemName(item.name);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleRename = async () => {
    if (!menuTargetItem || !newItemName) {
      console.log('重命名条件不满足:', { menuTargetItem, newItemName });
      return;
    }
    
    console.log('开始重命名:', { path: menuTargetItem.path, newName: newItemName });
    
    try {
      await simpleNoteService.renameItem(menuTargetItem.path, newItemName);
      setRenameDialogOpen(false);
      setNewItemName('');
      await refreshFolder(getParentPath(menuTargetItem.path));
      toastManager.success('重命名成功', '成功');
    } catch (error) {
      console.error('重命名失败:', error);
      toastManager.error(`重命名失败: ${error instanceof Error ? error.message : String(error)}`, '错误');
    }
  };

  const handleDelete = async () => {
    if (!menuTargetItem) return;
    try {
      await simpleNoteService.deleteItem(menuTargetItem.path, menuTargetItem.isDirectory);
      setDeleteDialogOpen(false);
      await refreshFolder(getParentPath(menuTargetItem.path));
      if (selectedItem?.path === menuTargetItem.path) {
        setSelectedItem(null);
      }
      toastManager.success('删除成功', '成功');
    } catch (error) {
      toastManager.error('删除失败', '错误');
    }
  };

  const handleFileClick = (item: NoteFile) => {
    setSelectedItem(item);
    if (item.isDirectory) {
      void handleToggleFolder(item.path);
    } else {
      // 跳转到编辑器页面
      navigate(`/settings/notes/edit?path=${encodeURIComponent(item.path)}&name=${encodeURIComponent(item.name)}`);
    }
  };

  const filteredItems = useCallback((items: NoteFile[]) => {
    let result = [...items];
    result.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      if (sortType === 'date') {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(lower));
    }
    return result;
  }, [sortType, searchQuery]);

  const renderTree = useCallback((path: string, level: number = 0) => {
    const items = folderCache[path];
    if (!items) {
      if (loadingPaths[path]) {
        return (
          <ListItem disablePadding sx={{ pl: 2 + level * 2 }}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption">加载中...</Typography>
                </Box>
              }
            />
          </ListItem>
        );
      }
      return null;
    }

    const itemsToRender = filteredItems(items);

    if (itemsToRender.length === 0 && level === 0 && !searchQuery) {
      return (
        <ListItem>
          <ListItemText primary={<Typography color="text.secondary">暂无笔记</Typography>} />
        </ListItem>
      );
    }

    return itemsToRender.map((item) => {
      const isExpanded = expandedPaths.has(item.path);
      const isSelected = selectedItem?.path === item.path;
      return (
        <React.Fragment key={item.path}>
          <ListItem
            disablePadding
            sx={{ display: 'block' }}
            onContextMenu={(event) => handleMenuOpen(event, item)}
          >
            <ListItemButton
              selected={isSelected}
              onClick={() => handleFileClick(item)}
              sx={{
                pl: 1.5 + level * 2,
                pr: 1,
                minHeight: 34,
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0.5 }}>
                <Box sx={{ width: 18, display: 'flex', justifyContent: 'center' }}>
                  {item.isDirectory && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </Box>
                <Box sx={{ color: item.isDirectory ? '#FBC02D' : '#42A5F5', display: 'flex' }}>
                  {item.isDirectory ? <Folder size={16} /> : <FileText size={16} />}
                </Box>
                <ListItemText
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                  primary={item.name}
                />
                <IconButton size="small" onClick={(event) => handleMenuOpen(event, item)}>
                  <MoreVertical size={14} />
                </IconButton>
              </Box>
            </ListItemButton>
          </ListItem>
          {item.isDirectory && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding dense>
                {renderTree(item.path, level + 1)}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  }, [expandedPaths, filteredItems, handleFileClick, selectedItem?.path, folderCache, loadingPaths, searchQuery]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: (theme) => theme.palette.mode === 'light'
          ? alpha(theme.palette.primary.main, 0.02)
          : alpha(theme.palette.background.default, 0.9),
      }}
    >
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
          <IconButton edge="start" onClick={handleBack} aria-label="back" sx={{ color: 'primary.main' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            笔记设置
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 1, sm: 2 }, mt: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <List>
            <ListItem>
              <ListItemText
                primary="存储位置"
                secondary={storagePath || '未设置，请选择存储目录'}
                secondaryTypographyProps={{
                  sx: {
                    wordBreak: 'break-all',
                    color: storagePath ? 'text.secondary' : 'error.main'
                  }
                }}
              />
              <ListItemSecondaryAction>
                <Button variant="outlined" size="small" startIcon={<FolderIcon size={16} />} onClick={handleSelectPath}>
                  选择目录
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="侧边栏入口" secondary="在聊天界面侧边栏显示笔记 Tab" />
              <ListItemSecondaryAction>
                <Switch edge="end" checked={sidebarEnabled} onChange={handleSidebarToggle} />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: 420 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                笔记文件
              </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="新建笔记">
                <IconButton size="small" onClick={() => openCreateDialog('file')}>
                  <FilePlus size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="新建文件夹">
                <IconButton size="small" onClick={() => openCreateDialog('folder')}>
                  <FolderPlus size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="切换排序">
                <IconButton size="small" color={sortType === 'date' ? 'primary' : 'default'} onClick={() => setSortType(sortType === 'name' ? 'date' : 'name')}>
                  <ArrowUpAZ size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="收藏（即将推出）">
                <IconButton size="small">
                  <Star size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="搜索">
                <IconButton size="small" color={searchOpen ? 'primary' : 'default'} onClick={() => setSearchOpen((prev) => !prev)}>
                  <Search size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Collapse in={searchOpen} unmountOnExit>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <TextField
                size="small"
                fullWidth
                placeholder="搜索笔记名称..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                InputProps={{ startAdornment: <Search size={14} style={{ marginRight: 6, opacity: 0.6 }} /> }}
              />
            </Box>
          </Collapse>

          {!hasStorage ? (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 3 }}>
              <Typography color="text.secondary">请先选择存储目录以管理笔记</Typography>
              <Button variant="contained" onClick={handleSelectPath} startIcon={<FolderIcon size={16} />}>
                立即设置
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <List dense disablePadding>
                  {renderTree('')}
                </List>
              </Box>
              <Box
                sx={{
                  m: 1.5,
                  p: 1.5,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                  bgcolor: 'action.hover',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main'
                  }
                }}
              >
                <UploadCloud size={16} />
                拖拽 .md 文件或目录到此处导入（即将支持）
              </Box>
            </>
          )}
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          注意：笔记功能依赖于本地文件系统访问权限。请确保已授予应用相应的存储权限。
        </Typography>
      </Box>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { 
          if (menuTargetItem) {
            setNewItemName(menuTargetItem.name);
          }
          setRenameDialogOpen(true); 
          handleMenuClose(); 
        }}>
          <ListItemIcon>
            <Edit2 size={14} />
          </ListItemIcon>
          重命名
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Trash2 size={14} color="var(--mui-palette-error-main)" />
          </ListItemIcon>
          删除
        </MenuItem>
      </Menu>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>新建{createType === 'folder' ? '文件夹' : '笔记'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="名称"
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
          />
          {createTargetDir && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              位置：{createTargetDir || '根目录'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button onClick={handleCreate} variant="contained">创建</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>重命名</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="新名称"
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleRename()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>取消</Button>
          <Button onClick={handleRename} variant="contained">确定</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs">
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除 "{menuTargetItem?.name}" 吗？
            {menuTargetItem?.isDirectory && ' 该文件夹内的所有内容也将被删除。'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained">删除</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NoteSettings;
