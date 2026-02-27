/**
 * 智能文本分块工具
 * 基于句子和段落的语义分块，保持内容完整性
 * 支持多种分块策略：fixed / paragraph / markdown / code
 */

import type { ChunkStrategy } from '../types/KnowledgeBase';

export interface ChunkOptions {
  chunkSize: number;
  chunkOverlap: number;
  /** 是否保持句子完整性 */
  preserveSentences?: boolean;
  /** 是否保持段落完整性 */
  preserveParagraphs?: boolean;
  /** 分块策略 */
  strategy?: ChunkStrategy;
}

const DEFAULT_OPTIONS: ChunkOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
  preserveSentences: true,
  preserveParagraphs: false,
  strategy: 'fixed',
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
 * 根据策略选择不同的分块方式
 * 
 * @param text 输入文本
 * @param options 分块选项
 * @returns 文本块数组
 */
export function chunkText(text: string, options?: Partial<ChunkOptions>): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!text || typeof text !== 'string') {
    return [];
  }

  const cleanedText = text.trim();
  if (cleanedText.length === 0) {
    return [];
  }

  if (cleanedText.length <= opts.chunkSize) {
    return [cleanedText];
  }

  switch (opts.strategy) {
    case 'markdown':
      return chunkByMarkdown(cleanedText, opts.chunkSize, opts.chunkOverlap);
    case 'code':
      return chunkByCode(cleanedText, opts.chunkSize, opts.chunkOverlap);
    case 'paragraph':
      return chunkByParagraph(cleanedText, opts.chunkSize, opts.chunkOverlap);
    case 'fixed':
    default:
      return chunkByFixed(cleanedText, opts);
  }
}

/**
 * 固定大小 + 句子边界分块（原有逻辑）
 */
function chunkByFixed(text: string, opts: ChunkOptions): string[] {
  const { chunkSize, chunkOverlap, preserveSentences } = opts;
  const chunks: string[] = [];

  if (preserveSentences) {
    const sentences = splitIntoSentences(text);
    
    if (sentences.length === 0) {
      return chunkByCharacter(text, chunkSize, chunkOverlap);
    }

    let currentChunk = '';
    let overlapBuffer = '';

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      
      if (sentence.length > chunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          overlapBuffer = getOverlapText(currentChunk, chunkOverlap);
        }
        
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
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          overlapBuffer = getOverlapText(currentChunk, chunkOverlap);
        }
        
        currentChunk = overlapBuffer + (overlapBuffer ? ' ' : '') + sentence;
        
        if (currentChunk.length > chunkSize) {
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }
  } else {
    return chunkByCharacter(text, chunkSize, chunkOverlap);
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Markdown 标题分块
 * 按 # 标题层级分割，保留标题作为每个块的上下文
 */
function chunkByMarkdown(text: string, chunkSize: number, chunkOverlap: number): string[] {
  // 按标题分割（支持 # ~ ######）
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const sections: { heading: string; level: number; content: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(text)) !== null) {
    // 把标题之前的内容归到上一个 section
    if (sections.length > 0 && lastIndex < match.index) {
      sections[sections.length - 1].content += text.slice(lastIndex, match.index);
    } else if (lastIndex < match.index) {
      // 标题之前的序言内容
      const preamble = text.slice(lastIndex, match.index).trim();
      if (preamble) {
        sections.push({ heading: '', level: 0, content: preamble });
      }
    }

    sections.push({
      heading: match[0],
      level: match[1].length,
      content: '',
    });
    lastIndex = match.index + match[0].length;
  }

  // 尾部内容
  if (sections.length > 0) {
    sections[sections.length - 1].content += text.slice(lastIndex);
  } else {
    // 没有标题，回退到段落策略
    return chunkByParagraph(text, chunkSize, chunkOverlap);
  }

  // 将 section 组装成块，超大 section 再细分
  const chunks: string[] = [];
  let currentChunk = '';

  for (const section of sections) {
    const sectionText = (section.heading + '\n' + section.content).trim();

    if (!sectionText) continue;

    // section 本身超过 chunkSize → 拆分
    if (sectionText.length > chunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // 在标题前缀下细分
      const prefix = section.heading ? section.heading + '\n' : '';
      const subChunks = chunkByCharacter(section.content.trim(), chunkSize - prefix.length, chunkOverlap);
      subChunks.forEach(sub => chunks.push((prefix + sub).trim()));
      continue;
    }

    const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + sectionText;
    if (potentialChunk.length <= chunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sectionText;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * 代码感知分块
 * 按函数/类/代码块边界分割，保持代码结构完整
 */
function chunkByCode(text: string, chunkSize: number, chunkOverlap: number): string[] {
  // 识别代码块边界：函数定义、类定义、空行分隔的代码段
  const codeBlockPatterns = [
    /^(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|enum|const|let|var)\s+/m,  // JS/TS
    /^(?:def|class|async def)\s+/m,            // Python
    /^(?:pub\s+)?(?:fn|struct|impl|enum|trait)\s+/m,  // Rust
    /^(?:public|private|protected)?\s*(?:static\s+)?(?:class|void|int|string|boolean|function)\s+/m,  // Java/C#
  ];

  // 先尝试按空行 + 代码定义分割
  const lines = text.split('\n');
  const segments: string[] = [];
  let currentSegment = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isDefinitionStart = codeBlockPatterns.some(p => p.test(line));
    const isBlankLine = line.trim() === '';

    // 遇到新的定义且当前段不为空 → 分割
    if (isDefinitionStart && currentSegment.trim().length > 0) {
      segments.push(currentSegment.trim());
      currentSegment = line + '\n';
    } else if (isBlankLine && currentSegment.trim().length > 200) {
      // 遇到空行且已经积累了足够内容 → 分割
      segments.push(currentSegment.trim());
      currentSegment = '';
    } else {
      currentSegment += line + '\n';
    }
  }
  if (currentSegment.trim()) {
    segments.push(currentSegment.trim());
  }

  // 如果只分出了 1 个段，回退到固定分块
  if (segments.length <= 1) {
    return chunkByCharacter(text, chunkSize, chunkOverlap);
  }

  // 合并太小的段，拆分太大的段
  const chunks: string[] = [];
  let currentChunk = '';

  for (const segment of segments) {
    if (segment.length > chunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      const subChunks = chunkByCharacter(segment, chunkSize, chunkOverlap);
      chunks.push(...subChunks);
      continue;
    }

    const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + segment;
    if (potentialChunk.length <= chunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = segment;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * 段落分块
 * 按双换行（段落边界）分割，保持段落完整性
 */
function chunkByParagraph(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const paragraphs = splitIntoParagraphs(text);

  if (paragraphs.length <= 1) {
    return chunkByCharacter(text, chunkSize, chunkOverlap);
  }

  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > chunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      const subChunks = chunkByCharacter(paragraph, chunkSize, chunkOverlap);
      chunks.push(...subChunks);
      continue;
    }

    const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;
    if (potentialChunk.length <= chunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 0);
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
