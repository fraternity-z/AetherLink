/**
 * Gemini 补全服务
 * 
 * Phase 2: 提取消息准备、工具配置和工具调用循环逻辑
 * 职责：
 * - 消息历史准备
 * - 工具和系统提示词配置
 * - 多轮工具调用循环执行
 */

import type {
  Content,
  FunctionCall,
  Part,
  PartUnion,
  Tool,
  GenerateContentConfig,
  Chat
} from '@google/genai';
import type { Message, Model, MCPTool, MCPToolResponse as GlobalMCPToolResponse } from '../../types';
import { ChunkType } from '../../types/chunk';

import {
  isGemmaModel,
  isWebSearchModel
} from '../../config/models';
import { takeRight } from 'lodash';
import { filterUserRoleStartMessages, filterEmptyMessages } from '../../utils/messageUtils/filters';
import { withRetry } from '../../utils/retryUtils';

import { createGeminiMessageContentService } from './messageContentService';
import { parseAndCallTools, getMCPSystemPrompt, parseToolUse } from '../../utils/mcpToolParser';
import { GeminiStreamProcessor } from './streamProcessor';

// ============= 类型定义 =============

/**
 * 补全服务参数
 */
export interface CompletionServiceParams {
  messages: Message[];
  assistant: any;
  mcpTools: MCPTool[];
  mcpMode?: 'prompt' | 'function';
  onChunk: (chunk: any) => void;
  onFilterMessages: (messages: Message[]) => void;
}

/**
 * 消息历史准备结果
 */
export interface PreparedMessageHistory {
  history: Content[];
  userLastMessage: Message;
  filteredMessages: Message[];
}

/**
 * 工具和提示词配置结果
 */
export interface ToolsAndPromptConfig {
  systemInstruction: string;
  tools: Tool[];
  usePromptMode: boolean;
}

/**
 * 工具调用循环上下文
 */
export interface ToolCallLoopContext {
  chat: Chat;
  messageContents: Content;
  history: Content[];
  mcpTools: MCPTool[];
  usePromptMode: boolean;
  streamOutput: boolean;
  generateContentConfig: GenerateContentConfig;
  onChunk: (chunk: any) => void;
  abortController: AbortController;
  streamProcessor: GeminiStreamProcessor;
}

// ============= 服务实现 =============

/**
 * Gemini 补全服务类
 */
export class GeminiCompletionService {
  private model: Model;

  constructor(model: Model) {
    this.model = model;
  }

  /**
   * 获取助手设置
   */
  getAssistantSettings(assistant: any) {
    const maxTokens = Math.max(assistant?.maxTokens || assistant?.settings?.maxTokens || 4096, 1);
    const streamOutputValue = assistant?.settings?.streamOutput ?? assistant?.streamOutput;
    const streamOutput = streamOutputValue !== false;

    return {
      contextCount: assistant?.settings?.contextCount || 10,
      maxTokens: maxTokens,
      streamOutput: streamOutput
    };
  }

  /**
   * 准备消息历史
   * 职责：过滤消息、转换为 Gemini Content 格式
   */
  async prepareMessageHistory(
    messages: Message[],
    assistant: any,
    onFilterMessages: (messages: Message[]) => void
  ): Promise<PreparedMessageHistory> {
    const { contextCount } = this.getAssistantSettings(assistant);
    
    // 过滤消息
    const userMessages = filterUserRoleStartMessages(
      filterEmptyMessages(takeRight(messages, contextCount + 2))
    );
    onFilterMessages(userMessages);

    const userLastMessage = userMessages.pop()!;
    const history: Content[] = [];

    // 转换消息为 Gemini 格式
    const messageContentService = createGeminiMessageContentService(this.model);
    for (const message of userMessages) {
      history.push(await messageContentService.getMessageContents(message));
    }

    return {
      history,
      userLastMessage,
      filteredMessages: userMessages
    };
  }

