import {
  GoogleGenAI,
  FinishReason
} from '@google/genai';
import type {
  Content
} from '@google/genai';
import type { Message, Model, MCPTool } from '../../types';
import { ChunkType } from '../../types/chunk';
import { getMainTextContent } from '../../utils/messageUtils';

import {
  isGemmaModel
} from '../../config/models';
import { takeRight } from 'lodash';
import { withRetry } from '../../utils/retryUtils';

import { GeminiConfigBuilder } from './configBuilder';
import { createGeminiEmbeddingService } from './embeddingService';
import { createGeminiMessageContentService } from './messageContentService';
import { fetchModels, createClient, testConnection } from './client';
import { createAbortController } from '../../utils/abortController';
import { GeminiStreamProcessor } from './streamProcessor';
import { GeminiCompletionService } from './completionService';





// 接口定义 - 复用 completionService 中的类型
export type { CompletionServiceParams as CompletionsParams } from './completionService';



// 基础Provider类
export abstract class BaseProvider {
  protected model: Model;
  protected sdk: GoogleGenAI;

  constructor(model: Model) {
    this.model = model;
    this.sdk = createClient(model);
  }

  protected getAssistantSettings(assistant: any) {
    const maxTokens = Math.max(assistant?.maxTokens || assistant?.settings?.maxTokens || 4096, 1);
    const streamOutputValue = assistant?.settings?.streamOutput ?? assistant?.streamOutput;
    const streamOutput = streamOutputValue !== false;

    return {
      contextCount: assistant?.settings?.contextCount || 10,
      maxTokens: maxTokens,
      streamOutput: streamOutput
    };
  }



  protected createAbortController(messageId?: string, autoCleanup = false) {
    // 使用统一的 createAbortController 工具函数
    return createAbortController(messageId, autoCleanup);
  }

  protected async getMessageContent(message: Message): Promise<string> {
    return getMainTextContent(message);
  }

  // ✨ Phase 2-3 重构后清理：
  // - convertMcpTools: 已移到 GeminiCompletionService
  // - setupToolsConfig: 已废弃，使用 completionService.setupToolsAndPrompt
  // - useSystemPromptForTools: 已废弃
  // - mcpToolCallResponseToMessage: 已废弃
}



// Gemini Provider实现
export default class GeminiProvider extends BaseProvider {
  private streamProcessor: GeminiStreamProcessor;
  private completionService: GeminiCompletionService;

  constructor(provider: any) {
    const model = {
      id: provider.models?.[0]?.id || 'gemini-pro',
      apiKey: provider.apiKey,
      baseUrl: provider.apiHost
    } as Model;
    super(model);
    this.streamProcessor = new GeminiStreamProcessor();
    this.completionService = new GeminiCompletionService(model);
  }





  /**
   * 获取消息内容 - 使用专门的消息内容服务
   */
  private async getMessageContents(message: Message): Promise<Content> {
    const messageContentService = createGeminiMessageContentService(this.model);
    return messageContentService.getMessageContents(message);
  }

  // ✨ Phase 3: 工具调用处理已移到 completionService.ts
  // processGeminiFunctionCalls 和 processXMLToolCalls 方法已删除
  // 现在由 completionService 统一处理

