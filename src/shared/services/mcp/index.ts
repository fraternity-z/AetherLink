/**
 * MCP (Model Context Protocol) 模块统一导出
 * 
 * 这个文件统一导出所有MCP相关的组件，包括：
 * - 核心服务 (core)
 * - 客户端实现 (clients) 
 * - 内置服务器 (servers)
 */

// 核心服务
export { MCPService, mcpService } from './core/MCPService';
export { createInMemoryMCPServer } from './core/MCPServerFactory';

// 客户端实现
export { MCPClientAdapter } from './clients/MCPClientAdapter';
export { StdioMCPClient } from './clients/StdioMCPClient';

// 内置服务器
export { TimeServer } from './servers/TimeServer.js';
export { FetchServer } from './servers/FetchServer.js';
export { CalculatorServer } from './servers/CalculatorServer.js';
export { FileEditorServer } from './servers/FileEditorServer.js';

// 类型定义 (从共享类型中重新导出)
export type {
  MCPServer,
  MCPTool,
  MCPPrompt,
  MCPResource,
  MCPCallToolResponse,
  MCPToolResponse,
  MCPServerType
} from '../../types';
