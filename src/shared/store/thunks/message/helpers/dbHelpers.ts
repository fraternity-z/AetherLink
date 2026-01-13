/**
 * 数据库更新辅助函数
 * 用于消息和话题的数据库操作
 * 重构：移除冗余的 topic.messages 写入，只使用 messages 表
 */
import { dexieStorage } from '../../../../services/storage/DexieStorageService';
import type { Message, MessageBlock } from '../../../../types/newMessage';

/**
 * 更新消息数据
 * 重构：只更新 messages 表，不再维护冗余的 topic.messages
 */
export async function updateMessageAndTopic(
  messageId: string,
  _topicId: string,
  changes: Partial<Message>
): Promise<void> {
  await dexieStorage.updateMessage(messageId, changes);
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
