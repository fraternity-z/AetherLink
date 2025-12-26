/**
 * 记忆工具定义
 * 用于 AI 通过工具调用自主决定何时创建/编辑/删除记忆
 */

import type { MCPTool } from '../../types';

/**
 * 记忆工具名称常量
 */
export const MEMORY_TOOL_NAMES = {
  CREATE: 'create_memory',
  EDIT: 'edit_memory',
  DELETE: 'delete_memory',
} as const;

/** 内置记忆服务标识 */
const MEMORY_SERVER_ID = '__memory__';
const MEMORY_SERVER_NAME = 'Memory';

/**
 * 获取记忆工具定义列表
 */
export function getMemoryToolDefinitions(): MCPTool[] {
  return [
    {
      id: MEMORY_TOOL_NAMES.CREATE,
      name: MEMORY_TOOL_NAMES.CREATE,
      serverId: MEMORY_SERVER_ID,
      serverName: MEMORY_SERVER_NAME,
      description: '创建一条新的记忆记录。当用户分享重要的个人信息、偏好、习惯或其他值得记住的事实时使用此工具。',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: '要记住的内容，应该是一个简洁的事实陈述'
          }
        },
        required: ['content']
      }
    },
    {
      id: MEMORY_TOOL_NAMES.EDIT,
      name: MEMORY_TOOL_NAMES.EDIT,
      serverId: MEMORY_SERVER_ID,
      serverName: MEMORY_SERVER_NAME,
      description: '更新一条已存在的记忆记录。当用户提供的新信息与已有记忆相关但需要更新时使用。',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: '要更新的记忆记录 ID'
          },
          content: {
            type: 'string',
            description: '更新后的记忆内容'
          }
        },
        required: ['id', 'content']
      }
    },
    {
      id: MEMORY_TOOL_NAMES.DELETE,
      name: MEMORY_TOOL_NAMES.DELETE,
      serverId: MEMORY_SERVER_ID,
      serverName: MEMORY_SERVER_NAME,
      description: '删除一条记忆记录。当用户明确要求忘记某些信息，或记忆不再准确时使用。',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: '要删除的记忆记录 ID'
          }
        },
        required: ['id']
      }
    }
  ];
}

/**
 * 检查工具名称是否为记忆工具
 */
export function isMemoryTool(toolName: string): boolean {
  return Object.values(MEMORY_TOOL_NAMES).includes(toolName as any);
}
