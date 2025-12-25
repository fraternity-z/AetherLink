/**
 * SolidMessageList - 使用 SolidJS 包装的消息列表组件
 * 外壳用 SolidJS 实现（滚动优化），内容由 React 渲染
 * 使用 SolidBridge 桥接 React 和 SolidJS
 */
import React, { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { throttle } from 'lodash';
import { createPortal } from 'react-dom';
import { Box, useTheme } from '@mui/material';
import { SolidBridge } from '../../shared/bridges/SolidBridge';
import { MessageListContainer } from '../../solid/components/MessageList';
import type { Message } from '../../shared/types/newMessage';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../shared/store';
import { upsertManyBlocks } from '../../shared/store/slices/messageBlocksSlice';
import { selectBlocksByIds } from '../../shared/store/selectors/messageBlockSelectors';

import MessageGroup from './MessageGroup';
import SystemPromptBubble from '../prompts/SystemPromptBubble';
import SystemPromptDialog from '../dialogs/SystemPromptDialog';
import type { ChatTopic, Assistant } from '../../shared/types/Assistant';
import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import { topicCacheManager } from '../../shared/services/TopicCacheManager';
import { getGroupedMessages, MessageGroupingType } from '../../shared/utils/messageGrouping';
import { useKeyboard } from '../../shared/hooks/useKeyboard';
import { EventEmitter, EVENT_NAMES } from '../../shared/services/EventEmitter';

interface SolidMessageListProps {
  messages: Message[];
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onSwitchVersion?: (versionId: string) => void;
  onResend?: (messageId: string) => void;
}

const INITIAL_DISPLAY_COUNT = 15;
const LOAD_MORE_COUNT = 10;

const computeDisplayMessages = (messages: Message[], startIndex: number, displayCount: number) => {
  if (messages.length === 0) return [];
  const actualStartIndex = Math.max(0, startIndex);
  const actualEndIndex = Math.min(messages.length, startIndex + displayCount);
  return messages.slice(actualStartIndex, actualEndIndex);
};

const SolidMessageList: React.FC<SolidMessageListProps> = React.memo(({
  messages,
  onRegenerate,
  onDelete,
  onSwitchVersion,
  onResend
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const renderCount = useRef(0);
  renderCount.current += 1;

  // 错误处理状态
  const [error, setError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const loadedBlockIdsRef = useRef<Set<string>>(new Set());

  // 键盘状态监听 - 用于在键盘弹出时自动滚动到底部
  const { keyboardHeight } = useKeyboard();

  // Portal 容器
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // 显示状态
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isNearTop, setIsNearTop] = useState(false);

  // 话题和助手信息
  const [currentTopic, setCurrentTopic] = useState<ChatTopic | null>(null);
  const [currentAssistant, setCurrentAssistant] = useState<Assistant | null>(null);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);

  // Redux 状态
  const currentTopicId = useSelector((state: RootState) => state.messages.currentTopicId);

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

  // 仅选择当前消息涉及的块实体
  const relatedBlocks = useSelector((state: RootState) => selectBlocksByIds(state, allBlockIds));
  const relatedBlockSet = useMemo(() => {
    const set = new Set<string>();
    relatedBlocks.forEach(b => set.add(b.id));
    return set;
  }, [relatedBlocks]);
  const showSystemPromptBubble = useSelector((state: RootState) =>
    state.settings.showSystemPromptBubble !== false
  );
  const autoScrollToBottom = useSelector((state: RootState) =>
    state.settings.autoScrollToBottom !== false
  );
  const messageGroupingType = useSelector((state: RootState) =>
    (state.settings as any).messageGrouping || 'byDate'
  );
  const chatBackground = useSelector((state: RootState) =>
    state.settings.chatBackground || { enabled: false }
  );

  // 检查是否有流式消息
  const hasStreamingMessage = useMemo(
    () => messages.some(message => message.status === 'streaming'),
    [messages]
  );

  // 计算显示的消息
  const displayMessages = useMemo(() => {
    const startIndex = Math.max(0, messages.length - displayCount);
    return computeDisplayMessages(messages, startIndex, displayCount);
  }, [messages, displayCount]);

  const hasMore = useMemo(() => displayCount < messages.length, [displayCount, messages.length]);

  // 消息分组
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

  // 错误处理函数
  const handleError = useCallback((error: any, context: string, options: { showToUser?: boolean; canRecover?: boolean } = {}) => {
    const { showToUser = false, canRecover = false } = options;
    console.error(`[SolidMessageList] ${context} 错误:`, error);

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

  // 加载话题和助手
  useEffect(() => {
    const loadTopicAndAssistant = async () => {
      if (!currentTopicId) return;
      try {
        const topic = await topicCacheManager.getTopic(currentTopicId);
        if (topic) {
          setCurrentTopic(topic);
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
  }, [currentTopicId, handleError]);

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

  // 监听 Portal 容器
  useEffect(() => {
    const checkContainer = () => {
      const container = document.getElementById('messageList');
      if (container !== portalContainer) {
        setPortalContainer(container);
      }
    };

    checkContainer();

    const observer = new MutationObserver(checkContainer);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [portalContainer]);

  // ⭐ 监听助手更新事件
  const currentAssistantRef = useRef(currentAssistant);
  currentAssistantRef.current = currentAssistant;

  useEffect(() => {
    const handleAssistantUpdated = (event: CustomEvent) => {
      const updatedAssistant = event.detail.assistant;
      if (currentAssistantRef.current && updatedAssistant.id === currentAssistantRef.current.id) {
        setCurrentAssistant(updatedAssistant);
      }
    };

    window.addEventListener('assistantUpdated', handleAssistantUpdated as EventListener);
    return () => {
      window.removeEventListener('assistantUpdated', handleAssistantUpdated as EventListener);
    };
  }, []);

  // 处理滚动事件
  const handleScroll = useCallback((scrollTop: number, _scrollHeight: number, _clientHeight: number) => {
    setIsNearTop(scrollTop < 100);
  }, []);

  // 记录加载前的滚动高度，用于保持位置
  const prevScrollHeightRef = useRef<number | null>(null);
  const prevDisplayCountRef = useRef(displayCount);

  // 加载更多消息
  const loadMoreMessages = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    // 记录当前滚动高度
    const container = document.getElementById('messageList');
    prevScrollHeightRef.current = container?.scrollHeight || null;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + LOAD_MORE_COUNT);
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore]);

  // ⭐ 加载更多后保持滚动位置
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && displayCount > prevDisplayCountRef.current) {
      const container = document.getElementById('messageList');
      if (container) {
        const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
        container.scrollTop += heightDiff;
      }
      prevScrollHeightRef.current = null;
    }
    prevDisplayCountRef.current = displayCount;
  }, [displayCount, displayMessages]);

  // 处理提示词气泡点击
  const handlePromptBubbleClick = useCallback(() => {
    setPromptDialogOpen(true);
  }, []);

  const handlePromptDialogClose = useCallback(() => {
    setPromptDialogOpen(false);
  }, []);

  const handlePromptSave = useCallback((updatedTopic: any) => {
    setCurrentTopic(updatedTopic);
  }, []);

  // 滚动到底部的方法
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const scrollFn = (window as any).__solidMessageListScrollToBottom;
    if (scrollFn) {
      scrollFn(behavior);
    } else {
      // 备用方案：直接操作容器
      const container = document.getElementById('messageList');
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior });
      }
    }
  }, []);

  // 统一滚动管理器
  const scrollManagerRef = useRef({
    isScrolling: false,
    lastScrollTime: 0
  });

  const unifiedScrollToBottom = useCallback((source: string = 'unknown', options: { force?: boolean; behavior?: ScrollBehavior } = {}) => {
    const { force = false, behavior = 'auto' } = options;
    const manager = scrollManagerRef.current;

    if (!autoScrollToBottom && !force) {
      return;
    }

    const now = Date.now();
    if (manager.isScrolling && now - manager.lastScrollTime < 50) return;

    manager.isScrolling = true;
    manager.lastScrollTime = now;

    requestAnimationFrame(() => {
      try {
        scrollToBottom(behavior);
      } catch (error) {
        console.error(`[SolidMessageList] 滚动失败 (来源: ${source}):`, error);
      } finally {
        setTimeout(() => {
          manager.isScrolling = false;
        }, 100);
      }
    });
  }, [autoScrollToBottom, scrollToBottom]);

  // 保存滚动方法的引用
  const unifiedScrollToBottomRef = useRef(unifiedScrollToBottom);
  useEffect(() => {
    unifiedScrollToBottomRef.current = unifiedScrollToBottom;
  }, [unifiedScrollToBottom]);

  // ⭐ 监听流式消息时自动滚动
  useEffect(() => {
    if (!autoScrollToBottom) return;
    if (hasStreamingMessage) {
      unifiedScrollToBottomRef.current('streamingCheck');
    }
  }, [hasStreamingMessage, autoScrollToBottom]);

  // ⭐ 监听流式事件，实现实时滚动
  useEffect(() => {
    const throttledTextDeltaHandler = throttle(() => {
      if (!autoScrollToBottom) return;
      
      const container = document.getElementById('messageList');
      if (container) {
        const gap = container.scrollHeight - container.scrollTop - container.clientHeight;
        const isNearBottom = gap < 120;
        if (!isNearBottom) return;
      }
      unifiedScrollToBottomRef.current('textDelta');
    }, 150);

    const scrollToBottomHandler = () => {
      if (!autoScrollToBottom) return;
      unifiedScrollToBottomRef.current('eventHandler', { force: true });
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
  }, [autoScrollToBottom]);

  // ⭐ 消息数量变化时滚动到底部
  const prevMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      unifiedScrollToBottomRef.current('messageLengthChange');
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // ⭐ 键盘弹出时自动滚动到底部
  const prevKeyboardHeightRef = useRef(keyboardHeight);
  useEffect(() => {
    if (keyboardHeight > 0 && prevKeyboardHeightRef.current === 0) {
      setTimeout(() => {
        unifiedScrollToBottomRef.current('keyboardShow', { force: true });
      }, 100);
    }
    prevKeyboardHeightRef.current = keyboardHeight;
  }, [keyboardHeight]);

  // ⭐ 初始加载和话题切换时滚动到底部
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
          unifiedScrollToBottomRef.current(
            isInitialLoadRef.current ? 'initialLoad' : 'topicSwitch', 
            { force: true }
          );
          isInitialLoadRef.current = false;
        }, 150);
      }
    }
  }, [currentTopicId, displayMessages.length]);

  // SolidJS 组件的 props
  const solidProps = useMemo(() => ({
    themeMode: theme.palette.mode,
    onScroll: handleScroll,
    onScrollToTop: loadMoreMessages,
    autoScrollToBottom,
    isStreaming: hasStreamingMessage,
    chatBackground
  }), [theme.palette.mode, handleScroll, loadMoreMessages, autoScrollToBottom, hasStreamingMessage, chatBackground]);

  // React 内容
  const messageContent = useMemo(() => (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 错误提示 */}
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

      {/* 系统提示词气泡 */}
      {showSystemPromptBubble && (
        <SystemPromptBubble
          topic={currentTopic}
          assistant={currentAssistant}
          onClick={handlePromptBubbleClick}
          key={`prompt-bubble-${currentTopic?.id || 'no-topic'}-${currentAssistant?.id || 'no-assistant'}`}
        />
      )}

      {/* 系统提示词对话框 */}
      <SystemPromptDialog
        open={promptDialogOpen}
        onClose={handlePromptDialogClose}
        topic={currentTopic}
        assistant={currentAssistant}
        onSave={handlePromptSave}
      />

      {/* 消息列表 */}
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
            minHeight: '200px'
          }}
        >
          新的对话开始了，请输入您的问题
        </Box>
      ) : (
        <>
          {/* 加载更多按钮 */}
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

          {/* 消息分组 */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {groupedMessages.map(([date, msgs]) => {
              const previousMessagesCount = groupStartIndices.get(date) || 0;
              return (
                <MessageGroup
                  key={date}
                  date={date}
                  messages={msgs}
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
        </>
      )}

      {/* 底部占位 */}
      <div style={{ height: '35px', minHeight: '35px', width: '100%' }} />
    </Box>
  ), [
    error, isRecovering, recoverFromError,
    showSystemPromptBubble, currentTopic, currentAssistant, handlePromptBubbleClick,
    promptDialogOpen, handlePromptDialogClose, handlePromptSave,
    displayMessages.length, theme, hasMore, isNearTop, chatBackground,
    loadMoreMessages, isLoadingMore, groupedMessages, groupStartIndices,
    onRegenerate, onDelete, onSwitchVersion, onResend
  ]);

  return (
    <>
      <SolidBridge
        component={MessageListContainer as any}
        props={solidProps}
        debugName="MessageListContainer"
        debug={false}
        style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}
      />
      {/* 通过 Portal 将 React 内容渲染到 Solid 组件内部 */}
      {portalContainer && createPortal(messageContent, portalContainer)}
    </>
  );
});

SolidMessageList.displayName = 'SolidMessageList';

export default SolidMessageList;