  /**
   * 核心completions方法 - 委托给 completionService 处理
   *
   * ============= 简化后的设计 =============
   * 1. 准备消息历史 (completionService.prepareMessageHistory)
   * 2. 配置工具和提示词 (completionService.setupToolsAndPrompt)
   * 3. 构建 API 配置 (GeminiConfigBuilder)
   * 4. 执行工具调用循环 (completionService.executeToolCallLoop)
   */
  public async completions({
    messages,
    assistant,
    mcpTools,
    mcpMode = 'function',
    onChunk,
    onFilterMessages
  }: import('./completionService').CompletionServiceParams): Promise<void> {
    const model = assistant.model || this.model;
    const { maxTokens, streamOutput } = this.completionService.getAssistantSettings(assistant);

    // Step 1: 准备消息历史
    const { history, userLastMessage } = await this.completionService.prepareMessageHistory(
      messages,
      assistant,
      onFilterMessages
    );

    // Step 2: 配置工具和系统提示词
    const { systemInstruction, tools, usePromptMode } = this.completionService.setupToolsAndPrompt(
      assistant,
      mcpTools,
      mcpMode,
      model
    );

    // Step 3: 构建 API 配置
    const configBuilder = new GeminiConfigBuilder(assistant, model, maxTokens, systemInstruction, tools);
    const generateContentConfig = configBuilder.build();

    // 调试日志
    console.log(`[GeminiProvider.completions] 使用 completionService:`, {
      mcpMode,
      usePromptMode,
      mcpToolsCount: mcpTools?.length || 0,
      toolsCount: tools.length,
      streamOutput,
      isGemmaModel: isGemmaModel(model)
    });

    // Step 4: 获取最后一条消息内容
    const messageContents: Content = await this.getMessageContents(userLastMessage!);

    // Step 5: 创建聊天会话
    const chat = this.sdk.chats.create({
      model: model.id,
      config: generateContentConfig,
      history: history
    });

    // Step 6: 处理 Gemma 模型特殊格式
    this.completionService.handleGemmaFormat(model, assistant, messageContents, systemInstruction, history);

    // Step 7: 创建中断控制器
    const { cleanup, abortController } = this.createAbortController(userLastMessage?.id, true);

    try {
      // Step 8: 执行工具调用循环
      await this.completionService.executeToolCallLoop({
        chat,
        messageContents,
        history,
        mcpTools,
        usePromptMode,
        streamOutput,
        generateContentConfig,
        onChunk,
        abortController,
        streamProcessor: this.streamProcessor
      });
    } finally {
      cleanup();
    }
  }





  /**
   * 翻译方法
   */
  public async translate(
    content: string,
    assistant: any,
    onResponse?: (text: string, isComplete: boolean) => void,
    abortSignal?: AbortSignal
  ) {
    const model = assistant.model || this.model;
    const { maxTokens } = this.getAssistantSettings(assistant);

    const _content = isGemmaModel(model) && assistant.prompt
      ? `<start_of_turn>user\n${assistant.prompt}<end_of_turn>\n<start_of_turn>user\n${content}<end_of_turn>`
      : content;

    // 使用 GeminiConfigBuilder 构建配置
    const configBuilder = new GeminiConfigBuilder(assistant, model, maxTokens, assistant.prompt, []);
    const config = configBuilder.build();

    if (!onResponse) {
      const response = await withRetry(
        () => this.sdk.models.generateContent({
          model: model.id,
          config: config,
          contents: [{ role: 'user', parts: [{ text: _content }] }]
        }),
        'Gemini Translate'
      );
      return response.text || '';
    }

    const response = await withRetry(
      () => this.sdk.models.generateContentStream({
        model: model.id,
        config: config,
        contents: [{ role: 'user', parts: [{ text: content }] }]
      }),
      'Gemini Translate Stream'
    );

    let text = '';
    for await (const chunk of response) {
      // 检查中断信号
      if (abortSignal?.aborted) {
        console.log('[GeminiProvider.translate] 流式响应被用户中断');
        break;
      }

      text += chunk.text;
      onResponse?.(text, false);
    }
    onResponse?.(text, true);
    return text;
  }

  /**
   * 生成摘要
   */
  public async summaries(messages: Message[], assistant: any): Promise<string> {
    const model = assistant.model || this.model;
    const userMessages = takeRight(messages, 5)
      .filter((message) => !message.isPreset)
      .map((message) => ({
        role: message.role,
        content: getMainTextContent(message)
      }));

    const userMessageContent = userMessages.reduce((prev, curr) => {
      const content = curr.role === 'user' ? `User: ${curr.content}` : `Assistant: ${curr.content}`;
      return prev + (prev ? '\n' : '') + content;
    }, '');

    const systemMessage = {
      role: 'system',
      content: '请为以下对话生成一个简洁的标题'
    };

    const userMessage = { role: 'user', content: userMessageContent };
    const content = isGemmaModel(model)
      ? `<start_of_turn>user\n${systemMessage.content}<end_of_turn>\n<start_of_turn>user\n${userMessage.content}<end_of_turn>`
      : userMessage.content;

    // 使用 GeminiConfigBuilder 构建配置
    const configBuilder = new GeminiConfigBuilder(assistant, model, 4096, systemMessage.content, []);
    const config = configBuilder.build();

    const response = await this.sdk.models.generateContent({
      model: model.id,
      config: config,
      contents: [{ role: 'user', parts: [{ text: content }] }]
    });

    return response.text || '';
  }

