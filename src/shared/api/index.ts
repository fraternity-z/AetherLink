import type { Model } from '../types';
import { getSettingFromDB } from '../services/storage/storageService';
import { getProviderApi, getActualProviderType } from '../services/ProviderFactory';
import store from '../store';

/**
 * API模块索引文件
 * 导出所有API模块
 */

// 导出OpenAI API模块
export * as openaiApi from './openai';

// 导出Gemini API模块
export * as geminiApi from './gemini';

// 导出Anthropic API模块
export * as anthropicApi from './anthropic';

// 导出视频生成功能
export { generateVideo, type GeneratedVideo } from '../services/network/APIService';
export type { VideoGenerationParams, GoogleVeoParams } from '../services/network/APIService';

// 通用聊天请求接口
export interface ChatRequest {
  messages: { role: string; content: string; images?: any[] }[];
  modelId: string;
  systemPrompt?: string;
  onChunk?: (chunk: string) => void;
  abortSignal?: AbortSignal; // 添加中断信号支持
  messageId?: string; // 添加消息ID用于中断控制
}

// 标准化的API请求接口
export interface StandardApiRequest {
  messages: {
    role: string;
    content: string | { text?: string; images?: string[] };
  }[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
}

// 测试API连接
export const testApiConnection = async (model: Model): Promise<boolean> => {
  try {
    // 检查是否为 OpenAI Responses API 提供商
    if (model.providerType === 'openai-response') {
      console.log('[testApiConnection] 使用 OpenAI Responses API 测试连接');

      // 动态导入 OpenAIResponseProvider
      const { OpenAIResponseProvider } = await import('../providers/OpenAIResponseProvider');
      const provider = new OpenAIResponseProvider(model);

      // 使用 Responses API 专用的测试方法
      return await provider.testConnection();
    }

    // 其他提供商使用原有的测试方法
    const response = await sendChatRequest({
      messages: [{
        role: 'user',
        content: '你好，这是一条测试消息。请回复"连接成功"。'
      }],
      modelId: model.id
    });

    return response.success && (response.content?.includes('连接成功') || (response.content?.length || 0) > 0);
  } catch (error) {
    console.error('API连接测试失败:', error);
    return false;
  }
};

// 发送聊天请求（新版本接口，使用请求对象）
export const sendChatRequest = async (options: ChatRequest): Promise<{ success: boolean; content?: string; reasoning?: string; reasoningTime?: number; error?: string }> => {
  try {
    console.log(`[sendChatRequest] 开始处理请求，模型ID: ${options.modelId}`);

    // 根据modelId查找对应模型
    const model = await findModelById(options.modelId);
    if (!model) {
      console.error(`[sendChatRequest] 错误: 未找到ID为${options.modelId}的模型，但将继续尝试使用该ID`);

      // 创建一个基于modelId的临时模型对象
      const tempModel: Model = {
        id: options.modelId,
        name: options.modelId,
        provider: 'auto',
        enabled: true
      };

      // 尝试使用临时模型继续处理请求
      console.log(`[sendChatRequest] 使用临时模型: ${tempModel.id}`);

      try {
        return await processModelRequest(tempModel, options);
      } catch (innerError) {
        console.error(`[sendChatRequest] 使用临时模型失败:`, innerError);
        throw new Error(`未找到ID为${options.modelId}的模型，且无法使用该ID进行请求`);
      }
    }

    console.log(`[sendChatRequest] 使用模型ID: ${options.modelId}, 名称: ${model.name || '未命名'}, 提供商: ${model.provider || '未知提供商'}`);

    // 记录模型详细信息，帮助调试
    console.log('[sendChatRequest] 模型详细信息:', {
      id: model.id,
      name: model.name,
      provider: model.provider,
      providerType: model.providerType,
      baseUrl: model.baseUrl ? `${model.baseUrl.substring(0, 20)}...` : '未设置',
      hasApiKey: !!model.apiKey,
      capabilities: model.capabilities
    });

    return await processModelRequest(model, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('[sendChatRequest] API准备失败:', errorMessage);
    console.error('[sendChatRequest] 错误堆栈:', errorStack);

    // 记录更多上下文信息
    console.error('[sendChatRequest] 请求上下文:', {
      modelId: options.modelId,
      messageCount: options.messages?.length || 0,
      hasSystemPrompt: !!options.systemPrompt,
      hasOnChunk: !!options.onChunk
    });

    //  重要：抛出错误而不是返回错误对象，让 ResponseHandler 能正确处理
    throw error;
  }
}

// 处理模型请求的函数，从sendChatRequest中提取出来
async function processModelRequest(model: Model, options: ChatRequest): Promise<{ success: boolean; content?: string; reasoning?: string; reasoningTime?: number; error?: string }> {
  try {
    // 添加详细调试日志
    console.log(`[processModelRequest] 开始处理API请求，模型信息:`, {
      id: model.id,
      provider: model.provider,
      providerType: model.providerType || '未指定',
      apiKey: model.apiKey ? '已设置' : '未设置',
      baseUrl: model.baseUrl || '未设置'
    });

    // 将简单消息格式转换为API需要的消息格式
    const messages = options.messages.map((msg, index) => ({
      id: `msg-${index}`,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: new Date().toISOString(),
      images: msg.images
    }));

    // 如果提供了系统提示词，添加到消息数组最前面
    if (options.systemPrompt) {
      const systemMessage = {
        id: 'system-0',
        role: 'system' as const,
        content: options.systemPrompt,
        timestamp: new Date().toISOString(),
        images: undefined
      };

      // 确保系统消息位于消息列表最前面
      messages.unshift(systemMessage);

      console.log(`使用自定义系统提示词: ${
        options.systemPrompt.substring(0, 50) + (options.systemPrompt.length > 50 ? '...' : '')
      }`);
    }

    // 获取对应的API实现
    const providerType = getActualProviderType(model);
    console.log(`[processModelRequest] 使用提供商类型: ${providerType}`);

    try {
      // 获取API实现，添加详细日志
      console.log(`[processModelRequest] 尝试获取API实现，提供商: ${providerType}`);
      const api = getProviderApi(model);
      console.log(`[processModelRequest] 成功获取API实现`);

      // 创建一个响应包装器，将旧API的流式回调转换为新格式
      let contentAccumulator = '';
      let lastUpdateTime = Date.now();
      const updateThreshold = 50; // 毫秒
      const minChunkSize = 5; // 最小字符变化阈值

      // 新增思考过程相关数据存储
      let reasoningContent = '';
      let reasoningStartTime = 0;
      let hasReceivedReasoning = false;

      const onUpdate = options.onChunk
        ? (content: string, reasoning?: string) => {
            // 如果收到了新的思考过程，则更新思考过程相关数据
            if (reasoning && reasoning !== reasoningContent) {
              reasoningContent = reasoning;
              hasReceivedReasoning = true;
              if (reasoningStartTime === 0) {
                reasoningStartTime = Date.now(); // 记录第一次收到思考过程的时间
              }

              console.log(`[流式响应] 收到思考过程, 长度: ${reasoning.length}`);
            }

            // 计算新增的部分
            const newContent = content.substring(contentAccumulator.length);
            const currentTime = Date.now();
            const timeSinceLastUpdate = currentTime - lastUpdateTime;

            // 只有在以下情况才进行更新：
            // 1. 新增内容长度超过阈值
            // 2. 距离上次更新时间超过阈值
            // 3. 或者内容长度变短（可能是替换/修改）
            // 4. 或者刚刚收到思考过程
            if (newContent.length >= minChunkSize ||
                timeSinceLastUpdate >= updateThreshold ||
                content.length < contentAccumulator.length ||
                hasReceivedReasoning) { // 如果刚刚收到思考过程，则必须触发更新

              contentAccumulator = content;
              lastUpdateTime = currentTime;

              try {
                //  修复网络搜索后AI响应流式输出问题：直接发送内容，不使用JSON包装
                // 发送完整内容而不是增量，避免增量更新带来的问题
                options.onChunk!(content);
              } catch (error) {
                console.error('发送流式内容时出错:', error);
                // 降级处理：仍然发送内容
                options.onChunk!(content);
              }
              hasReceivedReasoning = false; // 重置标志
            }
          }
        : undefined;

      // 将消息适配为API可接受的格式
      // 直接使用消息内容，不再需要适配器
      const apiMessages = messages.map(msg => {
        // 从块中获取消息内容
        let content = '';

        // 处理不同类型的消息内容
        if (typeof msg.content === 'string') {
          // 如果content是字符串，直接使用
          content = msg.content;
        } else if ('blocks' in msg && Array.isArray(msg.blocks)) {
          try {
            // 如果有blocks属性，尝试获取内容
            // 注意：这里使用类型断言，因为getMainTextContent期望完整的Message类型
            const state = store.getState();
            const blocks = msg.blocks
              .map(blockId => state.messageBlocks.entities[blockId])
              .filter(Boolean);

            // 查找主文本块
            const mainTextBlock = blocks.find(block => block.type === 'main_text');
            if (mainTextBlock && 'content' in mainTextBlock) {
              content = mainTextBlock.content;
            }
          } catch (error) {
            console.error('获取消息内容失败:', error);
          }
        }

        // 构建API消息格式
        const apiMessage: any = {
          role: msg.role,
          content: content || ''
        };

        // 处理图片
        if ('images' in msg && msg.images) {
          apiMessage.images = msg.images;
        }

        return apiMessage;
      });

      console.log(`[processModelRequest] 准备发送API请求, 消息数量: ${apiMessages.length}`);

      // 调用实际的API
      console.log(`[processModelRequest] 开始发送API请求`, {
        modelId: model.id,
        hasCallback: !!onUpdate,
        hasAbortSignal: !!options.abortSignal
      });

      // 检查是否已经被中断
      if (options.abortSignal?.aborted) {
        throw new DOMException('Operation aborted', 'AbortError');
      }

      const response = await api.sendChatRequest(apiMessages as any[], model, onUpdate, options.abortSignal);
      console.log(`[processModelRequest] 成功收到API响应`);

      // 如果返回值是对象（带有reasoning等属性），正确处理response
      const content = typeof response === 'string' ? response : response.content;
      const reasoning = typeof response === 'string' ? undefined : response.reasoning;
      const reasoningTime = typeof response === 'string' ? undefined : response.reasoningTime;

      // 返回统一的响应格式
      return {
        success: true,
        content,
        reasoning,
        reasoningTime
      };
    } catch (error: any) {
      const errorMessage = error?.message || '未知错误';
      console.error('[processModelRequest] API调用失败:', errorMessage);
      console.error('[processModelRequest] 错误详细信息:', error);

      // 提供更多错误上下文
      console.error('[processModelRequest] 错误上下文:', {
        modelId: model.id,
        provider: model.provider,
        errorName: error?.name,
        errorCode: error?.code || error?.status,
        apiKey: model.apiKey ? '已设置(长度:' + model.apiKey.length + ')' : '未设置',
        baseUrl: model.baseUrl || '未设置'
      });

      //  重要：抛出错误而不是返回错误对象，让 ResponseHandler 能正确处理
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[processModelRequest] 请求准备失败:', errorMessage);
    console.error('[processModelRequest] 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');

    // 记录更多上下文信息
    console.error('[processModelRequest] 请求上下文:', {
      modelId: model.id,
      provider: model.provider,
      messageCount: options.messages?.length || 0,
      hasSystemPrompt: !!options.systemPrompt,
      hasOnChunk: !!options.onChunk
    });

    //  重要：抛出错误而不是返回错误对象，让 ResponseHandler 能正确处理
    throw error;
  }
}

// 查找模型
async function findModelById(modelId: string): Promise<Model | null> {
  try {
    // 从设置中获取模型列表
    const settings = await getSettingFromDB('settings');
    console.log(`[findModelById] 查找模型ID: ${modelId}`);

    if (!settings) {
      console.warn('[findModelById] 未找到设置');
      return null;
    }

    // 尝试直接匹配模型ID - 只进行精确匹配，不做模糊匹配
    const models = settings.models as Model[];
    if (models && Array.isArray(models)) {
      let model = models.find(m => m.id === modelId);

      if (model) {
        console.log(`[findModelById] 找到匹配的模型: ${model.name || model.id}`);

        // 如果找到了模型但没有apiKey和baseUrl，尝试从对应的provider获取
        if ((!model.apiKey || !model.baseUrl) && model.provider && settings.providers) {
          const provider = settings.providers.find((p: any) => p.id === model.provider);
          if (provider) {
            model.apiKey = provider.apiKey;
            model.baseUrl = provider.baseUrl;
            console.log(`[findModelById] 从供应商${provider.id}中补充获取apiKey和baseUrl`);
          }
        }

        return model;
      }
    }

    // 如果在models中找不到，尝试从providers中查找 - 精确匹配，不做模糊匹配
    if (settings.providers && Array.isArray(settings.providers)) {
      for (const provider of settings.providers) {
        if (provider.models && Array.isArray(provider.models)) {
          const providerModel = provider.models.find((m: any) => m.id === modelId);
          if (providerModel) {
            // 为找到的模型添加正确的provider信息
            const completeModel = {
              ...providerModel,
              provider: provider.id,
              apiKey: provider.apiKey,
              baseUrl: provider.baseUrl
            };
            console.log(`[findModelById] 从provider ${provider.id}中找到匹配的模型: ${completeModel.name || completeModel.id}`);
            return completeModel;
          }
        }
      }
    }

    // 如果实在找不到匹配的模型，返回一个基础的fallback模型
    console.log(`[findModelById] 未找到匹配的模型ID: ${modelId}，返回最小化fallback模型`);
    return {
      id: modelId,
      name: modelId,
      provider: 'unknown',
      enabled: true
    };
  } catch (error) {
    console.error('[findModelById] 查找模型失败:', error);

    // 即使出错，也返回一个基于modelId的fallback模型
    return {
      id: modelId,
      name: modelId,
      provider: 'unknown',
      enabled: true
    };
  }
}