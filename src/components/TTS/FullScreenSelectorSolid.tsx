/**
 * FullScreenSelectorSolid - React 包装组件
 * 使用 SolidBridge 桥接 SolidJS 版本的全屏选择器
 */
import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { SolidBridge } from '../../shared/bridges/SolidBridge';
import { FullScreenSelector as SolidFullScreenSelector, type SelectorGroup, type SelectorItem } from '../../solid/components/TTS/FullScreenSelector.solid';

interface FullScreenSelectorSolidProps {
  open: boolean;
  onClose: () => void;
  title: string;
  groups: SelectorGroup[];
  selectedKey: string;
  onSelect: (key: string, label: string) => void;
  onDelete?: (key: string) => void; // 删除回调
  allowEmpty?: boolean;
  emptyLabel?: string;
}

/**
 * SolidJS 版本的全屏选择器（React 包装）
 * 使用细粒度响应式，性能优于 React 版本
 */
const FullScreenSelectorSolid: React.FC<FullScreenSelectorSolidProps> = ({
  open,
  onClose,
  title,
  groups,
  selectedKey,
  onSelect,
  onDelete,
  allowEmpty = false,
  emptyLabel = '无',
}) => {
  const theme = useTheme();
  const themeMode = theme.palette.mode;

  const props = useMemo(() => ({
    open,
    onClose,
    title,
    groups,
    selectedKey,
    onSelect,
    onDelete,
    allowEmpty,
    emptyLabel,
    themeMode: themeMode as 'light' | 'dark',
  }), [open, onClose, title, groups, selectedKey, onSelect, onDelete, allowEmpty, emptyLabel, themeMode]);

  // 只在打开时渲染 SolidJS 组件
  if (!open) return null;

  return (
    <SolidBridge
      component={SolidFullScreenSelector as any}
      props={props}
      debugName="FullScreenSelector"
    />
  );
};

export default FullScreenSelectorSolid;
export type { SelectorGroup, SelectorItem };
