/**
 * 响应工具函数
 */

import type { ToolResponse } from '../types';

/**
 * 创建成功响应
 */
export function createSuccessResponse(data: any): ToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(error: unknown): ToolResponse {
  const message = error instanceof Error ? error.message : '未知错误';
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: true, message }, null, 2)
      }
    ],
    isError: true
  };
}
