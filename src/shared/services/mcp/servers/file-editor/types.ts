/**
 * File Editor MCP Server - 类型定义
 */

/** 文件条目 */
export interface FileEntry {
  path: string;
  start_line?: number;
  end_line?: number;
}

/** Token 预算验证结果 */
export interface TokenBudgetResult {
  shouldTruncate: boolean;
  maxChars?: number;
  reason?: string;
  isPreview?: boolean;
}

/** Diff 统计 */
export interface DiffStats {
  added: number;
  removed: number;
}

/** Diff 结果 */
export interface DiffResult {
  success: boolean;
  content?: string;
  error?: string;
  failParts?: Array<{
    success: boolean;
    error?: string;
    details?: any;
  }>;
}

/** Diff 策略类型 */
export type DiffStrategyType = 'unified' | 'search-replace' | 'auto';

/** SEARCH/REPLACE 块 */
export interface SearchReplaceBlock {
  search: string;
  replace: string;
  startLine?: number;
}

/** 工具响应 */
export interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
  _meta?: {
    isCompletion?: boolean;
  };
}
