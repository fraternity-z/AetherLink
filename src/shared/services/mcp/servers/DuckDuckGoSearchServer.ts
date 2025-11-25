/**
 * DuckDuckGo Search MCP Server
 * 提供 DuckDuckGo 网络搜索功能，无需 API Key
 * 使用 DuckDuckGo HTML API 实现
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { universalFetch } from '../../../utils/universalFetch';

// 安全搜索类型
export enum SafeSearchType {
  STRICT = 1,
  MODERATE = -1,
  OFF = -2
}

// 搜索时间范围
export enum SearchTimeRange {
  ALL = '',      // 所有时间
  DAY = 'd',     // 过去一天
  WEEK = 'w',    // 过去一周
  MONTH = 'm',   // 过去一个月
  YEAR = 'y'     // 过去一年
}

// 工具定义
const DUCKDUCKGO_SEARCH_TOOL: Tool = {
  name: 'duckduckgo_search',
  description: '使用 DuckDuckGo 进行网络搜索，无需 API Key，保护隐私。返回相关网页结果',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词或问题'
      },
      maxResults: {
        type: 'number',
        description: '返回结果数量，默认10，最大30',
        default: 10
      },
      safeSearch: {
        type: 'string',
        enum: ['strict', 'moderate', 'off'],
        description: '安全搜索级别：strict=严格、moderate=适中(默认)、off=关闭',
        default: 'moderate'
      },
      timeRange: {
        type: 'string',
        enum: ['all', 'day', 'week', 'month', 'year'],
        description: '时间范围：all=所有时间(默认)、day=过去一天、week=过去一周、month=过去一个月、year=过去一年',
        default: 'all'
      },
      region: {
        type: 'string',
        description: '搜索区域代码，如 cn-zh (中国)、us-en (美国)、wt-wt (全球)',
        default: 'wt-wt'
      }
    },
    required: ['query']
  }
};

const DUCKDUCKGO_NEWS_TOOL: Tool = {
  name: 'duckduckgo_news',
  description: '使用 DuckDuckGo 搜索新闻，获取最新的新闻资讯',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词'
      },
      maxResults: {
        type: 'number',
        description: '返回结果数量，默认10，最大30',
        default: 10
      },
      timeRange: {
        type: 'string',
        enum: ['all', 'day', 'week', 'month'],
        description: '时间范围：all=所有时间、day=过去一天(默认)、week=过去一周、month=过去一个月',
        default: 'day'
      },
      region: {
        type: 'string',
        description: '搜索区域代码',
        default: 'wt-wt'
      }
    },
    required: ['query']
  }
};

// 搜索结果接口
interface SearchResult {
  title: string;
  url: string;
  description: string;
}


/**
 * DuckDuckGo Search Server 类
 */
export class DuckDuckGoSearchServer {
  public server: Server;
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://html.duckduckgo.com/html/';

