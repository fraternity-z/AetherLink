/**
 * SolidMessageList - 使用 SolidJS 包装的消息列表组件
 * 外壳用 SolidJS 实现（滚动优化），内容由 React 渲染
 * 使用 SolidBridge 桥接 React 和 SolidJS
 */
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, useTheme } from '@mui/material';
import { SolidBridge } from '../../shared/bridges/SolidBridge';
import { MessageListContainer } from '../../solid/components/MessageList';
import type { Message } from '../../shared/types/newMessage';
import { useSelector } from 'react-redux';
import type { RootState } from '../../shared/store';

import MessageGroup from './MessageGroup';
import SystemPromptBubble from '../SystemPromptBubble';
import SystemPromptDialog from '../SystemPromptDialog';
import type { ChatTopic, Assistant } from '../../shared/types/Assistant';
import { dexieStorage } from '../../shared/services/storage/DexieStorageService';
import { topicCacheManager } from '../../shared/services/TopicCacheManager';
import { getGroupedMessages, MessageGroupingType } from '../../shared/utils/messageGrouping';

interface SolidMessageListProps {
  messages: Message[];
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onSwitchVersion?: (versionId: string) => void;
  onResend?: (messageId: string) => void;
}

const INITIAL_DISPLAY_COUNT = 15;
const LOAD_MORE_COUNT = 15;

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
  const renderCount = useRef(0);
  renderCount.current += 1;

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
        console.error('[SolidMessageList] 加载话题和助手信息失败:', error);
      }
    };
    loadTopicAndAssistant();
  }, [currentTopicId]);

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

  // 话题切换时重置显示数量
  const prevTopicIdRef = useRef(currentTopicId);
  useEffect(() => {
    if (prevTopicIdRef.current !== currentTopicId) {
      setDisplayCount(INITIAL_DISPLAY_COUNT);
      prevTopicIdRef.current = currentTopicId;
    }
  }, [currentTopicId]);

  // 处理滚动事件
  const handleScroll = useCallback((scrollTop: number, _scrollHeight: number, _clientHeight: number) => {
    setIsNearTop(scrollTop < 100);
  }, []);

  // 加载更多消息
  const loadMoreMessages = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + LOAD_MORE_COUNT);
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore]);

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