  /**
   * 配置工具和系统提示词
   * 职责：根据 mcpMode 决定使用 Function Calling 还是提示词注入
   */
  setupToolsAndPrompt(
    assistant: any,
    mcpTools: MCPTool[],
    mcpMode: 'prompt' | 'function',
    model: Model
  ): ToolsAndPromptConfig {
    let systemInstruction = assistant.prompt || '';
    const usePromptMode = mcpMode === 'prompt';
    let tools: Tool[] = [];

    if (mcpTools && mcpTools.length > 0) {
      if (usePromptMode) {
        // 提示词注入模式
        const mcpToolPrompt = getMCPSystemPrompt(mcpTools);
        if (mcpToolPrompt) {
          systemInstruction = systemInstruction + '\n\n' + mcpToolPrompt;
          console.log(`[GeminiCompletionService] 提示词模式：已注入 ${mcpTools.length} 个工具的提示词`);
        }
      } else {
        // 函数调用模式
        tools = this.convertMcpTools(mcpTools);
        console.log(`[GeminiCompletionService] 函数调用模式：使用 ${tools.length} 个工具`);
      }
    }

    // 添加网页搜索工具
    if (assistant.enableWebSearch && isWebSearchModel(model)) {
      tools.push({
        // @ts-ignore googleSearch is not a valid tool for Gemini
        googleSearch: {}
      });
    }

    return { systemInstruction, tools, usePromptMode };
  }

  /**
   * 转换 MCP 工具为 Gemini 格式
   */
  private convertMcpTools(mcpTools: MCPTool[]): Tool[] {
    return mcpTools.map((tool) => {
      let toolName = tool.id || tool.name;

      // 清理工具名称
      if (/^\d/.test(toolName)) toolName = `mcp_${toolName}`;
      toolName = toolName.replace(/[^a-zA-Z0-9_.-]/g, '_');
      if (toolName.length > 64) toolName = toolName.substring(0, 64);
      if (!/^[a-zA-Z_]/.test(toolName)) toolName = `tool_${toolName}`;

      // 🔧 修复：清理 schema，确保所有 enum 值都是字符串
      const sanitizedSchema = this.sanitizeSchemaForGemini(tool.inputSchema);

      return {
        functionDeclarations: [{
          name: toolName,
          description: tool.description,
          parameters: sanitizedSchema
        }]
      };
    }) as Tool[];
  }

  /**
   * 清理 JSON Schema 以符合 Gemini API 要求
   * 
   * Gemini 的严格规则：
   * 1. 如果字段有 enum，type 必须是 "string"
   * 2. enum 数组中的所有值必须是字符串
   * 3. 不能有 integer/number 类型的 enum
   */
  private sanitizeSchemaForGemini(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    // 创建浅拷贝避免修改原始对象
    const sanitized = Array.isArray(schema) ? [...schema] : { ...schema };

    // 🔧 核心修复：如果有 enum，强制 type 为 string 并转换值
    if (Array.isArray(sanitized.enum) && sanitized.enum.length > 0) {
      // 强制 type 为 string（Gemini 要求）
      sanitized.type = 'string';
      
      // 将所有 enum 值转换为字符串
      sanitized.enum = sanitized.enum.map((value: any) => {
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }
        return value;
      });
      
      // 移除 integer/number 类型相关的字段
      delete sanitized.minimum;
      delete sanitized.maximum;
      delete sanitized.multipleOf;
    }

    // 递归处理 properties
    if (sanitized.properties && typeof sanitized.properties === 'object') {
      sanitized.properties = Object.keys(sanitized.properties).reduce((acc, key) => {
        acc[key] = this.sanitizeSchemaForGemini(sanitized.properties[key]);
        return acc;
      }, {} as any);
    }

    // 递归处理 items（用于 array 类型）
    if (sanitized.items) {
      sanitized.items = this.sanitizeSchemaForGemini(sanitized.items);
    }

    // 递归处理 additionalProperties
    if (sanitized.additionalProperties && typeof sanitized.additionalProperties === 'object') {
      sanitized.additionalProperties = this.sanitizeSchemaForGemini(sanitized.additionalProperties);
    }

