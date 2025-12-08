import { throttle } from 'lodash';
import { MessageBlockStatus, MessageBlockType } from '../../../types/newMessage';
import type { MessageBlock } from '../../../types/newMessage';
import type { Chunk, TextDeltaChunk, TextCompleteChunk, ThinkingDeltaChunk, ThinkingCompleteChunk } from '../../../types/chunk';
import { ChunkType } from '../../../types/chunk';
import { v4 as uuid } from 'uuid';

// 1. 定义服务接口，便于测试和解耦
interface StorageService {
  updateBlock(blockId: string, changes: any): Promise<void>;
  saveBlock(block: MessageBlock): Promise<void>;
}

interface StateService {
  updateBlock(blockId: string, changes: any): void;
  addBlock(block: MessageBlock): void;
  addBlockReference(messageId: string, blockId: string, status: MessageBlockStatus): void;
}

// 1. 抽象内容累积器
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

// 2. 文本累积器
class TextAccumulator extends ContentAccumulator {
  accumulate(newText: string): void {
    // 防御性检查：确保输入是字符串
    if (typeof newText !== 'string') {
      console.warn('[TextAccumulator] 输入不是字符串，跳过:', typeof newText);
      return;
    }
    // 🔧 修复：处理流式增量和非流式全量两种情况
    if (newText.length > this.content.length && newText.startsWith(this.content)) {
      // 全量替换（流式累积或非流式全量）
      this.content = newText;
    } else if (newText === this.content) {
      // 相同内容，不处理（避免重复累积）
      return;
    } else {
      // 增量追加（流式增量）
      this.content += newText;
    }
  }
}

// 3. 思考内容累积器
class ThinkingAccumulator extends ContentAccumulator {
  accumulate(newText: string): void {
    // 防御性检查：确保输入是字符串
    if (typeof newText !== 'string') {
      console.warn('[ThinkingAccumulator] 输入不是字符串，跳过:', typeof newText);
      return;
    }
    if (newText.length > this.content.length && newText.startsWith(this.content)) {
      this.content = newText;
    } else if (newText !== this.content && !this.content.endsWith(newText)) {
      this.content += newText;
    }
  }
}

// 4. 改进的块更新器 - 智能更新策略
interface BlockUpdater {
  updateBlock(blockId: string, changes: any, blockType: MessageBlockType, isComplete?: boolean): Promise<void>;
  createBlock(block: MessageBlock): Promise<void>;
}

/**
 * 智能节流块更新器
 * 
 * - 块类型变化时：立即更新（取消节流）
 * - 同类型连续更新：节流更新
 * - 块完成时：立即更新并刷新
 */
class SmartThrottledBlockUpdater implements BlockUpdater {
  private throttledStorageUpdate: ReturnType<typeof throttle>;
  private throttledStateUpdate: ReturnType<typeof throttle>;
  private lastBlockType: MessageBlockType | null = null;
  private lastBlockId: string | null = null;

  constructor(
    private stateService: StateService,
    private storageService: StorageService,
    throttleInterval: number
  ) {
    this.throttledStorageUpdate = throttle(
      (blockId: string, changes: any) => storageService.updateBlock(blockId, changes),
      throttleInterval
    );

    this.throttledStateUpdate = throttle(
      (blockId: string, changes: any) => {
        stateService.updateBlock(blockId, changes);
      },
      throttleInterval
    );
  }

  /**
   * 智能更新策略：根据块类型连续性自动判断使用节流还是立即更新
   * 参考 Cherry Studio 的 BlockManager.smartBlockUpdate
   */
  async updateBlock(blockId: string, changes: any, blockType: MessageBlockType, isComplete: boolean = false): Promise<void> {
    const isBlockTypeChanged = this.lastBlockType !== null && this.lastBlockType !== blockType;
    const isBlockIdChanged = this.lastBlockId !== null && this.lastBlockId !== blockId;
    const needsImmediateUpdate = isBlockTypeChanged || isBlockIdChanged || isComplete;

    if (needsImmediateUpdate) {
      // ⭐ 块类型变化时：取消前一个块的节流更新，确保内容完整
      if (isBlockTypeChanged && this.lastBlockId) {
        this.throttledStateUpdate.cancel();
        this.throttledStorageUpdate.cancel();
      }
      
      // 先刷新所有待处理的节流更新
      this.throttledStateUpdate.flush();
      this.throttledStorageUpdate.flush();

      // 立即更新
      this.stateService.updateBlock(blockId, changes);
      await this.storageService.updateBlock(blockId, changes);
    } else {
      // 同类型连续更新：使用节流
      this.throttledStateUpdate(blockId, changes);
      this.throttledStorageUpdate(blockId, changes);
    }

    // 更新追踪状态
    this.lastBlockType = blockType;
    this.lastBlockId = blockId;
  }

