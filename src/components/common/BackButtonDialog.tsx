import React, { useId } from 'react';
import { Dialog } from '@mui/material';
import type { DialogProps } from '@mui/material';
import { useDialogBackHandler } from '../../hooks/useDialogBackHandler';

/**
 * 支持返回键关闭的 Dialog 组件
 * 
 * 封装 MUI Dialog，自动集成 Android 返回键处理
 * 当用户按下返回键时，会自动关闭此对话框
 * 
 * 使用方式与 MUI Dialog 完全相同，只需将 Dialog 替换为 BackButtonDialog
 * 
 * @example
 * <BackButtonDialog open={open} onClose={handleClose}>
 *   <DialogTitle>标题</DialogTitle>
 *   <DialogContent>内容</DialogContent>
 * </BackButtonDialog>
 */
interface BackButtonDialogProps extends DialogProps {
  /**
   * 可选的对话框 ID，用于标识对话框
   * 如果不提供，会自动生成唯一 ID
   */
  dialogId?: string;
}

const BackButtonDialog: React.FC<BackButtonDialogProps> = ({
  dialogId,
  open,
  onClose,
  children,
  slotProps,
  ...props
}) => {
  // 自动生成唯一 ID（如果未提供）
  const autoId = useId();
  const id = dialogId || `dialog-${autoId}`;
  
  // 包装 onClose 函数，因为 MUI Dialog 的 onClose 接收事件和原因参数
  const handleClose = () => {
    // 关闭前移除焦点，避免 aria-hidden 警告
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (onClose) {
      // 调用 MUI Dialog 的 onClose，传递空事件和 'escapeKeyDown' 原因
      onClose({} as React.SyntheticEvent, 'escapeKeyDown');
    }
  };
  
  // 使用返回键处理 Hook
  useDialogBackHandler(id, open, handleClose);
  
  // 合并 slotProps，确保在过渡动画退出前移除焦点
  const mergedSlotProps = {
    ...slotProps,
    backdrop: {
      ...slotProps?.backdrop,
      onExited: () => {
        // 在退出动画结束时移除焦点
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      slotProps={mergedSlotProps}
      disableRestoreFocus
      {...props}
    >
      {children}
    </Dialog>
  );
};

export default BackButtonDialog;
