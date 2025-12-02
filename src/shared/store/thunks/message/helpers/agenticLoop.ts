/**
 * Agentic 循环处理模块
 */
import { v4 as uuid } from 'uuid';
import store from '../../../index';
import { agenticLoopService } from '../../../../services/AgenticLoopService';
import type { MessageBlock, ToolMessageBlock } from '../../../../types/newMessage';
import { MessageBlockType, MessageBlockStatus } from '../../../../types/newMessage';

/**
 * 工具调用结果类型
 */
export interface ToolCallResultInfo {
  toolName: string;
  content: any;
  isError: boolean;
  error?: { message: string };
  _meta?: { isCompletion?: boolean };
}

/**
 * 检测是否应该启用 Agentic 模式
 */
export function checkAgenticMode(mcpTools: { serverName?: string }[]): boolean {
  const enabledServerNames = mcpTools
    .map(tool => tool.serverName)
    .filter((name, index, self): name is string =>
      !!name && self.indexOf(name) === index
    );

  return agenticLoopService.shouldEnableAgenticMode(enabledServerNames);
}

/**
 * 启动 Agentic 循环
 */
export function startAgenticLoop(topicId: string): void {
  console.log(`[Agentic] 检测到 @aether/file-editor，启用 Agentic 模式`);
  agenticLoopService.startLoop(topicId);
}

/**
 * 收集消息的工具调用结果
 */
export async function collectToolResults(messageId: string): Promise<ToolCallResultInfo[]> {
  const state = store.getState();
  const message = state.messages.entities[messageId];

  if (!message?.blocks) {
    return [];
  }

  // 获取所有工具块
  const toolBlocks = message.blocks
    .map((blockId: string) => state.messageBlocks.entities[blockId])
    .filter((block: MessageBlock | undefined): block is ToolMessageBlock =>
      block?.type === MessageBlockType.TOOL
    );

  // 提取结果
  return toolBlocks.map((block: ToolMessageBlock) => ({
    toolName: block.toolName || 'unknown',
    content: block.content,
    isError: block.status === MessageBlockStatus.ERROR,
    error: block.error ? { message: String(block.error.message || block.error) } : undefined,
    _meta: block.metadata?._meta as { isCompletion?: boolean } | undefined
  }));
}

/**
 * 构建包含工具结果的消息数组
 */
export function buildMessagesWithToolResults(
  previousMessages: any[],
  toolResults: ToolCallResultInfo[],
  isGeminiFormat: boolean
): any[] {
  const toolResultMessages: any[] = [];

  for (const result of toolResults) {
    if (isGeminiFormat) {
      // Gemini 格式的工具结果
      toolResultMessages.push({
        role: 'function',
        parts: [{
          functionResponse: {
            name: result.toolName,
            response: {
              content: result.isError
                ? `Error: ${result.error?.message || 'Unknown error'}`
                : (typeof result.content === 'string' ? result.content : JSON.stringify(result.content))
            }
          }
        }]
      });
    } else {
      // OpenAI 格式的工具结果
      toolResultMessages.push({
        role: 'tool',
        tool_call_id: `call_${result.toolName}_${uuid().slice(0, 8)}`,
        content: result.isError
          ? `Error: ${result.error?.message || 'Unknown error'}`
          : (typeof result.content === 'string' ? result.content : JSON.stringify(result.content))
      });
    }
  }

  return [...previousMessages, ...toolResultMessages];
}

/**
 * 处理 Agentic 循环迭代
 */
export function processAgenticIteration(): number {
  if (agenticLoopService.getState().isAgenticMode) {
    const iteration = agenticLoopService.startIteration();
    console.log(`[Agentic] 开始第 ${iteration} 次迭代`);
    return iteration;
  }
  return 0;
}

/**
 * 检查是否有完成信号
 */
export function checkCompletionSignal(toolResults: ToolCallResultInfo[]): ToolCallResultInfo | undefined {
  return toolResults.find(result => agenticLoopService.isCompletionSignal(result));
}

/**
 * 处理工具结果
 */
export function processToolResults(toolResults: ToolCallResultInfo[]): void {
  for (const result of toolResults) {
    agenticLoopService.processToolResult({
      toolName: result.toolName || 'unknown',
      success: !result.isError,
      isCompletion: false,
      content: result.content,
      error: result.error?.message
    });
  }
}

/**
 * 处理完成信号
 */
export function handleCompletionSignal(completionResult: ToolCallResultInfo): void {
  agenticLoopService.processToolResult({
    toolName: 'attempt_completion',
    success: true,
    isCompletion: true,
    content: completionResult
  });
  console.log(`[Agentic] 检测到 attempt_completion，任务完成`);
}

/**
 * 检查是否应该继续循环
 */
export function shouldContinueLoop(): boolean {
  return agenticLoopService.shouldContinue();
}

/**
 * 结束 Agentic 循环
 */
export function endAgenticLoop(): void {
  if (agenticLoopService.getState().isAgenticMode) {
    const finalState = agenticLoopService.endLoop();
    console.log(`[Agentic] 循环结束:`, {
      totalIterations: finalState.currentIteration,
      completionReason: finalState.completionReason,
      hasCompletionResult: !!finalState.completionResult
    });
  }
}

/**
 * 取消 Agentic 循环
 */
export function cancelAgenticLoop(): void {
  if (agenticLoopService.getState().isAgenticMode) {
    agenticLoopService.cancel();
    console.log(`[Agentic] 由于错误取消循环`);
  }
}

/**
 * 检查是否在 Agentic 模式
 */
export function isInAgenticMode(): boolean {
  return agenticLoopService.getState().isAgenticMode;
}
