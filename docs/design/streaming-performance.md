# 流式输出性能优化方案

> **状态**: ✅ 核心优化已完成（2025-12-05）

## 📋 背景

### 问题描述

在长对话场景下，流式输出时出现严重掉帧现象。用户在进行多轮对话后，当AI响应流式输出时，界面出现明显卡顿，影响用户体验。

### 问题根因

通过对比分析 Cherry Studio 参考项目（`docs/参考项目/cherry-studio-main`）和当前项目的实现，发现以下关键差异导致了性能问题：

1. **节流策略层级错误**：当前项目在组件层面做节流，而非在 Redux 更新层面
2. **Selector 粒度过粗**：使用整个 `entities` 对象作为依赖，导致任何块更新都触发所有组件重新计算
3. **事件监听过度**：多处监听流式事件并触发 `forceUpdate`，造成不必要的渲染
4. **useMemo 依赖失效**：依赖整个 `blockEntities` 对象，导致缓存频繁失效

---

## 📁 参考文件

### Cherry Studio 参考项目（优秀实现）

| 文件 | 描述 | 关键点 |
|------|------|--------|
| [`docs/参考项目/cherry-studio-main/src/renderer/src/pages/home/Messages/Messages.tsx`](../参考项目/cherry-studio-main/src/renderer/src/pages/home/Messages/Messages.tsx) | 消息列表组件 | 不监听流式事件，依赖 Redux 状态自然触发更新 |
| [`docs/参考项目/cherry-studio-main/src/renderer/src/pages/home/Messages/Message.tsx`](../参考项目/cherry-studio-main/src/renderer/src/pages/home/Messages/Message.tsx) | 单条消息组件 | 简单的 `memo` 包装，不使用 `forceUpdate` |
| [`docs/参考项目/cherry-studio-main/src/renderer/src/pages/home/Messages/Blocks/index.tsx`](../参考项目/cherry-studio-main/src/renderer/src/pages/home/Messages/Blocks/index.tsx) | 块渲染器 | 直接映射，不用复杂的 useMemo 依赖 |
| [`docs/参考项目/cherry-studio-main/src/renderer/src/pages/home/Messages/Blocks/MainTextBlock.tsx`](../参考项目/cherry-studio-main/src/renderer/src/pages/home/Messages/Blocks/MainTextBlock.tsx) | 主文本块 | 直接渲染 `block.content`，无组件层节流 |
| [`docs/参考项目/cherry-studio-main/src/renderer/src/store/messageBlock.ts`](../参考项目/cherry-studio-main/src/renderer/src/store/messageBlock.ts) | Redux 块状态 | 使用 `createSelector` 做参数化缓存 |

### 当前项目文件（需要优化）

| 文件 | 描述 | 问题 |
|------|------|------|
| [`src/components/message/MessageList.tsx`](../../src/components/message/MessageList.tsx) | 消息列表组件 | 监听流式事件，选择整个 `entities` |
| [`src/components/message/MessageGroup.tsx`](../../src/components/message/MessageGroup.tsx) | 消息分组组件 | 每个组都监听流式事件并 `forceUpdate` |
| [`src/components/message/MessageBlockRenderer.tsx`](../../src/components/message/MessageBlockRenderer.tsx) | 块渲染器 | useMemo 依赖 `blockEntities` 整体 |
| [`src/components/message/blocks/MainTextBlock.tsx`](../../src/components/message/blocks/MainTextBlock.tsx) | 主文本块 | 组件层节流 + 复杂 selector |
| [`src/components/message/hooks/useMessageData.ts`](../../src/components/message/hooks/useMessageData.ts) | 消息数据钩子 | selector 缓存策略可优化 |
| [`src/shared/services/messages/responseHandlers/ResponseChunkProcessor.ts`](../../src/shared/services/messages/responseHandlers/ResponseChunkProcessor.ts) | 流式处理器 | 已有智能节流，是正确的节流层级 |

---

## 🔍 详细问题分析

### 问题1：组件层节流导致额外渲染周期

**当前实现** (`src/components/message/blocks/MainTextBlock.tsx:66-100`)：

