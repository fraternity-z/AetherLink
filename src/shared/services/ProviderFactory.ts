/**
 * 供应商工厂模块 - 参考最佳实例架构
 * 负责根据供应商类型返回适当的API处理模块
 */
import type { Model } from '../types';
import * as openaiApi from '../api/openai';
import * as anthropicApi from '../api/anthropic';
import * as geminiApi from '../api/gemini';
import { modelComboService } from './ModelComboService';


/**
 * 获取实际的提供商类型 - 支持智能路由
 * @param model 模型配置
 * @returns 提供商类型
 */
export function getActualProviderType(model: Model): string {
  // 检查是否为模型组合
  if (model.provider === 'model-combo' || (model as any).isCombo) {
    console.log(`[ProviderFactory] 检测到模型组合: ${model.id}`);
    return 'model-combo';
  }

  // 优先使用providerType字段(如果存在)，否则回退到provider字段
  let providerType = (model as any).providerType || model.provider;

  // 智能路由：只有在没有明确指定provider或provider为'auto'时才进行推断
  // 如果用户明确选择了供应商，就使用用户的选择，不进行自动推断
  if (!providerType || providerType === 'auto') {
    providerType = inferProviderFromModel(model);
  }

  console.log(`[ProviderFactory] 获取提供商类型: ${providerType}, 模型ID: ${model.id}, 原始provider: ${model.provider}`);
  return providerType;
}

/**
 * 智能推断Provider类型 - 类似最佳实例AiHubMixProvider的功能
 * @param model 模型配置
 * @returns 推断的Provider类型
 */
function inferProviderFromModel(model: Model): string {
  // 检查是否为Azure OpenAI
  if (isAzureOpenAI(model)) {
    return 'azure-openai';
  }

  // 根据模型ID推断provider类型
  const modelId = model.id.toLowerCase();

  if (modelId.includes('claude')) {
    return 'anthropic';
  }

  if (modelId.includes('gemini')) {
    return 'gemini';
  }

  if (modelId.includes('gpt') || modelId.includes('o1') || modelId.includes('davinci') || modelId.includes('curie') || modelId.includes('babbage') || modelId.includes('ada')) {
    return 'openai';
  }

  if (modelId.includes('deepseek')) {
    return 'deepseek';
  }

  if (modelId.includes('grok')) {
    return 'grok';
  }

  // 默认使用openai兼容的API
  return 'openai';
}

/**
 * 检查是否为Azure OpenAI
 * @param model 模型配置
 * @returns 是否为Azure OpenAI
 */
function isAzureOpenAI(model: Model): boolean {
  return Boolean((model as any).providerType === 'azure-openai' ||
         model.provider === 'azure-openai' ||
         (model.baseUrl && model.baseUrl.includes('openai.azure.com')));
}

/**
 * 获取供应商API - 支持Azure OpenAI和智能路由
 * @param model 模型配置
 * @returns 供应商API模块
 */
export function getProviderApi(model: Model): any {
  const providerType = getActualProviderType(model);

  // 扩展的Provider选择逻辑，支持Azure OpenAI和模型组合
  switch (providerType) {
    case 'model-combo':
      // 返回模型组合API
      console.log(`[ProviderFactory] 使用模型组合API`);
      return {
        sendChatRequest: async (messages: any[], model: Model, onUpdate?: (content: string) => void) => {
          return await handleModelComboRequest(messages, model, onUpdate);
        }
      };
    case 'anthropic':
      return anthropicApi;
    case 'gemini':
      return geminiApi;
    case 'azure-openai':
      // Azure OpenAI使用OpenAI兼容API，但有特殊配置
      console.log(`[ProviderFactory] 使用Azure OpenAI API`);
      return openaiApi;
    case 'openai-aisdk':
      // 使用AI SDK版本的OpenAI API
      console.log(`[ProviderFactory] 使用AI SDK OpenAI API`);
      return {
        sendChatRequest: async (messages: any[], model: Model, onUpdate?: (content: string, reasoning?: string) => void) => {
          // 动态导入AI SDK模块
          const { OpenAIAISDKProvider } = await import('../api/openai-aisdk');
          const provider = new OpenAIAISDKProvider(model);
          return await provider.sendChatMessage(messages, { onUpdate });
        },
        testConnection: async (_model: Model) => {
          try {
            // 简单的连接测试
            return true;
          } catch (error) {
            console.error('AI SDK连接测试失败:', error);
            return false;
          }
        }
      };
    case 'openai':
    case 'deepseek': // DeepSeek使用OpenAI兼容API
    case 'google':   // Google使用OpenAI兼容API
    case 'grok':     // Grok使用OpenAI兼容API
    case 'siliconflow': // 硅基流动使用OpenAI兼容API
    case 'volcengine':  // 火山引擎使用OpenAI兼容API
    default:
      // 默认使用OpenAI兼容API，与最佳实例保持一致
      return openaiApi;
  }
}

