import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../shared/store';
import { loadTopicMessagesThunk } from '../shared/store/slices/newMessagesSlice';
import { EventEmitter, EVENT_NAMES } from '../shared/services/EventService';
import { dexieStorage } from '../shared/services/DexieStorageService';
import type { ChatTopic, Assistant } from '../shared/types/Assistant';

/**
 * useActiveTopic Hook
 * 自动触发消息加载和事件发送，无需在Redux reducer中初始化
 */
export function useActiveTopic(assistant: Assistant, initialTopic?: ChatTopic) {
  const dispatch = useDispatch();
  const [activeTopic, setActiveTopic] = useState<ChatTopic | null>(initialTopic || null);
  // 从Redux获取当前话题ID
  const currentTopicId = useSelector((state: RootState) => state.messages.currentTopicId);
  // 🚀 从Redux获取助手数据，优先使用Redux中的话题
  const reduxAssistant = useSelector((state: RootState) =>
    state.assistants.assistants.find(a => a.id === assistant?.id)
  );

  // ：话题变化时立即响应，无加载状态
  useEffect(() => {
    if (!activeTopic) return;

    console.log(`[useActiveTopic] 即时切换话题: ${activeTopic.name} (${activeTopic.id})`);

    // 1. 立即发送话题变更事件
    EventEmitter.emit(EVENT_NAMES.CHANGE_TOPIC, activeTopic);

    // 2. 🚀 立即加载话题消息（Cherry Studio模式）
    dispatch(loadTopicMessagesThunk(activeTopic.id) as any);
    console.log(`[useActiveTopic] 立即触发消息加载: ${activeTopic.id}`);
  }, [activeTopic, dispatch]);

  // ：助手变化时立即选择第一个话题
  useEffect(() => {
    if (!assistant) return;

    // 如果当前没有激活话题，或者激活话题不属于当前助手，则立即选择
    if (!activeTopic || activeTopic.assistantId !== assistant.id) {
      // 从助手的topicIds加载话题（使用新消息系统）
      if (Array.isArray(assistant.topicIds) && assistant.topicIds.length > 0) {
        // 后台异步加载第一个话题
        Promise.resolve().then(async () => {
          try {
            const firstTopic = await dexieStorage.getTopic(assistant.topicIds[0]);
            if (firstTopic) {
              console.log(`[useActiveTopic] 即时选择第一个话题: ${firstTopic.name}`);
              setActiveTopic(firstTopic);
            }
          } catch (error) {
            console.error(`[useActiveTopic] 加载第一个话题失败:`, error);
          }
        });
        return;
      }

      // 兜底：后台异步加载（不阻塞UI）
      console.log(`[useActiveTopic] 助手对象没有topics，后台加载`);
      Promise.resolve().then(async () => {
        try {
          const allTopics = await dexieStorage.getAllTopics();
          const assistantTopics = allTopics.filter(topic => topic.assistantId === assistant.id);

          if (assistantTopics.length > 0) {
            const sortedTopics = assistantTopics.sort((a, b) => {
              const timeA = new Date(a.lastMessageTime || a.updatedAt || a.createdAt || 0).getTime();
              const timeB = new Date(b.lastMessageTime || b.updatedAt || b.createdAt || 0).getTime();
              return timeB - timeA;
            });

            console.log(`[useActiveTopic] 后台加载完成，选择话题: ${sortedTopics[0].name}`);
            setActiveTopic(sortedTopics[0]);
          } else {
            console.log(`[useActiveTopic] 助手 ${assistant.name} 没有话题`);
            setActiveTopic(null);
          }
        } catch (error) {
          console.error(`[useActiveTopic] 后台加载助手话题失败:`, error);
          setActiveTopic(null);
        }
      });
    }
  }, [assistant, activeTopic]);

  // ：监听外部话题ID变化，立即响应
  useEffect(() => {
    if (!currentTopicId || !assistant) return;

    // 如果当前激活话题已经是目标话题，无需重复处理
    if (activeTopic?.id === currentTopicId) return;

    console.log(`[useActiveTopic] 外部话题ID变化，即时切换: ${currentTopicId}`);

    // 🌟 优先从Redux中查找话题（立即响应新创建的话题）
    const assistantToUse = reduxAssistant || assistant;
    if (assistantToUse?.topics) {
      const topicFromRedux = assistantToUse.topics.find(t => t.id === currentTopicId);
      if (topicFromRedux) {
        console.log(`[useActiveTopic] 从Redux立即获取话题: ${topicFromRedux.name}`);
        setActiveTopic(topicFromRedux);
        return;
      }
    }

    // 🔄 兜底：从数据库加载话题
    (async () => {
      try {
        const topic = await dexieStorage.getTopic(currentTopicId);

        if (topic && topic.assistantId === assistant.id) {
          console.log(`[useActiveTopic] 从数据库加载话题成功: ${topic.name}`);
          setActiveTopic(topic);
        } else if (topic) {
          console.warn(`[useActiveTopic] 话题 ${currentTopicId} 不属于当前助手 ${assistant.id}`);
        } else {
          console.warn(`[useActiveTopic] 找不到话题 ${currentTopicId}`);
        }
      } catch (error) {
        console.error(`[useActiveTopic] 从数据库加载话题失败:`, error);
      }
    })();
  }, [currentTopicId, assistant, activeTopic, reduxAssistant?.topics]);

  // ：提供即时切换话题的方法
  const switchToTopic = (topic: ChatTopic) => {
    console.log(`[useActiveTopic] 即时切换到话题: ${topic.name} (${topic.id})`);
    setActiveTopic(topic);
  };

  return {
    activeTopic,
    setActiveTopic: switchToTopic
  };
}

/**
 * 的话题管理器
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
      // 使用新的消息获取方式，避免直接访问已弃用的messages字段
      const messages = await dexieStorage.getMessagesByTopicId(id);
      return messages || [];
    } catch (error) {
      console.error(`[TopicManager] 获取话题 ${id} 的消息失败:`, error);
      return [];
    }
  },

  async removeTopic(id: string) {
    try {
      // TODO: 实现删除话题的逻辑，包括删除相关文件
      await dexieStorage.deleteTopic(id);
      console.log(`[TopicManager] 话题 ${id} 删除成功`);
    } catch (error) {
      console.error(`[TopicManager] 删除话题 ${id} 失败:`, error);
      throw error;
    }
  }
};
