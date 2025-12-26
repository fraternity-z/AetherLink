/**
 * OpenAI Provider
 * 负责与OpenAI API通信
 */
import OpenAI from 'openai';
import { createClient } from './client';
import { unifiedStreamCompletion } from './unifiedStreamProcessor';
import { UnifiedParameterManager } from '../parameters/UnifiedParameterManager';
import { OpenAIParameterFormatter } from '../parameters/formatters';

import {
  supportsMultimodal,
  supportsWebSearch,
  getWebSearchParams
} from './client';

import {
  isReasoningModel
} from '../../../config/models';
import { AbstractBaseProvider } from '../baseProvider';
import type { Message, Model, MCPTool, MCPToolResponse, MCPCallToolResponse } from '../../types';
import { parseAndCallTools, parseToolUse, removeToolUseTags } from '../../utils/mcpToolParser';
import {
  convertMcpToolsToOpenAI,
  mcpToolCallResponseToOpenAIMessage,
  convertToolCallsToMcpResponses
} from './tools';
import { ChunkType } from '../../types/chunk';



/**
 * 基础OpenAI Provider
 */
export abstract class BaseOpenAIProvider extends AbstractBaseProvider {
  protected client: OpenAI;
  protected parameterManager: UnifiedParameterManager;

  constructor(model: Model) {
    super(model);
    this.client = createClient(model);
    this.parameterManager = new UnifiedParameterManager({ model, providerType: 'openai' });
  }

  /**
   * 将 MCP 工具转换为 OpenAI 工具格式
   */
  public convertMcpTools<T>(mcpTools: MCPTool[]): T[] {
    return convertMcpToolsToOpenAI<T>(mcpTools);
  }

  /**
   * 检查模型是否支持多模态
   * @param model 模型对象（可选）
   * @returns 是否支持多模态
   * @remarks 此方法为子类提供重写入口，内部委托给 client.supportsMultimodal
   */
  protected supportsMultimodal(model?: Model): boolean {
    const actualModel = model || this.model;
    return supportsMultimodal(actualModel);
  }

  /**
   * 检查模型是否支持网页搜索
   * @remarks 此方法为子类提供重写入口，内部委托给 client.supportsWebSearch
   */
  protected supportsWebSearch(): boolean {
    return supportsWebSearch(this.model);
  }

  /**
   * 检查模型是否支持推理优化
   * @remarks 此方法为子类提供重写入口，内部委托给 isReasoningModel
   */
  protected supportsReasoning(): boolean {
    // 使用导入的模型检测函数
    return isReasoningModel(this.model);
  }

  /**
   * 获取统一参数并转换为 OpenAI API 格式
   */
  protected getApiParams(assistant?: any): {
    unified: ReturnType<UnifiedParameterManager['getUnifiedParameters']>;
    apiParams: Record<string, any>;
  } {
    if (assistant) {
      this.parameterManager.updateAssistant(assistant);
    }
    const unified = this.parameterManager.getUnifiedParameters(isReasoningModel(this.model));
    const { customParameters, ...standardParams } = unified;
    const apiParams = OpenAIParameterFormatter.toAPIFormat(standardParams, this.model);
    
    // 🆕 合并自定义参数到 API 请求
    const finalParams = {
      ...apiParams,
      ...customParameters, // 自定义参数直接展开到请求中
    };
    
    return { unified, apiParams: finalParams };
  }



