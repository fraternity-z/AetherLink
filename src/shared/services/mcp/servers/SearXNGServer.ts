/**
 * SearXNG MCP Server
 * 基于自部署的 SearXNG 元搜索引擎，提供搜索和网页内容抓取功能
 * 
 * 功能：
 * - searxng_search: 聚合搜索（Google、Bing、DuckDuckGo 等 70+ 引擎）
 * - searxng_read_url: 抓取任意网页内容并提取正文
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { universalFetch } from '../../../utils/universalFetch';

// ==================== 工具定义 ====================

const SEARXNG_SEARCH_TOOL: Tool = {
  name: 'searxng_search',
  description: `使用 SearXNG 元搜索引擎进行互联网搜索，聚合 245 个搜索引擎的结果。

支持 32 个搜索类别，按场景选择最佳类别：
- general: 通用搜索（Google/Bing/DuckDuckGo/Baidu/Sogou/Yahoo 等 48 引擎）
- news: 新闻搜索（Google News/Bing News/Reuters/搜狗微信 等 17 引擎）
- science: 学术论文（arXiv/PubMed/Google Scholar/Semantic Scholar 等）
- it: 技术编程（GitHub/StackOverflow/npm/PyPI/Docker Hub/HuggingFace/MDN 等 44 引擎）
- videos: 视频搜索（YouTube/Bilibili/AcFun/iQiyi/Vimeo 等 28 引擎）
- images: 图片搜索（Google Images/Unsplash/Pixabay/Pexels 等 39 引擎）
- repos: 代码仓库（GitHub/GitLab/Codeberg/HuggingFace 等）
- packages: 软件包（npm/PyPI/crates.io/Docker Hub 等 15 引擎）
- social media: 社交媒体（Reddit/Mastodon/Lemmy）
- translate: 翻译
- weather: 天气查询
- map: 地图（OpenStreetMap）
- music: 音乐（SoundCloud/Bandcamp/YouTube 等）
- books: 图书（Anna's Archive/OpenLibrary）
- movies: 电影（IMDB/TMDB/RottenTomatoes）
- q&a: 问答（StackOverflow/AskUbuntu 等）
- dictionaries: 词典（Wiktionary/etymonline 等）
- currency: 汇率换算
- files: 文件/种子搜索`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词或问题。建议简洁明确，避免过长的查询'
      },
      engines: {
        type: 'string',
        description: '指定搜索引擎（逗号分隔）。常用引擎: google, bing, duckduckgo, baidu, sogou, wikipedia, github, arxiv, youtube, bilibili, stackoverflow, npm, pypi。留空使用该类别的全部引擎',
      },
      language: {
        type: 'string',
        description: '搜索语言代码。常用: zh-CN(中文), en(英文), ja(日语), ko(韩语), fr(法语), de(德语)。默认 zh-CN',
        default: 'zh-CN'
      },
      categories: {
        type: 'string',
        description: '搜索类别（逗号分隔），根据用户意图选择最合适的类别。详见工具描述中的完整类别列表。默认 general',
        default: 'general'
      },
      maxResults: {
        type: 'number',
        description: '返回结果数量上限，默认 10，建议 5-20',
        default: 10
      },
      timeRange: {
        type: 'string',
        enum: ['day', 'week', 'month', 'year', ''],
        description: '时间范围过滤：day=近24小时, week=近一周, month=近一月, year=近一年。查询实时信息时建议设置此参数',
      }
    },
    required: ['query']
  }
};

const SEARXNG_READ_URL_TOOL: Tool = {
  name: 'searxng_read_url',
  description: '抓取指定 URL 的网页内容，自动提取正文并返回清洁的文本格式。适用于：阅读搜索结果中的文章详情、获取网页完整内容、提取 API 返回的 JSON 数据。支持 HTML/JSON/纯文本格式自动识别',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: '要抓取的网页 URL'
      },
      maxLength: {
        type: 'number',
        description: '返回内容的最大字符数，默认 5000',
        default: 5000
      }
    },
    required: ['url']
  }
};

// ==================== 服务器实现 ====================

/**
 * SearXNG MCP Server 类
 */
export class SearXNGServer {
  public server: Server;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || 'http://154.37.208.52:39281';

