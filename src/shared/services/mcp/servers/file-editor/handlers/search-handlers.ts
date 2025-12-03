/**
 * 搜索相关处理器
 */

import { unifiedFileManager } from '../../../../UnifiedFileManagerService';
import { createSuccessResponse } from '../utils/response';

/**
 * 搜索文件
 */
export async function searchFiles(params: {
  directory: string;
  query: string;
  search_type?: 'name' | 'content' | 'both';
  file_types?: string[];
}) {
  const { directory, query, search_type = 'name', file_types = [] } = params;

  if (!directory) {
    throw new Error('缺少必需参数: directory');
  }
  if (!query) {
    throw new Error('缺少必需参数: query');
  }

  try {
    const result = await unifiedFileManager.searchFiles({
      directory,
      query,
      searchType: search_type,
      fileTypes: file_types,
      recursive: true,
      maxResults: 100
    });

    return createSuccessResponse({
      directory,
      query,
      searchType: search_type,
      files: result.files.map(f => ({
        name: f.name,
        path: f.path,
        size: f.size,
        type: f.type
      })),
      totalFound: result.totalFound
    });
  } catch (error) {
    throw new Error(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
