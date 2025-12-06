/**
 * AI SDK Anthropic Provider
 * 使用 @ai-sdk/anthropic 实现的 Claude 供应商
 * 继承自 AbstractBaseProvider，支持 Extended Thinking 和 Claude 内置工具
 */
import { generateText } from 'ai';
import type { AnthropicProvider as AISDKAnthropicProvider } from '@ai-sdk/anthropic';
import { 
  createClient, 
  supportsMultimodal, 
  supportsExtendedThinking,
  supportsComputerUse,
  isClaudeReasoningModel
} from './client';
import { streamCompletion, nonStreamCompletion, type StreamResult } from './stream';
import { AbstractBaseProvider } from '../baseProvider';
import type { Message, Model, MCPTool, MCPToolResponse, MCPCallToolResponse } from '../../types';
import { parseAndCallTools, parseToolUse, removeToolUseTags } from '../../utils/mcpToolParser';
import {
  convertMcpToolsToAnthropic,
  mcpToolCallResponseToAnthropicMessage,
  convertToolCallsToMcpResponses
} from './tools';
import { ChunkType, type Chunk } from '../../types/chunk';
import { getMainTextContent } from '../../utils/blockUtils';
import { UnifiedParameterManager } from '../parameters/UnifiedParameterManager';
import { AnthropicParameterFormatter } from '../parameters/formatters';

/**
 * Anthropic 参数接口
 */
export interface AnthropicParameters {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  top_k?: number;
  stop_sequences?: string[];
}

/**
 * Extended Thinking 参数接口
 */
export interface ThinkingParameters {
  type: 'enabled' | 'disabled';
  budgetTokens?: number;
}

/**
 * AI SDK Anthropic Provider 基类
 */
export abstract class BaseAnthropicAISDKProvider extends AbstractBaseProvider {
  protected client: AISDKAnthropicProvider;
  protected parameterManager: UnifiedParameterManager;

  constructor(model: Model) {
    super(model);
    this.client = createClient(model);
    this.parameterManager = new UnifiedParameterManager({ model, providerType: 'anthropic' });
  }

  /**
   * 将 MCP 工具转换为 Anthropic 工具格式
   */
  public convertMcpTools<T>(mcpTools: MCPTool[]): T[] {
    return convertMcpToolsToAnthropic<T>(mcpTools);
  }

  /**
   * 检查模型是否支持多模态
   */
  protected supportsMultimodal(model?: Model): boolean {
    return supportsMultimodal(model || this.model);
  }

  /**
   * 检查模型是否支持扩展思考
   */
  protected supportsExtendedThinking(): boolean {
    return supportsExtendedThinking(this.model);
  }

  /**
   * 检查模型是否支持计算机使用
   */
  protected supportsComputerUse(): boolean {
    return supportsComputerUse(this.model);
  }

  /**
   * 检查是否为推理模型
   */
  protected isReasoningModel(): boolean {
    return isClaudeReasoningModel(this.model);
  }

  /**
   * 获取统一参数并转换为 Anthropic API 格式
   */
  protected getApiParams(assistant?: any): {
    unified: ReturnType<UnifiedParameterManager['getUnifiedParameters']>;
    apiParams: Record<string, any>;
  } {
    if (assistant) {
      this.parameterManager.updateAssistant(assistant);
    }
    const unified = this.parameterManager.getUnifiedParameters(isClaudeReasoningModel(this.model));
    const { customParameters, ...standardParams } = unified;
    const apiParams = AnthropicParameterFormatter.toAPIFormat(standardParams, this.model);
    
    // 🆕 合并自定义参数到 API 请求
    const finalParams = {
      ...apiParams,
      ...customParameters, // 自定义参数直接展开到请求中
    };
    
    return { unified, apiParams: finalParams };
  }

  /**
   * 获取 Extended Thinking 参数
   */
  protected getThinkingParameters(assistant?: any): ThinkingParameters | null {
    if (!this.supportsExtendedThinking()) {
      return null;
    }

    if (assistant) {
      this.parameterManager.updateAssistant(assistant);
    }
    const unified = this.parameterManager.getUnifiedParameters(true);
    
    if (!unified.reasoning?.enabled) {
      return { type: 'disabled' };
    }

    console.log(`[AnthropicProvider] 模型 ${this.model.id} Extended Thinking: enabled`);

    return {
      type: 'enabled',
      budgetTokens: unified.reasoning.budgetTokens
    };
  }

