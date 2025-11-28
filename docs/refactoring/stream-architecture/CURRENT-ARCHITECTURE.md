# 当前流式输出架构分析

> 详细记录当前项目的流式/非流式输出链路

## 📊 整体架构图

```
用户发送消息
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  入口层                                                          │
│  MessageService.sendMessage()                                    │
│  src/shared/services/messages/messageService.ts                  │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Thunk 层                                                        │
│  sendMessage() → processAssistantResponse()                      │
│  src/shared/store/thunks/message/sendMessage.ts                  │
│  src/shared/store/thunks/message/assistantResponse.ts            │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Provider 层                                                 │
│  ApiProviderRegistry.get(model).sendChatMessage()               │
│  src/shared/services/messages/ApiProvider.ts                    │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  OpenAI Provider 层                                              │
│  OpenAIProvider.sendChatMessage()                               │
│  src/shared/api/openai/provider.ts                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ getStreamOutputSetting() 决定流式/非流式                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
      │
      ├──────── streamEnabled = true ────────┐
      │                                      │
      ▼                                      ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│    流式输出链路           │      │    非流式输出链路         │
└──────────────────────────┘      └──────────────────────────┘
```

---

## 🌊 流式输出详细链路

### 调用栈

```
OpenAIProvider.sendChatMessage()
  │
  ├── 有 onUpdate: handleStreamResponse()         [provider.ts:542-639]
  │         │
  │         ▼
  │   unifiedStreamCompletion()                   [unifiedStreamProcessor.ts:316-377]
  │         │
  │         ▼
  │   UnifiedStreamProcessor.processStream()      [unifiedStreamProcessor.ts:98-117]
  │         │
  │         ▼
  │   processAdvancedStream()                     [unifiedStreamProcessor.ts:122-154]
  │         │
  │         ├── extractReasoningMiddleware()      [提取推理标签]
  │         │
  │         ▼
  │   handleAdvancedChunk()                       [unifiedStreamProcessor.ts:161-263]
  │         │
  │         ├── type: 'text-delta'    → onChunk(TEXT_DELTA) / onUpdate()
  │         ├── type: 'reasoning'     → onChunk(THINKING_DELTA) / onUpdate()
  │         └── type: 'finish'        → 发送完成事件
  │
  └── 无 onUpdate: handleStreamResponseWithoutCallback() [provider.ts:651-747]
            │
            └── (与上面几乎相同的逻辑)
```

### 关键文件

| 文件 | 职责 | 行号 |
|------|------|------|
| `provider.ts` | 流式入口判断、工具调用循环 | 476-482 |
| `provider.ts` | `handleStreamResponse` | 542-639 |
| `provider.ts` | `handleStreamResponseWithoutCallback` | 651-747 |
| `unifiedStreamProcessor.ts` | 统一流处理器 | 65-311 |
| `streamUtils.ts` | Chunk 转换工具 | 97-159 |

### 数据流转换

```
OpenAI API Stream
      │
      ▼ (AsyncIterable<OpenAI.ChatCompletionChunk>)
      
openAIChunkToTextDelta()              [streamUtils.ts:97-159]
      │
      ├── chunk.choices[0].delta.content → { type: 'text-delta', textDelta }
      └── chunk.choices[0].delta.reasoning_content → { type: 'reasoning', textDelta }
      │
      ▼ (AsyncGenerator<OpenAIStreamChunk>)
      
extractReasoningMiddleware()          [提取思考标签 <think>...</think>]
      │
      ▼ (ReadableStream)
      
UnifiedStreamProcessor.handleAdvancedChunk()
      │
      ├─ text-delta  ──→  onChunk({ type: TEXT_DELTA, text })
      │                   或 onUpdate(content, '')
      │
      ├─ reasoning   ──→  onChunk({ type: THINKING_DELTA, text })
      │                   或 onUpdate('', reasoning)
      │
      └─ finish      ──→  EventEmitter.emit(STREAM_COMPLETE)
```

---

## 📦 非流式输出详细链路

### 调用栈

```
OpenAIProvider.sendChatMessage()
      │
      ▼
handleNonStreamResponse()                     [provider.ts:759-905]
      │
      ▼
client.chat.completions.create({ stream: false })
      │
      ▼
直接返回完整响应
      │
      ├── 提取 content = choice.message.content
      ├── 提取 reasoning = choice.message.reasoning_content
      │
      ▼
onChunk() 或 onUpdate() 回调
      │
      ├── 有思考内容: onChunk({ type: THINKING_COMPLETE, text })
      └── 有文本内容: onChunk({ type: TEXT_COMPLETE, text })
```

### 关键代码

