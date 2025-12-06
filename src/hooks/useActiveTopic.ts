import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../shared/store';
import { loadTopicMessagesThunk, newMessagesActions } from '../shared/store/slices/newMessagesSlice';
import { dexieStorage } from '../shared/services/storage/DexieStorageService';
import { topicCacheManager } from '../shared/services/TopicCacheManager';
import type { ChatTopic, Assistant } from '../shared/types/Assistant';

// 模块级变量，支持外部访问（类似 Cherry Studio）
let _activeTopic: ChatTopic | null = null;

/**
 * useActiveTopic Hook - 简化版本
 * 🚀 优化：将 4 个 Effect 简化为 1 个，使用 useMemo 计算 activeTopic
 * 参考 Cherry Studio 的简洁实现
 */
export function useActiveTopic(assistant: Assistant, initialTopic?: ChatTopic) {
  const dispatch = useDispatch();
  const isMountedRef = useRef(true);

  // 从 Redux 获取当前话题 ID
  const currentTopicId = useSelector((state: RootState) => state.messages.currentTopicId);
  
  // 从 Redux 获取助手的话题列表（优先数据源）
  const reduxAssistant = useSelector((state: RootState) =>
    state.assistants.assistants.find((a: Assistant) => a.id === assistant?.id)
  );
  
  // 使用 useMemo 缓存 Redux topics，避免不必要的重新渲染
  const reduxTopics = useMemo<ChatTopic[]>(() => reduxAssistant?.topics || [], [reduxAssistant?.topics]);

  // 🚀 核心优化：使用 useMemo 计算当前活跃话题（无需本地 state）
  // 单一数据源：Redux 中的 currentTopicId + reduxTopics
  const activeTopic = useMemo<ChatTopic | null>(() => {
    // 1. 优先使用 currentTopicId 指定的话题
    if (currentTopicId) {
      const found = reduxTopics.find((t: ChatTopic) => t.id === currentTopicId);
      if (found) {
        return found;
      }
    }
    // 2. 使用初始话题
    if (initialTopic && reduxTopics.find((t: ChatTopic) => t.id === initialTopic.id)) {
      return initialTopic;
    }
    // 3. 使用第一个话题
    return reduxTopics[0] || null;
  }, [currentTopicId, reduxTopics, initialTopic]);

  // 更新模块级变量，供外部访问
  _activeTopic = activeTopic;

  // 🚀 优化：使用 ref 追踪上次的话题ID，避免重复加载
  const previousTopicIdRef = useRef<string | null>(null);

  // 清理函数：组件卸载时设置标记
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 唯一的 Effect：话题变化时加载消息
  // 🚀 简化：只有一个 Effect，减少 Effect 链带来的复杂性
  useEffect(() => {
    if (!activeTopic?.id) {
      previousTopicIdRef.current = null;
      return;
    }

    // 如果话题ID没有变化，跳过
    if (previousTopicIdRef.current === activeTopic.id) {
      return;
    }

    previousTopicIdRef.current = activeTopic.id;
    console.log(`[useActiveTopic] 话题变更: ${activeTopic.name} (${activeTopic.id})`);

    // 更新缓存
    topicCacheManager.updateTopic(activeTopic.id, activeTopic);

    // 加载话题消息
    dispatch(loadTopicMessagesThunk(activeTopic.id) as any);
  }, [activeTopic?.id, activeTopic?.name, dispatch]);

  // 提供即时切换话题的方法
  const switchToTopic = useCallback((topic: ChatTopic) => {
    if (!isMountedRef.current) return;
    
    console.log(`[useActiveTopic] 即时切换到话题: ${topic.name} (${topic.id})`);
    // 通过 Redux 设置当前话题ID，useMemo 会自动重新计算 activeTopic
    dispatch(newMessagesActions.setCurrentTopicId(topic.id));
    // 更新缓存
    topicCacheManager.updateTopic(topic.id, topic);
  }, [dispatch]);

  return {
    activeTopic,
    setActiveTopic: switchToTopic
  };
}

// 导出获取当前话题的函数
export const getActiveTopic = () => _activeTopic;

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