import { memo, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import type { BasicPreviewHandles } from './types';

interface SvgPreviewProps {
  children: string;
  enableToolbar?: boolean;
}

/**
 * SVG 预览组件
 * 安全地渲染 SVG 内容
 */
const SvgPreview = forwardRef<BasicPreviewHandles, SvgPreviewProps>(({
  children,
  enableToolbar: _enableToolbar = true
}, ref) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // 处理 SVG 内容，确保安全
  const sanitizedSvg = useMemo(() => {
    // 移除潜在的脚本标签
    let safe = children.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // 移除 on* 事件属性
    safe = safe.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    return safe;
  }, [children]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    copy: () => {
      navigator.clipboard.writeText(children);
    },
    download: () => {
      const blob = new Blob([children], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `svg-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }), [children]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '0 0 8px 8px',
        minHeight: '100px',
        '& svg': {
          maxWidth: '100%',
          maxHeight: '400px',
          height: 'auto',
        }
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
    />
  );
});

SvgPreview.displayName = 'SvgPreview';

export default memo(SvgPreview);
