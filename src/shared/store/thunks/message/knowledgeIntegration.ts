import { newMessagesActions } from '../../slices/newMessagesSlice';
import { DataRepository } from '../../../services/storage/DataRepository';
import { MobileKnowledgeService } from '../../../services/knowledge/MobileKnowledgeService';
import { getMainTextContent } from '../../../utils/blockUtils';
import { AssistantMessageStatus } from '../../../types/newMessage';
import type { Message } from '../../../types/newMessage';
import type { AppDispatch, RootState } from '../../index';
import { getKnowledgeSelectionFromStore } from '../../../hooks/useKnowledgeContext';
import { clearSelectedKnowledgeBase } from '../../slices/knowledgeSelectionSlice';
import type { SelectedKnowledgeInfo } from '../../slices/knowledgeSelectionSlice';

export const processKnowledgeSearch = async (
  assistantMessage: Message,
  topicId: string,
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  try {
    console.log('[processKnowledgeSearch] 开始检查知识库选择状态...');

    const state = getState();
    // 优先使用多选列表，兼容旧的单选
    const selectedKBs = state.knowledgeSelection.selectedKnowledgeBases;
    const contextData = getKnowledgeSelectionFromStore(state);

    if (selectedKBs.length === 0 && !contextData) {
      console.log('[processKnowledgeSearch] 没有选中知识库，直接返回');
      return;
    }

    // 确定要搜索的知识库列表
    const knowledgeBasesToSearch: SelectedKnowledgeInfo[] = selectedKBs.length > 0
      ? selectedKBs
      : contextData ? [contextData.knowledgeBase] : [];

    if (knowledgeBasesToSearch.length === 0) {
      return;
    }

    console.log(`[processKnowledgeSearch] 检测到 ${knowledgeBasesToSearch.length} 个知识库，开始并行搜索...`);

    // 设置消息状态为搜索中
    dispatch(newMessagesActions.updateMessage({
      id: assistantMessage.id,
      changes: {
        status: AssistantMessageStatus.SEARCHING
      }
    }));

    // 统一架构：从 messages 表加载消息
    const topic = await DataRepository.topics.getById(topicId);
    if (!topic || !topic.messageIds?.length) {
      console.warn('[processKnowledgeSearch] 无法获取话题消息');
      return;
    }

    // 从 messages 表加载消息
    const messages = await DataRepository.messages.getByTopicId(topicId);
    
    // 找到最后一条用户消息
    const userMessage = messages
      .filter((m: Message) => m.role === 'user')
      .pop();

    if (!userMessage) {
      console.warn('[processKnowledgeSearch] 未找到用户消息');
      return;
    }

    // 获取用户消息的文本内容
    const userContent = getMainTextContent(userMessage);
    if (!userContent) {
      console.warn('[processKnowledgeSearch] 用户消息内容为空');
      return;
    }

    // 并行搜索所有选中的知识库
    const knowledgeService = MobileKnowledgeService.getInstance();
    const searchPromises = knowledgeBasesToSearch.map(async (kb) => {
      try {
        const results = await knowledgeService.search({
          knowledgeBaseId: kb.id,
          query: userContent.trim(),
          threshold: 0.6,
          limit: kb.documentCount || 5,
          useEnhancedRAG: true
        });
        return { kb, results };
      } catch (err) {
        console.warn(`[processKnowledgeSearch] 知识库 "${kb.name}" 搜索失败:`, err);
        return { kb, results: [] };
      }
    });

    const allSearchResults = await Promise.all(searchPromises);

    // 合并所有结果并按相似度降序排列
    let globalIndex = 1;
    const allReferences: Array<{
      id: number;
      content: string;
      type: 'file';
      similarity: number;
      knowledgeBaseId: string;
      knowledgeBaseName: string;
      sourceUrl: string;
    }> = [];

    for (const { kb, results } of allSearchResults) {
      for (const result of results) {
        allReferences.push({
          id: globalIndex++,
          content: result.content,
          type: 'file' as const,
          similarity: result.similarity,
          knowledgeBaseId: kb.id,
          knowledgeBaseName: kb.name,
          sourceUrl: `knowledge://${kb.id}/${result.documentId || (globalIndex - 1)}`
        });
      }
    }

    // 按相似度降序排列
    allReferences.sort((a, b) => b.similarity - a.similarity);

    // 重新编号
    allReferences.forEach((ref, i) => { ref.id = i + 1; });

    const totalResults = allReferences.length;
    console.log(`[processKnowledgeSearch] 并行搜索完成: ${knowledgeBasesToSearch.length} 个知识库, ${totalResults} 个结果`);

    if (totalResults > 0) {
      // 缓存搜索结果
      const cacheKey = `knowledge-search-${userMessage.id}`;
      window.sessionStorage.setItem(cacheKey, JSON.stringify(allReferences));
      console.log(`[processKnowledgeSearch] 知识库搜索结果已缓存: ${cacheKey}`);
    }

    // 清除知识库选择状态
    dispatch(clearSelectedKnowledgeBase());

  } catch (error) {
    console.error('[processKnowledgeSearch] 知识库搜索失败:', error);
    dispatch(clearSelectedKnowledgeBase());
  }
};