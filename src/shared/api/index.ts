import type { Model } from '../types';
import { getProviderApi } from '../services/ProviderFactory';
import { modelMatchesIdentity, parseModelIdentityKey } from '../utils/modelUtils';
import store from '../store';
import { OpenAIResponseProvider } from '../providers/OpenAIResponseProvider';
import type { ModelProvider } from '../config/defaultModels';

/**
 * API模块索引文件
 * 导出所有API模块
 */

// 导出OpenAI API模块
export * as openaiApi from './openai';

// 导出Gemini API模块 (使用 AI SDK 实现)
export * as geminiApi from './gemini-aisdk';

// 导出Anthropic API模块 (使用 AI SDK 实现)
export * as anthropicApi from './anthropic-aisdk';

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

      // 使用静态导入的 OpenAIResponseProvider
      const provider = new OpenAIResponseProvider(model);

      // 使用 Responses API 专用的测试方法
      return await provider.testConnection();
    }

    // 对于测试连接，直接使用传入的模型对象，不从数据库查找
    // 这样可以测试未添加到 provider 列表中的模型
    const api = getProviderApi(model);
    
    // 构造测试消息
    const testMessages = [{
      id: 'test-msg',
      role: 'user' as const,
      content: '你好，这是一条测试消息。请回复"连接成功"。',
      timestamp: new Date().toISOString()
    }];

    // 直接调用 API 的 sendChatRequest 方法
    const response = await api.sendChatRequest(testMessages, model);
    
    // 检查响应
    const content = typeof response === 'string' ? response : response.content;
    return Boolean(content && content.length > 0);
  } catch (error) {
    console.error('API连接测试失败:', error);
    return false;
  }
};

// 发送聊天请求（新版本接口，使用请求对象）
export const sendChatRequest = async (options: ChatRequest): Promise<{ success: boolean; content?: string; reasoning?: string; reasoningTime?: number; error?: string }> => {
  try {
    // 🚀 根据modelId查找对应模型（现在是同步函数，直接从 Redux Store 读取）
    const model = findModelById(options.modelId);
    if (!model) {
      throw new Error(`未找到ID为${options.modelId}的模型`);
    }

    return processModelRequest(model, options);
  } catch (error) {
    console.error('[sendChatRequest] 请求失败:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// 处理模型请求的函数，从sendChatRequest中提取出来
async function processModelRequest(model: Model, options: ChatRequest): Promise<{ success: boolean; content?: string; reasoning?: string; reasoningTime?: number; error?: string }> {
  try {
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
      messages.unshift(systemMessage);
    }

    // 获取对应的API实现
    const api = getProviderApi(model);

    try {
      // 简化消息格式转换
      const apiMessages = messages.map(msg => {
        let content = '';

        if (typeof msg.content === 'string') {
          content = msg.content;
        } else if ('blocks' in msg && Array.isArray(msg.blocks)) {
          const state = store.getState();
          const blocks = msg.blocks
            .map(blockId => state.messageBlocks.entities[blockId])
            .filter(Boolean);
          const mainTextBlock = blocks.find(block => block.type === 'main_text');
          if (mainTextBlock && 'content' in mainTextBlock) {
            content = mainTextBlock.content;
          }
        }

        return {
          role: msg.role,
          content: content || '',
          ...(msg.images && { images: msg.images })
        };
      });

      // 检查中断信号
      if (options.abortSignal?.aborted) {
        throw new DOMException('Operation aborted', 'AbortError');
      }

      const response = await api.sendChatRequest(apiMessages, model);

      // 处理响应格式
      const content = typeof response === 'string' ? response : response.content;
      const reasoning = typeof response === 'string' ? undefined : response.reasoning;
      const reasoningTime = typeof response === 'string' ? undefined : response.reasoningTime;

      return {
        success: true,
        content,
        reasoning,
        reasoningTime
      };
    } catch (error) {
      console.error('[processModelRequest] API调用失败:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  } catch (error) {
    console.error('[processModelRequest] 请求失败:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * 🚀 参考 Cherry Studio 的实现：直接从 Redux Store 获取 providers
 * 这样可以确保始终使用最新的配置，避免从数据库读取导致的延迟问题
 */
export function getStoreProviders(): ModelProvider[] {
  return store.getState().settings.providers || [];
}

/**
 * 🚀 参考 Cherry Studio 的实现：根据模型获取对应的 Provider
 * 直接从 Redux Store 读取，确保获取最新配置
 */
export function getProviderByModel(model?: Model): ModelProvider | null {
  if (!model) return null;
  
  const providers = getStoreProviders();
  const provider = providers.find((p) => p.id === model.provider);
  
  if (!provider) {
    // 如果没找到，尝试返回第一个启用的 provider
    return providers.find((p) => p.isEnabled) || providers[0] || null;
  }
  
  return provider;
}

/**
 * 🚀 根据 Provider ID 获取 Provider
 */
export function getProviderById(providerId: string): ModelProvider | null {
  const providers = getStoreProviders();
  return providers.find((p) => p.id === providerId) || null;
}

/**
 * 🚀 优化模型查找逻辑 - 参考 Cherry Studio 实现
 * 直接从 Redux Store 读取，确保始终使用最新的配置
 * 不再从数据库异步读取，避免数据同步延迟问题
 */
function findModelById(modelId: string): Model | null {
  try {
    // 🚀 关键修改：直接从 Redux Store 获取最新数据
    const settings = store.getState().settings;
    if (!settings) return null;

    const identity = parseModelIdentityKey(modelId);
    if (!identity) return null;

    const providers = settings.providers || [];

    // 在 providers 中查找模型
    for (const provider of providers) {
      // 如果指定了 provider，只在该 provider 中查找
      if (identity.provider && provider.id !== identity.provider) {
        continue;
      }
      
      if (provider.models && Array.isArray(provider.models)) {
        const providerModel = provider.models.find((m: Model) => 
          modelMatchesIdentity(m, identity, provider.id)
        );
        
        if (providerModel) {
          // 🚀 合并 provider 的配置到模型中，确保使用最新的 apiKey 和 baseUrl
          return {
            ...providerModel,
            provider: provider.id,
            apiKey: providerModel.apiKey || provider.apiKey,
            baseUrl: providerModel.baseUrl || provider.baseUrl,
            providerType: providerModel.providerType || provider.providerType || provider.id,
            // 🚀 继承 provider 的其他配置
            useCorsPlugin: providerModel.useCorsPlugin ?? provider.useCorsPlugin,
          };
        }
      }
    }

    console.warn(`[findModelById] 未找到模型: ${modelId}`);
    return null;
  } catch (error) {
    console.error('[findModelById] 查找失败:', error);
    return null;
  }
}