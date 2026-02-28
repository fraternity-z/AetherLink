/**
 * 知识库相关数据类型定义
 */

// 文档处理状态
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 分块策略
export type ChunkStrategy = 'fixed' | 'paragraph' | 'markdown' | 'code';

// 知识库模型
export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  model: string;
  dimensions: number;
  documentCount?: number; // 文档数量限制
  chunkSize?: number;
  chunkOverlap?: number;
  chunkStrategy?: ChunkStrategy; // 分块策略
  threshold?: number;
  created_at: string;
  updated_at: string;
}

// 知识库文档项（用于UI展示和状态追踪）
export interface KnowledgeDocumentItem {
  id: string;
  knowledgeBaseId: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  processingStatus: ProcessingStatus;
  processingProgress?: number; // 0-100
  processingError?: string;
  retryCount?: number;
  chunkCount?: number; // 分块数量
  created_at: number;
  updated_at: number;
}

// 知识库文档（向量化后的块）
export interface KnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  documentItemId?: string; // 关联到文档项
  content: string;
  vector: number[];
  metadata: {
    source: string;
    fileName?: string;
    chunkIndex: number;
    timestamp: number;
    fileId?: string; // 关联到files表
    enabled?: boolean; // 是否启用（参与搜索），默认 true
  };
}

// 知识库搜索结果
export interface KnowledgeSearchResult {
  documentId: string;
  content: string;
  similarity: number;
  metadata: KnowledgeDocument['metadata'];
}

// 向量搜索选项
export interface VectorSearchOptions {
  threshold?: number;
  limit?: number;
  includeVector?: boolean;
  includeMetadata?: boolean;
  filter?: (doc: KnowledgeDocument) => boolean;
}

// ============ 任务队列相关类型 ============

// 任务类型
export type TaskType = 'file' | 'url' | 'note' | 'refresh';

// 任务状态机: pending → processing → done | failed | cancelled
export type TaskState = 'pending' | 'processing' | 'done' | 'failed' | 'cancelled';

// 任务处理阶段
export type TaskStage = 'reading' | 'parsing' | 'chunking' | 'embedding' | 'saving';

// 任务项
export interface TaskItem {
  id: string;
  type: TaskType;
  state: TaskState;

  // 任务上下文
  knowledgeBaseId: string;
  fileName: string;
  content: string;
  arrayBuffer?: ArrayBuffer;
  fileSize: number;

  // 进度跟踪
  progress: number;          // 0-100
  stage?: TaskStage;
  error?: string;

  // 重试
  retryCount: number;
  maxRetries: number;

  // 时间戳
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// 队列配置
export interface QueueConfig {
  maxConcurrent: number;     // 最大并发数
  maxWorkload: number;       // 最大工作负载 (bytes)
  maxRetries: number;        // 最大重试次数
  retryDelay: number;        // 重试延迟 (ms)
}

// 队列状态快照
export interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalWorkload: number;
  maxWorkload: number;
  isAtCapacity: boolean;
}