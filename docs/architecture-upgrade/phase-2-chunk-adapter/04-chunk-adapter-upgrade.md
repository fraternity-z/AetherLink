# 统一 Chunk 适配器升级方案

> **优先级：🔥 高 | 风险：✅ 低 | 时间：3-4 周 | 前置：BlockManager**

## 🎯 目标

- 新增 Provider 从 2 天降至 30 分钟
- 代码重复减少 70%
- Chunk 格式完全统一

## 📋 当前问题

**每个 Provider 独立实现：**
```
OpenAI:    openAIChunkToTextDelta()      - 300 行
Anthropic: anthropicStreamProcessor()    - 250 行
Gemini:    geminiChunkHandler()          - 280 行
XAI:       xaiStreamHandler()            - 200 行
```

**问题：**
- 相似逻辑重复 60%+
- Chunk 格式不统一
- 新增 Provider 需重写全套

## 🏗️ 设计方案

### 统一架构

```
Provider 原始流
    ↓
Provider Adapter（转换层）
    ↓
Unified Chunk（统一格式）
    ↓
StreamProcessor（处理层）
    ↓
BlockManager（块管理）
```

### 核心组件

#### 1. 统一 Chunk 类型

```typescript
// src/shared/types/UnifiedChunk.ts
export enum ChunkType {
  // 响应生命周期
  LLM_RESPONSE_CREATED = 'llm-response-created',
  
  // 文本流
  TEXT_START = 'text-start',
  TEXT_DELTA = 'text-delta',
  TEXT_COMPLETE = 'text-complete',
  
  // 思考过程
  THINKING_START = 'thinking-start',
  THINKING_DELTA = 'thinking-delta',
  THINKING_COMPLETE = 'thinking-complete',
  
  // 工具调用
  TOOL_CALL_PENDING = 'tool-call-pending',
  TOOL_CALL_COMPLETE = 'tool-call-complete',
  
  // 完成与错误
  COMPLETE = 'complete',
  ERROR = 'error'
}

export interface UnifiedChunk {
  type: ChunkType
  text?: string
  metadata?: Record<string, any>
}
```

#### 2. 基类适配器

```typescript
// src/shared/stream/BaseChunkAdapter.ts
export abstract class BaseChunkAdapter {
  abstract transformChunk(rawChunk: any): UnifiedChunk
  
  // 公共工具方法
  protected parseSSE(data: string): any
  protected parseJSON(data: string): any
  protected handleError(error: Error): UnifiedChunk
  protected accumulateText(chunks: string[]): string
}
```

#### 3. Provider 适配器

```typescript
// src/shared/stream/adapters/OpenAIAdapter.ts
export class OpenAIAdapter extends BaseChunkAdapter {
  transformChunk(rawChunk: any): UnifiedChunk {
    const delta = rawChunk.choices[0]?.delta
    
    if (delta?.content) {
      return {
        type: ChunkType.TEXT_DELTA,
        text: delta.content
      }
    }
    
    if (rawChunk.choices[0]?.finish_reason === 'stop') {
      return { type: ChunkType.COMPLETE }
    }
    
    return { type: ChunkType.TEXT_DELTA, text: '' }
  }
}
```

#### 4. 适配器工厂

```typescript
// src/shared/stream/AdapterFactory.ts
export class AdapterFactory {
  private static adapters = new Map<string, BaseChunkAdapter>()
  
  static createAdapter(providerType: string): BaseChunkAdapter {
    if (!this.adapters.has(providerType)) {
      const adapter = this.instantiateAdapter(providerType)
      this.adapters.set(providerType, adapter)
    }
    return this.adapters.get(providerType)!
  }
  
  private static instantiateAdapter(type: string) {
    switch (type) {
      case 'openai': return new OpenAIAdapter()
      case 'anthropic': return new AnthropicAdapter()
      case 'gemini': return new GeminiAdapter()
      default: throw new Error(`Unknown provider: ${type}`)
    }
  }
}
```

## 📅 实施计划（4周）

### Week 1: 框架搭建

**Day 1-2: 类型定义**
- [ ] 定义 UnifiedChunk 类型
- [ ] 定义适配器接口
- [ ] 编写类型测试

**Day 3-4: 基类实现**
- [ ] 创建 BaseChunkAdapter
- [ ] 实现公共工具方法
- [ ] 编写单元测试

**Day 5: 工厂模式**
- [ ] 创建 AdapterFactory
- [ ] 实现缓存机制
- [ ] 集成测试

### Week 2-3: Provider 迁移

**优先级顺序：**
1. **OpenAI**（最常用）
   - Day 1: 创建 OpenAIAdapter
   - Day 2: 迁移 + 测试
   - Day 3: 验证 + 优化

2. **Anthropic**
   - Day 1: 创建 AnthropicAdapter
   - Day 2: 迁移 + 测试

3. **Gemini**
   - Day 1: 创建 GeminiAdapter
   - Day 2: 迁移 + 测试

4. **其他 Provider**
   - Day 1-2: 批量迁移

### Week 4: 验证与优化

**Day 1-2: 集成测试**
- [ ] 所有 Provider 端到端测试
- [ ] 特殊场景覆盖
- [ ] 性能测试

**Day 3-4: 优化**
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 文档编写

**Day 5: 清理**
- [ ] 删除旧代码
- [ ] 代码审查
- [ ] 发布准备

## 🧪 迁移策略

### 双轨运行

```typescript
// 保留 feature flag
const USE_UNIFIED_ADAPTER = getFeatureFlag('unifiedAdapter')

if (USE_UNIFIED_ADAPTER) {
  // 新：统一适配器
  const adapter = AdapterFactory.createAdapter('openai')
  for await (const chunk of stream) {
    const unified = adapter.transformChunk(chunk)
    processUnifiedChunk(unified)
  }
} else {
  // 旧：原有逻辑
  for await (const chunk of openAIChunkToTextDelta(stream)) {
    processChunk(chunk)
  }
}
```

### 灰度发布

```
Week 2: OpenAI 10% 用户
Week 3: OpenAI 50% 用户，Anthropic 10%
Week 4: 全量发布
```

## ✅ 验收标准

### 功能验证
- [ ] 所有 Provider 输出格式一致
- [ ] 特殊场景正常处理（工具调用、思考过程）
- [ ] 错误处理完善

### 性能验证
- [ ] 响应时间无增加
- [ ] 内存占用无增加
- [ ] CPU 使用无增加

### 代码质量
- [ ] 单元测试覆盖率 > 90%
- [ ] 集成测试通过
- [ ] 代码审查通过

## 🎁 预期收益

| 指标 | 改造前 | 改造后 | 提升 |
|------|--------|--------|------|
| 新增 Provider 时间 | 2 天 | 30 分钟 | **96%↓** |
| 代码重复率 | 60% | 10% | **83%↓** |
| 维护成本 | 高 | 低 | **70%↓** |

## 🔗 相关文档

- [BlockManager 方案](./03-blockmanager-upgrade.md)
- [插件系统方案](./05-plugin-system-upgrade.md)
- [实施路线图](./06-implementation-roadmap.md)
