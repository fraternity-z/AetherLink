/**
 * 网络搜索 AI Tool 定义
 * 
 * 这个工具让 AI 能够自主决定是否需要进行网络搜索
 * 与 MCP 工具使用相同的机制
 */

import type { WebSearchResult } from '../../types';
import EnhancedWebSearchService from './EnhancedWebSearchService';

/**
 * 网络搜索工具输入参数
 */
export interface WebSearchToolInput {
  /** 搜索查询关键词 */
  query?: string;
  /** 额外的搜索上下文，用于优化搜索结果 */
  additionalContext?: string;
}

/**
 * 网络搜索工具输出结果
 */
export interface WebSearchToolOutput {
  /** 搜索查询 */
  query: string;
  /** 搜索结果列表 */
  results: WebSearchResult[];
  /** 搜索是否成功 */
  success: boolean;
  /** 错误信息（如果有） */
  error?: string;
}

/**
 * 预提取的搜索关键词
 */
export interface ExtractedSearchKeywords {
  /** 搜索问题列表 */
  question: string[];
  /** 相关链接（可选） */
  links?: string[];
}

/**
 * 网络搜索工具定义
 * 用于注入到 AI 请求的 tools 参数中
 */
export interface WebSearchToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: {
        query: {
          type: 'string';
          description: string;
        };
        additionalContext: {
          type: 'string';
          description: string;
        };
      };
      required: string[];
    };
  };
}

/**
 * 创建网络搜索工具定义
 * 这个定义会被注入到 AI 请求中，让 AI 知道可以调用这个工具
 */
export function createWebSearchToolDefinition(
  extractedKeywords?: ExtractedSearchKeywords
): WebSearchToolDefinition {
  const preparedQueries = extractedKeywords?.question?.length 
    ? extractedKeywords.question.map(q => `"${q}"`).join(', ')
    : '无预设查询';
  
  const linksInfo = extractedKeywords?.links?.length
    ? `\n- 相关链接: ${extractedKeywords.links.join(', ')}`
    : '';

  return {
    type: 'function',
    function: {
      name: 'builtin_web_search',
      description: `网络搜索工具，用于查找当前信息、新闻和实时数据。

该工具已根据对话上下文配置了搜索参数：
- 预设查询: ${preparedQueries}${linksInfo}

你可以直接使用预设查询进行搜索，或者提供 additionalContext 来优化或替换搜索词。

使用场景：
- 用户询问实时信息（天气、新闻、股票等）
- 用户询问你不确定的事实
- 用户明确要求搜索网络
- 需要最新数据来回答问题`,
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询关键词。如果不提供，将使用预设查询。'
          },
          additionalContext: {
            type: 'string',
            description: '可选的额外上下文、关键词或特定焦点，用于增强搜索效果'
          }
        },
        required: []
      }
    }
  };
}

/**
 * 执行网络搜索
 * 当 AI 决定调用 builtin_web_search 工具时，这个函数会被调用
 * 
 * 🚀 复刻 Cherry Studio 的并行搜索功能：
 * - 支持多个搜索关键词并行执行
 * - 合并所有搜索结果
 */