  /**
   * 准备 API 消息格式
   * 支持：文本、图像、PDF、缓存控制
   */
  protected async prepareAPIMessages(
    messages: Message[],
    systemPrompt?: string,
    mcpTools?: MCPTool[],
    options?: { enableCacheControl?: boolean }
  ): Promise<any[]> {
    const apiMessages = [];
    const enableCacheControl = options?.enableCacheControl ?? false;

    // 获取工作区列表
    const workspaces = mcpTools && mcpTools.length > 0 ? await this.getWorkspaces() : [];

    // 添加系统提示（支持缓存控制）
    const finalSystemPrompt = this.buildSystemPromptWithTools(systemPrompt || '', mcpTools, workspaces);
    if (finalSystemPrompt.trim()) {
      const systemMessage: any = {
        role: 'system',
        content: finalSystemPrompt
      };
      
      // Anthropic 缓存控制：将系统提示词标记为可缓存
      if (enableCacheControl) {
        systemMessage.providerOptions = {
          anthropic: { cacheControl: { type: 'ephemeral' } }
        };
      }
      
      apiMessages.push(systemMessage);
    }

    // 处理用户和助手消息（跳过 system 消息，因为已通过 buildSystemPromptWithTools 合并）
    for (const message of messages) {
      // 跳过 system 消息，避免重复
      if (message.role === 'system') {
        continue;
      }
      try {
        // 获取消息内容
        let content = (message as any).content;
        if (content === undefined) {
          content = getMainTextContent(message);
        }

        // 检查是否有附件（图像、PDF等）
        const files = (message as any).files || (message as any).attachments || [];
        const images = (message as any).images || [];
        
        // 如果有附件，构建多模态内容
        if (files.length > 0 || images.length > 0) {
          const contentParts: any[] = [];
          
          // 添加文本部分
          if (content && typeof content === 'string' && content.trim()) {
            contentParts.push({ type: 'text', text: content });
          }
          
          // 处理图像
          for (const image of images) {
            if (typeof image === 'string') {
              // Base64 或 URL
              if (image.startsWith('data:')) {
                const match = image.match(/^data:(.+);base64,(.+)$/);
                if (match) {
                  contentParts.push({
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: match[1],
                      data: match[2]
                    }
                  });
                }
              } else if (image.startsWith('http')) {
                contentParts.push({
                  type: 'image',
                  source: {
                    type: 'url',
                    url: image
                  }
                });
              }
            }
          }
          
          // 处理文件（PDF 等）
          for (const file of files) {
            const mediaType = file.mediaType || file.mimeType || file.type;
            const data = file.data || file.content;
            
            if (mediaType === 'application/pdf' && data) {
              // PDF 文件支持
              contentParts.push({
                type: 'file',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: typeof data === 'string' ? data : Buffer.from(data).toString('base64')
                }
              });
              console.log(`[Anthropic SDK Provider] 添加 PDF 文件: ${file.filename || 'unknown'}`);
            } else if (mediaType?.startsWith('image/') && data) {
              // 图像文件
              contentParts.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: typeof data === 'string' ? data : Buffer.from(data).toString('base64')
                }
              });
            }
          }
          
          if (contentParts.length > 0) {
            apiMessages.push({
              role: message.role,
              content: contentParts
            });
          }
        } else if (content && typeof content === 'string' && content.trim()) {
          // 纯文本消息
          apiMessages.push({
            role: message.role,
            content: content
          });
        }
      } catch (error) {
        console.error(`[Anthropic SDK Provider] 处理消息失败:`, error);
      }
    }

    // 确保至少有一条消息
    if (apiMessages.length === 0 || !apiMessages.some(msg => msg.role === 'user')) {
      apiMessages.push({
        role: 'user',
        content: '你好'
      });
    }

    return apiMessages;
  }

  /**
   * 测试 API 连接
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await generateText({
        model: this.client(this.model.id),
        prompt: 'Hello',
        maxOutputTokens: 5,
      });
      return Boolean(result.text);
    } catch (error) {
      console.error('[Anthropic SDK Provider] API 连接测试失败:', error);
      return false;
    }
  }

  /**
   * 将 MCP 工具调用响应转换为消息格式
   */
  public mcpToolCallResponseToMessage(
    mcpToolResponse: MCPToolResponse,
    resp: MCPCallToolResponse,
    model: Model,
    useXmlFormat: boolean = false
  ): any {
    return mcpToolCallResponseToAnthropicMessage(mcpToolResponse, resp, model, useXmlFormat);
  }

  /**
   * 将工具调用转换为 MCP 工具响应
   */
  protected convertToolCallsToMcpResponses(
    toolCalls: any[],
    mcpTools: MCPTool[]
  ): MCPToolResponse[] {
    return convertToolCallsToMcpResponses(toolCalls, mcpTools);
  }

  /**
   * 检测工具列表是否包含 attempt_completion
   */
  private hasCompletionTool(toolNames: string[]): boolean {
    return toolNames.some(name =>
      name === 'attempt_completion' || name.endsWith('-attempt_completion')
    );
  }

  /**
   * 处理工具调用（Function Calling 模式）
   */
  protected async processToolCalls(
    toolCalls: any[],
    mcpTools: MCPTool[],
    onChunk?: (chunk: Chunk) => void
  ): Promise<{ messages: any[]; hasCompletion: boolean }> {
    if (!toolCalls?.length) return { messages: [], hasCompletion: false };

    const toolNames = toolCalls.map(tc => tc.function?.name || tc.name || '');
    const hasCompletion = this.hasCompletionTool(toolNames);

    console.log(`[Anthropic SDK Provider] 处理 ${toolCalls.length} 个工具调用${hasCompletion ? '（含 attempt_completion）' : ''}`);

    const mcpToolResponses = this.convertToolCallsToMcpResponses(toolCalls, mcpTools);
    const results = await parseAndCallTools(mcpToolResponses, mcpTools, onChunk);
    
    const messages = results
      .map((result, i) => this.mcpToolCallResponseToMessage(mcpToolResponses[i], result, this.model, false))
      .filter(Boolean);

    return { messages, hasCompletion };
  }

  /**
   * 处理工具使用（XML 提示词模式）
   */
  protected async processToolUses(
    content: string,
    mcpTools: MCPTool[],
    onChunk?: (chunk: Chunk) => void
  ): Promise<{ messages: any[]; hasCompletion: boolean }> {
    if (!content || !mcpTools?.length) return { messages: [], hasCompletion: false };

    const toolResponses = parseToolUse(content, mcpTools);
    if (!toolResponses.length) return { messages: [], hasCompletion: false };

    const toolNames = toolResponses.map(tr => tr.tool?.name || tr.tool?.id || '');
    const hasCompletion = this.hasCompletionTool(toolNames);

    console.log(`[Anthropic SDK Provider] 处理 ${toolResponses.length} 个 XML 工具调用${hasCompletion ? '（含 attempt_completion）' : ''}`);

    const results = await parseAndCallTools(content, mcpTools, onChunk);
    const messages: any[] = [];

    for (let i = 0; i < Math.min(results.length, toolResponses.length); i++) {
      const msg = this.mcpToolCallResponseToMessage(toolResponses[i], results[i], this.model, true);
      if (msg) messages.push(msg);
    }

    return { messages, hasCompletion };
  }

  /**
   * 抽象方法：发送聊天消息
   */
  public abstract sendChatMessage(
    messages: Message[],
    options?: {
      onChunk?: (chunk: Chunk) => void;
      enableWebSearch?: boolean;
      enableThinking?: boolean;
      systemPrompt?: string;
      enableTools?: boolean;
      mcpTools?: MCPTool[];
      mcpMode?: 'prompt' | 'function';
      abortSignal?: AbortSignal;
      assistant?: any;
    }
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }>;
}

