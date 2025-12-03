/**
 * File Editor MCP Server - 常量定义
 */

/** 文件大小阈值 (字节)，超过此值触发 Token 验证 */
export const FILE_SIZE_THRESHOLD = 100_000; // 100KB

/** 最大可 Token 化的文件大小 (字节) */
export const MAX_FILE_SIZE_FOR_TOKENIZATION = 5_000_000; // 5MB

/** 大文件预览大小 (字节) */
export const PREVIEW_SIZE_FOR_LARGE_FILES = 100_000; // 100KB

/** 文件读取 Token 预算百分比 */
export const FILE_READ_BUDGET_PERCENT = 0.6; // 60%

/** 默认上下文窗口大小 */
export const DEFAULT_CONTEXT_WINDOW = 128000;

/** Diff 模糊匹配阈值 */
export const FUZZY_THRESHOLD = 0.9;

/** Diff 搜索缓冲行数 */
export const BUFFER_LINES = 40;
