/**
 * MCP 客户端接口定义
 * 统一所有 MCP 客户端实现的类型约束，替代 any 类型
 */

import type { MCPTool, MCPCallToolResponse } from '../../../types';

/**
 * 工具调用参数接口
 */
export interface MCPCallToolParams {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * 列表工具响应接口
 */
export interface MCPListToolsResponse {
  tools: MCPTool[];
}

/**
 * 列表提示词响应接口
 */
export interface MCPListPromptsResponse {
  prompts: Array<{
    name: string;
    description?: string;
    arguments?: unknown[];
  }>;
}

/**
 * 列表资源响应接口
 */
export interface MCPListResourcesResponse {
  resources: Array<{
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
  }>;
}

/**
 * MCP 客户端接口
 * 所有 MCP 客户端实现都应符合此接口
 */
export interface IMCPClient {
  /**
   * 连接到 MCP 服务器
   */
  connect(): Promise<void>;

  /**
   * 关闭与 MCP 服务器的连接
   */
  close(): Promise<void>;

  /**
   * 健康检查（ping）
   * 某些传输类型可能不支持此操作
   */
  ping(): Promise<void>;

  /**
   * 列出服务器可用的工具
   */
  listTools(): Promise<MCPListToolsResponse>;

  /**
   * 调用工具
   * @param params 工具调用参数
   * @param meta 可选的元数据
   * @param options 可选的选项（如超时）
   */
  callTool(
    params: MCPCallToolParams,
    meta?: unknown,
    options?: { timeout?: number }
  ): Promise<MCPCallToolResponse>;

  /**
   * 列出服务器可用的提示词
   */
  listPrompts(): Promise<MCPListPromptsResponse>;

  /**
   * 列出服务器可用的资源
   */
  listResources(): Promise<MCPListResourcesResponse>;
}

/**
 * MCP 客户端适配器接口
 * 用于 HTTP/SSE/Stdio 等传输类型的适配器
 */
export interface IMCPClientAdapter {
  /**
   * 初始化适配器
   */
  initialize(): Promise<void>;

  /**
   * 关闭适配器
   */
  close(): Promise<void>;

  /**
   * 列出工具
   */
  listTools(): Promise<MCPTool[]>;

  /**
   * 调用工具
   */
  callTool(name: string, arguments_: Record<string, unknown>): Promise<MCPCallToolResponse>;

  /**
   * 列出提示词
   */
  listPrompts(): Promise<unknown[]>;

  /**
   * 列出资源
   */
  listResources(): Promise<unknown[]>;
}

/**
 * 创建兼容 IMCPClient 的客户端对象
 * 用于将适配器包装为标准客户端接口
 */
export function createCompatibleClient(adapter: IMCPClientAdapter): IMCPClient {
  return {
    connect: async () => { /* 适配器已在初始化时连接 */ },
    close: async () => { await adapter.close(); },
    ping: async () => { /* 某些传输类型不支持 ping */ },
    listTools: async () => {
      const tools = await adapter.listTools();
      return { tools };
    },
    callTool: async (params: MCPCallToolParams) => {
      return await adapter.callTool(params.name, params.arguments as Record<string, unknown>);
    },
    listPrompts: async () => {
      const prompts = await adapter.listPrompts();
      return { prompts: prompts as MCPListPromptsResponse['prompts'] };
    },
    listResources: async () => {
      const resources = await adapter.listResources();
      return { resources: resources as MCPListResourcesResponse['resources'] };
    }
  };
}