  /**
   * 生成文本
   */
  public async generateText({ prompt, content }: { prompt: string; content: string }): Promise<string> {
    const model = this.model;
    const MessageContent = isGemmaModel(model)
      ? `<start_of_turn>user\n${prompt}<end_of_turn>\n<start_of_turn>user\n${content}<end_of_turn>`
      : content;

    // 创建临时助手对象用于配置构建
    const tempAssistant = { prompt: prompt };

    // 使用 GeminiConfigBuilder 构建配置
    const configBuilder = new GeminiConfigBuilder(tempAssistant, model, 4096, prompt, []);
    const config = configBuilder.build();

    const response = await this.sdk.models.generateContent({
      model: model.id,
      config: config,
      contents: [{ role: 'user', parts: [{ text: MessageContent }] }]
    });

    return response.text || '';
  }

  /**
   * 生成建议
   */
  public async suggestions(): Promise<any[]> {
    return [];
  }

  /**
   * 搜索摘要
   */
  public async summaryForSearch(messages: Message[], assistant: any): Promise<string> {
    const model = assistant.model || this.model;
    const systemMessage = { role: 'system', content: assistant.prompt };
    const userMessageContent = messages.map(getMainTextContent).join('\n');

    const content = isGemmaModel(model)
      ? `<start_of_turn>user\n${systemMessage.content}<end_of_turn>\n<start_of_turn>user\n${userMessageContent}<end_of_turn>`
      : userMessageContent;

    const lastUserMessage = messages[messages.length - 1];
    const { abortController, cleanup } = this.createAbortController(lastUserMessage?.id);
    const { signal } = abortController;

    // 使用 GeminiConfigBuilder 构建配置
    const configBuilder = new GeminiConfigBuilder(assistant, model, 4096, systemMessage.content, []);
    const config = configBuilder.build();

    // 添加特定的配置项
    const finalConfig = {
      ...config,
      httpOptions: { timeout: 20 * 1000 },
      abortSignal: signal
    };

    const response = await this.sdk.models
      .generateContent({
        model: model.id,
        config: finalConfig,
        contents: [{ role: 'user', parts: [{ text: content }] }]
      })
      .finally(cleanup);

    return response.text || '';
  }

  /**
   * 生成图像
   */
  public async generateImage(): Promise<string[]> {
    return [];
  }

  /**
   * 检查模型有效性
   */
  public async check(model: Model, stream: boolean = false): Promise<{ valid: boolean; error: Error | null }> {
    if (!model) {
      return { valid: false, error: new Error('No model found') };
    }

    // 使用 GeminiConfigBuilder 构建配置，但设置最小的 maxTokens 用于测试
    const testAssistant = {
      enableThinking: false,
      thinkingBudget: 0
    };
    const configBuilder = new GeminiConfigBuilder(testAssistant, model, 1, undefined, []);
    const config = configBuilder.build();

    try {
      if (!stream) {
        const result = await this.sdk.models.generateContent({
          model: model.id,
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
          config: config
        });
        if (!result.text) {
          throw new Error('Empty response');
        }
      } else {
        const response = await this.sdk.models.generateContentStream({
          model: model.id,
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
          config: config
        });
        let hasContent = false;
        for await (const chunk of response) {
          if (chunk.candidates && chunk.candidates[0].finishReason === FinishReason.MAX_TOKENS) {
            hasContent = true;
            break;
          }
        }
        if (!hasContent) {
          throw new Error('Empty streaming response');
        }
      }
      return { valid: true, error: null };
    } catch (error: any) {
      return { valid: false, error };
    }
  }



