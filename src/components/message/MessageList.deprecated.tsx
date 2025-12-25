/**
 * @deprecated 此组件已废弃，请使用 SolidMessageList 代替
 * 
 * 此文件保留仅作为参考，新功能已迁移到 SolidMessageList.tsx
 * SolidMessageList 使用 SolidJS 实现滚动优化，性能更好
 */
import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import type { Message } from '../../shared/types/newMessage.ts';
import type { ChatTopic, Assistant } from '../../shared/types/Assistant';
import MessageGroup from './MessageGroup';
import SystemPromptBubble from '../prompts/SystemPromptBubble';
import SystemPromptDialog from '../dialogs/SystemPromptDialog';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../shared/store';
import { throttle } from 'lodash';
import { useKeyboard } from '../../shared/hooks/useKeyboard';

import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import { topicCacheManager } from '../../shared/services/TopicCacheManager';
import { upsertManyBlocks } from '../../shared/store/slices/messageBlocksSlice';
import { selectBlocksByIds } from '../../shared/store/selectors/messageBlockSelectors';
import useScrollPosition from '../../hooks/useScrollPosition';
import { getGroupedMessages, MessageGroupingType } from '../../shared/utils/messageGrouping';
import { EventEmitter, EVENT_NAMES } from '../../shared/services/EventEmitter';
import { scrollContainerStyles, scrollbarStyles, debugScrollPerformance } from '../../shared/config/scrollOptimization';

// 每次加载的消息数量
const LOAD_MORE_COUNT = 10;

