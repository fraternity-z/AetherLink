/**
 * Fetch MCP Server
 * 提供网页内容抓取功能，支持 HTML 和 JSON 格式
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { universalFetch } from '../../../utils/universalFetch';

// 工具定义
const FETCH_URL_AS_HTML_TOOL: Tool = {
  name: 'fetch_url_as_html',
  description: '获取指定 URL 的网页内容，返回 HTML 格式',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: '要获取的 URL 地址'
      },
      headers: {
        type: 'object',
        description: '可选的 HTTP 请求头',
        additionalProperties: {
          type: 'string'
        }
      }
    },
    required: ['url']
  }
};

const FETCH_URL_AS_JSON_TOOL: Tool = {
  name: 'fetch_url_as_json',
  description: '获取指定 URL 的内容，解析为 JSON 格式返回',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: '要获取的 URL 地址'
      },
      headers: {
        type: 'object',
        description: '可选的 HTTP 请求头',
        additionalProperties: {
          type: 'string'
        }
      }
    },
    required: ['url']
  }
};

const FETCH_URL_AS_TEXT_TOOL: Tool = {
  name: 'fetch_url_as_text',
  description: '获取指定 URL 的内容，返回纯文本格式',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: '要获取的 URL 地址'
      },
      headers: {
        type: 'object',
        description: '可选的 HTTP 请求头',
        additionalProperties: {
          type: 'string'
        }
      }
    },
    required: ['url']
  }
};

/**
 * Fetch Server 类
 */
export class FetchServer {
  public server: Server;

  constructor() {
    this.server = new Server(
      {
        name: '@aether/fetch',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [FETCH_URL_AS_HTML_TOOL, FETCH_URL_AS_JSON_TOOL, FETCH_URL_AS_TEXT_TOOL]
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'fetch_url_as_html') {
        return this.fetchAsHtml(args as { url: string; headers?: Record<string, string> });
      } else if (name === 'fetch_url_as_json') {
        return this.fetchAsJson(args as { url: string; headers?: Record<string, string> });
      } else if (name === 'fetch_url_as_text') {
        return this.fetchAsText(args as { url: string; headers?: Record<string, string> });
      }

      throw new Error(`未知的工具: ${name}`);
    });
  }

  /**
   * 通用的 fetch 方法
   */
  private async fetch(url: string, headers?: Record<string, string>): Promise<Response> {
    try {
      const response = await universalFetch(url, {
        method: 'GET',
        headers: headers || {}
      });

      if (!response.ok) {
        throw new Error(`HTTP 错误: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`获取 ${url} 失败: ${error.message}`);
      } else {
        throw new Error(`获取 ${url} 失败: 未知错误`);
      }
    }
  }

  /**
   * 获取 HTML 内容
   */
  private async fetchAsHtml(params: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const response = await this.fetch(params.url, params.headers);
      const html = await response.text();

      return {
        content: [
          {
            type: 'text',
            text: html
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : '未知错误'
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 获取 JSON 内容
   */
  private async fetchAsJson(params: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const response = await this.fetch(params.url, params.headers);
      const json = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(json, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `解析 JSON 失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 获取纯文本内容
   */
  private async fetchAsText(params: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const response = await this.fetch(params.url, params.headers);
      const text = await response.text();

      return {
        content: [
          {
            type: 'text',
            text: text
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : '未知错误'
          }
        ],
        isError: true
      };
    }
  }
}