/**
 * AI SDK Anthropic Provider 实现类
 */
export class AnthropicAISDKProvider extends BaseAnthropicAISDKProvider {
  constructor(model: Model) {
    super(model);
    console.log(`[AnthropicAISDKProvider] 初始化完成，模型: ${model.id}`);
  }

  /**
   * 发送聊天消息 - 核心 API 调用
   */
  public async sendChatMessage(
    messages: Message[],
    options?: {
      onChunk?: (chunk: Chunk) => void;
      enableWebSearch?: boolean;
      enableThinking?: boolean;
      systemPrompt?: string;
      enableTools?: boolean;
      mcpTools?: MCPTool[];
      mcpMode?: 'prompt' | 'function';
      abortSignal?: AbortSignal;
      assistant?: any;
    }
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
    console.log(`[AnthropicAISDKProvider] 开始 API 调用, 模型: ${this.model.id}`);

    const {
      onChunk,
      systemPrompt = '',
      enableTools = true,
      mcpTools = [],
      mcpMode = 'function',
      abortSignal,
      assistant
    } = options || {};

    // 配置工具
    const { tools } = this.setupToolsConfig({
      mcpTools,
      model: this.model,
      enableToolUse: enableTools,
      mcpMode
    });

    // 准备 API 消息格式
    const apiMessages = await this.prepareAPIMessages(messages, systemPrompt, mcpTools);

    // 获取统一参数与 API 格式参数
    const { unified, apiParams } = this.getApiParams(assistant);
    const streamEnabled = unified.stream ?? true;

    console.log(`[AnthropicAISDKProvider] API 请求参数:`, {
      model: this.model.id,
      apiParams,
      stream: streamEnabled,
      工具数量: tools.length
    });

    // 检查 API 密钥
    if (!this.model.apiKey) {
      console.error('[AnthropicAISDKProvider] 错误: API 密钥未设置');
      throw new Error('API 密钥未设置，请在设置中配置 Anthropic API 密钥');
    }

    try {
      if (streamEnabled) {
        return await this.handleStreamResponse(apiMessages, {
          temperature: apiParams.temperature,
          maxTokens: apiParams.max_tokens,
          tools,
          mcpTools,
          mcpMode,
          onChunk,
          abortSignal,
          extraBody: apiParams
        });
      } else {
        return await this.handleNonStreamResponse(apiMessages, {
          temperature: apiParams.temperature,
          maxTokens: apiParams.max_tokens,
          tools,
          mcpTools,
          mcpMode,
          onChunk,
          abortSignal,
          extraBody: apiParams
        });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        console.log('[AnthropicAISDKProvider] 请求被用户中断');
        throw new DOMException('Operation aborted', 'AbortError');
      }

      console.error('[AnthropicAISDKProvider] API 请求失败:', error);
      throw error;
    }
  }

