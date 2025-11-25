/**
 * 代码样式 Context Provider
 * 参考 Cherry Studio 实现
 */
import React, { createContext, useContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useTheme } from '@mui/material';
import { useAppSelector } from '../shared/store';
import type { HighlightChunkResult, ShikiPreProperties } from '../shared/services/ShikiStreamService';
import { shikiStreamService } from '../shared/services/ShikiStreamService';
import { getHighlighter, loadLanguageIfNeeded, loadThemeIfNeeded } from '../shared/utils/shiki';
import type { BundledThemeInfo } from 'shiki/types';

interface CodeStyleContextType {
  highlightCodeChunk: (trunk: string, language: string, callerId: string) => Promise<HighlightChunkResult>;
  highlightStreamingCode: (code: string, language: string, callerId: string) => Promise<HighlightChunkResult>;
  cleanupTokenizers: (callerId: string) => void;
  getShikiPreProperties: (language: string) => Promise<ShikiPreProperties>;
  highlightCode: (code: string, language: string) => Promise<string>;
  themeNames: string[];
  activeShikiTheme: string;
  isShikiThemeDark: boolean;
}

const defaultCodeStyleContext: CodeStyleContextType = {
  highlightCodeChunk: async () => ({ lines: [], recall: 0 }),
  highlightStreamingCode: async () => ({ lines: [], recall: 0 }),
  cleanupTokenizers: () => {},
  getShikiPreProperties: async () => ({ class: '', style: '', tabindex: 0 }),
  highlightCode: async () => '',
  themeNames: ['auto'],
  activeShikiTheme: 'auto',
  isShikiThemeDark: false
};

const CodeStyleContext = createContext<CodeStyleContextType>(defaultCodeStyleContext);

// 语言别名映射
const languageAliases: Record<string, string> = {
  bash: 'shell',
  'objective-c++': 'objective-cpp',
  svg: 'xml',
  vab: 'vb',
  graphviz: 'dot'
};

export const CodeStyleProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // 从设置获取代码主题配置
  const { codeThemeLight, codeThemeDark } = useAppSelector(state => state.settings);
  
  const [shikiThemesInfo, setShikiThemesInfo] = useState<BundledThemeInfo[]>([]);

  // 加载 Shiki 主题信息
  useEffect(() => {
    import('shiki').then(({ bundledThemesInfo }) => {
      setShikiThemesInfo(bundledThemesInfo);
    });
  }, []);

  // 获取支持的主题名称列表
  const themeNames = useMemo(() => {
    return ['auto', ...shikiThemesInfo.map((info) => info.id)];
  }, [shikiThemesInfo]);

  // 获取当前使用的 Shiki 主题名称
  const activeShikiTheme = useMemo(() => {
    const codeStyle = isDarkMode ? codeThemeDark : codeThemeLight;
    if (!codeStyle || codeStyle === 'auto' || !themeNames.includes(codeStyle)) {
      return isDarkMode ? 'material-theme-darker' : 'one-light';
    }
    return codeStyle;
  }, [isDarkMode, codeThemeLight, codeThemeDark, themeNames]);

  // 判断当前主题是否为深色
  const isShikiThemeDark = useMemo(() => {
    const themeInfo = shikiThemesInfo.find((info) => info.id === activeShikiTheme);
    return themeInfo?.type === 'dark';
  }, [activeShikiTheme, shikiThemesInfo]);

  useEffect(() => {
    // 在组件卸载时清理资源
    return () => {
      shikiStreamService.dispose();
    };
  }, []);

  // 流式代码高亮，返回已高亮的 token lines
  const highlightCodeChunk = useCallback(
    async (trunk: string, language: string, callerId: string) => {
      const normalizedLang = languageAliases[language] || language.toLowerCase();
      return shikiStreamService.highlightCodeChunk(trunk, normalizedLang, activeShikiTheme, callerId);
    },
    [activeShikiTheme]
  );

  // 清理代码高亮资源
  const cleanupTokenizers = useCallback((callerId: string) => {
    shikiStreamService.cleanupTokenizers(callerId);
  }, []);

  // 高亮流式输出的代码
  const highlightStreamingCode = useCallback(
    async (fullContent: string, language: string, callerId: string) => {
      const normalizedLang = languageAliases[language] || language.toLowerCase();
      return shikiStreamService.highlightStreamingCode(fullContent, normalizedLang, activeShikiTheme, callerId);
    },
    [activeShikiTheme]
  );

  // 获取 Shiki pre 标签属性
  const getShikiPreProperties = useCallback(
    async (language: string) => {
      const normalizedLang = languageAliases[language] || language.toLowerCase();
      return shikiStreamService.getShikiPreProperties(normalizedLang, activeShikiTheme);
    },
    [activeShikiTheme]
  );

  // 完整高亮代码
  const highlightCode = useCallback(
    async (code: string, language: string) => {
      const highlighter = await getHighlighter();
      await loadLanguageIfNeeded(highlighter, language);
      await loadThemeIfNeeded(highlighter, activeShikiTheme);
      return highlighter.codeToHtml(code, { lang: language, theme: activeShikiTheme });
    },
    [activeShikiTheme]
  );

  const contextValue = useMemo(
    () => ({
      highlightCodeChunk,
      highlightStreamingCode,
      cleanupTokenizers,
      getShikiPreProperties,
      highlightCode,
      themeNames,
      activeShikiTheme,
      isShikiThemeDark
    }),
    [
      highlightCodeChunk,
      highlightStreamingCode,
      cleanupTokenizers,
      getShikiPreProperties,
      highlightCode,
      themeNames,
      activeShikiTheme,
      isShikiThemeDark
    ]
  );

  return <CodeStyleContext.Provider value={contextValue}>{children}</CodeStyleContext.Provider>;
};

export const useCodeStyle = () => {
  const context = useContext(CodeStyleContext);
  if (!context) {
    throw new Error('useCodeStyle must be used within a CodeStyleProvider');
  }
  return context;
};
