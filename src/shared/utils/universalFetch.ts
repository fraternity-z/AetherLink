/**
 * 通用获取工具
 * 根据平台自动选择最适合的HTTP请求方式
 * - Web端：使用代理避免CORS问题
 * - 移动端：使用CorsBypass插件直接请求
 * - Tauri桌面端：使用Tauri HTTP插件绕过CORS
 */

import { Capacitor } from '@capacitor/core';
import { CorsBypass } from 'capacitor-cors-bypass-enhanced';
import { isTauri } from './platformDetection';

// 请求选项接口
export interface UniversalFetchOptions extends RequestInit {
  timeout?: number;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  useCorsPlugin?: boolean; // 是否使用 CORS 插件（仅移动端有效）
}

// 响应接口，兼容标准Response
export interface UniversalResponse extends Response {
  data?: any;
}

/**
 * 通用fetch函数
 * @param url 请求URL
 * @param options 请求选项
 * @returns Promise<Response>
 */
export async function universalFetch(url: string, options: UniversalFetchOptions = {}): Promise<UniversalResponse> {
  // 移动端默认启用 CORS 插件（因为标准 fetch 也有 CORS 限制）
  const defaultUseCorsPlugin = Capacitor.isNativePlatform();
  const { timeout = 30000, responseType = 'json', useCorsPlugin = defaultUseCorsPlugin, ...fetchOptions } = options;

  // Tauri 桌面端使用 Tauri HTTP 插件绕过CORS
  if (isTauri()) {
    console.log('[Universal Fetch] Tauri 桌面端使用 HTTP 插件:', url);
    try {
      return await tauriFetch(url, { ...fetchOptions, timeout });
    } catch (error) {
      console.error('[Universal Fetch] Tauri HTTP 请求失败:', error);
      throw error;
    }
  }

  // 移动端：根据配置决定是否使用 CorsBypass 插件
  // 插件现已支持流式响应！
  if (Capacitor.isNativePlatform()) {
    // 使用从 options 中提取的 useCorsPlugin 参数
    if (useCorsPlugin) {
      console.log('[Universal Fetch] 移动端使用 CorsBypass 插件（支持流式输出）:', url);
      
      try {
        // 检查是否是流式请求（通过 Content-Type 或 URL 判断）
        const isChatStreamRequest = url.includes('/chat/completions') ||
                                   url.includes('/v1/completions') ||
                                   (fetchOptions.body && typeof fetchOptions.body === 'string' &&
                                    fetchOptions.body.includes('"stream":true'));
        
        // MCP 请求不使用流式模式（使用普通 HTTP 请求即可）
        const isMcpRequest = url.includes('/mcp') || 
                            (fetchOptions.body && typeof fetchOptions.body === 'string' &&
                             fetchOptions.body.includes('"jsonrpc"'));
        
        if (isChatStreamRequest && !isMcpRequest) {
          // 使用流式 API
          return await corsPluginStreamFetch(url, fetchOptions, timeout);
        } else {
          // 使用普通请求
          // MCP 请求使用 text 响应类型，避免自动 JSON 解析
          const finalResponseType = isMcpRequest ? 'text' : validateResponseType(responseType);
          
          const requestOptions = {
            url,
            method: (fetchOptions.method || 'GET') as any,
            headers: extractHeaders(fetchOptions.headers),
            data: serializeRequestBody(fetchOptions.body),
            timeout,
            responseType: finalResponseType
          };
          
          if (isMcpRequest) {
            console.log('[Universal Fetch] MCP 请求详情:', JSON.stringify(requestOptions, null, 2));
          }
          
          const response = await CorsBypass.request(requestOptions);

          // 创建兼容的Response对象
          const compatibleResponse = createCompatibleResponse(response, url);
          return compatibleResponse;
        }
      } catch (error) {
        console.error('[Universal Fetch] CorsBypass 请求失败，回退到标准 fetch:', error);
        // 如果 CorsBypass 失败，回退到标准 fetch
        return standardFetch(url, { ...fetchOptions, timeout });
      }
    } else {
      // 默认使用标准 fetch，保持流式输出功能
      console.log('[Universal Fetch] 移动端使用标准 fetch（保持流式输出）:', url);
      return standardFetch(url, { ...fetchOptions, timeout });
    }
  }

  // Web端使用标准fetch（可能通过代理）
  const finalUrl = getPlatformUrl(url);
  console.log('[Universal Fetch] Web端请求:', url, '->', finalUrl);
  return standardFetch(finalUrl, { ...fetchOptions, timeout });
}

