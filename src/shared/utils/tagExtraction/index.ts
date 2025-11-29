/**
 * 标签提取模块
 * 用于从流式文本中提取工具调用标签
 */

// 类型导出
export type {
  TagConfig,
  TagExtractionState,
  TagExtractionResult,
  MultiTagConfig
} from './types';

export { TOOL_USE_TAG_CONFIG } from './types';

// 工具函数导出
export { getPotentialStartIndex, checkPartialTagContinuation } from './getPotentialIndex';

// 提取器导出
export { StreamTagExtractor } from './StreamTagExtractor';
export { ToolTagExtractor } from './ToolTagExtractor';
export type { ToolTagDetectionResult, ToolTagExtractionResult } from './ToolTagExtractor';
