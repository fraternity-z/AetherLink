import { useEffect, useRef, useCallback } from 'react';
import { useAppState } from '../shared/hooks/useAppState';

/**
 * 对话框返回键处理Hook
 * 自动管理对话框的打开/关闭状态，并处理返回键事件
 * 
 * 重构改进：
 * 1. 移除自定义事件系统，使用回调模式
 * 2. 使用 useRef 保持 onClose 回调的稳定性
 * 3. 改进状态同步逻辑，避免重复调用
 * 4. 添加清理逻辑，确保对话框关闭时正确清理状态
 */
export const useDialogBackHandler = (
  dialogId: string,
  open: boolean,
  onClose: () => void
) => {
  const { openDialog, closeDialog } = useAppState();
  
  // 使用 useRef 保持 onClose 回调的稳定性，避免重复注册
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);

  // 更新 onClose 引用
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 管理对话框状态
  useEffect(() => {
    // 如果状态没有变化，不执行操作
    if (open === wasOpenRef.current) {
      return;
    }

    wasOpenRef.current = open;

    if (open) {
      // 打开对话框时，注册关闭回调
      openDialog(dialogId, () => {
        // 当 BackButtonHandler 调用 closeLastDialog 时，会执行这个回调
        onCloseRef.current();
      });
    } else {
      // 关闭对话框时，清理状态（但不执行 onClose，因为可能是用户手动关闭）
      closeDialog(dialogId);
    }
  }, [open, openDialog, closeDialog, dialogId]);

  // 组件卸载时清理状态
  useEffect(() => {
    return () => {
      if (wasOpenRef.current) {
        closeDialog(dialogId);
      }
    };
  }, [closeDialog, dialogId]);

  // 返回清理函数，用于手动关闭时清理状态
  const handleClose = useCallback(() => {
    closeDialog(dialogId);
    onCloseRef.current();
  }, [closeDialog, dialogId]);

  return { handleClose };
};
