import React from 'react';
import { useSelector } from 'react-redux';
import { useTheme, useMediaQuery } from '@mui/material';
import type { RootState } from '../../../shared/store';
import { SolidBridge } from '../../../shared/bridges/SolidBridge';
import { DialogModelSelector as SolidDialogModelSelector } from '../../../solid/components/DialogModelSelector.solid';
import DropdownModelSelector from './DropdownModelSelector';

// 定义组件props类型
interface ModelSelectorProps {
  selectedModel: any;
  availableModels: any[];
  handleModelSelect: (model: any) => void;
  handleMenuClick: () => void;
  handleMenuClose: () => void;
  menuOpen: boolean;
}

// 导出ModelSelector组件 - 根据设置选择不同的选择器样式
export const ModelSelector: React.FC<ModelSelectorProps> = (props) => {
  const modelSelectorStyle = useSelector((state: RootState) => state.settings.modelSelectorStyle);
  const providers = useSelector((state: RootState) => state.settings.providers || []);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const themeMode = theme.palette.mode;

  // 根据模型选择器样式设置选择组件
  if (modelSelectorStyle === 'dropdown') {
    return (
      <DropdownModelSelector
        selectedModel={props.selectedModel}
        availableModels={props.availableModels}
        handleModelSelect={props.handleModelSelect}
      />
    );
  }

  // 使用 SolidJS 版本的弹窗式选择器（通过 SolidBridge）
  return (
    <SolidBridge
      component={SolidDialogModelSelector}
      props={{
        selectedModel: props.selectedModel,
        availableModels: props.availableModels,
        handleModelSelect: props.handleModelSelect,
        handleMenuClose: props.handleMenuClose,
        menuOpen: props.menuOpen,
        providers: providers,
        themeMode: themeMode as 'light' | 'dark',
        fullScreen: fullScreen,
      }}
    />
  );
};