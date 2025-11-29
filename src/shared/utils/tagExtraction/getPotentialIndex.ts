/**
 * 部分匹配检测函数
 * 参考 Cherry Studio 的 getPotentialIndex.ts
 * 
 * 用于检测流式文本中可能被分割的标签
 * 例如：收到 "<tool" 时，知道可能是 "<tool_use>" 的开始
 */

/**
 * 获取文本中标签的潜在起始位置
 * 
 * @param text - 要搜索的文本
 * @param tag - 要查找的标签
 * @returns 标签的起始位置，如果没有找到返回 null
 * 
 * @example
 * // 完整匹配
 * getPotentialStartIndex('hello<tool_use>', '<tool_use>') // 返回 5
 * 
 * // 部分匹配（标签被分割到下一个 chunk）
 * getPotentialStartIndex('hello<tool', '<tool_use>') // 返回 5
 * 
 * // 没有匹配
 * getPotentialStartIndex('hello world', '<tool_use>') // 返回 null
 */
export function getPotentialStartIndex(text: string, tag: string): number | null {
  // 1. 首先检查完整匹配
  const fullMatchIndex = text.indexOf(tag);
  if (fullMatchIndex !== -1) {
    return fullMatchIndex;
  }

  // 2. 检查部分匹配（标签可能被分割到多个 chunk）
  // 从最长的部分开始检查，逐渐缩短
  for (let i = tag.length - 1; i >= 1; i--) {
    const partial = tag.slice(0, i);
    if (text.endsWith(partial)) {
      return text.length - i;
    }
  }

  return null;
}

/**
 * 检查文本是否以指定标签的部分开头
 * 用于处理跨 chunk 的标签
 * 
 * @param text - 要检查的文本
 * @param tag - 完整的标签
 * @param partialLength - 已知的部分长度
 * @returns 是否匹配
 */
export function checkPartialTagContinuation(
  text: string,
  tag: string,
  partialLength: number
): boolean {
  const remaining = tag.slice(partialLength);
  return text.startsWith(remaining);
}
