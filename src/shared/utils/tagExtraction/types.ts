/**
 * 标签提取类型定义
 * 参考 Cherry Studio 的 tagExtraction.ts
 */

/**
 * 标签配置
 */
export interface TagConfig {
  /** 开始标签，如 '<tool_use>' */
  openingTag: string;
  /** 结束标签，如 '</tool_use>' */
  closingTag: string;
  /** 分隔符，默认 '\n' */
  separator?: string;
}

/**
 * 标签提取状态
 */
export interface TagExtractionState {
  /** 文本缓冲区 */
  textBuffer: string;
  /** 是否在标签内部 */
  isInsideTag: boolean;
  /** 是否是第一个标签 */
  isFirstTag: boolean;
  /** 是否是第一个文本 */
  isFirstText: boolean;
  /** 是否刚切换状态 */
  afterSwitch: boolean;
  /** 累积的标签内容 */
  accumulatedTagContent: string;
  /** 是否有标签内容 */
  hasTagContent: boolean;
}

/**
 * 标签提取结果
 */
export interface TagExtractionResult {
  /** 提取的内容 */
  content: string;
  /** 是否是标签内的内容 */
  isTagContent: boolean;
  /** 标签是否完整提取完成 */
  complete: boolean;
  /** 完整提取的标签内容（仅当 complete=true 时有值） */
  tagContentExtracted?: string;
}

/**
 * 多标签配置（支持双格式）
 */
export interface MultiTagConfig {
  /** 主格式：<tool_use> */
  toolUse: TagConfig;
  /** 直接格式配置生成函数 */
  createDirectTag: (toolName: string) => TagConfig;
}

/**
 * 默认的 tool_use 标签配置
 */
export const TOOL_USE_TAG_CONFIG: TagConfig = {
  openingTag: '<tool_use>',
  closingTag: '</tool_use>',
  separator: '\n'
};
