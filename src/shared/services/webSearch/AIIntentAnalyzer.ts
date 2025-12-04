/**
 * AI 意图分析器
 * 
 * 使用 LLM 分析用户消息，判断是否需要进行网络搜索
 * 复刻 Cherry Studio 的 searchOrchestrationPlugin 流程
 * 
 * 功能：
 * - 支持多关键词提取（并行搜索）
 * - 支持 URL 链接提取
 * - 使用 XML 格式输出
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
  /** 提取的搜索关键词（支持多个） */
  websearch?: ExtractedSearchKeywords;
  /** 分析置信度 (0-1) */
  confidence: number;
  /** 分析原因 */
  reason?: string;
}

/**
 * AI 意图分析提示词（复刻 Cherry Studio 的 SEARCH_SUMMARY_PROMPT_WEB_ONLY）
 * 支持多关键词提取和 URL 链接提取
 */
const AI_INTENT_ANALYSIS_PROMPT = `You are an AI question rephraser. Your role is to rephrase follow-up queries from a conversation into standalone queries that can be used by another LLM to retrieve information through web search.
**Use user's language to rephrase the question.**
Follow these guidelines:
1. If the question is a simple writing task, greeting (e.g., Hi, Hello, How are you), or does not require searching for information (unless the greeting contains a follow-up question), return 'not_needed' in the 'question' XML block. This indicates that no search is required.
2. If the user asks a question related to a specific URL, PDF, or webpage, include the links in the 'links' XML block and the question in the 'question' XML block. If the request is to summarize content from a URL or PDF, return 'summarize' in the 'question' XML block and include the relevant links in the 'links' XML block.
3. For websearch, You need extract keywords into 'question' XML block.
4. Always return the rephrased question inside the 'question' XML block. If there are no links in the follow-up question, do not insert a 'links' XML block in your response.
5. Always wrap the rephrased question in the appropriate XML blocks: use <websearch></websearch> for queries requiring real-time or external information. Ensure that the rephrased question is always contained within a <question></question> block inside the wrapper.
6. For complex questions that require multiple searches, you can include multiple <question> blocks.

There are several examples attached for your reference inside the below 'examples' XML block.

<examples>
1. Follow up question: What is the capital of France
Rephrased question:
<websearch>
  <question>Capital of France</question>
</websearch>

2. Follow up question: Hi, how are you?
Rephrased question:
<websearch>
  <question>not_needed</question>
</websearch>

3. Follow up question: What is Docker?
Rephrased question:
<websearch>
  <question>What is Docker</question>
</websearch>

4. Follow up question: Can you tell me what is X from https://example.com
Rephrased question:
<websearch>
  <question>What is X</question>
  <links>https://example.com</links>
</websearch>

5. Follow up question: Summarize the content from https://example1.com and https://example2.com
Rephrased question:
<websearch>
  <question>summarize</question>
  <links>https://example1.com</links>
  <links>https://example2.com</links>
</websearch>

6. Follow up question: Which company had higher revenue in 2022, "Apple" or "Microsoft"?
Rephrased question:
<websearch>
  <question>Apple revenue 2022</question>
  <question>Microsoft revenue 2022</question>
</websearch>

7. Follow up question: Write me a poem about spring
Rephrased question:
<websearch>
  <question>not_needed</question>
</websearch>

8. Follow up question: 今天北京天气怎么样
Rephrased question:
<websearch>
  <question>北京今天天气</question>
</websearch>

9. Follow up question: 帮我写一段代码
Rephrased question:
<websearch>
  <question>not_needed</question>
</websearch>
</examples>

Anything below is part of the actual conversation. Use the conversation history and the follow-up question to rephrase the follow-up question as a standalone question based on the guidelines shared above.

<conversation>
{chat_history}
</conversation>

**Use user's language to rephrase the question.**
Follow up question: {question}
Rephrased question:`;

/**
 * 解析 AI 返回的 XML 格式结果（支持多关键词）
 */
function parseAIResponse(response: string): AIIntentAnalysisResult {
  try {
    // 提取 websearch 块
    const websearchMatch = response.match(/<websearch>([\s\S]*?)<\/websearch>/i);
    
    if (!websearchMatch) {
      console.warn('[AIIntentAnalyzer] 无法解析 AI 响应，使用默认值');
      return {
        needsWebSearch: false,
        confidence: 0.5,
        reason: '无法解析 AI 响应'
      };
    }

    const websearchContent = websearchMatch[1];

    // 提取所有 question 标签（支持多个）
    const questionMatches = websearchContent.match(/<question>([\s\S]*?)<\/question>/gi);
    const questions: string[] = [];
    
    if (questionMatches) {
      for (const match of questionMatches) {
        const content = match.replace(/<\/?question>/gi, '').trim();
        if (content && content !== 'not_needed') {
          questions.push(content);
        }
      }
    }

    // 提取所有 links 标签
    const linksMatches = websearchContent.match(/<links>([\s\S]*?)<\/links>/gi);
    const links: string[] = [];
    
    if (linksMatches) {
      for (const match of linksMatches) {
        const content = match.replace(/<\/?links>/gi, '').trim();
        if (content) {
          links.push(content);
        }
      }
    }

    // 判断是否需要搜索
    const needsWebSearch = questions.length > 0;

    const result: AIIntentAnalysisResult = {
      needsWebSearch,
      confidence: needsWebSearch ? 0.9 : 0.8,
      reason: needsWebSearch 
        ? `提取了 ${questions.length} 个搜索关键词` 
        : '不需要搜索'
    };

    if (needsWebSearch) {
      result.websearch = {
        question: questions,
        links: links.length > 0 ? links : undefined
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

    // 构建上下文（复刻 Cherry Studio 的格式）
    const chatHistory = lastAssistantMessage 
      ? `assistant: ${lastAssistantMessage.slice(0, 500)}` 
      : '';

    // 使用模板替换变量
    const formattedPrompt = AI_INTENT_ANALYSIS_PROMPT
      .replace('{chat_history}', chatHistory)
      .replace('{question}', userMessage);

    console.log('[AIIntentAnalyzer] 开始 AI 意图分析，使用模型:', modelId);

    const response = await sendChatRequest({
      messages: [
        { role: 'user', content: formattedPrompt }
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
