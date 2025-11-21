/**
 * Metaso AI Search MCP Server
 * 提供秘塔AI搜索功能，支持全网搜索和学术搜索
 * 使用秘塔AI官方开放平台API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { universalFetch } from '../../../utils/universalFetch';

// 工具定义
const METASO_SEARCH_TOOL: Tool = {
  name: 'metaso_search',
  description: '使用秘塔AI进行全网搜索，返回相关网页结果',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词或问题'
      },
      size: {
        type: 'number',
        description: '返回结果数量，默认10',
        default: 10
      },
      includeSummary: {
        type: 'boolean',
        description: '是否包含摘要',
        default: true
      }
    },
    required: ['query']
  }
};

const METASO_READER_TOOL: Tool = {
  name: 'metaso_reader',
  description: '使用秘塔AI阅读器提取网页内容，返回纯文本格式',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: '要提取内容的网页URL'
      }
    },
    required: ['url']
  }
};

/**
 * Metaso Search Server 类
 */
export class MetasoSearchServer {
  public server: Server;
  private apiKey: string;
  private searchEndpoint: string;
  private readerEndpoint: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
    this.searchEndpoint = 'https://metaso.cn/api/v1/search';
    this.readerEndpoint = 'https://metaso.cn/api/v1/reader';

    this.server = new Server(
      {
        name: '@aether/metaso-search',
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

  /**
   * 设置 API Key
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  private setupHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [METASO_SEARCH_TOOL, METASO_READER_TOOL]
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'metaso_search') {
        return this.search(args as { query: string; size?: number; includeSummary?: boolean });
      } else if (name === 'metaso_reader') {
        return this.reader(args as { url: string });
      }

      throw new Error(`未知的工具: ${name}`);
    });
  }

  /**
   * 执行搜索
   */
  private async search(
    params: { query: string; size?: number; includeSummary?: boolean }
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      // 检查 API Key
      if (!this.apiKey) {
        throw new Error(
          '未配置秘塔AI搜索API Key。请访问秘塔AI开放平台 (https://metaso.cn/open-app) 申请 API Key'
        );
      }

      // 构建请求体
      const requestBody = {
        q: params.query,
        scope: 'webpage',
        includeSummary: params.includeSummary !== false,
        size: String(params.size || 10),
        includeRawContent: false,
        conciseSnippet: false
      };

      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };

      // 发送请求
      const response = await universalFetch(this.searchEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`秘塔AI搜索请求失败 (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // 格式化搜索结果
      const webpages = data.webpages || [];
      const total = data.total || 0;
      let resultText = `## 秘塔AI搜索结果\n\n**查询**: ${params.query}\n**返回结果数**: ${webpages.length}\n**总匹配数**: ${total}\n**消耗积分**: ${data.credits || 0}\n\n---\n\n`;

      if (webpages && webpages.length > 0) {
        webpages.forEach((item: any, index: number) => {
          resultText += `### ${index + 1}. ${item.title || '无标题'}\n\n`;
          if (item.link) {
            resultText += `🔗 **链接**: ${item.link}\n\n`;
          }
          if (item.snippet) {
            resultText += `📝 **摘要**: ${item.snippet}\n\n`;
          }
          if (item.score) {
            resultText += `⭐ **相关度**: ${item.score}\n\n`;
          }
          if (item.date) {
            resultText += `📅 **日期**: ${item.date}\n\n`;
          }
          if (item.authors && item.authors.length > 0) {
            resultText += `� **作者**: ${item.authors.join(', ')}\n\n`;
          }
          resultText += `---\n\n`;
        });
      } else {
        resultText += '未找到相关结果\n\n';
      }

      resultText += `*数据来源: 秘塔AI搜索 (metaso.cn)*`;

      return {
        content: [
          {
            type: 'text',
            text: resultText
          }
        ]
      };
    } catch (error) {
      console.error('[Metaso Search] 搜索失败:', error);
      return {
        content: [
          {
            type: 'text',
            text: `秘塔AI搜索失败: ${error instanceof Error ? error.message : '未知错误'}\n\n配置提示：\n1. 访问秘塔AI开放平台：https://metaso.cn/open-app\n2. 登录并申请 API Key\n3. 在 MCP 服务器环境变量中配置：\n   {\n     "METASO_API_KEY": "你的API Key"\n   }\n\n注意：秘塔AI官方API需要申请开通，如需测试可以先使用其他AI搜索服务。`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 执行网页阅读
   */
  private async reader(
    params: { url: string }
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      // 检查 API Key
      if (!this.apiKey) {
        throw new Error(
          '未配置秘塔AI搜索API Key。请访问秘塔AI开放平台 (https://metaso.cn/open-app) 申请 API Key'
        );
      }

      // 构建请求体
      const requestBody = {
        url: params.url
      };

      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'Authorization': `Bearer ${this.apiKey}`
      };

      // 发送请求
      const response = await universalFetch(this.readerEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`秘塔AI阅读器请求失败 (${response.status}): ${errorText}`);
      }

      const content = await response.text();

      // 格式化返回结果
      const resultText = `## 秘塔AI阅读器结果

**源URL**: ${params.url}

---

${content}

---

*数据来源: 秘塔AI阅读器 (metaso.cn)*`;

      return {
        content: [
          {
            type: 'text',
            text: resultText
          }
        ]
      };
    } catch (error) {
      console.error('[Metaso Reader] 阅读失败:', error);
      return {
        content: [
          {
            type: 'text',
            text: `秘塔AI阅读器失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        ],
        isError: true
      };
    }
  }
}
