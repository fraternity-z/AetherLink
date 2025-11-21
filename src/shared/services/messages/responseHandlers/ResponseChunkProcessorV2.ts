import blockManagerInstance from '../BlockManager';
import { MessageBlockStatus, MessageBlockType } from '../../../types/newMessage';
import type { Chunk, TextDeltaChunk, TextCompleteChunk, ThinkingDeltaChunk, ThinkingCompleteChunk } from '../../../types/chunk';
import { ChunkType } from '../../../types/chunk';

/**
 * 内容累积器基类
 */
abstract class ContentAccumulator {
  protected content = '';

  abstract accumulate(newContent: string): void;

  getContent(): string {
    return this.content;
  }

  clear(): void {
    this.content = '';
  }
}

/**
 * 文本累积器
 */
class TextAccumulator extends ContentAccumulator {
  accumulate(newText: string): void {
    if (this.content.length > 0 && newText.includes(this.content)) {
      // 完整文本替换
      this.content = newText;
    } else {
      // 增量文本追加
      this.content += newText;
    }
  }
}

/**
 * 思考内容累积器
 */
class ThinkingAccumulator extends ContentAccumulator {
  accumulate(newText: string): void {
    if (newText.length > this.content.length && newText.startsWith(this.content)) {
      this.content = newText;
    } else if (newText !== this.content && !this.content.endsWith(newText)) {
      this.content += newText;
    }
  }
}

/**
 * 块状态枚举
 */
enum BlockState {
  INITIAL = 'initial',
  TEXT_ONLY = 'text_only',
  THINKING_ONLY = 'thinking_only',
  BOTH = 'both'
}

/**
 * 块状态管理器
 * 使用状态机模式管理块的状态转换
 */
class BlockStateManager {
  private state: BlockState = BlockState.INITIAL;
  private readonly initialBlockId: string;
  private textBlockId: string | null = null;
  private thinkingBlockId: string | null = null;

  constructor(initialBlockId: string) {
    this.initialBlockId = initialBlockId;
  }

  /**
   * 转换到文本块状态
   */
  async transitionToText(messageId: string): Promise<{ blockId: string; isNewBlock: boolean }> {
    switch (this.state) {
      case BlockState.INITIAL:
        this.state = BlockState.TEXT_ONLY;
        this.textBlockId = this.initialBlockId;
        return { blockId: this.initialBlockId, isNewBlock: false };

      case BlockState.THINKING_ONLY:
        this.state = BlockState.BOTH;
        // 创建新的文本块
        const textBlock = await blockManagerInstance.createMainTextBlock(messageId);
        this.textBlockId = textBlock.id;
        return { blockId: textBlock.id, isNewBlock: true };

      default:
        return { blockId: this.textBlockId!, isNewBlock: false };
    }
  }

  /**
   * 转换到思考块状态
   * @param _messageId 消息ID（保留以便未来扩展）
   */
  async transitionToThinking(_messageId: string): Promise<{ blockId: string; isNewBlock: boolean }> {
    switch (this.state) {
      case BlockState.INITIAL:
        this.state = BlockState.THINKING_ONLY;
        this.thinkingBlockId = this.initialBlockId;
        return { blockId: this.initialBlockId, isNewBlock: false };

      default:
        return { blockId: this.thinkingBlockId!, isNewBlock: false };
    }
  }

  getTextBlockId(): string | null { return this.textBlockId; }
  getThinkingBlockId(): string | null { return this.thinkingBlockId; }
  getInitialBlockId(): string { return this.initialBlockId; }
  getCurrentState(): BlockState { return this.state; }
}

/**
 * 响应块处理器 V2
 * 使用 BlockManager 进行块管理，实现智能节流
 */
export class ResponseChunkProcessorV2 {
  private readonly textAccumulator = new TextAccumulator();
  private readonly thinkingAccumulator = new ThinkingAccumulator();
  private readonly blockStateManager: BlockStateManager;
  private readonly messageId: string;
  private reasoningStartTime: number | null = null;
  private lastThinkingMilliseconds?: number;

  constructor(messageId: string, blockId: string) {
    this.messageId = messageId;
    this.blockStateManager = new BlockStateManager(blockId);
    console.log('[ResponseChunkProcessorV2] 初始化，使用 BlockManager');
  }

