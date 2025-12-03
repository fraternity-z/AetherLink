/**
 * 代码分析工具函数
 */

import type { TokenBudgetResult } from '../types';
import {
  FILE_SIZE_THRESHOLD,
  MAX_FILE_SIZE_FOR_TOKENIZATION,
  PREVIEW_SIZE_FOR_LARGE_FILES,
  FILE_READ_BUDGET_PERCENT,
  DEFAULT_CONTEXT_WINDOW
} from '../constants';

/**
 * Token 预算验证
 */
export function validateFileTokenBudget(
  fileSizeBytes: number,
  currentTokens: number
): TokenBudgetResult {
  // 小文件快速路径
  if (fileSizeBytes < FILE_SIZE_THRESHOLD) {
    return { shouldTruncate: false };
  }

  // 计算可用 Token 预算
  const remainingTokens = DEFAULT_CONTEXT_WINDOW - currentTokens;
  const safeReadBudget = Math.floor(remainingTokens * FILE_READ_BUDGET_PERCENT);

  if (safeReadBudget <= 0) {
    return {
      shouldTruncate: true,
      maxChars: 0,
      reason: '没有可用的上下文预算用于文件读取'
    };
  }

  // 大文件预览模式
  const isPreviewMode = fileSizeBytes > MAX_FILE_SIZE_FOR_TOKENIZATION;

  if (isPreviewMode) {
    return {
      shouldTruncate: true,
      maxChars: PREVIEW_SIZE_FOR_LARGE_FILES,
      isPreview: true,
      reason: `文件过大 (${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB)，显示前 ${(PREVIEW_SIZE_FOR_LARGE_FILES / 1024).toFixed(0)}KB 预览。使用 start_line/end_line 读取特定部分。`
    };
  }

  // 估算 Token 数 (粗略估算: 4 字符 = 1 Token)
  const estimatedTokens = Math.ceil(fileSizeBytes / 4);

  if (estimatedTokens > safeReadBudget) {
    const maxChars = Math.floor(safeReadBudget * 4);
    return {
      shouldTruncate: true,
      maxChars,
      reason: `文件需要约 ${estimatedTokens} tokens，但只有 ${safeReadBudget} tokens 可用`
    };
  }

  return { shouldTruncate: false };
}

/**
 * 提取代码定义 (函数、类、接口等)
 */
export function extractCodeDefinitions(content: string, filePath: string): string[] {
  const definitions: string[] = [];
  const ext = filePath.split('.').pop()?.toLowerCase();

  // 根据文件类型使用不同的正则
  const patterns: Record<string, RegExp[]> = {
    ts: [
      /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm,
      /^\s*(?:export\s+)?class\s+(\w+)/gm,
      /^\s*(?:export\s+)?interface\s+(\w+)/gm,
      /^\s*(?:export\s+)?type\s+(\w+)/gm,
      /^\s*(?:export\s+)?const\s+(\w+)\s*=/gm,
    ],
    tsx: [
      /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm,
      /^\s*(?:export\s+)?class\s+(\w+)/gm,
      /^\s*(?:export\s+)?interface\s+(\w+)/gm,
      /^\s*(?:export\s+)?type\s+(\w+)/gm,
      /^\s*(?:export\s+)?const\s+(\w+)\s*=/gm,
    ],
    js: [
      /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm,
      /^\s*(?:export\s+)?class\s+(\w+)/gm,
      /^\s*(?:export\s+)?const\s+(\w+)\s*=/gm,
    ],
    jsx: [
      /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm,
      /^\s*(?:export\s+)?class\s+(\w+)/gm,
      /^\s*(?:export\s+)?const\s+(\w+)\s*=/gm,
    ],
    py: [
      /^\s*def\s+(\w+)/gm,
      /^\s*class\s+(\w+)/gm,
      /^\s*async\s+def\s+(\w+)/gm,
    ],
    java: [
      /^\s*(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*(?:class|interface|enum)\s+(\w+)/gm,
      /^\s*(?:public|private|protected)?\s*(?:static)?\s*(?:\w+)\s+(\w+)\s*\(/gm,
    ],
    go: [
      /^\s*func\s+(?:\([^)]+\)\s+)?(\w+)/gm,
      /^\s*type\s+(\w+)\s+struct/gm,
      /^\s*type\s+(\w+)\s+interface/gm,
    ],
    rust: [
      /^\s*(?:pub\s+)?fn\s+(\w+)/gm,
      /^\s*(?:pub\s+)?struct\s+(\w+)/gm,
      /^\s*(?:pub\s+)?enum\s+(\w+)/gm,
      /^\s*(?:pub\s+)?trait\s+(\w+)/gm,
    ],
  };

  const filePatterns = patterns[ext || ''] || patterns['ts'];

  for (const pattern of filePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && !definitions.includes(match[1])) {
        definitions.push(match[1]);
      }
    }
  }

  return definitions;
}