```typescript
// ❌ 问题：组件层节流
const [throttledContent, setThrottledContent] = useState(content);
const contentRef = useRef(content);

const throttledUpdate = useMemo(() => {
  if (!shouldUseThrottling) return null;
  const interval = getHighPerformanceUpdateInterval();
  return throttle(() => {
    setThrottledContent(contentRef.current);
  }, interval);
}, [shouldUseThrottling]);

useEffect(() => {
  contentRef.current = content;
  if (throttledUpdate && shouldUseThrottling) {
    throttledUpdate();
  } else {
    setThrottledContent(content);
  }
}, [content, throttledUpdate, shouldUseThrottling]);
```

**参考实现** (`docs/参考项目/.../Blocks/MainTextBlock.tsx:53-59`)：

```typescript
// ✅ 正确：直接渲染，依赖 Redux 层节流
return (
  <>
    {role === 'user' && !renderInputMessageAsMarkdown ? (
      <p className="markdown">{block.content}</p>
    ) : (
      <Markdown block={block} postProcess={processContent} />
    )}
  </>
)
```

**问题影响**：
- 每个 MainTextBlock 维护独立的节流状态
- `useState` 触发额外的渲染周期
- 长对话中有数十个 MainTextBlock，累积影响严重

---

### 问题2：Selector 粒度过粗

**当前实现** (`src/components/message/MessageList.tsx:135`)：

```typescript
// ❌ 问题：选择整个 entities 对象
const messageBlocks = useSelector((state: RootState) => state.messageBlocks.entities);
```

**当前实现** (`src/components/message/blocks/MainTextBlock.tsx:39-57`)：

```typescript
// ❌ 问题：内联 selector，每次都遍历所有块
const citations = useSelector((state: RootState): Citation[] => {
  if (role !== 'assistant' || !messageId) return [];
  
  const message = state.messages.entities[messageId];
  if (!message?.blocks) return [];
  
  // 遍历所有块查找网络搜索工具块
  const webSearchBlocks = message.blocks
    .map((blockId: string) => state.messageBlocks.entities[blockId])
    .filter((b): b is ToolMessageBlock =>
      b !== undefined && isWebSearchToolBlock(b as any)
    );
  
  return webSearchBlocks.flatMap((tb) => extractCitationsFromToolBlock(tb));
});
```

**参考实现** (`docs/参考项目/.../store/messageBlock.ts:304-310`)：

```typescript
// ✅ 正确：使用 createSelector 做参数化缓存
export const selectFormattedCitationsByBlockId = createSelector(
  [selectBlockEntityById],  // 只查询单个块
  (blockEntity): Citation[] => {
    if (blockEntity?.type === MessageBlockType.CITATION) {
      return formatCitationsFromBlock(blockEntity as CitationMessageBlock)
    }
    return []
  }
)

// 使用
const rawCitations = useSelector((state: RootState) => 
  selectFormattedCitationsByBlockId(state, citationBlockId)
)
```

**问题影响**：
- 任何块更新都改变 `entities` 引用
- 导致所有使用该 selector 的组件重新渲染
- 内联 selector 无法利用缓存

---

### 问题3：流式事件监听过度

**当前实现** (`src/components/message/MessageGroup.tsx:174-205`)：

```typescript
// ❌ 问题：每个 MessageGroup 都监听事件并 forceUpdate
useEffect(() => {
  const hasStreamingMessage = messages.some(message => message.status === 'streaming');
  if (hasStreamingMessage) {
    const throttledForceUpdate = throttle(() => {
      forceUpdate();  // 强制整个组重渲染
    }, 200);
    
    const unsubscribeTextDelta = EventEmitter.on(EVENT_NAMES.STREAM_TEXT_DELTA, textDeltaHandler);
    const unsubscribeTextComplete = EventEmitter.on(EVENT_NAMES.STREAM_TEXT_COMPLETE, textDeltaHandler);
    const unsubscribeThinkingDelta = EventEmitter.on(EVENT_NAMES.STREAM_THINKING_DELTA, textDeltaHandler);
    // ...
  }
}, [messages, forceUpdate]);
```

**参考实现** (`docs/参考项目/.../Messages/Messages.tsx:120-241`)：

```typescript
// ✅ 正确：只监听业务事件，不监听流式更新事件
useEffect(() => {
  const unsubscribes = [
    EventEmitter.on(EVENT_NAMES.SEND_MESSAGE, scrollToBottom),
    EventEmitter.on(EVENT_NAMES.CLEAR_MESSAGES, ...),
    EventEmitter.on(EVENT_NAMES.COPY_TOPIC_IMAGE, ...),
    // 不监听 STREAM_TEXT_DELTA 等流式事件！
  ]
  return () => unsubscribes.forEach((unsub) => unsub())
}, [...])
```

