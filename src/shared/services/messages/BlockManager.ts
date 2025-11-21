import { throttle } from 'lodash';
import { generateBlockId } from '../../utils';
import store from '../../store';
import { DataRepository } from '../storage/DataRepository';
import { upsertOneBlock, updateOneBlock, addOneBlock } from '../../store/slices/messageBlocksSlice';
import { MessageBlockType, MessageBlockStatus } from '../../types/newMessage';
import type { MessageBlock } from '../../types/newMessage';
import { createKnowledgeReferenceBlock } from '../../utils/messageUtils';
import type { KnowledgeDocument } from '../../types/KnowledgeBase';
import { getHighPerformanceUpdateInterval } from '../../utils/performanceSettings';
import { performanceMonitor } from '../../utils/performanceMonitor';

/**
 * 块更新选项
 */
interface BlockUpdateOptions {
  /** 是否立即更新 */
  immediate?: boolean;
  /** 是否保存到数据库 */
  saveToDb?: boolean;
}

/**
 * 块信息
 */
interface ActiveBlockInfo {
  blockId: string;
  blockType: MessageBlockType;
  content: string;
  lastUpdateTime: number;
}

/**
 * 块管理器类
 * 负责创建、更新和管理消息块
 * 实现智能节流策略，减少 Redux 更新和数据库写入
 */
export class BlockManagerClass {
  private activeBlocks: Map<string, ActiveBlockInfo> = new Map();
  private lastBlockType: MessageBlockType | null = null;
  private throttleInterval: number;
  private throttledReduxUpdate: ReturnType<typeof throttle>;
  private throttledDbUpdate: ReturnType<typeof throttle>;

  constructor(throttleInterval?: number) {
    this.throttleInterval = throttleInterval || getHighPerformanceUpdateInterval();
    
    // 创建节流函数
    this.throttledReduxUpdate = throttle(
      this.immediateReduxUpdate.bind(this),
      this.throttleInterval
    );
    
    this.throttledDbUpdate = throttle(
      this.immediateDbUpdate.bind(this),
      this.throttleInterval * 2 // 数据库更新间隔更长
    );
    
    console.log(`[BlockManager] 初始化，节流间隔: ${this.throttleInterval}ms`);
  }

  /**
   * 智能块更新
   * 根据块类型变化和完成状态决定是否立即更新
   */
  smartUpdate(
    blockId: string,
    changes: Partial<MessageBlock>,
    blockType: MessageBlockType,
    isComplete: boolean = false,
    options: BlockUpdateOptions = {}
  ): void {
    const needsImmediate = this.shouldUpdateImmediately(blockType, isComplete);
    
    // 更新活动块信息
    this.activeBlocks.set(blockId, {
      blockId,
      blockType,
      content: ('content' in changes && typeof changes.content === 'string') ? changes.content : '',
      lastUpdateTime: Date.now()
    });
    
    if (needsImmediate || options.immediate) {
      console.log(`[BlockManager] 立即更新块 ${blockId}, 原因: ${isComplete ? '完成' : '类型变化'}`);
      this.immediateUpdate(blockId, changes, options.saveToDb);
    } else {
      // 使用节流更新
      this.throttledUpdate(blockId, changes);
    }
    
    this.lastBlockType = blockType;
  }

  /**
   * 判断是否需要立即更新
   */
  private shouldUpdateImmediately(blockType: MessageBlockType, isComplete: boolean): boolean {
    // 块完成时立即更新
    if (isComplete) return true;
    
    // 块类型改变时立即更新
    if (this.lastBlockType !== null && this.lastBlockType !== blockType) {
      console.log(`[BlockManager] 检测到块类型变化: ${this.lastBlockType} -> ${blockType}`);
      return true;
    }
    
    return false;
  }

  /**
   * 立即更新块（Redux + 数据库）
   */
  private immediateUpdate(blockId: string, changes: Partial<MessageBlock>, saveToDb: boolean = true): void {
    this.immediateReduxUpdate(blockId, changes);
    if (saveToDb) {
      this.immediateDbUpdate(blockId, changes);
    }
  }

  /**
   * 立即更新 Redux
   */
  private immediateReduxUpdate(blockId: string, changes: Partial<MessageBlock>): void {
    store.dispatch(updateOneBlock({ id: blockId, changes }));
    performanceMonitor.recordReduxUpdate();
  }

  /**
   * 立即更新数据库
   */
  private async immediateDbUpdate(blockId: string, changes: Partial<MessageBlock>): Promise<void> {
    try {
      await DataRepository.blocks.update(blockId, changes);
      performanceMonitor.recordDbWrite();
    } catch (error) {
      console.error(`[BlockManager] 数据库更新失败:`, error);
    }
  }

  /**
   * 节流更新块
   */
  private throttledUpdate(blockId: string, changes: Partial<MessageBlock>): void {
    this.throttledReduxUpdate(blockId, changes);
    this.throttledDbUpdate(blockId, changes);
  }

