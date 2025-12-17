/**
 * MultiModelSelector - React 桥接组件
 * 包装 SolidJS 版本的 MultiModelSelector，在 React 中使用
 */
import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import { SolidBridge } from '../../shared/bridges/SolidBridge';
import { selectProviders } from '../../shared/store/selectors/settingsSelectors';
import type { Model } from '../../shared/types';

export interface MultiModelSelectorProps {
  open: boolean;
  onClose: () => void;
  availableModels: Model[];
  /** 选择变更回调 - 选择后立即回调 */
  onSelectionChange?: (selectedModels: Model[]) => void;
  /** 已选中的模型列表 - 用于外部控制 */
  selectedModels?: Model[];
  maxSelection?: number;
}

/**
 * 多模型选择器组件（React 桥接版）
 * 内部使用 SolidJS 实现，通过桥接层在 React 中使用
 * 
 * 使用 onSelectionChange + selectedModels，选择后显示在输入框上方
 */
const MultiModelSelector: React.FC<MultiModelSelectorProps> = ({
  open,
  onClose,
  availableModels,
  onSelectionChange,
  selectedModels,
  maxSelection = 5
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const themeMode = theme.palette.mode;

  // 动态加载 SolidJS 组件
  const [SolidComponent, setSolidComponent] = useState<any>(null);

  useEffect(() => {
    import('../../solid/components/ModelSelector/MultiModelSelector.solid').then((mod) => {
      setSolidComponent(() => mod.MultiModelSelector);
    });
  }, []);

  // 从 Redux 获取提供商配置
  const providers = useSelector(selectProviders);

  // 准备传递给 SolidJS 组件的 props
  const solidProps = useMemo(() => ({
    open,
    onClose,
    availableModels,
    onSelectionChange,
    selectedModels,
    maxSelection,
    providers,
    themeMode: themeMode as 'light' | 'dark',
    fullScreen
  }), [open, onClose, availableModels, onSelectionChange, selectedModels, maxSelection, providers, themeMode, fullScreen]);

  // 只在打开且组件加载完成时渲染
  if (!open || !SolidComponent) {
    return null;
  }

  return (
    <SolidBridge
      component={SolidComponent}
      props={solidProps}
      debugName="MultiModelSelector"
    />
  );
};

export default MultiModelSelector;