**问题影响**：
- MessageList + 每个 MessageGroup 都独立监听事件
- `forceUpdate()` 强制整个组件树重渲染
- 长对话有多个 MessageGroup，每个都触发 forceUpdate

---

### 问题4：useMemo 依赖失效

**当前实现** (`src/components/message/MessageBlockRenderer.tsx:148-162`)：

```typescript
// ❌ 问题：blockEntities 整体作为依赖
const renderedBlocks = useMemo(() => {
  const validBlocks = blocks
    .map((blockId) => blockEntities[blockId])
    .filter(Boolean) as MessageBlock[];
  return validBlocks;
}, [blocks, blockEntities]);  // blockEntities 是整个对象引用
```

**参考实现** (`docs/参考项目/.../Blocks/index.tsx:104-109`)：

```typescript
// ✅ 正确：不依赖 blockEntities 整体，只用 useMemo 做分组
const MessageBlockRenderer: React.FC<Props> = ({ blocks, message }) => {
  const blockEntities = useSelector((state: RootState) => messageBlocksSelectors.selectEntities(state))
  const renderedBlocks = blocks.map((blockId) => blockEntities[blockId]).filter(Boolean)
  const groupedBlocks = useMemo(() => groupSimilarBlocks(renderedBlocks), [renderedBlocks])
  // ...
}

export default React.memo(MessageBlockRenderer)  // 依赖外层 memo 阻止重渲染
```

**问题影响**：
- useMemo 的 `blockEntities` 依赖在每次流式更新时都变化
- 导致所有 MessageBlockRenderer 的 useMemo 失效
- 缓存形同虚设

---

## ✅ 修复方案

### 方案1：移除 MainTextBlock 组件层节流

**修改文件**: `src/components/message/blocks/MainTextBlock.tsx`

```typescript
// 修改前：复杂的组件层节流
const [throttledContent, setThrottledContent] = useState(content);
// ... 节流逻辑

// 修改后：直接渲染
const MainTextBlock: React.FC<Props> = ({ block, role, messageId }) => {
  const content = block.content || '';
  const isUserMessage = role === 'user';

  // 获取设置
  const renderUserInputAsMarkdown = useSelector((state: RootState) => 
    state.settings.renderUserInputAsMarkdown
  );

  // 简化的引用处理
  const citationBlockId = useCitationBlockId(messageId, role);
  const citations = useSelector((state: RootState) => 
    selectFormattedCitationsByBlockId(state, citationBlockId)
  );

  const processContent = useCallback((rawContent: string): string => {
    if (citations.length === 0) return rawContent;
    return withCitationTags(rawContent, citations);
  }, [citations]);

  if (!content.trim()) {
    return null;
  }

  // 用户消息
  if (isUserMessage && !renderUserInputAsMarkdown) {
    return (
      <div className="main-text-block">
        <Box sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
          {content}
        </Box>
      </div>
    );
  }

  // AI消息：直接渲染，不做组件层节流
  const cleanContent = content.replace(/<tool_use[\s\S]*?<\/tool_use>/gi, '');
  if (!cleanContent.trim()) return null;

  return (
    <div className="main-text-block">
      <Markdown
        block={{ ...block, content: cleanContent }}
        messageRole={role as 'user' | 'assistant' | 'system'}
        isStreaming={block.status === MessageBlockStatus.STREAMING}
        postProcess={citations.length > 0 ? processContent : undefined}
        allowHtml={citations.length > 0}
      />
    </div>
  );
};

export default React.memo(MainTextBlock);
```

---

### 方案2：优化 Selector 粒度

**新增文件**: `src/shared/store/selectors/messageBlockSelectors.ts`

