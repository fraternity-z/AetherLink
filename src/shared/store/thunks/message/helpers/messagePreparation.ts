/**
 * 消息准备辅助函数
 */
import { dexieStorage } from '../../../../services/storage/DexieStorageService';
import type { Message } from '../../../../types/newMessage';

/**
 * 准备原始消息（用于 Gemini provider）
 */
export async function prepareOriginalMessages(
  topicId: string,
  assistantMessage: Message
): Promise<Message[]> {
  const originalMessages = await dexieStorage.getTopicMessages(topicId);
  const sortedMessages = [...originalMessages].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const assistantMessageTime = new Date(assistantMessage.createdAt).getTime();
  return sortedMessages.filter(message => {
    if (message.id === assistantMessage.id || message.role === 'system') {
      return false;
    }
    return new Date(message.createdAt).getTime() < assistantMessageTime;
  });
}

/**
 * 提取 Gemini 系统提示词
 */
export function extractGeminiSystemPrompt(apiMessages: any[]): string {
  const systemMessage = apiMessages.find((msg: any) => msg.role === 'system');
  const content = systemMessage?.content;
  return typeof content === 'string' ? content : '';
}
