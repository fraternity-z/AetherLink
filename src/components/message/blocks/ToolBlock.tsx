import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  IconButton,
  Chip,
  useTheme,
  Divider,
  alpha
} from '@mui/material';
import {
  ChevronDown as ExpandMoreIcon,
  Copy as ContentCopyIcon,
  Code as CodeIcon,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { styled, keyframes } from '@mui/material/styles';

import { MessageBlockStatus } from '../../../shared/types/newMessage';
import type { ToolMessageBlock } from '../../../shared/types/newMessage';

import { EventEmitter } from '../../../shared/services/EventEmitter';

interface Props {
  block: ToolMessageBlock;
}

// 定义动画
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * 工具调用块组件 - 优化版本
 * 显示AI的工具调用过程和结果
 */
const ToolBlock: React.FC<Props> = ({ block }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  // 获取工具响应数据
  const toolResponse = block.metadata?.rawMcpToolResponse;

  const isProcessing = block.status === MessageBlockStatus.STREAMING ||
                       block.status === MessageBlockStatus.PROCESSING;
  const isCompleted = block.status === MessageBlockStatus.SUCCESS;
  const hasError = block.status === MessageBlockStatus.ERROR;

  // 复制工具调用内容到剪贴板
  const handleCopyCall = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const input = block.arguments || toolResponse?.arguments;
    if (input) {
      const callText = JSON.stringify(input, null, 2);
      navigator.clipboard.writeText(callText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      EventEmitter.emit('ui:copy_success', { content: '已复制工具调用内容' });
    }
  }, [block.arguments, toolResponse]);

  // 切换折叠/展开状态
  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  // 格式化工具调用参数
  const formatToolCall = useCallback(() => {
    const params = toolResponse?.arguments || block.arguments;
    if (!params) return '';

    try {
      return JSON.stringify(params, null, 2);
    } catch (e) {
      return String(params);
    }
  }, [toolResponse, block.arguments]);

  // 格式化工具结果内容
  const formatToolResult = useCallback(() => {
    if (block.content && typeof block.content === 'object') {
      const response = block.content as any;

      if (response.isError) {
        const errorContent = response.content?.[0]?.text || '工具调用失败';
        return `错误: ${errorContent}`;
      }

      if (response.content && response.content.length > 0) {
        if (response.content.length === 1 && response.content[0].type === 'text') {
          const text = response.content[0].text || '';
          try {
            const parsed = JSON.parse(text);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return text;
          }
        }

        return response.content.map((item: any) => {
          switch (item.type) {
            case 'text':
              const text = item.text || '';
              try {
                const parsed = JSON.parse(text);
                return JSON.stringify(parsed, null, 2);
              } catch {
                return text;
              }
            case 'image':
              return `[图像数据: ${item.mimeType || 'unknown'}]`;
            case 'resource':
              return `[资源数据: ${item.mimeType || 'unknown'}]`;
            default:
              return `[未知内容类型: ${item.type}]`;
          }
        }).join('\n\n');
      }

      return '无响应内容';
    }

    const toolResponseData = toolResponse;
    if (toolResponseData?.response) {
      const { response } = toolResponseData;

      if (response.isError) {
        const errorContent = response.content?.[0]?.text || '工具调用失败';
        return `错误: ${errorContent}`;
      }

      if (response.content && response.content.length > 0) {
        if (response.content.length === 1 && response.content[0].type === 'text') {
          const text = response.content[0].text || '';
          try {
            const parsed = JSON.parse(text);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return text;
          }
        }

        return response.content.map((item: any) => {
          switch (item.type) {
            case 'text':
              const text = item.text || '';
              try {
                const parsed = JSON.parse(text);
                return JSON.stringify(parsed, null, 2);
              } catch {
                return text;
              }
            case 'image':
              return `[图像数据: ${item.mimeType || 'unknown'}]`;
            case 'resource':
              return `[资源数据: ${item.mimeType || 'unknown'}]`;
            default:
              return `[未知内容类型: ${item.type}]`;
          }
        }).join('\n\n');
      }
    }

    return '无响应内容';
  }, [block.content, toolResponse]);

  // 复制工具结果内容到剪贴板
  const handleCopyResult = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const resultText = formatToolResult();
    if (resultText) {
      navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      EventEmitter.emit('ui:copy_success', { content: '已复制工具结果内容' });
    }
  }, [formatToolResult]);

  // 获取工具名称
  const getToolName = useCallback(() => {
    return block.toolName || toolResponse?.tool?.name || '工具调用';
  }, [block.toolName, toolResponse]);

  // 获取状态颜色和图标
  const getStatusConfig = () => {
    if (isProcessing) {
      return {
        color: 'info' as const,
        icon: <Loader2 size={14} style={{ animation: `${spin} 1s linear infinite` }} />,
        label: '执行中',
        bgColor: alpha(theme.palette.info.main, 0.1),
        borderColor: alpha(theme.palette.info.main, 0.3)
      };
    }
    if (hasError) {
      return {
        color: 'error' as const,
        icon: <AlertCircle size={14} />,
        label: '失败',
        bgColor: alpha(theme.palette.error.main, 0.1),
        borderColor: alpha(theme.palette.error.main, 0.3)
      };
    }
    if (isCompleted) {
      return {
        color: 'success' as const,
        icon: <CheckCircle2 size={14} />,
        label: '成功',
        bgColor: alpha(theme.palette.success.main, 0.1),
        borderColor: alpha(theme.palette.success.main, 0.3)
      };
    }
    return null;
  };

  const statusConfig = getStatusConfig();

  return (
    <StyledPaper
      elevation={0}
      sx={{
        mb: 2,
        border: `1px solid ${statusConfig?.borderColor || theme.palette.divider}`,
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: statusConfig?.bgColor || 'background.paper',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: `${fadeIn} 0.4s ease-out`,
        '&:hover': {
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
          transform: 'translateY(-2px)'
        }
      }}
    >
      {/* 标题栏 */}
      <Box
        onClick={toggleExpanded}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          cursor: 'pointer',
          borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
          background: expanded 
            ? `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, transparent)`
            : 'transparent',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.hover, 0.05),
          }
        }}
      >
        {/* 工具图标 */}
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <CodeIcon
            size={16}
            style={{
              color: theme.palette.primary.main
            }}
          />
        </Box>

        {/* 工具名称和状态 */}
        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {getToolName()}
          </Typography>
          {statusConfig && (
            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              size="small"
              color={statusConfig.color}
              variant="filled"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 500,
                '& .MuiChip-icon': {
                  marginLeft: '4px'
                }
              }}
            />
          )}
        </Box>

        {/* 展开按钮 */}
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: alpha(theme.palette.action.hover, 0.05),
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.1),
            }
          }}
        >
          <ExpandMoreIcon size={20} />
        </IconButton>
      </Box>

      {/* 内容区域 */}
      <Collapse in={expanded} timeout={300}>
        <Box sx={{ p: 2 }}>
          {/* 工具调用参数 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 4,
                    height: 16,
                    borderRadius: '2px',
                    backgroundColor: theme.palette.primary.main
                  }}
                />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  调用参数
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={handleCopyCall}
                sx={{
                  color: copied ? theme.palette.success.main : 'text.secondary',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main
                  }
                }}
              >
                <ContentCopyIcon size={16} />
              </IconButton>
            </Box>
            <CodeBlock>
              {formatToolCall()}
            </CodeBlock>
          </Box>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          {/* 工具调用结果 */}
          {(block.content || toolResponse?.response || isProcessing) && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 4,
                      height: 16,
                      borderRadius: '2px',
                      backgroundColor: hasError 
                        ? theme.palette.error.main 
                        : theme.palette.success.main
                    }}
                  />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    调用结果
                  </Typography>
                </Box>
                {!isProcessing && (
                  <IconButton
                    size="small"
                    onClick={handleCopyResult}
                    sx={{
                      color: copied ? theme.palette.success.main : 'text.secondary',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    <ContentCopyIcon size={16} />
                  </IconButton>
                )}
              </Box>
              {isProcessing ? (
                <Box 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    backgroundColor: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`
                  }}
                >
                  <Loader2 
                    size={24} 
                    style={{ 
                      animation: `${spin} 1s linear infinite`,
                      color: theme.palette.info.main
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    正在处理工具调用...
                  </Typography>
                </Box>
              ) : (
                <ResultBlock hasError={hasError}>
                  <Typography
                    component="pre"
                    sx={{
                      fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      color: hasError ? 'error.main' : 'text.primary',
                      lineHeight: 1.6
                    }}
                  >
                    {formatToolResult()}
                  </Typography>
                </ResultBlock>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </StyledPaper>
  );
};

// 样式化组件
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: 'none',
  transition: theme.transitions.create(['background-color', 'box-shadow', 'transform']),
}));

const CodeBlock = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  maxHeight: '200px',
  overflowY: 'auto',
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.default, 0.5)
    : alpha(theme.palette.grey[100], 0.8),
  fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
  fontSize: '0.85rem',
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  borderRadius: 8,
  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.text.secondary, 0.2),
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: alpha(theme.palette.text.secondary, 0.3),
    }
  },
}));

const ResultBlock = styled(Box)<{ hasError?: boolean }>(({ theme, hasError }) => ({
  maxHeight: '300px',
  overflowY: 'auto',
  border: `1px solid ${hasError ? alpha(theme.palette.error.main, 0.3) : alpha(theme.palette.divider, 0.5)}`,
  borderRadius: 8,
  padding: theme.spacing(1.5),
  backgroundColor: hasError
    ? alpha(theme.palette.error.main, 0.05)
    : theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.default, 0.5)
    : theme.palette.background.paper,
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.text.secondary, 0.2),
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: alpha(theme.palette.text.secondary, 0.3),
    }
  },
}));

// 自定义比较函数
const arePropsEqual = (prevProps: Props, nextProps: Props) => {
  const prevBlock = prevProps.block;
  const nextBlock = nextProps.block;
  
  if (prevBlock.id !== nextBlock.id ||
      prevBlock.status !== nextBlock.status ||
      prevBlock.content !== nextBlock.content ||
      prevBlock.updatedAt !== nextBlock.updatedAt) {
    return false;
  }
  
  const prevMetadata = prevBlock.metadata;
  const nextMetadata = nextBlock.metadata;
  if (prevMetadata !== nextMetadata) {
    if (JSON.stringify(prevMetadata?.rawMcpToolResponse) !== 
        JSON.stringify(nextMetadata?.rawMcpToolResponse)) {
      return false;
    }
  }
  
  if (JSON.stringify(prevBlock.arguments) !== JSON.stringify(nextBlock.arguments)) {
    return false;
  }
  
  return true;
};

export default React.memo(ToolBlock, arePropsEqual);
