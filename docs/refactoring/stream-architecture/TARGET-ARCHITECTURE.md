# 目标流式输出架构

> 基于参考项目 参考项目 设计的简化架构

## 🎯 设计目标

1. **单一回调机制** - 只使用 `onChunk`
2. **统一处理方法** - 合并重复的流式处理方法
3. **清晰的数据流** - 减少处理层次
4. **最小化代码** - 删除未使用的代码

---

## 🏗️ 目标架构图

```
用户发送消息
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  入口层 (不变)                                                   │
│  MessageService.sendMessage()                                    │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Thunk 层 (简化)                                                 │
│  sendMessage() → processAssistantResponse()                      │
│                                                                  │
│  关键改动:                                                       │
│  - 只传递 onChunk 回调                                           │
│  - 移除 onUpdate 回调                                            │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  OpenAI Provider 层 (简化)                                       │
│  OpenAIProvider.sendChatMessage()                               │
│                                                                  │
│  关键改动:                                                       │
│  - 合并 handleStreamResponse 方法                                │
│  - 统一使用 onChunk                                              │
└─────────────────────────────────────────────────────────────────┘
      │
      ├──────── streamEnabled = true ────────┐
      │                                      │
      ▼                                      ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│    流式输出               │      │    非流式输出             │
│    handleStreamResponse() │      │    handleNonStreamResponse()│
│         ↓                │      │         ↓                │
│  UnifiedStreamProcessor  │      │  直接提取 content        │
│         ↓                │      │         ↓                │
│    onChunk(chunk)        │      │    onChunk(chunk)        │
└──────────────────────────┘      └──────────────────────────┘
      │                                      │
      └──────────────┬───────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ResponseHandler 层 (简化)                                       │
│  responseHandler.handleChunk(chunk)                             │
│                                                                  │
│  关键改动:                                                       │
│  - 移除 handleStringContent 的 JSON 解析                         │
│  - 只处理 Chunk 类型                                             │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  ResponseChunkProcessor (不变)                                   │
│  处理 Chunk → 更新 Redux/IndexedDB                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 关键接口定义

### Provider 层接口

```typescript
// provider.ts - 简化后的 sendChatMessage
public async sendChatMessage(
  messages: Message[],
  options?: {
    onChunk?: (chunk: Chunk) => void;  // 唯一回调
    enableWebSearch?: boolean;
    systemPrompt?: string;
    enableTools?: boolean;
    mcpTools?: MCPTool[];
    mcpMode?: 'prompt' | 'function';
    abortSignal?: AbortSignal;
    assistant?: any;
  }
): Promise<string | StreamProcessingResult>;
```

### 统一的流式处理方法

```typescript
// provider.ts - 合并后的方法
private async handleStreamResponse(
  params: any,
  options: {
    onChunk?: (chunk: Chunk) => void;
    enableTools?: boolean;
    mcpTools?: MCPTool[];
    abortSignal?: AbortSignal;
  }
): Promise<string | StreamProcessingResult> {
  let currentMessages = [...params.messages];
  let iteration = 0;

  while (true) {
    iteration++;
    
    const result = await unifiedStreamCompletion(
      this.client,
      this.model.id,
      currentMessages,
      params.temperature,
      params.max_tokens,
      options.onChunk,  // 直接传递 onChunk
      { ...params, enableTools: options.enableTools, mcpTools: options.mcpTools }
    );

    // 处理工具调用
    if (result.hasToolCalls) {
      const toolResults = await this.processToolUses(result.content, options.mcpTools);
      if (toolResults.length > 0) {
        currentMessages.push({ role: 'assistant', content: result.content });
        currentMessages.push(...toolResults);
        continue;
      }
    }

    return result;
  }
}
```

### UnifiedStreamProcessor 简化

```typescript
// unifiedStreamProcessor.ts - 只使用 onChunk
private async handleAdvancedChunk(chunk: any): Promise<void> {
  if (chunk.type === 'text-delta') {
    this.state.content += chunk.textDelta;
    
    // 只使用 onChunk
    if (this.options.onChunk) {
      this.options.onChunk({
        type: ChunkType.TEXT_DELTA,
        text: chunk.textDelta,
        messageId: this.options.messageId,
        blockId: this.options.blockId
      });
    }
  } else if (chunk.type === 'reasoning') {
    this.state.reasoning += chunk.textDelta;
    
    if (this.options.onChunk) {
      this.options.onChunk({
        type: ChunkType.THINKING_DELTA,
        text: chunk.textDelta,
        blockId: this.options.thinkingBlockId
      });
    }
  }
  // ... finish 处理
}
```

### ResponseHandler 简化

```typescript
// ResponseHandler.ts - 简化后的接口
const responseHandlerInstance = {
  // 主要方法 - 只处理 Chunk
  async handleChunk(chunk: Chunk): Promise<void> {
    switch (chunk.type) {
      case ChunkType.THINKING_DELTA:
      case ChunkType.THINKING_COMPLETE:
      case ChunkType.TEXT_DELTA:
      case ChunkType.TEXT_COMPLETE:
        await chunkProcessor.handleChunk(chunk);
        break;
      // ...
    }
  },

  // 兼容方法 - 简化版本
  async handleStringContent(content: string, reasoning?: string): Promise<string> {
    if (reasoning?.trim()) {
      await this.handleChunk({
        type: ChunkType.THINKING_DELTA,
        text: reasoning
      });
    }
    if (content?.trim()) {
      await this.handleChunk({
        type: ChunkType.TEXT_DELTA,
        text: content
      });
    }
    return chunkProcessor.content;
  },
  
  // ...
};
```

---

## 📁 文件结构变更

### 删除

```
src/shared/api/openai/
├── responseHandler.ts  ← 删除 (320行)
```

### 修改

```
src/shared/api/openai/
├── provider.ts         ← 合并流式方法，移除 onUpdate
├── index.ts            ← 移除 responseHandler 导出
└── unifiedStreamProcessor.ts  ← 简化，只用 onChunk

src/shared/store/thunks/message/
└── assistantResponse.ts  ← 只传递 onChunk

src/shared/services/messages/
└── ResponseHandler.ts  ← 简化 handleStringContent
```

---

## 🔄 数据流对比

### 当前 (复杂)

```
API Response
    │
    ▼
streamUtils.openAIChunkToTextDelta()
    │
    ▼
extractReasoningMiddleware()
    │
    ▼
UnifiedStreamProcessor
    │
    ├── onChunk() ──────────────────┐
    │                               ▼
    └── onUpdate() ──→ ResponseHandler.handleStringContent()
                              │
                              ▼ (转换为 Chunk)
                       ResponseHandler.handleChunk()
                              │
                              ▼
                       ResponseChunkProcessor
```

### 目标 (简洁)

```
API Response
    │
    ▼
streamUtils.openAIChunkToTextDelta()
    │
    ▼
extractReasoningMiddleware()
    │
    ▼
UnifiedStreamProcessor
    │
    ▼
onChunk() ──→ ResponseHandler.handleChunk()
                    │
                    ▼
              ResponseChunkProcessor
```

---

## ✅ 验证标准

### 功能验证

- [ ] 流式输出 - 文本逐字显示
- [ ] 非流式输出 - 文本一次性显示
- [ ] 思考过程 - 思考块正确渲染
- [ ] 思考时间 - 时间正确计算
- [ ] 工具调用 - 多轮工具调用正常
- [ ] 请求中断 - 用户取消正确处理

### 性能验证

- [ ] 无重复渲染
- [ ] 节流正常工作
- [ ] 内存无泄漏

### 代码质量

- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] 构建成功
