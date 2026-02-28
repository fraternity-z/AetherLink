import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Link,
  Tooltip,
} from '@mui/material';
import {
  ChevronDown as ExpandMoreIcon,
  ChevronUp as ExpandLessIcon,
  Copy,
  Check,
  BookOpen,
  Globe,
  ExternalLink as OpenInNewIcon,
} from 'lucide-react';
import { styled } from '@mui/material/styles';
import { MessageBlockStatus } from '../../../shared/types/newMessage';
import type {
  CitationMessageBlock,
  KnowledgeReferenceItem,
  WebSearchReferenceItem,
} from '../../../shared/types/newMessage';

// ==================== 样式化组件 ====================

const StyledPaper = styled(Paper)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    borderRadius: '16px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: isDark ? 'rgba(45, 45, 45, 0.92)' : 'rgba(250, 250, 250, 0.95)',
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
      transform: 'translateY(-1px)',
      boxShadow: isDark
        ? '0 4px 12px rgba(0,0,0,0.3)'
        : '0 4px 12px rgba(0,0,0,0.08)',
    },
  };
});

const ResultItem = styled(Box)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1.25),
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: theme.spacing(0.75),
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
    },
    '&:last-child': {
      marginBottom: 0,
    },
  };
});

const ScrollableContent = styled(Box)(() => ({
  maxHeight: '120px',
  overflowY: 'auto',
  overflowX: 'hidden',
  '&::-webkit-scrollbar': { width: '4px' },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'var(--theme-msg-block-scrollbar-thumb)',
    borderRadius: '2px',
    '&:hover': { opacity: 0.8 },
  },
  scrollbarWidth: 'thin' as any,
  scrollbarColor: 'var(--theme-msg-block-scrollbar-thumb) transparent',
}));

const SimilarityChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  fontSize: '0.7rem',
  height: 18,
  fontWeight: 500,
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(0.75),
    paddingRight: theme.spacing(0.75),
  },
}));

// ==================== 统一引用项类型 ====================

interface UnifiedCitationItem {
  index: number;
  type: 'knowledge' | 'websearch' | 'legacy';
  title: string;
  content: string;
  url?: string;
  similarity?: number;
  knowledgeBaseName?: string;
  provider?: string;
}

// ==================== 组件 ====================

interface Props {
  block: CitationMessageBlock;
}

/**
 * 统一引用块组件
 * 同时渲染知识库引用、Web 搜索引用等多种引用来源
 */