  /**
   * 完成块
   */
  async completeBlock(blockId: string, finalContent?: string): Promise<void> {
    const blockInfo = this.activeBlocks.get(blockId);
    if (!blockInfo) {
      console.warn(`[BlockManager] 完成块失败，块不存在: ${blockId}`);
      return;
    }

    const changes: any = {
      status: MessageBlockStatus.SUCCESS,
      updatedAt: new Date().toISOString()
    };

    if (finalContent !== undefined) {
      changes.content = finalContent;
    }

    console.log(`[BlockManager] 完成块 ${blockId}`);
    this.immediateUpdate(blockId, changes, true);
    
    // 从活动块中移除
    this.activeBlocks.delete(blockId);
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 取消所有节流函数
    this.throttledReduxUpdate.cancel();
    this.throttledDbUpdate.cancel();
    
    // 清空活动块
    this.activeBlocks.clear();
    this.lastBlockType = null;
    
    console.log(`[BlockManager] 清理完成`);
  }

  /**
   * 获取活动块数量
   */
  getActiveBlockCount(): number {
    return this.activeBlocks.size;
  }

  // ==================== 原有的静态方法 ====================
  /**
   * 创建主文本块
   * @param messageId 消息ID
   * @returns 创建的主文本块
   */
  async createMainTextBlock(messageId: string): Promise<MessageBlock> {
    // 生成唯一的块ID - 使用统一的ID生成工具
    const blockId = generateBlockId('block');

    // 创建块对象
    const block: MessageBlock = {
      id: blockId,
      messageId,
      type: MessageBlockType.MAIN_TEXT,
      content: '',
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.PENDING
    } as MessageBlock;

    console.log(`[BlockManager] 创建主文本块 - ID: ${blockId}, 消息ID: ${messageId}`);

    // 添加到Redux
    store.dispatch(upsertOneBlock(block));

    // 保存到数据库
    await DataRepository.blocks.save(block);

    return block;
  }

  /**
   * 创建思考过程块
   * @param messageId 消息ID
   * @returns 创建的思考过程块
   */
  async createThinkingBlock(messageId: string): Promise<MessageBlock> {
    // 生成唯一的块ID - 使用统一的ID生成工具
    const blockId = generateBlockId('thinking');

    // 创建块对象
    const block: MessageBlock = {
      id: blockId,
      messageId,
      type: MessageBlockType.THINKING,
      content: '',
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.PENDING
    } as MessageBlock;

    console.log(`[BlockManager] 创建思考过程块 - ID: ${blockId}, 消息ID: ${messageId}`);

    // 添加到Redux
    store.dispatch(addOneBlock(block));

    // 保存到数据库
    await DataRepository.blocks.save(block);
    
    // 添加到活动块
    this.activeBlocks.set(blockId, {
      blockId,
      blockType: MessageBlockType.THINKING,
      content: '',
      lastUpdateTime: Date.now()
    });

    return block;
  }

  /**
   * 创建错误块
   * @param messageId 消息ID
   * @param errorMessage 错误信息
   * @returns 创建的错误块
   */
  async createErrorBlock(messageId: string, errorMessage: string): Promise<MessageBlock> {
    // 生成唯一的块ID - 使用统一的ID生成工具
    const blockId = generateBlockId('error');

    // 创建块对象
    const block: MessageBlock = {
      id: blockId,
      messageId,
      type: MessageBlockType.ERROR,
      content: errorMessage,
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.ERROR
    } as MessageBlock;

    console.log(`[BlockManager] 创建错误块 - ID: ${blockId}, 消息ID: ${messageId}, 错误: ${errorMessage}`);

    // 添加到Redux
    store.dispatch(addOneBlock(block));

    // 保存到数据库
    await DataRepository.blocks.save(block);

    return block;
  }

  /**
   * 创建代码块
   * @param messageId 消息ID
   * @param content 代码内容
   * @param language 编程语言
   * @returns 创建的代码块
   */
  async createCodeBlock(messageId: string, content: string, language?: string): Promise<MessageBlock> {
    // 生成唯一的块ID - 使用统一的ID生成工具
    const blockId = generateBlockId('code');

    // 创建块对象
    const block: MessageBlock = {
      id: blockId,
      messageId,
      type: MessageBlockType.CODE,
      content,
      language,
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.SUCCESS
    } as MessageBlock;

    console.log(`[BlockManager] 创建代码块 - ID: ${blockId}, 消息ID: ${messageId}, 语言: ${language || 'text'}`);

    // 添加到Redux
    store.dispatch(addOneBlock(block));

    // 保存到数据库
    await DataRepository.blocks.save(block);

    return block;
  }