    this.server = new Server(
      {
        name: '@aether/duckduckgo-search',
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
        tools: [DUCKDUCKGO_SEARCH_TOOL, DUCKDUCKGO_NEWS_TOOL]
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'duckduckgo_search') {
        return this.search(args as {
          query: string;
          maxResults?: number;
          safeSearch?: string;
          timeRange?: string;
          region?: string;
        });
      } else if (name === 'duckduckgo_news') {
        return this.searchNews(args as {
          query: string;
          maxResults?: number;
          timeRange?: string;
          region?: string;
        });
      }

      throw new Error(`未知的工具: ${name}`);
    });
  }

  /**
   * 获取安全搜索参数值
   */
  private getSafeSearchValue(safeSearch?: string): number {
    switch (safeSearch) {
      case 'strict':
        return SafeSearchType.STRICT;
      case 'off':
        return SafeSearchType.OFF;
      case 'moderate':
      default:
        return SafeSearchType.MODERATE;
    }
  }

  /**
   * 获取时间范围参数值
   */
  private getTimeRangeValue(timeRange?: string): string {
    switch (timeRange) {
      case 'day':
        return SearchTimeRange.DAY;
      case 'week':
        return SearchTimeRange.WEEK;
      case 'month':
        return SearchTimeRange.MONTH;
      case 'year':
        return SearchTimeRange.YEAR;
      case 'all':
      default:
        return SearchTimeRange.ALL;
    }
  }

  /**
   * 解析 HTML 响应中的搜索结果
   */
  private parseSearchResults(html: string, maxResults: number): SearchResult[] {
    const results: SearchResult[] = [];
    
    // 使用正则表达式匹配搜索结果
    // DuckDuckGo HTML 结果格式: <a class="result__a" href="...">title</a>
    // 和 <a class="result__snippet">description</a>
    
    // 匹配结果链接和标题
    const resultPattern = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
    const snippetPattern = /<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi;
    
    
    let match;
    const titles: { url: string; title: string }[] = [];
    const snippets: string[] = [];

    // 提取标题和URL
    while ((match = resultPattern.exec(html)) !== null && titles.length < maxResults) {
      let url = match[1];
      const title = this.decodeHtmlEntities(match[2].trim());
      
      // 解码 DuckDuckGo 的重定向 URL
      if (url.includes('uddg=')) {
        const uddgMatch = url.match(/uddg=([^&]*)/);
        if (uddgMatch) {
          url = decodeURIComponent(uddgMatch[1]);
        }
      }
      
      if (title && url && !url.includes('duckduckgo.com')) {
        titles.push({ url, title });
      }
    }

    // 提取描述
    while ((match = snippetPattern.exec(html)) !== null && snippets.length < maxResults) {
      const snippet = this.decodeHtmlEntities(match[1].replace(/<[^>]*>/g, '').trim());
      if (snippet) {
        snippets.push(snippet);
      }
    }

    // 组合结果
    for (let i = 0; i < Math.min(titles.length, maxResults); i++) {
      results.push({
        title: titles[i].title,
        url: titles[i].url,
        description: snippets[i] || ''
      });
    }

    return results;
  }

  /**
   * 解码 HTML 实体
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#39;': "'",
      '&nbsp;': ' ',
      '&#x2F;': '/',
      '&apos;': "'"
    };
    
    let result = text;
    for (const [entity, char] of Object.entries(entities)) {
      result = result.replace(new RegExp(entity, 'g'), char);
    }
    
    // 处理数字实体
    result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
    
    return result;
  }

  /**
   * 执行网页搜索
   */
  private async search(
    params: {
      query: string;
      maxResults?: number;
      safeSearch?: string;
      timeRange?: string;
      region?: string;
    }
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const maxResults = Math.min(params.maxResults || 10, 30);
      const safeSearch = this.getSafeSearchValue(params.safeSearch);
      const timeRange = this.getTimeRangeValue(params.timeRange);
      const region = params.region || 'wt-wt';

      // 构建请求参数
      const formData = new URLSearchParams();
      formData.append('q', params.query);
      formData.append('kl', region);
      formData.append('kp', String(safeSearch));
      if (timeRange) {
        formData.append('df', timeRange);
      }

      console.log('[DuckDuckGo Search] 搜索参数:', {
        query: params.query,
        maxResults,
        safeSearch: params.safeSearch,
        timeRange: params.timeRange,
        region
      });

      // 发送请求
      const response = await universalFetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo 搜索请求失败 (${response.status})`);
      }

      const html = await response.text();
      const results = this.parseSearchResults(html, maxResults);

      // 格式化搜索结果
      let resultText = `## DuckDuckGo 搜索结果\n\n`;
      resultText += `**查询**: ${params.query}\n`;
      resultText += `**返回结果数**: ${results.length}\n`;
      resultText += `**区域**: ${region}\n`;
      resultText += `**安全搜索**: ${params.safeSearch || 'moderate'}\n`;
      if (params.timeRange && params.timeRange !== 'all') {
        resultText += `**时间范围**: ${params.timeRange}\n`;
      }
      resultText += `\n---\n\n`;

      if (results.length > 0) {
        results.forEach((item, index) => {
          resultText += `### ${index + 1}. ${item.title}\n\n`;
          resultText += `🔗 **链接**: ${item.url}\n\n`;
          if (item.description) {
            resultText += `📝 **摘要**: ${item.description}\n\n`;
          }
          resultText += `---\n\n`;
        });
      } else {
        resultText += '未找到相关结果\n\n';
      }

      resultText += `*数据来源: DuckDuckGo (duckduckgo.com) - 隐私保护搜索引擎*`;

      return {
        content: [
          {
            type: 'text',
            text: resultText
          }
        ]
      };
    } catch (error) {
      console.error('[DuckDuckGo Search] 搜索失败:', error);
      return {
        content: [
          {
            type: 'text',
            text: `DuckDuckGo 搜索失败: ${error instanceof Error ? error.message : '未知错误'}\n\n提示：DuckDuckGo 搜索不需要 API Key，但可能受到网络环境限制。`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 执行新闻搜索
   */
  private async searchNews(
    params: {
      query: string;
      maxResults?: number;
      timeRange?: string;
      region?: string;
    }
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const maxResults = Math.min(params.maxResults || 10, 30);
      const timeRange = this.getTimeRangeValue(params.timeRange || 'day');
      const region = params.region || 'wt-wt';

      // 新闻搜索使用特殊的查询参数
      const formData = new URLSearchParams();
      formData.append('q', params.query);
      formData.append('kl', region);
      formData.append('iar', 'news'); // 新闻类型
      if (timeRange) {
        formData.append('df', timeRange);
      }

      console.log('[DuckDuckGo News] 搜索参数:', {
        query: params.query,
        maxResults,
        timeRange: params.timeRange,
        region
      });

      // 发送请求
      const response = await universalFetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo 新闻搜索请求失败 (${response.status})`);
      }

      const html = await response.text();
      const results = this.parseSearchResults(html, maxResults);

      // 格式化新闻结果
      let resultText = `## DuckDuckGo 新闻搜索结果\n\n`;
      resultText += `**查询**: ${params.query}\n`;
      resultText += `**返回结果数**: ${results.length}\n`;
      resultText += `**时间范围**: ${params.timeRange || 'day'}\n`;
      resultText += `\n---\n\n`;

      if (results.length > 0) {
        results.forEach((item, index) => {
          resultText += `### ${index + 1}. ${item.title}\n\n`;
          resultText += `🔗 **链接**: ${item.url}\n\n`;
          if (item.description) {
            resultText += `📝 **摘要**: ${item.description}\n\n`;
          }
          resultText += `---\n\n`;
        });
      } else {
        resultText += '未找到相关新闻\n\n';
      }

      resultText += `*数据来源: DuckDuckGo News (duckduckgo.com) - 隐私保护搜索引擎*`;

      return {
        content: [
          {
            type: 'text',
            text: resultText
          }
        ]
      };
    } catch (error) {
      console.error('[DuckDuckGo News] 搜索失败:', error);
      return {
        content: [
          {
            type: 'text',
            text: `DuckDuckGo 新闻搜索失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        ],
        isError: true
      };
    }
  }
}