    // 递归处理 anyOf / oneOf / allOf
    ['anyOf', 'oneOf', 'allOf'].forEach(key => {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) => this.sanitizeSchemaForGemini(item));
      }
    });

    return sanitized;
  }

  /**
   * 处理 Gemma 模型的特殊格式
   */
  handleGemmaFormat(
    model: Model,
    assistant: any,
    messageContents: Content,
    systemInstruction: string,
    history: Content[]
  ): void {
    if (isGemmaModel(model) && assistant.prompt) {
      const isFirstMessage = history.length === 0;
      if (isFirstMessage && messageContents) {
        const systemMessage = [{
          text: '<start_of_turn>user\n' + systemInstruction + '<end_of_turn>\n' +
                '<start_of_turn>user\n' + (messageContents?.parts?.[0] as Part).text + '<end_of_turn>'
        }] as Part[];
        if (messageContents && messageContents.parts) {
          messageContents.parts[0] = systemMessage[0];
        }
      }
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 执行多轮工具调用循环
   * 核心循环逻辑：发送消息 → 处理响应 → 执行工具 → 继续或结束
   */
  async executeToolCallLoop(context: ToolCallLoopContext): Promise<void> {
    const {
      chat,
      messageContents,
      history,
      mcpTools,
      usePromptMode,
      streamOutput,
      generateContentConfig,
      onChunk,
      abortController,
      streamProcessor
    } = context;

    const maxIterations = 10;  // 增加到 10 次，避免过早结束
    let iteration = 0;
    let currentMessage = messageContents;
    let lastTextContent = '';  // 记录最后一次的文本内容

    await onChunk({ type: ChunkType.LLM_RESPONSE_CREATED });

    while (iteration < maxIterations) {
      iteration++;
      console.log(`[GeminiCompletionService] 第 ${iteration} 轮迭代`);

      // 发送请求
      let response;
      if (!streamOutput) {
        response = await withRetry(
          () => chat.sendMessage({
            message: currentMessage as PartUnion,
            config: {
              ...generateContentConfig,
              abortSignal: abortController.signal
            }
          }),
          'Gemini Non-Stream Request'
        );
      } else {
        response = await withRetry(
          () => chat.sendMessageStream({
            message: currentMessage as PartUnion,
            config: {
              ...generateContentConfig,
              abortSignal: abortController.signal
            }
          }),
          'Gemini Stream Request'
        );
      }

      // 处理响应
      const { functionCalls, textContent, hasXMLTools } = await streamProcessor.processStream(
        response,
        { onChunk, history, abortSignal: abortController.signal },
        iteration - 1
      );
      
      // 保存文本内容，以防循环强制结束时使用
      lastTextContent = textContent;

      // 处理 Function Calling 模式的工具调用
      if (functionCalls.length > 0 && mcpTools.length > 0) {
        console.log(`[GeminiCompletionService] 第 ${iteration} 轮检测到 ${functionCalls.length} 个工具调用（Function Calling 模式）`);
        
        // 检测是否包含 attempt_completion 工具
        const hasCompletion = functionCalls.some(fc => {
          const toolName = fc.name || '';
          return toolName === 'attempt_completion' || 
                 toolName.endsWith('-attempt_completion') ||
                 toolName.endsWith('_attempt_completion');
        });
        
        const toolResults = await this.processGeminiFunctionCalls(functionCalls, mcpTools, onChunk);
        
        if (toolResults.length > 0) {
          // 发送工具结果（作为 functionResponse parts）
          currentMessage = {
            role: 'user',
            parts: toolResults.flatMap(result => result.parts)
          } as Content;
          
          console.log(`[GeminiCompletionService] 发送 ${toolResults.length} 个工具执行结果给 Gemini`);
          
          // 如果包含 attempt_completion，结束循环
          if (hasCompletion) {
            console.log(`[GeminiCompletionService] Function Calling 模式：attempt_completion 已执行，结束工具调用循环`);
            await onChunk({
              type: ChunkType.BLOCK_COMPLETE,
              response: {
                text: textContent,
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                metrics: { completion_tokens: 0, time_completion_millsec: 0, time_first_token_millsec: 0 }
              }
            });
            break;
          }
          
          // 在下一轮迭代前延迟 1 秒，避免请求过于频繁
          console.log(`[GeminiCompletionService] 延迟 1 秒后继续下一轮迭代...`);
          await this.delay(1000);
          continue;  // 有工具调用，继续下一轮
        }
      }

      // 处理提示词模式的 XML 工具调用
      if (hasXMLTools && usePromptMode && mcpTools.length > 0) {
        console.log(`[GeminiCompletionService] 第 ${iteration} 轮检测到 XML 工具调用（提示词模式）`);
        
        history.push({
          role: 'model',
          parts: [{ text: textContent }]
        });
        
        const { messages: toolResults, hasCompletion } = await this.processXMLToolCalls(textContent, mcpTools, onChunk);
        
        if (toolResults.length > 0) {
          history.push(...toolResults);
          
          if (hasCompletion) {
            console.log(`[GeminiCompletionService] XML 模式：attempt_completion 已执行，结束工具调用循环`);
            await onChunk({
              type: ChunkType.BLOCK_COMPLETE,
              response: {
                text: textContent,
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                metrics: { completion_tokens: 0, time_completion_millsec: 0, time_first_token_millsec: 0 }
              }
            });
            break;
          }
          
          currentMessage = { role: 'user', parts: [{ text: '请根据工具执行结果继续回答。' }] } as Content;
          // 在下一轮迭代前延迟 1 秒，避免请求过于频繁
          console.log(`[GeminiCompletionService] 延迟 1 秒后继续下一轮迭代...`);
          await this.delay(1000);
          continue;  // 有工具调用，继续下一轮
        }
      }

      // 没有工具调用，AI 决定结束对话
      console.log(`[GeminiCompletionService] 没有工具调用，AI 决定结束`);
      await onChunk({
        type: ChunkType.BLOCK_COMPLETE,
        response: {
          text: textContent,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          metrics: { completion_tokens: 0, time_completion_millsec: 0, time_first_token_millsec: 0 }
        }
      });
      break;  // 由 AI 决定结束，不是强制循环
    }

    // 🔧 如果循环因为达到 maxIterations 而结束，发送最终响应
    if (iteration >= maxIterations) {
      console.log(`[GeminiCompletionService] 达到最大迭代次数 ${maxIterations}，强制结束并发送响应`);
      await onChunk({
        type: ChunkType.BLOCK_COMPLETE,
        response: {
          text: lastTextContent,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          metrics: { completion_tokens: 0, time_completion_millsec: 0, time_first_token_millsec: 0 }
        }
      });
    }
  }

  /**
   * 处理 Gemini Function Calling
   */
  private async processGeminiFunctionCalls(
    functionCalls: FunctionCall[],
    mcpTools: MCPTool[],
    onChunk?: (chunk: any) => void
  ): Promise<Content[]> {
    if (!functionCalls || functionCalls.length === 0) {
      return [];
    }

    console.log(`[GeminiCompletionService] 处理 ${functionCalls.length} 个工具调用`);

    const mcpToolResponses: GlobalMCPToolResponse[] = functionCalls.map((fc) => {
      const tool = mcpTools.find(t => {
        const toolName = (t.id || t.name).replace(/[^a-zA-Z0-9_.-]/g, '_');
        return toolName === fc.name || t.id === fc.name || t.name === fc.name;
      });
      
      const toolId = fc.id || `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id: toolId,
        toolCallId: toolId,
        tool: tool!,
        arguments: fc.args || {},
        status: 'pending' as const
      };
    }).filter(r => r.tool);

    if (mcpToolResponses.length === 0) {
      console.warn(`[GeminiCompletionService] 无法匹配任何工具调用`);
      return [];
    }

    const results = await parseAndCallTools(mcpToolResponses, mcpTools, onChunk);

    return results.map((result, index) => {
      const mcpResponse = mcpToolResponses[index];
      return {
        role: 'user',
        parts: [{
          functionResponse: {
            id: mcpResponse.toolCallId,
            name: mcpResponse.tool.id || mcpResponse.tool.name,
            response: {
              output: !result.isError ? result.content : undefined,
              error: result.isError ? result.content : undefined
            }
          }
        }]
      } as Content;
    });
  }

  /**
   * 处理提示词模式下的 XML 工具调用
   */
  private async processXMLToolCalls(
    textContent: string,
    mcpTools: MCPTool[],
    onChunk?: (chunk: any) => void
  ): Promise<{ messages: Content[]; hasXMLTools: boolean; hasCompletion: boolean }> {
    const toolResponses = parseToolUse(textContent, mcpTools);
    
    if (!toolResponses || toolResponses.length === 0) {
      return { messages: [], hasXMLTools: false, hasCompletion: false };
    }

    console.log(`[GeminiCompletionService] 提示词模式：检测到 ${toolResponses.length} 个 XML 工具调用`);
    
    const hasCompletion = toolResponses.some(tr => 
      tr.tool.name.endsWith('attempt_completion') || tr.tool.id?.endsWith('attempt_completion')
    );

    const results = await parseAndCallTools(toolResponses, mcpTools, onChunk);

    const messages = results.map((result, index) => {
      const toolResponse = toolResponses[index];
      const toolName = toolResponse.tool.name || toolResponse.tool.id || 'unknown';
      const contentText = result.content && result.content.length > 0
        ? JSON.stringify(result.content)
        : '工具调用完成，但没有返回内容';

      return {
        role: 'user',
        parts: [{
          text: `<tool_use_result>\n  <name>${toolName}</name>\n  <result>${contentText}</result>\n</tool_use_result>`
        }]
      } as Content;
    });

    if (hasCompletion) {
      console.log(`[GeminiCompletionService] 提示词模式：检测到 attempt_completion 工具`);
    }

    return { messages, hasXMLTools: true, hasCompletion };
  }
}

/**
 * 创建 Gemini 补全服务实例的工厂函数
 */
export function createGeminiCompletionService(model: Model): GeminiCompletionService {
  return new GeminiCompletionService(model);
}