const CitationBlock: React.FC<Props> = ({ block }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 将所有引用来源统一为 UnifiedCitationItem[]
  const items: UnifiedCitationItem[] = useMemo(() => {
    const result: UnifiedCitationItem[] = [];
    let globalIndex = 1;

    // 1. 知识库引用
    if (block.knowledge && block.knowledge.length > 0) {
      block.knowledge.forEach((k: KnowledgeReferenceItem) => {
        result.push({
          index: globalIndex++,
          type: 'knowledge',
          title: k.knowledgeBaseName || '知识库',
          content: k.content,
          similarity: k.similarity,
          knowledgeBaseName: k.knowledgeBaseName,
          url: k.sourceUrl,
        });
      });
    }

    // 2. Web 搜索引用
    if (block.webSearch && block.webSearch.length > 0) {
      block.webSearch.forEach((w: WebSearchReferenceItem) => {
        result.push({
          index: globalIndex++,
          type: 'websearch',
          title: w.title,
          content: w.snippet || w.content || '',
          url: w.url,
          provider: w.provider,
        });
      });
    }

    // 3. 旧格式 sources（向后兼容）
    if (result.length === 0 && block.sources && block.sources.length > 0) {
      block.sources.forEach((s) => {
        result.push({
          index: globalIndex++,
          type: 'legacy',
          title: s.title || '引用',
          content: s.content || '',
          url: s.url,
        });
      });
    }

    return result;
  }, [block.knowledge, block.webSearch, block.sources]);

  // 统计各类型数量
  const knowledgeCount = items.filter((i) => i.type === 'knowledge').length;
  const webSearchCount = items.filter((i) => i.type === 'websearch').length;

  const handleCopyContent = useCallback((content: string, index: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      if (prev) setActiveIndex(null);
      return !prev;
    });
  }, []);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-result-item]')) return;
      if ((e.target as HTMLElement).closest('button')) return;
      if ((e.target as HTMLElement).closest('a')) return;
      toggleExpanded();
    },
    [toggleExpanded]
  );

  const handleResultToggle = useCallback((idx: number) => {
    setActiveIndex((prev) => (prev === idx ? null : idx));
  }, []);

  const isProcessing =
    block.status === MessageBlockStatus.STREAMING ||
    block.status === MessageBlockStatus.PROCESSING;

  // 没有任何引用数据则不渲染
  if (items.length === 0 && !isProcessing) {
    return null;
  }

  const formatSimilarity = (s?: number) =>
    s != null ? `${Math.round(s * 100)}%` : '';

  const getSummary = (content: string) =>
    content.length > 90 ? `${content.slice(0, 90)}...` : content || '暂无内容';

  const getTypeIcon = (type: string) => {
    if (type === 'knowledge') return <BookOpen size={14} />;
    if (type === 'websearch') return <Globe size={14} />;
    return null;
  };

  const getTypeBadgeColor = (type: string) => {
    if (type === 'knowledge') return 'primary';
    if (type === 'websearch') return 'success';
    return 'default';
  };

  // 构建标题描述
  const headerParts: string[] = [];
  if (knowledgeCount > 0) headerParts.push(`知识库 ${knowledgeCount} 条`);
  if (webSearchCount > 0) headerParts.push(`网络搜索 ${webSearchCount} 条`);
  if (headerParts.length === 0 && items.length > 0) headerParts.push(`引用 ${items.length} 条`);
  const headerText = headerParts.join(' + ');

  return (
    <StyledPaper elevation={0} onClick={handleCardClick}>
      {/* 标题栏 */}
      <Box display="flex" alignItems="center" minHeight={32} mb={0.5}>
        {knowledgeCount > 0 && (
          <BookOpen size={16} style={{ marginRight: 6, flexShrink: 0 }} />
        )}
        {webSearchCount > 0 && knowledgeCount === 0 && (
          <Globe size={16} style={{ marginRight: 6, flexShrink: 0 }} />
        )}
        <Typography variant="body2" fontWeight={500} color="text.primary">
          {headerText}
        </Typography>

        {isProcessing && (
          <Chip
            label="搜索中"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 1, height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 1 } }}
          />
        )}

        <Box flexGrow={1} />
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
          sx={{ padding: 0.5, '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
        >
          {expanded ? <ExpandLessIcon size={18} /> : <ExpandMoreIcon size={18} />}
        </IconButton>
      </Box>

      {/* 折叠时的摘要 */}
      {!expanded && items.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
          {`找到 ${items.length} 条相关内容，点击展开查看详情`}
        </Typography>
      )}

      {/* 展开后的引用列表 */}
      {expanded && (
        <Box mt={1.5}>
          {items.map((item) => {
            const isActive = activeIndex === item.index;
            return (
              <ResultItem
                key={`citation-${block.id}-${item.index}`}
                id={`citation-${block.id}-${item.index}`}
                data-result-item
                onClick={(e) => {
                  e.stopPropagation();
                  handleResultToggle(item.index);
                }}
              >
                {/* 引用头部 */}
                <Box display="flex" alignItems="center" mb={0.75}>
                  <Box
                    component="span"
                    sx={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: `${getTypeBadgeColor(item.type)}.main`,
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      mr: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    {getTypeIcon(item.type)}
                    #{item.index}
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ flexGrow: 1, fontWeight: 500, fontSize: '0.875rem' }}
                    noWrap
                  >
                    {isActive ? item.title : getSummary(item.content)}
                  </Typography>
                  <Tooltip title={copiedIndex === item.index ? '已复制' : '复制内容'} arrow>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyContent(item.content, item.index);
                      }}
                      sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                    >
                      {copiedIndex === item.index ? <Check size={14} /> : <Copy size={14} />}
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResultToggle(item.index);
                    }}
                  >
                    {isActive ? <ExpandLessIcon size={16} /> : <ExpandMoreIcon size={16} />}
                  </IconButton>
                </Box>

                {/* 元数据标签 */}
                <Box display="flex" alignItems="center" gap={1} mb={isActive ? 1 : 0}>
                  {item.similarity != null && (
                    <SimilarityChip
                      size="small"
                      color={item.similarity > 0.8 ? 'success' : item.similarity > 0.6 ? 'warning' : 'default'}
                      label={formatSimilarity(item.similarity)}
                    />
                  )}
                  {item.knowledgeBaseName && (
                    <Typography variant="caption" color="text.secondary">
                      {item.knowledgeBaseName}
                    </Typography>
                  )}
                  {item.type === 'websearch' && item.url && (
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      color="primary"
                      sx={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.3 }}
                    >
                      {(() => {
                        try { return new URL(item.url).hostname; } catch { return item.url.slice(0, 30); }
                      })()}
                      <OpenInNewIcon size={12} />
                    </Link>
                  )}
                </Box>

                {/* 展开的详细内容 */}
                {isActive && (
                  <ScrollableContent sx={{ mt: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.875rem', color: 'text.primary' }}
                    >
                      {item.content}
                    </Typography>
                  </ScrollableContent>
                )}
              </ResultItem>
            );
          })}
        </Box>
      )}
    </StyledPaper>
  );
};

export default React.memo(CitationBlock);