export async function executeWebSearch(
  input: WebSearchToolInput,
  webSearchProviderId: string,
  extractedKeywords?: ExtractedSearchKeywords,
  _requestId?: string
): Promise<WebSearchToolOutput> {
  try {
    console.log('[WebSearchTool] 开始执行搜索:', {
      input,
      providerId: webSearchProviderId,
      extractedKeywords
    });

    // 获取搜索提供商
    const provider = EnhancedWebSearchService.getWebSearchProvider(webSearchProviderId);
    if (!provider) {
      throw new Error(`未找到搜索提供商: ${webSearchProviderId}`);
    }

    // 🚀 确定最终的搜索查询列表
    let searchQueries: string[] = [];
    
    // 优先使用 AI 提供的额外上下文
    if (input.additionalContext?.trim()) {
      searchQueries = [input.additionalContext.trim()];
    } else if (input.query?.trim()) {
      searchQueries = [input.query.trim()];
    } else if (extractedKeywords?.question?.length) {
      // 使用预提取的多个关键词
      searchQueries = extractedKeywords.question.filter(q => q && q !== 'not_needed');
    }

    // 如果没有查询，返回空结果
    if (searchQueries.length === 0) {
      console.log('[WebSearchTool] 无需搜索');
      return {
        query: '',
        results: [],
        success: true
      };
    }

    // 🚀 并行执行多个搜索查询（复刻 Cherry Studio 的 processWebsearch）
    console.log('[WebSearchTool] 并行执行搜索，查询数量:', searchQueries.length);
    
    const searchPromises = searchQueries.map(query => 
      EnhancedWebSearchService.search(provider, query)
        .then(response => ({ query, results: response.results, success: true }))
        .catch(error => {
          console.warn(`[WebSearchTool] 搜索失败 "${query}":`, error);
          return { query, results: [], success: false };
        })
    );

    const searchResults = await Promise.all(searchPromises);

    // 🚀 合并所有搜索结果并去重
    const allResults: WebSearchResult[] = [];
    const seenUrls = new Set<string>();
    
    for (const result of searchResults) {
      for (const item of result.results) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allResults.push(item);
        }
      }
    }

    const combinedQuery = searchQueries.join(' | ');
    
    console.log('[WebSearchTool] 搜索完成:', {
      queries: searchQueries,
      totalResults: allResults.length,
      successfulSearches: searchResults.filter(r => r.success).length
    });

    return {
      query: combinedQuery,
      results: allResults,
      success: true
    };
  } catch (error: any) {
    console.error('[WebSearchTool] 搜索失败:', error);
    return {
      query: input.query || '',
      results: [],
      success: false,
      error: error.message
    };
  }
}

/**
 * 格式化搜索结果为 AI 可理解的文本
 * 这个输出会被返回给 AI，让它基于搜索结果生成回答
 */
export function formatSearchResultsForAI(output: WebSearchToolOutput): string {
  if (!output.success) {
    return `搜索失败: ${output.error || '未知错误'}`;
  }

  if (output.results.length === 0) {
    return '没有找到相关的搜索结果。';
  }

  // 构建引用格式的搜索结果
  const citationData = output.results.map((result, index) => ({
    number: index + 1,
    title: result.title,
    content: result.snippet || result.content || '',
    url: result.url
  }));

  const referenceContent = JSON.stringify(citationData, null, 2);

  return `搜索查询: "${output.query}"
找到 ${output.results.length} 个相关结果。

请使用 [数字] 格式引用具体信息，例如 [1]、[2] 等。

搜索结果:
\`\`\`json
${referenceContent}
\`\`\`

请根据以上搜索结果回答用户的问题，并在回答中使用 [1]、[2] 等格式引用来源。`;
}

/**
 * 检查是否应该启用网络搜索工具
 */
export function shouldEnableWebSearchTool(webSearchProviderId?: string): boolean {
  if (!webSearchProviderId) {
    return false;
  }

  // 检查提供商是否可用
  return EnhancedWebSearchService.isWebSearchEnabled(webSearchProviderId);
}

/**
 * 创建完整的网络搜索工具配置
 * 包含工具定义和执行函数
 */
export function createWebSearchTool(
  webSearchProviderId: string,
  extractedKeywords?: ExtractedSearchKeywords,
  requestId?: string
) {
  return {
    definition: createWebSearchToolDefinition(extractedKeywords),
    execute: async (input: WebSearchToolInput) => {
      return executeWebSearch(input, webSearchProviderId, extractedKeywords, requestId);
    },
    formatOutput: formatSearchResultsForAI
  };
}

export default {
  createWebSearchToolDefinition,
  executeWebSearch,
  formatSearchResultsForAI,
  shouldEnableWebSearchTool,
  createWebSearchTool
};
