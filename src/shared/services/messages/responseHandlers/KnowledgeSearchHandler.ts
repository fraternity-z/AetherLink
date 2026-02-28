import store from '../../../store';
import { dexieStorage } from '../../storage/DexieStorageService';
import { newMessagesActions } from '../../../store/slices/newMessagesSlice';
import { addOneBlock } from '../../../store/slices/messageBlocksSlice';
import { createCitationBlock } from '../../../utils/messageUtils';
import type { KnowledgeReferenceItem } from '../../../types/newMessage';

/**
 * 知识库搜索处理器 - 处理知识库搜索相关的逻辑
 * 使用统一的 CitationBlock 渲染知识库引用
 */
export class KnowledgeSearchHandler {
  private messageId: string;

  constructor(messageId: string) {
    this.messageId = messageId;
  }

  /**
   * 处理知识库搜索完成事件
   * 创建统一的 CitationBlock（替代旧的 KnowledgeReferenceBlock）
   */
  async handleKnowledgeSearchComplete(data: {
    messageId: string;
    knowledgeBaseId?: string;
    knowledgeBaseName?: string;
    knowledgeBaseIds?: string[];
    knowledgeBaseNames?: string[];
    searchQuery: string;
    searchResults: any[];
    references: any[];
  }) {
    try {
      console.log(`[KnowledgeSearchHandler] 处理知识库搜索完成，创建统一引用块，包含 ${data.searchResults.length} 个结果`);

      // 将搜索结果转换为统一的 KnowledgeReferenceItem 格式
      const knowledgeItems: KnowledgeReferenceItem[] = data.references.map((ref, index) => ({
        index: index + 1,
        content: ref.content,
        similarity: ref.similarity,
        documentId: ref.documentId,
        knowledgeBaseId: ref.knowledgeBaseId || data.knowledgeBaseId,
        knowledgeBaseName: ref.knowledgeBaseName || data.knowledgeBaseName,
        sourceUrl: ref.sourceUrl || `knowledge://${ref.knowledgeBaseId || data.knowledgeBaseId}/${ref.documentId || (index + 1)}`,
      }));

      // 创建统一引用块
      const citationBlock = createCitationBlock(this.messageId, {
        knowledge: knowledgeItems,
        searchQuery: data.searchQuery,
        knowledgeBaseIds: data.knowledgeBaseIds || (data.knowledgeBaseId ? [data.knowledgeBaseId] : []),
        knowledgeBaseNames: data.knowledgeBaseNames || (data.knowledgeBaseName ? [data.knowledgeBaseName] : []),
      });

      console.log(`[KnowledgeSearchHandler] 创建统一引用块: ${citationBlock.id}`);

      // 添加到Redux状态
      store.dispatch(addOneBlock(citationBlock));

      // 保存到数据库
      await dexieStorage.saveMessageBlock(citationBlock);

      // 将块添加到消息的blocks数组的开头（显示在顶部）
      const currentMessage = store.getState().messages.entities[this.messageId];
      if (currentMessage) {
        const updatedBlocks = [citationBlock.id, ...(currentMessage.blocks || [])];

        // 更新Redux中的消息
        store.dispatch(newMessagesActions.updateMessage({
          id: this.messageId,
          changes: {
            blocks: updatedBlocks
          }
        }));

        // 同步更新数据库
        await dexieStorage.updateMessage(this.messageId, {
          blocks: updatedBlocks
        });

        console.log(`[KnowledgeSearchHandler] 统一引用块已添加到消息顶部: ${citationBlock.id}`);
      }

      console.log(`[KnowledgeSearchHandler] 统一引用块创建完成，包含 ${knowledgeItems.length} 条知识库引用`);

    } catch (error) {
      console.error(`[KnowledgeSearchHandler] 处理知识库搜索完成事件失败:`, error);
    }
  }
}
