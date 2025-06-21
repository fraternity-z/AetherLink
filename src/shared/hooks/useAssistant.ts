import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dexieStorage } from '../services/DexieStorageService';
import { EventEmitter, EVENT_NAMES } from '../services/EventService';
import { addTopic, removeTopic, updateTopic } from '../store/slices/assistantsSlice';
import type { RootState } from '../store';
import type { Assistant, ChatTopic } from '../types/Assistant';
// 导入getDefaultTopic函数，避免动态导入
import { getDefaultTopic } from '../services/assistant/types';

/**
 * 助手钩子 - 加载助手及其关联的话题
 * 参考最佳实例实现，但适配移动端的数据结构
 */
export function useAssistant(assistantId: string | null) {
  const dispatch = useDispatch();
  const assistants = useSelector((state: RootState) => state.assistants.assistants);
  const assistant = assistantId
    ? assistants.find((a: Assistant) => a.id === assistantId) || null
    : null;

  // ：移除加载状态，即时响应



  const loadAssistantTopics = useCallback(async (forceRefresh = false) => {
    if (!assistantId || !assistant) {
      return;
    }

    // 优化：检查助手是否已经有话题ID数据，除非强制刷新，否则无需异步加载
    // 使用新消息系统：检查topicIds而不是topics
    if (!forceRefresh && assistant.topicIds && assistant.topicIds.length > 0) {
      console.log(`[useAssistant] 助手 ${assistant.name} 已有话题ID数据，数量: ${assistant.topicIds.length}，跳过加载`);
      return;
    }

    // 如果是强制刷新或没有话题数据
    if (forceRefresh) {
      console.log(`[useAssistant] 强制刷新助手 ${assistant.name} 的话题数据`);
      // 这里可以添加从数据库重新加载话题的逻辑
      // 但目前助手数据已经预加载，通常不需要强制刷新
    } else {
      console.log(`[useAssistant] 助手 ${assistant.name} 没有话题数据，后台创建默认话题`);
    }

    // 后台异步创建默认话题，不阻塞UI
    Promise.resolve().then(async () => {
      try {
        const newTopic = getDefaultTopic(assistantId);
        await dexieStorage.saveTopic(newTopic);
        // 使用新消息系统：添加话题到助手
        dispatch(addTopic({ assistantId, topic: newTopic }));
        console.log(`[useAssistant] 后台创建默认话题完成: ${newTopic.name}`);
      } catch (error) {
        console.error('[useAssistant] 后台创建默认话题失败:', error);
      }
    });
  }, [assistantId, assistant, dispatch]);

  useEffect(() => {
    loadAssistantTopics();
  }, [loadAssistantTopics]);

  useEffect(() => {
    if (!assistantId) return;

    const handleTopicChange = (eventData: any) => {
      if (eventData && (eventData.assistantId === assistantId || !eventData.assistantId)) {
        loadAssistantTopics();
      }
    };

    const unsubCreate = EventEmitter.on(EVENT_NAMES.TOPIC_CREATED, handleTopicChange);
    const unsubDelete = EventEmitter.on(EVENT_NAMES.TOPIC_DELETED, handleTopicChange);
    const unsubClear = EventEmitter.on(EVENT_NAMES.TOPICS_CLEARED, handleTopicChange);

    return () => {
      unsubCreate();
      unsubDelete();
      unsubClear();
    };
  }, [assistantId, loadAssistantTopics]);

  const addTopicToAssistant = useCallback(async (topic: ChatTopic) => {
    if (!assistantId) return false;

    if (topic.assistantId !== assistantId) {
        console.warn(`addTopicToAssistant: Topic ${topic.id} had assistantId ${topic.assistantId}. Forcing to current assistant ${assistantId}.`);
        topic.assistantId = assistantId;
    }

    try {
      // 保存话题到数据库
      await dexieStorage.saveTopic(topic);

      // 更新Redux状态
      dispatch(addTopic({ assistantId, topic }));
      return true;
    } catch (err) {
      console.error('添加话题失败:', err);
      return false;
    }
  }, [assistantId, dispatch]);

  const removeTopicFromAssistant = useCallback(async (topicId: string) => {
    if (!assistantId) return false;

    try {
      await dexieStorage.deleteTopic(topicId);

      dispatch(removeTopic({ assistantId, topicId }));
      return true;
    } catch (err) {
      console.error('删除话题失败:', err);
      return false;
    }
  }, [assistantId, dispatch]);

  const updateAssistantTopic = useCallback(async (topic: ChatTopic) => {
    if (!assistantId) return false;

    if (topic.assistantId !== assistantId) {
        console.warn(`updateAssistantTopic: Topic ${topic.id} had assistantId ${topic.assistantId}. Forcing to current assistant ${assistantId}.`);
        topic.assistantId = assistantId;
    }

    try {
      await dexieStorage.saveTopic(topic);
      dispatch(updateTopic({ assistantId, topic }));
      return true;
    } catch (err) {
      console.error('更新话题失败:', err);
      return false;
    }
  }, [assistantId, dispatch]);

  return {
    assistant,
    addTopic: addTopicToAssistant,
    removeTopic: removeTopicFromAssistant,
    updateTopic: updateAssistantTopic,
    refreshTopics: loadAssistantTopics
  };
}