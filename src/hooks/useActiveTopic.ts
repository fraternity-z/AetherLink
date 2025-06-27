import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../shared/store';
import { loadTopicMessagesThunk } from '../shared/store/slices/newMessagesSlice';
import { EventEmitter, EVENT_NAMES } from '../shared/services/EventService';
import { dexieStorage } from '../shared/services/storage/DexieStorageService';
import { topicCacheManager } from '../shared/services/TopicCacheManager';
import type { ChatTopic, Assistant } from '../shared/types/Assistant';

/**
 * useActiveTopic Hook
 * 自动触发消息加载和事件发送，无需在Redux reducer中初始化
 */
export function useActiveTopic(assistant: Assistant, initialTopic?: ChatTopic) {
  const dispatch = useDispatch();
  const [activeTopic, setActiveTopic] = useState<ChatTopic | null>(initialTopic || null);
  const isMountedRef = useRef(true);
  const previousAssistantIdRef = useRef<string | undefined>(undefined);

  // 从Redux获取当前话题ID
  const currentTopicId = useSelector((state: RootState) => state.messages.currentTopicId);
  // 从Redux获取助手数据，优先使用Redux中的话题
  const reduxAssistant = useSelector((state: RootState) =>
    state.assistants.assistants.find(a => a.id === assistant?.id)
  );

  // 使用 useMemo 缓存 Redux topics，避免不必要的重新渲染
  const reduxTopics = useMemo(() => reduxAssistant?.topics || [], [reduxAssistant?.topics]);

  // 安全的setState函数，检查组件是否已卸载
  const safeSetActiveTopic = useCallback((topic: ChatTopic | null) => {
    if (isMountedRef.current) {
      setActiveTopic(topic);
    }
  }, []);

  // 提取共用的话题获取逻辑 - 使用缓存管理器
  const findTopicById = useCallback(async (topicId: string): Promise<ChatTopic | null> => {
    // 优先从 Redux 中查找
    const topicFromRedux = reduxTopics.find(t => t.id === topicId);
    if (topicFromRedux) {
      return topicFromRedux;
    }

    // 使用缓存管理器从数据库查找，避免重复查询
    try {
      const topic = await topicCacheManager.getTopic(topicId);
      return topic;
    } catch (error) {
      console.error(`[useActiveTopic] 获取话题 ${topicId} 失败:`, error);
      return null;
    }
  }, [reduxTopics]);

  // 获取助手的第一个话题
  const getFirstTopicForAssistant = useCallback(async (assistantId: string, topicIds?: string[]): Promise<ChatTopic | null> => {
    // 优先使用 Redux 中的话题
    if (reduxTopics.length > 0) {
      return reduxTopics[0];
    }

    // 使用助手的 topicIds
    if (Array.isArray(topicIds) && topicIds.length > 0) {
      const firstTopic = await topicCacheManager.getTopic(topicIds[0]);
      if (firstTopic) {
        return firstTopic;
      }
    }

    // 从数据库查找所有相关话题
    try {
      const allTopics = await dexieStorage.getAllTopics();
      const assistantTopics = allTopics.filter(topic => topic.assistantId === assistantId);

      if (assistantTopics.length > 0) {
        // 选择最新的话题
        return assistantTopics.sort((a, b) => {
          const timeA = new Date(a.lastMessageTime || a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.lastMessageTime || b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        })[0];
      }
    } catch (error) {
      console.error(`[useActiveTopic] 查找助手话题失败:`, error);
    }

    return null;
  }, [reduxTopics]);

  // 清理函数：组件卸载时设置标记
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Effect 1: 话题变化时触发事件和加载消息
  useEffect(() => {
    if (!activeTopic) return;

    console.log(`[useActiveTopic] 话题变更: ${activeTopic.name} (${activeTopic.id})`);

    // 发送话题变更事件
    EventEmitter.emit(EVENT_NAMES.CHANGE_TOPIC, activeTopic);

    // 加载话题消息
    dispatch(loadTopicMessagesThunk(activeTopic.id) as any);
  }, [activeTopic, dispatch]); // 依赖整个对象，确保一致性

  // Effect 2: 助手变化时设置第一个话题
  useEffect(() => {
    if (!assistant?.id) return;

    // 检查是否是新的助手
    const isNewAssistant = previousAssistantIdRef.current !== assistant.id;
    previousAssistantIdRef.current = assistant.id;

    if (!isNewAssistant) return;

    // 重置当前话题
    safeSetActiveTopic(null);

    // 使用 AbortController 来取消异步操作
    const abortController = new AbortController();

    // 异步加载第一个话题
    const loadFirstTopic = async () => {
      try {
        const firstTopic = await getFirstTopicForAssistant(assistant.id, assistant.topicIds);

        // 检查是否已取消
        if (abortController.signal.aborted) return;

        if (firstTopic && isMountedRef.current) {
          console.log(`[useActiveTopic] 设置助手的第一个话题: ${firstTopic.name}`);
          safeSetActiveTopic(firstTopic);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error(`[useActiveTopic] 加载助手话题失败:`, error);
        }
      }
    };

    loadFirstTopic();

    // 清理函数：取消异步操作
    return () => {
      abortController.abort();
    };
  }, [assistant?.id, getFirstTopicForAssistant, safeSetActiveTopic]);

  // Effect 3: 响应外部话题ID变化
  useEffect(() => {
    if (!currentTopicId || !assistant?.id) return;

    // 如果已经是当前话题，跳过
    if (activeTopic?.id === currentTopicId) return;

    // 使用 AbortController 来取消异步操作
    const abortController = new AbortController();

    const loadTopicById = async () => {
      try {
        const topic = await findTopicById(currentTopicId);

        // 检查是否已取消
        if (abortController.signal.aborted) return;

        if (!isMountedRef.current) return;

        if (topic && topic.assistantId === assistant.id) {
          console.log(`[useActiveTopic] 切换到话题: ${topic.name}`);
          safeSetActiveTopic(topic);
        } else if (topic) {
          console.warn(`[useActiveTopic] 话题 ${currentTopicId} 不属于当前助手`);
        } else {
          console.warn(`[useActiveTopic] 找不到话题 ${currentTopicId}`);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error(`[useActiveTopic] 加载话题失败:`, error);
        }
      }
    };

    loadTopicById();

    // 清理函数：取消异步操作
    return () => {
      abortController.abort();
    };
  }, [currentTopicId, assistant?.id, activeTopic?.id, findTopicById, safeSetActiveTopic]);

  // 提供即时切换话题的方法
  const switchToTopic = useCallback((topic: ChatTopic) => {
    console.log(`[useActiveTopic] 即时切换到话题: ${topic.name} (${topic.id})`);
    safeSetActiveTopic(topic);
  }, [safeSetActiveTopic]);

  return {
    activeTopic,
    setActiveTopic: switchToTopic
  };
}

/**
 * 话题管理器
 * 提供话题的基本操作方法
 */
export const TopicManager = {
  async getTopic(id: string): Promise<ChatTopic | null> {
    try {
      return await dexieStorage.getTopic(id);
    } catch (error) {
      console.error(`[TopicManager] 获取话题 ${id} 失败:`, error);
      return null;
    }
  },

  async getAllTopics(): Promise<ChatTopic[]> {
    try {
      return await dexieStorage.getAllTopics();
    } catch (error) {
      console.error('[TopicManager] 获取所有话题失败:', error);
      return [];
    }
  },

  async getTopicMessages(id: string) {
    try {
      const messages = await dexieStorage.getMessagesByTopicId(id);
      return messages || [];
    } catch (error) {
      console.error(`[TopicManager] 获取话题 ${id} 的消息失败:`, error);
      return [];
    }
  },

  async removeTopic(id: string) {
    try {
      await dexieStorage.deleteTopic(id);
      console.log(`[TopicManager] 话题 ${id} 删除成功`);
    } catch (error) {
      console.error(`[TopicManager] 删除话题 ${id} 失败:`, error);
      throw error;
    }
  }
};