  /**
   * 处理 Chunk
   */
  async handleChunk(chunk: Chunk): Promise<void> {
    if (!chunk) {
      throw new Error('Chunk 不能为空');
    }

    try {
      switch (chunk.type) {
        case ChunkType.TEXT_DELTA:
          await this.handleTextDelta(chunk as TextDeltaChunk);
          break;
        case ChunkType.TEXT_COMPLETE:
          await this.handleTextComplete(chunk as TextCompleteChunk);
          break;
        case ChunkType.THINKING_DELTA:
          await this.handleThinkingDelta(chunk as ThinkingDeltaChunk);
          break;
        case ChunkType.THINKING_COMPLETE:
          await this.handleThinkingComplete(chunk as ThinkingCompleteChunk);
          break;
        default:
          console.warn(`[ResponseChunkProcessorV2] 未知的 chunk 类型: ${chunk.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error(`[ResponseChunkProcessorV2] 处理 ${chunk.type} 失败: ${errorMessage}`, error);
      throw new Error(`处理 chunk 失败: ${errorMessage}`);
    }
  }

  /**
   * 处理文本增量
   */
  private async handleTextDelta(chunk: TextDeltaChunk): Promise<void> {
    this.textAccumulator.accumulate(chunk.text);
    await this.processTextContent(false);
  }

  /**
   * 处理文本完成
   */
  private async handleTextComplete(chunk: TextCompleteChunk): Promise<void> {
    this.textAccumulator.accumulate(chunk.text);
    await this.processTextContent(true);
  }

  /**
   * 处理思考增量
   */
  private async handleThinkingDelta(chunk: ThinkingDeltaChunk): Promise<void> {
    this.thinkingAccumulator.accumulate(chunk.text);
    await this.processThinkingContent(chunk.thinking_millsec, false);
  }

  /**
   * 处理思考完成
   */
  private async handleThinkingComplete(chunk: ThinkingCompleteChunk): Promise<void> {
    this.thinkingAccumulator.accumulate(chunk.text);
    await this.processThinkingContent(chunk.thinking_millsec, true);
  }

  /**
   * 处理文本内容
   */
  private async processTextContent(isComplete: boolean): Promise<void> {
    const { blockId, isNewBlock } = await this.blockStateManager.transitionToText(this.messageId);

    if (isNewBlock) {
      // 新块已在状态管理器中创建，直接更新即可
      console.log('[ResponseChunkProcessorV2] 创建了新的文本块');
    }

    // 使用 BlockManager 的智能更新
    blockManagerInstance.smartUpdate(
      blockId,
      {
        content: this.textAccumulator.getContent(),
        type: MessageBlockType.MAIN_TEXT,
        status: MessageBlockStatus.STREAMING,
        updatedAt: new Date().toISOString()
      },
      MessageBlockType.MAIN_TEXT,
      isComplete
    );
  }

  /**
   * 处理思考内容
   */
  private async processThinkingContent(thinkingMillsec: number | undefined, isComplete: boolean): Promise<void> {
    const { blockId } = await this.blockStateManager.transitionToThinking(this.messageId);
    const computedThinkingMillis = this.updateThinkingTimer(thinkingMillsec);

    const changes: any = {
      content: this.thinkingAccumulator.getContent(),
      type: MessageBlockType.THINKING,
      status: MessageBlockStatus.STREAMING,
      updatedAt: new Date().toISOString()
    };

    if (typeof computedThinkingMillis === 'number') {
      changes.thinking_millsec = computedThinkingMillis;
    }

    // 使用 BlockManager 的智能更新
    blockManagerInstance.smartUpdate(
      blockId,
      changes,
      MessageBlockType.THINKING,
      isComplete
    );
  }

  /**
   * 更新思考计时器
   */
  private updateThinkingTimer(thinkingMillsec?: number): number | undefined {
    const now = Date.now();

    // 如果提供了有效的思考时间，优先使用它
    if (typeof thinkingMillsec === 'number' && thinkingMillsec > 0) {
      this.lastThinkingMilliseconds = thinkingMillsec;

      // 同步起始时间，确保后续增量计算一致
      const inferredStartTime = now - thinkingMillsec;
      if (this.reasoningStartTime === null || inferredStartTime < this.reasoningStartTime) {
        this.reasoningStartTime = inferredStartTime;
      }

      return this.lastThinkingMilliseconds;
    }

    if (this.reasoningStartTime === null) {
      this.reasoningStartTime = now;
    }

    const elapsed = now - this.reasoningStartTime;
    this.lastThinkingMilliseconds = Math.max(this.lastThinkingMilliseconds ?? 0, elapsed);

    return this.lastThinkingMilliseconds;
  }

  /**
   * 完成所有块
   */
  async complete(): Promise<void> {
    const textBlockId = this.blockStateManager.getTextBlockId();
    const thinkingBlockId = this.blockStateManager.getThinkingBlockId();

    if (textBlockId) {
      await blockManagerInstance.completeBlock(
        textBlockId,
        this.textAccumulator.getContent()
      );
    }

    if (thinkingBlockId && thinkingBlockId !== textBlockId) {
      await blockManagerInstance.completeBlock(
        thinkingBlockId,
        this.thinkingAccumulator.getContent()
      );
    }

    console.log('[ResponseChunkProcessorV2] 所有块已完成');
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    blockManagerInstance.cleanup();
    console.log('[ResponseChunkProcessorV2] 清理完成');
  }

  // Getters
  get content(): string { return this.textAccumulator.getContent(); }
  get thinking(): string { return this.thinkingAccumulator.getContent(); }
  get textBlockId(): string | null { return this.blockStateManager.getTextBlockId(); }
  get thinkingId(): string | null { return this.blockStateManager.getThinkingBlockId(); }
  get currentBlockId(): string { return this.blockStateManager.getInitialBlockId(); }
  get thinkingDurationMs(): number | undefined { return this.lastThinkingMilliseconds; }
  get blockType(): string {
    const state = this.blockStateManager.getCurrentState();
    switch (state) {
      case BlockState.THINKING_ONLY:
        return MessageBlockType.THINKING;
      case BlockState.TEXT_ONLY:
        return MessageBlockType.MAIN_TEXT;
      case BlockState.BOTH:
        return MessageBlockType.THINKING;
      default:
        return MessageBlockType.MAIN_TEXT;
    }
  }
}

/**
 * 工厂函数
 */
export function createResponseChunkProcessorV2(
  messageId: string,
  blockId: string
): ResponseChunkProcessorV2 {
  return new ResponseChunkProcessorV2(messageId, blockId);
}
