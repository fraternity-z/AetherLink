/**
 * AI SDK OpenAI 模块导出
 * 提供基于 @ai-sdk/openai 的 OpenAI 供应商实现
 */

// 导出客户端模块
export {
  createClient,
  isAzureOpenAI,
  supportsMultimodal,
  supportsWebSearch,
  supportsReasoning,
  getWebSearchParams,
  testConnection
} from './client';

// 导出流式处理模块
export {
  streamCompletion,
  nonStreamCompletion,
  type StreamResult,
  type StreamParams
} from './stream';

// 导出工具模块
export {
  convertMcpToolsToAISDK,
  convertMcpToolsToOpenAI,
  convertToolCallsToMcpResponses,
  mcpToolCallResponseToOpenAIMessage,
  WEB_SEARCH_TOOL
} from './tools';

// 导出 Provider 类
export {
  BaseOpenAIAISDKProvider,
  BaseOpenAIProvider,
  OpenAIAISDKProvider
} from './provider';

// 重新导出类型
export type { Model, Message, MCPTool } from '../../types';
