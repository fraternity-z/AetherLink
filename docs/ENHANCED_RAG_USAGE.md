# 增强RAG搜索使用指南

## 概述

移动端知识库现已升级为增强的RAG（检索增强生成）架构，提供比简单向量搜索更强大和准确的搜索能力。

## 主要改进

### 1. 从简单向量搜索到复杂RAG架构

**之前（简单搜索）：**
- 仅使用余弦相似度计算
- 单一向量检索策略
- 无查询优化
- 无结果重排序

**现在（增强RAG）：**
- 多阶段检索流程
- 查询扩展和重写
- 混合搜索策略
- 智能重排序
- 结果融合和优化

### 2. 五阶段RAG搜索流程

#### 阶段1：查询理解和扩展
```typescript
// 查询分解
"如何解决网络问题" → ["如何解决网络问题", "网络故障", "连接问题"]

// 同义词扩展
"问题" → ["疑问", "困惑", "难题"]

// 相关术语提取
从知识库中提取相关技术术语
```

#### 阶段2：多策略检索
```typescript
// 向量检索
使用嵌入向量进行语义搜索

// 关键词检索
基于TF-IDF的关键词匹配

// 语义检索
基于文档元数据和上下文的匹配
```

#### 阶段3：结果融合
```typescript
// 融合权重
{
  vectorWeight: 0.6,    // 向量搜索权重
  keywordWeight: 0.3,   // 关键词搜索权重
  recencyWeight: 0.05,  // 时间相关性权重
  diversityWeight: 0.05 // 多样性权重
}
```

#### 阶段4：重排序
```typescript
// 计算查询-文档相关性
const relevanceScore = await calculateRelevanceScore(query, content);

// 结合原始相似度和相关性
const combinedScore = (similarity * 0.7) + (relevanceScore * 0.3);
```

#### 阶段5：后处理
```typescript
// 过滤和限制结果
results
  .filter(result => result.similarity >= threshold)
  .slice(0, limit)
  .map(result => ({
    ...result,
    similarity: Math.min(1, Math.max(0, result.similarity))
  }));
```

## 使用方法

### 1. 基本搜索（自动使用增强RAG）

```typescript
import { MobileKnowledgeService } from '../services/knowledge/MobileKnowledgeService';

const knowledgeService = MobileKnowledgeService.getInstance();

// 默认使用增强RAG
const results = await knowledgeService.search({
  knowledgeBaseId: 'your-kb-id',
  query: '如何配置网络设置',
  threshold: 0.7,
  limit: 5
});
```

### 2. 选择搜索模式

```typescript
// 使用增强RAG（推荐）
const enhancedResults = await knowledgeService.search({
  knowledgeBaseId: 'your-kb-id',
  query: '复杂的技术问题',
  useEnhancedRAG: true  // 启用增强RAG
});

// 使用简单搜索（快速但准确性较低）
const simpleResults = await knowledgeService.search({
  knowledgeBaseId: 'your-kb-id',
  query: '简单查询',
  useEnhancedRAG: false  // 使用简单搜索
});
```

### 3. 直接使用增强RAG服务

```typescript
import { EnhancedRAGService } from '../services/knowledge/EnhancedRAGService';

const ragService = EnhancedRAGService.getInstance();

const results = await ragService.enhancedSearch({
  knowledgeBaseId: 'your-kb-id',
  query: '详细的技术查询',
  config: {
    enableQueryExpansion: true,   // 启用查询扩展
    enableHybridSearch: true,     // 启用混合搜索
    enableRerank: true,           // 启用重排序
    enableContextAware: true,     // 启用上下文感知
    maxCandidates: 50,           // 最大候选结果数
    diversityThreshold: 0.8      // 多样性阈值
  }
});
```

## 配置选项

### RAG配置参数

```typescript
interface RAGSearchConfig {
  enableQueryExpansion: boolean;   // 查询扩展
  enableHybridSearch: boolean;     // 混合搜索
  enableRerank: boolean;           // 重排序
  enableContextAware: boolean;     // 上下文感知
  maxCandidates: number;          // 最大候选数
  diversityThreshold: number;     // 多样性阈值
}
```

### 默认配置

```typescript
const DEFAULT_RAG_CONFIG = {
  enableQueryExpansion: true,
  enableHybridSearch: true,
  enableRerank: true,
  enableContextAware: true,
  maxCandidates: 50,
  diversityThreshold: 0.8
};
```

## 性能对比

### 搜索质量
- **简单搜索**：基于单一向量相似度，可能遗漏相关内容
- **增强RAG**：多策略融合，提高召回率和准确性

### 搜索速度
- **简单搜索**：~100-300ms（快速）
- **增强RAG**：~300-800ms（稍慢但更准确）

### 适用场景
- **简单搜索**：适合简单查询、实时搜索建议
- **增强RAG**：适合复杂查询、重要搜索任务

## UI组件集成

### 搜索组件更新

```tsx
import { KnowledgeSearch } from '../components/KnowledgeManagement/KnowledgeSearch';

// 组件现在包含RAG模式切换开关
<KnowledgeSearch 
  knowledgeBaseId="your-kb-id"
  onInsertReference={handleInsertReference}
/>
```

### 性能监控

```tsx
import { RAGPerformanceMonitor } from '../components/KnowledgeManagement/RAGPerformanceMonitor';

<RAGPerformanceMonitor 
  metrics={searchMetrics}
  currentMetrics={currentSearchMetrics}
/>
```

## 最佳实践

### 1. 查询优化
- 使用具体、描述性的查询词
- 避免过于简短或过于复杂的查询
- 利用同义词和相关术语

### 2. 模式选择
- 复杂技术问题：使用增强RAG
- 简单事实查询：可使用简单搜索
- 实时搜索建议：使用简单搜索

### 3. 性能优化
- 监控搜索时间和结果质量
- 根据使用场景调整配置参数
- 定期清理缓存以保持性能

## 故障排除

### 常见问题

1. **搜索速度慢**
   - 检查网络连接（嵌入API调用）
   - 考虑使用简单搜索模式
   - 减少maxCandidates参数

2. **搜索结果不准确**
   - 检查查询词是否合适
   - 调整threshold参数
   - 确保知识库内容质量

3. **向量维度不匹配**
   - 确保使用相同的嵌入模型
   - 重新创建知识库
   - 检查模型配置

### 调试信息

增强RAG服务提供详细的日志信息：

```
[EnhancedRAGService] 开始增强RAG搜索: "查询内容"
[EnhancedRAGService] 查询扩展完成: 5个查询
[EnhancedRAGService] 多策略检索完成: 3个策略
[EnhancedRAGService] 结果融合完成: 25个候选结果
[EnhancedRAGService] 重排序完成
[EnhancedRAGService] RAG搜索完成，耗时: 456ms，结果: 5条
```

## 未来改进

1. **更多检索策略**：图检索、时间序列检索
2. **智能缓存**：基于查询模式的智能缓存
3. **个性化搜索**：基于用户历史的个性化排序
4. **多模态搜索**：支持图像和文档的混合搜索
