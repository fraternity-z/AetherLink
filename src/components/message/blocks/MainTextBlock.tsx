import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { throttle } from 'lodash';
import type { RootState } from '../../../shared/store';
import { messageBlocksSelectors } from '../../../shared/store/slices/messageBlocksSlice';
import type { MainTextMessageBlock, ToolMessageBlock } from '../../../shared/types/newMessage';
import { MessageBlockType, MessageBlockStatus } from '../../../shared/types/newMessage';
import Markdown from '../Markdown';
import ToolBlock from './ToolBlock';
import { hasToolUseTags, fixBrokenToolTags } from '../../../shared/utils/mcpToolParser';
import {
  getHighPerformanceUpdateInterval
} from '../../../shared/utils/performanceSettings';

interface Props {
  block: MainTextMessageBlock;
  role: string;
  messageId?: string;
}

// 在 MainTextBlock 中传递角色信息
const MainTextBlock: React.FC<Props> = ({ block, role, messageId }) => {
  const content = block.content || '';
  const isUserMessage = role === 'user';
  const isStreaming = block.status === MessageBlockStatus.STREAMING;

  // 获取当前消息的工具块，使用 useMemo 优化性能
  // 🔥 关键修复：按照消息的 blocks 数组顺序排序工具块
  const toolBlocks = useSelector((state: RootState) => {
    if (!messageId) return [];
    const entities = messageBlocksSelectors.selectEntities(state);
    
    // 获取消息对象，以便按照 blocks 数组顺序排序
    const message = state.messages.entities[messageId];
    if (!message?.blocks) {
      // 如果没有消息或 blocks 数组，按创建时间排序
      return Object.values(entities)
        .filter(
          (block): block is ToolMessageBlock =>
            block?.type === MessageBlockType.TOOL &&
            block.messageId === messageId
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    
    // 🔥 按照消息的 blocks 数组顺序排序工具块
    const toolBlocksMap = new Map<string, ToolMessageBlock>();
    Object.values(entities).forEach((block) => {
      if (block?.type === MessageBlockType.TOOL && block.messageId === messageId) {
        toolBlocksMap.set(block.id, block as ToolMessageBlock);
      }
    });
    
    // 按照消息的 blocks 数组顺序返回工具块
    const sortedToolBlocks: ToolMessageBlock[] = [];
    for (const blockId of message.blocks) {
      const toolBlock = toolBlocksMap.get(blockId);
      if (toolBlock) {
        sortedToolBlocks.push(toolBlock);
      }
    }
    
    return sortedToolBlocks;
  }, (left, right) => {
    // 🔥 自定义比较函数：比较工具块的关键属性，确保更新时能正确重新渲染
    if (left.length !== right.length) return false;
    return left.every((leftBlock, index) => {
      const rightBlock = right[index];
      if (!rightBlock) return false;
      
      // 比较基本属性
      if (leftBlock?.id !== rightBlock?.id ||
          leftBlock?.status !== rightBlock?.status ||
          leftBlock?.content !== rightBlock?.content ||
          leftBlock?.updatedAt !== rightBlock?.updatedAt) {
        return false;
      }
      
      // 🔥 关键修复：比较 metadata，确保 MCP 工具响应数据更新时能重新渲染
      const leftMetadata = leftBlock?.metadata;
      const rightMetadata = rightBlock?.metadata;
      if (leftMetadata !== rightMetadata) {
        // 如果 metadata 对象引用不同，比较关键字段
        if (JSON.stringify(leftMetadata?.rawMcpToolResponse) !== 
            JSON.stringify(rightMetadata?.rawMcpToolResponse)) {
          return false;
        }
      }
      
      // 🔥 比较 arguments，确保工具调用参数更新时能重新渲染
      if (JSON.stringify(leftBlock?.arguments) !== JSON.stringify(rightBlock?.arguments)) {
        return false;
      }
      
      return true;
    });
  });

  // 获取用户输入渲染设置
  const renderUserInputAsMarkdown = useSelector((state: RootState) => state.settings.renderUserInputAsMarkdown);

  // 🚀 流式输出节流机制
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

  // 处理内容和工具块的原位置渲染
  const renderedContent = useMemo(() => {

    // 创建一个临时的 block 对象，使用节流后的内容
    const displayBlock = { ...block, content: displayContent };

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

    //  使用工具解析器的检测函数，支持自动修复被分割的标签
    const hasTools = hasToolUseTags(displayContent);

    if (isUserMessage || !hasTools) {
      // 传递消息角色，使用节流后的内容
      return <Markdown block={displayBlock} messageRole={role as 'user' | 'assistant' | 'system'} />;
    }

    // 使用已经获取的工具块

    //  使用修复后的内容进行工具标签处理（使用节流后的内容）
    const fixedContent = fixBrokenToolTags(displayContent);

    // 检测工具标签和工具块的匹配情况
    const toolUseMatches = fixedContent.match(/<tool_use[\s\S]*?<\/tool_use>/gi) || [];

    if (toolBlocks.length === 0) {
      // 没有工具块，移除工具标签
      if (toolUseMatches.length > 0) {
        console.warn(`[MainTextBlock] 工具块缺失：检测到 ${toolUseMatches.length} 个工具标签但没有工具块`);
      }
      const cleanContent = fixedContent.replace(/<tool_use[\s\S]*?<\/tool_use>/gi, '');
      return <Markdown content={cleanContent} allowHtml={false} />;
    }

    // 分割内容并插入工具块
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let toolIndex = 0;

    // 使用更宽松的正则表达式匹配工具标签
    const toolUseRegex = /<tool_use[\s\S]*?<\/tool_use>/gi;
    let match;

    while ((match = toolUseRegex.exec(fixedContent)) !== null) {
      // 添加工具标签前的文本
      if (match.index > lastIndex) {
        const textBefore = fixedContent.slice(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(
            <Markdown key={`text-${parts.length}`} content={textBefore} allowHtml={false} />
          );
        }
      }

      // 添加工具块（如果存在）
      if (toolIndex < toolBlocks.length) {
        const toolBlock = toolBlocks[toolIndex];
        // 只在开发环境输出调试信息
        if (process.env.NODE_ENV === 'development' && toolIndex === 0) {
          console.log(`[MainTextBlock] 渲染 ${toolBlocks.length} 个工具块，消息ID: ${messageId}`);
        }
        parts.push(
          <div key={`tool-${toolBlock.id}`} style={{ margin: '16px 0' }}>
            <ToolBlock block={toolBlock} />
          </div>
        );
        toolIndex++;
      } else {
        // 如果工具块不够，显示占位符
        console.warn(`[MainTextBlock] 工具块不足，跳过第 ${toolIndex} 个工具标签`);
        parts.push(
          <div key={`placeholder-${toolIndex}`} style={{ margin: '16px 0', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <span style={{ color: '#666' }}>工具调用处理中...</span>
          </div>
        );
        toolIndex++;
      }

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的文本
    if (lastIndex < fixedContent.length) {
      const textAfter = fixedContent.slice(lastIndex);
      if (textAfter.trim()) {
        parts.push(
          <Markdown key={`text-${parts.length}`} content={textAfter} allowHtml={false} />
        );
      }
    }

    return <>{parts}</>;
  }, [displayContent, isUserMessage, toolBlocks, messageId, renderUserInputAsMarkdown, block, role]);

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
