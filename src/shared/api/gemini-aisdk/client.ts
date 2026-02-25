/**
 * AI SDK Gemini 客户端模块
 * 使用 @ai-sdk/google 实现 Gemini API 调用
 * 支持多平台（Tauri、Capacitor、Web）和代理配置
 */
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { GoogleGenerativeAIProvider } from '@ai-sdk/google';
import type { Model } from '../../types';
import { createPlatformFetch, createHeaderFilterFetch } from '../../utils/universalFetch';


/**
 * 检查模型是否支持多模态
 */
export function supportsMultimodal(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return Boolean(
    model.capabilities?.multimodal ||
    modelId.includes('gemini-1.5') ||
    modelId.includes('gemini-2') ||
    modelId.includes('gemini-pro-vision')
  );
}

/**
 * 检查模型是否支持图像生成
 */
export function supportsImageGeneration(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return Boolean(
    model.capabilities?.imageGeneration ||
    modelId.includes('image') ||
    modelId.includes('gemini-2.5-flash-preview-image') ||
    modelId.includes('gemini-2.0-flash-exp-image')
  );
}

/**
 * 检查模型是否支持 Google 搜索
 */
export function supportsGoogleSearch(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return Boolean(
    model.capabilities?.webSearch ||
    modelId.includes('gemini-2.5') ||
    modelId.includes('gemini-2.0') ||
    modelId.includes('gemini-1.5')
  );
}

/**
 * 检查模型是否为推理模型（支持思考）
 */
export function supportsThinking(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return Boolean(
    model.capabilities?.reasoning ||
    modelId.includes('gemini-2.5-pro') ||
    modelId.includes('gemini-2.5-flash') ||
    modelId.includes('thinking')
  );
}

/**
 * 检查模型是否为 Gemma 模型
 */
export function isGemmaModel(model: Model): boolean {
  return model.id.toLowerCase().includes('gemma');
}

/**
 * 获取 Gemini 默认基础 URL
 */
function getDefaultBaseUrl(): string {
  return 'https://generativelanguage.googleapis.com/v1beta';
}

/**
 * 创建 AI SDK Gemini 客户端
 * @param model 模型配置
 * @returns AI SDK Google Generative AI Provider 实例
 */
export function createClient(model: Model): GoogleGenerativeAIProvider {
  try {
    const apiKey = model.apiKey;
    if (!apiKey) {
      console.error('[Gemini AI SDK Client] 错误: 未提供 API 密钥');
      throw new Error('未提供 Gemini API 密钥，请在设置中配置');
    }

    // 处理基础 URL
    let baseURL = model.baseUrl || getDefaultBaseUrl();

    // 开发环境下自动转换为代理 URL
    if (import.meta.env.DEV && baseURL.includes('code.newcli.com')) {
      const proxyPath = baseURL.replace('https://code.newcli.com', '/api/newcli');
      baseURL = `${window.location.origin}${proxyPath}`;
      console.log(`[Gemini AI SDK Client] 开发环境代理转换`);
    }

    // 确保 baseURL 格式正确
    if (baseURL.endsWith('/')) {
      baseURL = baseURL.slice(0, -1);
    }

    console.log(`[Gemini AI SDK Client] 创建客户端, 模型ID: ${model.id}, baseURL: ${baseURL.substring(0, 40)}...`);

    // 构建配置
    const config: Parameters<typeof createGoogleGenerativeAI>[0] = {
      apiKey,
      baseURL,
    };

    // 设置平台适配的 fetch（统一由 universalFetch 模块提供）
    let customFetch = createPlatformFetch(model);

    // 收集自定义头部
    const customHeaders: Record<string, string> = {};
    const headersToRemove: string[] = [];

    // 添加模型级别额外头部
    if (model.extraHeaders) {
      Object.assign(customHeaders, model.extraHeaders);
      console.log(`[Gemini AI SDK Client] 设置模型额外头部: ${Object.keys(model.extraHeaders).join(', ')}`);
    }

    // 添加供应商级别额外头部
    if ((model as any).providerExtraHeaders) {
      const providerHeaders = (model as any).providerExtraHeaders;
      
      Object.entries(providerHeaders).forEach(([key, value]) => {
        if (value === 'REMOVE') {
          headersToRemove.push(key.toLowerCase());
        } else if (value !== null && value !== undefined && value !== '') {
          customHeaders[key] = value as string;
        }
      });

      if (headersToRemove.length > 0) {
        console.log(`[Gemini AI SDK Client] 配置删除请求头: ${headersToRemove.join(', ')}`);
      }
    }

    // 如果有需要删除的头部，使用统一的 header 过滤函数
    if (headersToRemove.length > 0 && customFetch) {
      customFetch = createHeaderFilterFetch(customFetch, headersToRemove);
    }

    // 设置配置
    if (customFetch) {
      config.fetch = customFetch;
    }

    if (Object.keys(customHeaders).length > 0) {
      config.headers = customHeaders;
    }

    // 创建并返回 AI SDK Google Generative AI Provider
    const client = createGoogleGenerativeAI(config);
    console.log(`[Gemini AI SDK Client] 客户端创建成功`);
    return client;

  } catch (error) {
    console.error('[Gemini AI SDK Client] 创建客户端失败:', error);
    
    // 创建后备客户端
    const fallbackClient = createGoogleGenerativeAI({
      apiKey: 'missing-key-please-configure',
      baseURL: getDefaultBaseUrl(),
    });
    console.warn('[Gemini AI SDK Client] 使用后备客户端配置');
    return fallbackClient;
  }
}

/**
 * 测试 API 连接
 */
export async function testConnection(model: Model): Promise<boolean> {
  try {
    const client = createClient(model);
    
    console.log(`[Gemini AI SDK Client] 测试连接: ${model.id}`);
    
    // 使用简单的生成请求测试连接
    const result = await generateText({
      model: client(model.id),
      prompt: 'Hello',
      maxOutputTokens: 5,
    });

    return Boolean(result.text);
  } catch (error) {
    console.error('[Gemini AI SDK Client] 连接测试失败:', error);
    return false;
  }
}