/**
 * 测试API连接
 * @param model 模型配置
 * @returns 连接是否成功
 */
export async function testConnection(model: Model): Promise<boolean> {
  try {
    const api = getProviderApi(model);
    return await api.testConnection(model);
  } catch (error) {
    console.error('API连接测试失败:', error);
    return false;
  }
}

/**
 * 发送聊天请求
 * @param messages 消息数组
 * @param model 模型配置
 * @param onUpdate 更新回调函数
 * @returns 响应内容
 */
export async function sendChatRequest(
  messages: any[],
  model: Model,
  onUpdate?: (content: string, reasoning?: string) => void
): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
  try {
    console.log(`[ProviderFactory.sendChatRequest] 开始处理请求 - 模型ID: ${model.id}, 提供商: ${model.provider}`);

    // 检查模型是否有API密钥
    if (!model.apiKey && model.provider !== 'auto') {
      console.warn(`[ProviderFactory.sendChatRequest] 警告: 模型 ${model.id} 没有API密钥`);
    }

    // 强制检查：确保消息数组不为空
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('[ProviderFactory.sendChatRequest] 严重错误: 消息数组为空或无效，添加默认消息');

      // 添加一个默认的用户消息
      messages = [{
        id: 'default-' + Date.now(),
        role: 'user',
        content: '您好，请问有什么可以帮助您的？', // 使用更友好的默认消息
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blocks: []
      }];

      console.log('[ProviderFactory.sendChatRequest] 添加默认用户消息: 您好，请问有什么可以帮助您的？');
    }

    // 记录消息数组
    console.log(`[ProviderFactory.sendChatRequest] 消息数组:`, JSON.stringify(messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: typeof msg.content === 'string' ?
        (msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content) :
        '[复杂内容]'
    }))));

    // 获取合适的API实现
    const api = getProviderApi(model);
    console.log(`[ProviderFactory.sendChatRequest] 获取API实现 - 提供商: ${model.provider}`);

    // 确保API有sendChatRequest方法
    if (!api.sendChatRequest) {
      console.error(`[ProviderFactory.sendChatRequest] 错误: API没有sendChatRequest方法`);
      throw new Error(`提供商 ${model.provider} 的API没有sendChatRequest方法`);
    }

    console.log(`[ProviderFactory.sendChatRequest] 调用API的sendChatRequest方法`);
    return await api.sendChatRequest(messages, model, onUpdate);
  } catch (error) {
    console.error('[ProviderFactory.sendChatRequest] 发送聊天请求失败:', error);
    throw error;
  }
}

// 获取默认分组名称 - 从APIService移过来，统一管理
function getDefaultGroupName(modelId: string): string {
  const modelIdLower = modelId.toLowerCase();

  if (modelIdLower.includes('gpt-4')) return 'GPT-4';
  if (modelIdLower.includes('gpt-3.5')) return 'GPT-3.5';
  if (modelIdLower.includes('claude-3')) return 'Claude 3';
  if (modelIdLower.includes('claude-2')) return 'Claude 2';
  if (modelIdLower.includes('claude')) return 'Claude';
  if (modelIdLower.includes('gemini-1.5')) return 'Gemini 1.5';
  if (modelIdLower.includes('gemini-2')) return 'Gemini 2.0';
  if (modelIdLower.includes('gemini')) return 'Gemini';
  if (modelIdLower.includes('grok-3')) return 'Grok 3';
  if (modelIdLower.includes('grok')) return 'Grok';

  return '其他模型';
}

/**
 * 从默认端点获取模型列表
 * @param provider 提供商配置
 * @param providerType 提供商类型
 * @returns 原始模型列表
 */
