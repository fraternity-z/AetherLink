/**
 * 引用系统类型定义
 * 
 * 用于网络搜索结果、知识库引用等的引用标记和提示功能
 */

/**
 * 引用类型
 */
export type CitationType = 'websearch' | 'knowledge' | 'memory';

/**
 * 引用数据接口
 */
export interface Citation {
  /** 引用序号 (1-based) */
  number: number;
  /** 来源 URL */
  url: string;
  /** 标题 */
  title?: string;
  /** 内容摘要 */
  content?: string;
  /** 主机名 */
  hostname?: string;
  /** 引用类型 */
  type: CitationType;
  /** 是否显示 favicon */
  showFavicon?: boolean;
  /** 额外元数据 */
  metadata?: Record<string, any>;
}

/**
 * 搜索结果接口（从工具块提取）
 */
export interface SearchResult {
  title?: string;
  url: string;
  snippet?: string;
  content?: string;
}

/**
 * 引用上下文
 */
export interface CitationContext {
  /** 关联的消息 ID */
  messageId: string;
  /** 引用列表 */
  citations: Citation[];
  /** 搜索来源类型 */
  source?: CitationSourceType;
}

/**
 * 引用来源类型
 */
export type CitationSourceType = 'openai' | 'gemini' | 'perplexity' | 'default';

/**
 * sup 标签中的引用数据（用于 JSON 序列化）
 */
export interface CitationSupData {
  /** 引用 ID/序号 */
  id: number;
  /** URL */
  url: string;
  /** 标题 */
  title: string;
  /** 内容摘要（截断） */
  content?: string;
}