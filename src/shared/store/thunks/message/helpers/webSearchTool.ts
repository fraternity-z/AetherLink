/**
 * 搜索工具配置模块
 * 
 * 复刻 Cherry Studio 的搜索编排流程：
 * 1. 意图识别：使用 AI 统一分析用户消息，判断是否需要 web 搜索 / 知识库搜索
 * 2. 工具配置：根据意图分析结果配置搜索工具
 * 3. 搜索执行：AI 调用工具时执行并行搜索
 */
import { dexieStorage } from '../../../../services/storage/DexieStorageService';
import {
  createWebSearchToolDefinition,
  shouldEnableWebSearchTool,
  analyzeUnifiedSearchIntent,
} from '../../../../services/webSearch';
import type { ExtractedSearchKeywords, ExtractedKnowledgeKeywords, IntentAnalysisOptions, UnifiedIntentResult } from '../../../../services/webSearch';
import type { MCPTool } from '../../../../types';
import type { Message } from '../../../../types/newMessage';
import { MessageBlockType } from '../../../../types/newMessage';
import type { RootState } from '../../../index';

export interface WebSearchConfig {
  webSearchTool: any | null;
  extractedKeywords: ExtractedSearchKeywords | undefined;
  webSearchProviderId: string | undefined;
}

/**
 * 统一搜索配置结果
 * 包含 web 搜索和知识库搜索的意图分析结果
 */
export interface UnifiedSearchConfig {
  /** Web 搜索工具定义（用于注入 AI 请求） */
  webSearchTool: any | null;
  /** Web 搜索预提取关键词 */
  extractedKeywords: ExtractedSearchKeywords | undefined;
  /** Web 搜索提供商 ID */
  webSearchProviderId: string | undefined;
  /** 知识库搜索关键词（由 AI 意图分析提取） */
  knowledgeKeywords: ExtractedKnowledgeKeywords | undefined;
  /** 原始的统一意图分析结果 */
  intentResult: UnifiedIntentResult | undefined;
}

interface SearchContext {
  getState: () => RootState;
  topicId: string;
  assistant: any;
}

/**
 * 获取用户和助手的最近消息内容
 */
async function getRecentMessageContents(topicId: string): Promise<{
  userContent: string;
  lastAssistantContent: string | undefined;
}> {
  const topicMessages = await dexieStorage.getTopicMessages(topicId);
  
  // 获取最后一条用户消息
  const sortedUserMessages = topicMessages
    .filter((m: Message) => m.role === 'user')
    .sort((a: Message, b: Message) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  
  const lastUserMsg = sortedUserMessages[0];
  if (!lastUserMsg) {
    return { userContent: '', lastAssistantContent: undefined };
  }

  const userBlocks = await dexieStorage.getMessageBlocksByMessageId(lastUserMsg.id);
  const mainTextBlock = userBlocks.find((b: any) => b.type === MessageBlockType.MAIN_TEXT) as any;
  const userContent = mainTextBlock?.content || '';

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

  return { userContent, lastAssistantContent };
}

/**
 * 统一搜索意图分析 + 工具配置
 * 
 * 流程（复刻 Cherry Studio 的 searchOrchestrationPlugin）：
 * 1. 判断哪些搜索类型已启用（web / 知识库 / 记忆）
 * 2. 获取用户消息内容
 * 3. 使用 AI 统一分析所有搜索意图（一次 API 调用）
 * 4. 根据分析结果配置对应的搜索工具
 */
export async function configureSearchTools(
  context: SearchContext
): Promise<UnifiedSearchConfig> {
  const { getState, topicId, assistant } = context;

  const result: UnifiedSearchConfig = {
    webSearchTool: null,
    extractedKeywords: undefined,
    webSearchProviderId: undefined,
    knowledgeKeywords: undefined,
    intentResult: undefined
  };

  // 🔍 Step 1: 判断哪些搜索类型需要分析
  const webSearchState = getState().webSearch;
  const webSearchProviderId = assistant?.webSearchProviderId || webSearchState?.activeProviderId;
  const shouldWebSearch = !!(webSearchProviderId && shouldEnableWebSearchTool(webSearchProviderId));

  // 知识库搜索：检查助手是否配置了知识库且开启了 "on" 模式（AI 意图识别）
  const hasKnowledgeBases = assistant?.knowledge_bases?.length > 0;
  const knowledgeRecognition = assistant?.knowledgeRecognition || 'off';
  const shouldKnowledgeSearch = hasKnowledgeBases && knowledgeRecognition === 'on';

  // 如果都不需要分析，直接返回
  if (!shouldWebSearch && !shouldKnowledgeSearch) {
    return result;
  }

  if (shouldWebSearch) {
    result.webSearchProviderId = webSearchProviderId;
  }

  // 🔍 Step 2: 获取消息内容
  const { userContent, lastAssistantContent } = await getRecentMessageContents(topicId);
  if (!userContent.trim()) {
    return result;
  }

  // � Step 2.5: 检查是否启用 AI 意图分析
  const enableAIAnalysis = getState().settings.enableAIIntentAnalysis ?? true;

  if (!enableAIAnalysis) {
    // 跳过意图分析，直接注入工具（让 LLM 自行决定是否调用）
    if (shouldWebSearch) {
      result.extractedKeywords = { question: [userContent] };
      result.webSearchTool = createWebSearchToolDefinition(result.extractedKeywords);
    }
    console.log('[SearchTools] AI 意图分析已关闭，直接注入工具');
    return result;
  }

  // �🚀 Step 3: AI 统一意图分析（一次调用分析所有类型）
  const analysisOptions: IntentAnalysisOptions = {
    shouldWebSearch,
    shouldKnowledgeSearch
  };

  console.log('[SearchTools] 开始统一意图分析:', analysisOptions);

  const intentResult = await analyzeUnifiedSearchIntent(
    userContent,
    lastAssistantContent,
    analysisOptions
  );

  result.intentResult = intentResult;

  // 🚀 Step 4: 根据分析结果配置工具

  // Web 搜索工具
  if (intentResult.websearch) {
    result.extractedKeywords = intentResult.websearch;
    result.webSearchTool = createWebSearchToolDefinition(result.extractedKeywords);
    console.log('[SearchTools] Web 搜索关键词:', result.extractedKeywords.question);
  }

  // 知识库搜索关键词（传递给知识库搜索流程使用）
  if (intentResult.knowledge) {
    result.knowledgeKeywords = intentResult.knowledge;
    console.log('[SearchTools] 知识库搜索关键词:', result.knowledgeKeywords.question);
  }

  return result;
}

/**
 * 配置网络搜索工具（兼容旧接口）
 * @deprecated 请使用 configureSearchTools 代替
 */
export async function configureWebSearchTool(
  context: SearchContext
): Promise<WebSearchConfig> {
  const unified = await configureSearchTools(context);
  return {
    webSearchTool: unified.webSearchTool,
    extractedKeywords: unified.extractedKeywords,
    webSearchProviderId: unified.webSearchProviderId
  };
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
