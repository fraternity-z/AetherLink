/**
 * 消息块创建辅助函数
 */
import { v4 as uuid } from 'uuid';
import { MessageBlockStatus, MessageBlockType } from '../../../../types/newMessage';
import type { MessageBlock } from '../../../../types/newMessage';

/**
 * 创建占位符块
 */
export function createPlaceholderBlock(messageId: string): MessageBlock {
  return {
    id: uuid(),
    messageId,
    type: MessageBlockType.UNKNOWN,
    content: '',
    createdAt: new Date().toISOString(),
    status: MessageBlockStatus.PROCESSING
  };
}
