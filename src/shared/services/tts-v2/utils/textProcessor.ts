/**
 * 文本处理工具
 * 参考 Kelivo 的实现
 */

/**
 * 剥离 Markdown 格式
 * 用于 TTS 播放前清理文本
 */
export function stripMarkdown(input: string): string {
  let s = input;
  
  // 移除代码块
  s = s.replace(/```[\s\S]*?```/gm, ' ');
  
  // 移除行内代码
  s = s.replace(/`[^`]*`/g, ' ');
  
  // 链接: 保留链接文字
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // 图片: 移除
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  
  // 标题和强调标记
  s = s.replace(/^[#>\-*+]+\s*/gm, '');
  s = s.replace(/[*_~]{1,3}/g, '');
  
  // 表格/管道符
  s = s.replace(/\|/g, ' ');
  
  // 合并空白
  s = s.replace(/\s+/g, ' ');
  
  return s.trim();
}

/**
 * 文本分块
 * 将长文本按句子分割，避免 TTS 超时
 */
export function chunkText(text: string, maxLength: number = 450): string[] {
  const chunks: string[] = [];
  
  // 按句子分割 (中英文标点)
  const sentences = text
    .split(/(?<=[。！？!?.;；])/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  let buffer = '';
  
  for (const sentence of sentences) {
    if ((buffer.length + sentence.length) > maxLength && buffer.length > 0) {
      chunks.push(buffer.trim());
      buffer = '';
    }
    
    buffer += sentence;
    
    if (buffer.length >= maxLength) {
      chunks.push(buffer.trim());
      buffer = '';
    }
  }
  
  if (buffer.length > 0) {
    chunks.push(buffer.trim());
  }
  
  // 确保至少有一个块
  if (chunks.length === 0) {
    chunks.push(text.length > maxLength ? text.substring(0, maxLength) : text);
  }
  
  return chunks;
}

/**
 * 预处理文本用于 TTS
 */
export function preprocessText(text: string): string {
  // 剥离 Markdown
  let processed = stripMarkdown(text);
  
  // 移除多余空行
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  return processed.trim();
}
