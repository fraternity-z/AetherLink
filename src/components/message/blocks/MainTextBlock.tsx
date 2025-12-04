import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { throttle } from 'lodash';
import type { RootState } from '../../../shared/store';
import type { MainTextMessageBlock, ToolMessageBlock, MessageBlock } from '../../../shared/types/newMessage';
import { MessageBlockStatus } from '../../../shared/types/newMessage';
import Markdown from '../Markdown';
import {
  getHighPerformanceUpdateInterval
} from '../../../shared/utils/performanceSettings';
import {
  withCitationTags,
  extractCitationsFromToolBlock,
  isWebSearchToolBlock
} from '../../../shared/utils/citation';
import type { Citation } from '../../../shared/types/citation';


interface Props {
  block: MainTextMessageBlock;
  role: string;
  messageId?: string;
}

/**
 * 主文本块组件
 * 工具块在 MessageBlockRenderer 中独立渲染
 */
const MainTextBlock: React.FC<Props> = ({ block, role, messageId }) => {
  const content = block.content || '';
  const isUserMessage = role === 'user';
  const isStreaming = block.status === MessageBlockStatus.STREAMING;

  // 获取用户输入渲染设置
  const renderUserInputAsMarkdown = useSelector((state: RootState) => state.settings.renderUserInputAsMarkdown);
  
  // 🔍 动态获取同消息的网络搜索结果（用于引用渲染）
  const citations = useSelector((state: RootState): Citation[] => {
    // 只为助手消息处理引用
    if (role !== 'assistant' || !messageId) return [];
    
    const message = state.messages.entities[messageId];
    if (!message?.blocks) return [];
    
    // 查找同消息中的网络搜索工具块
    const webSearchBlocks = message.blocks
      .map((blockId: string) => state.messageBlocks.entities[blockId])
      .filter((b: MessageBlock | undefined): b is ToolMessageBlock =>
        b !== undefined && isWebSearchToolBlock(b as any)
      );
    
    // 从工具块中提取引用
    return webSearchBlocks.flatMap((tb: ToolMessageBlock) =>
      extractCitationsFromToolBlock(tb)
    );
  });
  
  // 🏷️ 创建内容后处理函数（引用标记转换）
  const postProcessContent = useCallback((rawContent: string): string => {
    if (citations.length === 0) return rawContent;
    return withCitationTags(rawContent, citations);
  }, [citations]);

  // � 流式输出节流机制
  const [throttledContent, setThrottledContent] = useState(content);
  const contentRef = useRef(content);

  // 🎯 流式输出时使用节流
  const shouldUseThrottling = isStreaming;

  // 创建节流更新函数
  const throttledUpdate = useMemo(() => {
    if (!shouldUseThrottling) {
      return null;
    }

    const interval = getHighPerformanceUpdateInterval();

    return throttle(() => {
      setThrottledContent(contentRef.current);
    }, interval);
  }, [shouldUseThrottling]);

  // 更新内容
  useEffect(() => {
    contentRef.current = content;

    if (throttledUpdate && shouldUseThrottling) {
      throttledUpdate();
    } else {
      // 非流式状态时，立即更新
      setThrottledContent(content);
    }
  }, [content, throttledUpdate, shouldUseThrottling]);

  // 清理节流函数
  useEffect(() => {
    return () => throttledUpdate?.cancel();
  }, [throttledUpdate]);

  // 决定使用哪个内容进行渲染
  const displayContent = shouldUseThrottling ? throttledContent : content;

  // 渲染内容
  const renderedContent = useMemo(() => {
    // 如果是用户消息且设置为不渲染markdown，则显示纯文本
    if (isUserMessage && !renderUserInputAsMarkdown) {
      return (
        <Box sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.6,
          fontFamily: 'inherit'
        }}>
          {displayContent}
        </Box>
      );
    }

    // 移除工具标签（工具块在 MessageBlockRenderer 中独立渲染）
    const cleanContent = displayContent.replace(/<tool_use[\s\S]*?<\/tool_use>/gi, '');
    
    // 如果清理后没有内容，返回 null
    if (!cleanContent.trim()) {
      return null;
    }
    
    // 创建显示块
    const cleanDisplayBlock = { ...block, content: cleanContent };
    
    // 当有引用时，需要启用 HTML 解析以正确渲染 <sup> 标签
    const hasCitations = citations.length > 0;
    
    return (
      <Markdown
        block={cleanDisplayBlock}
        messageRole={role as 'user' | 'assistant' | 'system'}
        isStreaming={isStreaming}
        postProcess={hasCitations ? postProcessContent : undefined}
        allowHtml={hasCitations}
      />
    );
  }, [displayContent, isUserMessage, renderUserInputAsMarkdown, block, role, isStreaming, citations.length, postProcessContent]);

  if (!displayContent.trim()) {
    return null;
  }

  return (
    <div className="main-text-block">
      {renderedContent}
    </div>
  );
};

export default MainTextBlock;
