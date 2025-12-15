import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';
import type { RootState } from '../../../shared/store';
import type { MainTextMessageBlock } from '../../../shared/types/newMessage';
import { MessageBlockStatus } from '../../../shared/types/newMessage';
import Markdown from '../Markdown';
import { selectCitationsForMessage } from '../../../shared/store/selectors/messageBlockSelectors';
import type { Citation } from '../../../shared/types/citation';
import { applyRegexRulesForDisplay } from '../../../shared/utils/regexUtils';

// 稳定的空数组引用
const EMPTY_CITATIONS: Citation[] = [];

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
  const rawContent = block.content || '';
  const isUserMessage = role === 'user';

  // 获取用户输入渲染设置
  const renderUserInputAsMarkdown = useSelector((state: RootState) => state.settings.renderUserInputAsMarkdown);
  
  // 获取当前助手的正则规则
  const regexRules = useSelector((state: RootState) => state.assistants.currentAssistant?.regexRules);
  
  // 应用正则规则进行显示处理（包括 visualOnly 规则）
  const content = useMemo(() => {
    if (!regexRules || regexRules.length === 0) return rawContent;
    const scope = role as 'user' | 'assistant';
    return applyRegexRulesForDisplay(rawContent, regexRules, scope);
  }, [rawContent, regexRules, role]);
  
  // 🔍 动态获取同消息的引用信息（参数化 selector）
  const citations = useSelector((state: RootState): Citation[] => {
    if (role !== 'assistant') return EMPTY_CITATIONS;
    return selectCitationsForMessage(state, messageId);
  });
  
  // 🏷️ 创建内容后处理函数（引用标记转换）
  const postProcessContent = useCallback((rawContent: string): string => {
    if (citations.length === 0) return rawContent;
    return rawContent; // 已在 Markdown 内处理 citations 时再决定是否转换
  }, [citations.length]);

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
          {content}
        </Box>
      );
    }

    // 移除工具标签（工具块在 MessageBlockRenderer 中独立渲染）
    const cleanContent = content.replace(/<tool_use[\s\S]*?<\/tool_use>/gi, '');
    
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
        isStreaming={block.status === MessageBlockStatus.STREAMING}
        postProcess={hasCitations ? postProcessContent : undefined}
        allowHtml={hasCitations}
      />
    );
  }, [content, isUserMessage, renderUserInputAsMarkdown, block, role, citations.length, postProcessContent]);

  if (!content.trim()) {
    return null;
  }

  return (
    <div className="main-text-block">
      {renderedContent}
    </div>
  );
};

export default MainTextBlock;
