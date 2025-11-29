/**
 * 流式标签提取器
 * 参考 Cherry Studio 的 TagExtractor 实现
 * 
 * 用于从流式文本中增量提取标签内容
 * 支持处理跨 chunk 的标签分割情况
 */

import { getPotentialStartIndex } from './getPotentialIndex';
import type { TagConfig, TagExtractionState, TagExtractionResult } from './types';

/**
 * 流式标签提取器
 * 
 * @example
 * const extractor = new StreamTagExtractor({
 *   openingTag: '<tool_use>',
 *   closingTag: '</tool_use>',
 *   separator: '\n'
 * });
 * 
 * // 处理流式 chunk
 * const results1 = extractor.processText('Hello <tool');
 * const results2 = extractor.processText('_use><name>test</name>');
 * const results3 = extractor.processText('</tool_use> World');
 * 
 * // 结束时获取剩余内容
 * const finalResult = extractor.finalize();
 */
export class StreamTagExtractor {
  private config: TagConfig;
  private state: TagExtractionState;

  constructor(config: TagConfig) {
    this.config = config;
    this.state = this.createInitialState();
  }

  /**
   * 创建初始状态
   */
  private createInitialState(): TagExtractionState {
    return {
      textBuffer: '',
      isInsideTag: false,
      isFirstTag: true,
      isFirstText: true,
      afterSwitch: false,
      accumulatedTagContent: '',
      hasTagContent: false
    };
  }

  /**
   * 处理文本块，返回处理结果
   * 
   * @param newText - 新接收的文本
   * @returns 提取结果数组
   */
  processText(newText: string): TagExtractionResult[] {
    this.state.textBuffer += newText;
    const results: TagExtractionResult[] = [];

    // 循环处理直到无法继续
    while (true) {
      // 根据当前状态决定要查找的标签
      const nextTag = this.state.isInsideTag 
        ? this.config.closingTag 
        : this.config.openingTag;
      
      // 查找标签的潜在起始位置
      const startIndex = getPotentialStartIndex(this.state.textBuffer, nextTag);

      if (startIndex === null) {
        // 没有找到任何标签，输出所有内容
        const content = this.state.textBuffer;
        if (content.length > 0) {
          results.push({
            content: this.addPrefix(content),
            isTagContent: this.state.isInsideTag,
            complete: false
          });

          // 如果在标签内，累积内容
          if (this.state.isInsideTag) {
            this.state.accumulatedTagContent += this.addPrefix(content);
            this.state.hasTagContent = true;
          }
        }
        this.state.textBuffer = '';
        break;
      }

      // 处理标签前的内容
      const contentBeforeTag = this.state.textBuffer.slice(0, startIndex);
      if (contentBeforeTag.length > 0) {
        results.push({
          content: this.addPrefix(contentBeforeTag),
          isTagContent: this.state.isInsideTag,
          complete: false
        });

        // 如果在标签内，累积内容
        if (this.state.isInsideTag) {
          this.state.accumulatedTagContent += this.addPrefix(contentBeforeTag);
          this.state.hasTagContent = true;
        }
      }

      // 检查是否找到完整的标签
      const foundFullMatch = startIndex + nextTag.length <= this.state.textBuffer.length;

      if (foundFullMatch) {
        // 找到完整的标签，移除标签并切换状态
        this.state.textBuffer = this.state.textBuffer.slice(startIndex + nextTag.length);

        // 如果刚刚结束一个标签内容，生成完整的标签内容结果
        if (this.state.isInsideTag && this.state.hasTagContent) {
          results.push({
            content: '',
            isTagContent: false,
            complete: true,
            tagContentExtracted: this.state.accumulatedTagContent
          });
          this.state.accumulatedTagContent = '';
          this.state.hasTagContent = false;
        }

        // 切换状态
        this.state.isInsideTag = !this.state.isInsideTag;
        this.state.afterSwitch = true;

        // 更新首次标志
        if (this.state.isInsideTag) {
          this.state.isFirstTag = false;
        } else {
          this.state.isFirstText = false;
        }
      } else {
        // 只找到部分标签，保留在缓冲区等待更多数据
        this.state.textBuffer = this.state.textBuffer.slice(startIndex);
        break;
      }
    }

    return results;
  }

  /**
   * 完成处理，返回任何剩余的标签内容
   * 在流结束时调用
   */
  finalize(): TagExtractionResult | null {
    // 如果还有未完成的标签内容，返回它
    if (this.state.hasTagContent && this.state.accumulatedTagContent) {
      const result: TagExtractionResult = {
        content: '',
        isTagContent: false,
        complete: true,
        tagContentExtracted: this.state.accumulatedTagContent
      };
      this.state.accumulatedTagContent = '';
      this.state.hasTagContent = false;
      return result;
    }

    // 如果缓冲区还有内容，返回它
    if (this.state.textBuffer.length > 0) {
      const result: TagExtractionResult = {
        content: this.state.textBuffer,
        isTagContent: this.state.isInsideTag,
        complete: false
      };
      this.state.textBuffer = '';
      return result;
    }

    return null;
  }

  /**
   * 添加前缀（分隔符）
   */
  private addPrefix(text: string): string {
    const needsPrefix =
      this.state.afterSwitch && 
      (this.state.isInsideTag ? !this.state.isFirstTag : !this.state.isFirstText);

    const prefix = needsPrefix && this.config.separator ? this.config.separator : '';
    this.state.afterSwitch = false;
    return prefix + text;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * 获取当前状态（用于调试）
   */
  getState(): Readonly<TagExtractionState> {
    return { ...this.state };
  }

  /**
   * 检查是否在标签内部
   */
  isInsideTag(): boolean {
    return this.state.isInsideTag;
  }
}
