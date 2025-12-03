/**
 * 文本处理工具函数
 */

/**
 * HTML 实体转义
 */
export function unescapeHtmlEntities(text: string): string {
  if (!text) return text;

  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
    .replace(/&lsqb;/g, '[')
    .replace(/&rsqb;/g, ']')
    .replace(/&amp;/g, '&');
}

/**
 * 移除代码块标记
 */
export function removeCodeBlockMarkers(content: string): string {
  let result = content;
  
  // 移除开头的 ```
  if (result.startsWith('```')) {
    result = result.split('\n').slice(1).join('\n');
  }
  
  // 移除结尾的 ```
  if (result.endsWith('```')) {
    result = result.split('\n').slice(0, -1).join('\n');
  }
  
  return result;
}

/**
 * 检测代码省略标记
 */
export function detectCodeOmission(content: string): boolean {
  const omissionPatterns = [
    /\/\/\s*rest\s+of\s+code/i,
    /\/\/\s*\.{3}/,
    /\/\*\s*previous\s+code/i,
    /\/\*\s*rest\s+of/i,
    /\/\/\s*unchanged/i,
    /\/\/\s*same\s+as\s+before/i,
    /\/\/\s*\.{3}\s*remaining/i,
    /#\s*rest\s+of\s+code/i,
    /#\s*\.{3}/,
  ];

  return omissionPatterns.some(pattern => pattern.test(content));
}

/**
 * 截断文件内容
 */
export function truncateFileContent(
  content: string,
  maxChars: number,
  totalChars: number,
  isPreview: boolean = false
): { content: string; notice: string } {
  const truncatedContent = content.slice(0, maxChars);

  const notice = isPreview
    ? `预览: 显示前 ${(maxChars / 1024).toFixed(1)}KB / 共 ${(totalChars / 1024).toFixed(1)}KB。使用 start_line/end_line 读取特定部分。`
    : `文件已截断至 ${maxChars} / ${totalChars} 字符，以适应上下文限制。使用 start_line/end_line 读取特定部分。`;

  return {
    content: truncatedContent,
    notice
  };
}
