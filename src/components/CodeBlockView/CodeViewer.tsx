import React, { memo, useMemo, useEffect, useRef, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscDarkPlus,
  vs,
  oneDark,
  oneLight,
  materialDark,
  materialLight,
  nord,
  dracula,
  atomDark,
  solarizedlight
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppSelector } from '../../shared/store';

// 代码高度常量
const MAX_COLLAPSED_HEIGHT = 300;

interface CodeViewerProps {
  value: string;
  language: string;
  expanded?: boolean;
  wrapped?: boolean;
  maxHeight?: string;
  showLineNumbers?: boolean;
  onHeightChange?: (height: number) => void;
  className?: string;
}

// 主题映射
const getHighlightTheme = (codeStyle: string, isDarkMode: boolean) => {
  const themeMap: Record<string, any> = {
    'auto': isDarkMode ? vscDarkPlus : vs,
    'vs-code-light': vs,
    'vs-code-dark': vscDarkPlus,
    'one-dark-pro': oneDark,
    'one-light': oneLight,
    'material-dark': materialDark,
    'material-light': materialLight,
    'nord': nord,
    'dracula': dracula,
    'atom-dark': atomDark,
    'solarized-light': solarizedlight,
    // 兼容旧版本
    'vscDarkPlus': vscDarkPlus,
    'vs': vs,
  };
  return themeMap[codeStyle] || (isDarkMode ? vscDarkPlus : vs);
};

/**
 * 代码查看器组件
 * 使用 react-syntax-highlighter 进行语法高亮
 */
const CodeViewer: React.FC<CodeViewerProps> = ({
  value,
  language,
  expanded = true,
  wrapped = false,
  maxHeight = `${MAX_COLLAPSED_HEIGHT}px`,
  showLineNumbers,
  onHeightChange,
  className
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 从设置获取代码主题和行号显示
  const { codeStyle, codeShowLineNumbers } = useAppSelector(state => state.settings);
  
  // 使用 props 或设置中的行号配置
  const displayLineNumbers = showLineNumbers ?? codeShowLineNumbers;

  // 获取语法高亮主题
  const highlightTheme = useMemo(() => {
    return getHighlightTheme(codeStyle, isDarkMode);
  }, [codeStyle, isDarkMode]);

  // 安全的代码内容
  const safeCode = useMemo(() => {
    return typeof value === 'string' ? value.trimEnd() : '';
  }, [value]);

  // 监听高度变化
  const updateHeight = useCallback(() => {
    if (containerRef.current && onHeightChange) {
      const scrollHeight = containerRef.current.scrollHeight;
      onHeightChange(scrollHeight);
    }
  }, [onHeightChange]);

  useEffect(() => {
    updateHeight();
    // 观察尺寸变化
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updateHeight, safeCode]);

  return (
    <Box
      ref={containerRef}
      className={`code-viewer ${className || ''}`}
      sx={{
        position: 'relative',
        maxHeight: expanded ? 'none' : maxHeight,
        overflow: expanded ? 'visible' : 'hidden',
        borderRadius: '0 0 8px 8px',
        '& pre': {
          margin: 0,
          padding: '12px 16px !important',
          borderRadius: 'inherit',
          fontSize: '13px',
          lineHeight: 1.5,
          backgroundColor: isDarkMode 
            ? 'rgba(30, 30, 30, 0.95) !important' 
            : 'rgba(250, 250, 250, 0.95) !important',
        },
        '& code': {
          fontFamily: '"Fira Code", "JetBrains Mono", Consolas, Monaco, monospace',
          whiteSpace: wrapped ? 'pre-wrap' : 'pre',
          wordBreak: wrapped ? 'break-all' : 'normal',
        },
        // 折叠时的渐变遮罩
        ...(!expanded && {
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: isDarkMode
              ? 'linear-gradient(transparent, rgba(30, 30, 30, 0.95))'
              : 'linear-gradient(transparent, rgba(250, 250, 250, 0.95))',
            pointerEvents: 'none',
            borderRadius: '0 0 8px 8px',
          }
        })
      }}
    >
      <SyntaxHighlighter
        language={language || 'text'}
        style={highlightTheme}
        showLineNumbers={displayLineNumbers}
        wrapLines={wrapped}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          userSelect: 'none',
        }}
      >
        {safeCode}
      </SyntaxHighlighter>
    </Box>
  );
};

export default memo(CodeViewer);
