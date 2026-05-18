# AI 辩论功能重构设计稿

> 状态：Draft v1
> 关联文件：
> - `src/pages/ChatPage/hooks/useAIDebate.ts`
> - `src/components/AIDebateButton.tsx`
> - `src/pages/Settings/AIDebateSettings.tsx`
> - `src/shared/services/ai/AIDebateService.ts`
> - `src/shared/api/index.ts`
> - `src/components/input/IntegratedChatInput/{ButtonToolbar,MenuManager}.tsx`

---

## 1. 背景与现状

AI 辩论让多个角色（不同模型 + 不同 system prompt）轮流就同一主题发言。当前实现集中在 `useAIDebate` Hook，绕过常规的 messageThunk 直接通过 `newMessagesActions.addMessage` + `upsertManyBlocks` 写入 Redux。

### 1.1 已知缺陷

| # | 现象 | 根因定位 |
|---|------|----------|
| P0-1 | 点击"停止"无法立即中止当前角色发言，必须等本次请求自然结束 | `useAIDebate.sendAIRequest` 未创建 `AbortController`；`shared/api/index.ts:processModelRequest` 即便接收 `abortSignal` 也只在请求前检查一次，不透传给 provider |
| P0-2 | 辩论中输入框主发送按钮不切换为"停止"态 | `ButtonToolbar` 的主按钮只看 `isStreaming`；辩论消息没有登记到 `state.messages.streamingMessages`，主管线感知不到 |
| P0-3 | 辩论输出实际不是流式（一次性出现） | `processModelRequest` **完全丢弃**了 `ChatRequest.onChunk`，从未传给底层 `api.sendChatRequest` |
| P1-1 | `DebateRole/DebateConfig` 类型在 3 个文件各自定义，未复用 `AIDebateService.ts` | 历史遗留 |
| P1-2 | 辩论消息不进入正常 persistence/citation/token 统计/重试链路 | 写入路径绕开 messageThunk |
| P1-3 | 切话题、刷新、组件卸载会让辩论循环失控（Promise 仍在跑、状态丢失） | 主循环挂在 React Hook 闭包中，状态散落于 `useState/useRef` |
| P1-4 | 角色间 `setTimeout(3000)` 等待不可中断 | sleep 没接 AbortSignal |
| P2-1 | 不支持暂停/恢复、不支持单角色重发 | 状态机能力缺失 |
| P2-2 | 主持人 `[DEBATE_END]` 是字符串里硬解析 | 缺乏结构化结束信号 |

### 1.2 设计目标

1. **可中止**：用户点击停止后 ≤200ms 内取消正在进行的请求与等待。
2. **可暂停/恢复**：保留历史，从下一个发言者继续。
3. **真·流式**：每个 token/chunk 实时落到对应消息气泡。
4. **状态可观测**：单一 SSOT，按钮状态/Loading/Toast 全部派生。
5. **与主链路一致**：辩论消息复用普通消息的持久化、引用、Token 统计、重试。
6. **职责分离**：编排逻辑脱离 React Hook，便于测试与跨组件复用。
7. **向后兼容**：现有配置 (`aiDebateConfig`/`aiDebateConfigGroups`) 不破坏。

### 1.3 非目标

- 不在本期支持多人协作（多端共享辩论会话）
- 不替换底层 provider 实现（仅扩展接口）
- 不改 AI 辩论设置页 UI

---

## 2. 总体架构

