/**
 * AI SDK Anthropic 客户端模块
 * 使用 @ai-sdk/anthropic 实现 Claude 供应商
 * 支持多平台（Tauri、Capacitor、Web）和代理配置
 */
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { AnthropicProvider as AISDKAnthropicProvider } from '@ai-sdk/anthropic';
import type { Model } from '../../types';
import { universalFetch } from '../../utils/universalFetch';
import { isTauri } from '../../utils/platformDetection';
import { Capacitor } from '@capacitor/core';

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
      console.log(`[Anthropic SDK ProxyFetch] 使用代理: ${urlStr.substring(0, 50)}...`);
      
      try {
        return await fetch(proxyUrl, init);
      } catch (error) {
        console.error(`[Anthropic SDK ProxyFetch] 代理请求失败:`, error);
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
    console.log(`[Anthropic SDK Client] Tauri 平台：使用 universalFetch`);
    return async (url: RequestInfo | URL, init?: RequestInit) => {
      return universalFetch(url.toString(), init);
    };
  }

  if (isCapacitorNative) {
    const fetchMode = model.useCorsPlugin ? 'CorsBypass Plugin' : 'Standard Fetch';
    console.log(`[Anthropic SDK Client] Capacitor Native 平台：使用 ${fetchMode}`);
    return async (url: RequestInfo | URL, init?: RequestInit) => {
      const fetchOptions = { ...init, useCorsPlugin: model.useCorsPlugin };
      return universalFetch(url.toString(), fetchOptions);
    };
  }

  if (isWeb) {
    console.log(`[Anthropic SDK Client] Web 端：使用 CORS 代理服务器`);
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
        
        // 对于 anthropic 相关头部，进行模糊匹配删除
        if (headerName.includes('anthropic')) {
          const keysToDelete: string[] = [];
          for (const [key] of headers.entries()) {
            if (key.toLowerCase().includes('anthropic') && key.toLowerCase() !== 'anthropic-version') {
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
 * 检查模型是否支持多模态（视觉）
 */
export function supportsMultimodal(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return Boolean(
    model.capabilities?.multimodal ||
    modelId.includes('claude-3') ||
    modelId.includes('claude-4')
  );
}

/**
 * 检查模型是否支持扩展思考（Extended Thinking）
 */
export function supportsExtendedThinking(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return Boolean(
    model.capabilities?.reasoning ||
    modelId.includes('claude-3-7') ||
    modelId.includes('claude-3.7') ||
    modelId.includes('claude-4') ||
    modelId.includes('opus') ||
    modelId.includes('sonnet-4')
  );
}

/**
 * 检查模型是否支持计算机使用（Computer Use）
 */
export function supportsComputerUse(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return Boolean(
    modelId.includes('claude-3-5-sonnet') ||
    modelId.includes('claude-3.5-sonnet') ||
    modelId.includes('claude-4') ||
    modelId.includes('sonnet-4')
  );
}

/**
 * 检查模型是否支持 PDF 输入
 */
export function supportsPdfInput(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return Boolean(
    modelId.includes('claude-3-5') ||
    modelId.includes('claude-3.5') ||
    modelId.includes('claude-4')
  );
}

/**
 * 检查是否为 Claude 推理模型
 */
export function isClaudeReasoningModel(model: Model): boolean {
  const modelId = model.id.toLowerCase();
  return Boolean(
    modelId.includes('claude-3-7') ||
    modelId.includes('claude-3.7') ||
    modelId.includes('claude-4') ||
    modelId.includes('opus-4') ||
    modelId.includes('sonnet-4')
  );
}

/**
 * 创建 AI SDK Anthropic 客户端
 * @param model 模型配置
 * @returns AI SDK Anthropic Provider 实例
 */
export function createClient(model: Model): AISDKAnthropicProvider {
  try {
    const apiKey = model.apiKey;
    if (!apiKey) {
      console.error('[Anthropic SDK Client] 错误: 未提供 API 密钥');
      throw new Error('未提供 Anthropic API 密钥，请在设置中配置');
    }

    // 处理基础 URL
    let baseURL = model.baseUrl || 'https://api.anthropic.com/v1';

    // 开发环境下自动转换为代理 URL
    if (import.meta.env.DEV && baseURL.includes('code.newcli.com')) {
      const proxyPath = baseURL.replace('https://code.newcli.com', '/api/newcli');
      baseURL = `${window.location.origin}${proxyPath}`;
      console.log(`[Anthropic SDK Client] 开发环境代理转换`);
    }

    // 确保 baseURL 格式正确
    if (baseURL.endsWith('/')) {
      baseURL = baseURL.slice(0, -1);
    }

    // Anthropic API 不需要 /v1 后缀（SDK 会自动添加）
    if (baseURL.endsWith('/v1')) {
      baseURL = baseURL.slice(0, -3);
    }

    console.log(`[Anthropic SDK Client] 创建客户端, 模型ID: ${model.id}, baseURL: ${baseURL.substring(0, 30)}...`);

    // 构建配置
    const config: Parameters<typeof createAnthropic>[0] = {
      apiKey,
      baseURL,
    };

    // 设置平台适配的 fetch
    let customFetch = createPlatformFetch(model);

    // 收集自定义头部
    const customHeaders: Record<string, string> = {};
    const headersToRemove: string[] = [];

    // 添加模型级别额外头部
    if (model.extraHeaders) {
      Object.assign(customHeaders, model.extraHeaders);
      console.log(`[Anthropic SDK Client] 设置模型额外头部: ${Object.keys(model.extraHeaders).join(', ')}`);
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
        console.log(`[Anthropic SDK Client] 配置删除请求头: ${headersToRemove.join(', ')}`);
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

    // 创建并返回 AI SDK Anthropic Provider
    const client = createAnthropic(config);
    console.log(`[Anthropic SDK Client] 客户端创建成功`);
    return client;

  } catch (error) {
    console.error('[Anthropic SDK Client] 创建客户端失败:', error);
    
    // 创建后备客户端
    const fallbackClient = createAnthropic({
      apiKey: 'sk-missing-key-please-configure',
      baseURL: 'https://api.anthropic.com',
    });
    console.warn('[Anthropic SDK Client] 使用后备客户端配置');
    return fallbackClient;
  }
}

/**
 * 测试 API 连接
 */
export async function testConnection(model: Model): Promise<boolean> {
  try {
    const client = createClient(model);
    
    console.log(`[Anthropic SDK Client] 测试连接: ${model.id}`);
    
    const result = await generateText({
      model: client(model.id),
      prompt: 'Hello',
      maxOutputTokens: 5,
    });

    return Boolean(result.text);
  } catch (error) {
    console.error('[Anthropic SDK Client] 连接测试失败:', error);
    return false;
  }
}

/**
 * 获取 Extended Thinking 配置
 */
export function getExtendedThinkingConfig(
  model: Model,
  budgetTokens: number = 10000,
  enabled: boolean = true
): Record<string, any> {
  if (!supportsExtendedThinking(model) || !enabled) {
    return {};
  }

  return {
    thinking: {
      type: 'enabled',
      budgetTokens: Math.max(1024, Math.min(budgetTokens, 128000))
    }
  };
}

/**
 * 获取 Interleaved Thinking Beta Header
 */
export function getInterleavedThinkingHeaders(): Record<string, string> {
  return {
    'anthropic-beta': 'interleaved-thinking-2025-05-14'
  };
}