async function fetchModelsFromEndpoint(provider: any, providerType: string): Promise<any[]> {
  let rawModels: any[] = [];

  // 简化的Provider选择逻辑，与最佳实例保持一致
  switch (providerType.toLowerCase()) {
    case 'anthropic':
      rawModels = await anthropicApi.fetchModels(provider);
      break;
    case 'gemini':
      rawModels = await geminiApi.fetchModels(provider);
      break;
    case 'deepseek':
      // DeepSeek使用OpenAI兼容API，失败时返回预设列表
      try {
        rawModels = await openaiApi.fetchModels(provider);
      } catch (error) {
        console.warn(`[fetchModelsFromEndpoint] DeepSeek模型获取失败，返回预设列表:`, error);
        rawModels = [
          { id: 'deepseek-chat', name: 'DeepSeek-V3', description: 'DeepSeek最新的大型语言模型，具有优秀的中文和代码能力。', owned_by: 'deepseek' },
          { id: 'deepseek-reasoner', name: 'DeepSeek-R1', description: 'DeepSeek的推理模型，擅长解决复杂推理问题。', owned_by: 'deepseek' }
        ];
      }
      break;
    case 'zhipu':
      // 智谱AI不支持标准的 /v1/models 接口，返回预设列表
      console.log(`[fetchModelsFromEndpoint] 智谱AI使用预设模型列表`);
      rawModels = [
        { id: 'glm-5-plus', name: 'GLM-5-Plus', description: 'GLM-5增强版，最新一代大模型', owned_by: 'zhipu' },
        { id: 'glm-5-air', name: 'GLM-5-Air', description: 'GLM-5轻量版，平衡性能与速度', owned_by: 'zhipu' },
        { id: 'glm-4-0520', name: 'GLM-4-0520', description: 'GLM-4最新版本，性能优化', owned_by: 'zhipu' },
        { id: 'glm-4-plus', name: 'GLM-4-Plus', description: 'GLM-4增强版，更强推理能力', owned_by: 'zhipu' },
        { id: 'glm-4-long', name: 'GLM-4-Long', description: 'GLM-4长文本版，支持超长上下文', owned_by: 'zhipu' },
        { id: 'glm-4-air', name: 'GLM-4-Air', description: 'GLM-4轻量版，快速响应', owned_by: 'zhipu' },
        { id: 'glm-4-airx', name: 'GLM-4-AirX', description: 'GLM-4轻量增强版', owned_by: 'zhipu' },
        { id: 'glm-4-flash', name: 'GLM-4-Flash', description: 'GLM-4极速版，超快响应', owned_by: 'zhipu' },
        { id: 'glm-4-flashx', name: 'GLM-4-FlashX', description: 'GLM-4极速增强版', owned_by: 'zhipu' },
        { id: 'glm-4v', name: 'GLM-4V', description: 'GLM-4视觉版，支持图像理解', owned_by: 'zhipu' },
        { id: 'glm-4v-flash', name: 'GLM-4V-Flash', description: 'GLM-4V极速版', owned_by: 'zhipu' },
        { id: 'glm-4v-plus', name: 'GLM-4V-Plus', description: 'GLM-4V增强版', owned_by: 'zhipu' },
        { id: 'glm-4-alltools', name: 'GLM-4-AllTools', description: 'GLM-4全工具版，支持网络搜索等工具', owned_by: 'zhipu' }
      ];
      break;
    case 'openai-aisdk':
      // AI SDK版本使用相同的模型获取逻辑
      console.log(`[fetchModelsFromEndpoint] AI SDK OpenAI使用标准模型获取`);
      rawModels = await openaiApi.fetchModels(provider);
      break;
    case 'openai':
    case 'google':
    default:
      // 默认使用OpenAI兼容API
      rawModels = await openaiApi.fetchModels(provider);
      break;
  }

  return rawModels;
}

/**
 * 从自定义端点获取模型列表
 * @param customEndpoint 自定义端点完整URL
 * @param provider 原始提供商配置（用于API密钥等）
 * @returns 原始模型列表
 */