  /**
   * 处理流式响应
   */
  private async handleStreamResponse(
    messages: any[],
    options: {
      temperature?: number;
      maxTokens?: number;
      tools: any[];
      mcpTools: MCPTool[];
      mcpMode: 'prompt' | 'function';
      onChunk?: (chunk: Chunk) => void;
      abortSignal?: AbortSignal;
      extraBody?: Record<string, any>;
    }
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
    const {
      temperature,
      maxTokens,
      tools,
      mcpTools,
      mcpMode,
      onChunk,
      abortSignal,
      extraBody
    } = options;

    let currentMessages = [...messages];
    let iteration = 0;
    const maxIterations = 10;

    while (iteration < maxIterations) {
      iteration++;
      console.log(`[AnthropicAISDKProvider] 流式工具调用迭代 ${iteration}`);

      const usePromptMode = this.getUseSystemPromptForTools();
      const streamTools = usePromptMode ? [] : tools;

      const result: StreamResult = await streamCompletion(
        this.client,
        this.model.id,
        currentMessages,
        temperature,
        maxTokens,
        {
          signal: abortSignal,
          enableTools: !usePromptMode && tools.length > 0,
          mcpTools,
          mcpMode,
          model: this.model,
          tools: streamTools,
          extraBody
        },
        onChunk
      );

      // 检查是否有工具调用
      if (result.hasToolCalls) {
        console.log(`[AnthropicAISDKProvider] 检测到工具调用`);

        const content = result.content;
        const nativeToolCalls = result.nativeToolCalls;

        if (usePromptMode) {
          const { messages: xmlToolResults, hasCompletion } = await this.processToolUses(
            content,
            mcpTools,
            onChunk
          );

          if (xmlToolResults.length > 0) {
            currentMessages.push({ role: 'assistant', content });
            currentMessages.push(...xmlToolResults);

            if (hasCompletion) {
              console.log(`[AnthropicAISDKProvider] attempt_completion 已执行`);
              return this.formatResult(result);
            }
            continue;
          }
        } else if (nativeToolCalls && nativeToolCalls.length > 0) {
          const toolCallParts = nativeToolCalls.map((tc: any) => {
            let input = tc.function?.arguments || tc.args || tc.input || {};
            if (typeof input === 'string') {
              try {
                input = JSON.parse(input);
              } catch {
                input = {};
              }
            }
            return {
              type: 'tool-call' as const,
              toolCallId: tc.id || tc.toolCallId || tc.toolUseId,
              toolName: tc.function?.name || tc.name || tc.toolName,
              input
            };
          });
          
          const assistantContent = content 
            ? [{ type: 'text' as const, text: content }, ...toolCallParts]
            : toolCallParts;
          
          currentMessages.push({
            role: 'assistant',
            content: assistantContent
          });

          const { messages: toolResults, hasCompletion } = await this.processToolCalls(
            nativeToolCalls,
            mcpTools,
            onChunk
          );

          if (toolResults.length > 0) {
            currentMessages.push(...toolResults);

            if (hasCompletion) {
              console.log(`[AnthropicAISDKProvider] attempt_completion 已执行`);
              return this.formatResult(result);
            }
            continue;
          }
        }
      }

      // 没有工具调用，返回结果
      return this.formatResult(result);
    }

    console.warn(`[AnthropicAISDKProvider] 达到最大迭代次数 ${maxIterations}`);
    return '';
  }

