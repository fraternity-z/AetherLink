import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Snackbar,
  Chip,
  Collapse
} from '@mui/material';
import {
  Copy,
  Download,
  Edit,
  Eye,
  ChevronDown,
  ChevronUp,
  WrapText,
  Type,
  Save,
  X
} from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscDarkPlus,
  vs,
  tomorrow,
  twilight,
  oneDark,
  // 新增更多主题
  atomDark,
  base16AteliersulphurpoolLight,
  cb,
  coldarkCold,
  coldarkDark,
  coy,
  darcula,
  dark,
  duotoneDark,
  duotoneEarth,
  duotoneForest,
  duotoneLight,
  duotoneSea,
  duotoneSpace,
  ghcolors,
  hopscotch,
  lucario,
  materialDark,
  materialLight,
  materialOceanic,
  nord,
  okaidia,
  oneLight,
  pojoaque,
  shadesOfPurple,
  solarizedlight,
  synthwave84,
  xonokai,
  zTouch
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppSelector } from '../../../shared/store';
import type { CodeMessageBlock } from '../../../shared/types/newMessage';

interface EnhancedCodeBlockProps {
  block: CodeMessageBlock;
  onSave?: (id: string, newContent: string) => void;
}

type ViewMode = 'preview' | 'edit';

// 主题映射 - 大幅扩展主题选择
const getHighlightTheme = (codeStyle: string, isDarkMode: boolean) => {
  const themeMap: Record<string, any> = {
    // 自动主题
    'auto': isDarkMode ? vscDarkPlus : vs,

    // 经典主题
    'vs-code-light': vs,
    'vs-code-dark': vscDarkPlus,
    'github-light': ghcolors,
    'github-dark': dark,
    'one-dark-pro': oneDark,
    'one-light': oneLight,
    'tomorrow': tomorrow,
    'twilight': twilight,

    // 流行编辑器主题
    'atom-dark': atomDark,
    'darcula': darcula,
    'nord': nord,
    'dracula': dark,
    'monokai': okaidia,
    'lucario': lucario,

    // Material 系列
    'material-dark': materialDark,
    'material-light': materialLight,
    'material-oceanic': materialOceanic,

    // Duotone 系列
    'duotone-dark': duotoneDark,
    'duotone-light': duotoneLight,
    'duotone-earth': duotoneEarth,
    'duotone-forest': duotoneForest,
    'duotone-sea': duotoneSea,
    'duotone-space': duotoneSpace,

    // 特色主题
    'synthwave-84': synthwave84,
    'shades-of-purple': shadesOfPurple,
    'hopscotch': hopscotch,
    'coldark-cold': coldarkCold,
    'coldark-dark': coldarkDark,
    'solarized-light': solarizedlight,
    'base16-light': base16AteliersulphurpoolLight,
    'coy': coy,
    'cb': cb,
    'pojoaque': pojoaque,
    'xonokai': xonokai,
    'z-touch': zTouch,

    // 兼容旧版本
    'vscDarkPlus': vscDarkPlus,
    'vs': vs,
    'solarizedlight': solarizedlight,
    'solarizeddark': oneDark,
    'material-theme': isDarkMode ? materialDark : materialLight
  };

  return themeMap[codeStyle] || (isDarkMode ? vscDarkPlus : vs);
};

/**
 * 增强版代码块组件
 * 支持预览/编辑模式切换，工具栏，语法高亮等功能
 */
