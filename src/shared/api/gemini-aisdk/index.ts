/**
 * AI SDK Gemini 模块导出
 * 提供基于 @ai-sdk/google 的 Gemini 供应商实现
 */

// 导出客户端模块
export {
  createClient,
  supportsMultimodal,
  supportsImageGeneration,
  supportsGoogleSearch,
  supportsThinking,
  isGemmaModel,
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
  convertMcpToolsToGemini,
  convertToolCallsToMcpResponses,
  mcpToolCallResponseToGeminiMessage,
  createGoogleSearchTool,
  hasGoogleSearchTool,
  filterMcpTools,
  parseGroundingMetadata
} from './tools';

// 导出配置构建器
export {
  GeminiConfigBuilder,
  createGeminiConfigBuilder,
  isGeminiReasoningModel,
  isGeminiImageModel,
  isGemmaModel as isGemmaModelConfig,
  SafetyThreshold,
  HarmCategory,
  type SafetySetting,
  type ThinkingConfig,
  type GeminiConfig
} from './configBuilder';

// 导出 Provider 类
export {
  BaseGeminiAISDKProvider,
  BaseGeminiProvider,
  GeminiAISDKProvider
} from './provider';

// 导出嵌入服务
export {
  createGeminiEmbeddingService,
  type GeminiEmbeddingService
} from './embeddingService';

// 导出图像生成
export {
  generateImage,
  type GeneratedImage,
  type ImageGenerationOptions
} from './image';

// 导出视频生成 (Google Veo)
export {
  generateVideoWithVeo,
  submitVeoGeneration,
  pollVeoOperation,
  type GoogleVeoParams,
  type GoogleVeoResult
} from './veo';

// 重新导出类型
export type { Model, Message, MCPTool } from '../../types';
