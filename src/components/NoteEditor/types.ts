import type { Editor } from '@tiptap/react';

/**
 * 编辑器视图模式
 */
export type EditorViewMode = 'preview' | 'source' | 'read';

/**
 * 编辑器配置
 */
export interface EditorSettings {
  defaultViewMode: 'edit' | 'read';
  defaultEditMode: EditorViewMode;
  fontSize: number;
  fontFamily: string;
  isFullWidth: boolean;
  showTableOfContents: boolean;
}

/**
 * RichEditor 组件 Props
 */
export interface RichEditorProps {
  initialContent: string;
  onMarkdownChange: (markdown: string) => void;
  showToolbar?: boolean;
  editable?: boolean;
  showTableOfContents?: boolean;
  enableContentSearch?: boolean;
  className?: string;
  isFullWidth?: boolean;
  fontFamily?: string;
  fontSize?: number;
  enableSpellCheck?: boolean;
}

/**
 * RichEditor 组件暴露的方法
 */
export interface RichEditorRef {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  getContent: () => string;
  clear: () => void;
  scrollToLine?: (lineNumber: number, options?: { highlight?: boolean; lineContent?: string }) => void;
  unregisterCommand?: (commandId: string) => void;
}

/**
 * 工具栏命令项
 */
export interface ToolbarCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
  divider?: boolean;
}

/**
 * 格式化命令
 */
export interface FormattingCommand {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
}
