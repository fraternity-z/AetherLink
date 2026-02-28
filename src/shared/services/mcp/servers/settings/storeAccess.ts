/**
 * Settings MCP Server — Redux Store 安全访问层
 * 
 * 隔离 Redux 依赖，所有工具模块通过此层访问应用状态。
 * 提供统一的结果构造工具函数。
 */

import store from '../../../../store';
import type { ToolResult } from './types';

// ─── 状态读取 ───

/** 获取当前设置状态（只读快照） */
export function getSettings() {
  return store.getState().settings;
}

/** 获取完整 Redux 状态 */
export function getRootState() {
  return store.getState();
}

/** 获取 Redux dispatch */
export function getDispatch() {
  return store.dispatch;
}

// ─── 结果构造 ───

/** 构造成功结果 */
export function createSuccessResult(data: unknown): ToolResult {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(
        { success: true, data },
        null,
        2
      )
    }]
  };
}

/** 构造错误结果 */
export function createErrorResult(message: string): ToolResult {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(
        { success: false, error: message },
        null,
        2
      )
    }],
    isError: true
  };
}
