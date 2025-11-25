/**
 * 代码块视图类型定义
 */

// 视图模式
export type ViewMode = 'source' | 'special' | 'split';

// 工具按钮类型
export interface ActionTool {
  id: string;
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  group?: 'quick' | 'core';
}

// 代码块属性
export interface CodeBlockViewProps {
  children: string;
  language: string;
  onSave?: (newContent: string) => void;
  messageRole?: 'user' | 'assistant' | 'system';
}

// 预览组件句柄
export interface BasicPreviewHandles {
  copy: () => void;
  download: () => void;
}

// 代码编辑器句柄
export interface CodeEditorHandles {
  getValue: () => string;
  save: () => void;
}

// 特殊视图类型
export const SPECIAL_VIEWS = ['mermaid', 'plantuml', 'svg', 'html'] as const;
export type SpecialViewType = typeof SPECIAL_VIEWS[number];
