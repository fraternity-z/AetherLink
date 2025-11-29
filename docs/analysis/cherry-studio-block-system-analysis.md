# Cherry Studio 信息块系统完整分析

> 分析版本：参考项目
> 分析时间：2025年

## 目录

1. [核心架构概览](#1-核心架构概览)
2. [类型定义详解](#2-类型定义详解)
3. [信息块创建流程](#3-信息块创建流程)
4. [多轮工具调用排序机制](#4-多轮工具调用排序机制)
5. [完整链路时序图](#5-完整链路时序图)
6. [关键代码分析](#6-关键代码分析)

---

## 1. 核心架构概览

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        用户界面层 (React Components)                  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↑ 订阅
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                         Redux Store                                   │
│  ┌─────────────────────┐    ┌─────────────────────────┐              │
│  │   newMessage slice  │    │   messageBlock slice    │              │
│  │  (消息实体 + 顺序)   │    │     (块实体)            │              │
│  └─────────────────────┘    └─────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                    ↑ dispatch
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                        BlockManager                                   │
│  - smartBlockUpdate()      智能更新（节流/立即）                      │
│  - handleBlockTransition() 块类型切换处理                             │
│  - activeBlockInfo         当前活跃块信息                             │
└─────────────────────────────────────────────────────────────────────┘
                                    ↑ 调用
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                        Callbacks 层                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │baseCallbacks │ │textCallbacks │ │thinkingCB   │ │toolCallbacks │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│  │imageCallbacks│ │citationCB   │ │videoCallbacks│                  │
│  └──────────────┘ └──────────────┘ └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↑ 回调分发
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                   StreamProcessingService                             │
│              createStreamProcessor(callbacks)                         │
│                 根据 ChunkType 分发到对应回调                          │
└─────────────────────────────────────────────────────────────────────┘
                                    ↑ Chunk 流
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                    API / Stream 层                                    │
│          transformMessagesAndFetch() / AiSdkToChunkAdapter           │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心文件结构

```
src/renderer/src/
├── types/
│   ├── newMessage.ts          # Message 和 MessageBlock 类型定义
│   └── chunk.ts               # 流式数据块类型定义
├── store/
│   ├── newMessage.ts          # 消息 Redux slice
│   ├── messageBlock.ts        # 消息块 Redux slice  
│   └── thunk/messageThunk.ts  # 消息相关 thunk
├── services/
│   ├── messageStreaming/
│   │   ├── BlockManager.ts    # 块管理器核心类
│   │   ├── callbacks/         # 各类型块的回调处理
│   │   │   ├── baseCallbacks.ts
│   │   │   ├── textCallbacks.ts
│   │   │   ├── thinkingCallbacks.ts
│   │   │   ├── toolCallbacks.ts
│   │   │   ├── imageCallbacks.ts
│   │   │   ├── citationCallbacks.ts
│   │   │   ├── videoCallbacks.ts
│   │   │   └── compactCallbacks.ts
│   │   └── index.ts
│   └── StreamProcessingService.ts  # 流处理服务
└── utils/messageUtils/
    └── create.ts              # 消息和块创建工具函数
```

---

## 2. 类型定义详解

### 2.1 消息块类型枚举

```typescript
// 位置: src/renderer/src/types/newMessage.ts

export enum MessageBlockType {
  UNKNOWN = 'unknown',       // 未知类型，用于初始占位符
  MAIN_TEXT = 'main_text',   // 主要文本内容
  THINKING = 'thinking',     // 思考过程（Claude、OpenAI-o系列等）
  TRANSLATION = 'translation', // 翻译内容
  IMAGE = 'image',           // 图片内容
  CODE = 'code',             // 代码块
  TOOL = 'tool',             // 统一工具调用块
  FILE = 'file',             // 文件内容
  ERROR = 'error',           // 错误信息
  CITATION = 'citation',     // 引用（网络搜索、知识库等）
  VIDEO = 'video',           // 视频内容
  COMPACT = 'compact'        // 压缩命令响应
}
```

### 2.2 消息块状态

```typescript
export enum MessageBlockStatus {
  PENDING = 'pending',       // 等待处理
  PROCESSING = 'processing', // 正在处理，等待接收
  STREAMING = 'streaming',   // 正在流式接收
  SUCCESS = 'success',       // 处理成功
  ERROR = 'error',           // 处理错误
  PAUSED = 'paused'          // 处理暂停
}
```

### 2.3 消息块基础结构

```typescript
export interface BaseMessageBlock {
  id: string                    // 块ID
  messageId: string             // 所属消息ID
  type: MessageBlockType        // 块类型
  createdAt: string             // 创建时间
  updatedAt?: string            // 更新时间
  status: MessageBlockStatus    // 块状态
  model?: Model                 // 使用的模型
  metadata?: Record<string, any> // 通用元数据
  error?: SerializedError       // 序列化错误对象
}
```

### 2.4 工具调用块结构

```typescript
export interface ToolMessageBlock extends BaseMessageBlock {
  type: MessageBlockType.TOOL
  toolId: string                // 工具调用 ID
  toolName?: string             // 工具名称
  arguments?: Record<string, any>  // 工具参数
  content?: string | object     // 工具执行结果
  metadata?: BaseMessageBlock['metadata'] & {
    rawMcpToolResponse?: MCPToolResponse | NormalToolResponse
  }
}
```

### 2.5 消息与块的关系

```typescript
export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  // ... 其他属性
  
  // ⭐ 关键：blocks 数组存储块的 ID，顺序即为显示顺序
  blocks: MessageBlock['id'][]
}
```

---

## 3. 信息块创建流程

### 3.1 初始占位符块创建

当 LLM 响应开始时，首先创建一个 UNKNOWN 类型的占位符块：

```typescript
// 位置: callbacks/baseCallbacks.ts

onLLMResponseCreated: async () => {
  // 创建 UNKNOWN 类型的占位符块
  const baseBlock = createBaseMessageBlock(
    assistantMsgId, 
    MessageBlockType.UNKNOWN, 
    { status: MessageBlockStatus.PROCESSING }
  )
  
  // 通过 BlockManager 处理块转换
  await blockManager.handleBlockTransition(
    baseBlock as PlaceholderMessageBlock, 
    MessageBlockType.UNKNOWN
  )
}
```

### 3.2 块类型转换机制

```typescript
// 位置: BlockManager.ts

async handleBlockTransition(newBlock: MessageBlock, newBlockType: MessageBlockType) {
  // 1. 更新内部状态
  this._lastBlockType = newBlockType
  this._activeBlockInfo = { id: newBlock.id, type: newBlockType }

  // 2. 更新消息的 blocks 数组（添加新块引用）
  this.deps.dispatch(
    newMessagesActions.updateMessage({
      topicId: this.deps.topicId,
      messageId: this.deps.assistantMsgId,
      updates: { blockInstruction: { id: newBlock.id } }
    })
  )
  
  // 3. 将新块添加到 messageBlocks store
  this.deps.dispatch(upsertOneBlock(newBlock))
  
  // 4. 更新块引用并同步状态
  this.deps.dispatch(
    newMessagesActions.upsertBlockReference({
      messageId: this.deps.assistantMsgId,
      blockId: newBlock.id,
      status: newBlock.status,
      blockType: newBlock.type
    })
  )

  // 5. 持久化到数据库
  await this.deps.saveUpdatesToDB(...)
}
```

### 3.3 占位符块复用逻辑

当第一个实际内容到来时，会复用占位符块而不是创建新块：

```typescript
// 位置: callbacks/textCallbacks.ts

onTextStart: async () => {
  // 检查是否有初始占位符块
  if (blockManager.hasInitialPlaceholder) {
    // ⭐ 复用占位符块，直接更新其类型
    const changes = {
      type: MessageBlockType.MAIN_TEXT,
      content: '',
      status: MessageBlockStatus.STREAMING
    }
    mainTextBlockId = blockManager.initialPlaceholderBlockId!
    blockManager.smartBlockUpdate(mainTextBlockId, changes, MessageBlockType.MAIN_TEXT, true)
  } else if (!mainTextBlockId) {
    // 创建新的文本块
    const newBlock = createMainTextBlock(assistantMsgId, '', {
      status: MessageBlockStatus.STREAMING
    })
    mainTextBlockId = newBlock.id
    await blockManager.handleBlockTransition(newBlock, MessageBlockType.MAIN_TEXT)
  }
}
```

### 3.4 智能更新策略

BlockManager 实现了智能更新机制，根据块类型是否变化决定使用节流还是立即更新：

```typescript
// 位置: BlockManager.ts

smartBlockUpdate(
  blockId: string,
  changes: Partial<MessageBlock>,
  blockType: MessageBlockType,
  isComplete: boolean = false
) {
  const isBlockTypeChanged = this._lastBlockType !== null && 
                              this._lastBlockType !== blockType
  
  if (isBlockTypeChanged || isComplete) {
    // 块类型改变或完成时：立即更新
    if (isBlockTypeChanged && this._activeBlockInfo) {
      this.deps.cancelThrottledBlockUpdate(this._activeBlockInfo.id)
    }
    if (isComplete) {
      this.deps.cancelThrottledBlockUpdate(blockId)
      this._activeBlockInfo = null
    } else {
      this._activeBlockInfo = { id: blockId, type: blockType }
    }
    
    // 立即 dispatch 更新
    this.deps.dispatch(updateOneBlock({ id: blockId, changes }))
    this.deps.saveUpdatedBlockToDB(...)
    this._lastBlockType = blockType
  } else {
    // 同类型块持续更新：使用节流
    this._activeBlockInfo = { id: blockId, type: blockType }
    this.deps.throttledBlockUpdate(blockId, changes)
  }
}
```

---

## 4. 多轮工具调用排序机制

### 4.1 块顺序存储原理

消息中的块顺序通过 `Message.blocks` 数组维护，数组中的顺序即为显示顺序：

```typescript
// 位置: store/newMessage.ts

// Message.blocks 存储块 ID 的有序列表
interface Message {
  blocks: MessageBlock['id'][]  // 按顺序存储
}

// upsertBlockReference 处理块的插入位置
upsertBlockReference(state, action: PayloadAction<UpsertBlockReferencePayload>) {
  const { messageId, blockId, blockType } = action.payload
  const currentBlocks = messageToUpdate.blocks || []
  
  if (!currentBlocks.includes(blockId)) {
    // ⭐ THINKING 块插入到开头，其他块追加到末尾
    if (blockType === MessageBlockType.THINKING) {
      changes.blocks = [blockId, ...currentBlocks]
    } else {
      changes.blocks = [...currentBlocks, blockId]
    }
  }
}
```

### 4.2 工具调用的块创建流程

```typescript
// 位置: callbacks/toolCallbacks.ts

const createToolCallbacks = (deps) => {
  // 内部维护工具调用 ID 到块 ID 的映射
  const toolCallIdToBlockIdMap = new Map<string, string>()
  let toolBlockId: string | null = null
  let citationBlockId: string | null = null

  return {
    // 工具调用开始（待处理状态）
    onToolCallPending: (toolResponse: MCPToolResponse) => {
      if (blockManager.hasInitialPlaceholder) {
        // 复用占位符块
        const changes = {
          type: MessageBlockType.TOOL,
          status: MessageBlockStatus.PENDING,
          toolName: toolResponse.tool.name,
          metadata: { rawMcpToolResponse: toolResponse }
        }
        toolBlockId = blockManager.initialPlaceholderBlockId!
        blockManager.smartBlockUpdate(toolBlockId, changes, MessageBlockType.TOOL)
        toolCallIdToBlockIdMap.set(toolResponse.id, toolBlockId)
      } else if (toolResponse.status === 'pending') {
        // ⭐ 创建新的工具块（多轮调用时）
        const toolBlock = createToolBlock(assistantMsgId, toolResponse.id, {
          toolName: toolResponse.tool.name,
          status: MessageBlockStatus.PENDING,
          metadata: { rawMcpToolResponse: toolResponse }
        })
        toolBlockId = toolBlock.id
        blockManager.handleBlockTransition(toolBlock, MessageBlockType.TOOL)
        toolCallIdToBlockIdMap.set(toolResponse.id, toolBlock.id)
      }
    },

    // 工具调用完成
    onToolCallComplete: (toolResponse: MCPToolResponse) => {
      const existingBlockId = toolCallIdToBlockIdMap.get(toolResponse.id)
      toolCallIdToBlockIdMap.delete(toolResponse.id)

      if (toolResponse.status === 'done' || 
          toolResponse.status === 'error' || 
          toolResponse.status === 'cancelled') {
        
        const finalStatus = (toolResponse.status === 'done' || 
                            toolResponse.status === 'cancelled')
          ? MessageBlockStatus.SUCCESS
          : MessageBlockStatus.ERROR

        const changes = {
          content: toolResponse.response,
          status: finalStatus,
          metadata: { rawMcpToolResponse: toolResponse }
        }

        // 更新现有块
        blockManager.smartBlockUpdate(
          existingBlockId, 
          changes, 
          MessageBlockType.TOOL, 
          true  // 标记完成
        )
        
        // ⭐ 为网络搜索工具创建引用块
        if (toolResponse.tool.name === 'builtin_web_search' && toolResponse.response) {
          const citationBlock = createCitationBlock(assistantMsgId, {
            response: { results: toolResponse.response, source: WebSearchSource.WEBSEARCH }
          }, { status: MessageBlockStatus.SUCCESS })
          
          citationBlockId = citationBlock.id
          blockManager.handleBlockTransition(citationBlock, MessageBlockType.CITATION)
        }
      }
      
      toolBlockId = null
    }
  }
}
```

### 4.3 多轮对话中块的顺序示例

假设一个复杂的多轮工具调用场景：

```
用户: 请帮我搜索天气并计算温度转换

AI 响应流程：
1. [LLM_RESPONSE_CREATED]     → 创建 UNKNOWN 占位符块
2. [THINKING_START]           → 占位符转换为 THINKING 块
3. [THINKING_DELTA...]        → 更新思考内容
4. [THINKING_COMPLETE]        → 思考完成
5. [MCP_TOOL_PENDING]         → 创建第一个 TOOL 块（搜索天气）
6. [MCP_TOOL_COMPLETE]        → 更新工具块状态为成功
7. [TEXT_START]               → 创建 MAIN_TEXT 块
8. [TEXT_DELTA...]            → 流式更新文本
9. [MCP_TOOL_PENDING]         → 创建第二个 TOOL 块（计算）
10. [MCP_TOOL_COMPLETE]       → 更新工具块状态
11. [TEXT_DELTA...]           → 继续文本更新
12. [TEXT_COMPLETE]           → 文本完成
13. [BLOCK_COMPLETE]          → 整体完成
```

最终 blocks 数组结构：
```javascript
message.blocks = [
  "thinking-block-id",    // THINKING（总是在最前）
  "tool-1-block-id",      // TOOL（天气搜索）
  "main-text-block-id",   // MAIN_TEXT
  "tool-2-block-id",      // TOOL（计算）
  // 如果有引用块，会在对应工具块后面
]
```

---

## 5. 完整链路时序图

### 5.1 单轮对话时序

```
用户发送消息
     │
     ▼
┌────────────────────────────────────────────────────────────────┐
│ sendMessage thunk                                               │
│   1. 保存用户消息和块到数据库                                    │
│   2. dispatch addMessage                                        │
│   3. 创建 assistantMessage                                      │
│   4. 将处理任务加入队列                                          │
└────────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────────┐
│ fetchAndProcessAssistantResponseImpl                            │
│   1. 创建 BlockManager 实例                                      │
│   2. 创建各类 callbacks                                          │
│   3. 创建 StreamProcessor                                        │
│   4. 调用 transformMessagesAndFetch 开始流式请求                 │
└────────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────────┐
│ StreamProcessor 接收 Chunk 并分发                                │
│   switch(chunk.type) {                                          │
│     LLM_RESPONSE_CREATED → onLLMResponseCreated()               │
│     TEXT_START → onTextStart()                                   │
│     TEXT_DELTA → onTextChunk(text)                              │
│     THINKING_START → onThinkingStart()                          │
│     MCP_TOOL_PENDING → onToolCallPending()                      │
│     ...                                                         │
│   }                                                             │
└────────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────────┐
│ Callbacks 调用 BlockManager 方法                                 │
│   - handleBlockTransition()  创建新块                            │
│   - smartBlockUpdate()       更新现有块                          │
└────────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────────┐
│ BlockManager 更新 Redux Store                                    │
│   - dispatch updateOneBlock / upsertOneBlock                    │
│   - dispatch upsertBlockReference (更新消息的 blocks 数组)       │
│   - 持久化到数据库                                               │
└────────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────────┐
│ React 组件响应 Redux 状态变化                                     │
│   - 根据 message.blocks 获取块列表                               │
│   - 按顺序渲染各类型块组件                                        │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 多轮工具调用详细时序

```
API Response Stream
     │
     ├─▶ ChunkType.LLM_RESPONSE_CREATED
     │        │
     │        └─▶ baseCallbacks.onLLMResponseCreated()
     │                  │
     │                  └─▶ 创建 UNKNOWN 占位符块
     │                        BlockManager.handleBlockTransition()
     │                        message.blocks = ["placeholder-id"]
     │
     ├─▶ ChunkType.THINKING_START
     │        │
     │        └─▶ thinkingCallbacks.onThinkingStart()
     │                  │
     │                  ├─▶ 检测到占位符块存在
     │                  └─▶ 复用占位符，更新类型为 THINKING
     │                        smartBlockUpdate(changes, THINKING, true)
     │                        message.blocks = ["thinking-id"]
     │
     ├─▶ ChunkType.THINKING_DELTA (多次)
     │        │
     │        └─▶ thinkingCallbacks.onThinkingChunk(text)
     │                  │
     │                  └─▶ 节流更新内容
     │                        smartBlockUpdate(changes, THINKING)
     │
     ├─▶ ChunkType.THINKING_COMPLETE
     │        │
     │        └─▶ thinkingCallbacks.onThinkingComplete(text)
     │                  │
     │                  └─▶ 立即更新，标记完成
     │                        smartBlockUpdate(changes, THINKING, true)
     │                        activeBlockInfo = null
     │
     ├─▶ ChunkType.MCP_TOOL_PENDING (工具1)
     │        │
     │        └─▶ toolCallbacks.onToolCallPending(response)
     │                  │
     │                  ├─▶ 无占位符，创建新 TOOL 块
     │                  │     createToolBlock()
     │                  │     handleBlockTransition()
     │                  │     message.blocks = ["thinking-id", "tool1-id"]
     │                  │
     │                  └─▶ 记录映射
     │                        toolCallIdToBlockIdMap.set(id, blockId)
     │
     ├─▶ ChunkType.MCP_TOOL_COMPLETE (工具1)
     │        │
     │        └─▶ toolCallbacks.onToolCallComplete(response)
     │                  │
     │                  └─▶ 更新工具块状态为成功
     │                        smartBlockUpdate(changes, TOOL, true)
     │
     ├─▶ ChunkType.TEXT_START
     │        │
     │        └─▶ textCallbacks.onTextStart()
     │                  │
     │                  ├─▶ 无占位符，创建新 MAIN_TEXT 块
     │                  │     createMainTextBlock()
     │                  │     handleBlockTransition()
     │                  │     message.blocks = ["thinking-id", "tool1-id", "text-id"]
     │                  │
     │                  └─▶ 记录 mainTextBlockId
     │
     ├─▶ ChunkType.TEXT_DELTA (多次)
     │        │
     │        └─▶ textCallbacks.onTextChunk(text)
     │                  │
     │                  └─▶ 节流更新文本内容
     │                        smartBlockUpdate(changes, MAIN_TEXT)
     │
     ├─▶ ChunkType.MCP_TOOL_PENDING (工具2)
     │        │
     │        └─▶ toolCallbacks.onToolCallPending(response)
     │                  │
     │                  └─▶ 创建第二个 TOOL 块
     │                        createToolBlock()
     │                        handleBlockTransition()
     │                        message.blocks = ["thinking-id", "tool1-id", "text-id", "tool2-id"]
     │
     ├─▶ ChunkType.MCP_TOOL_COMPLETE (工具2)
     │        │
     │        └─▶ 更新工具块
     │
     ├─▶ ChunkType.TEXT_DELTA (继续)
     │        │
     │        └─▶ 继续更新文本块（同一个 mainTextBlockId）
     │
     ├─▶ ChunkType.TEXT_COMPLETE
     │        │
     │        └─▶ textCallbacks.onTextComplete(text)
     │                  │
     │                  └─▶ 标记文本块完成
     │                        smartBlockUpdate(changes, MAIN_TEXT, true)
     │                        mainTextBlockId = null
     │
     └─▶ ChunkType.BLOCK_COMPLETE
              │
              └─▶ baseCallbacks.onComplete(SUCCESS, response)
                        │
                        └─▶ 更新最后一个活跃块状态为 SUCCESS
                              更新消息状态
                              保存到数据库
```

---

## 6. 关键代码分析

### 6.1 块节流更新机制

```typescript
// 位置: store/thunk/messageThunk.ts

// 使用 LRU 缓存管理每个块的节流器
const blockUpdateThrottlers = new LRUCache<string, ReturnType<typeof throttle>>({
  max: 100,
  ttl: 1000 * 60 * 5,
  updateAgeOnGet: true
})

const getBlockThrottler = (id: string) => {
  if (!blockUpdateThrottlers.has(id)) {
    const throttler = throttle(async (blockUpdate: any) => {
      // 使用 requestAnimationFrame 优化渲染
      const rafId = requestAnimationFrame(() => {
        store.dispatch(updateOneBlock({ id, changes: blockUpdate }))
      })
      
      blockUpdateRafs.set(id, rafId)
      await updateSingleBlockV2(id, blockUpdate)
    }, 150)  // 150ms 节流间隔

    blockUpdateThrottlers.set(id, throttler)
  }

  return blockUpdateThrottlers.get(id)!
}
```

### 6.2 块创建工具函数

```typescript
// 位置: utils/messageUtils/create.ts

export function createBaseMessageBlock<T extends MessageBlockType>(
  messageId: string,
  type: T,
  overrides: Partial<Omit<BaseMessageBlock, 'id' | 'messageId' | 'type'>> = {}
): BaseMessageBlock & { type: T } {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),           // 自动生成唯一 ID
    messageId,              // 关联到消息
    type,                   // 块类型
    createdAt: now,
    status: MessageBlockStatus.PROCESSING,
    error: undefined,
    ...overrides
  }
}

export function createToolBlock(
  messageId: string,
  toolId: string,
  overrides: Partial<Omit<ToolMessageBlock, 'id' | 'messageId' | 'type' | 'toolId'>> = {}
): ToolMessageBlock {
  // 根据内容自动判断初始状态
  let initialStatus = MessageBlockStatus.PROCESSING
  if (overrides.content !== undefined || overrides.error !== undefined) {
    initialStatus = overrides.error ? MessageBlockStatus.ERROR : MessageBlockStatus.SUCCESS
  }

  const baseBlock = createBaseMessageBlock(messageId, MessageBlockType.TOOL, {
    status: initialStatus,
    ...overrides
  })
  
  return {
    ...baseBlock,
    toolId,
    toolName: overrides.toolName,
    arguments: overrides.arguments,
    content: overrides.content
  }
}
```

### 6.3 Redux 消息 Slice 的块引用管理

```typescript
// 位置: store/newMessage.ts

upsertBlockReference(state, action: PayloadAction<UpsertBlockReferencePayload>) {
  const { messageId, blockId, status, blockType } = action.payload

  const messageToUpdate = state.entities[messageId]
  if (!messageToUpdate) return

  const changes: Partial<Message> = {}
  const currentBlocks = messageToUpdate.blocks || []
  
  // 只有块不在列表中时才添加
  if (!currentBlocks.includes(blockId)) {
    // ⭐ 特殊处理：THINKING 块总是放在最前面
    if (blockType === MessageBlockType.THINKING) {
      changes.blocks = [blockId, ...currentBlocks]
    } else {
      // 其他块追加到末尾
      changes.blocks = [...currentBlocks, blockId]
    }
  }

  // 根据块状态更新消息状态
  if (status) {
    if (status === MessageBlockStatus.PROCESSING || 
        status === MessageBlockStatus.STREAMING) {
      if (messageToUpdate.status !== AssistantMessageStatus.PROCESSING) {
        changes.status = AssistantMessageStatus.PROCESSING
      }
    } else if (status === MessageBlockStatus.ERROR) {
      changes.status = AssistantMessageStatus.ERROR
    }
  }

  if (Object.keys(changes).length > 0) {
    messagesAdapter.updateOne(state, { id: messageId, changes })
  }
}
```

---

## 7. 总结

### 7.1 核心设计模式

1. **块实体分离存储**：消息和块分别存储在不同的 Redux slice 中，消息通过 `blocks` 数组引用块 ID
2. **占位符块复用**：响应开始时创建 UNKNOWN 占位符，第一个实际块到来时复用该块，避免闪烁
3. **智能更新策略**：块类型改变或完成时立即更新，同类型持续更新时节流
4. **块顺序即显示顺序**：`message.blocks` 数组中的顺序就是 UI 显示顺序
5. **特殊位置处理**：THINKING 块总是插入到最前面

### 7.2 多轮工具调用的排序逻辑

1. 块按照接收到的事件顺序追加到 `blocks` 数组
2. 每个工具调用创建独立的 TOOL 块
3. 同一个文本块可以跨多个工具调用持续更新
4. 最终顺序反映了 AI 响应的真实流程

### 7.3 关键接口

| 组件 | 职责 |
|------|------|
| `BlockManager` | 块生命周期管理、更新策略 |
| `StreamProcessingService` | Chunk 类型分发 |
| `Callbacks` | 各类型块的具体处理逻辑 |
| `newMessage slice` | 消息和块引用存储 |
| `messageBlock slice` | 块实体存储 |