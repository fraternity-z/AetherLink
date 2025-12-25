/**
 * 知识库相关数据类型定义
 */

// 文档处理状态
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

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