  async createBlock(block: MessageBlock): Promise<void> {
    // 关键：先同步更新 Redux store（addBlock 和 addBlockReference），再异步保存到数据库
    // 这样 calculateFinalBlockIds 可以立即看到新块
    this.stateService.addBlock(block);
    this.stateService.addBlockReference(block.messageId, block.id, block.status);
    // 异步保存到数据库（不阻塞 UI 更新）
    await this.storageService.saveBlock(block);
    this.lastBlockType = block.type;
    this.lastBlockId = block.id;
  }

  /**
   * 刷新所有待处理的节流更新
   */
  flush(): void {
    this.throttledStateUpdate.flush();
    this.throttledStorageUpdate.flush();
  }

  /**
   * 强制最终更新（确保内容完整）
   * 用于响应结束时，确保最后的内容被正确写入
   */
  async forceUpdate(blockId: string, changes: any): Promise<void> {
    // 先刷新所有待处理的节流更新
    this.flush();
    // 然后立即执行最终更新
    this.stateService.updateBlock(blockId, changes);
    await this.storageService.updateBlock(blockId, changes);
  }

  /**
   * 取消所有待处理的节流更新
   */
  cancel(): void {
    this.throttledStateUpdate.cancel();
    this.throttledStorageUpdate.cancel();
  }
}

// 5. 简化的块状态管理器 - 使用状态机模式
enum BlockState {
  INITIAL = 'initial',
  TEXT_ONLY = 'text_only',
  THINKING_ONLY = 'thinking_only',
  BOTH = 'both'
}

class BlockStateManager {
  private state: BlockState = BlockState.INITIAL;
  private readonly initialBlockId: string;
  private textBlockId: string | null = null;
  private thinkingBlockId: string | null = null;

  constructor(initialBlockId: string) {
    this.initialBlockId = initialBlockId;
  }

  // 状态转换方法（模仿参考项目：检查 blockId 是否为 null 来决定是否创建新块）
  transitionToText(): { blockId: string; isNewBlock: boolean } {
    switch (this.state) {
      case BlockState.INITIAL:
        this.state = BlockState.TEXT_ONLY;
        this.textBlockId = this.initialBlockId;
        return { blockId: this.initialBlockId, isNewBlock: false };

      case BlockState.THINKING_ONLY:
        this.state = BlockState.BOTH;
        this.textBlockId = uuid();
        return { blockId: this.textBlockId, isNewBlock: true };

      default:
        // 关键修复：如果 textBlockId 为 null（被 resetTextBlock 重置），创建新块
        if (!this.textBlockId) {
          this.textBlockId = uuid();
          return { blockId: this.textBlockId, isNewBlock: true };
        }
        return { blockId: this.textBlockId, isNewBlock: false };
    }
  }

  transitionToThinking(): { blockId: string; isNewBlock: boolean } {
    switch (this.state) {
      case BlockState.INITIAL:
        this.state = BlockState.THINKING_ONLY;
        this.thinkingBlockId = this.initialBlockId;
        return { blockId: this.initialBlockId, isNewBlock: false };

      default:
        // 关键：如果 thinkingBlockId 为 null（被 resetThinkingBlock 重置），创建新块
        if (!this.thinkingBlockId) {
          this.thinkingBlockId = uuid();
          return { blockId: this.thinkingBlockId, isNewBlock: true };
        }
        return { blockId: this.thinkingBlockId, isNewBlock: false };
    }
  }

  getTextBlockId(): string | null { return this.textBlockId; }
  getThinkingBlockId(): string | null { return this.thinkingBlockId; }
  getInitialBlockId(): string { return this.initialBlockId; }
  getCurrentState(): BlockState { return this.state; }

  /** 重置思考块状态，下一轮可创建新块 */
  resetThinkingBlock(): void {
    this.thinkingBlockId = null;
  }

  /** 重置文本块状态，下一轮可创建新块 */
  resetTextBlock(): void {
    this.textBlockId = null;
  }
  
  /** 设置文本块ID（用于非流式响应时手动创建块后设置） */
  setTextBlockId(blockId: string): void {
    this.textBlockId = blockId;
    // 如果当前状态是 THINKING_ONLY，转换为 BOTH
    if (this.state === BlockState.THINKING_ONLY) {
      this.state = BlockState.BOTH;
    }
  }
}

