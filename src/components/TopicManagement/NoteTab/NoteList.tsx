import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  IconButton,
  Typography,
  Breadcrumbs,
  Link,
  Menu,
  MenuItem,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import BackButtonDialog from '../../common/BackButtonDialog';
import {
  Folder as FolderIcon,
  FileText as FileIcon,
  MoreVertical,
  Plus,
  FolderPlus,
  ArrowLeft,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { simpleNoteService } from '../../../shared/services/notes/SimpleNoteService';
import type { NoteFile } from '../../../shared/types/note';
import { toastManager } from '../../EnhancedToast';

interface NoteListProps {
  onSelectNote: (path: string) => void;
}

const NoteList: React.FC<NoteListProps> = ({ onSelectNote }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [notes, setNotes] = useState<NoteFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<NoteFile | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [newItemName, setNewItemName] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Config check
  const [hasConfig, setHasConfig] = useState(true);

  useEffect(() => {
    checkConfig();
  }, []);

  useEffect(() => {
    if (hasConfig) {
      loadNotes();
    }
  }, [currentPath, hasConfig]);

  const checkConfig = async () => {
    const valid = await simpleNoteService.hasValidConfig();
    setHasConfig(valid);
    if (!valid) {
      toastManager.warning('请先在设置中配置笔记存储路径', '配置缺失');
    }
  };

  const loadNotes = async () => {
    setLoading(true);
    try {
      const items = await simpleNoteService.listNotes(currentPath);
      setNotes(items);
    } catch (error) {
      console.error('加载笔记失败:', error);
      toastManager.error('加载笔记失败', '错误');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: NoteFile) => {
    if (item.isDirectory) {
      setCurrentPath(currentPath ? `${currentPath}/${item.name}` : item.name);
    } else {
      onSelectNote(currentPath ? `${currentPath}/${item.name}` : item.name);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath('');
    } else {
      const parts = currentPath.split('/');
      setCurrentPath(parts.slice(0, index + 1).join('/'));
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: NoteFile) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedItem(null);
  };

  const handleOpenCreateDialog = (type: 'file' | 'folder') => {
    setCreateType(type);
    setNewItemName('');
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!newItemName) return;
    try {
      if (createType === 'folder') {
        await simpleNoteService.createFolder(currentPath, newItemName);
      } else {
        await simpleNoteService.createNote(currentPath, newItemName);
      }
      setCreateDialogOpen(false);
      setNewItemName('');
      loadNotes();
      toastManager.success(`${createType === 'folder' ? '文件夹' : '笔记'}创建成功`, '成功');
    } catch (error) {
      console.error('创建失败:', error);
      toastManager.error('创建失败: ' + (error instanceof Error ? error.message : String(error)), '错误');
    }
  };

  const handleOpenRenameDialog = () => {
    if (selectedItem) {
      setNewItemName(selectedItem.name);
      setRenameDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleRename = async () => {
    if (!selectedItem || !newItemName) {
      console.log('重命名条件不满足:', { selectedItem, newItemName });
      return;
    }
    
    const oldPath = currentPath ? `${currentPath}/${selectedItem.name}` : selectedItem.name;
    console.log('开始重命名:', { oldPath, newName: newItemName });
    
    try {
      await simpleNoteService.renameItem(oldPath, newItemName);
      setRenameDialogOpen(false);
      setNewItemName('');
      loadNotes();
      toastManager.success('重命名成功', '成功');
    } catch (error) {
      console.error('重命名失败:', error);
      toastManager.error(`重命名失败: ${error instanceof Error ? error.message : String(error)}`, '错误');
    }
  };

  const handleOpenDeleteDialog = () => {
    if (selectedItem) {
      setDeleteDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      const path = currentPath ? `${currentPath}/${selectedItem.name}` : selectedItem.name;
      await simpleNoteService.deleteItem(path, selectedItem.isDirectory);
      setDeleteDialogOpen(false);
      loadNotes();
      toastManager.success('删除成功', '成功');
    } catch (error) {
      console.error('删除失败:', error);
      toastManager.error('删除失败', '错误');
    }
  };

  if (!hasConfig) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary" gutterBottom>
          未配置笔记存储路径
        </Typography>
        <Button variant="contained" href="/settings/notes">
          去配置
        </Button>
      </Box>
    );
  }

  const pathParts = currentPath ? currentPath.split('/') : [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
        {currentPath && (
          <IconButton onClick={() => handleBreadcrumbClick(pathParts.length - 2)} size="small">
            <ArrowLeft size={18} />
          </IconButton>
        )}
        
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Breadcrumbs 
            maxItems={3} 
            itemsBeforeCollapse={1}
            itemsAfterCollapse={1}
            separator="›"
            sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
          >
            <Link
              component="button"
              color="inherit"
              onClick={() => handleBreadcrumbClick(-1)}
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <FolderIcon size={16} style={{ marginRight: 4 }} />
              根目录
            </Link>
            {pathParts.map((part, index) => (
              <Typography key={index} color="text.primary" noWrap sx={{ maxWidth: 100 }}>
                {part}
              </Typography>
            ))}
          </Breadcrumbs>
        </Box>

        <Tooltip title="刷新">
          <IconButton onClick={loadNotes} size="small">
            <RefreshCw size={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title="新建文件夹">
          <IconButton onClick={() => handleOpenCreateDialog('folder')} size="small">
            <FolderPlus size={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title="新建笔记">
          <IconButton onClick={() => handleOpenCreateDialog('file')} size="small" color="primary">
            <Plus size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notes.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">空文件夹</Typography>
          </Box>
        ) : (
          <List dense>
            {notes.map((item) => (
              <ListItem
                key={item.id || item.name}
                disablePadding
                secondaryAction={
                  <IconButton edge="end" onClick={(e) => handleMenuOpen(e, item)} size="small">
                    <MoreVertical size={16} />
                  </IconButton>
                }
              >
                <ListItemButton onClick={() => handleItemClick(item)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {item.isDirectory ? (
                      <FolderIcon size={20} color="#FBC02D" />
                    ) : (
                      <FileIcon size={20} color="#42A5F5" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    secondary={item.size ? `${(item.size / 1024).toFixed(1)} KB` : null}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenRenameDialog}>
          <ListItemIcon><Edit2 size={16} /></ListItemIcon>
          重命名
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog} sx={{ color: 'error.main' }}>
          <ListItemIcon><Trash2 size={16} color="var(--mui-palette-error-main)" /></ListItemIcon>
          删除
        </MenuItem>
      </Menu>

      {/* Create Dialog */}
      <BackButtonDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>新建{createType === 'folder' ? '文件夹' : '笔记'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="名称"
            fullWidth
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button onClick={handleCreate} variant="contained">创建</Button>
        </DialogActions>
      </BackButtonDialog>

      {/* Rename Dialog */}
      <BackButtonDialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>重命名</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="新名称"
            fullWidth
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>取消</Button>
          <Button onClick={handleRename} variant="contained">确定</Button>
        </DialogActions>
      </BackButtonDialog>

      {/* Delete Dialog */}
      <BackButtonDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除 "{selectedItem?.name}" 吗？
            {selectedItem?.isDirectory && " 该文件夹内的所有内容也将被删除。"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained">删除</Button>
        </DialogActions>
      </BackButtonDialog>
    </Box>
  );
};

export default NoteList;