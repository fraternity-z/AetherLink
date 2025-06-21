import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import type { Message } from '../../shared/types/newMessage.ts';
import MessageGroup from './MessageGroup';
import SystemPromptBubble from '../SystemPromptBubble';
import SystemPromptDialog from '../SystemPromptDialog';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../shared/store';
import { throttle } from 'lodash';
import InfiniteScroll from 'react-infinite-scroll-component';

import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import { upsertManyBlocks } from '../../shared/store/slices/messageBlocksSlice';
import { newMessagesActions } from '../../shared/store/slices/newMessagesSlice';
import useScrollPosition from '../../hooks/useScrollPosition';
import { getGroupedMessages, MessageGroupingType } from '../../shared/utils/messageGrouping';
import { EventEmitter, EVENT_NAMES } from '../../shared/services/EventEmitter';
import { generateBlockId } from '../../shared/utils';
import { scrollContainerStyles, scrollbarStyles, getOptimizedConfig, debugScrollPerformance } from '../../shared/config/scrollOptimization';
import ScrollPerformanceMonitor from '../debug/ScrollPerformanceMonitor';

// 加载更多消息的数量
const LOAD_MORE_COUNT = 20;

// 改造为：简化消息显示逻辑
const computeDisplayMessages = (messages: Message[], startIndex: number, displayCount: number) => {
  console.log(`[computeDisplayMessages] 输入 ${messages.length} 条消息，从索引 ${startIndex} 开始，显示 ${displayCount} 条`);

  // ：消息已经按时间顺序存储，直接使用
  // 为了让最新消息显示在底部，我们需要从末尾开始取消息
  const totalMessages = messages.length;

  if (totalMessages === 0) {
    return [];
  }

  // 计算实际的起始位置（从末尾倒数）
  const actualStartIndex = Math.max(0, totalMessages - startIndex - displayCount);
  const actualEndIndex = totalMessages - startIndex;

  const displayMessages = messages.slice(actualStartIndex, actualEndIndex);

  console.log(`[computeDisplayMessages] 返回 ${displayMessages.length} 条消息，索引范围: ${actualStartIndex}-${actualEndIndex}`);
  return displayMessages;
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

  // 🚀 获取优化配置
  const optimizedConfig = React.useMemo(() => getOptimizedConfig(), []);

  // 🚀 调试性能配置（仅在开发环境）
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      debugScrollPerformance();
    }
  }, []);

  // 无限滚动相关状态
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayCount] = useState(optimizedConfig.virtualScrollThreshold); // 🚀 使用优化配置

  // 添加强制更新机制 - 使用更稳定的实现
  const [, setUpdateCounter] = useState(0);
  const forceUpdate = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
  }, []);

  // 使用 ref 存储 forceUpdate，避免依赖项变化
  const forceUpdateRef = useRef(forceUpdate);
  useEffect(() => {
    forceUpdateRef.current = forceUpdate;
  }, [forceUpdate]);

  // 获取所有消息块的状态
  const messageBlocks = useSelector((state: RootState) => state.messageBlocks.entities);

  // 从 Redux 获取当前话题ID
  const currentTopicId = useSelector((state: RootState) => state.messages.currentTopicId);

  // 从数据库获取当前话题和助手信息
  const [currentTopic, setCurrentTopic] = useState<any>(null);
  const [currentAssistant, setCurrentAssistant] = useState<any>(null);

  // 当话题ID变化时，从数据库获取话题和助手信息
  useEffect(() => {
    const loadTopicAndAssistant = async () => {
      if (!currentTopicId) return;

      try {
        // 获取话题
        const topic = await dexieStorage.getTopic(currentTopicId);
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
        console.error('加载话题和助手信息失败:', error);
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

  // 节流的滚动到底部函数
  const throttledScrollToBottom = useMemo(
    () => throttle(scrollToBottom, 100, { leading: true, trailing: true }),
    [scrollToBottom]
  );

  // 使用 ref 存储 throttledScrollToBottom，避免闭包问题
  const throttledScrollToBottomRef = useRef(throttledScrollToBottom);
  useEffect(() => {
    throttledScrollToBottomRef.current = throttledScrollToBottom;
  }, [throttledScrollToBottom]);

  // 使用节流的状态检查，避免过度渲染
  const throttledStreamingCheck = useMemo(
    () => throttle(() => {
      // 检查是否启用自动滚动
      if (!autoScrollToBottom) return;

      // 检查是否有正在流式输出的块
      const hasStreamingBlock = Object.values(messageBlocks || {}).some(
        block => block?.status === 'streaming'
      );

      // 检查是否有正在流式输出的消息
      const hasStreamingMessage = messages.some(
        message => message.status === 'streaming'
      );

      // 如果有正在流式输出的块或消息，滚动到底部
      if (hasStreamingBlock || hasStreamingMessage) {
        // 使用 setTimeout 确保在DOM更新后滚动
        setTimeout(() => {
          throttledScrollToBottom();
        }, 10);
      }
    }, 100), // 100ms节流
    [messageBlocks, messages, throttledScrollToBottom, autoScrollToBottom]
  );

  // 监听消息块状态变化，但使用节流避免过度更新
  useEffect(() => {
    throttledStreamingCheck();
  }, [throttledStreamingCheck]);

  // 添加流式输出事件监听 - 使用节流优化性能
  useEffect(() => {
    // 检查是否启用高性能模式，动态调整节流时间
    const getScrollThrottleTime = () => {
      // 检查是否有正在流式输出的块
      const hasStreamingBlock = Object.values(messageBlocks || {}).some(
        block => block?.status === 'streaming'
      );

      if (hasStreamingBlock) {
        // 使用同步方式获取性能设置，避免async问题
        try {
          // 直接从localStorage读取高性能设置
          const highPerformanceStreaming = localStorage.getItem('highPerformanceStreaming') === 'true';
          if (highPerformanceStreaming) {
            return 300; // 高性能模式：300ms
          }
        } catch (error) {
          console.warn('无法加载性能设置，使用默认值');
        }
      }

      return 50; // 默认：50ms节流，约20fps
    };

    // 使用动态节流时间的事件处理器
    const throttledTextDeltaHandler = throttle(() => {
      // 检查是否启用自动滚动
      if (!autoScrollToBottom) return;

      // 使用 setTimeout 确保在DOM更新后滚动
      setTimeout(() => {
        if (throttledScrollToBottomRef.current) {
          throttledScrollToBottomRef.current();
        }
      }, 10);
    }, getScrollThrottleTime());

    // 监听滚动到底部事件
    const scrollToBottomHandler = () => {
      // 尝试使用 messagesEndRef 滚动到底部
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      } else {
        // 如果 messagesEndRef 不可用，使用 throttledScrollToBottom
        if (throttledScrollToBottomRef.current) {
          throttledScrollToBottomRef.current();
        }
      }
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
  }, []); // 移除所有依赖，避免无限循环

  // 当消息数量变化时滚动到底部 - 使用节流避免过度滚动
  const throttledMessageLengthScroll = useMemo(
    () => throttle(() => {
      // 检查是否启用自动滚动
      if (!autoScrollToBottom) return;

      // 使用 setTimeout 确保在DOM更新后滚动
      setTimeout(() => {
        // 尝试使用 messagesEndRef 滚动到底部
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        } else {
          // 如果 messagesEndRef 不可用，使用 throttledScrollToBottom
          throttledScrollToBottom();
        }
      }, 10);
    }, 200), // 200ms节流，避免频繁滚动
    [throttledScrollToBottom, autoScrollToBottom]
  );

  useEffect(() => {
    throttledMessageLengthScroll();
  }, [messages.length, throttledMessageLengthScroll]);

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

  // 确保所有消息的块都已加载到Redux中 - 使用节流避免频繁加载
  const throttledLoadBlocks = useMemo(
    () => throttle(async () => {
      // 创建一个集合来跟踪已加载的块ID，避免重复加载
      const loadedBlockIds = new Set();
      const blocksToLoad = [];

      for (const message of messages) {
        if (message.blocks && message.blocks.length > 0) {
          for (const blockId of message.blocks) {
            // 如果这个块已经在Redux中，跳过
            if (messageBlocks[blockId]) {
              loadedBlockIds.add(blockId);
              continue;
            }

            // 如果这个块已经在待加载列表中，跳过
            if (loadedBlockIds.has(blockId)) {
              continue;
            }

            try {
              const block = await dexieStorage.getMessageBlock(blockId);
              if (block) {
                blocksToLoad.push(block);
                loadedBlockIds.add(blockId);
              } else {
                console.warn(`[MessageList] 数据库中找不到块: ${blockId}`);

                // 如果找不到块，创建一个临时块
                if (message.role === 'assistant' && message.status === 'success') {
                  const tempBlock = {
                    id: blockId,
                    messageId: message.id,
                    type: 'main_text',
                    content: (message as any).content || '',
                    createdAt: message.createdAt,
                    status: 'success'
                  };
                  blocksToLoad.push(tempBlock);
                  loadedBlockIds.add(blockId);
                }
              }
            } catch (error) {
              console.error(`[MessageList] 加载块 ${blockId} 失败:`, error);
            }
          }
        } else if (message.role === 'assistant' && message.status === 'success' && (!message.blocks || message.blocks.length === 0)) {
          try {
            // 如果助手消息没有块但有内容，创建一个新块
            const newBlockId = generateBlockId('block');
            const newBlock = {
              id: newBlockId,
              messageId: message.id,
              type: 'main_text',
              content: (message as any).content || '',
              createdAt: message.createdAt,
              status: 'success'
            };

            blocksToLoad.push(newBlock);
            loadedBlockIds.add(newBlockId);

            // 不直接修改消息对象，而是通过Redux action更新
            dispatch(newMessagesActions.updateMessage({
              id: message.id,
              changes: {
                blocks: [newBlockId]
              }
            }));

            // 同时更新数据库
            await dexieStorage.updateMessage(message.id, {
              blocks: [newBlockId]
            });
          } catch (error) {
            console.error(`[MessageList] 更新消息块引用失败:`, error);
          }
        }
      }

      if (blocksToLoad.length > 0) {
        // 使用类型断言解决类型不匹配问题
        dispatch(upsertManyBlocks(blocksToLoad as any));
      }
    }, 300), // 300ms节流，避免频繁加载
    [messages, messageBlocks, dispatch]
  );

  useEffect(() => {
    throttledLoadBlocks();
  }, [throttledLoadBlocks]);

  // 改造为：直接使用有序消息，无需去重
  const filteredMessages = useMemo(() => {
    console.log(`[MessageList] 使用，直接使用 ${messages.length} 条有序消息，无需去重`);
    // ：假设消息已经按时间顺序存储且无重复，直接使用
    return messages;
  }, [messages]);

  // 计算显示的消息 - 使用记忆化避免重复计算
  const memoizedDisplayMessages = useMemo(() => {
    return computeDisplayMessages(filteredMessages, 0, displayCount);
  }, [filteredMessages, displayCount]);

  const memoizedHasMore = useMemo(() => {
    return filteredMessages.length > displayCount;
  }, [filteredMessages.length, displayCount]);

  // 只在记忆化结果变化时更新状态
  useEffect(() => {
    setDisplayMessages(memoizedDisplayMessages);
    setHasMore(memoizedHasMore);
  }, [memoizedDisplayMessages, memoizedHasMore]);

  // 加载更多消息的函数
  const loadMoreMessages = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      const currentLength = displayMessages.length;
      const newMessages = computeDisplayMessages(filteredMessages, currentLength, LOAD_MORE_COUNT);

      setDisplayMessages((prev) => [...prev, ...newMessages]);
      setHasMore(currentLength + LOAD_MORE_COUNT < filteredMessages.length);
      setIsLoadingMore(false);
    }, 300);
  }, [displayMessages.length, hasMore, isLoadingMore, filteredMessages]);

  // 获取消息分组设置
  const messageGroupingType = useSelector((state: RootState) =>
    (state.settings as any).messageGrouping || 'byDate'
  );

  // 对显示的消息进行分组
  const groupedMessages = useMemo(() => {
    return Object.entries(getGroupedMessages(displayMessages, messageGroupingType as MessageGroupingType));
  }, [displayMessages, messageGroupingType]);

  // 移除虚拟滚动相关的函数，使用简单的DOM渲染

  // 获取背景设置
  const chatBackground = useSelector((state: RootState) =>
    state.settings.chatBackground || { enabled: false }
  );

  return (
    <Box
      id="messageList"
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
        // 使用无限滚动优化性能
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column-reverse' }}>
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
            inverse={false}
            style={{ overflow: 'visible', display: 'flex', flexDirection: 'column' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {groupedMessages.map(([date, messages], groupIndex) => {
                // 计算当前组之前的所有消息数量，用于计算全局索引
                const previousMessagesCount = groupedMessages
                  .slice(0, groupIndex)
                  .reduce((total, [, msgs]) => total + msgs.length, 0);

                return (
                  <MessageGroup
                    key={date}
                    date={date}
                    messages={messages}
                    expanded={true}
                    forceUpdate={forceUpdateRef.current}
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

      {/* 🚀 性能监控组件 */}
      <ScrollPerformanceMonitor
        targetId="messageList"
      />
    </Box>
  );
};

export default MessageList;
