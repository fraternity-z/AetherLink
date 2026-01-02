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

  // 跟踪已处理的文本长度（用于从累积内容中提取增量部分）
  // 参考 Cherry Studio：工具提取器应该处理增量内容，而不是累积内容
  let lastProcessedTextLength = 0;
  // 累积过滤后的文本内容（工具标签已移除）
  let accumulatedCleanText = '';

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
     * ⭐ 参考 Cherry Studio 架构：
     * 1. 从累积内容提取增量部分
     * 2. 增量部分给工具提取器处理
     * 3. 累积过滤后的文本（工具标签已移除）
     * 4. 发送累积内容给 chunkProcessor
     * 5. 检测到工具后，停止处理后续文本（防止覆盖）
     * 
     * 重要：此处只负责块切换逻辑，不执行工具！
     */
    async handleTextWithToolExtraction(chunk: TextDeltaChunk | { type: ChunkType.TEXT_COMPLETE; text: string }): Promise<void> {
      const text = chunk.text;
      if (!text) return;

      // 保存原始 chunk 类型（DELTA 或 COMPLETE）
      const originalChunkType = chunk.type;

      // ⭐ Step 1: 从累积内容中提取增量部分（参考 Cherry Studio）
      let incrementalText = text;
      if (text.length > lastProcessedTextLength) {
        // 累积模式：只提取新增的部分
        incrementalText = text.slice(lastProcessedTextLength);
        lastProcessedTextLength = text.length;
      } else if (text.length < lastProcessedTextLength) {
        // ⭐ 新一轮 API 调用开始（内容变短了）
        // 🔧 修复：先完成当前文本块（保存内容到数据库），再创建新块
        // 这样中断时，之前迭代的内容不会丢失
        console.log(`[ResponseHandler] 检测到新一轮响应，先保存当前内容再准备新文本块`);
        
        // 先完成当前文本块，确保内容已保存
        const savedBlockId = chunkProcessor.completeCurrentTextBlock();
        if (savedBlockId) {
          console.log(`[ResponseHandler] 已保存上一轮文本块: ${savedBlockId}`);
        }
        
        // 重置状态准备新块
        lastProcessedTextLength = text.length;
        accumulatedCleanText = '';
        chunkProcessor.resetTextBlock();
        incrementalText = text;  // 新一轮从头开始处理
      }
      // 如果没有新增内容，跳过处理
      if (!incrementalText) return;

      // ⭐ Step 2: 通过工具提取处理器处理增量文本
      const results = toolExtractionProcessor.processText(incrementalText);

      // ⭐ Step 3: 处理结果，累积过滤后的文本
      for (const result of results) {
        switch (result.type) {
          case 'text':
            if (result.content) {
              // 累积过滤后的文本（工具标签已移除）
              accumulatedCleanText += result.content;
              
              // ⭐ Step 4: 发送累积内容给 chunkProcessor（参考 Cherry Studio TextChunkMiddleware）
              const textChunk: Chunk = {
                type: originalChunkType,
                text: accumulatedCleanText  // 发送累积内容，不是增量
              };
              chunkProcessor.handleChunk(textChunk);
            }
            break;

          case 'tool_created':
            // 检测到工具时的块切换逻辑
            // ⭐ 重要修复：不再调用 resetTextBlock()
            // 原因：当模型一次性输出多个工具调用时，每次检测到工具都会创建新文本块
            // 导致文本块都在流式响应过程中创建，工具块在完成后创建，顺序错乱
            // 正确做法：只完成当前文本块，不创建新块，让后续文本继续追加
            if (result.responses && result.responses.length > 0) {
              // 只完成当前文本块，不重置状态
              const completedBlockId = chunkProcessor.completeCurrentTextBlock();
              console.log(`[ResponseHandler] 工具检测：完成文本块 ${completedBlockId}，不创建新块`);
              // 注意：不调用 resetTextBlock() 和不清空 accumulatedCleanText
              // 后续文本会继续更新同一个文本块
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
