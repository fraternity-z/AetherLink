/**
 * 网络搜索工具配置模块
 */
import { dexieStorage } from '../../../../services/storage/DexieStorageService';
import {
  analyzeSearchIntent,
  analyzeSearchIntentWithAI,
  isAIIntentAnalysisEnabled,
  createWebSearchToolDefinition,
  shouldEnableWebSearchTool
} from '../../../../services/webSearch';
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
 * 根据助手配置和全局设置决定是否启用网络搜索
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

  // 获取网络搜索配置：
  // 1. 优先从助手配置获取 webSearchProviderId
  // 2. 其次从全局 webSearch 状态的 activeProviderId 获取（用户点击搜索按钮选择引擎后才会设置）
  // 注意：不再从 webSearchState.provider 获取，因为那只是设置中的默认提供商
  const webSearchState = getState().webSearch;
  const webSearchProviderId = assistant?.webSearchProviderId || webSearchState?.activeProviderId;

  if (!webSearchProviderId || !shouldEnableWebSearchTool(webSearchProviderId)) {
    return result;
  }

  result.webSearchProviderId = webSearchProviderId;
  const isAutoSearchMode = webSearchState?.searchMode === 'auto';
  console.log(`[WebSearch] 检测到网络搜索配置: ${webSearchProviderId}, 模式: ${isAutoSearchMode ? 'auto' : 'manual'}`);

  // 获取最后一条用户消息
  const topicMessages = await dexieStorage.getTopicMessages(topicId);
  const lastUserMsg = topicMessages
    .filter((m: Message) => m.role === 'user')
    .sort((a: Message, b: Message) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

  if (!lastUserMsg) {
    return result;
  }

  // 获取用户消息内容
  const userBlocks = await dexieStorage.getMessageBlocksByMessageId(lastUserMsg.id);
  const mainTextBlock = userBlocks.find((b: any) => b.type === MessageBlockType.MAIN_TEXT) as any;
  const userContent = mainTextBlock?.content || '';

  if (isAutoSearchMode) {
    // 自动模式：总是添加搜索工具，让 AI 自主决定是否搜索
    result.extractedKeywords = {
      question: [userContent],
      links: undefined
    };
    result.webSearchTool = createWebSearchToolDefinition(result.extractedKeywords);
    console.log(`[WebSearch] 自动模式：已添加网络搜索工具，AI 将自主决定是否搜索`);
  } else {
    // 其他模式：使用意图分析
    // 🚀 检查是否启用 AI 意图分析
    const useAIAnalysis = isAIIntentAnalysisEnabled();
    
    let intentResult;
    if (useAIAnalysis) {
      // 使用 AI 意图分析（更准确，但需要额外 API 调用）
      console.log(`[WebSearch] 使用 AI 意图分析...`);
      intentResult = await analyzeSearchIntentWithAI(userContent);
    } else {
      // 使用规则匹配（快速，无额外开销）
      intentResult = analyzeSearchIntent(userContent);
    }
    
    console.log(`[WebSearch] 意图分析结果 (${useAIAnalysis ? 'AI' : '规则'}):`, intentResult);

    if (intentResult.needsWebSearch) {
      result.extractedKeywords = intentResult.websearch;
      result.webSearchTool = createWebSearchToolDefinition(result.extractedKeywords);
      console.log(`[WebSearch] 已创建网络搜索工具，预设查询:`, result.extractedKeywords?.question);
    }
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
