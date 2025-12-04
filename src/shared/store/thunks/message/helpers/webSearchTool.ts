/**
 * 网络搜索工具配置模块
 * 
 * 复刻 Cherry Studio 的搜索编排流程：
 * 1. 意图识别：使用 AI 分析用户消息，提取搜索关键词
 * 2. 工具配置：根据意图分析结果配置搜索工具
 * 3. 搜索执行：AI 调用工具时执行并行搜索
 */
import { dexieStorage } from '../../../../services/storage/DexieStorageService';
import {
  createWebSearchToolDefinition,
  shouldEnableWebSearchTool,
  analyzeSearchIntentWithAI,
  isAIIntentAnalysisEnabled
} from '../../../../services/webSearch';
import { analyzeSearchIntent } from '../../../../services/webSearch/SearchIntentAnalyzer';
import type { ExtractedSearchKeywords } from '../../../../services/webSearch';
import type { MCPTool } from '../../../../types';
import type { Message } from '../../../../types/newMessage';
import { MessageBlockType } from '../../../../types/newMessage';
import type { RootState } from '../../../index';

export interface WebSearchConfig {
  webSearchTool: any | null;
  extractedKeywords: ExtractedSearchKeywords | undefined;
  webSearchProviderId: string | undefined;
}

interface WebSearchContext {
  getState: () => RootState;
  topicId: string;
  assistant: any;
}

/**
 * 配置网络搜索工具
 * 
 * 流程（复刻 Cherry Studio）：
 * 1. 检查是否启用网络搜索
 * 2. 获取用户消息内容
 * 3. 使用 AI 进行意图分析，提取搜索关键词
 * 4. 根据意图分析结果配置搜索工具
 */
export async function configureWebSearchTool(
  context: WebSearchContext
): Promise<WebSearchConfig> {
  const { getState, topicId, assistant } = context;

  const result: WebSearchConfig = {
    webSearchTool: null,
    extractedKeywords: undefined,
    webSearchProviderId: undefined
  };

  // 获取网络搜索配置
  const webSearchState = getState().webSearch;
  const webSearchProviderId = assistant?.webSearchProviderId || webSearchState?.activeProviderId;

  if (!webSearchProviderId || !shouldEnableWebSearchTool(webSearchProviderId)) {
    return result;
  }

  result.webSearchProviderId = webSearchProviderId;

  // 获取最后一条用户消息
  const topicMessages = await dexieStorage.getTopicMessages(topicId);
  const sortedUserMessages = topicMessages
    .filter((m: Message) => m.role === 'user')
    .sort((a: Message, b: Message) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  
  const lastUserMsg = sortedUserMessages[0];
  if (!lastUserMsg) {
    return result;
  }

  // 获取用户消息内容
  const userBlocks = await dexieStorage.getMessageBlocksByMessageId(lastUserMsg.id);
  const mainTextBlock = userBlocks.find((b: any) => b.type === MessageBlockType.MAIN_TEXT) as any;
  const userContent = mainTextBlock?.content || '';

  if (!userContent.trim()) {
    return result;
  }

  // 获取上一条助手消息（用于上下文）
  const sortedAssistantMessages = topicMessages
    .filter((m: Message) => m.role === 'assistant')
    .sort((a: Message, b: Message) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  
  let lastAssistantContent: string | undefined;
  if (sortedAssistantMessages.length > 0) {
    const assistantBlocks = await dexieStorage.getMessageBlocksByMessageId(sortedAssistantMessages[0].id);
    const assistantMainBlock = assistantBlocks.find((b: any) => b.type === MessageBlockType.MAIN_TEXT) as any;
    lastAssistantContent = assistantMainBlock?.content;
  }

  // 🚀 Step 1: 检查是否启用 AI 意图分析
  const useAIAnalysis = isAIIntentAnalysisEnabled();

  if (!useAIAnalysis) {
    // 使用规则匹配（SearchIntentAnalyzer）
    const ruleResult = analyzeSearchIntent(userContent, lastAssistantContent);
    
    if (!ruleResult.needsWebSearch) {
      console.log('[WebSearch] 规则匹配：不需要搜索');
      return result;
    }
    
    // 规则匹配认为需要搜索
    result.extractedKeywords = ruleResult.websearch || {
      question: [userContent],
      links: undefined
    };
    result.webSearchTool = createWebSearchToolDefinition(result.extractedKeywords);
    console.log('[WebSearch] 规则匹配模式：已添加搜索工具');
    return result;
  }

  // 🚀 Step 2: AI 意图分析（复刻 Cherry Studio 的 searchOrchestrationPlugin）
  console.log('[WebSearch] 开始 AI 意图分析...');
  
  const intentResult = await analyzeSearchIntentWithAI(userContent, lastAssistantContent);
  
  if (!intentResult.needsWebSearch) {
    console.log('[WebSearch] AI 分析：不需要搜索');
    return result;
  }

  // 🚀 Step 3: 配置搜索工具（使用预提取的关键词）
  if (intentResult.websearch) {
    result.extractedKeywords = intentResult.websearch;
    result.webSearchTool = createWebSearchToolDefinition(result.extractedKeywords);
    console.log('[WebSearch] AI 分析完成，提取的搜索关键词:', result.extractedKeywords.question);
  }

  return result;
}

/**
 * 创建网络搜索 MCP 工具
 */
export function createWebSearchMcpTool(
  webSearchTool: any,
  webSearchProviderId: string,
  extractedKeywords: ExtractedSearchKeywords | undefined
): MCPTool {
  return {
    id: 'builtin_web_search',
    name: 'builtin_web_search',
    description: webSearchTool.function.description,
    inputSchema: webSearchTool.function.parameters,
    serverId: 'builtin',
    serverName: 'builtin',
    webSearchConfig: {
      providerId: webSearchProviderId,
      extractedKeywords
    }
  } as MCPTool & { webSearchConfig: any };
}
