import React, { useState, useCallback } from 'react';
import { Box, Typography, Collapse, IconButton, useTheme, alpha, Divider } from '@mui/material';
import { ChevronRight, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { keyframes, styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../markdown.css';

import { MessageBlockStatus } from '../../../shared/types/newMessage';
import type { ToolMessageBlock } from '../../../shared/types/newMessage';
import { EventEmitter } from '../../../shared/services/EventEmitter';
import { MessageWebSearchTool } from '../MessageWebSearchTool';

interface Props {
  block: ToolMessageBlock;
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

/**
 * 检查是否是 attempt_completion 工具
 */
const isCompletionTool = (block: ToolMessageBlock): boolean => {
  return block.toolName === 'attempt_completion' || 
         (block.metadata as any)?.isCompletionTool === true;
};

/**
 * 检查是否是网络搜索工具
 */
const isWebSearchTool = (block: ToolMessageBlock): boolean => {
  const toolName = block.toolName || block.metadata?.rawMcpToolResponse?.tool?.name || '';
  return toolName === 'builtin_web_search' || 
         toolName === 'web_search' ||
         toolName.includes('web_search');
};

/**
 * 工具调用块组件 - 简约版
 */
const ToolBlock: React.FC<Props> = ({ block }) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  
  // 检查是否是完成工具
  const isCompletion = isCompletionTool(block);
  const isWebSearch = isWebSearchTool(block);

  const toolResponse = block.metadata?.rawMcpToolResponse;
  const isProcessing = block.status === MessageBlockStatus.STREAMING ||
                       block.status === MessageBlockStatus.PROCESSING;
  const isCompleted = block.status === MessageBlockStatus.SUCCESS;
  const hasError = block.status === MessageBlockStatus.ERROR;

  const toggleExpanded = useCallback(() => setExpanded(prev => !prev), []);

  // 格式化请求参数
  const formatParams = useCallback(() => {
    const params = toolResponse?.arguments || block.arguments;
    if (!params) return '';
    try { return JSON.stringify(params, null, 2); }
    catch { return String(params); }
  }, [toolResponse, block.arguments]);

  // 格式化响应内容
  const formatContent = useCallback((response: any): string => {
    if (!response) return '';
    if (response.isError) return `错误: ${response.content?.[0]?.text || '工具调用失败'}`;
    if (response.content?.length > 0) {
      return response.content.map((item: any) => {
        if (item.type === 'text') {
          try { return JSON.stringify(JSON.parse(item.text || ''), null, 2); }
          catch { return item.text || ''; }
        }
        return `[${item.type}: ${item.mimeType || 'unknown'}]`;
      }).join('\n');
    }
    return '';
  }, []);

  const getResult = useCallback(() => {
    if (block.content && typeof block.content === 'object') return formatContent(block.content);
    if (toolResponse?.response) return formatContent(toolResponse.response);
    return '';
  }, [block.content, toolResponse, formatContent]);

  const handleCopyParams = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const text = formatParams();
    if (text) {
      navigator.clipboard.writeText(text);
      EventEmitter.emit('ui:copy_success', { content: '已复制参数' });
    }
  }, [formatParams]);

  const handleCopyResult = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const text = getResult();
    if (text) {
      navigator.clipboard.writeText(text);
      EventEmitter.emit('ui:copy_success', { content: '已复制结果' });
    }
  }, [getResult]);

  // 🚀 检查是否是网络搜索工具，使用专门的 UI 组件（所有 hooks 必须在此之前调用）
  if (isWebSearch) {
    return <MessageWebSearchTool block={block} />;
  }

  const toolName = block.toolName || toolResponse?.tool?.name || '工具';
  const params = formatParams();
  const result = getResult();

  // 状态图标
  const StatusIcon = () => {
    if (isProcessing) return <Loader2 size={14} style={{ animation: `${spin} 1s linear infinite` }} />;
    if (hasError) return <AlertCircle size={14} />;
    if (isCompleted) return <Check size={14} />;
    return null;
  };

  const statusColor = hasError ? theme.palette.error.main 
    : isCompleted ? theme.palette.success.main 
    : theme.palette.info.main;

  // 🎯 attempt_completion 特殊渲染 - 参考 Roo-Code 样式
  if (isCompletion && isCompleted && !hasError) {
    // 解析完成内容，提取 result 字段
    const parseCompletionContent = (): { result: string; command?: string } => {
      try {
        // 尝试从 block.content 解析
        let content = block.content;
        
        // 如果是对象且有 content 数组（MCP 格式）
        if (content && typeof content === 'object' && 'content' in content) {
          const mcpContent = (content as any).content;
          if (Array.isArray(mcpContent) && mcpContent[0]?.text) {
            content = mcpContent[0].text;
          }
        }
        
        // 如果是字符串，尝试解析 JSON
        if (typeof content === 'string') {
          const parsed = JSON.parse(content);
          if (parsed.__agentic_completion__ || parsed.agentic_completion) {
            return {
              result: parsed.result || '任务已完成',
              command: parsed.command
            };
          }
          // 如果不是完成格式，直接返回字符串
          return { result: content };
        }
        
        // 如果是对象，尝试提取 result
        if (content && typeof content === 'object') {
          if ('result' in content) {
            return {
              result: (content as any).result || '任务已完成',
              command: (content as any).command
            };
          }
        }
        
        return { result: '任务已完成' };
      } catch {
        // 解析失败，返回原始内容或默认值
        if (typeof block.content === 'string') {
          return { result: block.content };
        }
        return { result: '任务已完成' };
      }
    };
    
    const { result: completionResult, command: suggestedCommand } = parseCompletionContent();
    
    return (
      <Box sx={{ mb: 1 }}>
        {/* 标题行：绿色勾号 + 任务完成 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.25,
          mb: 1.25
        }}>
          <Check size={16} color={theme.palette.success.main} />
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600, 
              color: 'success.main'
            }}
          >
            任务完成
          </Typography>
        </Box>
        
        {/* 内容区域：左侧绿色边框 + Markdown 内容 */}
        <Box 
          className="markdown"
          sx={{ 
            borderLeft: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
            ml: 0.25,
            pl: 2,
            pb: 0.5
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <div className="markdown-table-container">
                  <table>{children}</table>
                </div>
              )
            }}
          >
            {completionResult}
          </ReactMarkdown>
          
          {/* 如果有建议命令，显示命令 */}
          {suggestedCommand && (
            <Box sx={{ 
              mt: 1.5, 
              p: 1, 
              bgcolor: alpha(theme.palette.info.main, 0.1),
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                建议执行：
              </Typography>
              <code>{suggestedCommand}</code>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Container>
      {/* 标题栏 */}
      <Header onClick={toggleExpanded}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          <Box sx={{ color: statusColor, display: 'flex', alignItems: 'center' }}>
            <StatusIcon />
          </Box>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'text.secondary' }}
          >
            @{toolName}
          </Typography>
          {isCompleted && !hasError && (
            <Typography variant="caption" sx={{ color: 'success.main' }}>✓</Typography>
          )}
        </Box>
        <IconButton
          size="small"
          sx={{ p: 0.5, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <ChevronRight size={16} />
        </IconButton>
      </Header>

      {/* 展开内容 */}
      <Collapse in={expanded} timeout={200}>
        <Content>
          {/* 请求参数 */}
          {params && (
            <Section>
              <SectionHeader>
                <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  请求参数
                </Typography>
                <IconButton size="small" onClick={handleCopyParams} sx={{ p: 0.25 }}>
                  <Copy size={12} />
                </IconButton>
              </SectionHeader>
              <Pre>{params}</Pre>
            </Section>
          )}

          {params && (result || isProcessing) && <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />}

          {/* 执行结果 */}
          {isProcessing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
              <Loader2 size={14} style={{ animation: `${spin} 1s linear infinite`, color: statusColor }} />
              <Typography variant="caption" color="text.secondary">执行中...</Typography>
            </Box>
          ) : result && (
            <Section>
              <SectionHeader>
                <Typography variant="caption" sx={{ fontWeight: 500, color: hasError ? 'error.main' : 'text.secondary' }}>
                  执行结果
                </Typography>
                <IconButton size="small" onClick={handleCopyResult} sx={{ p: 0.25 }}>
                  <Copy size={12} />
                </IconButton>
              </SectionHeader>
              <Pre hasError={hasError}>{result}</Pre>
            </Section>
          )}
        </Content>
      </Collapse>
    </Container>
  );
};

// 简约样式
const Container = styled(Box)(({ theme }) => ({
  borderRadius: 8,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(1),
  overflow: 'hidden'
}));

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.75, 1),
  cursor: 'pointer',
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.default, 0.5)
    : theme.palette.grey[50],
  '&:hover': { backgroundColor: theme.palette.action.hover }
}));

const Content = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default
}));

const Section = styled(Box)({ marginBottom: 0 });

const SectionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 4
});

const Pre = styled('pre', {
  shouldForwardProp: (prop) => prop !== 'hasError'
})<{ hasError?: boolean }>(({ theme, hasError }) => ({
  margin: 0,
  padding: theme.spacing(1),
  fontSize: '0.75rem',
  fontFamily: '"Fira Code", "JetBrains Mono", monospace',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxHeight: 200,
  overflow: 'auto',
  color: hasError ? theme.palette.error.main : theme.palette.text.secondary,
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[900]
    : theme.palette.grey[100],
  borderRadius: 4,
  '&::-webkit-scrollbar': { width: 4 },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.grey[400],
    borderRadius: 2
  }
}));

// 比较函数
const arePropsEqual = (prev: Props, next: Props) => {
  return prev.block.id === next.block.id &&
         prev.block.status === next.block.status &&
         prev.block.content === next.block.content &&
         prev.block.updatedAt === next.block.updatedAt;
};

export default React.memo(ToolBlock, arePropsEqual);
