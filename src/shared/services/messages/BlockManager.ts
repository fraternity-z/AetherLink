import { generateBlockId } from '../../utils';
import store from '../../store';
import { DataRepository } from '../storage/DataRepository';
import { upsertOneBlock } from '../../store/slices/messageBlocksSlice';
// 注意：上述导入用于 defaultDependencies，实际方法使用 this.deps
import { MessageBlockType, MessageBlockStatus } from '../../types/newMessage';
import type { MessageBlock } from '../../types/newMessage';
import { createKnowledgeReferenceBlock } from '../../utils/messageUtils';
import type { KnowledgeDocument } from '../../types/KnowledgeBase';
import type { AppDispatch } from '../../store';

/**
 * BlockManager 依赖接口
 * 用于依赖注入，便于测试和解耦
 */
export interface BlockManagerDependencies {
  /** Redux dispatch 函数 */
  dispatch: AppDispatch;
  /** 存储服务 */
  storage: {
    saveBlock(block: MessageBlock): Promise<void>;
    updateBlock(blockId: string, changes: Partial<MessageBlock>): Promise<void>;
    deleteBlock(blockId: string): Promise<void>;
  };
  /** ID 生成函数 */
  generateId: (prefix: string) => string;
}

/**
 * 默认依赖实现
 * 使用 Redux store 和 DataRepository
 */
const defaultDependencies: BlockManagerDependencies = {
  dispatch: (action: any) => store.dispatch(action),
  storage: {
    saveBlock: (block: MessageBlock) => DataRepository.blocks.save(block),
    updateBlock: (blockId: string, changes: Partial<MessageBlock>) => 
      DataRepository.blocks.update(blockId, changes),
    deleteBlock: (blockId: string) => DataRepository.blocks.delete(blockId),
  },
  generateId: generateBlockId,
};

/**
 * 块管理器类
 * 负责创建和管理消息块
 * 支持依赖注入，便于测试
 */
export class BlockManager {
  private deps: BlockManagerDependencies;

  constructor(dependencies?: Partial<BlockManagerDependencies>) {
    this.deps = { ...defaultDependencies, ...dependencies };
  }
  /**
   * 创建主文本块
   * @param messageId 消息ID
   * @returns 创建的主文本块
   */
  async createMainTextBlock(messageId: string): Promise<MessageBlock> {
    // 生成唯一的块ID - 使用注入的ID生成函数
    const blockId = this.deps.generateId('block');

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
    this.deps.dispatch(upsertOneBlock(block));

    // 保存到数据库
    await this.deps.storage.saveBlock(block);

    return block;
  }

  /**
   * 创建思考过程块
   * @param messageId 消息ID
   * @returns 创建的思考过程块
   */
  async createThinkingBlock(messageId: string): Promise<MessageBlock> {
    // 生成唯一的块ID - 使用注入的ID生成函数
    const blockId = this.deps.generateId('thinking');

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
    this.deps.dispatch(upsertOneBlock(block));

    // 保存到数据库
    await this.deps.storage.saveBlock(block);

    return block;
  }

  /**
   * 创建错误块
   * @param messageId 消息ID
   * @param errorMessage 错误信息
   * @returns 创建的错误块
   */
  async createErrorBlock(messageId: string, errorMessage: string): Promise<MessageBlock> {
    // 生成唯一的块ID - 使用注入的ID生成函数
    const blockId = this.deps.generateId('error');

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
    this.deps.dispatch(upsertOneBlock(block));

    // 保存到数据库
    await this.deps.storage.saveBlock(block);

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
    // 生成唯一的块ID - 使用注入的ID生成函数
    const blockId = this.deps.generateId('code');

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
    this.deps.dispatch(upsertOneBlock(block));

    // 保存到数据库
    await this.deps.storage.saveBlock(block);

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
    // 生成唯一的块ID - 使用注入的ID生成函数
    const blockId = this.deps.generateId('video');

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
    this.deps.dispatch(upsertOneBlock(block));

    // 保存到数据库
    await this.deps.storage.saveBlock(block);

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
    this.deps.dispatch(upsertOneBlock(block));

    // 保存块到数据库
    await this.deps.storage.saveBlock(block);

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

// 单例实例，保持向后兼容
let blockManagerInstance: BlockManager | null = null;

/**
 * 获取 BlockManager 单例实例
 * 向后兼容：允许无缝替换原有的静态对象用法
 */
export function getBlockManager(dependencies?: Partial<BlockManagerDependencies>): BlockManager {
  if (!blockManagerInstance || dependencies) {
    blockManagerInstance = new BlockManager(dependencies);
  }
  return blockManagerInstance;
}

/**
 * 重置 BlockManager 单例（主要用于测试）
 */
export function resetBlockManager(): void {
  blockManagerInstance = null;
}

// 导出默认实例，保持向后兼容
export default getBlockManager();