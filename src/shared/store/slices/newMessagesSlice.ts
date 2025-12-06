import { createEntityAdapter, createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import type { Message, AssistantMessageStatus } from '../../types/newMessage.ts';
import type { RootState } from '../index';
import { dexieStorage } from '../../services/storage/DexieStorageService';
import { topicCacheManager } from '../../services/TopicCacheManager';
import { upsertManyBlocks } from './messageBlocksSlice';

// 1. 创建实体适配器
const messagesAdapter = createEntityAdapter<Message>();

// 常量定义
const MAX_GLOBAL_ERRORS = 10;
const MAX_TOPIC_ERRORS = 5;

// 错误信息接口
export interface ErrorInfo {
  message: string;
  code?: string | number;
  type?: string;
  timestamp: string;
  details?: string;
  context?: Record<string, any>;
}

// API Key 错误信息接口
export interface ApiKeyErrorInfo {
  message: string;
  originalError: any;
  timestamp: string;
  canRetry: boolean;
}

// 消息排序工具函数
const sortMessagesByTime = (messages: Message[]): Message[] =>
  [...messages].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

// 2. 定义状态接口
export interface NormalizedMessagesState extends EntityState<Message, string> {
  messageIdsByTopic: Record<string, string[]>; // 主题ID -> 消息ID数组的映射
  currentTopicId: string | null;
  loadingByTopic: Record<string, boolean>;
  streamingByTopic: Record<string, boolean>;
  fulfilledByTopic: Record<string, boolean>; // 追踪是否已完成加载
  displayCount: number;
  errors: ErrorInfo[]; // 错误信息数组，记录多个错误
  errorsByTopic: Record<string, ErrorInfo[]>; // 按主题分组的错误信息
  apiKeyErrors: Record<string, { messageId: string; error: ApiKeyErrorInfo }>; // API Key 错误状态，按主题分组
}

// 3. 定义初始状态
const initialState: NormalizedMessagesState = messagesAdapter.getInitialState({
  messageIdsByTopic: {},
  currentTopicId: null,
  loadingByTopic: {},
  streamingByTopic: {},
  fulfilledByTopic: {}, // 追踪是否已完成加载
  displayCount: 20,
  errors: [],
  errorsByTopic: {},
  apiKeyErrors: {}
});

// 定义 Payload 类型
interface MessagesReceivedPayload {
  topicId: string;
  messages: Message[];
}

interface SetTopicLoadingPayload {
  topicId: string;
  loading: boolean;
}

interface SetTopicStreamingPayload {
  topicId: string;
  streaming: boolean;
}

// 移除了额外的状态跟踪

interface AddMessagePayload {
  topicId: string;
  message: Message;
}

interface UpdateMessagePayload {
  id: string;
  changes: Partial<Message>;
}

interface UpdateMessageStatusPayload {
  topicId: string;
  messageId: string;
  status: AssistantMessageStatus;
}

interface RemoveMessagePayload {
  topicId: string;
  messageId: string;
}

interface SetErrorPayload {
  error: ErrorInfo;
  topicId?: string; // 可选的主题ID，用于按主题分组错误
}

// API Key 错误相关的 Payload 类型
interface SetApiKeyErrorPayload {
  topicId: string;
  messageId: string;
  error: ApiKeyErrorInfo;
}

interface ClearApiKeyErrorPayload {
  topicId: string;
}

// 添加块引用的Payload类型
interface UpsertBlockReferencePayload {
  messageId: string;
  blockId: string;
  status?: string;
}

// 4. 创建 Slice
const newMessagesSlice = createSlice({
  name: 'normalizedMessages',
  initialState,
  reducers: {
    // 设置当前主题
    setCurrentTopicId(state, action: PayloadAction<string | null>) {
      state.currentTopicId = action.payload;
      if (action.payload && !(action.payload in state.messageIdsByTopic)) {
        state.messageIdsByTopic[action.payload] = [];
        state.loadingByTopic[action.payload] = false;
        state.streamingByTopic[action.payload] = false;
      }
    },

    // 设置主题加载状态
    setTopicLoading(state, action: PayloadAction<SetTopicLoadingPayload>) {
      const { topicId, loading } = action.payload;
      state.loadingByTopic[topicId] = loading;
    },

    // 设置主题流式响应状态
    setTopicStreaming(state, action: PayloadAction<SetTopicStreamingPayload>) {
      const { topicId, streaming } = action.payload;
      state.streamingByTopic[topicId] = streaming;
    },

    // 设置话题是否已完成加载
    setTopicFulfilled(state, action: PayloadAction<{ topicId: string; fulfilled: boolean }>) {
      const { topicId, fulfilled } = action.payload;
      state.fulfilledByTopic[topicId] = fulfilled;
    },

    // 移除了额外的状态跟踪

    // 设置错误信息
    setError(state, action: PayloadAction<SetErrorPayload>) {
      const { error, topicId } = action.payload;

      // 添加到全局错误列表
      state.errors.push(error);

      // 如果超过最大错误数，移除最旧的
      if (state.errors.length > MAX_GLOBAL_ERRORS) {
        state.errors.shift();
      }

      // 如果提供了主题ID，添加到主题错误列表
      if (topicId) {
        if (!state.errorsByTopic[topicId]) {
          state.errorsByTopic[topicId] = [];
        }

        state.errorsByTopic[topicId].push(error);

        // 如果超过最大错误数，移除最旧的
        if (state.errorsByTopic[topicId].length > MAX_TOPIC_ERRORS) {
          state.errorsByTopic[topicId].shift();
        }
      }
    },

    // 设置 API Key 错误
    setApiKeyError(state, action: PayloadAction<SetApiKeyErrorPayload>) {
      const { topicId, messageId, error } = action.payload;
      state.apiKeyErrors[topicId] = { messageId, error };
    },

    // 清除 API Key 错误
    clearApiKeyError(state, action: PayloadAction<ClearApiKeyErrorPayload>) {
      const { topicId } = action.payload;
      delete state.apiKeyErrors[topicId];
    },

    // 更新消息状态
    updateMessageStatus(state, action: PayloadAction<UpdateMessageStatusPayload>) {
      const { messageId, status } = action.payload;
      const message = state.entities[messageId];
      if (message) {
        message.status = status;
      }
    },

    // 设置显示消息数量
    setDisplayCount(state, action: PayloadAction<number>) {
      state.displayCount = action.payload;
    },

    // 接收消息 - 优化版本：确保按时间顺序存储
    messagesReceived(state, action: PayloadAction<MessagesReceivedPayload>) {
      const { topicId, messages } = action.payload;

      // 添加或更新消息
      messagesAdapter.upsertMany(state, messages);

      // 使用优化的排序函数
      const sortedMessages = sortMessagesByTime(messages);
      const sortedMessageIds = sortedMessages.map(msg => msg.id);

      // 确保不会覆盖现有消息，但保持时间顺序
      if (!state.messageIdsByTopic[topicId]) {
        state.messageIdsByTopic[topicId] = sortedMessageIds;
      } else {
        // 合并现有消息ID和新消息ID，然后重新排序以保持时间顺序
        const existingIds = state.messageIdsByTopic[topicId];
        const newIds = sortedMessageIds.filter(id => !existingIds.includes(id));

        if (newIds.length > 0) {
          const allIds = [...existingIds, ...newIds];

          // 获取所有消息并按时间排序
          const allMessages = allIds
            .map(id => state.entities[id])
            .filter((msg): msg is Message => msg !== undefined);

          const sortedAllMessages = sortMessagesByTime(allMessages);
          state.messageIdsByTopic[topicId] = sortedAllMessages.map(msg => msg.id);
        }
      }
    },

    // 添加消息 - 优化版本：简化插入逻辑
    addMessage(state, action: PayloadAction<AddMessagePayload>) {
      const { topicId, message } = action.payload;

      // 添加消息
      messagesAdapter.addOne(state, message);

      // 确保主题存在
      if (!state.messageIdsByTopic[topicId]) {
        state.messageIdsByTopic[topicId] = [];
      }

      // 简化的插入逻辑：直接添加到末尾，然后重新排序
      const messageIds = state.messageIdsByTopic[topicId];

      // 如果消息不存在，添加它
      if (!messageIds.includes(message.id)) {
        messageIds.push(message.id);

        // 获取所有消息并重新排序
        const allMessages = messageIds
          .map(id => state.entities[id])
          .filter((msg): msg is Message => msg !== undefined);

        const sortedMessages = sortMessagesByTime(allMessages);
        state.messageIdsByTopic[topicId] = sortedMessages.map(msg => msg.id);
      }
    },

    // 更新消息
    updateMessage(state, action: PayloadAction<UpdateMessagePayload>) {
      messagesAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload.changes
      });
    },

    // 删除消息
    removeMessage(state, action: PayloadAction<RemoveMessagePayload>) {
      const { topicId, messageId } = action.payload;

      // 从实体中删除消息
      messagesAdapter.removeOne(state, messageId);

      // 从主题的消息ID数组中删除
      if (state.messageIdsByTopic[topicId]) {
        state.messageIdsByTopic[topicId] = state.messageIdsByTopic[topicId].filter(id => id !== messageId);
      }
    },

    // 清空主题的所有消息
    clearTopicMessages(state, action: PayloadAction<string>) {
      const topicId = action.payload;

      // 获取要删除的消息ID
      const messageIds = state.messageIdsByTopic[topicId] || [];

      // 删除消息
      messagesAdapter.removeMany(state, messageIds);

      // 清空主题的消息ID数组
      state.messageIdsByTopic[topicId] = [];
    },

    // 添加或更新块引用（按流式接收顺序追加到末尾）
    upsertBlockReference(state, action: PayloadAction<UpsertBlockReferencePayload>) {
      const { messageId, blockId } = action.payload;

      const messageToUpdate = state.entities[messageId];
      if (!messageToUpdate) {
        return;
      }

      const currentBlocks = messageToUpdate.blocks || [];

      // 如果块ID已在列表中，不重复添加
      if (currentBlocks.includes(blockId)) {
        return;
      }

      // 按流式顺序追加到末尾
      messagesAdapter.updateOne(state, {
        id: messageId,
        changes: { blocks: [...currentBlocks, blockId] }
      });
    }
  }
});