```typescript
// provider.ts:759-905
private async handleNonStreamResponse(...) {
  // 1. 调用 API
  const response = await this.client.chat.completions.create({
    ...currentRequestParams,
    stream: false
  });

  // 2. 提取内容
  const content = choice.message?.content || '';
  const reasoning = choice.message?.reasoning_content;

  // 3. 发送回调
  if (onChunk) {
    if (finalReasoning) {
      onChunk({ type: ChunkType.THINKING_COMPLETE, text: finalReasoning });
    }
    if (finalContent) {
      onChunk({ type: ChunkType.TEXT_COMPLETE, text: finalContent });
    }
  } else if (onUpdate) {
    // 兼容旧回调
    if (finalReasoning) onUpdate('', finalReasoning);
    if (finalContent) onUpdate(finalContent);
  }
}
```

---

## 🔄 响应处理层

### ResponseHandler 架构

```
provider 回调
      │
      ├─ onChunk()  ──────────┐
      │                       ▼
      └─ onUpdate() ──→ ResponseHandler.handleChunk() / handleStringContent()
                              │
                              ▼
                    ResponseChunkProcessor.handleChunk()
                    [responseHandlers/ResponseChunkProcessor.ts:180-207]
                              │
                              ├─ TEXT_DELTA      → TextAccumulator.accumulate()
                              ├─ TEXT_COMPLETE   → TextAccumulator.accumulate()
                              ├─ THINKING_DELTA  → ThinkingAccumulator.accumulate()
                              └─ THINKING_COMPLETE → ThinkingAccumulator.accumulate()
                              │
                              ▼
                    ThrottledBlockUpdater
                    [responseHandlers/ResponseChunkProcessor.ts:65-104]
                              │
                              ├─ Redux State 更新 (节流)
                              └─ IndexedDB 存储 (节流)
```

### handleStringContent 流程

```typescript
// ResponseHandler.ts:121-178
async handleStringContent(content: string, reasoning?: string) {
  // 1. 检查消息是否已完成
  if (message?.status === SUCCESS) return;

  // 2. 检查对比结果
  if (comparisonHandler.isComparisonResult(content, reasoning)) {
    comparisonHandler.handleComparisonResult(reasoning);
    return;
  }

  // 3. 处理推理内容
  if (reasoning?.trim()) {
    await this.handleChunk({ type: THINKING_DELTA, text: reasoning });
  } else {
    // 4. 尝试 JSON 解析 (冗余)
    try {
      const parsed = JSON.parse(content);
      if (parsed?.reasoning) { ... }
    } catch { }

    // 5. 处理文本内容
    await this.handleChunk({ type: TEXT_DELTA, text: content });
  }
}
```

---

## ⚠️ 当前问题

### 1. 双回调并存

```typescript
// assistantResponse.ts:369-388
response = await apiProvider.sendChatMessage(messagesToSend, {
  onUpdate: (content, reasoning) => {
    responseHandler.handleStringContent(content, reasoning);  // 旧回调
  },
  onChunk: (chunk) => {
    responseHandler.handleChunk(chunk);  // 新回调
  },
});
```

**问题**: 两个回调可能同时触发，导致重复处理

### 2. 方法重复

```typescript
// provider.ts
handleStreamResponse()              // 行 542-639, ~100行
handleStreamResponseWithoutCallback()  // 行 651-747, ~100行

// 90% 相同的代码
```

### 3. 未使用的代码

```typescript
// provider.ts:9
// import { createResponseHandler } from './responseHandler'; // 暂时注释，将来使用

// responseHandler.ts 整个文件 320 行未使用
```

### 4. JSON 解析冗余

```typescript
// ResponseHandler.ts:147-163
try {
  const parsed = JSON.parse(content);
  if (parsed?.reasoning) { ... }  // 几乎不会触发
} catch {
  // 忽略
}
```

---

## 📋 Chunk 类型定义

```typescript
// src/shared/types/chunk.ts
export enum ChunkType {
  TEXT_DELTA = 'text.delta',
  TEXT_COMPLETE = 'text.complete',
  THINKING_DELTA = 'thinking.delta',
  THINKING_COMPLETE = 'thinking.complete',
  MCP_TOOL_IN_PROGRESS = 'mcp_tool.in_progress',
  MCP_TOOL_COMPLETE = 'mcp_tool.complete',
  // ...
}

export interface Chunk {
  type: ChunkType;
  text?: string;
  thinking_millsec?: number;
  messageId?: string;
  blockId?: string;
  topicId?: string;
  // ...
}
```

---

## 🔧 设置开关

```typescript
// provider.ts:408
const streamEnabled = getStreamOutputSetting();

// 用户设置控制
// localStorage: 'stream-output-enabled' 
```
