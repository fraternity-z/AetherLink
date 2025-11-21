/**
 * 计算 Markdown 内容的字符数（去除标记符号）
 */
export function countCharacters(markdown: string): number {
  if (!markdown) return 0;
  
  // 移除 Markdown 标记
  const text = markdown
    .replace(/^#{1,6}\s+/gm, '') // 标题
    .replace(/\*\*(.+?)\*\*/g, '$1') // 粗体
    .replace(/\*(.+?)\*/g, '$1') // 斜体
    .replace(/~~(.+?)~~/g, '$1') // 删除线
    .replace(/`(.+?)`/g, '$1') // 行内代码
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 链接
    .replace(/!\[(.+?)\]\(.+?\)/g, '') // 图片
    .replace(/^[-*+]\s+/gm, '') // 列表
    .replace(/^\d+\.\s+/gm, '') // 有序列表
    .replace(/^>\s+/gm, '') // 引用
    .replace(/```[\s\S]*?```/g, '') // 代码块
    .trim();
  
  return text.length;
}
