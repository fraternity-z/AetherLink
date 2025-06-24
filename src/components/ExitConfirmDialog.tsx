import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { App } from '@capacitor/app';
import { useLocation } from 'react-router-dom';
import { useAppState } from '../shared/hooks/useAppState';

/**
 * 退出确认对话框组件
 * 当用户点击返回键时显示，询问用户是否要退出应用
 * 只在聊天页面和欢迎页面显示
 */
const ExitConfirmDialog: React.FC = () => {
  const location = useLocation();
  const { showExitConfirm, setShowExitConfirm } = useAppState();

  // 只在聊天页面和欢迎页面显示退出确认对话框
  const shouldShowDialog = showExitConfirm && (
    location.pathname === '/chat' ||
    location.pathname === '/welcome'
  );

  // 处理取消按钮点击
  const handleCancel = () => {
    setShowExitConfirm(false);
  };

  // 处理确认退出按钮点击
  const handleConfirm = () => {
    setShowExitConfirm(false);
    // 使用Capacitor API退出应用
    App.exitApp();
  };

  return (
    <Dialog
      open={shouldShowDialog}
      onClose={handleCancel}
      aria-labelledby="exit-dialog-title"
      aria-describedby="exit-dialog-description"
    >
      <DialogTitle id="exit-dialog-title">
        确认退出
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="exit-dialog-description">
          您确定要退出应用吗？
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="primary">
          取消
        </Button>
        <Button onClick={handleConfirm} color="primary" autoFocus>
          退出
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExitConfirmDialog;