// 5. 导出 Actions
export const newMessagesActions = newMessagesSlice.actions;

// 6. 导出 Selectors
// 创建一个稳定的选择器函数，避免每次调用都返回新引用
const selectMessagesState = (state: RootState) => {
  if (!state.messages) {
    // 返回一个稳定的初始状态
    return messagesAdapter.getInitialState();
  }
  return state.messages;
};

export const {
  selectAll: selectAllMessages,
  selectById: selectMessageById,
  selectIds: selectMessageIds
} = messagesAdapter.getSelectors<RootState>(selectMessagesState);

// 创建稳定的空数组引用
const EMPTY_MESSAGES_ARRAY: Message[] = [];

// 数组浅比较工具函数
const shallowArrayEqual = <T>(a: T[], b: T[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// 自定义选择器 - 使用闭包缓存优化记忆化
// 使用 Map 缓存每个 topicId 的结果
const messagesByTopicCache = new Map<string, {
  messageIds: string[];
  entities: Record<string, Message | undefined>;
  result: Message[];
}>();

export const selectMessagesByTopicId = (state: RootState, topicId: string): Message[] => {
  if (!state.messages) {
    return EMPTY_MESSAGES_ARRAY;
  }

  const messageIds = state.messages.messageIdsByTopic[topicId] || [];
  const entities = state.messages.entities;

  // 获取缓存
  const cached = messagesByTopicCache.get(topicId);

  if (cached &&
      cached.messageIds === messageIds &&
      cached.entities === entities) {
    return cached.result;
  }

  // 计算新结果
  const result = messageIds
    .map((id: string) => entities[id])
    .filter((msg): msg is Message => msg !== undefined);

  // 检查结果是否相等（浅比较）
  if (cached && shallowArrayEqual(result, cached.result)) {
    // 更新缓存引用，但返回旧结果
    messagesByTopicCache.set(topicId, {
      messageIds,
      entities,
      result: cached.result
    });
    return cached.result;
  }

  // 更新缓存
  messagesByTopicCache.set(topicId, {
    messageIds,
    entities,
    result
  });

  return result;
};

export const selectCurrentTopicId = (state: RootState) =>
  state.messages ? state.messages.currentTopicId : null;

export const selectTopicLoading = (state: RootState, topicId: string) =>
  state.messages ? state.messages.loadingByTopic[topicId] || false : false;

export const selectTopicStreaming = (state: RootState, topicId: string) =>
  state.messages ? state.messages.streamingByTopic[topicId] || false : false;

// 错误相关选择器 - 使用 createSelector 进行记忆化
export const selectErrors = createSelector(
  [(state: RootState) => state.messages],
  (messagesState) => {
    // 确保返回数组，使用稳定的空数组引用
    return messagesState?.errors || EMPTY_MESSAGES_ARRAY;
  }
);

export const selectLastError = createSelector(
  [selectErrors],
  (errors) => {
    // 直接返回最后一个错误，createSelector会处理记忆化
    return errors.length > 0 ? errors[errors.length - 1] : null;
  }
);

export const selectErrorsByTopic = createSelector(
  [
    (state: RootState) => state.messages,
    (_state: RootState, topicId: string) => topicId
  ],
  (messagesState, topicId) => {
    // 确保返回数组，使用稳定的空数组引用
    return messagesState?.errorsByTopic?.[topicId] || EMPTY_MESSAGES_ARRAY;
  }
);

// API Key 错误相关选择器 - 使用 createSelector 进行记忆化
export const selectApiKeyError = createSelector(
  [
    (state: RootState) => state.messages,
    (_state: RootState, topicId: string) => topicId
  ],
  (messagesState, topicId) => {
    // 确保返回值，添加默认值处理
    return messagesState?.apiKeyErrors?.[topicId] || null;
  }
);

export const selectHasApiKeyError = createSelector(
  [
    (state: RootState) => state.messages,
    (_state: RootState, topicId: string) => topicId
  ],
  (messagesState, topicId) => {
    // 转换为布尔值，确保有转换逻辑
    return Boolean(messagesState?.apiKeyErrors?.[topicId]);
  }
);

// 优化版本：直接返回有序消息，无需运行时排序
export const selectOrderedMessagesByTopicId = createSelector(
  [selectMessagesByTopicId],
  (messages) => {
    // 消息已经按时间顺序存储，直接返回
    // 这样避免了每次渲染时的排序开销，提升性能
    return messages;
  }
);

// 选择特定主题的最后一条消息
export const selectLastMessageForTopic = createSelector(
  [selectMessagesByTopicId],
  (messages) => {
    // 消息已按时间顺序存储，返回最后一条
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }
);

// 异步Thunk - 优化版本：避免重复加载和竞争条件
export const loadTopicMessagesThunk = createAsyncThunk(
  'normalizedMessages/loadTopicMessages',
  async (topicId: string, { dispatch, getState }) => {
    try {
      const state = getState() as any;

      // 优化：检查是否已完成加载（fulfilledByTopic）
      if (state.messages.fulfilledByTopic[topicId]) {
        console.log(`[loadTopicMessagesThunk] 话题 ${topicId} 已加载，跳过`);
        dispatch(newMessagesActions.setCurrentTopicId(topicId));
        return [];
      }

      // 优化缓存检查 - 确保有实际消息数据才跳过加载
      const existingMessageIds = state.messages.messageIdsByTopic[topicId] || [];
      const hasActualMessages = existingMessageIds.length > 0 &&
        existingMessageIds.some((id: string) => state.messages.entities[id]);

      dispatch(newMessagesActions.setCurrentTopicId(topicId));

      if (hasActualMessages) {
        console.log(`[loadTopicMessagesThunk] 话题 ${topicId} 消息已缓存，跳过加载`);
        // 标记为已完成加载
        dispatch(newMessagesActions.setTopicFulfilled({ topicId, fulfilled: true }));
        return []; // 直接返回，不重新加载
      }

      // 防止竞争条件：检查是否正在加载
      if (state.messages.loadingByTopic[topicId]) {
        return [];
      }

      dispatch(newMessagesActions.setTopicLoading({ topicId, loading: true }));

      // 直接从topic获取消息 - 使用缓存管理器
      const topic = await topicCacheManager.getTopic(topicId);
      if (!topic) {
        // 如果topic不存在就创建一个空的
        await dexieStorage.saveTopic({
          id: topicId,
          messages: [],
          messageIds: [],
          name: '新对话',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
        dispatch(newMessagesActions.messagesReceived({ topicId, messages: [] }));
        return [];
      }

      // 从messageIds加载消息
      let messagesFromTopic: Message[] = [];

      if (topic.messageIds && topic.messageIds.length > 0) {
        // 使用批量查询从messages表获取消息
        messagesFromTopic = await dexieStorage.getMessagesByIds(topic.messageIds);
      }

      if (messagesFromTopic.length > 0) {
        // 简单的块查询
        const messageIds = messagesFromTopic.map(m => m.id);
        const blocks = await dexieStorage.getMessageBlocksByMessageIds(messageIds);

        // 确保消息有正确的blocks字段
        const messagesWithBlockIds = messagesFromTopic.map(m => ({
          ...m,
          blocks: m.blocks?.map(String) || []
        }));

        if (blocks.length > 0) {
          dispatch(upsertManyBlocks(blocks));
        }
        dispatch(newMessagesActions.messagesReceived({ topicId, messages: messagesWithBlockIds }));
      } else {
        dispatch(newMessagesActions.messagesReceived({ topicId, messages: [] }));
      }

      // 🚀 标记为已完成加载
      dispatch(newMessagesActions.setTopicFulfilled({ topicId, fulfilled: true }));

      return messagesFromTopic;
    } catch (error) {
      console.error(`[loadTopicMessagesThunk] 加载话题 ${topicId} 消息失败:`, error);

      // 创建错误信息对象
      const errorInfo: ErrorInfo = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN',
        type: 'LOAD_MESSAGES_ERROR',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.stack : undefined,
        context: { topicId }
      };

      // 分发错误
      dispatch(newMessagesActions.setError({
        error: errorInfo,
        topicId
      }));

      throw error;
    } finally {
      dispatch(newMessagesActions.setTopicLoading({ topicId, loading: false }));
    }
  }
);

// 7. 导出 Reducer
export default newMessagesSlice.reducer;