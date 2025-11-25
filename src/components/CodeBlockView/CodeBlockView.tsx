import React, { useState, useCallback, useRef, useMemo, useEffect, memo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useAppSelector } from '../../shared/store';
import { useViewSourceTool, useDownloadTool, useCopyTool, useSplitViewTool, useExpandTool, useWrapTool } from './hooks';
import { CodeViewer } from './CodeViewer';
import { CodeToolbar } from './CodeToolbar';
import SvgPreview from './SvgPreview';
import type { CodeBlockViewProps, ViewMode, ActionTool, BasicPreviewHandles } from './types';
import CodeEditorDrawer from './CodeEditorDrawer';
import { SPECIAL_VIEWS } from './types';

// 常量
const COLLAPSED_PREVIEW_LINES = 3; // 代码超过此行数才可收起

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

  // 编辑器状态
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(children);

  // 展开/换行状态
  const [isCollapsed, setIsCollapsed] = useState(false); // 是否完全收起
  const [wrapOverride, setWrapOverride] = useState(codeWrappable);

  // 计算代码行数
  const lineCount = useMemo(() => children.split('\n').length, [children]);

  // 响应设置变化
  useEffect(() => {
    // 如果启用了可折叠并且默认收起，则收起
    // 这里不自动收起，让用户手动控制
  }, [codeCollapsible]);

  useEffect(() => {
    setWrapOverride(codeWrappable);
  }, [codeWrappable]);

  // 同步编辑内容与原始内容
  useEffect(() => {
    setEditedContent(children);
  }, [children]);

  // 计算状态
  const hasSpecialView = useMemo(() => 
    SPECIAL_VIEWS.includes(language as any), [language]);
  
  const isInSpecialView = useMemo(() => 
    hasSpecialView && viewMode === 'special', [hasSpecialView, viewMode]);
  
  const shouldWrap = useMemo(() => 
    codeWrappable && wrapOverride, [codeWrappable, wrapOverride]);
  
  // 可折叠条件：启用了可折叠设置且代码超过 3 行
  const expandable = useMemo(() => 
    codeCollapsible && lineCount > COLLAPSED_PREVIEW_LINES, 
    [codeCollapsible, lineCount]);

  const showPreviewTools = useMemo(() => 
    viewMode !== 'source' && hasSpecialView, [hasSpecialView, viewMode]);

  // 处理函数
  const handleHeightChange = useCallback((_height: number) => {
    // 高度变化回调，当前未使用
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

  // 编辑器处理函数
  const handleEdit = useCallback(() => {
    setEditDrawerOpen(true);
  }, []);

  const handleSaveEdit = useCallback((newContent: string) => {
    setEditedContent(newContent);
    setEditDrawerOpen(false);
    // 如果有保存回调，调用它
    if (_onSave) {
      _onSave(newContent);
    }
  }, [_onSave]);

  const handleCloseEdit = useCallback(() => {
    setEditDrawerOpen(false);
  }, []);

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
    enabled: codeEditor,
    editable: codeEditor,
    viewMode,
    isEditorOpen: editDrawerOpen,
    onViewModeChange: setViewMode,
    setTools,
    onEdit: handleEdit
  });

  useSplitViewTool({
    enabled: hasSpecialView,
    viewMode,
    onToggleSplitView: toggleSplitView,
    setTools
  });

  useExpandTool({
    enabled: !isInSpecialView && expandable,
    expanded: !isCollapsed,
    expandable: true, // 只要显示就可以点击
    toggle: useCallback(() => setIsCollapsed(prev => !prev), []),
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
  const sourceView = useMemo(() => {
    // 完全收起时不渲染代码
    if (isCollapsed) {
      return null;
    }
    return (
      <CodeViewer
        className="source-view"
        value={editedContent}
        language={language}
        onHeightChange={handleHeightChange}
        expanded={true}
        wrapped={shouldWrap}
        options={{ lineNumbers: codeShowLineNumbers }}
      />
    );
  }, [editedContent, language, handleHeightChange, shouldWrap, codeShowLineNumbers, isCollapsed]);

  // 渲染内容
  const renderContent = useMemo(() => {
    // 完全收起时显示收起提示
    if (isCollapsed) {
      return (
        <Box
          onClick={() => setIsCollapsed(false)}
          sx={{
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            fontSize: '13px',
            fontFamily: '"Fira Code", "JetBrains Mono", Consolas, Monaco, monospace',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            },
            '&:active': {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }
          }}
        >
          <span>••• 代码已收起 ({lineCount} 行) •••</span>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>点击展开</span>
        </Box>
      );
    }

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
  }, [renderSpecialView, sourceView, viewMode, isDarkMode, isCollapsed, lineCount]);

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
          height: isInSpecialView ? '32px' : '40px', // 统一增加高度，更协调
          padding: '0 12px',
          backgroundColor: isDarkMode ? 'rgba(40, 40, 40, 0.95)' : 'rgba(240, 240, 240, 0.95)',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          // 移动端适配
          '@media (max-width: 600px)': {
            height: isInSpecialView ? '36px' : '44px', // 移动端进一步增加高度
            padding: '0 8px',
          }
        }}
      >
        {/* 左侧：语言标签或占位符 */}
        {!isInSpecialView ? (
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
        ) : (
          // 特殊视图下的占位符，确保工具栏右对齐
          <Box sx={{ flex: 1 }} />
        )}
        
        {/* 右侧：工具栏 - 移到头部内部 */}
        <CodeToolbar tools={tools} />
      </Box>

      {/* 内容区域 */}
      {renderContent}

      {/* 代码编辑器抽屉 */}
      <CodeEditorDrawer
        open={editDrawerOpen}
        onClose={handleCloseEdit}
        initialContent={editedContent}
        language={language}
        onSave={handleSaveEdit}
        title={`编辑 ${language.toUpperCase()} 代码`}
      />
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
