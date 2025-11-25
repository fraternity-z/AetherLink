import React, { useId } from 'react';
import { Drawer } from '@mui/material';
import type { DrawerProps } from '@mui/material';
import { useDialogBackHandler } from '../../hooks/useDialogBackHandler';

/**
 * 支持返回键关闭的 Drawer 组件
 * 
 * 封装 MUI Drawer，自动集成 Android 返回键处理
 * 当用户按下返回键时，会自动关闭此抽屉
 * 
 * 使用方式与 MUI Drawer 完全相同，只需将 Drawer 替换为 BackButtonDrawer
 * 
 * @example
 * <BackButtonDrawer anchor="bottom" open={open} onClose={handleClose}>
 *   <Box>内容</Box>
 * </BackButtonDrawer>
 */
interface BackButtonDrawerProps extends DrawerProps {
  /**
   * 可选的抽屉 ID，用于标识抽屉
   * 如果不提供，会自动生成唯一 ID
   */
  drawerId?: string;
}

const BackButtonDrawer: React.FC<BackButtonDrawerProps> = ({
  drawerId,
  open,
  onClose,
  children,
  ...props
}) => {
  // 自动生成唯一 ID（如果未提供）
  const autoId = useId();
  const id = drawerId || `drawer-${autoId}`;
  
  // 包装 onClose 函数，因为 MUI Drawer 的 onClose 接收事件和原因参数
  const handleClose = () => {
    if (onClose) {
      // 调用 MUI Drawer 的 onClose，传递空事件和 'escapeKeyDown' 原因
      onClose({} as React.SyntheticEvent, 'escapeKeyDown');
    }
  };
  
  // 使用返回键处理 Hook
  useDialogBackHandler(id, !!open, handleClose);
  
  return (
    <Drawer open={open} onClose={onClose} {...props}>
      {children}
    </Drawer>
  );
};

export default BackButtonDrawer;
