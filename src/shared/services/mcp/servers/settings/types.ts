/**
 * Settings MCP Server 核心类型定义
 * 
 * 权限分级：
 * - read:    只读操作，直接执行
 * - write:   低风险写入，白名单校验后执行
 * - confirm: 高风险操作（删除、创建），工具描述要求 AI 先向用户确认
 * - navigate: 导航操作，返回目标路径
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/** 工具权限级别 */
export type ToolPermission = 'read' | 'write' | 'confirm' | 'navigate';

/** 工具执行结果（统一格式） */
export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/** 设置工具定义 = MCP Tool 定义 + 处理器 + 元数据 */
export interface SettingsTool {
  /** MCP SDK 标准工具定义 */
  definition: Tool;
  /** 工具执行处理器 */
  handler: (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>;
  /** 权限分级 */
  permission: ToolPermission;
}

/** 工具模块接口 — 每个 *.tools.ts 导出的形状 */
export interface ToolModule {
  /** 领域标识，如 'knowledge' */
  readonly domain: string;
  /** 该领域的所有工具 */
  readonly tools: SettingsTool[];
}
