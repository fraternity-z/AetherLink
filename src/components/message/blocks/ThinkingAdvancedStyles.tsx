import React, { useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Collapse, useTheme } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Copy, Brain, ChevronDown } from 'lucide-react';
import Markdown from '../Markdown';
import { formatThinkingTimeSeconds } from '../../../shared/utils/thinkingUtils';
import { removeTrailingDoubleSpaces } from '../../../utils/markdown';

// 仅保留：逐字流式显示样式

interface AdvancedStylesProps {
  displayStyle: string;
  isThinking: boolean;
  thinkingTime: number;
  content: string;
  copied: boolean;
  expanded: boolean;
  streamText: string;
  sidebarOpen: boolean; // 保留以不破坏外部调用（已无效）
  overlayOpen: boolean; // 保留以不破坏外部调用（已无效）
  onToggleExpanded: () => void;
  onCopy: (e: React.MouseEvent) => void;
  onSetSidebarOpen: (open: boolean) => void; // 保留无效
  onSetOverlayOpen: (open: boolean) => void; // 保留无效
  onSetStreamText: (text: string) => void;
}

// StreamRenderer（逐字显示）
interface StreamRendererProps {
  isThinking: boolean;
  content: string;
  onSetStreamText: (text: string) => void;
  streamText: string;
  formattedThinkingTime: string;
  onCopy: (e: React.MouseEvent) => void;
  copied: boolean;
  theme: Theme;
  expanded: boolean;
  onToggleExpanded: () => void;
}

const StreamRenderer: React.FC<StreamRendererProps> = React.memo(({
  isThinking,
  content,
  onSetStreamText,
  streamText,
  formattedThinkingTime,
  onCopy,
  copied,
  theme,
  expanded,
  onToggleExpanded,
}) => {
  const currentIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef('');

  useEffect(() => {
    if (isThinking && content) {
      if (!content.startsWith(lastContentRef.current)) {
        currentIndexRef.current = 0;
        if (timerRef.current) clearInterval(timerRef.current);
      }
      lastContentRef.current = content;
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          if (currentIndexRef.current < content.length) {
            onSetStreamText(removeTrailingDoubleSpaces(content.substring(0, currentIndexRef.current + 1)));
            currentIndexRef.current++;
          } else {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
        }, 50);
      }
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else if (!isThinking) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      currentIndexRef.current = 0;
      lastContentRef.current = '';
      onSetStreamText(removeTrailingDoubleSpaces(content));
    }
  }, [isThinking, content, onSetStreamText]);

  return (
    <Box sx={{ mb: 2, position: 'relative' }}>
      <Box
        onClick={onToggleExpanded}
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1,
          p: 1,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }
        }}>
        <Brain size={16} color={theme.palette.primary.main} style={{ marginRight: 8 }} />
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          {isThinking ? '正在思考...' : '思考完成'} ({formattedThinkingTime}s)
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChevronDown
            size={14}
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(e);
            }}
            color={copied ? 'success' : 'default'}
          >
            <Copy size={14} />
          </IconButton>
        </Box>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{
          fontFamily: 'monospace',
          fontSize: '0.9rem',
            lineHeight: 1.6,
          p: 2,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          minHeight: 100,
          position: 'relative',
          '&::after': isThinking ? {
            content: '"▋"',
            animation: 'blink 1s infinite',
            '@keyframes blink': {
              '0%, 50%': { opacity: 1 },
              '51%, 100%': { opacity: 0 }
            }
          } : {}
        }}>
          <Markdown content={removeTrailingDoubleSpaces(streamText)} allowHtml={false} />
        </Box>
      </Collapse>
    </Box>
  );
});
StreamRenderer.displayName = 'StreamRenderer';


/**
 * 思考过程高级显示样式组件
 * 包含2025年新增的先进样式
 */
const ThinkingAdvancedStyles: React.FC<AdvancedStylesProps> = ({
  isThinking,
  thinkingTime,
  content,
  copied,
  expanded,
  streamText,
  onToggleExpanded,
  onCopy,
  onSetStreamText
}) => {
  const theme = useTheme();
  const formattedThinkingTime = formatThinkingTimeSeconds(thinkingTime).toFixed(1);

  // 波浪形思维流动可视化

  // 全屏半透明覆盖层

  // 根据样式选择渲染方法
  // 仅保留 stream 样式
  return (
    <StreamRenderer
      isThinking={isThinking}
      content={content}
      onSetStreamText={onSetStreamText}
      streamText={streamText}
      formattedThinkingTime={formattedThinkingTime}
      onCopy={onCopy}
      copied={copied}
      theme={theme}
      expanded={expanded}
      onToggleExpanded={onToggleExpanded}
    />
  );
};

export default React.memo(ThinkingAdvancedStyles);