  /**
   * 准备API消息格式
   * 将业务消息转换为API格式
   */
  protected async prepareAPIMessages(messages: Message[], systemPrompt?: string, mcpTools?: MCPTool[]): Promise<any[]> {
    const apiMessages = [];

    // 获取工作区列表（用于注入到系统提示词）
    const workspaces = mcpTools && mcpTools.length > 0 ? await this.getWorkspaces() : [];

    // 添加系统提示
    const finalSystemPrompt = this.buildSystemPromptWithTools(systemPrompt || '', mcpTools, workspaces);
    if (finalSystemPrompt.trim()) {
      apiMessages.push({
        role: 'system',
        content: finalSystemPrompt
      });
    }

    // 处理用户和助手消息（跳过 system 消息，因为已通过 buildSystemPromptWithTools 合并）
    for (const message of messages) {
      // 跳过 system 消息，避免重复
      if (message.role === 'system') {
        continue;
      }
      try {
        const content = (message as any).content;
        if (content !== undefined) {
          apiMessages.push({
            role: message.role,
            content: content
          });
        }
      } catch (error) {
        console.error(`[OpenAIProvider] 处理消息失败:`, error);
        // 降级处理
        const content = (message as any).content;
        if (content && typeof content === 'string' && content.trim()) {
          apiMessages.push({
            role: message.role,
            content: content
          });
        }
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
   * 测试API连接
   */
  public async testConnection(): Promise<boolean> {
    try {
      const { apiParams } = this.getApiParams();

      const response = await this.client.chat.completions.create({
        model: this.model.id,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
        temperature: apiParams.temperature,
        stream: false
      });
      return Boolean(response.choices[0].message);
    } catch (error) {
      console.error('API连接测试失败:', error);
      return false;
    }
  }

  /**
   * 将 MCP 工具调用响应转换为消息格式
   */
  public mcpToolCallResponseToMessage(
    mcpToolResponse: MCPToolResponse,
    resp: MCPCallToolResponse,
    model: Model
  ): any {
    return mcpToolCallResponseToOpenAIMessage(mcpToolResponse, resp, model);
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





  /** 检测工具列表是否包含 attempt_completion（支持带前缀的名称） */
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
    onChunk?: (chunk: import('../../types/chunk').Chunk) => void | Promise<void>
  ): Promise<{ messages: any[]; hasCompletion: boolean }> {
    if (!toolCalls?.length) return { messages: [], hasCompletion: false };

    const toolNames = toolCalls.map(tc => tc.function?.name || tc.name || '');
    const hasCompletion = this.hasCompletionTool(toolNames);
    
    console.log(`[OpenAI] 处理 ${toolCalls.length} 个工具调用${hasCompletion ? '（含 attempt_completion）' : ''}`);

    const mcpToolResponses = this.convertToolCallsToMcpResponses(toolCalls, mcpTools);
    const results = await parseAndCallTools(mcpToolResponses, mcpTools, onChunk);
    const messages = results
      .map((result, i) => this.mcpToolCallResponseToMessage(mcpToolResponses[i], result, this.model))
      .filter(Boolean);

    return { messages, hasCompletion };
  }

  /**
   * 处理工具使用（XML 提示词模式）
   */
  protected async processToolUses(
    content: string,
    mcpTools: MCPTool[],
    onChunk?: (chunk: import('../../types/chunk').Chunk) => void | Promise<void>
  ): Promise<{ messages: any[]; hasCompletion: boolean }> {
    if (!content || !mcpTools?.length) return { messages: [], hasCompletion: false };

    const toolResponses = parseToolUse(content, mcpTools);
    if (!toolResponses.length) return { messages: [], hasCompletion: false };

    const toolNames = toolResponses.map(tr => tr.tool?.name || tr.tool?.id || '');
    const hasCompletion = this.hasCompletionTool(toolNames);
    
    console.log(`[OpenAI] 处理 ${toolResponses.length} 个 XML 工具调用${hasCompletion ? '（含 attempt_completion）' : ''}`);

    const results = await parseAndCallTools(content, mcpTools, onChunk);
    const messages: any[] = [];
    
    for (let i = 0; i < Math.min(results.length, toolResponses.length); i++) {
      const msg = this.mcpToolCallResponseToMessage(toolResponses[i], results[i], this.model);
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
      onChunk?: (chunk: import('../../types/chunk').Chunk) => void | Promise<void>;
      enableWebSearch?: boolean;
      systemPrompt?: string;
      enableTools?: boolean;
      mcpTools?: import('../../types').MCPTool[];
      mcpMode?: 'prompt' | 'function';
      abortSignal?: AbortSignal;
      assistant?: any;
    }
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }>;
}

/**
 * OpenAI Provider实现类
 */
export class OpenAIProvider extends BaseOpenAIProvider {
  constructor(model: Model) {
    super(model);
  }

  /**
   * 发送聊天消息 - 底层API调用
   * 专注于API调用，业务逻辑由chat.ts处理
   * @param messages 消息数组
   * @param options 选项
   * @returns 响应内容
   */
  public async sendChatMessage(
    messages: Message[],
    options?: {
      onChunk?: (chunk: import('../../types/chunk').Chunk) => void | Promise<void>;
      enableWebSearch?: boolean;
      systemPrompt?: string;
      enableTools?: boolean;
      mcpTools?: import('../../types').MCPTool[];
      mcpMode?: 'prompt' | 'function';
      abortSignal?: AbortSignal;
      assistant?: any;
    }
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
    console.log(`[OpenAIProvider] 开始API调用, 模型: ${this.model.id}`);

    const {
      onChunk,
      enableWebSearch = false,
      systemPrompt = '',
      enableTools = true,
      mcpTools = [],
      mcpMode = 'function',
      abortSignal,
      assistant
    } = options || {};

    // 准备API消息格式（异步获取工作区信息）
    const apiMessages = await this.prepareAPIMessages(messages, systemPrompt, mcpTools);

    // 配置工具
    const { tools } = this.setupToolsConfig({
      mcpTools,
      model: this.model,
      enableToolUse: enableTools,
      mcpMode
    });

    // 获取统一参数与 API 格式参数
    const { unified, apiParams } = this.getApiParams(assistant);
    const streamEnabled = unified.stream ?? true;

    // 构建请求参数
    const requestParams: any = {
      model: this.model.id,
      messages: apiMessages,
      stream: streamEnabled,
      ...apiParams
    };

    // 添加工具
    if (enableTools && tools.length > 0 && !this.getUseSystemPromptForTools()) {
      requestParams.tools = tools;
    }


    // 检查API密钥和基础URL是否设置
    if (!this.model.apiKey) {
      console.error('[OpenAIProvider.sendChatMessage] 错误: API密钥未设置');
      throw new Error('API密钥未设置，请在设置中配置OpenAI API密钥');
    }

    if (!this.model.baseUrl) {
      console.warn('[OpenAIProvider.sendChatMessage] 警告: 基础URL未设置，使用默认值');
    }

    // 添加网页搜索参数
    if (enableWebSearch && this.supportsWebSearch()) {
      Object.assign(requestParams, getWebSearchParams(this.model, enableWebSearch));
    }

    try {
      // 根据流式输出设置选择响应处理方式
      if (streamEnabled) {
        return await this.handleStreamResponse(requestParams, {
          onChunk,
          enableTools,
          mcpTools,
          abortSignal
        });
      } else {
        // 非流式响应处理
        return await this.handleNonStreamResponse(requestParams, onChunk, enableTools, mcpTools, abortSignal);
      }
    } catch (error: any) {
      // 检查是否为中断错误
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        console.log('[OpenAIProvider.sendChatMessage] 请求被用户中断');
        throw new DOMException('Operation aborted', 'AbortError');
      }

      // 检查是否为参数错误，提供友好的错误信息
      if (error?.status === 400 && error?.message?.includes('max_tokens')) {
        const modelName = this.model.name || this.model.id;
        const currentMaxTokens = requestParams.max_tokens;
        console.error(`[OpenAIProvider] ${modelName} 模型的 max_tokens 参数超出限制: ${currentMaxTokens}`);
        throw new Error(`模型 ${modelName} 不支持当前的最大输出token设置 (${currentMaxTokens})。请在模型设置中降低最大输出token数量。`);
      }

      console.error('[OpenAIProvider.sendChatMessage] API请求失败:', error);
      throw error;
    }
  }



  /**
   * 处理流式响应（统一方法）
   * 合并了原有的 handleStreamResponse 和 handleStreamResponseWithoutCallback
   * @param params 请求参数
   * @param options 选项
   * @returns 响应内容
   */
  private async handleStreamResponse(
    params: any,
    options: {
      onChunk?: (chunk: import('../../types/chunk').Chunk) => void | Promise<void>;
      enableTools?: boolean;
      mcpTools?: import('../../types').MCPTool[];
      abortSignal?: AbortSignal;
    } = {}
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
    const {
      onChunk,
      enableTools = true,
      mcpTools = [],
      abortSignal
    } = options;

    try {
      // 工具调用循环处理
      let currentMessages = [...params.messages];
      let iteration = 0;

      while (true) {
        iteration++;
        console.log(`[OpenAIProvider] 流式工具调用迭代 ${iteration}`);

        // 准备请求参数
        const iterationParams = {
          ...params,
          messages: currentMessages,
          signal: abortSignal
        };

        // 在提示词模式下，移除 tools 参数避免冲突
        if (this.getUseSystemPromptForTools()) {
          delete iterationParams.tools;
          delete iterationParams.tool_choice;
          console.log(`[OpenAIProvider] 提示词模式：移除 API 中的 tools 参数`);
        }

        // 构建流参数
        const streamParams = {
          ...iterationParams,
          enableTools,
          mcpTools
        };

        const result = await unifiedStreamCompletion(
          this.client,
          this.model.id,
          currentMessages,
          params.temperature,
          params.max_tokens || params.max_completion_tokens,
          streamParams,
          onChunk
        );

        console.log(`[OpenAIProvider] 流式响应结果类型: ${typeof result}, hasToolCalls: ${typeof result === 'object' && (result as any)?.hasToolCalls}`);

        // 检查是否有工具调用标记
        if (typeof result === 'object' && (result as any).hasToolCalls) {
          console.log(`[OpenAIProvider] 流式响应检测到工具调用`);

          const content = result.content;
          const nativeToolCalls = (result as any).nativeToolCalls;
          const usePromptMode = this.getUseSystemPromptForTools();

          // 根据用户设置决定工具调用方式
          if (usePromptMode) {
            // 提示词注入模式：使用 XML 格式工具调用
            console.log(`[OpenAIProvider] 提示词注入模式：处理 XML 格式工具调用`);
            const { messages: xmlToolResults, hasCompletion } = await this.processToolUses(content, mcpTools, onChunk);

            if (xmlToolResults.length > 0) {
              // 保留完整内容（包含工具调用），让模型知道自己调用了什么工具
              console.log(`[OpenAIProvider] 流式：对话历史保留完整内容（含工具调用），长度: ${content.length}`);

              // 添加助手消息到对话历史（保留工具调用标签）
              currentMessages.push({
                role: 'assistant',
                content: content
              });

              // 添加工具结果到对话历史
              currentMessages.push(...xmlToolResults);

              // 检测到 attempt_completion 时提前退出
              if (hasCompletion) {
                console.log(`[OpenAIProvider] 检测到 attempt_completion，返回结果让上层处理终止`);
                return result;
              }

              console.log(`[OpenAIProvider] 流式 XML 工具调用完成，继续下一轮对话`);
              continue;
            }
          } else {
            // 函数调用模式：使用原生 Function Calling
            if (nativeToolCalls && nativeToolCalls.length > 0) {
              console.log(`[OpenAIProvider] 函数调用模式：检测到 ${nativeToolCalls.length} 个原生工具调用`);

              // 添加助手消息到对话历史（包含 tool_calls）
              currentMessages.push({
                role: 'assistant',
                content: content || '',
                tool_calls: nativeToolCalls
              });

              // 处理原生工具调用，传递 onChunk 以更新 UI
              const { messages: toolResults, hasCompletion } = await this.processToolCalls(nativeToolCalls, mcpTools, onChunk);

              if (toolResults.length > 0) {
                // 添加工具结果到对话历史
                currentMessages.push(...toolResults);

                // 如果检测到 attempt_completion，结束循环
                if (hasCompletion) {
                  console.log(`[OpenAIProvider] attempt_completion 已执行，结束工具调用循环`);
                  return result;
                }

                console.log(`[OpenAIProvider] 流式原生工具调用完成，继续下一轮对话`);
                continue;
              }
            }
          }
        }

        // 没有工具调用或工具调用处理完成，返回结果
        return result;
      }
    } catch (error) {
      console.error('[OpenAIProvider] 流式请求失败:', error);
      throw error;
    }
  }

  /**
   * 处理非流式响应
   * 
   * ============= 非流式输出链路 =============
   * while (iteration < maxIterations) {
   *   1. 发送 THINKING_COMPLETE (全量 reasoning) → 创建/更新思考块
   *   2. 处理函数调用模式 (toolCalls):
   *      - 发送 TEXT_COMPLETE → 创建文本块
   *      - 调用工具 → 创建工具块
   *   3. 处理 XML 格式工具 (processToolUses):
   *      - 先发送 TEXT_COMPLETE (去除工具标签后的文本) → 创建文本块
   *      - 再调用工具 → 创建工具块
   *   4. 有工具结果 → continue 下一轮
   *   5. 无工具结果 → 发送最终 TEXT_COMPLETE → break
   * }
   * 
   * ============= 关键设计 =============
   * - 所有 onChunk 调用都 await，确保块创建完成后再继续
   * - 只发 COMPLETE，不发 DELTA（非流式是全量数据）
   * - 先发文本再发工具，保证块顺序正确
   * - 每轮的 reasoning 独立收集，最后合并返回
   */
  private async handleNonStreamResponse(
    params: any,
    onChunk?: (chunk: import('../../types/chunk').Chunk) => void | Promise<void>,
    enableTools: boolean = true,
    mcpTools: import('../../types').MCPTool[] = [],
    abortSignal?: AbortSignal
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
    try {
      let currentMessages = [...params.messages];
      let finalContent = '';
      let allReasoningParts: string[] = []; // 收集所有轮次的 reasoning
      let maxIterations = 5;
      let iteration = 0;

      while (iteration < maxIterations) {
        iteration++;

        const currentRequestParams = {
          ...params,
          messages: currentMessages,
          stream: false, // 确保是非流式
          signal: abortSignal // 传递中断信号
        };

        const response = await this.client.chat.completions.create(currentRequestParams);
        const choice = response.choices?.[0];
        if (!choice) {
          throw new Error('API响应中没有选择项');
        }

        const content = choice.message?.content || '';
        // 对于推理模型，尝试从多个可能的字段中获取推理内容
        const reasoning = (choice.message as any)?.reasoning ||
                         (choice.message as any)?.reasoning_content ||
                         undefined;

        // 第1步：发送推理块（非流式直接发 COMPLETE）
        if (reasoning && onChunk) {
          await onChunk({
            type: ChunkType.THINKING_COMPLETE,
            text: reasoning,
            thinking_millsec: 0
          });
          allReasoningParts.push(reasoning);
        }

        finalContent = content;

        // 第2步：处理函数调用模式的工具
        const toolCalls = choice.message?.tool_calls;
        let toolResults: any[] = [];
        let hasCompletion = false;

        if (toolCalls && toolCalls.length > 0 && enableTools && mcpTools.length > 0) {
          // 在工具调用前发送文本块
          if (onChunk) {
            await onChunk({
              type: ChunkType.TEXT_COMPLETE,
              text: content || ''
            });
          }

          currentMessages.push({
            role: 'assistant',
            content: content || '',
            tool_calls: toolCalls
          });

          // 处理工具调用
          const result = await this.processToolCalls(toolCalls, mcpTools, onChunk);
          toolResults = result.messages;
          hasCompletion = result.hasCompletion;
        }

        // 第3步：处理 XML 格式的工具调用（提示词模式）
        if (content && content.length > 0 && enableTools && mcpTools.length > 0) {
          const textWithoutTools = removeToolUseTags(content);
          const hasToolTags = textWithoutTools.length < content.length;
          
          if (hasToolTags) {
            // 先发送去除工具标签后的文本（用于 UI 显示）
            if (textWithoutTools.trim() && onChunk) {
              await onChunk({
                type: ChunkType.TEXT_COMPLETE,
                text: textWithoutTools
              });
            }
            finalContent = textWithoutTools;
            
            // 添加助手消息到对话历史（保留完整内容，包含工具调用标签）
            currentMessages.push({
              role: 'assistant',
              content: content  // 保留工具调用标签，让模型知道自己调用了什么
            });
          }
          
          // 然后处理工具调用
          const xmlResult = await this.processToolUses(content, mcpTools, onChunk);
          toolResults = toolResults.concat(xmlResult.messages);
          hasCompletion = hasCompletion || xmlResult.hasCompletion;
        }

        // 如果检测到 attempt_completion，结束循环
        if (hasCompletion) {
          console.log(`[OpenAIProvider] 非流式：attempt_completion 已执行，结束工具调用循环`);
          if (toolResults.length > 0) {
            currentMessages.push(...toolResults);
          }
          break;
        }

        if (toolResults.length > 0) {
          currentMessages.push(...toolResults);
          continue; // 继续下一轮
        } else {
          // 最后一轮没有工具调用，发送最终文本块
          if (onChunk) {
            await onChunk({
              type: ChunkType.TEXT_COMPLETE,
              text: content || ''
            });
          }
          break;
        }
      }

      // 返回结果 - 合并所有轮次的 reasoning
      const finalReasoning = allReasoningParts.length > 0 
        ? allReasoningParts.join('\n\n---\n\n') 
        : undefined;

      if (finalReasoning) {
        return {
          content: finalContent,
          reasoning: finalReasoning,
          reasoningTime: 0 // 非流式响应没有推理时间
        };
      } else {
        return finalContent;
      }
    } catch (error) {
      console.error('[OpenAIProvider.handleNonStreamResponse] 非流式API请求失败:', error);
      throw error;
    }
  }
}
