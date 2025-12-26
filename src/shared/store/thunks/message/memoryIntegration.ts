/**
 * 记忆系统集成模块
 * 负责在对话流程中搜索和注入相关记忆，以及在响应后提取和保存事实
 */
import store from '../../index';
import { memoryService } from '../../../services/memory/MemoryService';
import { MemoryProcessor, type MemoryProcessorConfig } from '../../../services/memory/MemoryProcessor';

// 记忆处理器实例（延迟初始化）
let memoryProcessor: MemoryProcessor | null = null;

/**
 * 获取或创建 MemoryProcessor 实例
 */
function getMemoryProcessor(userId: string): MemoryProcessor | null {
  const state = store.getState();
  const memoryConfig = state.memory?.memoryConfig;
  
  if (!memoryConfig?.llmModel || !memoryConfig?.embeddingModel) {
    return null;
  }
  
  // 构建配置
  const config: MemoryProcessorConfig = {
    memoryConfig: memoryConfig,
    userId: userId,
  };
  
  if (!memoryProcessor) {
    memoryProcessor = new MemoryProcessor(config);
  }
  
  return memoryProcessor;
}

/**
 * 检查记忆功能是否启用并配置完成
 */
export function isMemoryEnabled(): boolean {
  const state = store.getState();
  const memoryState = state.memory;
  
  if (!memoryState?.globalMemoryEnabled) {
    return false;
  }
  
  const config = memoryState.memoryConfig;
  return !!(config?.llmModel && config?.embeddingModel);
}

/**
 * 检查自动分析记忆是否启用
 */
export function isAutoAnalyzeEnabled(): boolean {
  if (!isMemoryEnabled()) {
    return false;
  }
  const state = store.getState();
  return state.memory?.memoryConfig?.autoAnalyzeEnabled === true;
}

/**
 * 检查记忆工具是否启用
 */
export function isMemoryToolEnabled(): boolean {
  if (!isMemoryEnabled()) {
    return false;
  }
  const state = store.getState();
  return state.memory?.memoryConfig?.memoryToolEnabled === true;
}

/**
 * 获取当前助手 ID
 */
export function getCurrentAssistantId(): string {
  const state = store.getState();
  return state.memory?.currentAssistantId || 'default';
}

/**
 * 搜索相关记忆
 * 在发送消息前调用，根据用户输入搜索相关的历史记忆
 */
export async function searchRelevantMemories(
  userContent: string,
  limit: number = 5
): Promise<string[]> {
  if (!isMemoryEnabled()) {
    return [];
  }
  
  try {
    // 🔧 关键：从 Redux store 同步配置到 MemoryService
    // 因为 MemoryService 是单例，页面刷新后内部配置会丢失
    const state = store.getState();
    const memoryConfig = state.memory?.memoryConfig;
    if (memoryConfig) {
      memoryService.setConfig(memoryConfig);
    }
    
    const assistantId = getCurrentAssistantId();
    const results = await memoryService.search(userContent, {
      assistantId,
      limit,
      threshold: 0.5
    });
    
    if (results.memories.length > 0) {
      console.log(`[Memory] 找到 ${results.memories.length} 条相关记忆`);
      return results.memories.map(m => m.memory);
    }
    
    return [];
  } catch (error) {
    console.error('[Memory] 搜索记忆失败:', error);
    return [];
  }
}

/**
 * 构建包含记忆的系统提示词
 */
export function buildMemoryPrompt(memories: string[]): string {
  if (memories.length === 0) {
    return '';
  }
  
  const memoryList = memories.map((m, i) => `${i + 1}. ${m}`).join('\n');
  
  return `
<user_memories>
以下是关于用户的一些已知信息，请在回复时参考这些信息：
${memoryList}
</user_memories>
`;
}

/**
 * 在对话后提取并保存事实
 * 在 AI 响应完成后调用
 */
export async function extractAndSaveMemories(
  userContent: string,
  assistantContent: string
): Promise<void> {
  if (!isMemoryEnabled()) {
    return;
  }
  
  const assistantId = getCurrentAssistantId();
  const processor = getMemoryProcessor(assistantId);
  if (!processor) {
    console.log('[Memory] MemoryProcessor 未初始化，跳过记忆提取');
    return;
  }
  
  try {
    // 构建对话消息用于事实提取
    const messages: string[] = [
      `用户: ${userContent}`,
      `助手: ${assistantContent}`
    ];
    
    // 使用 processConversation 方法提取事实
    const result = await processor.processConversation(messages);
    
    if (result.addedCount > 0) {
      console.log(`[Memory] 成功提取并保存 ${result.addedCount} 条新记忆`);
    }
  } catch (error) {
    console.error('[Memory] 提取记忆失败:', error);
  }
}

/**
 * 为 API 消息注入记忆上下文
 * 在 prepareMessagesForApi 中调用
 */
export async function injectMemoryContext(
  apiMessages: any[],
  userContent: string
): Promise<any[]> {
  if (!isMemoryEnabled()) {
    return apiMessages;
  }
  
  try {
    const memories = await searchRelevantMemories(userContent);
    
    if (memories.length === 0) {
      return apiMessages;
    }
    
    const memoryPrompt = buildMemoryPrompt(memories);
    
    // 找到系统消息并注入记忆
    const modifiedMessages = apiMessages.map(msg => {
      if (msg.role === 'system') {
        return {
          ...msg,
          content: msg.content + '\n' + memoryPrompt
        };
      }
      return msg;
    });
    
    // 如果没有系统消息，添加一个包含记忆的系统消息
    const hasSystemMessage = apiMessages.some(msg => msg.role === 'system');
    if (!hasSystemMessage && memories.length > 0) {
      modifiedMessages.unshift({
        role: 'system',
        content: memoryPrompt.trim()
      });
    }
    
    console.log(`[Memory] 已注入 ${memories.length} 条记忆到对话上下文`);
    return modifiedMessages;
  } catch (error) {
    console.error('[Memory] 注入记忆上下文失败:', error);
    return apiMessages;
  }
}
