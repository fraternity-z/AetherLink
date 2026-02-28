/**
 * 知识库服务统一导出
 */

// 核心知识库服务
import { MobileKnowledgeService } from './MobileKnowledgeService';
export { MobileKnowledgeService };

// 增强RAG搜索服务
export { EnhancedRAGService } from './EnhancedRAGService';

// 嵌入向量服务
export { MobileEmbeddingService, getModelDimensions } from './MobileEmbeddingService';

// 知识库上下文服务
export { KnowledgeContextService } from './KnowledgeContextService';
export type { KnowledgeReference } from './KnowledgeContextService';

// 任务队列服务
export { KnowledgeTaskQueue } from './KnowledgeTaskQueue';

// 默认导出主要服务
export default MobileKnowledgeService;
