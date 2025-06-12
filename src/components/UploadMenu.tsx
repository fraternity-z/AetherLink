import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Image, Camera, FileText, ArrowLeftRight } from 'lucide-react';

interface UploadMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onImageUpload: (source: 'camera' | 'photos') => void;
  onFileUpload: () => void;
  onMultiModelSend?: () => void;
  showMultiModel?: boolean;
}

const UploadMenu: React.FC<UploadMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onImageUpload,
  onFileUpload,
  onMultiModelSend,
  showMultiModel = false,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      disableAutoFocus={true}
      disableRestoreFocus={true}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      sx={{
        '& .MuiPaper-root': {
          minWidth: '200px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        },
      }}
    >
      <MenuItem
        onClick={() => {
          onImageUpload('photos');
          onClose();
        }}
        sx={{ py: 1.5 }}
      >
        <ListItemIcon>
          <Image size={20} color="#1976d2" />
        </ListItemIcon>
        <ListItemText primary="从相册选择图片" />
      </MenuItem>

      <MenuItem
        onClick={() => {
          onImageUpload('camera');
          onClose();
        }}
        sx={{ py: 1.5 }}
      >
        <ListItemIcon>
          <Camera size={20} color="#9c27b0" />
        </ListItemIcon>
        <ListItemText primary="拍摄照片" />
      </MenuItem>

      <MenuItem
        onClick={() => {
          onFileUpload();
          onClose();
        }}
        sx={{ py: 1.5 }}
      >
        <ListItemIcon>
          <FileText size={20} color="#4caf50" />
        </ListItemIcon>
        <ListItemText primary="上传文件" />
      </MenuItem>

      {/* 多模型选项 */}
      {showMultiModel && onMultiModelSend && (
        <>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() => {
              onMultiModelSend();
              onClose();
            }}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <ArrowLeftRight size={20} color="#FF9800" />
            </ListItemIcon>
            <ListItemText
              primary="发送到多个模型"
              secondary="同时向多个AI模型发送消息"
              sx={{
                '& .MuiListItemText-secondary': {
                  fontSize: '0.75rem',
                  color: 'text.secondary'
                }
              }}
            />
          </MenuItem>
        </>
      )}
    </Menu>
  );
};

export default UploadMenu;