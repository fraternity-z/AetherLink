/**
 * AI SDK OpenAI 客户端模块
 * 使用 @ai-sdk/openai 替代原生 OpenAI SDK
 * 支持多平台（Tauri、Capacitor、Web）和代理配置
 */
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { OpenAIProvider as AISDKOpenAIProvider } from '@ai-sdk/openai';
import type { Model } from '../../types';
import { universalFetch } from '../../utils/universalFetch';
import { isTauri } from '../../utils/platformDetection';
import { Capacitor } from '@capacitor/core';
import { isReasoningModel } from '../../../config/models';

/**
 * 检查是否需要使用 CORS 代理
 */
function needsCORSProxy(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

    // 本地地址不需要代理
    const hostname = urlObj.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return false;
    }

    // Web端：跨域请求需要代理
    return urlObj.origin !== currentOrigin;
  } catch {
    return false;
  }
}

/**
 * 创建代理 fetch 函数（用于 Web 端）
 */
function createProxyFetch() {
  return async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : (url as any).url;
    
    if (needsCORSProxy(urlStr)) {
      const proxyUrl = `http://localhost:8888/proxy?url=${encodeURIComponent(urlStr)}`;
      console.log(`[AI SDK ProxyFetch] 使用代理: ${urlStr.substring(0, 50)}...`);
      
      try {
        return await fetch(proxyUrl, init);
      } catch (error) {
        console.error(`[AI SDK ProxyFetch] 代理请求失败:`, error);
        throw error;
      }
    }
    
    return fetch(urlStr, init);
  };
}

/**
 * 创建平台适配的 fetch 函数
 */
function createPlatformFetch(model: Model): typeof fetch | undefined {
  const isTauriEnv = isTauri();
  const isCapacitorNative = Capacitor.isNativePlatform && Capacitor.isNativePlatform();
  const isWeb = !isTauriEnv && !isCapacitorNative;

  if (isTauriEnv) {
    console.log(`[AI SDK Client] Tauri 平台：使用 universalFetch`);
    return async (url: RequestInfo | URL, init?: RequestInit) => {
      return universalFetch(url.toString(), init);
    };
  }

  if (isCapacitorNative) {
    const fetchMode = model.useCorsPlugin ? 'CorsBypass Plugin' : 'Standard Fetch';
    console.log(`[AI SDK Client] Capacitor Native 平台：使用 ${fetchMode}`);
    return async (url: RequestInfo | URL, init?: RequestInit) => {
      const fetchOptions = { ...init, useCorsPlugin: model.useCorsPlugin };
      return universalFetch(url.toString(), fetchOptions);
    };
  }

  if (isWeb) {
    console.log(`[AI SDK Client] Web 端：使用 CORS 代理服务器`);
    return createProxyFetch();
  }

  return undefined;
}

/**
 * 处理自定义请求头（支持禁用特定头部）
 */
function createHeaderFilterFetch(
  baseFetch: typeof fetch,
  headersToRemove: string[]
): typeof fetch {
  return async (url: RequestInfo | URL, init?: RequestInit) => {
    if (init?.headers && headersToRemove.length > 0) {
      const headers = new Headers(init.headers);

      headersToRemove.forEach(headerName => {
        headers.delete(headerName);
        
        // 对于 stainless 相关头部，进行模糊匹配删除
        if (headerName.includes('stainless')) {
          const keysToDelete: string[] = [];
          for (const [key] of headers.entries()) {
            if (key.toLowerCase().includes('stainless')) {
              keysToDelete.push(key);
            }
          }
          keysToDelete.forEach(key => headers.delete(key));
        }
      });

      init.headers = headers;
    }
    return baseFetch(url.toString(), init);
  };
}

/**
 * 检查是否为 Azure OpenAI
 */
export function isAzureOpenAI(model: Model): boolean {
  return Boolean(
    (model as any).providerType === 'azure-openai' ||
    model.provider === 'azure-openai' ||
    (model.baseUrl && model.baseUrl.includes('openai.azure.com'))
  );
}

/**
 * 检查模型是否支持多模态
 */
export function supportsMultimodal(model: Model): boolean {
  const modelId = model.id;
  return Boolean(
    model.capabilities?.multimodal ||
    modelId.includes('gpt-4') ||
    modelId.includes('gpt-4o') ||
    modelId.includes('vision') ||
    modelId.includes('gemini') ||
    modelId.includes('claude-3')
  );
}

/**
 * 检查模型是否支持网页搜索
 */
export function supportsWebSearch(model: Model): boolean {
  const modelId = model.id;
  return Boolean(
    model.capabilities?.webSearch ||
    modelId.includes('gpt-4o-search-preview') ||
    modelId.includes('gpt-4o-mini-search-preview')
  );
}

/**
 * 检查模型是否支持推理优化
 */