```
┌────────────────────────────────────────────────────────────────┐
│                          UI Layer                              │
│  AIDebateButton  ButtonToolbar  ChatPageUI  IntegratedChatInput│
│                ▲ 派生（status/streamingMessageId）             │
└────────────────┬───────────────────────────────────────────────┘
                 │ dispatch(action)
┌────────────────▼───────────────────────────────────────────────┐
│                       Redux State Layer                        │
│  debateSlice            newMessagesSlice      messageBlocksSlice│
│  ─ byTopicId[topicId]    ─ streamingMessages   ─ blocks         │
│      ├ status            (登记辩论消息)                         │
│      ├ currentRound                                             │
│      ├ history[]                                                │
│      └ streamingMessageId                                       │
└────────────────┬───────────────────────────────────────────────┘
                 │ thunks
┌────────────────▼───────────────────────────────────────────────┐
│                     Service / Orchestrator                     │
│  DebateScheduler (singleton)                                   │
│   ├─ run(topicId)         ├─ pause/resume/stop                 │
│   ├─ nextSpeaker          └─ checkpoint                        │
│  ──────────────────────────────────────────                    │
│  AbortRegistry (per-topic AbortController)                     │
│  abortableSleep(ms, signal)                                    │
└────────────────┬───────────────────────────────────────────────┘
                 │ stream events
┌────────────────▼───────────────────────────────────────────────┐
│                     Provider Streaming Layer                   │
│  api.streamChat(req) : AsyncIterable<StreamEvent>              │
│  - openai / anthropic-aisdk / gemini-aisdk / dashscope 适配    │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. 详细设计

### 3.1 类型整合

将散落于 3 处的 `DebateRole/DebateConfig/DebateConfigGroup` 统一收敛到 `src/shared/services/ai/AIDebateService.ts`，其余文件 `import type` 复用。

新增运行时类型：

```ts
// src/shared/types/debate.ts
export type DebateStatus =
  | 'idle' | 'starting' | 'running'
  | 'pausing' | 'paused'
  | 'stopping' | 'stopped'
  | 'summarizing' | 'completed' | 'error';

export interface DebateRuntimeState {
  topicId: string;
  status: DebateStatus;
  config: DebateConfig | null;
  question: string;
  currentRound: number;        // 1-based
  currentSpeakerIndex: number;
  totalSpeakers: number;
  history: DebateHistoryItem[]; // {roleId, roleName, content, round}
  streamingMessageId: string | null;
  pendingMessageIds: string[];  // 用于回滚
  startedAt: number;
  endedAt?: number;
  endReason?: 'user_stop' | 'max_rounds' | 'moderator_end' | 'timeout' | 'error';
  errorMessage?: string;
}
```

### 3.2 Redux Slice：`debateSlice`

```ts
// src/shared/store/slices/debateSlice.ts
interface DebateSliceState {
  byTopicId: Record<string, DebateRuntimeState>;
}

// actions（节选）
startDebate(topicId, question, config)
setStatus(topicId, status)
appendHistory(topicId, item)
setStreamingMessageId(topicId, msgId | null)
incrementSpeaker(topicId)
incrementRound(topicId)
setEndReason(topicId, reason)
clearDebate(topicId)
```

**派生 selectors**：

```ts
selectIsDebating(topicId)         = status ∈ {starting, running, pausing, summarizing}
selectIsPausable(topicId)         = status === 'running'
selectIsResumable(topicId)        = status === 'paused'
selectDebateStreamingId(topicId)  = streamingMessageId
```

### 3.3 AbortRegistry

```ts
// src/shared/services/ai/AbortRegistry.ts
class AbortRegistry {
  private map = new Map<string, AbortController>();
  register(key: string): AbortController {
    this.abort(key);                       // 同 key 旧的先 abort
    const c = new AbortController();
    this.map.set(key, c);
    return c;
  }
  abort(key: string, reason?: string) {
    const c = this.map.get(key);
    if (c && !c.signal.aborted) c.abort(reason);
    this.map.delete(key);
  }
  signal(key: string) { return this.map.get(key)?.signal; }
}
export const debateAbortRegistry = new AbortRegistry();
// key 约定：`debate:${topicId}` （整体停止）
//          `debate:${topicId}:role:${roleId}:r${round}` （单条请求，可选）
```

### 3.4 可中断 sleep

```ts
// src/shared/utils/abortableSleep.ts
export const abortableSleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(toAbortError(signal.reason));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(toAbortError(signal.reason));
    }, { once: true });
  });
