import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { MessageBlock } from '../../types/newMessage';
import { MessageBlockType } from '../../types/newMessage';
import type { Citation } from '../../types/citation';
import { extractCitationsFromToolBlock, isWebSearchToolBlock } from '../../utils/citation';

// 单块查询
export const selectBlockById = (state: RootState, blockId?: string) =>
  blockId ? state.messageBlocks.entities[blockId] : undefined;

// 根据块ID数组查询块实体，缓存 blockIds 内容不变时复用
export const selectBlocksByIds = createSelector(
  [
    (state: RootState) => state.messageBlocks.entities,
    (_state: RootState, blockIds: string[]) => blockIds
  ],
  (entities, blockIds): MessageBlock[] => {
    return blockIds
      .map(id => entities[id])
      .filter((block): block is MessageBlock => block !== undefined);
  },
  {
    memoizeOptions: {
      resultEqualityCheck: (a, b) => {
        if (a === b) return true;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i += 1) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }
    }
  }
);

// 检查指定块ID数组中是否存在流式块
export const selectHasStreamingBlock = createSelector(
  [selectBlocksByIds],
  (blocks) => blocks.some(block => block.status === 'streaming')
);

// 针对消息的引用提取：只遍历该消息的块
export const selectCitationsForMessage = createSelector(
  [
    (state: RootState) => state.messageBlocks.entities,
    (state: RootState) => state.messages.entities,
    (_state: RootState, messageId?: string) => messageId
  ],
  (blockEntities, messageEntities, messageId): Citation[] => {
    if (!messageId) return [];
    const message = messageEntities[messageId];
    if (!message?.blocks) return [];
    const citations: Citation[] = [];
    for (const blockId of message.blocks) {
      const block = blockEntities[blockId];
      if (!block) continue;
      // 直接支持 citation 块
      if (block.type === MessageBlockType.CITATION) {
        citations.push(...extractCitationsFromToolBlock(block as unknown as any));
      }
      // 兼容旧的 web search 工具块
      if (isWebSearchToolBlock(block as any)) {
        citations.push(...extractCitationsFromToolBlock(block as any));
      }
    }
    return citations;
  }
);
