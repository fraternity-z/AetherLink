// 输入框组件统一导出
export { default as ChatInput } from './ChatInput';
export { default as CompactChatInput } from './CompactChatInput';
export { default as IntegratedChatInput } from './IntegratedChatInput';
export { default as ToolsMenu } from './ToolsMenu';
export { default as UploadMenu } from './UploadMenu';
export { default as MultiModelSelector } from './MultiModelSelector';
export { default as InputToolbar, getGlassmorphismToolbarStyles, getTransparentToolbarStyles } from './InputToolbar';

// 向后兼容的别名导出
export { default as ChatToolbar } from './InputToolbar';

// 重新导出类型
export type { default as ChatInputProps } from './ChatInput';
export type { default as CompactChatInputProps } from './CompactChatInput';
export type { default as UploadMenuProps } from './UploadMenu';
export type { MultiModelSelectorProps } from './MultiModelSelector';
