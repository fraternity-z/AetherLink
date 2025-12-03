/**
 * Diff 相关工具函数
 */

import type { DiffStats, DiffStrategyType, SearchReplaceBlock } from '../types';
import { BUFFER_LINES } from '../constants';

/**
 * 计算 Diff 统计
 */
export function computeDiffStats(oldContent: string, newContent: string): DiffStats {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  // 简化的 Diff 统计
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  
  let added = 0;
  let removed = 0;
  
  for (const line of newLines) {
    if (!oldSet.has(line)) added++;
  }
  
  for (const line of oldLines) {
    if (!newSet.has(line)) removed++;
  }
  
  return { added, removed };
}

/**
 * 生成 Diff 预览 (简化版)
 */
export function generateDiffPreview(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  const preview: string[] = [];
  const maxPreviewLines = 20;
  let previewCount = 0;
  
  // 简化的行对比
  const maxLen = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLen && previewCount < maxPreviewLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    
    if (oldLine !== newLine) {
      if (oldLine !== undefined && newLine === undefined) {
        preview.push(`- ${i + 1}: ${oldLine.substring(0, 60)}...`);
      } else if (oldLine === undefined && newLine !== undefined) {
        preview.push(`+ ${i + 1}: ${newLine.substring(0, 60)}...`);
      } else if (oldLine !== newLine) {
        preview.push(`~ ${i + 1}: ${newLine?.substring(0, 60)}...`);
      }
      previewCount++;
    }
  }
  
  if (previewCount >= maxPreviewLines) {
    preview.push(`... 还有更多变更`);
  }
  
  return preview.join('\n');
}

/**
 * 检测 Diff 策略
 */
export function detectDiffStrategy(diff: string): DiffStrategyType {
  // 检测 SEARCH/REPLACE 格式
  if (diff.includes('<<<<<<< SEARCH') && diff.includes('>>>>>>> REPLACE')) {
    return 'search-replace';
  }
  
  // 检测 unified diff 格式
  if (diff.includes('@@') && (diff.includes('---') || diff.includes('+++'))) {
    return 'unified';
  }
  
  // 默认使用 search-replace
  return 'search-replace';
}

/**
 * 解析 SEARCH/REPLACE 块
 */
export function parseSearchReplaceBlocks(diff: string): SearchReplaceBlock[] {
  const blocks: SearchReplaceBlock[] = [];
  
  // 匹配 SEARCH/REPLACE 块
  const regex = /<<<<<<< SEARCH>?\s*\n(?::start_line:\s*(\d+)\s*\n)?(?:-------\s*\n)?([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;
  
  let match;
  while ((match = regex.exec(diff)) !== null) {
    blocks.push({
      startLine: match[1] ? parseInt(match[1], 10) : undefined,
      search: match[2] || '',
      replace: match[3] || ''
    });
  }
  
  return blocks;
}

/**
 * 计算 SEARCH/REPLACE Diff 统计
 */
export function computeSearchReplaceDiffStats(diff: string): DiffStats {
  const blocks = parseSearchReplaceBlocks(diff);
  let added = 0;
  let removed = 0;
  
  for (const block of blocks) {
    const searchLines = block.search.split('\n').length;
    const replaceLines = block.replace.split('\n').length;
    
    if (replaceLines > searchLines) {
      added += replaceLines - searchLines;
    } else if (searchLines > replaceLines) {
      removed += searchLines - replaceLines;
    }
  }
  
  return { added, removed };
}

/**
 * 应用单个 SEARCH/REPLACE
 */
export function applySingleSearchReplace(
  content: string,
  search: string,
  replace: string,
  startLine: number | undefined,
  fuzzyThreshold: number
): { success: boolean; content?: string; error?: string } {
  const lines = content.split('\n');
  const searchLines = search.split('\n');
  
  // 确定搜索范围
  let searchStart = 0;
  let searchEnd = lines.length;
  
  if (startLine !== undefined) {
    searchStart = Math.max(0, startLine - 1 - BUFFER_LINES);
    searchEnd = Math.min(lines.length, startLine - 1 + searchLines.length + BUFFER_LINES);
  }

  // 查找最佳匹配
  let bestMatchIndex = -1;
  let bestMatchScore = 0;

  for (let i = searchStart; i <= searchEnd - searchLines.length; i++) {
    const candidateLines = lines.slice(i, i + searchLines.length);
    const score = calculateSimilarity(candidateLines.join('\n'), search);
    
    if (score > bestMatchScore && score >= fuzzyThreshold) {
      bestMatchScore = score;
      bestMatchIndex = i;
    }
    
    // 精确匹配直接返回
    if (score === 1) {
      break;
    }
  }

  if (bestMatchIndex === -1) {
    return {
      success: false,
      error: `未找到匹配内容 (阈值: ${fuzzyThreshold})`
    };
  }

  // 应用替换
  const replaceLines = replace.split('\n');
  const newLines = [
    ...lines.slice(0, bestMatchIndex),
    ...replaceLines,
    ...lines.slice(bestMatchIndex + searchLines.length)
  ];

  return {
    success: true,
    content: newLines.join('\n')
  };
}

/**
 * 计算字符串相似度 (简化版 Levenshtein)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  // 简化：基于行的比较
  const lines1 = str1.split('\n');
  const lines2 = str2.split('\n');
  
  let matches = 0;
  const maxLen = Math.max(lines1.length, lines2.length);
  
  for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
    if (lines1[i].trim() === lines2[i].trim()) {
      matches++;
    }
  }
  
  return matches / maxLen;
}
