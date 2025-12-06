import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import type { Message } from '../../shared/types/newMessage.ts';
import type { ChatTopic, Assistant } from '../../shared/types/Assistant';
import MessageGroup from './MessageGroup';
import SystemPromptBubble from '../SystemPromptBubble';
import SystemPromptDialog from '../SystemPromptDialog';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../shared/store';
import { throttle } from 'lodash';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useKeyboard } from '../../shared/hooks/useKeyboard';

import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import { topicCacheManager } from '../../shared/services/TopicCacheManager';
import { upsertManyBlocks } from '../../shared/store/slices/messageBlocksSlice';
import { selectBlocksByIds } from '../../shared/store/selectors/messageBlockSelectors';
import useScrollPosition from '../../hooks/useScrollPosition';
import { getGroupedMessages, MessageGroupingType } from '../../shared/utils/messageGrouping';
import { EventEmitter, EVENT_NAMES } from '../../shared/services/EventEmitter';
import { scrollContainerStyles, scrollbarStyles, getOptimizedConfig, debugScrollPerformance } from '../../shared/config/scrollOptimization';

// 加载更多消息的数量
const LOAD_MORE_COUNT = 20;

// 修复：简化消息显示逻辑，支持正确的无限滚动
// 🚀 优化：移除冗余日志，避免 StrictMode 双重渲染导致的重复输出
const computeDisplayMessages = (messages: Message[], startIndex: number, displayCount: number) => {
  const totalMessages = messages.length;

  if (totalMessages === 0) {
    return [];
  }

  // 修复：使用正常的索引计算，配合 inverse=true 来实现正确的滚动方向
  // 最新消息在数组末尾，显示时也在底部
  const actualStartIndex = Math.max(0, startIndex);
  const actualEndIndex = Math.min(totalMessages, startIndex + displayCount);

  return messages.slice(actualStartIndex, actualEndIndex);
};

interface MessageListProps {
  messages: Message[];
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onSwitchVersion?: (versionId: string) => void;
  onResend?: (messageId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onRegenerate, onDelete, onSwitchVersion, onResend }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const dispatch = useDispatch();
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const isDevMode = process.env.NODE_ENV === 'development';

  // 键盘状态监听 - 用于在键盘弹出时自动滚动到底部
  const { keyboardHeight } = useKeyboard();