// 6. 主处理器 - 智能更新策略
export class ResponseChunkProcessor {
  private readonly textAccumulator = new TextAccumulator();
  private readonly thinkingAccumulator = new ThinkingAccumulator();
  private readonly blockStateManager: BlockStateManager;
  private readonly blockUpdater: SmartThrottledBlockUpdater;
  private reasoningStartTime: number | null = null;
  private lastThinkingMilliseconds?: number;

  constructor(
    private readonly messageId: string,
    blockId: string,
    stateService: StateService,
    storageService: StorageService,
    throttleInterval: number
  ) {
    this.blockStateManager = new BlockStateManager(blockId);
    this.blockUpdater = new SmartThrottledBlockUpdater(stateService, storageService, throttleInterval);
  }

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
          console.warn(`[ResponseChunkProcessor] 未知的 chunk 类型: ${chunk.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error(`[ResponseChunkProcessor] 处理 ${chunk.type} 失败: ${errorMessage}`, error);
      throw new Error(`处理 chunk 失败: ${errorMessage}`);
    }
  }



  private async handleTextDelta(chunk: TextDeltaChunk): Promise<void> {
    // 🔧 检查是否需要清空累积器（新一轮开始）
    const willCreateNewBlock = this.blockStateManager.getTextBlockId() === null;
    if (willCreateNewBlock && this.textAccumulator.getContent()) {
      this.textAccumulator.clear();
    }
    
    this.textAccumulator.accumulate(chunk.text);
    await this.processTextContent();
  }

  private async handleTextComplete(chunk: TextCompleteChunk): Promise<void> {
    // 非流式多轮：如果开始新一轮，先清空累积器
    const willCreateNewBlock = this.blockStateManager.getTextBlockId() === null;
    if (willCreateNewBlock && this.textAccumulator.getContent()) {
      this.textAccumulator.clear();
    }
    
    this.textAccumulator.accumulate(chunk.text);
    await this.processTextContent(true);
  }

  private async handleThinkingDelta(chunk: ThinkingDeltaChunk): Promise<void> {
    // 非流式多轮：如果开始新一轮，先清空累积器
    const willCreateNewBlock = this.blockStateManager.getThinkingBlockId() === null;
    if (willCreateNewBlock && this.thinkingAccumulator.getContent()) {
      this.thinkingAccumulator.clear();
    }
    
    this.thinkingAccumulator.accumulate(chunk.text);
    await this.processThinkingContent(chunk.thinking_millsec);
  }

  private async handleThinkingComplete(chunk: ThinkingCompleteChunk): Promise<void> {
    // 非流式多轮：如果开始新一轮，先清空累积器
    const willCreateNewBlock = this.blockStateManager.getThinkingBlockId() === null;
    if (willCreateNewBlock && this.thinkingAccumulator.getContent()) {
      this.thinkingAccumulator.clear();
    }
    
    this.thinkingAccumulator.accumulate(chunk.text);
    await this.processThinkingContent(chunk.thinking_millsec, true);
  }

  private async processTextContent(isComplete: boolean = false): Promise<void> {
    const { blockId, isNewBlock } = this.blockStateManager.transitionToText();

    if (isNewBlock) {
      await this.createTextBlock(blockId);
      if (isComplete) {
        await this.updateTextBlock(blockId, true);
      }
    } else {
      await this.updateTextBlock(blockId, isComplete);
    }

    // 完成后重置状态，让下一轮可以创建新块
    if (isComplete) {
      this.blockStateManager.resetTextBlock();
    }
  }

  private async processThinkingContent(thinkingMillsec?: number, isComplete: boolean = false): Promise<void> {
    const { blockId, isNewBlock } = this.blockStateManager.transitionToThinking();
    const computedThinkingMillis = this.updateThinkingTimer(thinkingMillsec);
    
    if (isNewBlock) {
      await this.createThinkingBlock(blockId);
      if (isComplete) {
        await this.updateThinkingBlock(blockId, computedThinkingMillis, true);
      }
    } else {
      await this.updateThinkingBlock(blockId, computedThinkingMillis, isComplete);
    }
    
    // 完成后重置状态，让下一轮可以创建新块
    if (isComplete) {
      this.blockStateManager.resetThinkingBlock();
      this.reasoningStartTime = null;
    }
  }

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

  private async createTextBlock(blockId: string): Promise<void> {
    const block: MessageBlock = {
      id: blockId,
      messageId: this.messageId,
      type: MessageBlockType.MAIN_TEXT,
      content: this.textAccumulator.getContent(),
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.STREAMING
    };
    await this.blockUpdater.createBlock(block);
  }

  private async createThinkingBlock(blockId: string): Promise<void> {
    const block: MessageBlock = {
      id: blockId,
      messageId: this.messageId,
      type: MessageBlockType.THINKING,
      content: this.thinkingAccumulator.getContent(),
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.STREAMING,
      thinking_millsec: 0
    } as MessageBlock;
    await this.blockUpdater.createBlock(block);
  }

  private async updateTextBlock(blockId: string, isComplete: boolean = false): Promise<void> {
    const changes = {
      type: MessageBlockType.MAIN_TEXT,
      content: this.textAccumulator.getContent(),
      status: isComplete ? MessageBlockStatus.SUCCESS : MessageBlockStatus.STREAMING,
      updatedAt: new Date().toISOString()
    };
    
    if (isComplete) {
      // 完成时使用强制更新，确保内容完整
      await this.blockUpdater.forceUpdate(blockId, changes);
    } else {
      await this.blockUpdater.updateBlock(blockId, changes, MessageBlockType.MAIN_TEXT, isComplete);
    }
  }

  private async updateThinkingBlock(blockId: string, thinkingMillis?: number, isComplete: boolean = false): Promise<void> {
    const changes: any = {
      type: MessageBlockType.THINKING,
      content: this.thinkingAccumulator.getContent(),
      status: isComplete ? MessageBlockStatus.SUCCESS : MessageBlockStatus.STREAMING,
      updatedAt: new Date().toISOString()
    };
    if (typeof thinkingMillis === 'number') {
      changes.thinking_millsec = thinkingMillis;
    }
    
    if (isComplete) {
      // 完成时使用强制更新，确保内容完整
      await this.blockUpdater.forceUpdate(blockId, changes);
    } else {
      await this.blockUpdater.updateBlock(blockId, changes, MessageBlockType.THINKING, isComplete);
    }
  }

  /**
   * 完成当前文本块（检测到工具时调用）
   */
  async completeCurrentTextBlock(): Promise<string | null> {
    const textBlockId = this.blockStateManager.getTextBlockId();
    if (textBlockId && this.textAccumulator.getContent()) {
      await this.updateTextBlock(textBlockId, true);
      return textBlockId;
    }
    return null;
  }

  /**
   * 重置文本块状态（模仿参考项目：工具调用后调用，下一轮可创建新块）
   */
  resetTextBlock(): void {
    this.blockStateManager.resetTextBlock();
    this.textAccumulator.clear(); // 工具调用后需要清空
  }

  // Getters
  get content(): string { return this.textAccumulator.getContent(); }
  get thinking(): string { return this.thinkingAccumulator.getContent(); }
  get textBlockId(): string | null { return this.blockStateManager.getTextBlockId(); }
  get thinkingId(): string | null { return this.blockStateManager.getThinkingBlockId(); }
  get currentBlockId(): string { return this.blockStateManager.getInitialBlockId(); }
  get thinkingDurationMs(): number | undefined { return this.lastThinkingMilliseconds; }
  
  // Setter for textBlockId (用于非流式响应时设置)
  setTextBlockId(blockId: string): void {
    this.blockStateManager.setTextBlockId(blockId);
  }
  get blockType(): string {
    const state = this.blockStateManager.getCurrentState();
    switch (state) {
      case BlockState.THINKING_ONLY:
        return MessageBlockType.THINKING;
      case BlockState.TEXT_ONLY:
        return MessageBlockType.MAIN_TEXT;
      case BlockState.BOTH:
        // 当有两种类型时，返回思考块类型，因为主要块是思考块
        return MessageBlockType.THINKING;
      default:
        return MessageBlockType.MAIN_TEXT; // 默认为主文本块
    }
  }
}

// 7. 工厂函数，封装依赖注入的复杂性
export function createResponseChunkProcessor(
  messageId: string,
  blockId: string,
  store: any,
  storage: any,
  actions: any,
  throttleInterval: number
): ResponseChunkProcessor {
  const stateService: StateService = {
    updateBlock: (blockId, changes) => store.dispatch(actions.updateOneBlock({ id: blockId, changes })),
    addBlock: (block) => store.dispatch(actions.addOneBlock(block)),
    addBlockReference: (messageId, blockId, status) =>
      store.dispatch(actions.upsertBlockReference({ messageId, blockId, status }))
  };

  const storageService: StorageService = {
    updateBlock: (blockId, changes) => storage.updateMessageBlock(blockId, changes),
    saveBlock: (block) => storage.saveMessageBlock(block)
  };

  return new ResponseChunkProcessor(messageId, blockId, stateService, storageService, throttleInterval);
}
