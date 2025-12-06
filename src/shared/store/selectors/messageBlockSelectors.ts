import type { RootState } from '../index';
import type { MessageBlock } from '../../types/newMessage';
import { MessageBlockType } from '../../types/newMessage';
import type { Citation } from '../../types/citation';
import { extractCitationsFromToolBlock, isWebSearchToolBlock } from '../../utils/citation';

// 稳定的空数组引用
const EMPTY_CITATIONS_ARRAY: Citation[] = [];

// 数组浅比较工具函数
const shallowArrayEqual = <T>(a: T[], b: T[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// 单块查询
export const selectBlockById = (state: RootState, blockId?: string) =>
  blockId ? state.messageBlocks.entities[blockId] : undefined;

// 根据块ID数组查询块实体 - 优化版本
// 使用双重缓存：输入参数缓存 + 结果缓存
const createSelectBlocksByIds = () => {
  let lastEntities: Record<string, MessageBlock | undefined> = {};
  let lastBlockIds: string[] = [];
  let lastResult: MessageBlock[] = [];

  return (state: RootState, blockIds: string[]): MessageBlock[] => {
    const entities = state.messageBlocks.entities;

    // 检查输入是否完全相同
    const entitiesUnchanged = entities === lastEntities;
    const blockIdsUnchanged = shallowArrayEqual(blockIds, lastBlockIds);

    if (entitiesUnchanged && blockIdsUnchanged) {
      return lastResult;
    }

    // 计算新结果
    const result = blockIds
      .map(id => entities[id])
      .filter((block): block is MessageBlock => block !== undefined);

    // 检查结果是否实际变化（即使输入变化，结果可能相同）
    if (shallowArrayEqual(result, lastResult)) {
      // 更新输入缓存，但复用旧结果
      lastEntities = entities;
      lastBlockIds = blockIds;
      return lastResult;
    }

    // 完全更新缓存
    lastEntities = entities;
    lastBlockIds = blockIds;
    lastResult = result;

    return result;
  };
};

export const selectBlocksByIds = createSelectBlocksByIds();

// 检查指定块ID数组中是否存在流式块
export const selectHasStreamingBlock = (state: RootState, blockIds: string[]): boolean => {
  const blocks = selectBlocksByIds(state, blockIds);
  return blocks.some(block => block.status === 'streaming');
};

// 针对消息的引用提取：只遍历该消息的块
// 使用闭包缓存优化记忆化
const citationsForMessageCache = new Map<string, {
  blockEntities: Record<string, any>;
  messageBlocks: string[] | undefined;
  result: Citation[];
}>();

export const selectCitationsForMessage = (state: RootState, messageId?: string): Citation[] => {
  if (!messageId) return EMPTY_CITATIONS_ARRAY;
  
  const blockEntities = state.messageBlocks.entities;
  const message = state.messages.entities[messageId];
  const messageBlocks = message?.blocks;
  
  if (!messageBlocks) return EMPTY_CITATIONS_ARRAY;
  
  // 获取缓存
  const cached = citationsForMessageCache.get(messageId);
  
  if (cached &&
      cached.blockEntities === blockEntities &&
      cached.messageBlocks === messageBlocks) {
    return cached.result;
  }
  
  // 计算新结果
  const citations: Citation[] = [];
  for (const blockId of messageBlocks) {
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
  
  // 如果结果为空，返回稳定的空数组
  if (citations.length === 0) {
    citationsForMessageCache.set(messageId, {
      blockEntities,
      messageBlocks,
      result: EMPTY_CITATIONS_ARRAY
    });
    return EMPTY_CITATIONS_ARRAY;
  }
  
  // 检查结果是否相等
  if (cached && shallowArrayEqual(citations, cached.result)) {
    citationsForMessageCache.set(messageId, {
      blockEntities,
      messageBlocks,
      result: cached.result
    });
    return cached.result;
  }
  
  // 更新缓存
  citationsForMessageCache.set(messageId, {
    blockEntities,
    messageBlocks,
    result: citations
  });
  
  return citations;
};
