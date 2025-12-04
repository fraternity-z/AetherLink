/**
 * Agentic 循环处理模块
 */
import { v4 as uuid } from 'uuid';
import store from '../../../index';
import { agenticLoopService } from '../../../../services/AgenticLoopService';
import { agenticFileTracker } from '../../../../services/AgenticFileTracker';
import type { MessageBlock, ToolMessageBlock } from '../../../../types/newMessage';
import { MessageBlockType, MessageBlockStatus } from '../../../../types/newMessage';
import { 
  getNoToolsUsedReminder, 
  getTooManyMistakesMessage,
  getMaxIterationsReachedMessage 
} from '../../../../prompts/agentic/sections/responses';

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
  // 启用文件跟踪器
  agenticFileTracker.enable(topicId);
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
 * 从工具响应中提取搜索结果
 */
function extractWebSearchResults(content: any): any[] | null {
  if (!content) return null;
  
  // 1. 直接是搜索结果格式
  if (content.results && Array.isArray(content.results)) {
    return content.results;
  }
  
  // 2. MCP 格式，包含 webSearchResult
  if (content.webSearchResult?.results) {
    return content.webSearchResult.results;
  }
  
  // 3. MCP 格式，从 content[0].text 中提取（格式化后的文本）
  if (content.content && Array.isArray(content.content)) {
    const textContent = content.content.find((c: any) => c.type === 'text');
    if (textContent?.text) {
      // 直接返回格式化的文本给 AI
      return null; // 让下面的逻辑处理
    }
  }
  
  return null;
}

/**
 * 格式化工具结果内容为 AI 可理解的文本
 */
function formatToolResultForAI(toolName: string, content: any, isError: boolean, errorMessage?: string): string {
  if (isError) {
    return `Error: ${errorMessage || 'Unknown error'}`;
  }

  // 🚀 特殊处理网络搜索工具结果
  if (toolName === 'builtin_web_search' || toolName.includes('web_search')) {
    const results = extractWebSearchResults(content);
    
    if (results && results.length > 0) {
      const citationData = results.slice(0, 10).map((r: any, i: number) => 
        `[${i + 1}] ${r.title || 'No title'}: ${(r.snippet || r.content || '').slice(0, 150)}`
      );
      
      return `搜索完成，找到 ${results.length} 个结果：
${citationData.join('\n')}

请基于以上搜索结果回答用户问题，使用 [1]、[2] 等格式引用来源。`;
    }
    
    // 如果有格式化的文本内容，直接使用
    if (content?.content?.[0]?.text) {
      return content.content[0].text;
    }
    
    return '没有找到相关的搜索结果。';
  }

  // 其他工具结果
  if (typeof content === 'string') {
    return content;
  }
  
  // MCP 格式的其他工具
  if (content?.content?.[0]?.text) {
    return content.content[0].text;
  }
  
  return JSON.stringify(content);
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
    const formattedContent = formatToolResultForAI(
      result.toolName,
      result.content,
      result.isError,
      result.error?.message
    );

    if (isGeminiFormat) {
      // Gemini 格式的工具结果
      toolResultMessages.push({
        role: 'function',
        parts: [{
          functionResponse: {
            name: result.toolName,
            response: {
              content: formattedContent
            }
          }
        }]
      });
    } else {
      // OpenAI 格式的工具结果
      toolResultMessages.push({
        role: 'tool',
        tool_call_id: `call_${result.toolName}_${uuid().slice(0, 8)}`,
        content: formattedContent
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

/**
 * 生成"没有使用工具"的提醒消息
 * 当 AI 回复中没有工具调用时，注入此消息让 AI 继续
 */
export function buildNoToolsUsedMessage(isGeminiFormat: boolean): any {
  const reminderText = getNoToolsUsedReminder();
  
  if (isGeminiFormat) {
    return {
      role: 'user',
      parts: [{ text: reminderText }]
    };
  } else {
    return {
      role: 'user',
      content: reminderText
    };
  }
}

/**
 * 生成"连续错误过多"的提醒消息
 */
export function buildTooManyMistakesMessage(isGeminiFormat: boolean, feedback?: string): any {
  const messageText = getTooManyMistakesMessage(feedback);
  
  if (isGeminiFormat) {
    return {
      role: 'user',
      parts: [{ text: messageText }]
    };
  } else {
    return {
      role: 'user',
      content: messageText
    };
  }
}

/**
 * 生成"达到最大迭代次数"的提醒消息
 */
export function buildMaxIterationsMessage(isGeminiFormat: boolean): any {
  const config = agenticLoopService.getConfig();
  const messageText = getMaxIterationsReachedMessage(config.maxIterations);
  
  if (isGeminiFormat) {
    return {
      role: 'user',
      parts: [{ text: messageText }]
    };
  } else {
    return {
      role: 'user',
      content: messageText
    };
  }
}

/**
 * 增加连续错误计数（当 AI 没有使用工具时）
 */
export function incrementMistakeCount(): number {
  // 通过处理一个失败的工具结果来增加错误计数
  agenticLoopService.processToolResult({
    toolName: '_no_tool_used',
    success: false,
    isCompletion: false,
    content: null,
    error: 'AI did not use any tool in response'
  });
  return agenticLoopService.getState().consecutiveMistakeCount;
}

/**
 * 检查是否达到连续错误限制
 */
export function hasReachedMistakeLimit(): boolean {
  const state = agenticLoopService.getState();
  const config = agenticLoopService.getConfig();
  return state.consecutiveMistakeCount >= config.consecutiveMistakeLimit;
}

/**
 * 获取 AI 回复的文本内容（用于添加到消息历史）
 */
export async function getAssistantResponseContent(messageId: string): Promise<string> {
  const state = store.getState();
  const message = state.messages.entities[messageId];

  if (!message?.blocks) {
    return '';
  }

  // 获取所有文本块的内容
  const textContent = message.blocks
    .map((blockId: string) => state.messageBlocks.entities[blockId])
    .filter((block: MessageBlock | undefined): block is MessageBlock => 
      block?.type === MessageBlockType.MAIN_TEXT || block?.type === MessageBlockType.THINKING
    )
    .map((block: MessageBlock) => {
      // 安全地获取 content 属性
      if ('content' in block && typeof block.content === 'string') {
        return block.content;
      }
      return '';
    })
    .join('\n');

  return textContent;
}

/**
 * 构建 AI 回复消息（用于添加到消息历史）
 */
export function buildAssistantMessage(content: string, isGeminiFormat: boolean): any {
  if (isGeminiFormat) {
    return {
      role: 'model',
      parts: [{ text: content }]
    };
  } else {
    return {
      role: 'assistant',
      content: content
    };
  }
}
