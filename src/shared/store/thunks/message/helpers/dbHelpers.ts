/**
 * 数据库更新辅助函数
 * 用于消息和话题的数据库操作
 */
import { dexieStorage } from '../../../../services/storage/DexieStorageService';
import type { Message, MessageBlock } from '../../../../types/newMessage';

/**
 * 更新消息和话题中的消息数据
 * 统一处理 messages 表和 topic.messages 数组的更新
 */
export async function updateMessageAndTopic(
  messageId: string,
  topicId: string,
  changes: Partial<Message>
): Promise<void> {
  await dexieStorage.transaction('rw', [
    dexieStorage.messages,
    dexieStorage.topics
  ], async () => {
    // 更新 messages 表
    await dexieStorage.updateMessage(messageId, changes);

    // 更新 topic.messages 数组
    const topic = await dexieStorage.topics.get(topicId);
    if (topic && topic.messages) {
      const messageIndex = topic.messages.findIndex((m: Message) => m.id === messageId);
      if (messageIndex >= 0) {
        topic.messages[messageIndex] = {
          ...topic.messages[messageIndex],
          ...changes
        };
        await dexieStorage.topics.put(topic);
      }
    }
  });
}

/**
 * 保存消息块到数据库
 */
export async function saveBlockToDB(block: MessageBlock): Promise<void> {
  await dexieStorage.saveMessageBlock(block);
}

/**
 * 批量保存消息块
 */
export async function saveBlocksToDB(blocks: MessageBlock[]): Promise<void> {
  for (const block of blocks) {
    await dexieStorage.saveMessageBlock(block);
  }
}
