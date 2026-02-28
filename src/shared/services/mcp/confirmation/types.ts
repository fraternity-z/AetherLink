/**
 * MCP 工具确认系统 — 类型定义
 * 
 * 为 MCP 工具调用提供统一的敏感操作确认/拒绝机制。
 * 拦截点在 MCPService.callTool() 网关层，AI 无法绕过。
 */

/** 风险等级 */
export type RiskLevel = 'medium' | 'high';

/** 确认请求 */
export interface ToolConfirmationRequest {
  /** 唯一请求 ID */
  id: string;
  /** MCP 服务器名 */
  serverName: string;
  /** 工具名 */
  toolName: string;
  /** 工具参数 */
  arguments: Record<string, unknown>;
  /** 人类可读的操作摘要 */
  summary: string;
  /** 风险等级 */
  risk: RiskLevel;
  /** 请求时间戳 */
  timestamp: number;
}

/** 确认响应 */
export interface ToolConfirmationResponse {
  /** 关联的请求 ID */
  requestId: string;
  /** 用户是否批准 */
  approved: boolean;
}

/** 已注册的可确认工具信息 */
export interface ConfirmableToolEntry {
  /** 完整工具名（serverName::toolName 或直接 toolName） */
  toolName: string;
  /** 风险等级 */
  risk: RiskLevel;
  /** 摘要生成器（可选），根据参数生成人类可读摘要 */
  summaryBuilder?: (args: Record<string, unknown>) => string;
}
