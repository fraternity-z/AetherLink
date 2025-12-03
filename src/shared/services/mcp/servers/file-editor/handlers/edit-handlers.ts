/**
 * 文件编辑相关处理器
 */

import { unifiedFileManager } from '../../../../UnifiedFileManagerService';
import { createSuccessResponse } from '../utils/response';
import { 
  unescapeHtmlEntities, 
  removeCodeBlockMarkers, 
  detectCodeOmission 
} from '../utils/text-processing';
import {
  computeDiffStats,
  generateDiffPreview,
  detectDiffStrategy,
  parseSearchReplaceBlocks,
  computeSearchReplaceDiffStats,
  applySingleSearchReplace
} from '../utils/diff-utils';
import { FUZZY_THRESHOLD } from '../constants';
import type { DiffResult, DiffStrategyType } from '../types';

/** 连续错误计数 */
let consecutiveMistakeCount = 0;

/** Diff 重试计数 (按文件路径) */
const diffRetryCount = new Map<string, number>();

/**
 * 写入文件 - 增强版
 * 支持行数验证、代码截断检测、HTML 实体转义、Diff 预览
 */
export async function writeToFile(params: { 
  path: string; 
  content: string;
  line_count?: number;
  create_backup?: boolean;
}) {
  const { path, content, line_count, create_backup = true } = params;

  if (!path) {
    throw new Error('缺少必需参数: path');
  }
  if (content === undefined) {
    throw new Error('缺少必需参数: content');
  }

  // 行数验证 - 防止内容截断
  const actualLineCount = content.split('\n').length;
  if (line_count !== undefined && line_count > 0) {
    if (actualLineCount < line_count * 0.8) {
      // 实际行数小于预期的 80%，可能被截断
      consecutiveMistakeCount++;
      
      // 检测代码省略标记
      const omissionDetected = detectCodeOmission(content);
      
      if (omissionDetected) {
        throw new Error(
          `内容可能被截断 (实际 ${actualLineCount} 行，预期 ${line_count} 行)，` +
          `并检测到代码省略标记 (如 "// rest of code unchanged")。` +
          `请提供完整内容，或使用 apply_diff 工具进行增量修改。`
        );
      }
    }
  }

  try {
    // HTML 实体转义
    let processedContent = unescapeHtmlEntities(content);
    
    // 移除可能的代码块标记
    processedContent = removeCodeBlockMarkers(processedContent);

    // 获取原始文件内容用于 Diff 预览
    let originalContent = '';
    let fileExists = false;
    try {
      const existing = await unifiedFileManager.readFile({ path, encoding: 'utf8' });
      originalContent = existing.content;
      fileExists = true;
    } catch {
      // 文件不存在，这是新文件
    }

    // 创建备份
    let backupPath: string | undefined;
    if (create_backup && fileExists) {
      backupPath = `${path}.backup.${Date.now()}`;
      await unifiedFileManager.writeFile({
        path: backupPath,
        content: originalContent,
        encoding: 'utf8',
        append: false
      });
    }

    // 写入文件
    await unifiedFileManager.writeFile({
      path,
      content: processedContent,
      encoding: 'utf8',
      append: false
    });

    // 获取写入后的行数
    const lineCount = await unifiedFileManager.getLineCount({ path });

    // 计算 Diff 统计
    const diffStats = computeDiffStats(originalContent, processedContent);

    // 重置连续错误计数
    consecutiveMistakeCount = 0;

    // 注意：文件跟踪已在 UnifiedFileManagerService 中自动处理

    return createSuccessResponse({
      message: fileExists ? '文件更新成功' : '文件创建成功',
      path,
      totalLines: lineCount.lines,
      isNewFile: !fileExists,
      ...(backupPath && { backupPath }),
      diffStats: {
        added: diffStats.added,
        removed: diffStats.removed
      },
      // Diff 预览 (简化版)
      diffPreview: fileExists ? generateDiffPreview(originalContent, processedContent) : undefined
    });
  } catch (error) {
    throw new Error(`写入文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 插入内容
 */
export async function insertContent(params: { path: string; line: number; content: string }) {
  const { path, line, content } = params;

  if (!path) {
    throw new Error('缺少必需参数: path');
  }
  if (line === undefined || line < 1) {
    throw new Error('缺少或无效参数: line (必须是正整数)');
  }
  if (content === undefined) {
    throw new Error('缺少必需参数: content');
  }

  try {
    await unifiedFileManager.insertContent({
      path,
      line,
      content
    });

    // 获取插入后的行数
    const lineCount = await unifiedFileManager.getLineCount({ path });
    const insertedLines = content.split('\n').length;

    return createSuccessResponse({
      message: `已在第 ${line} 行插入 ${insertedLines} 行内容`,
      path,
      insertedAt: line,
      linesInserted: insertedLines,
      totalLines: lineCount.lines
    });
  } catch (error) {
    throw new Error(`插入内容失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 应用 Diff - 增强版
 * 支持多种 Diff 策略、部分失败处理、错误重试计数
 */
export async function applyDiff(params: { 
  path: string; 
  diff: string;
  strategy?: DiffStrategyType;
  fuzzy_threshold?: number;
}) {
  const { path, diff, strategy = 'auto', fuzzy_threshold = FUZZY_THRESHOLD } = params;

  if (!path) {
    throw new Error('缺少必需参数: path');
  }
  if (!diff) {
    throw new Error('缺少必需参数: diff');
  }

  // 获取或初始化该文件的重试计数
  const currentRetryCount = diffRetryCount.get(path) || 0;

  // 注意：文件跟踪已在 UnifiedFileManagerService.applyDiff 中自动处理

  try {
    // 检测 Diff 策略
    const detectedStrategy = strategy === 'auto' 
      ? detectDiffStrategy(diff) 
      : strategy;

    let result: DiffResult;

    if (detectedStrategy === 'search-replace') {
      // 使用 SEARCH/REPLACE 策略
      result = await applySearchReplaceDiff(path, diff, fuzzy_threshold);
    } else {
      // 使用传统 unified diff
      const unifiedResult = await unifiedFileManager.applyDiff({
        path,
        diff,
        createBackup: true
      });
      
      result = {
        success: unifiedResult.success,
        content: undefined,
        error: unifiedResult.success ? undefined : '应用 unified diff 失败'
      };
    }

    if (!result.success) {
      // 增加重试计数
      diffRetryCount.set(path, currentRetryCount + 1);
      consecutiveMistakeCount++;

      // 构建详细错误报告
      let errorMessage = result.error || 'Diff 应用失败';
      
      if (result.failParts && result.failParts.length > 0) {
        const failedCount = result.failParts.filter(p => !p.success).length;
        errorMessage += `\n\n部分失败报告: ${failedCount} 个块失败`;
        
        for (const part of result.failParts) {
          if (!part.success) {
            errorMessage += `\n- ${part.error}`;
          }
        }
      }

      // 如果重试次数过多，给出建议
      if (currentRetryCount >= 2) {
        errorMessage += `\n\n建议: 该文件已失败 ${currentRetryCount + 1} 次。请使用 read_file 工具获取最新内容后重试。`;
      }

      return createSuccessResponse({
        success: false,
        error: errorMessage,
        retryCount: currentRetryCount + 1,
        failParts: result.failParts
      });
    }

    // 成功 - 重置重试计数
    diffRetryCount.delete(path);
    consecutiveMistakeCount = 0;

    // 计算 Diff 统计
    const diffStats = computeSearchReplaceDiffStats(diff);

    // 注意：文件跟踪已在 UnifiedFileManagerService 中自动处理

    return createSuccessResponse({
      message: 'Diff 应用成功',
      path,
      success: true,
      strategy: detectedStrategy,
      diffStats,
      ...(result.failParts && result.failParts.length > 0 && {
        partialSuccess: true,
        failParts: result.failParts.filter(p => !p.success)
      })
    });
  } catch (error) {
    // 增加重试计数
    diffRetryCount.set(path, currentRetryCount + 1);
    consecutiveMistakeCount++;
    
    throw new Error(`应用 diff 失败 (第 ${currentRetryCount + 1} 次尝试): ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 应用 SEARCH/REPLACE 格式的 Diff
 */
async function applySearchReplaceDiff(
  filePath: string,
  diffContent: string,
  fuzzyThreshold: number
): Promise<DiffResult> {
  // 解析 SEARCH/REPLACE 块
  const blocks = parseSearchReplaceBlocks(diffContent);
  
  if (blocks.length === 0) {
    return {
      success: false,
      error: '无效的 Diff 格式 - 未找到 SEARCH/REPLACE 块'
    };
  }

  // 读取原始文件
  const originalFile = await unifiedFileManager.readFile({ path: filePath, encoding: 'utf8' });
  let content = originalFile.content;
  const failParts: DiffResult['failParts'] = [];
  let appliedCount = 0;

  // 按行号排序，从后往前应用以避免行号偏移
  const sortedBlocks = [...blocks].sort((a, b) => (b.startLine || 0) - (a.startLine || 0));

  for (const block of sortedBlocks) {
    const result = applySingleSearchReplace(
      content,
      block.search,
      block.replace,
      block.startLine,
      fuzzyThreshold
    );

    if (result.success && result.content) {
      content = result.content;
      appliedCount++;
    } else {
      failParts.push({
        success: false,
        error: result.error,
        details: {
          search: block.search.substring(0, 100) + '...',
          startLine: block.startLine
        }
      });
    }
  }

  if (appliedCount === 0) {
    return {
      success: false,
      error: '所有 SEARCH/REPLACE 块都失败',
      failParts
    };
  }

  // 写入文件
  await unifiedFileManager.writeFile({
    path: filePath,
    content,
    encoding: 'utf8',
    append: false
  });

  return {
    success: true,
    content,
    failParts: failParts.length > 0 ? failParts : undefined
  };
}

/**
 * 替换文件内容
 */
export async function replaceInFile(params: {
  path: string;
  search: string;
  replace: string;
  is_regex?: boolean;
  replace_all?: boolean;
}) {
  const { path, search, replace, is_regex = false, replace_all = true } = params;

  if (!path) {
    throw new Error('缺少必需参数: path');
  }
  if (!search) {
    throw new Error('缺少必需参数: search');
  }
  if (replace === undefined) {
    throw new Error('缺少必需参数: replace');
  }

  try {
    const result = await unifiedFileManager.replaceInFile({
      path,
      search,
      replace,
      isRegex: is_regex,
      replaceAll: replace_all,
      caseSensitive: true
    });

    return createSuccessResponse({
      message: result.modified ? `替换成功，共 ${result.replacements} 处` : '未找到匹配内容',
      path,
      replacements: result.replacements,
      modified: result.modified
    });
  } catch (error) {
    throw new Error(`替换失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
