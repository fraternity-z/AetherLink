/**
 * Markdown 源码行号属性名
 */
export const MARKDOWN_SOURCE_LINE_ATTR = 'data-source-line';

/**
 * 默认编辑器配置
 */
export const DEFAULT_EDITOR_SETTINGS = {
  defaultViewMode: 'edit' as const,
  defaultEditMode: 'preview' as const,
  fontSize: 16,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  isFullWidth: false,
  showTableOfContents: true
};

/**
 * 编辑器快捷键
 */
export const EDITOR_SHORTCUTS = {
  BOLD: 'Mod-b',
  ITALIC: 'Mod-i',
  UNDERLINE: 'Mod-u',
  STRIKE: 'Mod-Shift-x',
  CODE: 'Mod-e',
  HEADING_1: 'Mod-Alt-1',
  HEADING_2: 'Mod-Alt-2',
  HEADING_3: 'Mod-Alt-3',
  BULLET_LIST: 'Mod-Shift-8',
  ORDERED_LIST: 'Mod-Shift-7',
  BLOCKQUOTE: 'Mod-Shift-b',
  CODE_BLOCK: 'Mod-Alt-c',
  HORIZONTAL_RULE: 'Mod-Alt-h',
  UNDO: 'Mod-z',
  REDO: 'Mod-Shift-z'
};