  /**
   * 处理非流式响应
   */
  private async handleNonStreamResponse(
    messages: any[],
    options: {
      temperature?: number;
      maxTokens?: number;
      tools: any[];
      mcpTools: MCPTool[];
      mcpMode: 'prompt' | 'function';
      onChunk?: (chunk: Chunk) => void;
      abortSignal?: AbortSignal;
      extraBody?: Record<string, any>;
    }
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
    const {
      temperature,
      maxTokens,
      tools,
      mcpTools,
      mcpMode,
      onChunk,
      abortSignal,
      extraBody
    } = options;

    let currentMessages = [...messages];
    let iteration = 0;
    const maxIterations = 5;
    let allReasoningParts: string[] = [];

    while (iteration < maxIterations) {
      iteration++;

      const usePromptMode = this.getUseSystemPromptForTools();
      const streamTools = usePromptMode ? [] : tools;

      const result: StreamResult = await nonStreamCompletion(
        this.client,
        this.model.id,
        currentMessages,
        temperature,
        maxTokens,
        {
          signal: abortSignal,
          enableTools: !usePromptMode && tools.length > 0,
          mcpTools,
          mcpMode,
          model: this.model,
          tools: streamTools,
          extraBody
        }
      );

      // 发送推理块
      if (result.reasoning && onChunk) {
        onChunk({
          type: ChunkType.THINKING_COMPLETE,
          text: result.reasoning,
          thinking_millsec: result.reasoningTime || 0
        });
        allReasoningParts.push(result.reasoning);
      }

      const content = result.content;
      const nativeToolCalls = result.nativeToolCalls;
      let toolResults: any[] = [];
      let hasCompletion = false;

      // 处理函数调用
      if (nativeToolCalls && nativeToolCalls.length > 0 && mcpTools.length > 0) {
        if (onChunk) {
          onChunk({ type: ChunkType.TEXT_COMPLETE, text: content || '' });
        }

        const toolCallParts = nativeToolCalls.map((tc: any) => {
          let input = tc.function?.arguments || tc.args || tc.input || {};
          if (typeof input === 'string') {
            try {
              input = JSON.parse(input);
            } catch {
              input = {};
            }
          }
          return {
            type: 'tool-call' as const,
            toolCallId: tc.id || tc.toolCallId || tc.toolUseId,
            toolName: tc.function?.name || tc.name || tc.toolName,
            input
          };
        });
        
        const assistantContent = content 
          ? [{ type: 'text' as const, text: content }, ...toolCallParts]
          : toolCallParts;
        
        currentMessages.push({
          role: 'assistant',
          content: assistantContent
        });

        const callResult = await this.processToolCalls(nativeToolCalls, mcpTools, onChunk);
        toolResults = callResult.messages;
        hasCompletion = callResult.hasCompletion;
      }

      // 处理 XML 工具调用
      if (content && mcpTools.length > 0) {
        const textWithoutTools = removeToolUseTags(content);
        const hasToolTags = textWithoutTools.length < content.length;

        if (hasToolTags) {
          if (textWithoutTools.trim() && onChunk) {
            onChunk({ type: ChunkType.TEXT_COMPLETE, text: textWithoutTools });
          }

          currentMessages.push({ role: 'assistant', content });

          const xmlResult = await this.processToolUses(content, mcpTools, onChunk);
          toolResults = toolResults.concat(xmlResult.messages);
          hasCompletion = hasCompletion || xmlResult.hasCompletion;
        }
      }

      if (hasCompletion) {
        if (toolResults.length > 0) {
          currentMessages.push(...toolResults);
        }
        break;
      }

      if (toolResults.length > 0) {
        currentMessages.push(...toolResults);
        continue;
      }

      // 发送最终文本
      if (onChunk) {
        onChunk({ type: ChunkType.TEXT_COMPLETE, text: content || '' });
      }

      // 返回结果
      const finalReasoning = allReasoningParts.length > 0
        ? allReasoningParts.join('\n\n---\n\n')
        : undefined;

      if (finalReasoning) {
        return { content, reasoning: finalReasoning, reasoningTime: 0 };
      }
      return content;
    }

    return '';
  }

  /**
   * 格式化结果
   */
  private formatResult(result: StreamResult): string | { content: string; reasoning?: string; reasoningTime?: number } {
    if (result.reasoning) {
      return {
        content: result.content,
        reasoning: result.reasoning,
        reasoningTime: result.reasoningTime
      };
    }
    return result.content;
  }
}

// 导出
export { BaseAnthropicAISDKProvider as BaseAnthropicProvider };
