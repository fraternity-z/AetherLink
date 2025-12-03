import store from '../../store';
import { EventEmitter, EVENT_NAMES } from '../EventService';
import { AssistantMessageStatus } from '../../types/newMessage';
import { newMessagesActions } from '../../store/slices/newMessagesSlice';
import type { Chunk, TextDeltaChunk } from '../../types/chunk';
import { ChunkType } from '../../types/chunk';

// 导入拆分后的处理器
import {
  createResponseChunkProcessor,
  ToolResponseHandler,
  ToolUseExtractionProcessor,
  KnowledgeSearchHandler,
  ResponseCompletionHandler,
  ResponseErrorHandler
} from './responseHandlers';
import { dexieStorage } from '../storage/DexieStorageService';
import { updateOneBlock, addOneBlock } from '../../store/slices/messageBlocksSlice';
import { getHighPerformanceUpdateInterval } from '../../utils/performanceSettings';

/**
 * 响应处理器配置类型
 */
type ResponseHandlerConfig = {
  messageId: string;
  blockId: string;
  topicId: string;
  /** 可用的 MCP 工具名称列表，用于流式工具检测 */
  toolNames?: string[];
  /** 完整的 MCP 工具列表，用于工具执行 */
  mcpTools?: import('../../types').MCPTool[];
};

/**
 * 响应处理错误
 */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}



/**
 * 创建响应处理器
 * 处理API流式/非流式响应的接收、更新和完成
 * 
 * ============= 响应处理链路 =============
 * 
 * Provider.sendChatMessage
 *   ↓ onChunk 回调
 * ResponseHandler.handleChunk
 *   ├─ THINKING_DELTA/COMPLETE → chunkProcessor.handleChunk (直接处理)
 *   ├─ TEXT_DELTA/COMPLETE → handleTextWithToolExtraction
 *   │     ├─ 工具提取器检测工具标签
 *   │     ├─ 纯文本 → chunkProcessor.handleChunk (保持原始类型)
 *   │     └─ 工具检测 → 完成当前块 + 重置块状态
 *   └─ MCP_TOOL_* → toolHandler.handleChunk
 * 
 * ============= 关键设计 =============
 * - handleChunk 是 async，Provider 必须 await
 * - TEXT 类型经过 handleTextWithToolExtraction 过滤工具标签
 * - 保持原始 chunk 类型（DELTA 或 COMPLETE），不强制转换
 * - 工具检测后重置块状态，让下一轮创建新块
 */
