/**
 * 文件读写相关处理器
 */

import { unifiedFileManager } from '../../../../UnifiedFileManagerService';
import { createSuccessResponse } from '../utils/response';
import { validateFileTokenBudget, extractCodeDefinitions } from '../utils/code-analysis';
import { truncateFileContent } from '../utils/text-processing';
import type { FileEntry } from '../types';

/**
 * 读取文件 - 增强版
 * 支持批量读取、Token 预算控制、代码定义提取
 */
export async function readFile(params: { 
  path?: string;
  files?: FileEntry[];
  start_line?: number; 
  end_line?: number;
  extract_definitions?: boolean;
  context_tokens?: number;
}) {
  const { path, files, start_line, end_line, extract_definitions = false, context_tokens = 0 } = params;

  // 支持批量读取
  if (files && files.length > 0) {
    return await readMultipleFiles(files, context_tokens, extract_definitions);
  }

  if (!path) {
    throw new Error('缺少必需参数: path 或 files');
  }

  try {
    // 获取文件信息用于 Token 预算
    const fileInfo = await unifiedFileManager.getFileInfo({ path });
    
    // Token 预算控制
    const budgetResult = validateFileTokenBudget(fileInfo.size, context_tokens);

    // 检查是否需要读取行范围
    if (start_line !== undefined && end_line !== undefined) {
      const result = await unifiedFileManager.readFileRange({
        path,
        startLine: start_line,
        endLine: end_line
      });

      return createSuccessResponse({
        content: result.content,
        totalLines: result.totalLines,
        startLine: result.startLine,
        endLine: result.endLine,
        rangeHash: result.rangeHash
      });
    } else {
      // 读取完整文件
      const result = await unifiedFileManager.readFile({
        path,
        encoding: 'utf8'
      });

      // 获取行数
      const lineCount = await unifiedFileManager.getLineCount({ path });
      
      let content = result.content;
      let notice: string | undefined;
      
      // Token 预算截断
      if (budgetResult.shouldTruncate && budgetResult.maxChars) {
        const truncateResult = truncateFileContent(
          content,
          budgetResult.maxChars,
          content.length,
          budgetResult.isPreview
        );
        content = truncateResult.content;
        notice = truncateResult.notice;
      }
      
      // 代码定义提取
      let definitions: string[] | undefined;
      if (extract_definitions) {
        definitions = extractCodeDefinitions(content, path);
      }

      return createSuccessResponse({
        content,
        totalLines: lineCount.lines,
        ...(notice && { notice }),
        ...(definitions && { definitions }),
        ...(budgetResult.shouldTruncate && { 
          truncated: true,
          reason: budgetResult.reason 
        })
      });
    }
  } catch (error) {
    throw new Error(`读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 批量读取多个文件
 */
async function readMultipleFiles(
  files: FileEntry[],
  contextTokens: number,
  extractDefinitions: boolean
) {
  const results: Array<{
    path: string;
    status: 'success' | 'error';
    content?: string;
    totalLines?: number;
    error?: string;
    definitions?: string[];
    truncated?: boolean;
  }> = [];

  let currentTokens = contextTokens;

  for (const file of files) {
    try {
      const fileInfo = await unifiedFileManager.getFileInfo({ path: file.path });
      const budgetResult = validateFileTokenBudget(fileInfo.size, currentTokens);

      let content: string;
      let totalLines: number;

      if (file.start_line !== undefined && file.end_line !== undefined) {
        const result = await unifiedFileManager.readFileRange({
          path: file.path,
          startLine: file.start_line,
          endLine: file.end_line
        });
        content = result.content;
        totalLines = result.totalLines;
      } else {
        const result = await unifiedFileManager.readFile({
          path: file.path,
          encoding: 'utf8'
        });
        content = result.content;
        const lineCount = await unifiedFileManager.getLineCount({ path: file.path });
        totalLines = lineCount.lines;
      }

      // Token 预算截断
      let truncated = false;
      if (budgetResult.shouldTruncate && budgetResult.maxChars) {
        const truncateResult = truncateFileContent(
          content,
          budgetResult.maxChars,
          content.length,
          budgetResult.isPreview
        );
        content = truncateResult.content;
        truncated = true;
      }

      // 代码定义提取
      let definitions: string[] | undefined;
      if (extractDefinitions) {
        definitions = extractCodeDefinitions(content, file.path);
      }

      // 更新已使用 Token 估算
      currentTokens += Math.ceil(content.length / 4);

      results.push({
        path: file.path,
        status: 'success',
        content,
        totalLines,
        ...(definitions && { definitions }),
        ...(truncated && { truncated })
      });
    } catch (error) {
      results.push({
        path: file.path,
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return createSuccessResponse({
    files: results,
    summary: {
      total: files.length,
      success: successCount,
      error: errorCount
    }
  });
}

/**
 * 列出目录文件 - 支持分页
 */
export async function listFiles(params: { 
  path: string; 
  recursive?: boolean;
  include_size?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { 
    path, 
    recursive = false, 
    include_size = false,
    limit = 100,
    offset = 0
  } = params;

  if (!path) {
    throw new Error('缺少必需参数: path');
  }

  try {
    const result = await unifiedFileManager.listDirectory({
      path,
      showHidden: false,
      sortBy: 'name',
      sortOrder: 'asc'
    });

    // 收集所有条目
    let allEntries: Array<{
      name: string;
      path: string;
      type: 'directory' | 'file';
      size?: number;
    }> = [];

    // 先添加目录
    for (const f of result.files.filter(f => f.type === 'directory')) {
      allEntries.push({
        name: f.name + '/',
        path: f.path,
        type: 'directory'
      });
    }

    // 再添加文件
    for (const f of result.files.filter(f => f.type !== 'directory')) {
      const entry: typeof allEntries[0] = {
        name: f.name,
        path: f.path,
        type: 'file'
      };
      if (include_size) {
        entry.size = f.size;
      }
      allEntries.push(entry);
    }

    // 递归获取子目录（如果启用）
    if (recursive) {
      const dirs = result.files.filter(f => f.type === 'directory');
      for (const dir of dirs) {
        try {
          const subResult = await listFilesRecursive(dir.path, include_size);
          allEntries = allEntries.concat(subResult);
        } catch {
          // 忽略无法访问的子目录
        }
      }
    }

    const total = allEntries.length;
    
    // 分页处理
    let paginatedEntries = allEntries;
    if (limit !== -1) {
      paginatedEntries = allEntries.slice(offset, offset + limit);
    }

    // 分离目录和文件用于统计
    const directories = paginatedEntries.filter(e => e.type === 'directory');
    const files = paginatedEntries.filter(e => e.type === 'file');

    return createSuccessResponse({
      path,
      entries: paginatedEntries,
      totalDirectories: directories.length,
      totalFiles: files.length,
      pagination: {
        total,
        offset,
        limit: limit === -1 ? total : limit,
        hasMore: limit !== -1 && offset + limit < total
      },
      recursive
    });
  } catch (error) {
    throw new Error(`列出目录失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 递归列出子目录文件
 */
async function listFilesRecursive(
  dirPath: string, 
  includeSize: boolean
): Promise<Array<{ name: string; path: string; type: 'directory' | 'file'; size?: number }>> {
  const entries: Array<{ name: string; path: string; type: 'directory' | 'file'; size?: number }> = [];
  
  try {
    const result = await unifiedFileManager.listDirectory({
      path: dirPath,
      showHidden: false,
      sortBy: 'name',
      sortOrder: 'asc'
    });

    for (const f of result.files) {
      if (f.type === 'directory') {
        entries.push({
          name: f.name + '/',
          path: f.path,
          type: 'directory'
        });
        // 递归子目录
        const subEntries = await listFilesRecursive(f.path, includeSize);
        entries.push(...subEntries);
      } else {
        const entry: typeof entries[0] = {
          name: f.name,
          path: f.path,
          type: 'file'
        };
        if (includeSize) {
          entry.size = f.size;
        }
        entries.push(entry);
      }
    }
  } catch {
    // 忽略无法访问的目录
  }

  return entries;
}

/**
 * 获取文件信息
 */
export async function getFileInfo(params: { path: string }) {
  const { path } = params;

  if (!path) {
    throw new Error('缺少必需参数: path');
  }

  try {
    const fileInfo = await unifiedFileManager.getFileInfo({ path });
    const lineCount = await unifiedFileManager.getLineCount({ path });
    const hashResult = await unifiedFileManager.getFileHash({ path, algorithm: 'md5' });

    return createSuccessResponse({
      name: fileInfo.name,
      path: fileInfo.path,
      type: fileInfo.type,
      size: fileInfo.size,
      mtime: fileInfo.mtime,
      ctime: fileInfo.ctime,
      lines: lineCount.lines,
      hash: hashResult.hash
    });
  } catch (error) {
    throw new Error(`获取文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 创建新文件
 */
export async function createFile(params: { 
  path: string; 
  content?: string;
  overwrite?: boolean;
}) {
  const { path, content = '', overwrite = false } = params;

  if (!path) {
    throw new Error('缺少必需参数: path');
  }

  try {
    // 检查文件是否已存在
    if (!overwrite) {
      const existsResult = await unifiedFileManager.exists({ path });
      if (existsResult.exists) {
        throw new Error(`文件已存在: ${path}。如需覆盖，请设置 overwrite: true`);
      }
    }

    // 自动创建父目录（如果不存在）
    const parentDir = path.replace(/[/\\][^/\\]+$/, ''); // 提取父目录路径
    if (parentDir && parentDir !== path) {
      try {
        const parentExists = await unifiedFileManager.exists({ path: parentDir });
        if (!parentExists.exists) {
          await unifiedFileManager.createDirectory({
            path: parentDir,
            recursive: true
          });
        }
      } catch {
        // 忽略父目录检查错误，继续尝试创建文件
      }
    }

    // 创建文件 (跟踪已在 UnifiedFileManagerService 中自动处理)
    await unifiedFileManager.createFile({
      path,
      content,
      encoding: 'utf8'
    });

    return createSuccessResponse({
      message: '文件创建成功',
      path,
      size: content.length,
      lines: content ? content.split('\n').length : 0
    });
  } catch (error) {
    throw new Error(`创建文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 重命名文件或目录
 */
export async function renameFile(params: { 
  path: string; 
  new_name: string;
}) {
  const { path, new_name } = params;

  if (!path) {
    throw new Error('缺少必需参数: path');
  }
  if (!new_name) {
    throw new Error('缺少必需参数: new_name');
  }

  // 验证新名称不包含路径分隔符
  if (new_name.includes('/') || new_name.includes('\\')) {
    throw new Error('new_name 不能包含路径分隔符，只能是文件名');
  }

  try {
    await unifiedFileManager.renameFile({
      path,
      newName: new_name
    });

    // 计算新路径
    const pathParts = path.split(/[/\\]/);
    pathParts[pathParts.length - 1] = new_name;
    const newPath = pathParts.join('/');

    return createSuccessResponse({
      message: '重命名成功',
      oldPath: path,
      newPath,
      newName: new_name
    });
  } catch (error) {
    throw new Error(`重命名失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 移动文件或目录
 */
export async function moveFile(params: { 
  source_path: string; 
  destination_path: string;
}) {
  const { source_path, destination_path } = params;

  if (!source_path) {
    throw new Error('缺少必需参数: source_path');
  }
  if (!destination_path) {
    throw new Error('缺少必需参数: destination_path');
  }

  try {
    await unifiedFileManager.moveFile({
      sourcePath: source_path,
      destinationPath: destination_path
    });

    return createSuccessResponse({
      message: '移动成功',
      sourcePath: source_path,
      destinationPath: destination_path
    });
  } catch (error) {
    throw new Error(`移动失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 复制文件或目录
 */
export async function copyFile(params: { 
  source_path: string; 
  destination_path: string;
  overwrite?: boolean;
}) {
  const { source_path, destination_path, overwrite = false } = params;

  if (!source_path) {
    throw new Error('缺少必需参数: source_path');
  }
  if (!destination_path) {
    throw new Error('缺少必需参数: destination_path');
  }

  try {
    await unifiedFileManager.copyFile({
      sourcePath: source_path,
      destinationPath: destination_path,
      overwrite
    });

    return createSuccessResponse({
      message: '复制成功',
      sourcePath: source_path,
      destinationPath: destination_path
    });
  } catch (error) {
    throw new Error(`复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 删除文件或目录
 */
export async function deleteFile(params: { 
  path: string;
  recursive?: boolean;
}) {
  const { path, recursive = true } = params;

  if (!path) {
    throw new Error('缺少必需参数: path');
  }

  try {
    // 先获取文件信息判断是文件还是目录
    const fileInfo = await unifiedFileManager.getFileInfo({ path });
    
    if (fileInfo.type === 'directory') {
      if (!recursive) {
        throw new Error('目标是目录，需要设置 recursive: true 才能删除');
      }
      await unifiedFileManager.deleteDirectory({ path });
    } else {
      // 文件跟踪已在 UnifiedFileManagerService.deleteFile 中自动处理
      await unifiedFileManager.deleteFile({ path });
    }

    return createSuccessResponse({
      message: '删除成功',
      path,
      type: fileInfo.type
    });
  } catch (error) {
    throw new Error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
