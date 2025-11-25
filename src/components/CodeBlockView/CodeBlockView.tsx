import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useAppSelector } from '../../shared/store';
import CodeViewer from './CodeViewer';
import CodeToolbar from './CodeToolbar';
import SvgPreview from './SvgPreview';
import {
  useCopyTool,
  useDownloadTool,
  useExpandTool,
  useWrapTool,
  useViewSourceTool,
  useSplitViewTool
} from './hooks';
import type { ActionTool, ViewMode, BasicPreviewHandles, CodeBlockViewProps } from './types';
import { SPECIAL_VIEWS } from './types';

// 常量
const MAX_COLLAPSED_CODE_HEIGHT = 300;

/**
 * 代码块视图组件
 * 
 * 视图模式：
 * - source: 源代码视图
 * - special: 特殊视图 (Mermaid, SVG, HTML 等)
 * - split: 分屏模式
 */
const CodeBlockView: React.FC<CodeBlockViewProps> = memo(({
  children,
  language,
  onSave: _onSave, // 预留：代码编辑保存回调
  messageRole: _messageRole // 预留：消息角色，用于权限控制
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // 从 Redux 获取设置
  const {
    codeEditor,
    codeCollapsible,
    codeWrappable,
    codeShowLineNumbers
  } = useAppSelector(state => state.settings);

  // 视图状态
  const [viewState, setViewState] = useState({
    mode: 'special' as ViewMode,
    previousMode: 'special' as ViewMode
  });
  const { mode: viewMode } = viewState;

  const setViewMode = useCallback((newMode: ViewMode) => {
    setViewState(current => ({
      mode: newMode,
      previousMode: newMode !== 'split' ? newMode : current.previousMode
    }));
  }, []);

  const toggleSplitView = useCallback(() => {
    setViewState(current => {
      if (current.mode === 'split') {
        return { ...current, mode: current.previousMode };
      }
      return { mode: 'split', previousMode: current.mode };
    });
  }, []);

  // 工具状态
  const [tools, setTools] = useState<ActionTool[]>([]);
  const specialViewRef = useRef<BasicPreviewHandles>(null);

  // 展开/换行状态
  const [expandOverride, setExpandOverride] = useState(!codeCollapsible);
  const [wrapOverride, setWrapOverride] = useState(codeWrappable);
  const [sourceScrollHeight, setSourceScrollHeight] = useState(0);

  // 响应设置变化
  useEffect(() => {
    setExpandOverride(!codeCollapsible);
  }, [codeCollapsible]);

  useEffect(() => {
    setWrapOverride(codeWrappable);
  }, [codeWrappable]);

  // 计算状态
  const hasSpecialView = useMemo(() => 
    SPECIAL_VIEWS.includes(language as any), [language]);
  
  const isInSpecialView = useMemo(() => 
    hasSpecialView && viewMode === 'special', [hasSpecialView, viewMode]);
  
  const shouldExpand = useMemo(() => 
    !codeCollapsible || expandOverride, [codeCollapsible, expandOverride]);
  
  const shouldWrap = useMemo(() => 
    codeWrappable && wrapOverride, [codeWrappable, wrapOverride]);
  
  const expandable = useMemo(() => 
    codeCollapsible && sourceScrollHeight > MAX_COLLAPSED_CODE_HEIGHT, 
    [codeCollapsible, sourceScrollHeight]);

  const showPreviewTools = useMemo(() => 
    viewMode !== 'source' && hasSpecialView, [hasSpecialView, viewMode]);

  // 处理函数
  const handleHeightChange = useCallback((height: number) => {
    setSourceScrollHeight(prev => prev === height ? prev : height);
  }, []);

  const handleCopySource = useCallback(() => {
    navigator.clipboard.writeText(children);
    // TODO: 添加 toast 提示
  }, [children]);

  const handleDownloadSource = useCallback(() => {
    const ext = getExtensionByLanguage(language);
    const fileName = `code-${Date.now()}${ext}`;
    const blob = new Blob([children], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [children, language]);

  // 注册工具
  useCopyTool({
    showPreviewTools,
    previewRef: specialViewRef,
    onCopySource: handleCopySource,
    setTools
  });

  useDownloadTool({
    showPreviewTools,
    previewRef: specialViewRef,
    onDownloadSource: handleDownloadSource,
    setTools
  });

  useViewSourceTool({
    enabled: hasSpecialView,
    editable: codeEditor,
    viewMode,
    onViewModeChange: setViewMode,
    setTools
  });

  useSplitViewTool({
    enabled: hasSpecialView,
    viewMode,
    onToggleSplitView: toggleSplitView,
    setTools
  });

  useExpandTool({
    enabled: !isInSpecialView,
    expanded: shouldExpand,
    expandable,
    toggle: useCallback(() => setExpandOverride(prev => !prev), []),
    setTools
  });

  useWrapTool({
    enabled: !isInSpecialView,
    wrapped: shouldWrap,
    wrappable: codeWrappable,
    toggle: useCallback(() => setWrapOverride(prev => !prev), []),
    setTools
  });

  // 渲染特殊视图
  const renderSpecialView = useMemo(() => {
    if (!hasSpecialView) return null;

    // 根据语言类型渲染不同的特殊视图组件
    // 注意：HTML 和 Mermaid 由 MarkdownCodeBlock 层面使用专门的卡片组件处理
    switch (language) {
      case 'mermaid':
      case 'html':
      case 'htm':
        // 由 MarkdownCodeBlock 层面处理，这里返回 null
        return null;
      case 'svg':
        return (
          <SvgPreview ref={specialViewRef} enableToolbar>
            {children}
          </SvgPreview>
        );
      default:
        return null;
    }
  }, [hasSpecialView, language, children]);

  // 渲染源代码视图
  const sourceView = useMemo(() => (
    <CodeViewer
      className="source-view"
      value={children}
      language={language}
      onHeightChange={handleHeightChange}
      expanded={shouldExpand}
      wrapped={shouldWrap}
      maxHeight={`${MAX_COLLAPSED_CODE_HEIGHT}px`}
      showLineNumbers={codeShowLineNumbers}
    />
  ), [children, language, handleHeightChange, shouldExpand, shouldWrap, codeShowLineNumbers]);

  // 渲染内容
  const renderContent = useMemo(() => {
    const showSpecialView = !!renderSpecialView && ['special', 'split'].includes(viewMode);
    const showSourceView = !renderSpecialView || viewMode !== 'special';

    return (
      <Box
        className="split-view-wrapper"
        sx={{
          display: 'flex',
          flexDirection: viewMode === 'split' ? 'row' : 'column',
          gap: viewMode === 'split' ? 1 : 0,
          '& > *': {
            flex: viewMode === 'split' ? '1 1 50%' : '1 1 auto',
          },
          // 分屏模式下的分隔线
          ...(viewMode === 'split' && {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: '1px',
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              zIndex: 1,
            }
          })
        }}
      >
        {showSpecialView && renderSpecialView}
        {showSourceView && sourceView}
      </Box>
    );
  }, [renderSpecialView, sourceView, viewMode, isDarkMode]);

  return (
    <Box
      className="code-block"
      sx={{
        position: 'relative',
        width: '100%',
        minWidth: '280px',
        marginY: 1,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(250, 250, 250, 0.95)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      }}
    >
      {/* 头部 - 语言标签 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isInSpecialView ? '24px' : '34px',
          padding: '0 12px',
          backgroundColor: isDarkMode ? 'rgba(40, 40, 40, 0.95)' : 'rgba(240, 240, 240, 0.95)',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        }}
      >
        {!isInSpecialView && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {'<' + (language || 'text').toUpperCase() + '>'}
          </Typography>
        )}
      </Box>

      {/* 工具栏 */}
      <CodeToolbar tools={tools} />

      {/* 内容区域 */}
      {renderContent}
    </Box>
  );
});

// 辅助函数：根据语言获取文件扩展名
function getExtensionByLanguage(language: string): string {
  const extMap: Record<string, string> = {
    javascript: '.js',
    typescript: '.ts',
    python: '.py',
    java: '.java',
    cpp: '.cpp',
    c: '.c',
    csharp: '.cs',
    go: '.go',
    rust: '.rs',
    ruby: '.rb',
    php: '.php',
    swift: '.swift',
    kotlin: '.kt',
    html: '.html',
    css: '.css',
    scss: '.scss',
    less: '.less',
    json: '.json',
    yaml: '.yaml',
    yml: '.yml',
    xml: '.xml',
    markdown: '.md',
    sql: '.sql',
    shell: '.sh',
    bash: '.sh',
    powershell: '.ps1',
    dockerfile: '.dockerfile',
    mermaid: '.mmd',
    svg: '.svg',
  };
  return extMap[language?.toLowerCase()] || '.txt';
}

CodeBlockView.displayName = 'CodeBlockView';

export default CodeBlockView;
