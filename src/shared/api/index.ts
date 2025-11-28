import type { Model } from '../types';
import { getSettingFromDB } from '../services/storage/storageService';
import { getProviderApi } from '../services/ProviderFactory';
import { modelMatchesIdentity, parseModelIdentityKey } from '../utils/modelUtils';
import store from '../store';
import { OpenAIResponseProvider } from '../providers/OpenAIResponseProvider';

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
    // 根据modelId查找对应模型
    const model = await findModelById(options.modelId);
    if (!model) {
      throw new Error(`未找到ID为${options.modelId}的模型`);
    }

    return await processModelRequest(model, options);
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

// 优化模型查找逻辑
async function findModelById(modelId: string): Promise<Model | null> {
  try {
    const settings = await getSettingFromDB('settings');
    if (!settings) return null;

    const identity = parseModelIdentityKey(modelId);
    if (!identity) return null;

    const providers = settings.providers || [];

    // 先在models中查找
    const models = settings.models as Model[];
    if (models && Array.isArray(models)) {
      // 使用 {id, provider} 组合精确匹配
      const model = models.find(m => modelMatchesIdentity(m, identity, m.provider));
      
      if (model) {
        const providerId = model.provider || identity.provider;
        if (providerId) {
          const provider = providers.find((p: any) => p.id === providerId);
          if (provider) {
            return {
              ...model,
              provider: providerId,
              apiKey: model.apiKey || provider.apiKey,
              baseUrl: model.baseUrl || provider.baseUrl,
              providerType: model.providerType || provider.providerType || providerId
            };
          }
        }
        return {
          ...model,
          provider: providerId || model.provider
        };
      }
    }

    // 在providers中查找
    if (providers && Array.isArray(providers)) {
      for (const provider of providers) {
        if (identity.provider && provider.id !== identity.provider) {
          continue;
        }
        
        if (provider.models && Array.isArray(provider.models)) {
          const providerModel = provider.models.find((m: any) => 
            modelMatchesIdentity(m, identity, provider.id)
          );
          
          if (providerModel) {
            return {
              ...providerModel,
              provider: provider.id,
              apiKey: provider.apiKey,
              baseUrl: provider.baseUrl,
              providerType: providerModel.providerType || provider.providerType || provider.id
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[findModelById] 查找失败:', error);
    return null;
  }
}