```typescript
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { MessageBlock } from '../../types/newMessage';

// 参数化的单块查询 selector
export const selectBlockById = (state: RootState, blockId: string | undefined) => 
  blockId ? state.messageBlocks.entities[blockId] : undefined;

// 参数化的多块查询 selector（缓存稳定）
export const selectBlocksByIds = createSelector(
  [
    (state: RootState) => state.messageBlocks.entities,
    (_state: RootState, blockIds: string[]) => blockIds
  ],
  (entities, blockIds): MessageBlock[] => {
    return blockIds
      .map(id => entities[id])
      .filter((block): block is MessageBlock => block !== undefined);
  },
  {
    // 使用自定义比较函数，只有 blockIds 数组内容变化时才重新计算
    memoizeOptions: {
      equalityCheck: (a, b) => {
        if (Array.isArray(a) && Array.isArray(b)) {
          return a.length === b.length && a.every((v, i) => v === b[i]);
        }
        return a === b;
      }
    }
  }
);

// 检查是否有流式块
export const selectHasStreamingBlock = createSelector(
  [selectBlocksByIds],
  (blocks): boolean => blocks.some(block => block.status === 'streaming')
);

// 引用块查询
export const selectCitationsForMessage = createSelector(
  [
    (state: RootState) => state.messageBlocks.entities,
    (state: RootState) => state.messages.entities,
    (_state: RootState, messageId: string | undefined) => messageId
  ],
  (blockEntities, messageEntities, messageId): Citation[] => {
    if (!messageId) return [];
    
    const message = messageEntities[messageId];
    if (!message?.blocks) return [];

    // 只查找引用块，不遍历所有块类型
    for (const blockId of message.blocks) {
      const block = blockEntities[blockId];
      if (block?.type === MessageBlockType.CITATION) {
        return formatCitationsFromBlock(block as CitationMessageBlock);
      }
    }
    return [];
  }
);
```

---

### 方案3：移除 MessageGroup 的流式事件监听

**修改文件**: `src/components/message/MessageGroup.tsx`

```typescript
// 修改前：监听流式事件并 forceUpdate
useEffect(() => {
  const hasStreamingMessage = messages.some(message => message.status === 'streaming');
  if (hasStreamingMessage) {
    const throttledForceUpdate = throttle(() => {
      forceUpdate();
    }, 200);
    // ... 事件监听
  }
}, [messages, forceUpdate]);

// 修改后：完全删除此 useEffect
// 依赖 Redux 状态变化自然触发重渲染，不需要 forceUpdate
```

同时移除 `forceUpdate` 相关的所有代码：

```typescript
// 删除以下代码
const [, setLocalUpdateCounter] = useState(0);
const localForceUpdate = useCallback(() => {
  setLocalUpdateCounter(prev => prev + 1);
}, []);
const forceUpdate = parentForceUpdate || localForceUpdate;
```

---

### 方案4：优化 MessageBlockRenderer 的 useMemo

**修改文件**: `src/components/message/MessageBlockRenderer.tsx`

```typescript
// 修改前
const blockEntities = useSelector((state: RootState) => messageBlocksSelectors.selectEntities(state));

const renderedBlocks = useMemo(() => {
  const validBlocks = blocks
    .map((blockId) => blockEntities[blockId])
    .filter(Boolean) as MessageBlock[];
  return validBlocks;
}, [blocks, blockEntities]);  // ❌ blockEntities 整体作为依赖

// 修改后：使用参数化 selector
import { selectBlocksByIds } from '../../shared/store/selectors/messageBlockSelectors';

const MessageBlockRenderer: React.FC<Props> = ({ blocks, message }) => {
  // 使用参数化 selector，只在 blocks 数组内容变化时重新计算
  const renderedBlocks = useSelector((state: RootState) => 
    selectBlocksByIds(state, blocks)
  );

  // 分组逻辑保持不变
  const groupedBlocks = useMemo(() => groupSimilarBlocks(renderedBlocks), [renderedBlocks]);

  // ... 渲染逻辑
};

export default React.memo(MessageBlockRenderer);
```

---

### 方案5：简化 MessageList 的块状态监控

**修改文件**: `src/components/message/MessageList.tsx`

```typescript
// 修改前
const messageBlocks = useSelector((state: RootState) => state.messageBlocks.entities);

useEffect(() => {
  const hasStreamingBlock = Object.values(messageBlocks || {}).some(
    block => block?.status === 'streaming'
  );
  // ...
}, [messageBlocks, messages, autoScrollToBottom]);

// 修改后：使用更精确的 selector
const hasStreamingMessage = useSelector((state: RootState) => {
  // 只检查当前话题的消息是否有流式状态
  const topicMessages = state.messages.messageIdsByTopic[currentTopicId] || [];
  return topicMessages.some(id => {
    const msg = state.messages.entities[id];
    return msg?.status === 'streaming';
  });
});

// 滚动逻辑简化
useEffect(() => {
  if (hasStreamingMessage && autoScrollToBottom) {
    unifiedScrollManagerRef.current.scrollToBottom('streamingCheck');
  }
}, [hasStreamingMessage, autoScrollToBottom]);
```

