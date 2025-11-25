import { memo, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  useTheme,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  Globe,
  Sparkles,
  Code,
  Eye,
  ExternalLink,
  Download,
  X,
  Maximize2,
  Minimize2,
  Columns2
} from 'lucide-react';

interface HtmlArtifactsCardProps {
  html: string;
  onSave?: (html: string) => void;
  isStreaming?: boolean;
}

/**
 * 从 HTML 中提取 title 标签内容
 */
function extractHtmlTitle(html: string): string | null {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return match ? match[1].trim() : null;
}

/**
 * HTML Artifacts 卡片组件
 * 参考 Cherry Studio 的设计实现
 */
const HtmlArtifactsCard: React.FC<HtmlArtifactsCardProps> = memo(({
  html,
  onSave,
  isStreaming = false
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  const title = useMemo(() => extractHtmlTitle(html) || 'HTML Artifacts', [html]);
  const hasContent = html?.trim().length > 0;

  // 在外部浏览器打开
  const handleOpenExternal = useCallback(() => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // 延迟释放 URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [html]);

  // 下载 HTML 文件
  const handleDownload = useCallback(() => {
    const fileName = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-') || 'html-artifact'}.html`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [html, title]);

  return (
    <>
      {/* 卡片容器 */}
      <Box
        sx={{
          backgroundColor: 'var(--color-background, ' + (isDarkMode ? '#1e1e1e' : '#ffffff') + ')',
          border: `1px solid var(--color-border, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'})`,
          borderRadius: '8px',
          overflow: 'hidden',
          my: 1.25,
          mt: 0,
        }}
      >
        {/* 头部 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 3,
            py: 2,
            pb: 2,
            backgroundColor: 'var(--color-background-soft, ' + (isDarkMode ? '#252525' : '#f5f5f5') + ')',
            borderBottom: `1px solid var(--color-border, ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'})`,
            borderRadius: '8px 8px 0 0',
          }}
        >
          {/* 图标 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: isStreaming
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: isStreaming
                ? '0 4px 6px -1px rgba(245, 158, 11, 0.3)'
                : '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
              flexShrink: 0,
              transition: 'background 0.3s ease',
            }}
          >
            {isStreaming ? (
              <Sparkles size={20} color="white" />
            ) : (
              <Globe size={20} color="white" />
            )}
          </Box>

          {/* 标题区域 */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                fontSize: '14px',
                color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </Typography>
            
            {/* HTML 徽章 */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
                px: 0.75,
                py: 0.25,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: '6px',
              }}
            >
              <Code size={10} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                }}
              >
                HTML
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 内容区域 */}
        <Box sx={{ p: 0 }}>
          {isStreaming && !hasContent ? (
            // 生成中状态
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
                py: 3,
                minHeight: '78px',
              }}
            >
              <CircularProgress size={20} />
              <Typography
                variant="body2"
                sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}
              >
                正在生成内容...
              </Typography>
            </Box>
          ) : isStreaming && hasContent ? (
            // 流式生成中，显示终端预览
            <>
              <Box
                sx={{
                  m: 2,
                  p: 1.5,
                  backgroundColor: isDarkMode ? '#1e1e1e' : '#f0f0f0',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: isDarkMode ? '#cccccc' : '#333333',
                  minHeight: '60px',
                  maxHeight: '80px',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography
                    component="span"
                    sx={{
                      color: isDarkMode ? '#00ff00' : '#007700',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                    }}
                  >
                    $
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      flex: 1,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  >
                    {html.trim().split('\n').slice(-3).join('\n')}
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: '2px',
                        height: '14px',
                        backgroundColor: isDarkMode ? '#00ff00' : '#007700',
                        ml: 0.25,
                        animation: 'blink 1s infinite',
                        '@keyframes blink': {
                          '0%, 50%': { opacity: 1 },
                          '51%, 100%': { opacity: 0 },
                        },
                      }}
                    />
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ px: 2, pb: 1.5 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Eye size={14} />}
                  onClick={() => setIsPopupOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  预览
                </Button>
              </Box>
            </>
          ) : (
            // 完成状态，显示按钮组
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 0,
                mx: 2,
                my: 1.25,
              }}
            >
              <Button
                size="small"
                startIcon={<Eye size={14} />}
                onClick={() => setIsPopupOpen(true)}
                disabled={!hasContent}
                sx={{
                  textTransform: 'none',
                  color: 'var(--color-text-secondary, ' + (isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)') + ')',
                  fontSize: '13px',
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'var(--color-text, ' + (isDarkMode ? '#fff' : '#000') + ')',
                  }
                }}
              >
                预览
              </Button>
              <Button
                size="small"
                startIcon={<ExternalLink size={14} />}
                onClick={handleOpenExternal}
                disabled={!hasContent}
                sx={{
                  textTransform: 'none',
                  color: 'var(--color-text-secondary, ' + (isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)') + ')',
                  fontSize: '13px',
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'var(--color-text, ' + (isDarkMode ? '#fff' : '#000') + ')',
                  }
                }}
              >
                外部浏览器打开
              </Button>
              <Button
                size="small"
                startIcon={<Download size={14} />}
                onClick={handleDownload}
                disabled={!hasContent}
                sx={{
                  textTransform: 'none',
                  color: 'var(--color-text-secondary, ' + (isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)') + ')',
                  fontSize: '13px',
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'var(--color-text, ' + (isDarkMode ? '#fff' : '#000') + ')',
                  }
                }}
              >
                下载
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* 预览弹窗 */}
      <HtmlArtifactsPopup
        open={isPopupOpen}
        title={title}
        html={html}
        onSave={onSave}
        onClose={() => setIsPopupOpen(false)}
      />
    </>
  );
});

