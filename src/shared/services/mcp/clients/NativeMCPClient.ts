/**
 * Native MCP Client for Mobile
 * 使用 Capacitor CorsBypass 插件的原生 MCP 支持
 */

import { CorsBypass } from 'capacitor-cors-bypass-enhanced';
import type { MCPTool } from '../../../types';

export interface NativeMCPClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  type?: 'sse' | 'streamableHttp';
}

export interface MCPCallToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError: boolean;
}

/**
 * 移动端 MCP 客户端
 * 使用 CorsBypass 插件的原生 StreamableHTTP 支持
 */
export class NativeMCPClient {
  private connectionId: string | null = null;
  private sessionId: string | null = null;
  private options: NativeMCPClientOptions;
  private messageListeners: Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map();
  private nextMessageId = 1;

  constructor(options: NativeMCPClientOptions) {
    this.options = options;
    console.log(`[Native MCP] 创建客户端: ${options.baseUrl}`);
  }

  /**
   * 初始化连接
   */
  async initialize(): Promise<void> {
    console.log(`[Native MCP] 初始化连接: ${this.options.baseUrl}`);

    try {
      // 设置消息监听器
      this.setupMessageListeners();

      // 使用 CorsBypass 的原生 MCP 客户端 API
      const client = await (CorsBypass as any).createMCPClient({
        url: this.options.baseUrl,
        transport: this.options.type === 'sse' ? 'sse' : 'streamablehttp',
        clientInfo: {
          name: 'AetherLink',
          version: '1.0.0'
        },
        capabilities: {},
        headers: this.options.headers
      });

      this.connectionId = client.connectionId;
      console.log(`[Native MCP] 连接成功, connectionId: ${this.connectionId}`);

      // 获取 session 信息
      try {
        const sessionInfo = await (CorsBypass as any).getMCPSessionInfo({
          connectionId: this.connectionId
        });
        this.sessionId = sessionInfo.sessionId;
        console.log(`[Native MCP] Session ID: ${this.sessionId}`);
      } catch (error) {
        console.warn('[Native MCP] 无法获取 session ID:', error);
      }

    } catch (error) {
      console.error('[Native MCP] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListeners(): void {
    // 监听 MCP 消息
    (CorsBypass as any).addListener('mcpMessage', (data: any) => {
      if (data.connectionId !== this.connectionId) return;

      console.log('[Native MCP] 收到消息:', data.message);

      const message = data.message;
      
      // 处理响应消息
      if (message.id !== undefined && message.id !== null) {
        const listener = this.messageListeners.get(message.id);
        if (listener) {
          if (message.error) {
            listener.reject(new Error(message.error.message || JSON.stringify(message.error)));
          } else {
            listener.resolve(message.result);
          }
          this.messageListeners.delete(message.id);
        }
      }
    });

    // 监听错误
    (CorsBypass as any).addListener('mcpError', (data: any) => {
      if (data.connectionId !== this.connectionId) return;
      console.error('[Native MCP] 错误:', data.error);
    });

    // 监听状态变化
    (CorsBypass as any).addListener('mcpStateChange', (data: any) => {
      if (data.connectionId !== this.connectionId) return;
      console.log('[Native MCP] 状态变化:', data.state);
    });
  }

  /**
   * 发送请求并等待响应
   */
  private async sendRequest(method: string, params: any = {}): Promise<any> {
    if (!this.connectionId) {
      throw new Error('客户端未初始化');
    }

    const messageId = this.nextMessageId++;

    const message = {
      jsonrpc: '2.0' as const,
      id: messageId,
      method,
      params
    };

    console.log(`[Native MCP] 发送请求:`, message);
    console.log(`[Native MCP] 使用 connectionId: ${this.connectionId}, sessionId: ${this.sessionId}`);

    // 创建等待响应的 Promise
    const responsePromise = new Promise((resolve, reject) => {
      this.messageListeners.set(messageId, { resolve, reject });

      // 设置超时
      setTimeout(() => {
        if (this.messageListeners.has(messageId)) {
          this.messageListeners.delete(messageId);
          reject(new Error('请求超时'));
        }
      }, this.options.timeout || 30000);
    });

    // 发送消息
    await (CorsBypass as any).sendMCPMessage({
      connectionId: this.connectionId,
      message,
      expectStream: true
    });

    return responsePromise;
  }

  /**
   * 列出工具
   */
  async listTools(): Promise<MCPTool[]> {
    console.log('[Native MCP] 列出工具');

    try {
      const result = await this.sendRequest('tools/list', {});
      
      const tools = (result.tools || []).map((tool: any) => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema || {}
      }));

      console.log(`[Native MCP] 找到 ${tools.length} 个工具`);
      return tools;

    } catch (error) {
      console.error('[Native MCP] 列出工具失败:', error);
      throw error;
    }
  }

  /**
   * 调用工具
   */
  async callTool(name: string, args: Record<string, any>): Promise<MCPCallToolResponse> {
    console.log(`[Native MCP] 调用工具: ${name}`, args);

    try {
      const result = await this.sendRequest('tools/call', {
        name,
        arguments: args
      });

      return {
        content: result.content || [],
        isError: Boolean(result.isError)
      };

    } catch (error) {
      console.error(`[Native MCP] 调用工具失败: ${name}`, error);
      return {
        content: [
          {
            type: 'text',
            text: `工具调用失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 列出提示词
   */
  async listPrompts(): Promise<any[]> {
    try {
      const result = await this.sendRequest('prompts/list', {});
      return result.prompts || [];
    } catch (error) {
      console.log('[Native MCP] 服务器不支持提示词功能');
      return [];
    }
  }

  /**
   * 列出资源
   */
  async listResources(): Promise<any[]> {
    try {
      const result = await this.sendRequest('resources/list', {});
      return result.resources || [];
    } catch (error) {
      console.log('[Native MCP] 服务器不支持资源功能');
      return [];
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    if (this.connectionId) {
      try {
        await (CorsBypass as any).closeMCPClient({ connectionId: this.connectionId });
        console.log('[Native MCP] 连接已关闭');
      } catch (error) {
        console.error('[Native MCP] 关闭连接失败:', error);
      }
      this.connectionId = null;
    }

    // 清理监听器
    this.messageListeners.clear();
  }
}