---

## 📊 预期效果

| 优化项 | 修改前 | 修改后 | 预期提升 |
|--------|--------|--------|----------|
| MainTextBlock 渲染 | 每次 content 变化触发节流状态更新 | 直接渲染，无额外状态 | 减少 50% 渲染周期 |
| Selector 缓存命中率 | ~10%（entities 整体变化） | ~90%（参数化查询） | 提升 9 倍 |
| MessageGroup 事件处理 | N 个组 × M 次事件 = N×M 次 forceUpdate | 0 次 forceUpdate | 消除冗余更新 |
| MessageBlockRenderer useMemo | 每次流式更新失效 | 只在 blocks 数组变化时重算 | 减少 80% 计算 |

---

## 🔧 实施步骤

### 阶段1：基础优化（优先级高）

1. **创建参数化 selector** (`src/shared/store/selectors/messageBlockSelectors.ts`)
2. **移除 MainTextBlock 组件层节流** (`src/components/message/blocks/MainTextBlock.tsx`)
3. **移除 MessageGroup 流式事件监听** (`src/components/message/MessageGroup.tsx`)

### 阶段2：深度优化（优先级中）

4. **优化 MessageBlockRenderer** (`src/components/message/MessageBlockRenderer.tsx`)
5. **简化 MessageList 块状态监控** (`src/components/message/MessageList.tsx`)

### 阶段3：验证与调优

6. 使用 React DevTools Profiler 验证渲染次数
7. 使用 Performance 面板检测帧率
8. 根据实际效果微调节流参数

---

## 📝 测试验证

### 测试场景

1. **长对话测试**：50+ 轮对话后发送新消息，观察流式输出帧率
2. **快速响应测试**：使用响应速度快的模型（如 GPT-4o），观察是否卡顿
3. **并发块更新测试**：同时有思考块和文本块更新，观察性能

### 性能指标

- 目标帧率：≥30fps（流式输出期间）
- 目标渲染时间：≤33ms（单帧）
- 目标 selector 缓存命中率：≥80%

---

## ✅ 已完成变更（2025-12-05）

### 变更文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/shared/store/selectors/messageBlockSelectors.ts` | 新增 | 参数化 selector：`selectBlocksByIds`、`selectHasStreamingBlock`、`selectCitationsForMessage` |
| `src/components/message/MessageBlockRenderer.tsx` | 修改 | 使用 `selectBlocksByIds` 替代全局 entities 依赖 |
| `src/components/message/blocks/MainTextBlock.tsx` | 修改 | 移除组件层节流，使用参数化引用 selector |
| `src/components/message/MessageGroup.tsx` | 修改 | 删除流式事件 forceUpdate 监听及相关逻辑 |
| `src/components/message/MessageList.tsx` | 修改 | 移除对全局 messageBlocks.entities 的订阅 |

### 核心变更详情

#### 1. 新增参数化 Selector

**文件**: [`src/shared/store/selectors/messageBlockSelectors.ts`](../src/shared/store/selectors/messageBlockSelectors.ts)

```typescript
// 根据块ID数组查询块实体，缓存 blockIds 内容不变时复用
export const selectBlocksByIds = createSelector(
  [
    (state: RootState) => state.messageBlocks.entities,
    (_state: RootState, blockIds: string[]) => blockIds
  ],
  (entities, blockIds): MessageBlock[] => {
    return blockIds
      .map(id => entities[id])
      .filter((block): block is MessageBlock => block !== undefined);
  },
  {
    memoizeOptions: {
      resultEqualityCheck: (a, b) => {
        if (a === b) return true;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i += 1) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }
    }
  }
);

// 针对消息的引用提取：只遍历该消息的块
export const selectCitationsForMessage = createSelector(
  [
    (state: RootState) => state.messageBlocks.entities,
    (state: RootState) => state.messages.entities,
    (_state: RootState, messageId?: string) => messageId
  ],
  (blockEntities, messageEntities, messageId): Citation[] => {
    // 只遍历当前消息的块，支持 CITATION 块和 web search 工具块
  }
);
```

#### 2. MessageBlockRenderer 优化

**文件**: [`src/components/message/MessageBlockRenderer.tsx`](../src/components/message/MessageBlockRenderer.tsx)

