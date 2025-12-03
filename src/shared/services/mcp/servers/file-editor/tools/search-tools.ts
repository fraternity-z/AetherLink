/**
 * 搜索相关工具定义
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const SEARCH_FILES_TOOL: Tool = {
  name: 'search_files',
  description: '在目录中搜索文件。支持按文件名或内容搜索。',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: '搜索的目录路径'
      },
      query: {
        type: 'string',
        description: '搜索关键词，支持通配符 * 和 ?'
      },
      search_type: {
        type: 'string',
        enum: ['name', 'content', 'both'],
        description: '搜索类型：name(文件名), content(文件内容), both(两者都搜索)'
      },
      file_types: {
        type: 'array',
        items: { type: 'string' },
        description: '文件类型过滤，如 ["ts", "js", "md"]'
      }
    },
    required: ['directory', 'query']
  }
};
