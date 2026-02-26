import React, { useId, useMemo } from 'react';
import { Dialog, Slide } from '@mui/material';
import type { DialogProps } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { useDialogBackHandler } from '../../hooks/useDialogBackHandler';

/**
 * 从底部滑入的过渡动画组件
 */
const SlideUpTransition = React.forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * 支持返回键关闭的 Dialog 组件
 * 
 * 封装 MUI Dialog，自动集成 Android 返回键处理
 * 当用户按下返回键时，会自动关闭此对话框
 * 
 * 使用方式与 MUI Dialog 完全相同，只需将 Dialog 替换为 BackButtonDialog
 * 
 * @example
 * // 普通对话框
 * <BackButtonDialog open={open} onClose={handleClose}>
 *   <DialogTitle>标题</DialogTitle>
 *   <DialogContent>内容</DialogContent>
 * </BackButtonDialog>
 * 
 * @example
 * // 全屏对话框（自动处理 Safe Area、圆角、Slide 动画）
 * <BackButtonDialog open={open} onClose={handleClose} fullScreen>
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
  /**
   * 是否启用 Safe Area 内边距（仅 fullScreen 模式有效）
   * 默认为 true，fullScreen 时自动添加顶部和底部安全区域内边距
   * 设为 false 可禁用，由子组件自行处理
   */
  safeArea?: boolean;
  /**
   * 是否启用 Slide 过渡动画（仅 fullScreen 模式有效）
   * 默认为 true，fullScreen 时自动使用从底部滑入的动画
   */
  slideTransition?: boolean;
}

const BackButtonDialog: React.FC<BackButtonDialogProps> = ({
  dialogId,
  open,
  onClose,
  children,
  slotProps,
  fullScreen,
  safeArea = true,
  slideTransition = true,
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
  
  // fullScreen 模式下的自动样式
  const fullScreenPaperSx = useMemo(() => {
    if (!fullScreen) return {};
    return {
      borderRadius: 0,
      ...(safeArea && {
        // 自动添加安全区域内边距，子组件不需要再手动处理
        '& .MuiDialogTitle-root': {
          paddingTop: 'calc(var(--safe-area-top, 0px) + 16px)',
        },
        '& .MuiDialogActions-root': {
          paddingBottom: 'calc(var(--safe-area-bottom-computed, 0px) + 16px)',
        },
      }),
    };
  }, [fullScreen, safeArea]);

  // 合并 slotProps，确保在过渡动画退出前移除焦点
  const mergedSlotProps = useMemo(() => ({
    ...slotProps,
    paper: {
      ...slotProps?.paper,
      sx: {
        ...fullScreenPaperSx,
        ...(slotProps?.paper as any)?.sx,
      },
    },
    backdrop: {
      ...slotProps?.backdrop,
      onExited: () => {
        // 在退出动画结束时移除焦点
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    }
  }), [slotProps, fullScreenPaperSx]);

  // fullScreen 模式下自动使用 Slide 动画
  const transitionProps = fullScreen && slideTransition
    ? { TransitionComponent: SlideUpTransition }
    : {};
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullScreen={fullScreen}
      slotProps={mergedSlotProps}
      disableRestoreFocus
      {...transitionProps}
      {...props}
    >
      {children}
    </Dialog>
  );
};

export default BackButtonDialog;
