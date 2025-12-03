/**
 * 搜索意图分析器
 * 
 * 分析用户消息，判断是否需要进行网络搜索
 * 并提取搜索关键词
 */

import type { ExtractedSearchKeywords } from './WebSearchTool';

/**
 * 意图分析结果
 */
export interface SearchIntentResult {
  /** 是否需要网络搜索 */
  needsWebSearch: boolean;
  /** 提取的搜索关键词 */
  websearch?: ExtractedSearchKeywords;
  /** 分析置信度 (0-1) */
  confidence: number;
  /** 分析原因 */
  reason?: string;
}

/**
 * 需要搜索的关键词模式
 */
const SEARCH_TRIGGER_PATTERNS = [
  // 实时信息
  /今天|今日|现在|最新|最近|当前|目前/,
  /天气|气温|温度/,
  /新闻|消息|报道|事件/,
  /股票|股价|行情|涨跌/,
  /比赛|赛事|比分|结果/,
  
  // 明确搜索意图
  /搜索|查询|查找|查一下|搜一下|帮我查|帮我搜/,
  /网上|网络|互联网|在线/,
  
  // 事实性问题
  /是什么|是谁|在哪|怎么样|如何|为什么|多少/,
  /什么时候|何时|哪里|哪个/,
  
  // 产品/服务信息
  /价格|多少钱|费用|成本/,
  /评价|评测|测评|口碑|怎么样/,
  /官网|官方|网站|链接/,
  
  // 时效性内容
  /\d{4}年|\d{1,2}月|\d{1,2}日/,
  /最新版|新版本|更新/
];

/**
 * 不需要搜索的模式
 */
const NO_SEARCH_PATTERNS = [
  // 编程/代码相关
  /写代码|编程|代码|函数|类|方法|变量/,
  /```|代码块/,
  
  // 创意/生成任务
  /写一篇|写一个|生成|创作|编写|帮我写/,
  /故事|文章|诗|歌词|剧本/,
  
  // 翻译任务
  /翻译|translate/i,
  
  // 数学计算
  /计算|算一下|等于多少/,
  
  // 闲聊
  /你好|您好|谢谢|再见|晚安/,
  /你是谁|你叫什么|介绍一下你/
];

/**
 * 分析用户消息的搜索意图
 */
export function analyzeSearchIntent(
  userMessage: string,
  _lastAssistantMessage?: string
): SearchIntentResult {
  const message = userMessage.trim();
  
  if (!message) {
    return {
      needsWebSearch: false,
      confidence: 1.0,
      reason: '空消息'
    };
  }

  // 检查是否明确不需要搜索
  for (const pattern of NO_SEARCH_PATTERNS) {
    if (pattern.test(message)) {
      return {
        needsWebSearch: false,
        confidence: 0.8,
        reason: '匹配到不需要搜索的模式'
      };
    }
  }

  // 检查是否需要搜索
  let matchCount = 0;
  const matchedPatterns: string[] = [];
  
  for (const pattern of SEARCH_TRIGGER_PATTERNS) {
    if (pattern.test(message)) {
      matchCount++;
      matchedPatterns.push(pattern.source);
    }
  }

  // 根据匹配数量判断是否需要搜索
  if (matchCount >= 2) {
    return {
      needsWebSearch: true,
      websearch: extractSearchKeywords(message),
      confidence: 0.9,
      reason: `匹配到 ${matchCount} 个搜索触发模式`
    };
  }

  if (matchCount === 1) {
    return {
      needsWebSearch: true,
      websearch: extractSearchKeywords(message),
      confidence: 0.7,
      reason: `匹配到搜索触发模式: ${matchedPatterns[0]}`
    };
  }

  // 默认不搜索
  return {
    needsWebSearch: false,
    confidence: 0.5,
    reason: '未匹配到搜索触发模式'
  };
}

/**
 * 从用户消息中提取搜索关键词
 */
export function extractSearchKeywords(message: string): ExtractedSearchKeywords {
  // 移除常见的问句词
  let query = message
    .replace(/请问|请告诉我|帮我|我想知道|我想了解/g, '')
    .replace(/是什么|是谁|在哪|怎么样|如何|为什么|多少/g, '')
    .replace(/？|\?|。|！|!|，|,/g, ' ')
    .trim();

  // 如果处理后太短，使用原始消息
  if (query.length < 3) {
    query = message.replace(/？|\?|。|！|!/g, '').trim();
  }

  // 提取可能的链接
  const urlPattern = /https?:\/\/[^\s]+/g;
  const links = message.match(urlPattern) || [];

  return {
    question: [query],
    links: links.length > 0 ? links : undefined
  };
}

export default {
  analyzeSearchIntent,
  extractSearchKeywords
};
