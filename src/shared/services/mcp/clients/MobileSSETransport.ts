/**
 * 移动端 SSE Transport
 * 使用 CorsBypass 插件的 startSSE 方法实现 MCP 协议的 SSE 传输
 */

import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { CorsBypass } from 'capacitor-cors-bypass-enhanced';

export class MobileSSETransport implements Transport {
  private url: URL;
  private headers: Record<string, string>;
  private fetch: typeof globalThis.fetch;
  private connectionId: string | null = null;
  private messageEndpoint: string | null = null;  // 消息发送端点
  
  // Transport 接口要求的回调属性
  onmessage?: (message: JSONRPCMessage) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;

  constructor(url: URL, options: { headers?: Record<string, string>; fetch?: any }) {
    this.url = url;
    this.headers = options.headers || {};
    this.fetch = options.fetch || globalThis.fetch;
    console.log('[Mobile SSE Transport] 创建传输，URL:', url.toString());
    console.log('[Mobile SSE Transport] Headers:', JSON.stringify(this.headers));
  }

  async start(): Promise<void> {
    console.log('[Mobile SSE Transport] 开始连接 SSE');
    
    try {
      const result = await CorsBypass.startSSE({
        url: this.url.toString(),
        headers: this.headers,
        withCredentials: false,
        reconnectTimeout: 3000
      });

      this.connectionId = result.connectionId;
      console.log('[Mobile SSE Transport] SSE 连接建立，ID:', this.connectionId);

      // 监听 SSE 事件
      CorsBypass.addListener('sseOpen', (data: any) => {
        if (data.connectionId === this.connectionId) {
          console.log('[Mobile SSE Transport] SSE 连接打开');
        }
      });

      CorsBypass.addListener('sseMessage', (data: any) => {
        if (data.connectionId === this.connectionId) {
          console.log('[Mobile SSE Transport] 收到 SSE 消息:', data.data);
          
          // 第一条消息通常是消息端点路径，不是 JSON-RPC 消息
          if (!this.messageEndpoint && data.data.startsWith('/')) {
            // 构建完整的消息端点 URL
            const baseOrigin = this.url.origin;
            this.messageEndpoint = `${baseOrigin}${data.data}`;
            console.log('[Mobile SSE Transport] 设置消息端点:', this.messageEndpoint);
            return;
          }
          
          try {
            const message = JSON.parse(data.data) as JSONRPCMessage;
            console.log('[Mobile SSE Transport] 解析到 JSON-RPC 消息:', message);
            if (this.onmessage) {
              this.onmessage(message);
            }
          } catch (error) {
            console.error('[Mobile SSE Transport] 解析消息失败:', error);
            console.error('[Mobile SSE Transport] 原始数据:', data.data);
            if (this.onerror) {
              this.onerror(error as Error);
            }
          }
        }
      });

      CorsBypass.addListener('sseError', (data: any) => {
        if (data.connectionId === this.connectionId) {
          console.error('[Mobile SSE Transport] SSE 错误:', data.error);
          if (this.onerror) {
            this.onerror(new Error(data.error));
          }
        }
      });

      CorsBypass.addListener('sseClose', (data: any) => {
        if (data.connectionId === this.connectionId) {
          console.log('[Mobile SSE Transport] SSE 连接关闭');
          if (this.onclose) {
            this.onclose();
          }
        }
      });

    } catch (error) {
      console.error('[Mobile SSE Transport] 连接失败:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.connectionId) {
      console.log('[Mobile SSE Transport] 关闭 SSE 连接:', this.connectionId);
      await CorsBypass.stopSSE({ connectionId: this.connectionId });
      this.connectionId = null;
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    // SSE 是单向的（服务器到客户端），消息发送需要通过 HTTP POST
    console.log('[Mobile SSE Transport] 通过 HTTP POST 发送消息:', JSON.stringify(message));
    
    // 等待消息端点设置（通常在第一条 SSE 消息中返回）
    if (!this.messageEndpoint) {
      console.warn('[Mobile SSE Transport] 消息端点尚未设置，等待...');
      // 等待最多 5 秒
      for (let i = 0; i < 50; i++) {
        if (this.messageEndpoint) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!this.messageEndpoint) {
        throw new Error('消息端点未设置，无法发送消息');
      }
    }
    
    console.log('[Mobile SSE Transport] 发送到端点:', this.messageEndpoint);
    
    try {
      const response = await this.fetch(this.messageEndpoint, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[Mobile SSE Transport] 消息发送成功');
    } catch (error) {
      console.error('[Mobile SSE Transport] 发送消息失败:', error);
      throw error;
    }
  }

}
