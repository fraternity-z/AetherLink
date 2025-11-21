# Cherry Studio 对比分析

## 🏗️ 架构对比

### AetherLink 架构（当前）

```
用户请求
  ↓
OpenAIProvider.sendChatMessage (500 行)
  ├─ 代理处理
  ├─ 工具调用
  ├─ 多 Key 轮换
  ├─ 流式处理
  └─ 错误重试
  ↓
unifiedStreamCompletion
  ↓
UnifiedStreamProcessor
  ↓
ResponseHandler
```

**特点：**
- ❌ 功能耦合
- ❌ 单文件过大
- ❌ 扩展困难

### Cherry Studio 架构

```
用户请求
  ↓
messageThunk.sendUserMessage
  ↓
transformMessagesAndFetch
  ↓
fetchChatCompletion
  ↓
ModernAiProvider.completions
  ↓
buildPlugins() → [Plugin1, Plugin2, ...]
  ↓
RuntimeExecutor.streamText
  ├─ Plugin Engine (调度)
  ├─ AI SDK Provider
  └─ AiSdkToChunkAdapter
  ↓
StreamProcessor → BlockManager
```

**特点：**
- ✅ 插件化
- ✅ 模块清晰
- ✅ 易于扩展

## 🔌 插件系统对比

### Cherry Studio 插件系统

#### 核心组件

1. **PluginManager**
   ```typescript
   class PluginManager {
     use(plugin: AiPlugin): this
     remove(pluginName: string): this
     executeFirst(): Promise<T | null>
     executeSequential(): Promise<T>
     executeParallel(): Promise<void>
   }
   ```

2. **插件接口**
   ```typescript
   interface AiPlugin {
     name: string
     enforce?: 'pre' | 'post'
     
     // First Hook
     resolveModel?()
     loadTemplate?()
     
     // Sequential Hook
     transformParams?()
     transformResult?()
     
     // Parallel Hook
     onRequestStart?()
     onRequestEnd?()
     onError?()
     
     // Stream Hook
     transformStream?()
   }
   ```

3. **内置插件**
   - `webSearchPlugin` - 网页搜索
   - `googleToolsPlugin` - Google 工具
   - `promptToolUsePlugin` - 提示词工具调用
   - `loggingPlugin` - 日志记录

#### 执行流程

```
请求前：
  pre plugins → normal plugins → post plugins

参数转换：
  Plugin A.transformParams(params)
    ↓
  Plugin B.transformParams(params)
    ↓
  Plugin C.transformParams(params)

请求中：
  所有 plugins.transformStream() 并行

请求后：
  所有 plugins.onRequestEnd() 并行
```

### AetherLink 当前方案

**无插件系统，功能硬编码：**

```typescript
async sendChatMessage() {
  // 硬编码代理逻辑
  if (needsProxy) {
    url = getProxyUrl(url)
  }
  
  // 硬编码工具调用
  if (usePromptMode) {
    delete params.tools
  }
  
  // 硬编码多 Key
  if (multiKeyEnabled) {
    apiKey = selectApiKey()
  }
  
  // ... 500 行混在一起
}
```

## 🔄 Chunk 处理对比

### Cherry Studio 方案

#### 统一 Chunk 类型

```typescript
enum ChunkType {
  LLM_RESPONSE_CREATED = 'llm-response-created',
  TEXT_START = 'text-start',
  TEXT_DELTA = 'text-delta',
  TEXT_COMPLETE = 'text-complete',
  THINKING_START = 'thinking-start',
  THINKING_DELTA = 'thinking-delta',
  THINKING_COMPLETE = 'thinking-complete',
  MCP_TOOL_PENDING = 'mcp-tool-pending',
  MCP_TOOL_COMPLETE = 'mcp-tool-complete',
  // ... 10+ 种类型
}
```

#### AiSdkToChunkAdapter