const computeDisplayMessages = (messages: Message[], startIndex: number, displayCount: number) => {
  if (messages.length === 0) return [];
  
  const actualStartIndex = Math.max(0, startIndex);
  const actualEndIndex = Math.min(messages.length, startIndex + displayCount);
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

  const [error, setError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleError = useCallback((error: any, context: string, options: { showToUser?: boolean; canRecover?: boolean } = {}) => {
    const { showToUser = false, canRecover = false } = options;
    console.error(`[MessageList] ${context} 错误:`, error);

    if (showToUser) {
      const errorMessage = error?.message || '发生未知错误';
      setError(`${context}: ${errorMessage}`);

      if (canRecover) {
        setIsRecovering(true);
        setTimeout(() => {
          setError(null);
          setIsRecovering(false);
        }, 3000);
      }
    }
  }, []);

  const recoverFromError = useCallback(() => {
    setError(null);
    setIsRecovering(false);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      debugScrollPerformance();
    }
  }, []);

  // 初始显示15条消息
  const INITIAL_DISPLAY_COUNT = 15;
  
  const [displayMessages, setDisplayMessages] = useState<Message[]>(() => {
    const startIndex = Math.max(0, messages.length - INITIAL_DISPLAY_COUNT);
    return computeDisplayMessages(messages, startIndex, INITIAL_DISPLAY_COUNT);
  });
  const [hasMore, setHasMore] = useState(() => messages.length > INITIAL_DISPLAY_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [isNearTop, setIsNearTop] = useState(false);

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

  const {
    containerRef,
    handleScroll,
    scrollToBottom,
  } = useScrollPosition('messageList', {
    throttleTime: 16, // 废弃文件，使用固定值
    autoRestore: false,
    onScroll: (_scrollPos) => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsNearTop(scrollTop < 100);
      }
    }
  });

  const scrollManagerRef = useRef({
    isScrolling: false,
    lastScrollTime: 0,
    pendingScrolls: new Set<string>()
  });

  const unifiedScrollManager = useMemo(() => {
    return {
      scrollToBottom: throttle((source: string = 'unknown', options: { force?: boolean; behavior?: ScrollBehavior } = {}) => {
        const { force = false, behavior = 'auto' } = options;
        const manager = scrollManagerRef.current;

        if (!autoScrollToBottom && !force) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ScrollManager] 自动滚动已禁用 (来源: ${source})`);
          }
          return;
        }

        const now = Date.now();
        if (manager.isScrolling && now - manager.lastScrollTime < 50) return;

        manager.isScrolling = true;
        manager.lastScrollTime = now;
        manager.pendingScrolls.add(source);

        requestAnimationFrame(() => {
          try {
            if (scrollToBottom) {
              scrollToBottom();
            } else if (messagesEndRef.current && containerRef.current) {
              containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior
              });
            }
          } catch (error) {
            handleError(error, `滚动失败 (来源: ${source})`, { showToUser: false });
          } finally {
            manager.pendingScrolls.delete(source);
            setTimeout(() => {
              manager.isScrolling = false;
            }, 100);
          }
        });
      }, 100, { leading: true, trailing: true }),

      getScrollState: () => scrollManagerRef.current,

      cleanup: () => {
        scrollManagerRef.current.pendingScrolls.clear();
        scrollManagerRef.current.isScrolling = false;
      }
    };
  }, [scrollToBottom, autoScrollToBottom]);

  const unifiedScrollManagerRef = useRef(unifiedScrollManager);
  useEffect(() => {
    unifiedScrollManagerRef.current = unifiedScrollManager;
  }, [unifiedScrollManager]);

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

  // ⭐ 始终监听流式事件，避免竞态条件（事件在 hasStreamingMessage 更新前发送）
  useEffect(() => {
    const throttledTextDeltaHandler = throttle(() => {
      // 在事件处理器内部检查设置
      if (!autoScrollToBottom) return;
      
      const container = containerRef.current;
      if (container) {
        const gap = container.scrollHeight - container.scrollTop - container.clientHeight;
        const isNearBottom = gap < 120;
        if (!isNearBottom) return;
      }
      unifiedScrollManagerRef.current.scrollToBottom('textDelta');
    }, 150);  // ⭐ 降低节流间隔，响应更及时

    const scrollToBottomHandler = () => {
      if (!autoScrollToBottom) return;
      unifiedScrollManagerRef.current.scrollToBottom('eventHandler', { force: true });
    };

    const unsubscribeTextDelta = EventEmitter.on(EVENT_NAMES.STREAM_TEXT_DELTA, throttledTextDeltaHandler);
    const unsubscribeTextComplete = EventEmitter.on(EVENT_NAMES.STREAM_TEXT_COMPLETE, throttledTextDeltaHandler);
    const unsubscribeThinkingDelta = EventEmitter.on(EVENT_NAMES.STREAM_THINKING_DELTA, throttledTextDeltaHandler);
    const unsubscribeScrollToBottom = EventEmitter.on(EVENT_NAMES.UI_SCROLL_TO_BOTTOM, scrollToBottomHandler);

    return () => {
      unsubscribeTextDelta();
      unsubscribeTextComplete();
      unsubscribeThinkingDelta();
      unsubscribeScrollToBottom();
      throttledTextDeltaHandler.cancel();
    };
  }, [autoScrollToBottom]);  // ⭐ 只依赖设置，不依赖 hasStreamingMessage

  const throttledMessageLengthScroll = useMemo(
    () => throttle(() => {
      unifiedScrollManagerRef.current.scrollToBottom('messageLengthChange');
    }, 200),
    []
  );

  const prevMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      throttledMessageLengthScroll();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, throttledMessageLengthScroll]);

  const prevKeyboardHeightRef = useRef(keyboardHeight);
  useEffect(() => {
    if (keyboardHeight > 0 && prevKeyboardHeightRef.current === 0) {
      setTimeout(() => {
        unifiedScrollManagerRef.current.scrollToBottom('keyboardShow', { force: true });
      }, 100);
    }
    prevKeyboardHeightRef.current = keyboardHeight;
  }, [keyboardHeight]);

  const handlePromptBubbleClick = useCallback(() => {
    setPromptDialogOpen(true);
  }, []);

  const handlePromptDialogClose = useCallback(() => {
    setPromptDialogOpen(false);
  }, []);

  const handlePromptSave = useCallback((updatedTopic: any) => {
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

  const filteredMessages = useMemo(() => messages, [messages]);

  const memoizedDisplayMessages = useMemo(() => {
    const startIndex = Math.max(0, filteredMessages.length - displayCount);
    return computeDisplayMessages(filteredMessages, startIndex, displayCount);
  }, [filteredMessages, displayCount]);

  const memoizedHasMore = useMemo(() => {
    return displayCount < filteredMessages.length;
  }, [filteredMessages.length, displayCount]);

  useEffect(() => {
    setDisplayMessages(memoizedDisplayMessages);
    setHasMore(memoizedHasMore);
  }, [memoizedDisplayMessages, memoizedHasMore]);

  const prevTopicIdRef = useRef(currentTopicId);
  const isInitialLoadRef = useRef(true);
  
  useEffect(() => {
    const isTopicChange = prevTopicIdRef.current !== currentTopicId;
    
    if (isTopicChange || isInitialLoadRef.current) {
      if (isTopicChange) {
        setDisplayCount(INITIAL_DISPLAY_COUNT);
        prevTopicIdRef.current = currentTopicId;
      }
      
      if (displayMessages.length > 0 && currentTopicId) {
        setTimeout(() => {
          unifiedScrollManagerRef.current.scrollToBottom(
            isInitialLoadRef.current ? 'initialLoad' : 'topicSwitch', 
            { force: true }
          );
          isInitialLoadRef.current = false;
        }, 150);
      }
    }
  }, [currentTopicId, displayMessages.length]);

  const loadMoreMessagesStateRef = useRef({ hasMore, isLoadingMore, displayMessages, filteredMessages });
  loadMoreMessagesStateRef.current = { hasMore, isLoadingMore, displayMessages, filteredMessages };

  // 记录加载前的滚动高度，用于保持位置
  const prevScrollHeightRef = useRef<number | null>(null);

  const loadMoreMessages = useCallback(() => {
    const { hasMore, isLoadingMore, displayMessages, filteredMessages } = loadMoreMessagesStateRef.current;
    if (!hasMore || isLoadingMore) return;

    // 记录当前滚动高度
    prevScrollHeightRef.current = containerRef.current?.scrollHeight || null;

    setIsLoadingMore(true);
    if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
    
    loadMoreTimeoutRef.current = setTimeout(() => {
      const newDisplayCount = displayMessages.length + LOAD_MORE_COUNT;
      setDisplayCount(newDisplayCount);
      
      const newStartIndex = Math.max(0, filteredMessages.length - newDisplayCount);
      setDisplayMessages(computeDisplayMessages(filteredMessages, newStartIndex, newDisplayCount));
      setHasMore(newDisplayCount < filteredMessages.length);
      setIsLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 300);
  }, []);

  // 加载更多后保持滚动位置
  React.useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && containerRef.current) {
      const heightDiff = containerRef.current.scrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop += heightDiff;
      prevScrollHeightRef.current = null;
    }
  }, [displayMessages]);

  // 获取消息分组设置
  const messageGroupingType = useSelector((state: RootState) =>
    (state.settings as any).messageGrouping || 'byDate'
  );

  // 对显示的消息进行分组
  const groupedMessages = useMemo(() => {
    return Object.entries(getGroupedMessages(displayMessages, messageGroupingType as MessageGroupingType));
  }, [displayMessages, messageGroupingType]);

  const groupStartIndices = useMemo(() => {
    const indices = new Map<string, number>();
    let cumulative = 0;
    for (const [date, msgs] of groupedMessages) {
      indices.set(date, cumulative);
      cumulative += msgs.length;
    }
    return indices;
  }, [groupedMessages]);

  // 获取背景设置
  const chatBackground = useSelector((state: RootState) =>
    state.settings.chatBackground || { enabled: false }
  );

  useEffect(() => {
    return () => {
      unifiedScrollManager.scrollToBottom.cancel();
      unifiedScrollManager.cleanup();
      throttledMessageLengthScroll.cancel();
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
        loadMoreTimeoutRef.current = null;
      }
      loadedBlockIdsRef.current.clear();
      if (isDevMode) {
        console.log('[MessageList] 组件卸载清理');
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
        pt: 0,
        pb: 2,
        width: '100%',
        maxWidth: '100%',
        ...scrollContainerStyles,
        ...(chatBackground.enabled ? {} : {
          bgcolor: theme.palette.background.default
        }),
        ...scrollbarStyles(theme.palette.mode === 'dark'),
      }}
      onScroll={handleScroll}
    >
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

      {showSystemPromptBubble && (
        <SystemPromptBubble
          topic={currentTopic}
          assistant={currentAssistant}
          onClick={handlePromptBubbleClick}
          key={`prompt-bubble-${currentTopic?.id || 'no-topic'}-${currentAssistant?.id || 'no-assistant'}`}
        />
      )}

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
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          {hasMore && isNearTop && (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: '16px 0', position: 'sticky', top: 0, zIndex: 10, bgcolor: chatBackground.enabled ? 'transparent' : theme.palette.background.default }}>
              <Box
                onClick={loadMoreMessages}
                sx={{
                  cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                  padding: '8px 24px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: isLoadingMore ? 0.6 : 1,
                  backdropFilter: chatBackground.enabled ? 'blur(10px)' : 'none',
                  '&:hover': {
                    bgcolor: isLoadingMore ? theme.palette.background.paper : theme.palette.action.hover,
                    borderColor: isLoadingMore ? theme.palette.divider : theme.palette.primary.main,
                    transform: isLoadingMore ? 'none' : 'translateY(-1px)',
                    boxShadow: isLoadingMore ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
                  },
                  '&:active': {
                    transform: isLoadingMore ? 'none' : 'translateY(0)'
                  }
                }}
              >
                {isLoadingMore ? (
                  <>
                    <Box sx={{
                      width: '16px',
                      height: '16px',
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
                    <span>加载中...</span>
                  </>
                ) : (
                  <>
                    <span>↑</span>
                    <span>加载更多消息</span>
                  </>
                )}
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {groupedMessages.map(([date, messages]) => {
              const previousMessagesCount = groupStartIndices.get(date) || 0;

              return (
                <MessageGroup
                  key={date}
                  date={date}
                  messages={messages}
                  expanded={true}
                  startIndex={previousMessagesCount}
                  onRegenerate={onRegenerate}
                  onDelete={onDelete}
                  onSwitchVersion={onSwitchVersion}
                  onResend={onResend}
                />
              );
            })}
          </Box>
        </Box>
      )}
      <div ref={messagesEndRef} />
      <div style={{ height: '35px', minHeight: '35px', width: '100%' }} />
    </Box>
  );
};

export default MessageList;