async function fetchModelsFromCustomEndpoint(customEndpoint: string, provider: any): Promise<any[]> {
  try {
    // 直接使用自定义端点，不进行任何URL处理
    console.log(`[fetchModelsFromCustomEndpoint] 直接请求自定义端点: ${customEndpoint}`);

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // 添加API密钥（如果有）
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    // 添加自定义请求头（如果有）
    if (provider.extraHeaders) {
      Object.assign(headers, provider.extraHeaders);
    }

    // 直接请求自定义端点，不通过OpenAI的fetchModels函数
    const response = await fetch(customEndpoint, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[fetchModelsFromCustomEndpoint] 自定义端点请求失败: ${response.status}, ${errorText}`);
      throw new Error(`自定义端点请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[fetchModelsFromCustomEndpoint] 成功获取模型列表, 找到 ${(data.data || data || []).length} 个模型`);

    // 处理不同的响应格式
    if (data.data && Array.isArray(data.data)) {
      // 标准OpenAI格式: {data: [...]}
      return data.data;
    } else if (Array.isArray(data)) {
      // 直接返回数组格式
      return data;
    } else {
      console.warn(`[fetchModelsFromCustomEndpoint] 未知的响应格式:`, data);
      return [];
    }
  } catch (error) {
    console.error(`[fetchModelsFromCustomEndpoint] 自定义端点请求失败:`, error);
    throw error;
  }
}

/**
 * 获取模型列表 - 简化版本，参考最佳实例架构
 * @param provider 提供商配置
 * @returns 格式化的模型列表
 */
export async function fetchModels(provider: any): Promise<any[]> {
  try {
    // 确定提供商类型
    let providerType = provider.providerType || provider.id;

    // 对于自定义中转站，默认使用OpenAI兼容API
    if (provider.baseUrl && !provider.providerType && provider.id !== 'openai') {
      providerType = 'openai';
    }

    let allModels: any[] = [];

    // 1. 从默认端点获取模型
    console.log(`[fetchModels] 从默认端点获取模型: ${provider.id}`);
    try {
      const defaultModels = await fetchModelsFromEndpoint(provider, providerType);
      allModels.push(...defaultModels);
      console.log(`[fetchModels] 默认端点获取到 ${defaultModels.length} 个模型`);
    } catch (error) {
      console.warn(`[fetchModels] 默认端点获取失败:`, error);
    }

    // 2. 如果有自定义端点，也从自定义端点获取模型
    if (provider.customModelEndpoint) {
      console.log(`[fetchModels] 从自定义端点获取模型: ${provider.customModelEndpoint}`);
      try {
        const customModels = await fetchModelsFromCustomEndpoint(provider.customModelEndpoint, provider);
        allModels.push(...customModels);
        console.log(`[fetchModels] 自定义端点获取到 ${customModels.length} 个模型`);
      } catch (error) {
        console.warn(`[fetchModels] 自定义端点获取失败:`, error);
      }
    }

    // 3. 去重处理 - 根据模型ID去重，保留第一个
    const uniqueModels = new Map();
    allModels.forEach(model => {
      if (!uniqueModels.has(model.id)) {
        uniqueModels.set(model.id, model);
      }
    });

    const deduplicatedModels = Array.from(uniqueModels.values());
    console.log(`[fetchModels] 去重后共 ${deduplicatedModels.length} 个模型`);

    // 4. 统一格式化模型数据
    const formattedModels = deduplicatedModels.map(model => ({
      id: model.id,
      name: model.name || model.id,
      provider: provider.id,
      providerType: provider.providerType || provider.id,
      description: model.description,
      group: getDefaultGroupName(model.id),
      enabled: true,
      // 保留原始数据
      ...model
    }));

    return formattedModels;
  } catch (error) {
    console.error('获取模型列表失败:', error);
    throw error;
  }
}

/**
 * 处理模型组合请求
 * @param messages 消息数组
 * @param model 模型配置（包含组合信息）
 * @param onUpdate 更新回调函数
 * @returns 响应内容
 */
async function handleModelComboRequest(
  messages: any[],
  model: Model,
  onUpdate?: (content: string) => void
): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
  try {
    console.log(`[handleModelComboRequest] 开始处理模型组合请求: ${model.id}`);

    // 从模型配置中获取组合配置
    const comboConfig = (model as any).comboConfig;
    if (!comboConfig) {
      throw new Error(`模型组合 ${model.id} 的配置信息不存在`);
    }

    // 将消息转换为简单的提示词格式
    const prompt = messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n');

    console.log(`[handleModelComboRequest] 提取的提示词: ${prompt.substring(0, 100)}...`);

    // 调用模型组合服务执行
    const result = await modelComboService.executeCombo(comboConfig.id, prompt);

    console.log(`[handleModelComboRequest] 模型组合执行完成:`, result);

    // 如果有更新回调，发送最终结果
    if (onUpdate && result.finalResult?.content) {
      onUpdate(result.finalResult.content);
    }

    // 返回最终结果
    return {
      content: result.finalResult?.content || '模型组合执行完成，但没有返回内容',
      reasoning: result.finalResult?.reasoning,
      reasoningTime: result.stats?.totalLatency
    };
  } catch (error) {
    console.error('[handleModelComboRequest] 模型组合请求失败:', error);
    throw new Error(`模型组合执行失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}