HtmlArtifactsCard.displayName = 'HtmlArtifactsCard';

/**
 * HTML 预览弹窗组件
 */
interface HtmlArtifactsPopupProps {
  open: boolean;
  title: string;
  html: string;
  onSave?: (html: string) => void;
  onClose: () => void;
}

type ViewMode = 'split' | 'code' | 'preview';

const HtmlArtifactsPopup: React.FC<HtmlArtifactsPopupProps> = memo(({
  open,
  title,
  html,
  onSave: _onSave,
  onClose
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          width: isFullscreen ? '100vw' : '90vw',
          maxWidth: isFullscreen ? '100vw' : '1400px',
          height: isFullscreen ? '100vh' : '85vh',
          borderRadius: isFullscreen ? 0 : '12px',
          overflow: 'hidden',
        }
      }}
    >
      {/* 头部 */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1,
          px: 2,
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(250, 250, 250, 0.95)',
        }}
      >
        {/* 左侧标题 */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Typography>

        {/* 中间视图切换 */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderRadius: '8px',
            '& .MuiToggleButton-root': {
              border: 'none',
              px: 1.5,
              py: 0.5,
              textTransform: 'none',
              fontSize: '13px',
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }
            }
          }}
        >
          <ToggleButton value="split">
            <Columns2 size={14} style={{ marginRight: 4 }} />
            分屏
          </ToggleButton>
          <ToggleButton value="code">
            <Code size={14} style={{ marginRight: 4 }} />
            代码
          </ToggleButton>
          <ToggleButton value="preview">
            <Eye size={14} style={{ marginRight: 4 }} />
            预览
          </ToggleButton>
        </ToggleButtonGroup>

        {/* 右侧按钮 */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <IconButton size="small" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="关闭">
            <IconButton size="small" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* 内容区域 */}
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* 代码面板 */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <Box
            sx={{
              flex: viewMode === 'split' ? '0 0 50%' : 1,
              height: '100%',
              overflow: 'auto',
              backgroundColor: isDarkMode ? '#1e1e1e' : '#fafafa',
              borderRight: viewMode === 'split' 
                ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` 
                : 'none',
            }}
          >
            <pre
              style={{
                margin: 0,
                padding: '16px',
                fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                fontSize: '13px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: isDarkMode ? '#e0e0e0' : '#333',
              }}
            >
              {html}
            </pre>
          </Box>
        )}

        {/* 预览面板 */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <Box
            sx={{
              flex: viewMode === 'split' ? '0 0 50%' : 1,
              height: '100%',
              backgroundColor: '#fff',
            }}
          >
            <iframe
              srcDoc={html}
              title="HTML Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#fff',
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
});

HtmlArtifactsPopup.displayName = 'HtmlArtifactsPopup';

export default HtmlArtifactsCard;
