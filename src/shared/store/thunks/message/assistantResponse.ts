/**
 * 助手响应处理模块
 * 重构后的精简版本，核心逻辑已拆分到 helpers 目录
 */
import { AssistantMessageStatus } from '../../../types/newMessage';
import { createResponseHandler } from '../../../services/messages/ResponseHandler';
import { ApiProviderRegistry } from '../../../services/messages/ApiProvider';
import { createAbortController } from '../../../utils/abortController';
import { newMessagesActions } from '../../slices/newMessagesSlice';
import { upsertOneBlock } from '../../slices/messageBlocksSlice';
import { prepareMessagesForApi, performKnowledgeSearchIfNeeded } from './apiPreparation';
import { getActualProviderType } from '../../../services/ProviderFactory';

import type { Message } from '../../../types/newMessage';
import type { Model, MCPTool } from '../../../types';
import type { RootState, AppDispatch } from '../../index';

// 导入辅助模块
import {
  updateMessageAndTopic,
  saveBlockToDB,
  isImageGenerationModel,
  handleImageGeneration,
  configureWebSearchTool,
  createWebSearchMcpTool,
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
  incrementMistakeCount,
  hasReachedMistakeLimit,
  // 新增：AI 回复处理
  getAssistantResponseContent,
  buildAssistantMessage,
  fetchAssistantInfo,
  createPlaceholderBlock,
  fetchMcpTools,
  prepareOriginalMessages,
  extractGeminiSystemPrompt
} from './helpers';

/**
 * 处理文本生成响应
 */
async function handleTextGeneration(context: {
  assistantMessage: Message;
  topicId: string;
  model: Model;
  mcpTools: MCPTool[];
  apiMessages: any[];
  filteredOriginalMessages: Message[];
  responseHandler: any;
  abortController: AbortController;
  assistant: any;
  webSearchTool: any;
  webSearchProviderId: string | undefined;
  extractedKeywords: any;
}): Promise<any> {
  const {
    assistantMessage, model, mcpTools, apiMessages,
    filteredOriginalMessages, responseHandler, abortController,
    assistant, webSearchTool, webSearchProviderId, extractedKeywords
  } = context;

  const apiProvider = ApiProviderRegistry.get(model);
  const actualProviderType = getActualProviderType(model);
  const isActualGeminiProvider = actualProviderType === 'gemini';

  let currentMessagesToSend = isActualGeminiProvider
    ? [...filteredOriginalMessages]
    : [...apiMessages];

  console.log(`[processAssistantResponse] Provider类型: ${model.provider} -> 实际类型: ${actualProviderType}, 使用${isActualGeminiProvider ? '原始' : 'API'}格式消息，消息数量: ${currentMessagesToSend.length}`);

  // 获取 MCP 模式设置
  const mcpMode = localStorage.getItem('mcp-mode') as 'prompt' | 'function' || 'function';
  console.log(`[MCP] 当前模式: ${mcpMode}`);

  // 准备工具列表（包含网络搜索工具）
  let allTools = [...mcpTools];
  if (webSearchTool && webSearchProviderId) {
    const webSearchMcpTool = createWebSearchMcpTool(webSearchTool, webSearchProviderId, extractedKeywords);
    allTools.push(webSearchMcpTool);
    console.log('[WebSearch] 网络搜索工具已添加到工具列表，AI 可自主决定是否调用');
  }

  // 提取系统提示词（所有供应商都需要）
  const systemPromptForProvider = extractGeminiSystemPrompt(apiMessages);

  // Agentic 循环
  let shouldContinueLoopFlag = true;
  let response: any;

  while (shouldContinueLoopFlag) {
    processAgenticIteration();

    response = await apiProvider.sendChatMessage(
      currentMessagesToSend as any,
      {
        onChunk: async (chunk: import('../../../types/chunk').Chunk) => {
          await responseHandler.handleChunk(chunk);
        },
        enableTools: context.mcpTools.length > 0 || !!webSearchTool,
        mcpTools: allTools,
        mcpMode,
        abortSignal: abortController.signal,
        assistant,
        systemPrompt: systemPromptForProvider
      }
    );

    // 非 Agentic 模式，单轮执行后结束
    if (!isInAgenticMode()) {
      shouldContinueLoopFlag = false;
      break;
    }

    // 收集工具调用结果
    const toolResults = await collectToolResults(assistantMessage.id);
    console.log(`[Agentic] 收集到 ${toolResults.length} 个工具结果`);

    if (toolResults.length === 0) {
      // AI 没有使用任何工具，增加错误计数并注入提醒消息
      const mistakeCount = incrementMistakeCount();
      console.log(`[Agentic] AI 没有使用工具，连续错误次数: ${mistakeCount}`);

      // 检查是否达到错误限制
      if (hasReachedMistakeLimit()) {
        console.log(`[Agentic] 达到连续错误限制，结束循环`);
        shouldContinueLoopFlag = false;
        break;
      }

      // 获取 AI 的回复内容，添加到消息历史
      const assistantContent = await getAssistantResponseContent(assistantMessage.id);
      if (assistantContent) {
        const assistantMsg = buildAssistantMessage(assistantContent, isActualGeminiProvider);
        currentMessagesToSend = [...currentMessagesToSend, assistantMsg];
        console.log(`[Agentic] 添加 AI 回复到消息历史: ${assistantContent.substring(0, 100)}...`);
      }

      // 注入提醒消息，让 AI 继续
      console.log(`[Agentic] 注入提醒消息，要求 AI 使用工具`);
      const reminderMessage = buildNoToolsUsedMessage(isActualGeminiProvider);
      currentMessagesToSend = [...currentMessagesToSend, reminderMessage];
      
      // 继续下一轮循环
      continue;
    }

    // 检查完成信号
    const completionResult = checkCompletionSignal(toolResults);
    if (completionResult) {
      handleCompletionSignal(completionResult);
      shouldContinueLoopFlag = false;
      break;
    }

    // 处理工具结果
    processToolResults(toolResults);

    // 检查是否应该继续
    if (!shouldContinueLoop()) {
      console.log(`[Agentic] 循环终止条件满足，结束循环`);
      shouldContinueLoopFlag = false;
      break;
    }

    // 将工具结果添加到消息历史
    console.log(`[Agentic] 工具执行完成，将结果发回 AI 继续下一轮`);
    currentMessagesToSend = buildMessagesWithToolResults(
      currentMessagesToSend,
      toolResults,
      isActualGeminiProvider
    );
  }

  endAgenticLoop();
  return response;
}