  // 修复：添加错误状态管理
  const [error, setError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 修复：统一的错误处理函数
  const handleError = useCallback((error: any, context: string, options: { showToUser?: boolean; canRecover?: boolean } = {}) => {
    const { showToUser = false, canRecover = false } = options;

    console.error(`[MessageList] ${context} 错误:`, error);

    if (showToUser) {
      const errorMessage = error?.message || '发生未知错误';
      setError(`${context}: ${errorMessage}`);

      if (canRecover) {
        setIsRecovering(true);
        // 3秒后自动清除错误状态
        setTimeout(() => {
          setError(null);
          setIsRecovering(false);
        }, 3000);
      }
    }
  }, []);

  // 修复：错误恢复函数
  const recoverFromError = useCallback(() => {
    setError(null);
    setIsRecovering(false);
    // 可以在这里添加重试逻辑
  }, []);

  // 🚀 获取优化配置
  const optimizedConfig = React.useMemo(() => getOptimizedConfig(), []);

  // 🚀 调试性能配置（仅在开发环境）
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      debugScrollPerformance();
    }
  }, []);

  // 无限滚动相关状态
  // 🚀 优化：使用函数式初始化，避免首次渲染时显示空列表导致的闪烁
  const [displayMessages, setDisplayMessages] = useState<Message[]>(() => {
    // 直接计算初始显示的消息，而不是空数组
    const startIndex = Math.max(0, messages.length - optimizedConfig.virtualScrollThreshold);
    return computeDisplayMessages(messages, startIndex, optimizedConfig.virtualScrollThreshold);
  });
  const [hasMore, setHasMore] = useState(() => messages.length > optimizedConfig.virtualScrollThreshold);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayCount] = useState(optimizedConfig.virtualScrollThreshold); // 🚀 使用优化配置

  // 汇总当前消息涉及的块ID列表，用于按需查询
  const allBlockIds = useMemo(() => {
    const ids: string[] = [];
    messages.forEach(m => {
      if (m.blocks && m.blocks.length > 0) {
        ids.push(...m.blocks);
      }
    });
    return ids;
  }, [messages]);

  // 仅选择当前消息涉及的块实体，避免订阅整个 entities
  const relatedBlocks = useSelector((state: RootState) => selectBlocksByIds(state, allBlockIds));
  const relatedBlockSet = useMemo(() => {
    const set = new Set<string>();
    relatedBlocks.forEach(b => set.add(b.id));
    return set;
  }, [relatedBlocks]);

  // 从 Redux 获取当前话题ID
  const currentTopicId = useSelector((state: RootState) => state.messages.currentTopicId);

  // 从数据库获取当前话题和助手信息
  const [currentTopic, setCurrentTopic] = useState<ChatTopic | null>(null);
  const [currentAssistant, setCurrentAssistant] = useState<Assistant | null>(null);
  const loadedBlockIdsRef = useRef<Set<string>>(new Set());

  // 当话题ID变化时，从数据库获取话题和助手信息
  useEffect(() => {
    const loadTopicAndAssistant = async () => {
      if (!currentTopicId) return;

      try {
        // 获取话题 - 使用缓存管理器
        const topic = await topicCacheManager.getTopic(currentTopicId);
        if (topic) {
          setCurrentTopic(topic);

          // 获取助手
          if (topic.assistantId) {
            const assistant = await dexieStorage.getAssistant(topic.assistantId);
            if (assistant) {
              setCurrentAssistant(assistant);
            }
          }
        }
      } catch (error) {
        handleError(error, '加载话题和助手信息', { showToUser: true, canRecover: true });
      }
    };

    loadTopicAndAssistant();
  }, [currentTopicId]);

  //  优化：监听助手更新事件，使用ref避免重复渲染
  const currentAssistantRef = useRef(currentAssistant);
  currentAssistantRef.current = currentAssistant;

  useEffect(() => {
    const handleAssistantUpdated = (event: CustomEvent) => {
      const updatedAssistant = event.detail.assistant;

      // 如果更新的助手是当前助手，直接更新状态
      if (currentAssistantRef.current && updatedAssistant.id === currentAssistantRef.current.id) {
        setCurrentAssistant(updatedAssistant);
      }
    };

    window.addEventListener('assistantUpdated', handleAssistantUpdated as EventListener);

    return () => {
      window.removeEventListener('assistantUpdated', handleAssistantUpdated as EventListener);
    };
  }, []); // 空依赖数组，只在组件挂载时创建一次

  // 获取系统提示词气泡显示设置
  const showSystemPromptBubble = useSelector((state: RootState) =>
    state.settings.showSystemPromptBubble !== false
  );

  // 获取自动滚动设置
  const autoScrollToBottom = useSelector((state: RootState) =>
    state.settings.autoScrollToBottom !== false
  );

  // 🚀 使用优化的滚动位置钩子
  const {
    containerRef,
    handleScroll,
    scrollToBottom,
  } = useScrollPosition('messageList', {
    throttleTime: optimizedConfig.scrollThrottle, // 🚀 使用优化的节流时间
    autoRestore: false, // 禁用自动恢复，避免滚动冲突
    onScroll: (_scrollPos) => {
      // 可以在这里添加滚动位置相关的逻辑
    }
  });

  // 修复：创建统一的滚动管理器，避免多处调用造成冲突
  const scrollManagerRef = useRef({
    isScrolling: false,
    lastScrollTime: 0,
    pendingScrolls: new Set<string>()
  });

  const unifiedScrollManager = useMemo(() => {
    return {
      // 统一的滚动到底部方法
      scrollToBottom: throttle((source: string = 'unknown', options: { force?: boolean; behavior?: ScrollBehavior } = {}) => {
        const { force = false, behavior = 'auto' } = options;
        const manager = scrollManagerRef.current;

        // 检查是否启用自动滚动（除非强制滚动）
        if (!autoScrollToBottom && !force) {
          // 移除频繁的滚动日志，只在开发环境输出
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ScrollManager] 自动滚动已禁用，跳过滚动请求 (来源: ${source})`);
          }
          return;
        }

        // 防止重复滚动
        const now = Date.now();
        if (manager.isScrolling && now - manager.lastScrollTime < 50) {
          // 移除频繁的滚动日志
          return;
        }

        manager.isScrolling = true;
        manager.lastScrollTime = now;
        manager.pendingScrolls.add(source);

        // 使用 requestAnimationFrame 确保在DOM更新后滚动
        requestAnimationFrame(() => {
          try {
            // 优先使用容器滚动方法，避免 scrollIntoView 导致整个页面滚动
            // 这样可以防止固定定位的输入框在滚动时位置异常
            if (scrollToBottom) {
              scrollToBottom();
            } else if (messagesEndRef.current && containerRef.current) {
              // 备用方案：使用容器滚动到底部
              containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior
              });
            }
          } catch (error) {
            handleError(error, `滚动管理器滚动失败 (来源: ${source})`, { showToUser: false });
          } finally {
            manager.pendingScrolls.delete(source);
            // 延迟重置滚动状态
            setTimeout(() => {
              manager.isScrolling = false;
            }, 100);
          }
        });
      }, 100, { leading: true, trailing: true }),

      // 获取滚动状态
      getScrollState: () => scrollManagerRef.current,

      // 清理方法
      cleanup: () => {
        scrollManagerRef.current.pendingScrolls.clear();
        scrollManagerRef.current.isScrolling = false;
      }
    };
  }, [scrollToBottom, autoScrollToBottom]);

  // 使用 ref 存储统一滚动管理器，避免闭包问题
  const unifiedScrollManagerRef = useRef(unifiedScrollManager);
  useEffect(() => {
    unifiedScrollManagerRef.current = unifiedScrollManager;
  }, [unifiedScrollManager]);

  // 精确的流式输出检查：只看当前消息状态
  const hasStreamingMessage = useMemo(
    () => messages.some(message => message.status === 'streaming'),
    [messages]
  );

  useEffect(() => {
    if (!autoScrollToBottom) return;
    if (hasStreamingMessage) {
      unifiedScrollManagerRef.current.scrollToBottom('streamingCheck');
    }
  }, [hasStreamingMessage, autoScrollToBottom]);

  // 修复：优化流式输出事件监听，移除未使用的性能检测代码
  useEffect(() => {
    if (!hasStreamingMessage) return;

    // 修复：使用统一滚动管理器处理流式输出滚动
    const throttledTextDeltaHandler = throttle(() => {
      const container = containerRef.current;
      if (container) {
        const gap = container.scrollHeight - container.scrollTop - container.clientHeight;
        const isNearBottom = gap < 120;
        if (!isNearBottom) return;
      }
      unifiedScrollManagerRef.current.scrollToBottom('textDelta');
    }, 500); // 拉长节流间隔并仅在接近底部时滚动

    // 修复：统一的滚动到底部事件处理器
    const scrollToBottomHandler = () => {
      unifiedScrollManagerRef.current.scrollToBottom('eventHandler', { force: true });
    };

    // 订阅事件
    const unsubscribeTextDelta = EventEmitter.on(EVENT_NAMES.STREAM_TEXT_DELTA, throttledTextDeltaHandler);
    const unsubscribeTextComplete = EventEmitter.on(EVENT_NAMES.STREAM_TEXT_COMPLETE, throttledTextDeltaHandler);
    const unsubscribeThinkingDelta = EventEmitter.on(EVENT_NAMES.STREAM_THINKING_DELTA, throttledTextDeltaHandler);
    const unsubscribeScrollToBottom = EventEmitter.on(EVENT_NAMES.UI_SCROLL_TO_BOTTOM, scrollToBottomHandler);

    return () => {
      unsubscribeTextDelta();
      unsubscribeTextComplete();
      unsubscribeThinkingDelta();
      unsubscribeScrollToBottom();
      // 取消节流函数
      throttledTextDeltaHandler.cancel();
    };
  }, [hasStreamingMessage]); // 仅在有流式消息时监听事件

  // 修复：当消息数量变化时滚动到底部 - 使用统一滚动管理器
  const throttledMessageLengthScroll = useMemo(
    () => throttle(() => {
      unifiedScrollManagerRef.current.scrollToBottom('messageLengthChange');
    }, 200), // 200ms节流，避免频繁滚动
    [] // 空依赖数组，避免重建
  );

  // 修复：优化消息长度变化监听，使用 ref 避免不必要的重渲染
  const prevMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    // 只有当消息数量真正增加时才滚动（新消息添加）
    if (messages.length > prevMessagesLengthRef.current) {
      throttledMessageLengthScroll();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, throttledMessageLengthScroll]);

  // 🚀 键盘弹出时自动滚动到底部，确保用户能看到最新消息
  const prevKeyboardHeightRef = useRef(keyboardHeight);
  useEffect(() => {
    // 只有当键盘从隐藏变为显示时才滚动
    if (keyboardHeight > 0 && prevKeyboardHeightRef.current === 0) {
      // 延迟一小段时间确保 padding 已更新
      setTimeout(() => {
        unifiedScrollManagerRef.current.scrollToBottom('keyboardShow', { force: true });
      }, 100);
    }
    prevKeyboardHeightRef.current = keyboardHeight;
  }, [keyboardHeight]);

  // 处理系统提示词气泡点击
  const handlePromptBubbleClick = useCallback(() => {
    setPromptDialogOpen(true);
  }, []);

  // 处理系统提示词对话框关闭
  const handlePromptDialogClose = useCallback(() => {
    setPromptDialogOpen(false);
  }, []);

  // 处理系统提示词保存
  const handlePromptSave = useCallback((updatedTopic: any) => {
    // 直接更新当前话题状态，强制重新渲染
    setCurrentTopic(updatedTopic);
  }, []);

  // 简化的块加载逻辑
  useEffect(() => {
    let isActive = true;

    const loadMissingBlocks = async () => {
      const pendingBlockIds: string[] = [];

      for (const message of messages) {
        if (!message.blocks || message.blocks.length === 0) continue;

        for (const blockId of message.blocks) {
          if (relatedBlockSet.has(blockId)) continue;
          if (loadedBlockIdsRef.current.has(blockId)) continue;

          pendingBlockIds.push(blockId);
          loadedBlockIdsRef.current.add(blockId);
        }
      }

      if (pendingBlockIds.length === 0) {
        return;
      }

      const blocks = await Promise.all(
        pendingBlockIds.map(async blockId => {
          try {
            const block = await dexieStorage.getMessageBlock(blockId);
            if (!block) {
              loadedBlockIdsRef.current.delete(blockId);
            }
            return block;
          } catch (error) {
            loadedBlockIdsRef.current.delete(blockId);
            handleError(error, `加载块 ${blockId} 失败`, { showToUser: false });
            return null;
          }
        })
      );

      if (!isActive) {
        return;
      }

      const validBlocks = blocks.filter(Boolean) as any[];
      if (validBlocks.length > 0) {
        dispatch(upsertManyBlocks(validBlocks as any));
      }
    };

    loadMissingBlocks();

    return () => {
      isActive = false;
    };
  }, [messages, relatedBlockSet, dispatch, handleError]);

  // 改造为：直接使用有序消息，无需去重
  // 🚀 优化：移除冗余日志，避免 StrictMode 双重渲染导致的重复输出
  const filteredMessages = useMemo(() => {
    // 消息已经按时间顺序存储且无重复，直接使用
    return messages;
  }, [messages]);

  // 修复：计算显示的消息 - 使用记忆化避免重复计算
  const memoizedDisplayMessages = useMemo(() => {
    // 修复：显示最新的消息，从末尾开始取
    const startIndex = Math.max(0, filteredMessages.length - displayCount);
    return computeDisplayMessages(filteredMessages, startIndex, displayCount);
  }, [filteredMessages, displayCount]);

  const memoizedHasMore = useMemo(() => {
    return filteredMessages.length > displayCount;
  }, [filteredMessages.length, displayCount]);

  // 只在记忆化结果变化时更新状态
  useEffect(() => {
    setDisplayMessages(memoizedDisplayMessages);
    setHasMore(memoizedHasMore);
  }, [memoizedDisplayMessages, memoizedHasMore]);

  // 修复：优化加载更多消息的函数，使用 ref 减少依赖项
  const loadMoreMessagesStateRef = useRef({ hasMore, isLoadingMore, displayMessages, filteredMessages });
  loadMoreMessagesStateRef.current = { hasMore, isLoadingMore, displayMessages, filteredMessages };

  const loadMoreMessages = useCallback(() => {
    const { hasMore, isLoadingMore, displayMessages, filteredMessages } = loadMoreMessagesStateRef.current;

    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    loadMoreTimeoutRef.current = setTimeout(() => {
      const currentLength = displayMessages.length;
      // 修复：向前加载更多历史消息
      const newStartIndex = Math.max(0, filteredMessages.length - currentLength - LOAD_MORE_COUNT);
      const newMessages = computeDisplayMessages(filteredMessages, newStartIndex, currentLength + LOAD_MORE_COUNT);

      setDisplayMessages(newMessages);
      setHasMore(newStartIndex > 0);
      setIsLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 300);
  }, []); // 空依赖数组，避免重建

  // 获取消息分组设置
  const messageGroupingType = useSelector((state: RootState) =>
    (state.settings as any).messageGrouping || 'byDate'
  );

  // 对显示的消息进行分组
  const groupedMessages = useMemo(() => {
    return Object.entries(getGroupedMessages(displayMessages, messageGroupingType as MessageGroupingType));
  }, [displayMessages, messageGroupingType]);

  // 预计算每个分组的起始索引，避免渲染时重复累加
  const groupStartIndices = useMemo(() => {
    const indices = new Map<string, number>();
    let cumulative = 0;
    for (const [date, msgs] of groupedMessages) {
      indices.set(date, cumulative);
      cumulative += msgs.length;
    }
    return indices;
  }, [groupedMessages]);

  // 移除虚拟滚动相关的函数，使用简单的DOM渲染

  // 获取背景设置
  const chatBackground = useSelector((state: RootState) =>
    state.settings.chatBackground || { enabled: false }
  );

  // 修复：添加组件卸载时的清理机制，防止内存泄漏
  useEffect(() => {
    return () => {
      // 取消所有节流函数，防止内存泄漏
      unifiedScrollManager.scrollToBottom.cancel();
      unifiedScrollManager.cleanup();
      throttledMessageLengthScroll.cancel();
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
        loadMoreTimeoutRef.current = null;
      }
      loadedBlockIdsRef.current.clear();
      if (isDevMode) {
        console.log('[MessageList] 组件卸载，已清理所有节流函数');
      }
    };
  }, [unifiedScrollManager, throttledMessageLengthScroll, isDevMode]);

  return (
    <Box
      id="messageList"
      className="chat-message-list-scrollable"
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        overflowY: 'auto',
        px: 0,
        pt: 0, // 顶部无padding，让提示词气泡紧贴顶部
        pb: 2, // 保持底部padding
        width: '100%', // 确保容器占满可用宽度
        maxWidth: '100%', // 确保不超出父容器
        // 🚀 使用统一的滚动性能优化配置
        ...scrollContainerStyles,
        // 只有在没有自定义背景时才设置默认背景色
        ...(chatBackground.enabled ? {} : {
          bgcolor: theme.palette.background.default
        }),
        // 🚀 使用优化的滚动条样式
        ...scrollbarStyles(theme.palette.mode === 'dark'),
      }}
      onScroll={handleScroll}
    >
      {/* 修复：错误提示组件 */}
      {error && (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            bgcolor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 1,
            mb: 1,
            mx: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ fontSize: '16px' }}>⚠️</Box>
            <Box>{error}</Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isRecovering && (
              <Box sx={{ fontSize: '12px', opacity: 0.8 }}>
                自动恢复中...
              </Box>
            )}
            <Box
              sx={{
                cursor: 'pointer',
                fontSize: '18px',
                '&:hover': { opacity: 0.7 }
              }}
              onClick={recoverFromError}
            >
              ✕
            </Box>
          </Box>
        </Box>
      )}

      {/* 系统提示词气泡 - 根据设置显示或隐藏 */}
      {showSystemPromptBubble && (
        <SystemPromptBubble
          topic={currentTopic}
          assistant={currentAssistant}
          onClick={handlePromptBubbleClick}
          key={`prompt-bubble-${currentTopic?.id || 'no-topic'}-${currentAssistant?.id || 'no-assistant'}`}
        />
      )}

      {/* 系统提示词编辑对话框 */}
      <SystemPromptDialog
        open={promptDialogOpen}
        onClose={handlePromptDialogClose}
        topic={currentTopic}
        assistant={currentAssistant}
        onSave={handlePromptSave}
      />

      {displayMessages.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.palette.text.secondary,
            fontStyle: 'normal',
            fontSize: '14px',
          }}
        >
          新的对话开始了，请输入您的问题
        </Box>
      ) : (
        // 修复：使用无限滚动优化性能，正确配置滚动方向
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <InfiniteScroll
            dataLength={displayMessages.length}
            next={loadMoreMessages}
            hasMore={hasMore}
            loader={
              isLoadingMore ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                  <Box sx={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid',
                    borderColor: theme.palette.primary.main,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                </Box>
              ) : null
            }
            scrollableTarget="messageList"
            inverse={true}
            style={{ overflow: 'visible', display: 'flex', flexDirection: 'column' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {groupedMessages.map(([date, messages]) => {
                // 从预计算表获取当前组的起始索引
                const previousMessagesCount = groupStartIndices.get(date) || 0;

                return (
                  <MessageGroup
                    key={date}
                    date={date}
                    messages={messages}
                    expanded={true}
                    startIndex={previousMessagesCount} // 传递起始索引
                    onRegenerate={onRegenerate}
                    onDelete={onDelete}
                    onSwitchVersion={onSwitchVersion}
                    onResend={onResend}
                  />
                );
              })}
            </Box>
          </InfiniteScroll>
        </Box>
      )}
      <div ref={messagesEndRef} />
      {/* 添加一个隐形的底部占位元素，确保最后的消息不被输入框遮挡 */}
      <div style={{ height: '35px', minHeight: '35px', width: '100%' }} />
    </Box>
  );
};

export default MessageList;