export function createResponseHandler({ messageId, blockId, topicId, toolNames = [], mcpTools = [] }: ResponseHandlerConfig) {
  // 创建各个专门的处理器实例
  const chunkProcessor = createResponseChunkProcessor(
    messageId,
    blockId,
    store,
    dexieStorage,
    { updateOneBlock, addOneBlock, upsertBlockReference: newMessagesActions.upsertBlockReference },
    getHighPerformanceUpdateInterval() // 根据节流强度设置动态调整
  );
  const toolHandler = new ToolResponseHandler(messageId, mcpTools);
  const toolExtractionProcessor = new ToolUseExtractionProcessor(toolNames);
  const knowledgeHandler = new KnowledgeSearchHandler(messageId);
  const completionHandler = new ResponseCompletionHandler(messageId, blockId, topicId);
  const errorHandler = new ResponseErrorHandler(messageId, blockId, topicId);

  // 事件监听器清理函数
  let eventCleanupFunctions: (() => void)[] = [];



  // 设置事件监听器
  const setupEventListeners = () => {
    console.log(`[ResponseHandler] 设置知识库搜索事件监听器`);

    // 监听知识库搜索完成事件
    const knowledgeSearchCleanup = EventEmitter.on(EVENT_NAMES.KNOWLEDGE_SEARCH_COMPLETED, async (data: any) => {
      if (data.messageId === messageId) {
        console.log(`[ResponseHandler] 处理知识库搜索完成事件，结果数量: ${data.searchResults?.length || 0}`);
        await knowledgeHandler.handleKnowledgeSearchComplete(data);
      }
    });

    eventCleanupFunctions = [knowledgeSearchCleanup];

    return () => {
      eventCleanupFunctions.forEach(cleanup => cleanup());
    };
  };

  const responseHandlerInstance = {
    /**
     * 处理标准化的 Chunk 事件 - 主要处理方法
     * @param chunk Chunk 事件对象
     */
    async handleChunk(chunk: Chunk): Promise<void> {
      try {
        switch (chunk.type) {
          case ChunkType.THINKING_DELTA:
          case ChunkType.THINKING_COMPLETE:
            // 思考内容直接委托给块处理器
            await chunkProcessor.handleChunk(chunk);
            break;

          case ChunkType.TEXT_DELTA:
          case ChunkType.TEXT_COMPLETE:
            // 文本内容通过工具提取处理器过滤（移除工具标签）
            await this.handleTextWithToolExtraction(chunk);
            break;

          case ChunkType.MCP_TOOL_IN_PROGRESS:
          case ChunkType.MCP_TOOL_COMPLETE:
            // 委托给工具处理器
            await toolHandler.handleChunk(chunk);
            break;

          default:
            console.log(`[ResponseHandler] 忽略未处理的 chunk 类型: ${chunk.type}`);
            break;
        }
      } catch (error) {
        console.error(`[ResponseHandler] 处理 chunk 事件失败:`, error);
        throw error;
      }
    },

    /**
     * 处理文本内容并检测工具调用
     * 
     * 参考项目设计：检测到工具时完成当前块，创建工具块，后续文本创建新块
     * 
     * 重要：此处只负责块切换逻辑，不执行工具！
     * 工具执行由 Provider 层的 processToolUses 统一处理，避免双重执行。
     */
    async handleTextWithToolExtraction(chunk: TextDeltaChunk | { type: ChunkType.TEXT_COMPLETE; text: string }): Promise<void> {
      const text = chunk.text;
      if (!text) return;

      // 保存原始 chunk 类型（DELTA 或 COMPLETE）
      const originalChunkType = chunk.type;

      // 通过工具提取处理器处理文本
      const results = toolExtractionProcessor.processText(text);

      for (const result of results) {
        switch (result.type) {
          case 'text':
            // 保持原始chunk类型，不强制转换
            if (result.content) {
              const textChunk: Chunk = {
                type: originalChunkType,
                text: result.content
              };
              await chunkProcessor.handleChunk(textChunk);
            }
            break;

          case 'tool_created':
            // 参考项目：检测到工具时的块切换逻辑
            // 关键：不立即创建新文本块，让下一轮的 thinking/text 自然触发新块创建
            if (result.responses && result.responses.length > 0) {
              // 1. 完成当前文本块（保持排序正确）
              const completedBlockId = await chunkProcessor.completeCurrentTextBlock();
              console.log(`[ResponseHandler] 工具检测：完成文本块 ${completedBlockId}`);
              
              // 2. 不执行工具！工具执行由 Provider 层通过 MCP_TOOL_IN_PROGRESS/COMPLETE 事件驱动
              // 参考项目：工具块的创建和状态更新通过事件分离，避免双重执行
              
              // 3. 检查是否是完成工具（attempt_completion）
              // 🔧 修复：完成工具之后不会有下一轮，不需要重置文本块状态
              // 否则 TEXT_COMPLETE 事件会创建重复的文本块
              const isCompletionTool = result.responses.some((r: any) => {
                const toolName = r.name || r.toolName || '';
                return toolName === 'attempt_completion' || toolName.endsWith('-attempt_completion');
              });
              
              if (!isCompletionTool) {
                // 非完成工具：重置文本块状态，让下一轮自动创建新块
                chunkProcessor.resetTextBlock();
              } else {
                console.log(`[ResponseHandler] 检测到完成工具，不重置文本块状态`);
              }
            }
            break;
        }
      }
    },

    /**
     * 处理字符串内容（简化版）
     * 主要用于图像生成完成后的简单状态消息
     */
    async handleStringContent(content: string): Promise<string> {
      // 检查消息是否完成
      const currentState = store.getState();
      const message = currentState.messages.entities[messageId];
      if (message?.status === AssistantMessageStatus.SUCCESS) {
        console.log(`[ResponseHandler] 消息已完成，停止处理`);
        return chunkProcessor.content;
      }

      try {
        // 直接作为文本内容处理
        const textChunk: TextDeltaChunk = {
          type: ChunkType.TEXT_DELTA,
          text: content
        };
        await this.handleChunk(textChunk);
      } catch (error) {
        console.error('[ResponseHandler] 处理字符串内容失败:', error);
        throw error;
      }

      return chunkProcessor.content;
    },

    /**
     * 完成处理
     * @param finalContent 最终文本内容
     * @param finalReasoning 最终思考内容（非流式响应时使用）
     */
    async complete(finalContent?: string, finalReasoning?: string): Promise<string> {
      return await completionHandler.complete(finalContent, chunkProcessor, finalReasoning);
    },

    /**
     * 中断完成
     */
    async completeWithInterruption(): Promise<string> {
      return await completionHandler.completeWithInterruption(chunkProcessor);
    },

    /**
     * 失败处理
     */
    async fail(error: Error): Promise<void> {
      return await errorHandler.fail(error);
    },

    /**
     * 获取状态
     */
    getStatus() {
      return {
        textContent: chunkProcessor.content,
        thinkingContent: chunkProcessor.thinking,
        textBlockId: chunkProcessor.textBlockId,
        thinkingBlockId: chunkProcessor.thinkingId
      };
    },

    /**
     * 清理资源
     */
    cleanup: () => {
      eventCleanupFunctions.forEach(cleanup => cleanup());
    }
  };

  // 设置事件监听器
  setupEventListeners();

  return responseHandlerInstance;
}

export default createResponseHandler;

/**
 * 设置响应状态 - 向后兼容
 */
export const setResponseState = ({ topicId, status, loading }: { topicId: string; status: string; loading: boolean }) => {
  const streaming = status === 'streaming';

  store.dispatch(newMessagesActions.setTopicStreaming({ topicId, streaming }));
  store.dispatch(newMessagesActions.setTopicLoading({ topicId, loading }));

  console.log(`[ResponseHandler] 设置响应状态: topicId=${topicId}, status=${status}, loading=${loading}`);
};
