import React, { useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Chip,
  useTheme
} from '@mui/material';
import {
  Lightbulb,
  Copy,
  ChevronDown
} from 'lucide-react';
import { styled, keyframes } from '@mui/material/styles';
import { motion } from 'motion/react';

import Markdown from '../Markdown';
import { formatThinkingTimeSeconds } from '../../../shared/utils/thinkingUtils';
import { getThinkingScrollbarStyles } from '../../../shared/utils/scrollbarStyles';
import { useTranslation } from '../../../i18n';

// 滚动预览区域的最大行数
const PREVIEW_MAX_LINES = 4;
// 滚动预览区域的固定高度
const PREVIEW_HEIGHT = 80;

// 公共动画配置
const getThinkingAnimation = (isThinking: boolean) => ({
  animate: isThinking ? { opacity: [1, 0.3, 1], scale: [1, 1.1, 1] } : { opacity: 1, scale: 1 },
  transition: {
    duration: isThinking ? 1.2 : 0.3,
    ease: "easeInOut" as const,
    repeat: isThinking ? Infinity : 0,
    times: isThinking ? [0, 0.5, 1] : undefined
  }
});

// 公共半透明背景样式
const getGlassBackground = (isDark: boolean) => ({
  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
});

// 样式化组件
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
  transition: theme.transitions.create(['background-color', 'box-shadow']),
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  transform: 'translateZ(0)',
  WebkitTapHighlightColor: 'transparent',
  outline: 'none',
  userSelect: 'none'
}));

export interface ThinkingCompactStyleProps {
  expanded: boolean;
  isThinking: boolean;
  thinkingTime: number;
  content: string;
  copied: boolean;
  onToggleExpanded: () => void;
  onCopy: (e: React.MouseEvent) => void;
}

// 光标闪烁动画
const cursorBlink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

/**
 * 思考过程紧凑样式组件
 * 圆滑紧凑的折叠式设计，支持展开查看完整内容
 * 思考中时显示滚动预览，自动滚动到最新内容
 */
const ThinkingCompactStyle: React.FC<ThinkingCompactStyleProps> = ({
  expanded,
  isThinking,
  thinkingTime,
  content,
  copied,
  onToggleExpanded,
  onCopy
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevIsThinkingRef = useRef(isThinking);
  
  // 格式化思考时间（毫秒转为秒，保留1位小数）
  const formattedThinkingTime = formatThinkingTimeSeconds(thinkingTime).toFixed(1);

  // 获取最新几行内容用于预览
  const previewContent = useMemo(() => {
    if (!content) return '';
    const lines = content.split('\n');
    if (lines.length <= PREVIEW_MAX_LINES) return content;
    return lines.slice(-PREVIEW_MAX_LINES).join('\n');
  }, [content]);

  // 自动滚动到底部（思考中时）
  useEffect(() => {
    if (isThinking && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isThinking]);

  // 思考完成后自动折叠（通过触发父组件的 onToggleExpanded）
  useEffect(() => {
    if (prevIsThinkingRef.current && !isThinking && expanded) {
      // 延迟一点收起，让用户看到最终结果
      const timer = setTimeout(() => {
        onToggleExpanded();
      }, 800);
      return () => clearTimeout(timer);
    }
    prevIsThinkingRef.current = isThinking;
  }, [isThinking, expanded, onToggleExpanded]);

  // 辅助函数：处理复制按钮点击，阻止事件冒泡
  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(e);
  };

  return (
    <StyledPaper
      onClick={onToggleExpanded}
      elevation={0}
      sx={{
        cursor: 'pointer',
        mb: 1.5,
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        ...getGlassBackground(theme.palette.mode === 'dark'),
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(45, 45, 45, 0.92)' : 'rgba(250, 250, 250, 0.95)',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : '0 4px 12px rgba(0,0,0,0.08)',
        }
      }}
    >
      {/* 标题栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          py: 1,
          borderBottom: (expanded || isThinking) ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` : 'none'
        }}
      >
        <motion.div {...getThinkingAnimation(isThinking)} style={{ marginRight: theme.spacing(0.75) }}>
          <Lightbulb size={16} color={isThinking ? theme.palette.warning.main : theme.palette.text.secondary} />
        </motion.div>

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 0.75 }}>
          <Typography variant="body2" component="span" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
            {t('settings.appearance.thinkingProcess.preview.texts.thinkingProcess')}
          </Typography>
          <Chip
            label={isThinking ? t('settings.appearance.thinkingProcess.preview.texts.thinkingInProgress', { time: formattedThinkingTime }) : t('settings.appearance.thinkingProcess.preview.texts.thinkingCompleteTime', { time: formattedThinkingTime })}
            size="small"
            color={isThinking ? "warning" : "default"}
            variant="outlined"
            sx={{ 
              height: 18, 
              fontSize: '0.65rem',
              borderRadius: '9px',
              '& .MuiChip-label': { px: 1 }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton
            size="small"
            onClick={handleCopyClick}
            color={copied ? "success" : "default"}
            sx={{ 
              p: 0.5,
              borderRadius: '8px',
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <Copy size={14} />
          </IconButton>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '8px',
              transition: 'background-color 0.2s',
              '&:hover': { backgroundColor: theme.palette.action.hover }
            }}
          >
            <ChevronDown
              size={16}
              style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* 思考中时的滚动预览区域 */}
      {isThinking && !expanded && (
        <Box
          ref={scrollRef}
          onClick={(e) => e.stopPropagation()}
          sx={{
            height: PREVIEW_HEIGHT,
            overflow: 'hidden',
            position: 'relative',
            px: 1.5,
            py: 1,
            fontSize: '0.75rem',
            lineHeight: 1.5,
            color: theme.palette.text.secondary,
            fontFamily: 'monospace',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(0,0,0,0.2)' 
              : 'rgba(0,0,0,0.02)',
            // 顶部渐变遮罩效果
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '20px',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(to bottom, rgba(30,30,30,0.95), transparent)'
                : 'linear-gradient(to bottom, rgba(255,255,255,0.95), transparent)',
              pointerEvents: 'none',
              zIndex: 1
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              minHeight: '100%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {previewContent.split('\n').map((line, index) => (
              <Box 
                key={index} 
                sx={{ 
                  opacity: 0.6 + (index / PREVIEW_MAX_LINES) * 0.4,
                  py: 0.25
                }}
              >
                {line || '\u00A0'}
              </Box>
            ))}
            {/* 闪烁光标 */}
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: '2px',
                height: '14px',
                backgroundColor: theme.palette.warning.main,
                animation: `${cursorBlink} 1s infinite`,
                verticalAlign: 'middle',
                ml: 0.5
              }}
            />
          </Box>
        </Box>
      )}

      {/* 完整内容区域（展开时显示） */}
      <Collapse in={expanded} timeout={0}>
        <Box sx={{
          px: 1.5,
          py: 1.25,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          ...getThinkingScrollbarStyles(theme)
        }}>
          <Markdown content={content} allowHtml={false} />
        </Box>
      </Collapse>
    </StyledPaper>
  );
};

export default React.memo(ThinkingCompactStyle);
