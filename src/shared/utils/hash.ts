/**
 * 哈希工具函数
 * 用于生成内容的 SHA-256 哈希值
 */

/**
 * 计算字符串的 SHA-256 哈希值
 * @param content 要计算哈希的内容
 * @returns 十六进制格式的哈希值
 */
export async function createHash(content: string): Promise<string> {
  // 使用 Web Crypto API（浏览器和 Node.js 兼容）
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // 降级方案：简单哈希
  return simpleHash(content);
}

/**
 * 简单哈希函数（降级方案）
 * 使用 DJB2 算法
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // 转换为 32 位整数
  }
  return Math.abs(hash).toString(16);
}

/**
 * 比较两个哈希值是否相等
 */
export function compareHash(hash1: string, hash2: string): boolean {
  return hash1.toLowerCase() === hash2.toLowerCase();
}