const EnhancedCodeBlock: React.FC<EnhancedCodeBlockProps> = ({ block, onSave }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // 从 Redux store 获取设置
  const {
    codeEditor,
    codeShowLineNumbers,
    codeCollapsible,
    codeWrappable,
    codeStyle,
    codeDefaultCollapsed
  } = useAppSelector(state => state.settings);

  // 本地状态
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isCollapsed, setIsCollapsed] = useState(codeDefaultCollapsed);
  const [isWrapped, setIsWrapped] = useState(codeWrappable);
  const [copySuccess, setCopySuccess] = useState(false);
  const [editContent, setEditContent] = useState(block.content);

  // 复制代码
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(block.content)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  }, [block.content]);

  // 下载代码
  const handleDownload = useCallback(() => {
    const fileName = `code-${Date.now()}.${block.language || 'txt'}`;
    const blob = new Blob([block.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [block.content, block.language]);

  // 切换编辑/预览模式
  const toggleViewMode = useCallback(() => {
    if (viewMode === 'preview') {
      setViewMode('edit');
      setEditContent(block.content);
    } else {
      setViewMode('preview');
    }
  }, [viewMode, block.content]);

  // 保存编辑内容
  const handleSave = useCallback(() => {
    if (onSave && editContent !== block.content) {
      onSave(block.id, editContent);
    }
    setViewMode('preview');
  }, [onSave, editContent, block.content, block.id]);

  // 切换折叠状态
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // 切换换行状态
  const toggleWrap = useCallback(() => {
    setIsWrapped(prev => !prev);
  }, []);

  // 获取语言显示名称
  const getLanguageDisplayName = (language?: string) => {
    if (!language) return 'TEXT';
    return language.toUpperCase();
  };

  // 判断是否需要显示折叠按钮
  const shouldShowCollapseButton = useMemo(() => {
    const lineCount = block.content.split('\n').length;
    const shouldShow = codeCollapsible && lineCount > 5; // 降低阈值从10行到5行

    // 调试信息（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('折叠按钮显示条件:', {
        codeCollapsible,
        lineCount,
        shouldShow,
        content: block.content.substring(0, 50) + '...'
      });
    }

    return shouldShow;
  }, [codeCollapsible, block.content]);

  // 获取语法高亮主题
  const highlightTheme = useMemo(() => {
    return getHighlightTheme(codeStyle, isDarkMode);
  }, [codeStyle, isDarkMode]);

  // 工具栏按钮
  const toolbarButtons = useMemo(() => {
    const buttons = [];

    // 复制按钮
    buttons.push(
      <Tooltip key="copy" title="复制代码">
        <IconButton size="small" onClick={handleCopy}>
          <Copy size={16} />
        </IconButton>
      </Tooltip>
    );

    // 下载按钮
    buttons.push(
      <Tooltip key="download" title="下载代码">
        <IconButton size="small" onClick={handleDownload}>
          <Download size={16} />
        </IconButton>
      </Tooltip>
    );

    // 编辑/预览切换按钮（仅在启用编辑器时显示）
    if (codeEditor) {
      buttons.push(
        <Tooltip key="edit" title={viewMode === 'preview' ? '编辑代码' : '预览代码'}>
          <IconButton size="small" onClick={toggleViewMode}>
            {viewMode === 'preview' ? <Edit size={16} /> : <Eye size={16} />}
          </IconButton>
        </Tooltip>
      );
    }

    // 换行切换按钮（仅在启用换行时显示）
    if (codeWrappable) {
      buttons.push(
        <Tooltip key="wrap" title={isWrapped ? '取消换行' : '启用换行'}>
          <IconButton size="small" onClick={toggleWrap}>
            {isWrapped ? <Type size={16} /> : <WrapText size={16} />}
          </IconButton>
        </Tooltip>
      );
    }

    // 折叠按钮（仅在需要时显示）
    if (shouldShowCollapseButton) {
      buttons.push(
        <Tooltip key="collapse" title={isCollapsed ? '展开代码' : '折叠代码'}>
          <IconButton size="small" onClick={toggleCollapse}>
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </IconButton>
        </Tooltip>
      );
    }

    return buttons;
  }, [
    handleCopy, 
    handleDownload, 
    codeEditor, 
    viewMode, 
    toggleViewMode, 
    codeWrappable, 
    isWrapped, 
    toggleWrap, 
    shouldShowCollapseButton, 
    isCollapsed, 
    toggleCollapse
  ]);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        // 移除背景色，让 SyntaxHighlighter 的主题背景色生效
        position: 'relative',
        // 桌面端hover显示工具栏
        '@media (hover: hover)': {
          '&:hover .code-toolbar': {
            opacity: 1
          }
        },
        // 移动端始终显示工具栏
        '@media (hover: none)': {
          '& .code-toolbar': {
            opacity: 1
          }
        }
      }}
    >
      {/* 头部：语言标签和工具栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          backgroundColor: isDarkMode ? 'grey.800' : 'grey.100',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Chip
          label={getLanguageDisplayName(block.language)}
          size="small"
          variant="outlined"
          sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
        />
        
        <Box 
          className="code-toolbar"
          sx={{ 
            display: 'flex', 
            gap: 0.5,
            opacity: 0,
            transition: 'opacity 0.2s ease'
          }}
        >
          {toolbarButtons}
        </Box>
      </Box>

      {/* 代码内容区域 - 完全移除中间层，参考电脑版设计 */}
      <Collapse in={!isCollapsed} timeout="auto">
        {viewMode === 'preview' ? (
          // 预览模式 - 直接使用语法高亮器，无额外包装
          <SyntaxHighlighter
            language={block.language || 'text'}
            style={highlightTheme}
            showLineNumbers={codeShowLineNumbers}
            wrapLines={isWrapped}
            wrapLongLines={isWrapped}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              // 移除 backgroundColor 设置，让 SyntaxHighlighter 使用主题的背景色
              border: 'none',
              borderRadius: 0,
              overflow: 'auto',
              maxHeight: codeCollapsible && !isCollapsed ? '400px' : 'none',
              minWidth: '100%'
            }}
            codeTagProps={{
              style: {
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                display: 'block'
              }
            }}
            lineNumberStyle={{
              minWidth: '2.5em',
              paddingRight: '1em',
              textAlign: 'right',
              opacity: 0.5,
              userSelect: 'none'
            }}
          >
            {block.content}
          </SyntaxHighlighter>
        ) : (
          // 编辑模式 - 直接使用 textarea，无额外包装
          <Box
            sx={{
              maxHeight: codeCollapsible && !isCollapsed ? '400px' : 'none',
              overflow: 'auto'
            }}
          >
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                padding: '1rem',
                backgroundColor: 'transparent',
                color: 'inherit',
                whiteSpace: isWrapped ? 'pre-wrap' : 'pre',
                tabSize: 2,
                margin: 0
              }}
              placeholder="编辑代码..."
            />
            <Box sx={{
              p: 1,
              display: 'flex',
              gap: 1,
              justifyContent: 'flex-end',
              borderTop: 1,
              borderColor: 'divider'
            }}>
              <Tooltip title="保存更改">
                <IconButton
                  size="small"
                  onClick={handleSave}
                  color="primary"
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  <Save size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="取消编辑">
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditContent(block.content);
                    setViewMode('preview');
                  }}
                  sx={{
                    backgroundColor: 'grey.300',
                    color: 'grey.700',
                    '&:hover': {
                      backgroundColor: 'grey.400'
                    }
                  }}
                >
                  <X size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </Collapse>

      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        message="代码已复制到剪贴板"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default React.memo(EnhancedCodeBlock);