```typescript
// 修改前：
const blockEntities = useSelector((state: RootState) =>
  messageBlocksSelectors.selectEntities(state)
);

// 修改后：仅依赖自身块ID映射
const renderedBlocks = useSelector((state: RootState) =>
  selectBlocksByIds(state, blocks)
);
```

#### 3. MainTextBlock 简化

**文件**: [`src/components/message/blocks/MainTextBlock.tsx`](../src/components/message/blocks/MainTextBlock.tsx)

- ❌ 移除 `useState` + `useEffect` 节流逻辑
- ❌ 移除 `throttle` 相关代码
- ✅ 直接渲染 `block.content`
- ✅ 使用 `selectCitationsForMessage` 参数化查询引用

#### 4. MessageGroup 精简

**文件**: [`src/components/message/MessageGroup.tsx`](../src/components/message/MessageGroup.tsx)

- ❌ 移除 `EventEmitter.on(STREAM_TEXT_DELTA, ...)` 监听
- ❌ 移除 `forceUpdate` 及相关状态
- ❌ 移除 `parentForceUpdate` prop
- ✅ 依赖 Redux 状态自然触发重渲染

#### 5. MessageList 优化

**文件**: [`src/components/message/MessageList.tsx`](../src/components/message/MessageList.tsx)

- ❌ 移除 `useSelector(state.messageBlocks.entities)` 全局订阅
- ✅ 流式滚动检查改为只看消息状态 `message.status === 'streaming'`
- ✅ 加载缺块逻辑改用已加载集合判断

---

## 🔄 剩余优化建议

### 优先级中：InfiniteScroll 优化

**问题**: 现有 InfiniteScroll 仍在每次 render 计算 `previousMessagesCount`

**位置**: `src/components/message/MessageList.tsx:664-668`

```typescript
// 当前实现
{groupedMessages.map(([date, messages], groupIndex) => {
  const previousMessagesCount = groupedMessages
    .slice(0, groupIndex)
    .reduce((total, [, msgs]) => total + msgs.length, 0);
  // ...
})}
```

**建议方案**:

```typescript
// 预计算 startIndex，避免每次 render 重复计算
const groupStartIndices = useMemo(() => {
  const indices = new Map<string, number>();
  let cumulative = 0;
  for (const [date, msgs] of groupedMessages) {
    indices.set(date, cumulative);
    cumulative += msgs.length;
  }
  return indices;
}, [groupedMessages]);

// 使用时直接查表
{groupedMessages.map(([date, messages]) => {
  const startIndex = groupStartIndices.get(date) || 0;
  // ...
})}
```

### 优先级低：进一步降低滚动频率

**问题**: 流式输出时滚动事件仍较频繁

**位置**: `src/components/message/MessageList.tsx:317-319`

**建议方案**:

```typescript
// 当前：300ms 节流
const throttledTextDeltaHandler = throttle(() => {
  unifiedScrollManagerRef.current.scrollToBottom('textDelta');
}, 300);

// 可选：增加到 500ms 或更高，或按可见区判定
const throttledTextDeltaHandler = throttle(() => {
  const container = containerRef.current;
  if (container) {
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      unifiedScrollManagerRef.current.scrollToBottom('textDelta');
    }
  }
}, 500);
```

### 优先级低：虚拟化长消息列表

**问题**: 当对话历史非常长（100+ 轮）时，DOM 节点过多

**建议方案**: 使用 `react-virtuoso` 或 `react-window` 替代当前的 InfiniteScroll

---

## 📊 性能验证

### 测试方法

1. 使用 React DevTools Profiler 记录流式输出期间的渲染
2. 检查 "Highlight updates when components render" 选项
3. 对比修复前后的渲染次数和时间

### 预期指标

| 指标 | 修复前 | 修复后 | 改善幅度 |
|------|--------|--------|----------|
| Selector 缓存命中率 | ~10% | ~90% | +800% |
| 流式期间渲染次数 | 高（全局重渲染） | 低（局部更新） | -70%~80% |
| 帧率（长对话） | <15fps | >30fps | +100% |

---

## 🔗 相关文档

- [消息块开发指南](./MESSAGE_BLOCK_DEVELOPMENT_GUIDE.md)
- [性能优化报告](./Performance_Fixes_Report.md)
- [Redux Selector 优化修复报告](./Redux_Selector_优化修复报告.md)