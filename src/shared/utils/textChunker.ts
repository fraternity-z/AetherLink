/**
 * 智能文本分块工具
 * 基于句子和段落的语义分块，保持内容完整性
 */

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  /** 是否保持句子完整性 */
  preserveSentences?: boolean;
  /** 是否保持段落完整性 */
  preserveParagraphs?: boolean;
}

const DEFAULT_OPTIONS: ChunkOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
  preserveSentences: true,
  preserveParagraphs: false
};

/**
 * 句子分割正则表达式
 * 支持中英文标点符号
 */
const SENTENCE_ENDINGS = /(?<=[。！？.!?\n])\s*/g;

/**
 * 段落分割正则表达式
 */
const PARAGRAPH_SEPARATOR = /\n\s*\n/g;

/**
 * 将文本按句子分割
 * @param text 输入文本
 * @returns 句子数组
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // 先按换行和句子结束符分割
  const parts = text.split(SENTENCE_ENDINGS);
  
  // 过滤空字符串并清理
  return parts
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 将文本按段落分割
 * @param text 输入文本
 * @returns 段落数组
 */
export function splitIntoParagraphs(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .split(PARAGRAPH_SEPARATOR)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * 智能文本分块
 * 基于句子边界进行分块，避免切断语义
 * 
 * @param text 输入文本
 * @param options 分块选项
 * @returns 文本块数组
 */
export function chunkText(text: string, options?: Partial<ChunkOptions>): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { chunkSize, chunkOverlap, preserveSentences } = opts;

  if (!text || typeof text !== 'string') {
    return [];
  }

  // 清理文本
  const cleanedText = text.trim();
  if (cleanedText.length === 0) {
    return [];
  }

  // 如果文本小于块大小，直接返回
  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }

  const chunks: string[] = [];

  if (preserveSentences) {
    // 基于句子的智能分块
    const sentences = splitIntoSentences(cleanedText);
    
    if (sentences.length === 0) {
      // 如果无法分割成句子，使用字符分块
      return chunkByCharacter(cleanedText, chunkSize, chunkOverlap);
    }

    let currentChunk = '';
    let overlapBuffer = '';

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      
      // 如果单个句子就超过块大小，需要进一步分割
      if (sentence.length > chunkSize) {
        // 保存当前块
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          overlapBuffer = getOverlapText(currentChunk, chunkOverlap);
        }
        
        // 分割长句子
        const subChunks = chunkByCharacter(sentence, chunkSize, chunkOverlap);
        chunks.push(...subChunks);
        
        currentChunk = '';
        overlapBuffer = getOverlapText(subChunks[subChunks.length - 1] || '', chunkOverlap);
        continue;
      }

      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

      if (potentialChunk.length <= chunkSize) {
        currentChunk = potentialChunk;
      } else {
        // 当前块已满，保存并开始新块
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          overlapBuffer = getOverlapText(currentChunk, chunkOverlap);
        }
        
        // 新块从重叠部分开始
        currentChunk = overlapBuffer + (overlapBuffer ? ' ' : '') + sentence;
        
        // 如果新块仍然太大，截断重叠部分
        if (currentChunk.length > chunkSize) {
          currentChunk = sentence;
        }
      }
    }

    // 添加最后一个块
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // 简单字符分块
    return chunkByCharacter(cleanedText, chunkSize, chunkOverlap);
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * 基于字符的简单分块（回退方案）
 * @param text 输入文本
 * @param chunkSize 块大小
 * @param overlap 重叠大小
 * @returns 文本块数组
 */
function chunkByCharacter(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const step = Math.max(1, chunkSize - overlap);

  for (let i = 0; i < text.length; i += step) {
    const chunk = text.slice(i, i + chunkSize);
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    // 如果剩余文本已经被完全包含，停止
    if (i + chunkSize >= text.length) {
      break;
    }
  }

  return chunks;
}

/**
 * 获取文本末尾的重叠部分
 * @param text 输入文本
 * @param overlapSize 重叠大小
 * @returns 重叠文本
 */
function getOverlapText(text: string, overlapSize: number): string {
  if (!text || overlapSize <= 0) {
    return '';
  }

  if (text.length <= overlapSize) {
    return text;
  }

  // 尝试在句子边界处截断
  const overlapPart = text.slice(-overlapSize);
  
  // 找到第一个句子开始的位置
  const sentenceStart = overlapPart.search(/[。！？.!?]\s*/);
  if (sentenceStart !== -1 && sentenceStart < overlapPart.length - 10) {
    return overlapPart.slice(sentenceStart + 1).trim();
  }

  return overlapPart;
}

/**
 * 估算文本的token数量（粗略估计）
 * 中文约1.5字符/token，英文约4字符/token
 * @param text 输入文本
 * @returns 估算的token数量
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  let chineseChars = 0;
  let otherChars = 0;

  for (const char of text) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      chineseChars++;
    } else {
      otherChars++;
    }
  }

  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}
