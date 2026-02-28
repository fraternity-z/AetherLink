/**
 * PDF 预处理 Provider 基类
 * 
 * 浏览器兼容版本（对应 CS 的 BasePreprocessProvider）：
 * - 使用 fetch 代替 electron.net
 * - 使用 ArrayBuffer 代替 Node.js Buffer
 * - 不依赖 fs，所有数据在内存中处理
 */

import type {
  PreprocessProviderConfig,
  PreprocessResult,
  PreprocessProgressCallback,
} from './types';
import { universalFetch } from '../../../utils/universalFetch';

export default abstract class BasePreprocessProvider {
  protected config: PreprocessProviderConfig;
  protected onProgress?: PreprocessProgressCallback;

  constructor(config: PreprocessProviderConfig) {
    if (!config) {
      throw new Error('Preprocess provider config is required');
    }
    this.config = config;
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback: PreprocessProgressCallback): void {
    this.onProgress = callback;
  }

  /**
   * 解析 PDF 文件（子类实现）
   * @param fileData PDF 文件的 ArrayBuffer
   * @param fileName 文件名
   * @returns 解析后的 Markdown 内容
   */
  abstract parseFile(
    fileData: ArrayBuffer,
    fileName: string
  ): Promise<PreprocessResult>;

  /**
   * 发送进度更新
   */
  protected sendProgress(progress: number, message?: string): void {
    this.onProgress?.(progress, message);
  }

  /**
   * 延迟执行
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取 PDF 页数（使用 pdf-lib 或简单估算）
   */
  protected async getPdfPageCount(data: ArrayBuffer): Promise<number> {
    try {
      // 简单方式：搜索 /Type /Page 标记来估算页数
      const bytes = new Uint8Array(data);
      const text = new TextDecoder('latin1').decode(bytes);
      const matches = text.match(/\/Type\s*\/Page[^s]/g);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * 验证文件大小和页数
   */
  protected async validateFile(
    data: ArrayBuffer,
    maxSize: number,
    maxPages: number
  ): Promise<void> {
    if (data.byteLength > maxSize) {
      const sizeMB = Math.round(data.byteLength / (1024 * 1024));
      const limitMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`PDF 文件大小 (${sizeMB}MB) 超过限制 (${limitMB}MB)`);
    }

    const pageCount = await this.getPdfPageCount(data);
    if (pageCount > 0 && pageCount > maxPages) {
      throw new Error(`PDF 页数 (${pageCount}) 超过限制 (${maxPages})`);
    }
  }

  /**
   * ArrayBuffer 转 Base64
   */
  protected arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 通用 fetch 封装，带错误处理
   */
  protected async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await universalFetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg += ` - ${JSON.stringify(errorData)}`;
      } catch {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }

    return response;
  }
}