  /**
   * 获取文本嵌入
   */
  public async getEmbedding(
    text: string,
    options?: {
      taskType?: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION' | 'CLUSTERING';
      title?: string;
    }
  ): Promise<number[]> {
    const embeddingService = createGeminiEmbeddingService(this.model);
    const result = await embeddingService.getEmbedding({
      text,
      model: this.model,
      taskType: options?.taskType,
      title: options?.title
    });
    return result.embedding;
  }

  /**
   * 获取嵌入维度
   */
  public async getEmbeddingDimensions(model: Model): Promise<number> {
    const embeddingService = createGeminiEmbeddingService(model);
    return embeddingService.getEmbeddingDimensions(model);
  }

  /**
   * 兼容性方法：sendChatMessage - 转换为completions调用
   * 
   * 🔧 修复：直接调用 completions 方法，复用工具处理逻辑
   */
  public async sendChatMessage(
    messages: Message[],
    options?: {
      onChunk?: (chunk: any) => void;
      enableWebSearch?: boolean;
      enableThinking?: boolean;
      enableTools?: boolean;
      mcpTools?: MCPTool[];
      mcpMode?: 'prompt' | 'function';
      systemPrompt?: string;
      abortSignal?: AbortSignal;
      assistant?: any;
    }
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
    // 🔧 修复：正确处理 streamOutput 设置
    // 从传入的 assistant 中读取，支持多种位置
    const inputAssistant = options?.assistant;
    const streamOutputSetting = inputAssistant?.settings?.streamOutput ?? inputAssistant?.streamOutput;
    const streamOutput = streamOutputSetting !== false;
    
    console.log(`[GeminiProvider.sendChatMessage] streamOutput 检测:`, {
      'inputAssistant?.settings?.streamOutput': inputAssistant?.settings?.streamOutput,
      'inputAssistant?.streamOutput': inputAssistant?.streamOutput,
      'streamOutputSetting': streamOutputSetting,
      'streamOutput (final)': streamOutput
    });
    
    // 构建 assistant 对象
    const assistant = inputAssistant ? {
      ...inputAssistant,
      settings: {
        ...inputAssistant.settings,
        streamOutput: streamOutput  // 确保 streamOutput 正确设置
      }
    } : {
      model: this.model,
      prompt: options?.systemPrompt || '',
      settings: {
        streamOutput: streamOutput
      },
      enableWebSearch: options?.enableWebSearch || false,
      enableGenerateImage: false
    };

    // 如果有传入的 assistant 但没有 prompt，使用 systemPrompt
    if (inputAssistant && options?.systemPrompt && !inputAssistant.prompt) {
      assistant.prompt = options.systemPrompt;
    }

    console.log(`[GeminiProvider.sendChatMessage] 调用 completions - mcpTools: ${options?.mcpTools?.length || 0}, mcpMode: ${options?.mcpMode || 'function'}, streamOutput: ${streamOutput}`);

    // 收集响应内容
    let content = '';
    let reasoning = '';
    let reasoningTime = 0;

    // 🔧 修复：直接调用 completions 方法，复用所有工具处理逻辑
    await this.completions({
      messages,
      assistant,
      mcpTools: options?.mcpTools || [],
      mcpMode: options?.mcpMode || 'function',
      onChunk: (chunk: any) => {
        // 转发 chunk 并收集内容
        if (chunk.type === ChunkType.TEXT_DELTA) {
          content += chunk.text || '';
        } else if (chunk.type === ChunkType.TEXT_COMPLETE) {
          content = chunk.text || content;
        } else if (chunk.type === ChunkType.THINKING_DELTA) {
          reasoning += chunk.text || '';
        } else if (chunk.type === ChunkType.THINKING_COMPLETE) {
          reasoning = chunk.text || reasoning;
          reasoningTime = chunk.thinking_millsec || 0;
        }
        
        // 转发给外部 onChunk
        options?.onChunk?.(chunk);
      },
      onFilterMessages: () => {}
    });

    return { content, reasoning, reasoningTime };
  }

  /**
   * 兼容性方法：testConnection
   */
  public async testConnection(): Promise<boolean> {
    return testConnection(this.model);
  }

  /**
   * 兼容性方法：getModels
   */
  public async getModels(): Promise<any[]> {
    return fetchModels(this.model);
  }
}

// 同时提供命名导出以确保兼容性
export { GeminiProvider };
