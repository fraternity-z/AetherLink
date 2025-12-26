/**
 * 助手响应处理辅助模块导出
 */

// 类型定义
export type {
  TextGenerationContext,
  ImageGenerationContext,
  ResponseHandlerLike,
  ProcessAssistantResponseParams
} from './types';

// 数据库辅助函数
export {
  updateMessageAndTopic,
  saveBlockToDB,
  saveBlocksToDB
} from './dbHelpers';

// 模型检测
export { isGenerateImageModel as isImageGenerationModel } from '../../../../../config/models';
export { isGeminiModel as isGeminiProvider } from '../../../../../config/models';

// 图像生成
export { handleImageGeneration } from './imageGeneration';

// 网络搜索工具
export {
  configureWebSearchTool,
  createWebSearchMcpTool,
  type WebSearchConfig
} from './webSearchTool';

// Agentic 循环
export {
  checkAgenticMode,
  startAgenticLoop,
  collectToolResults,
  buildMessagesWithToolResults,
  processAgenticIteration,
  checkCompletionSignal,
  processToolResults,
  handleCompletionSignal,
  shouldContinueLoop,
  endAgenticLoop,
  cancelAgenticLoop,
  isInAgenticMode,
  // 新增：提醒消息生成
  buildNoToolsUsedMessage,
  buildTooManyMistakesMessage,
  buildMaxIterationsMessage,
  incrementMistakeCount,
  hasReachedMistakeLimit,
  // 新增：AI 回复处理
  getAssistantResponseContent,
  buildAssistantMessage,
  type ToolCallResultInfo
} from './agenticLoop';

// 助手信息
export { fetchAssistantInfo } from './assistantHelpers';

// 消息块
export { createPlaceholderBlock } from './blockHelpers';

// MCP 工具
export { fetchMcpTools } from './mcpHelpers';

// 消息准备
export {
  prepareOriginalMessages,
  extractGeminiSystemPrompt
} from './messagePreparation';
