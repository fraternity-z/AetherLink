/**
 * AI 意图分析器
 * 
 * 使用 LLM 分析用户消息，判断是否需要进行网络搜索
 * 比规则匹配更准确，但需要额外的 API 调用
 */

import { sendChatRequest } from '../../api';
import store from '../../store';
import type { ExtractedSearchKeywords } from './WebSearchTool';

/**
 * AI 意图分析结果
 */
export interface AIIntentAnalysisResult {
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
 * AI 意图分析提示词
 */
const AI_INTENT_ANALYSIS_PROMPT = `你是一个搜索意图分析专家。分析用户的消息，判断是否需要进行网络搜索来回答问题。

## 需要搜索的情况：
- 询问实时信息（天气、新闻、股票、比赛结果等）
- 询问最新事件或近期发生的事情
- 询问你不确定或可能过时的事实
- 用户明确要求搜索网络
- 询问特定产品、服务的价格或评价
- 询问特定网站、官网链接

## 不需要搜索的情况：
- 编程、代码相关问题
- 创意写作、生成内容
- 翻译任务
- 数学计算
- 闲聊、问候
- 询问你自身的能力或身份
- 通用知识问题（你已经知道的）

## 输出格式（严格按照 XML 格式）：
<analysis>
  <needs_search>true 或 false</needs_search>
  <confidence>0.0 到 1.0 之间的数字</confidence>
  <reason>简短说明原因</reason>
  <search_query>如果需要搜索，提供优化后的搜索关键词；如果不需要搜索，填写 not_needed</search_query>
</analysis>

请分析以下用户消息：`;

/**
 * 解析 AI 返回的 XML 格式结果
 */
function parseAIResponse(response: string): AIIntentAnalysisResult {
  try {
    // 提取 XML 内容
    const analysisMatch = response.match(/<analysis>([\s\S]*?)<\/analysis>/i);
    if (!analysisMatch) {
      console.warn('[AIIntentAnalyzer] 无法解析 AI 响应，使用默认值');
      return {
        needsWebSearch: false,
        confidence: 0.5,
        reason: '无法解析 AI 响应'
      };
    }

    const analysisContent = analysisMatch[1];

    // 提取各个字段
    const needsSearchMatch = analysisContent.match(/<needs_search>(.*?)<\/needs_search>/i);
    const confidenceMatch = analysisContent.match(/<confidence>(.*?)<\/confidence>/i);
    const reasonMatch = analysisContent.match(/<reason>(.*?)<\/reason>/i);
    const searchQueryMatch = analysisContent.match(/<search_query>(.*?)<\/search_query>/i);

    const needsWebSearch = needsSearchMatch?.[1]?.trim().toLowerCase() === 'true';
    const confidence = parseFloat(confidenceMatch?.[1]?.trim() || '0.5');
    const reason = reasonMatch?.[1]?.trim();
    const searchQuery = searchQueryMatch?.[1]?.trim();

    const result: AIIntentAnalysisResult = {
      needsWebSearch,
      confidence: isNaN(confidence) ? 0.5 : Math.max(0, Math.min(1, confidence)),
      reason
    };

    if (needsWebSearch && searchQuery && searchQuery !== 'not_needed') {
      result.websearch = {
        question: [searchQuery],
        links: undefined
      };
    }

    return result;
  } catch (error) {
    console.error('[AIIntentAnalyzer] 解析 AI 响应失败:', error);
    return {
      needsWebSearch: false,
      confidence: 0.5,
      reason: '解析失败'
    };
  }
}

/**
 * 使用 AI 分析用户消息的搜索意图
 */
export async function analyzeSearchIntentWithAI(
  userMessage: string,
  lastAssistantMessage?: string
): Promise<AIIntentAnalysisResult> {
  try {
    if (!userMessage?.trim()) {
      return {
        needsWebSearch: false,
        confidence: 1.0,
        reason: '空消息'
      };
    }

    const settings = store.getState().settings;
    
    // 确定使用哪个模型
    let modelId: string;
    if (settings.aiIntentAnalysisUseCurrentModel && settings.currentModelId) {
      modelId = settings.currentModelId;
    } else if (settings.aiIntentAnalysisModelId) {
      modelId = settings.aiIntentAnalysisModelId;
    } else {
      // 回退到话题命名模型或默认模型
      modelId = settings.topicNamingModelId || settings.defaultModelId || 'gpt-3.5-turbo';
    }

    // 构建上下文
    let context = userMessage;
    if (lastAssistantMessage) {
      context = `上一条 AI 回复：${lastAssistantMessage.slice(0, 200)}...\n\n用户消息：${userMessage}`;
    }

    console.log('[AIIntentAnalyzer] 开始 AI 意图分析，使用模型:', modelId);

    const response = await sendChatRequest({
      messages: [
        { role: 'system', content: AI_INTENT_ANALYSIS_PROMPT },
        { role: 'user', content: context }
      ],
      modelId
    });

    if (!response.success || !response.content) {
      console.warn('[AIIntentAnalyzer] AI 请求失败，回退到规则匹配');
      return {
        needsWebSearch: false,
        confidence: 0.5,
        reason: 'AI 请求失败'
      };
    }

    const result = parseAIResponse(response.content);
    console.log('[AIIntentAnalyzer] AI 意图分析结果:', result);

    return result;
  } catch (error) {
    console.error('[AIIntentAnalyzer] AI 意图分析失败:', error);
    return {
      needsWebSearch: false,
      confidence: 0.5,
      reason: '分析失败'
    };
  }
}

/**
 * 检查是否启用了 AI 意图分析
 */
export function isAIIntentAnalysisEnabled(): boolean {
  return store.getState().settings.enableAIIntentAnalysis ?? false;
}

export default {
  analyzeSearchIntentWithAI,
  isAIIntentAnalysisEnabled
};