```

### 3.5 Provider 流式抽象

#### 3.5.1 在 `shared/api/index.ts` 扩展（最小破坏方案）

不引入新接口，直接补 `processModelRequest` 把 `onChunk/abortSignal` 透传：

```ts
const response = await api.sendChatRequest(apiMessages, model, {
  onChunk: options.onChunk,
  abortSignal: options.abortSignal,
});
```

并要求 4 个 provider 的 `sendChatRequest` 接受第三个 options 参数。**OpenAI/Anthropic/Gemini 的 AI SDK 实现天然支持 `streamText` + `abortSignal`**，DashScope 需补适配。

#### 3.5.2 中长期：统一为 `streamChat` AsyncIterable（Phase 2）

```ts
type StreamEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'reasoning-delta'; delta: string }
  | { type: 'finish'; usage?: TokenUsage }
  | { type: 'error'; error: Error };

interface StreamChatRequest {
  messages: ApiMessage[];
  model: Model;
  systemPrompt?: string;
  signal?: AbortSignal;
}
function streamChat(req: StreamChatRequest): AsyncIterable<StreamEvent>;
```

调度器用 `for await` 消费，更易组合。本期允许两种实现并存。

### 3.6 DebateScheduler（编排器）

挂载为模块级单例，**不依赖 React**：

```ts
// src/shared/services/ai/DebateScheduler.ts
class DebateScheduler {
  async start(topicId, question, config) { ... }
  async pause(topicId)  { /* abort 当前请求 + setStatus('paused') */ }
  async resume(topicId) { /* setStatus('running') + 从下一个 speaker 继续 */ }
  async stop(topicId, reason) { /* abort + 清流程 + setStatus('stopped') + 写收尾 */ }

  // 内部主循环
  private async loop(topicId) {
    while (this.shouldContinue(topicId)) {
      const { role, round } = this.peekNext(topicId);
      const signal = debateAbortRegistry.signal(`debate:${topicId}`)!;

      try {
        const text = await this.streamRole(topicId, role, round, signal);
        store.dispatch(debateActions.appendHistory(topicId, {...}));
        if (role.stance === 'moderator' && round >= 2 && /\[DEBATE_END\]/.test(text)) {
          return this.endWithSummary(topicId, 'moderator_end');
        }
      } catch (e) {
        if (isAbortError(e)) return; // pause/stop 已经处理
        store.dispatch(debateActions.setStatus(topicId, 'error'));
        return;
      }

      this.advance(topicId);
      await abortableSleep(3000, signal);
    }
    return this.endWithSummary(topicId, 'max_rounds');
  }