```typescript
class AiSdkToChunkAdapter {
  async processStream(aiSdkResult: any): Promise<string> {
    // 将 AI SDK 的流转换为 Cherry Chunk
    for await (const part of fullStream) {
      this.convertAndEmitChunk(part)
    }
  }
  
  private convertAndEmitChunk(chunk: TextStreamPart) {
    switch (chunk.type) {
      case 'text-delta':
        this.onChunk({ type: ChunkType.TEXT_DELTA, text })
        break
      case 'tool-call':
        this.onChunk({ type: ChunkType.MCP_TOOL_PENDING, ... })
        break
    }
  }
}
```

### AetherLink 当前方案

**每个 Provider 独立处理：**

```typescript
// OpenAI
async function* openAIChunkToTextDelta(response) {
  // SSE 解析逻辑
}

// Anthropic
async function* anthropicStreamProcessor(response) {
  // Event-stream 解析逻辑
}

// Gemini
async function* geminiChunkHandler(response) {
  // JSON stream 解析逻辑
}

// 问题：重复逻辑 60%+
```

## 🧱 BlockManager 对比

### Cherry Studio BlockManager

#### 核心设计

```typescript
class BlockManager {
  private activeBlockInfo: ActiveBlockInfo | null
  private lastBlockType: MessageBlockType | null
  
  smartBlockUpdate(
    blockId: string,
    changes: Partial<MessageBlock>,
    blockType: MessageBlockType,
    isComplete: boolean
  ) {
    const needsImmediate = 
      this.isBlockTypeChanged(blockType) || isComplete
    
    if (needsImmediate) {
      this.immediateUpdate(blockId, changes)
      this.saveToDatabase(blockId)
    } else {
      this.throttledUpdate(blockId, changes)
    }
  }
}
```

#### 智能策略

```
块类型改变？ → 立即更新
块完成？     → 立即更新 + 保存 DB
正常累积？   → 节流更新 (150ms)
```

### AetherLink 当前方案

**逻辑分散：**

```
Redux Thunk: 创建块 (150 行)
ResponseHandler: 更新块 (200 行)
messageThunk: 节流逻辑 (100 行)
Component: 渲染 (500 行)

总计：950 行，13 个文件
```

## 📊 技术栈对比

| 技术 | Cherry Studio | AetherLink |
|------|---------------|------------|
| **AI SDK** | Vercel AI SDK | 自研 |
| **插件系统** | ✅ 完整 | ❌ 无 |
| **Chunk 统一** | ✅ AiSdkToChunkAdapter | ❌ 各自实现 |
| **BlockManager** | ✅ 独立类 | ❌ 逻辑分散 |
| **状态管理** | Redux Toolkit | Redux Toolkit |
| **数据库** | Dexie | Dexie |
| **测试覆盖** | 70%+ | 30% |

## 💡 关键差异总结

### Cherry Studio 的优势

1. **插件化架构**
   - 功能解耦
   - 易于扩展
   - 独立测试

2. **统一抽象**
   - 统一 Chunk 格式
   - 统一块管理
   - 降低复杂度

3. **成熟度高**
   - AI SDK 集成
   - 完善的文档
   - 活跃的社区

### AetherLink 的优势

1. **轻量级**
   - 无第三方 AI SDK 依赖
   - 代码体积小
   - 启动快

2. **灵活性**
   - 完全控制流程
   - 自定义能力强
   - 适配国内环境

3. **创新功能**
   - 提示词模式工具调用
   - 移动端优先
   - HarmonyOS 支持

## 🎯 学习要点

### 应该学习的

1. ✅ **插件系统架构** - 解耦功能，提升扩展性
2. ✅ **统一 Chunk 适配器** - 降低新增 Provider 成本
3. ✅ **BlockManager 设计** - 集中管理，智能优化

### 可以保留的

1. ✅ **自研 Provider** - 保持灵活性
2. ✅ **提示词模式** - 创新功能
3. ✅ **CORS 代理** - 适配国内网络

## 🔗 相关文档

- [BlockManager 升级方案](./03-blockmanager-upgrade.md)
- [Chunk 适配器升级方案](./04-chunk-adapter-upgrade.md)
- [插件系统升级方案](./05-plugin-system-upgrade.md)