/**
 * 从各种格式的headers中提取普通对象
 */
function extractHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    const result: Record<string, string> = {};
    headers.forEach(([key, value]) => {
      result[key] = value;
    });
    return result;
  }

  return headers as Record<string, string>;
}

/**
 * 创建兼容标准Response的对象
 */
function createCompatibleResponse(corsBypassResponse: any, _originalUrl: string): UniversalResponse {
  const { data, status, statusText, headers } = corsBypassResponse;

  // 创建一个兼容的Response对象
  const response = new Response(typeof data === 'string' ? data : JSON.stringify(data), {
    status,
    statusText,
    headers: new Headers(headers)
  });

  // 添加额外的数据属性
  (response as UniversalResponse).data = data;

  return response as UniversalResponse;
}

/**
 * Tauri fetch 函数，使用 Tauri HTTP 插件绕过 CORS
 */
async function tauriFetch(url: string, options: RequestInit & { timeout?: number }): Promise<UniversalResponse> {
  try {
    // 动态导入 Tauri HTTP 插件
    const { fetch: tauriHttpFetch } = await import('@tauri-apps/plugin-http');
    
    // Tauri 的 fetch 函数与标准 fetch 兼容
    const response = await tauriHttpFetch(url, {
      method: options.method as any,
      headers: options.headers as any,
      body: options.body as any,
    });
    
    console.log('[Universal Fetch] Tauri HTTP 请求成功:', response.status, response.statusText);
    return response as UniversalResponse;
  } catch (error) {
    console.error('[Universal Fetch] Tauri HTTP 请求失败:', error);
    throw error;
  }
}

/**
 * 标准fetch函数，带超时控制
 */
async function standardFetch(url: string, options: RequestInit & { timeout?: number }): Promise<UniversalResponse> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  fetchOptions.signal = controller.signal;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return response as UniversalResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 检查是否需要使用代理
 */
export function needsCORSProxy(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const currentOrigin = window.location.origin;

    // 本地地址不需要代理
    const hostname = urlObj.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      console.log(`[Universal Fetch] 本地地址，不需要代理: ${url}`);
      return false;
    }

    // Tauri 桌面端：使用 HTTP 插件，不需要代理
    if (isTauri()) {
      console.log(`[Universal Fetch] Tauri 桌面端，不使用代理: ${url}`);
      return false;
    }

    // 移动端：直接请求，不使用代理（使用CorsBypass插件）
    if (Capacitor.isNativePlatform()) {
      console.log(`[Universal Fetch] 移动端，不使用代理: ${url}`);
      return false;
    }

    // Web端：跨域请求需要代理
    const needsProxy = urlObj.origin !== currentOrigin;
    console.log(`[Universal Fetch] Web端CORS检查: ${url} -> 当前域: ${currentOrigin} -> 需要代理: ${needsProxy}`);
    return needsProxy;
  } catch {
    console.log(`[Universal Fetch] URL解析失败，不使用代理: ${url}`);
    return false;
  }
}

/**
 * 获取适合当前平台的 URL
 */
export function getPlatformUrl(originalUrl: string): string {
  // 统一处理：根据是否跨域决定是否使用代理
  if (needsCORSProxy(originalUrl)) {
    // 使用通用 CORS 代理服务器
    return `http://localhost:8888/proxy?url=${encodeURIComponent(originalUrl)}`;
  } else {
    // 不需要代理：返回原始 URL
    return originalUrl;
  }
}

/**
 * 获取完整的代理URL（用于需要完整URL的场景，如SSE）
 */
export function getFullProxyUrl(originalUrl: string): string {
  // 统一处理：根据是否跨域决定是否使用代理
  if (needsCORSProxy(originalUrl)) {
    // 使用通用 CORS 代理服务器
    return `http://localhost:8888/proxy?url=${encodeURIComponent(originalUrl)}`;
  } else {
    // 不需要代理：返回原始 URL
    return originalUrl;
  }
}

/**
 * 日志记录函数
 */
export function logFetchUsage(originalUrl: string, finalUrl: string, method: string = 'GET') {
  console.log(`[Universal Fetch] ${method} ${originalUrl} -> ${finalUrl}`);
}

/**
 * 序列化请求体，确保兼容 CorsBypass 插件
 */
