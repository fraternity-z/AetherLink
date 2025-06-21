import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import type { Message, MessageBlock } from '../../../shared/types/newMessage';
import { dexieStorage } from '../../../shared/services/storage/DexieStorageService';
import { upsertManyBlocks } from '../../../shared/store/slices/messageBlocksSlice';

export const useMessageBlocks = (
  message: Message, 
  blocks: MessageBlock[], 
  forceUpdate?: () => void
) => {
  const dispatch = useDispatch();
  const forceUpdateRef = useRef(forceUpdate);

  // 更新 forceUpdateRef 的当前值
  useEffect(() => {
    forceUpdateRef.current = forceUpdate;
  }, [forceUpdate]);

  // 如果Redux中没有块，从数据库加载
  useEffect(() => {
    const loadBlocks = async () => {
      if (blocks.length === 0 && message.blocks.length > 0) {
        try {
          const messageBlocks: MessageBlock[] = [];
          for (const blockId of message.blocks) {
            const block = await dexieStorage.getMessageBlock(blockId);
            if (block) {
              // 🔧 修复：验证对比分析块的数据完整性
              if ('subType' in block && (block as any).subType === 'comparison') {
                const comparisonBlock = block as any;
                if (!comparisonBlock.comboResult || !comparisonBlock.comboResult.modelResults) {
                  console.error(`[MessageItem] 对比分析块数据不完整: ${blockId}`);
                  continue; // 跳过损坏的块
                }
                console.log(`[MessageItem] 成功加载对比分析块: ${blockId}`);
              }

              // 🔧 修复：验证多模型块的数据完整性
              if (block.type === 'multi_model' && 'responses' in block) {
                const multiModelBlock = block as any;
                if (!multiModelBlock.responses || !Array.isArray(multiModelBlock.responses)) {
                  console.error(`[MessageItem] 多模型块数据不完整: ${blockId}`);
                  continue; // 跳过损坏的块
                }
              }
              messageBlocks.push(block);
            } else {
              console.warn(`[MessageItem] 数据库中找不到块: ID=${blockId}`);
            }
          }

          if (messageBlocks.length > 0) {
            dispatch(upsertManyBlocks(messageBlocks));
          } else {
            console.warn(`[MessageItem] 数据库中没有找到任何块: 消息ID=${message.id}`);
          }
        } catch (error) {
          console.error(`[MessageItem] 加载消息块失败: 消息ID=${message.id}`, error);
        }
      }
    };

    loadBlocks();
  }, [message.blocks, blocks.length, dispatch]);

  // 在块状态变化时，可以使用forceUpdate触发重新渲染
  useEffect(() => {
    if (message.status === 'streaming') {
      // 减少强制更新频率，避免过度渲染
      const interval = setInterval(() => {
        if (forceUpdateRef.current) {
          forceUpdateRef.current();
        }
      }, 500); // 每500ms更新一次

      return () => clearInterval(interval);
    }
  }, [message.status]);

  // 计算loading状态
  const loading = blocks.length === 0 && message.blocks.length > 0;

  return { loading };
};
