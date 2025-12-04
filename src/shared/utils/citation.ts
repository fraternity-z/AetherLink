/**
 * 引用系统工具函数
 * 
 * 处理网络搜索结果等引用的标记转换和数据提取
 */

import type { Citation, SearchResult, CitationSupData } from '../types/citation';
import type { ToolMessageBlock } from '../types/newMessage';
import { MessageBlockType } from '../types/newMessage';
import { encodeHTML, cleanMarkdownContent } from '../../utils/formats';

// ==================== 引用标记转换 ====================

/**
 * 严格的引用标记正则表达式
 * 
 * 排除 Markdown 链接格式，避免冲突：
 * - (?<!\]) - 前面不是 ]（排除 [text][N] 格式）
 * - \[(\d{1,2})\] - 匹配 [1] 到 [99]
 * - (?!\() - 后面不是 (（排除 [N](url) 格式）
 * 
 * 注意：JavaScript 不支持后向断言的完整语法，使用简化版本
 */
const CITATION_REGEX = /\[(\d{1,2})\](?!\()/g;

/**
 * 将内容中的引用标记转换为可渲染的 sup 标签格式
 * 
 * 转换: [N] → [<sup data-citation='json'>N</sup>](url)
 * 
 * @param content 原始内容（含 [N] 引用标记）
 * @param citations 引用数据列表
 * @returns 转换后的内容
 */
export function withCitationTags(content: string, citations: Citation[]): string {
  if (!content || citations.length === 0) return content;
  
  // 创建引用映射（1-based index）
  const citationMap = new Map<number, Citation>();
  citations.forEach((citation, index) => {
    citationMap.set(citation.number || (index + 1), citation);
  });
  
  // 保护代码块，避免误转换代码中的 [N]
  const protectedItems: string[] = [];
  let processedContent = content;
  
  // 保护代码块
  processedContent = processedContent.replace(/(```[\s\S]*?```|`[^`]*`)/g, (match) => {
    const index = protectedItems.length;
    protectedItems.push(match);
    return `__CITATION_PROTECTED_${index}__`;
  });
  
  // 转换引用标记
  processedContent = processedContent.replace(CITATION_REGEX, (match, num) => {
    const citationNum = parseInt(num, 10);
    const citation = citationMap.get(citationNum);
    
    if (!citation) return match; // 保持原样
    
    return generateCitationTag(citation, citationNum);
  });
  
  // 还原被保护的代码块
  processedContent = processedContent.replace(/__CITATION_PROTECTED_(\d+)__/g, (_, indexStr) => {
    const index = parseInt(indexStr, 10);
    if (index >= 0 && index < protectedItems.length) {
      return protectedItems[index];
    }
    return _;
  });
  
  return processedContent;
}

/**
 * 生成单个引用标签
 * 
 * 输出格式: [<sup data-citation='json'>N</sup>](url)
 * 
 * @param citation 引用数据
 * @param number 引用序号
 * @returns 引用标签字符串
 */
export function generateCitationTag(citation: Citation, number: number): string {
  const supData: CitationSupData = {
    id: number,
    url: citation.url || '',
    title: citation.title || citation.hostname || '',
    content: citation.content?.substring(0, 200)
  };
  
  const citationJson = encodeHTML(JSON.stringify(supData));
  
  // 判断是否为有效链接
  const isValidUrl = citation.url && citation.url.startsWith('http');
  
  // 生成格式: [<sup data-citation='json'>N</sup>](url)
  return `[<sup data-citation='${citationJson}'>${number}</sup>]` + 
         (isValidUrl ? `(${citation.url})` : '()');
}

// ==================== 引用数据提取 ====================

/**
 * 从搜索结果创建引用列表
 * 
 * @param results 搜索结果数组
 * @returns 引用列表
 */
export function createCitationsFromSearchResults(results: SearchResult[]): Citation[] {
  return results.map((result, index) => ({
    number: index + 1,
    url: result.url,
    title: result.title || '',
    content: cleanMarkdownContent(result.snippet || result.content || ''),
    hostname: extractHostname(result.url),
    type: 'websearch' as const,
    showFavicon: true
  }));
}

/**
 * 从 ToolMessageBlock 中提取搜索结果
 * 
 * @param block 工具消息块
 * @returns 搜索结果数组
 */
export function extractSearchResultsFromToolBlock(block: ToolMessageBlock): SearchResult[] {
  const toolResponse = block.metadata?.rawMcpToolResponse as any;
  
  // 1. toolResponse.response.webSearchResult.results
  if (toolResponse?.response?.webSearchResult?.results) {
    return toolResponse.response.webSearchResult.results;
  }
  
  // 2. toolResponse.response.results
  if (toolResponse?.response?.results && Array.isArray(toolResponse.response.results)) {
    return toolResponse.response.results;
  }
  
  // 3. block.content.results
  const content = block.content as any;
  if (content?.results && Array.isArray(content.results)) {
    return content.results;
  }
  
  // 4. block.content.webSearchResult.results
  if (content?.webSearchResult?.results) {
    return content.webSearchResult.results;
  }
  
  return [];
}

/**
 * 从 ToolMessageBlock 提取引用列表
 * 
 * @param block 工具消息块
 * @returns 引用列表
 */
export function extractCitationsFromToolBlock(block: ToolMessageBlock): Citation[] {
  const results = extractSearchResultsFromToolBlock(block);
  return createCitationsFromSearchResults(results);
}

/**
 * 检查工具块是否为网络搜索工具
 * 
 * @param block 消息块
 * @returns 是否为网络搜索工具
 */
export function isWebSearchToolBlock(block: { type: string; toolName?: string; toolId?: string }): boolean {
  if (block.type !== MessageBlockType.TOOL) return false;
  
  const toolName = block.toolName?.toLowerCase() || '';
  const toolId = block.toolId?.toLowerCase() || '';
  
  return toolName.includes('web_search') || 
         toolName.includes('websearch') ||
         toolId.includes('web_search') ||
         toolId.includes('websearch') ||
         toolName === 'builtin_web_search';
}

// ==================== 辅助函数 ====================

/**
 * 从 URL 提取主机名
 */
export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * 解析 data-citation 属性中的 JSON 数据
 * 
 * @param citationStr 编码的引用 JSON 字符串
 * @returns 解析后的引用数据或 null
 */
export function parseCitationData(citationStr: string): CitationSupData | null {
  try {
    // 解码 HTML 实体
    const decoded = citationStr
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    return JSON.parse(decoded) as CitationSupData;
  } catch {
    return null;
  }
}

/**
 * 在 React children 中查找引用数据
 * 遍历子元素查找 sup 标签的 data-citation 属性
 * 
 * @param children React children
 * @returns 引用 JSON 字符串或 null
 */
export function findCitationInChildren(children: any): string | null {
  if (!children) return null;
  
  // 递归遍历 children
  const traverse = (node: any): string | null => {
    if (!node) return null;
    
    // 如果是数组，遍历每个元素
    if (Array.isArray(node)) {
      for (const child of node) {
        const result = traverse(child);
        if (result) return result;
      }
      return null;
    }
    
    // 如果是对象（React 元素）
    if (typeof node === 'object') {
      // 检查是否是 sup 元素
      if (node.type === 'sup' && node.props?.['data-citation']) {
        return node.props['data-citation'];
      }
      
      // 递归检查 children
      if (node.props?.children) {
        return traverse(node.props.children);
      }
    }
    
    return null;
  };
  
  return traverse(children);
}