/**
 * 处理助手响应的主函数
 */
export const processAssistantResponse = async (
  dispatch: AppDispatch,
  _getState: () => RootState,
  assistantMessage: Message,
  topicId: string,
  model: Model,
  toolsEnabled?: boolean
) => {
  try {
    // 1. 获取助手信息
    const assistant = await fetchAssistantInfo(topicId);

    // 2. 设置消息状态为处理中
    dispatch(newMessagesActions.updateMessage({
      id: assistantMessage.id,
      changes: { status: AssistantMessageStatus.PROCESSING }
    }));

    // 3. 创建占位符块
    const placeholderBlock = createPlaceholderBlock(assistantMessage.id);
    console.log(`[sendMessage] 创建占位符块: ${placeholderBlock.id}`);

    dispatch(upsertOneBlock(placeholderBlock));
    await saveBlockToDB(placeholderBlock);

    // 4. 关联占位符块到消息
    dispatch(newMessagesActions.updateMessage({
      id: assistantMessage.id,
      changes: { blocks: [placeholderBlock.id] }
    }));

    // 5. 获取 MCP 工具
    const mcpTools = await fetchMcpTools(toolsEnabled);

    // 6. 检测并启动 Agentic 模式
    if (checkAgenticMode(mcpTools)) {
      startAgenticLoop(topicId);
    }

    // 7. 配置网络搜索工具
    const webSearchConfig = await configureWebSearchTool({
      getState: _getState,
      topicId,
      assistant
    });

    // 8. 准备 API 消息
    const apiMessages = await prepareMessagesForApi(topicId, assistantMessage.id, mcpTools, { skipKnowledgeSearch: true });
    const filteredOriginalMessages = await prepareOriginalMessages(topicId, assistantMessage);

    // 9. 更新数据库
    await updateMessageAndTopic(assistantMessage.id, topicId, {
      blocks: [placeholderBlock.id]
    });

    // 10. 创建 AbortController
    const { abortController, cleanup } = createAbortController(assistantMessage.askId, true);

    // 11. 创建响应处理器
    const responseHandler = createResponseHandler({
      messageId: assistantMessage.id,
      blockId: placeholderBlock.id,
      topicId,
      toolNames: mcpTools.map(t => t.name || t.id).filter((n): n is string => !!n),
      mcpTools
    });

    // 12. 执行知识库搜索
    await performKnowledgeSearchIfNeeded(topicId, assistantMessage.id);

    // 13. 检查是否为图像生成模型
    const isImageModel = isImageGenerationModel(model);

    try {
      let response: any;

      if (isImageModel) {
        // 图像生成
        response = await handleImageGeneration({
          dispatch,
          model,
          assistantMessage,
          topicId,
          apiMessages,
          responseHandler
        });
      } else {
        // 文本生成
        response = await handleTextGeneration({
          assistantMessage,
          topicId,
          model,
          mcpTools,
          apiMessages,
          filteredOriginalMessages,
          responseHandler,
          abortController,
          assistant,
          webSearchTool: webSearchConfig.webSearchTool,
          webSearchProviderId: webSearchConfig.webSearchProviderId,
          extractedKeywords: webSearchConfig.extractedKeywords
        });
      }

      // 处理响应
      let finalContent: string;
      let finalReasoning: string | undefined;
      let isInterrupted = false;

      if (typeof response === 'string') {
        finalContent = response;
      } else if (response && typeof response === 'object' && 'content' in response) {
        finalContent = response.content;
        finalReasoning = response.reasoning;
        isInterrupted = response.interrupted === true;
      } else {
        finalContent = '';
      }

      if (isInterrupted) {
        return await responseHandler.completeWithInterruption();
      }

      return await responseHandler.complete(finalContent, finalReasoning);

    } catch (error: any) {
      cancelAgenticLoop();

      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        console.log('[processAssistantResponse] 请求被用户中断');
        return await responseHandler.completeWithInterruption();
      }

      return await responseHandler.fail(error as Error);
    } finally {
      if (cleanup) {
        cleanup();
      }
    }

  } catch (error) {
    console.error('处理助手响应失败:', error);

    dispatch(newMessagesActions.setTopicLoading({ topicId, loading: false }));
    dispatch(newMessagesActions.setTopicStreaming({ topicId, streaming: false }));

    throw error;
  }
};