    this.server = new Server(
      {
        name: '@aether/searxng',
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
   * 设置 SearXNG 服务器地址
   */
  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  private setupHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [SEARXNG_SEARCH_TOOL, SEARXNG_READ_URL_TOOL]
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'searxng_search') {
        return this.search(args as {
          query: string;
          engines?: string;
          language?: string;
          categories?: string;
          maxResults?: number;
          timeRange?: string;
        });
      } else if (name === 'searxng_read_url') {
        return this.readUrl(args as {
          url: string;
          maxLength?: number;
        });
      }

      throw new Error(`未知的工具: ${name}`);
    });
  }

  // ==================== 搜索功能 ====================

  /**
   * 执行 SearXNG 搜索
   */
  private async search(
    params: {
      query: string;
      engines?: string;
      language?: string;
      categories?: string;
      maxResults?: number;
      timeRange?: string;
    }
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const {
        query,
        engines,
        language = 'zh-CN',
        categories = 'general',
        maxResults = 10,
        timeRange
      } = params;

      // 构建搜索 URL 参数
      const searchParams = new URLSearchParams({
        q: query,
        format: 'json',
        language: language,
        categories: categories,
      });

      if (engines) {
        searchParams.set('engines', engines);
      }

      if (timeRange) {
        searchParams.set('time_range', timeRange);
      }

      const searchUrl = `${this.baseUrl}/search?${searchParams.toString()}`;

      console.log('[SearXNG] 开始搜索:', { query, engines, language, categories, timeRange });

      // 发送搜索请求
      const response = await universalFetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SearXNG 搜索请求失败 (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // 提取搜索结果
      const results = (data.results || []).slice(0, maxResults);
      const totalResults = data.number_of_results || results.length;

      console.log(`[SearXNG] 搜索完成，找到 ${results.length} 个结果`);

      // 格式化输出
      let resultText = `## SearXNG 搜索结果\n\n`;
      resultText += `**查询**: ${query}\n`;
      resultText += `**结果数**: ${results.length} / ${totalResults}\n`;
      if (engines) resultText += `**引擎**: ${engines}\n`;
      if (timeRange) resultText += `**时间范围**: ${timeRange}\n`;
      resultText += `\n---\n\n`;

      if (results.length > 0) {
        results.forEach((item: any, index: number) => {
          resultText += `### ${index + 1}. ${item.title || '无标题'}\n\n`;

          if (item.url) {
            resultText += `**链接**: ${item.url}\n\n`;
          }

          if (item.content) {
            resultText += `**摘要**: ${item.content}\n\n`;
          }

          if (item.engine) {
            resultText += `**来源引擎**: ${item.engine}\n`;
          }

          if (item.score) {
            resultText += `**相关度**: ${(item.score * 100).toFixed(1)}%\n`;
          }

          if (item.publishedDate) {
            resultText += `**发布时间**: ${item.publishedDate}\n`;
          }

          resultText += `\n---\n\n`;
        });
      } else {
        resultText += '未找到相关结果\n\n';
      }

      resultText += `*数据来源: SearXNG 元搜索引擎*`;

      return {
        content: [
          {
            type: 'text',
            text: resultText
          }
        ]
      };
    } catch (error) {
      console.error('[SearXNG] 搜索失败:', error);
      return {
        content: [
          {
            type: 'text',
            text: `SearXNG 搜索失败: ${error instanceof Error ? error.message : '未知错误'}\n\n请检查 SearXNG 服务是否正常运行。`
          }
        ],
        isError: true
      };
    }
  }

  // ==================== 网页抓取功能 ====================

  /**
   * 抓取网页内容并提取正文
   */
  private async readUrl(
    params: {
      url: string;
      maxLength?: number;
    }
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const { url, maxLength = 5000 } = params;

      console.log('[SearXNG] 开始抓取网页:', url);

      // 直接抓取网页内容
      const response = await universalFetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; AetherLink/1.0; +https://aetherlink.app)',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP 请求失败 (${response.status}): ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();

      let extractedContent: string;
      let title = '';

      if (contentType.includes('application/json')) {
        // JSON 内容直接格式化返回
        try {
          const json = JSON.parse(rawText);
          extractedContent = JSON.stringify(json, null, 2);
        } catch {
          extractedContent = rawText;
        }
      } else if (contentType.includes('text/html')) {
        // HTML 内容提取正文
        const extracted = this.extractContent(rawText);
        title = extracted.title;
        extractedContent = extracted.content;
      } else {
        // 其他文本内容直接返回
        extractedContent = rawText;
      }

      // 截断超长内容
      if (extractedContent.length > maxLength) {
        extractedContent = extractedContent.substring(0, maxLength) + '\n\n...(内容已截断)';
      }

      // 格式化输出
      let resultText = `## 网页内容\n\n`;
      resultText += `**URL**: ${url}\n`;
      if (title) resultText += `**标题**: ${title}\n`;
      resultText += `**内容长度**: ${extractedContent.length} 字符\n`;
      resultText += `\n---\n\n`;
      resultText += extractedContent;

      console.log(`[SearXNG] 网页抓取完成，提取 ${extractedContent.length} 字符`);

      return {
        content: [
          {
            type: 'text',
            text: resultText
          }
        ]
      };
    } catch (error) {
      console.error('[SearXNG] 网页抓取失败:', error);
      return {
        content: [
          {
            type: 'text',
            text: `网页抓取失败: ${error instanceof Error ? error.message : '未知错误'}\n\nURL: ${params.url}`
          }
        ],
        isError: true
      };
    }
  }

  // ==================== HTML 内容提取 ====================

  /**
   * 从 HTML 中提取正文内容
   * 轻量级实现，不依赖 node-html-parser
   */
  private extractContent(html: string): { title: string; content: string } {
    // 提取 title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? this.decodeHtmlEntities(titleMatch[1].trim()) : '';

    // 移除不需要的标签
    let content = html;

    // 移除 script, style, nav, header, footer, aside, iframe, noscript
    content = content.replace(/<(script|style|nav|header|footer|aside|iframe|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, '');

    // 移除 HTML 注释
    content = content.replace(/<!--[\s\S]*?-->/g, '');

    // 移除所有 HTML 标签，保留文本
    content = content.replace(/<[^>]+>/g, '\n');

    // 解码 HTML 实体
    content = this.decodeHtmlEntities(content);

    // 清理空白
    content = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      // 过滤掉太短的行（通常是菜单项、按钮文本等）
      .filter(line => line.length > 10 || /[。！？.!?]$/.test(line))
      .join('\n');

    // 合并多个连续空行
    content = content.replace(/\n{3,}/g, '\n\n');

    return { title, content: content.trim() };
  }

  /**
   * 解码 HTML 实体
   */
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
}