  /**
   * 创建视频块
   * @param messageId 消息ID
   * @param videoData 视频数据
   * @returns 创建的视频块
   */
  async createVideoBlock(messageId: string, videoData: {
    url: string;
    base64Data?: string;
    mimeType: string;
    width?: number;
    height?: number;
    size?: number;
    duration?: number;
    poster?: string;
  }): Promise<MessageBlock> {
    // 生成唯一的块ID - 使用统一的ID生成工具
    const blockId = generateBlockId('video');

    // 创建块对象
    const block: MessageBlock = {
      id: blockId,
      messageId,
      type: MessageBlockType.VIDEO,
      url: videoData.url,
      base64Data: videoData.base64Data,
      mimeType: videoData.mimeType,
      width: videoData.width,
      height: videoData.height,
      size: videoData.size,
      duration: videoData.duration,
      poster: videoData.poster,
      createdAt: new Date().toISOString(),
      status: MessageBlockStatus.SUCCESS
    } as MessageBlock;

    console.log(`[BlockManager] 创建视频块 - ID: ${blockId}, 消息ID: ${messageId}, 类型: ${videoData.mimeType}`);

    // 添加到Redux
    store.dispatch(addOneBlock(block));

    // 保存到数据库
    await DataRepository.blocks.save(block);

    return block;
  }

  /**
   * 创建知识库引用块
   * @param messageId 消息ID
   * @param content 文本内容
   * @param knowledgeBaseId 知识库ID
   * @param options 选项
   * @returns 创建的块
   */
  async createKnowledgeReferenceBlock(
    messageId: string,
    content: string,
    knowledgeBaseId: string,
    options?: {
      source?: string;
      similarity?: number;
      fileName?: string;
      fileId?: string;
      knowledgeDocumentId?: string;
      searchQuery?: string;
    }
  ): Promise<MessageBlock> {
    const block = createKnowledgeReferenceBlock(
      messageId,
      content,
      knowledgeBaseId,
      options
    );

    console.log(`[BlockManager] 创建知识库引用块 - ID: ${block.id}, 消息ID: ${messageId}`);

    // 添加块到Redux
    store.dispatch(addOneBlock(block));

    // 保存块到数据库
    await DataRepository.blocks.save(block);

    return block;
  }

  /**
   * 从搜索结果创建知识库引用块
   * @param messageId 消息ID
   * @param searchResult 搜索结果
   * @param knowledgeBaseId 知识库ID
   * @param searchQuery 搜索查询
   * @returns 创建的块
   */
  async createKnowledgeReferenceBlockFromSearchResult(
    messageId: string,
    searchResult: {
      documentId: string;
      content: string;
      similarity: number;
      metadata: KnowledgeDocument['metadata'];
    },
    knowledgeBaseId: string,
    searchQuery: string
  ): Promise<MessageBlock> {
    return this.createKnowledgeReferenceBlock(
      messageId,
      searchResult.content,
      knowledgeBaseId,
      {
        source: searchResult.metadata.source,
        similarity: searchResult.similarity,
        fileName: searchResult.metadata.fileName,
        fileId: searchResult.metadata.fileId,
        knowledgeDocumentId: searchResult.documentId,
        searchQuery
      }
    );
  }
}

/**
 * 全局 BlockManager 实例
 */
const blockManagerInstance = new BlockManagerClass();

/**
 * 向后兼容的 BlockManager 对象
 */
export const BlockManager = {
  createMainTextBlock: (messageId: string) => blockManagerInstance.createMainTextBlock(messageId),
  createThinkingBlock: (messageId: string) => blockManagerInstance.createThinkingBlock(messageId),
  createErrorBlock: (messageId: string, errorMessage: string) => blockManagerInstance.createErrorBlock(messageId, errorMessage),
  createCodeBlock: (messageId: string, content: string, language?: string) => blockManagerInstance.createCodeBlock(messageId, content, language),
  createVideoBlock: (messageId: string, videoData: any) => blockManagerInstance.createVideoBlock(messageId, videoData),
  createKnowledgeReferenceBlock: (messageId: string, content: string, knowledgeBaseId: string, options?: any) => 
    blockManagerInstance.createKnowledgeReferenceBlock(messageId, content, knowledgeBaseId, options),
  createKnowledgeReferenceBlockFromSearchResult: (messageId: string, searchResult: any, knowledgeBaseId: string, searchQuery: string) =>
    blockManagerInstance.createKnowledgeReferenceBlockFromSearchResult(messageId, searchResult, knowledgeBaseId, searchQuery),
  
  // 新增的核心方法
  smartUpdate: (blockId: string, changes: Partial<MessageBlock>, blockType: MessageBlockType, isComplete?: boolean, options?: BlockUpdateOptions) =>
    blockManagerInstance.smartUpdate(blockId, changes, blockType, isComplete, options),
  completeBlock: (blockId: string, finalContent?: string) => blockManagerInstance.completeBlock(blockId, finalContent),
  cleanup: () => blockManagerInstance.cleanup(),
  getActiveBlockCount: () => blockManagerInstance.getActiveBlockCount()
};

export default blockManagerInstance;