function serializeRequestBody(body?: BodyInit | null): string | undefined {
  if (!body) {
    return undefined;
  }

  // 如果已经是字符串，直接返回
  if (typeof body === 'string') {
    return body;
  }

  // 处理 FormData
  if (body instanceof FormData) {
    // FormData 需要转换为 JSON 对象或者回退到标准 fetch
    console.warn('[Universal Fetch] FormData detected, falling back to standard fetch for this request');
    throw new Error('FormData not supported by CorsBypass, will fallback to standard fetch');
  }

  // 处理 Blob
  if (body instanceof Blob) {
    console.warn('[Universal Fetch] Blob detected, falling back to standard fetch for this request');
    throw new Error('Blob not supported by CorsBypass, will fallback to standard fetch');
  }

  // 处理 ArrayBuffer - 使用Base64编码防止数据损坏
  if (body instanceof ArrayBuffer) {
    console.warn('[Universal Fetch] ArrayBuffer detected, using Base64 encoding');
    const uint8Array = new Uint8Array(body);
    return btoa(String.fromCharCode(...uint8Array));
  }

  // 处理 Uint8Array - 使用Base64编码防止数据损坏
  if (body instanceof Uint8Array) {
    console.warn('[Universal Fetch] Uint8Array detected, using Base64 encoding');
    return btoa(String.fromCharCode(...body));
  }

  // 处理 URLSearchParams
  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  // 其他情况尝试转换为字符串
  try {
    return String(body);
  } catch (error) {
    console.warn('[Universal Fetch] Failed to serialize body:', error);
    throw new Error('Unable to serialize request body for CorsBypass');
  }
}

/**
 * 验证响应类型（根据CorsBypass插件实际支持的类型）
 */
function validateResponseType(responseType: string): 'json' | 'text' {
  // CorsBypass 插件目前实际只支持 json 和 text
  // 如果请求了不支持的类型，记录警告并回退到合适的类型
  if (responseType !== 'json' && responseType !== 'text') {
    console.warn(`[Universal Fetch] 响应类型 '${responseType}' 暂不支持，回退到 'text'`);
    return 'text';
  }
  
  return responseType === 'json' ? 'json' : 'text';
}

/**
 * 使用 CorsBypass 插件的流式请求
 */
async function corsPluginStreamFetch(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<UniversalResponse> {
  console.log('[Universal Fetch] 使用 CorsBypass 流式 API:', url);

  // 创建一个 ReadableStream 来模拟标准的流式响应
  let streamId: string;
  let responseHeaders: Record<string, string> = {};
  let statusCode = 200;
  let statusText = 'OK';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {

      try {
        // 设置事件监听器
        const chunkListener = await CorsBypass.addListener('streamChunk', (event: any) => {
          if (event.streamId === streamId) {
            if (event.data) {
              // 将数据转换为 Uint8Array 并推送到流中
              const encoder = new TextEncoder();
              const chunk = encoder.encode(event.data);
              controller.enqueue(chunk);
            }

            if (event.done) {
              console.log('[Universal Fetch] 流式响应完成');
              controller.close();
              chunkListener.remove();
            }
          }
        });

        const statusListener = await CorsBypass.addListener('streamStatus', (event: any) => {
          if (event.streamId === streamId) {
            console.log('[Universal Fetch] 流状态变化:', event.status);
            
            if (event.status === 'error') {
              const error = new Error(event.error || 'Stream error');
              controller.error(error);
              statusListener.remove();
              chunkListener.remove();
            }
          }
        });

        // 发起流式请求
        const result = await CorsBypass.streamRequest({
          url,
          method: (options.method || 'POST') as any,
          headers: extractHeaders(options.headers),
          data: serializeRequestBody(options.body),
          timeout
        });

        streamId = result.streamId;
        console.log('[Universal Fetch] 流式请求已启动，streamId:', streamId);

      } catch (error) {
        console.error('[Universal Fetch] 流式请求启动失败:', error);
        controller.error(error);
      }
    },

    cancel() {
      // 取消流时，取消插件的流式请求
      if (streamId) {
        console.log('[Universal Fetch] 取消流式请求:', streamId);
        CorsBypass.cancelStream({ streamId }).catch((err: any) => {
          console.error('[Universal Fetch] 取消流失败:', err);
        });
      }
    }
  });

  // 创建兼容的 Response 对象
  const response = new Response(stream, {
    status: statusCode,
    statusText: statusText,
    headers: new Headers(responseHeaders)
  });

  return response as UniversalResponse;
}