  private async streamRole(topicId, role, round, signal) { /* 见 3.7 */ }
  private async endWithSummary(topicId, reason) { /* 见 3.8 */ }
}
export const debateScheduler = new DebateScheduler();
```

**关键点**：
- 主循环只读 Redux state 决定是否继续 → `pause`/`stop` 修改 status 即生效
- 所有等待都接 `signal` → 中断零延迟
- 异常分类处理：`AbortError` 不是错误，其他错误才置 `error` 状态

### 3.7 单角色流式发言

```ts
private async streamRole(topicId, role, round, signal): Promise<string> {
  const header = `**第${round}轮 - ${role.name}** (${stanceText(role.stance)})\n\n`;
  const { message, blocks } = createAssistantMessage({
    assistantId, topicId,
    modelId: resolved.modelId, model: resolved.model,
    initialContent: header,
    status: AssistantMessageStatus.STREAMING,
  });

  // 关键：把这条消息登记到主链路 streamingMessages，让 isStreaming=true
  store.dispatch(newMessagesActions.addMessage({ topicId, message }));
  store.dispatch(upsertManyBlocks(blocks));
  store.dispatch(newMessagesActions.setTopicStreaming({ topicId, messageId: message.id, isStreaming: true }));
  store.dispatch(debateActions.setStreamingMessageId(topicId, message.id));

  const mainBlock = blocks.find(b => b.type === MessageBlockType.MAIN_TEXT)!;
  let acc = '';

  try {
    const ctx = buildContext(question, history, round, role);
    const resp = await sendChatRequest({
      messages: [{ role: 'user', content: ctx }],
      modelId: role.modelId,
      systemPrompt: role.systemPrompt,
      abortSignal: signal,                   // ✅ 透传
      onChunk: (chunk) => {
        if (acc && chunk.startsWith(acc)) acc = chunk; else acc += chunk;
        store.dispatch(upsertManyBlocks([{
          ...mainBlock,
          content: header + acc,
          status: MessageBlockStatus.STREAMING,
          updatedAt: new Date().toISOString(),
        }]));
      },
    });

    const final = acc || resp.content || '';
    store.dispatch(upsertManyBlocks([{ ...mainBlock, content: header + final, status: MessageBlockStatus.SUCCESS }]));
    store.dispatch(newMessagesActions.updateMessage({ id: message.id, changes: { status: AssistantMessageStatus.SUCCESS } }));
    return final;
  } catch (e) {
    if (isAbortError(e)) {
      // 暂停时把当前消息标为 PAUSED，保留已写内容
      store.dispatch(upsertManyBlocks([{ ...mainBlock, content: header + acc, status: MessageBlockStatus.PAUSED }]));
      store.dispatch(newMessagesActions.updateMessage({ id: message.id, changes: { status: AssistantMessageStatus.PAUSED } }));
    } else {
      store.dispatch(upsertManyBlocks([{ ...mainBlock, content: header + acc, status: MessageBlockStatus.ERROR }]));
      store.dispatch(newMessagesActions.updateMessage({ id: message.id, changes: { status: AssistantMessageStatus.ERROR } }));
    }
    throw e;
  } finally {
    store.dispatch(newMessagesActions.setTopicStreaming({ topicId, messageId: message.id, isStreaming: false }));
    store.dispatch(debateActions.setStreamingMessageId(topicId, null));
  }
}
```

**注意**：
- `MessageBlockStatus.PAUSED` 若不存在需扩展枚举（或复用 `SUCCESS` + 元数据标记）。
- `setTopicStreaming` 是新加的 action，作用是让通用 `isStreaming` 选择器也能反映辩论状态。如果项目内没有该 action，则降级为 dispatch `newMessagesActions.upsertStreamingMessage` 或类似既有机制。

### 3.8 总结阶段

`endWithSummary(topicId, reason)`：
1. `setStatus('summarizing')`
2. 找 `summary` 角色 → 找任意带 modelId 的角色 → 否则模板兜底
3. 同样走 `streamRole` 但传特殊"总结角色"上下文 → 流式输出
4. 写"🏁 辩论结束"系统消息
5. `setStatus('completed')` + `endedAt` + `endReason`

### 3.9 持久化与崩溃恢复（可选 P2）

- `byTopicId[topicId]` 通过 redux-persist 或 Dexie 镜像
- 启动时若 `status ∈ {running, paused}`：弹 Toast "检测到未完成的辩论，是否继续？"
- 用户确认后调用 `scheduler.resume`

### 3.10 UI 层改动

#### 3.10.1 `useAIDebate` Hook 重写为薄壳

```ts
export const useAIDebate = ({ currentTopic }) => {
  const status = useSelector(s => selectDebateStatus(s, currentTopic?.id));
  const isDebating = useSelector(s => selectIsDebating(s, currentTopic?.id));

  const handleStartDebate = useCallback((q, cfg) => {
    if (!currentTopic) return;
    debateScheduler.start(currentTopic.id, q, cfg);
  }, [currentTopic]);

  const handleStopDebate  = useCallback(() => currentTopic && debateScheduler.stop(currentTopic.id, 'user_stop'), [currentTopic]);
  const handlePauseDebate = useCallback(() => currentTopic && debateScheduler.pause(currentTopic.id), [currentTopic]);
  const handleResumeDebate= useCallback(() => currentTopic && debateScheduler.resume(currentTopic.id), [currentTopic]);

  return { status, isDebating, handleStartDebate, handleStopDebate, handlePauseDebate, handleResumeDebate };
};
```

#### 3.10.2 主发送按钮联动

`ButtonToolbar` 中：

```ts
const effectiveStreaming = isStreaming || isDebating;
// 主按钮：
//  effectiveStreaming === true → 显示 Stop，onClick 优先 onStopDebate ?? onStopResponse
//  否则                          → Send
```

#### 3.10.3 新增 Pause/Resume 按钮（可选）

`AIDebateButton` 在 `isDebating` 时旁挂一个暂停/恢复图标，分别 dispatch `pause`/`resume`。

#### 3.10.4 顶部进度条（可选）

`status === 'running'` 时显示 `第 X / Y 轮 · 正在发言：{roleName}`，`paused` 时变橙色提示。

---

## 4. 兼容与迁移

| 项 | 处理 |
|---|------|
| `aiDebateConfig` localStorage/Dexie 键 | 不变 |
| `aiDebateConfigGroups` 键 | 不变 |
| `AIDebateService.ts` 类型导出 | 保留并扩展 |
| `useAIDebate` 对外签名 | `isDebating`/`handleStartDebate`/`handleStopDebate` 保留；新增 pause/resume/status |
| 现有辩论消息（已落库的） | 不迁移，UI 渲染兼容（普通 assistant message） |

---

## 5. 测试计划

### 5.1 单元

- `AbortRegistry`: register/abort/重复 register 行为
- `abortableSleep`: 正常 resolve / 中途 abort reject
- `debateSlice`: 状态机迁移合法性矩阵
- `DebateScheduler.peekNext / advance`: 轮次推进、wraparound

### 5.2 集成

- E2E：开始 → 第 1 角色发言中点停止 → 200ms 内消息状态变 PAUSED，主按钮回到 Send
- E2E：开始 → 等到第 2 轮 → pause → 切话题 → 切回 → resume → 从下一角色继续
- E2E：主持人输出 `[DEBATE_END]` → 立即进入总结阶段
- 流式：mock provider 推 10 chunk，断言 UI 上至少有 5 次 block content 变化

### 5.3 回归

- 普通聊天发送/停止不受影响
- 多模型发送、网页搜索、工具调用按钮工具栏未错位

---

## 6. 实施分期

### Phase 1 · 紧急修复（已完成）

**实施时间**：2026-05-18

**改动清单**：

| # | 文件 | 改动内容 |
|---|------|----------|
| 1 | `src/shared/api/index.ts:1-7,165-180` | 导入 `ChunkType`；新增 `onChunkAdapter` 将 provider 的 `Chunk` 对象（`TEXT_DELTA/TEXT_COMPLETE`）适配为 `string` 回调；`api.sendChatRequest` 第 3 个参数透传 `systemPrompt/onChunk/abortSignal` |
| 2 | `src/shared/services/ai/ProviderFactory.ts` | 6 个 wrapper（anthropic / anthropic-aisdk / gemini / openai-aisdk / gemini-aisdk / dashscope）的 `sendChatRequest` 增加第 3 个 `options?: any` 参数，转发给 `provider.sendChatMessage` |
| 3 | `src/shared/api/openai/index.ts:90-108` | `sendChatRequest` 的 options 增加 `onChunk?: (chunk: any) => void` 和 `abortSignal?: AbortSignal`，下传给 `sendChatMessage` |
| 4 | `src/pages/ChatPage/hooks/useAIDebate.ts:24,95,120-141,191-214,318` | 新增 `abortControllerRef`；`handleStartDebate` 创建 controller；`handleStopDebate` 调 `abort()` 并清空；`sendAIRequest` 传 `abortSignal`；角色间 3 秒 sleep 改为可中断（监听 `abort` 事件 + clearTimeout） |
| 5 | `src/components/input/IntegratedChatInput.tsx:333` + `src/components/input/IntegratedChatInput/ButtonToolbar.tsx:30,79,252-264` | `ButtonToolbarProps` 加 `onStopDebate?: () => void`；主发送按钮在 `isStreaming\|\|isDebating` 时切换为红色 ■ 停止图标；`isDebating` 时 onClick 优先调 `onStopDebate` |

**验收结果**（2026-05-18 已通过实测）：

- [x] P0-1：辩论中点停止按钮，当前角色的 AI 流式请求 ≤500ms 被取消（AbortError 抛出），轮间 sleep 立即中断
- [x] P0-2：辩论中输入框右下角主按钮显示为红色 ■ 停止图标，点击触发 `handleStopDebate`
- [x] P0-3：辩论消息气泡逐字/逐 chunk 累积显示，而非一次性出现

**未做（按"简洁优先"原则保留）**：

- 未引入 `debateSlice`/`DebateScheduler`/单例编排器（属于 Phase 2）
- 未把辩论消息登记到 `state.messages.streamingMessages`（按钮联动已通过 `isDebating` 实现）
- 未抽公共 `abortableSleep` 工具（仅辩论 1 处用，就地实现避免增加抽象）
- 未触碰类型重复定义（`DebateRole/DebateConfig` 在 3 文件重复）
- 未修改测试 / 注释 / 格式

### Phase 2 · 编排器与状态机（1~2 周）
6. 落地 `debateSlice` + selectors
7. 抽出 `DebateScheduler` 单例，`useAIDebate` 改为薄壳
8. 把辩论消息登记到主链路 `streamingMessages`
9. 引入 pause/resume

### Phase 3 · 体验增强（按需）
10. 持久化 + 崩溃恢复
11. 顶部进度 HUD
12. 单角色重发 / 角色顺序拖拽
13. 结束信号结构化（替代 `[DEBATE_END]` 字符串解析）
14. 统一 `streamChat` AsyncIterable

---

## 7. 风险与对策

| 风险 | 概率 | 对策 |
|------|------|------|
| Provider 不支持 `abortSignal`（DashScope 等） | 中 | Phase 1 先做能力检测，不支持则退化为"等本次请求结束再取消" |
| `setTopicStreaming` 在现有 newMessagesSlice 中无对应 action | 中 | 评估添加；过渡期通过本地状态映射 |
| 模型推送整段而非增量（startsWith 检测可能误判） | 低 | 保留现有 `if (chunk.startsWith(acc)) acc = chunk` 兼容 |
| 暂停后块状态 `PAUSED` 渲染未实现 | 低 | 复用 SUCCESS + meta 字段或扩展枚举 |
| 单例 Scheduler 在 HMR 下状态丢失 | 低 | 仅开发环境影响；生产 SSR/build 不暴露 |

---

## 8. 验收标准（DoD）

- [ ] 停止响应延迟 P95 ≤ 500ms
- [ ] 流式：单次发言至少触发 ≥3 次 UI 内容更新
- [ ] 辩论中主发送按钮显示 Stop 图标
- [ ] 暂停后切话题再切回不影响其他话题
- [ ] 普通聊天/多模型/搜索/工具调用回归 0 缺陷
- [ ] 单元测试覆盖率：`debateSlice` ≥90%、`DebateScheduler` ≥75%

---

## 9. 参考

- Cherry Studio `messageThunk` 中的 `abortMap` + `streamingMessages` 设计
- Vercel AI SDK `streamText({ abortSignal })` 与 AsyncIterable
- LangGraph 的 Stateful Graph + Checkpointer
- Autogen GroupChat Manager 的轮次调度