export function supportsReasoning(model: Model): boolean {
  if (model.modelTypes && model.modelTypes.includes('reasoning')) {
    return true;
  }
  return isReasoningModel(model);
}

/**
 * 获取 Web 搜索参数配置
 */
export function getWebSearchParams(model: Model, enableSearch: boolean): Record<string, any> {
  if (!supportsWebSearch(model) || !enableSearch) {
    return {};
  }

  switch (model.provider) {
    case 'hunyuan':
      return { enable_enhancement: enableSearch, citation: true, search_info: true };
    case 'dashscope':
      return { enable_search: true, search_options: { forced_search: true } };
    case 'openrouter':
      return { plugins: [{ id: 'web', search_prompts: ['Search the web for...'] }] };
    case 'openai':
      if (supportsWebSearch(model)) {
        return { web_search_options: {} };
      }
      return { tools: [{ type: 'retrieval' }] };
    default:
      return enableSearch ? { tools: [{ type: 'retrieval' }] } : {};
  }
}

/**
 * 创建 AI SDK OpenAI 客户端
 * @param model 模型配置
 * @returns AI SDK OpenAI Provider 实例
 */
export function createClient(model: Model): AISDKOpenAIProvider {
  try {
    const apiKey = model.apiKey;
    if (!apiKey) {
      console.error('[AI SDK Client] 错误: 未提供 API 密钥');
      throw new Error('未提供 OpenAI API 密钥，请在设置中配置');
    }

    // 处理基础 URL
    let baseURL = model.baseUrl || 'https://api.openai.com/v1';

    // 开发环境下自动转换为代理 URL
    if (import.meta.env.DEV && baseURL.includes('code.newcli.com')) {
      const proxyPath = baseURL.replace('https://code.newcli.com', '/api/newcli');
      baseURL = `${window.location.origin}${proxyPath}`;
      console.log(`[AI SDK Client] 开发环境代理转换`);
    }

    // 检查是否需要特殊处理
    const shouldUseOriginal = baseURL.endsWith('/') || baseURL.endsWith('volces.com/api/v3');

    // 确保 baseURL 格式正确
    if (baseURL.endsWith('/')) {
      baseURL = baseURL.slice(0, -1);
    }

    // 确保 baseURL 包含 /v1（特殊情况除外）
    if (!baseURL.includes('/v1') && !shouldUseOriginal) {
      baseURL = `${baseURL}/v1`;
    }

    console.log(`[AI SDK Client] 创建客户端, 模型ID: ${model.id}, baseURL: ${baseURL.substring(0, 30)}...`);

    // 构建配置
    const config: Parameters<typeof createOpenAI>[0] = {
      apiKey,
      baseURL,
    };

    // 设置平台适配的 fetch
    let customFetch = createPlatformFetch(model);

    // 收集自定义头部
    const customHeaders: Record<string, string> = {};
    const headersToRemove: string[] = [];

    // Azure OpenAI 特殊配置
    if (isAzureOpenAI(model)) {
      customHeaders['api-version'] = (model as any).apiVersion || '2024-02-15-preview';
      console.log(`[AI SDK Client] 检测到 Azure OpenAI`);
    }

    // 添加模型级别额外头部
    if (model.extraHeaders) {
      Object.assign(customHeaders, model.extraHeaders);
      console.log(`[AI SDK Client] 设置模型额外头部: ${Object.keys(model.extraHeaders).join(', ')}`);
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
        console.log(`[AI SDK Client] 配置删除请求头: ${headersToRemove.join(', ')}`);
      }
    }

    // 如果有需要删除的头部，包装 fetch
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

    // 添加组织信息
    if ((model as any).organization) {
      config.organization = (model as any).organization;
      console.log(`[AI SDK Client] 设置组织ID: ${(model as any).organization}`);
    }

    // 创建并返回 AI SDK OpenAI Provider
    const client = createOpenAI(config);
    console.log(`[AI SDK Client] 客户端创建成功`);
    return client;

  } catch (error) {
    console.error('[AI SDK Client] 创建客户端失败:', error);
    
    // 创建后备客户端
    const fallbackClient = createOpenAI({
      apiKey: 'sk-missing-key-please-configure',
      baseURL: 'https://api.openai.com/v1',
    });
    console.warn('[AI SDK Client] 使用后备客户端配置');
    return fallbackClient;
  }
}

/**
 * 测试 API 连接
 */
export async function testConnection(model: Model): Promise<boolean> {
  try {
    const client = createClient(model);
    
    console.log(`[AI SDK Client] 测试连接: ${model.id}`);
    
    // 使用 .chat() 调用 Chat Completions API（兼容 OpenAI 兼容 API）
    const result = await generateText({
      model: client.chat(model.id) as any,
      prompt: 'Hello',
      maxOutputTokens: 5,
    });

    return Boolean(result.text);
  } catch (error) {
    console.error('[AI SDK Client] 连接测试失败:', error);
    return false;
  }
}
