# Agentic Loop 功能完整实现文档

## 概述

Agentic Loop（代理循环）是一个允许 AI 自主进行多轮工具调用的功能，类似于 Roo-Code 的实现。AI 可以：
- 连续调用多个工具完成复杂任务
- 根据工具结果自主决定下一步行动
- 通过 `attempt_completion` 工具主动结束任务
- 在错误或达到限制时自动终止

## 实现状态

✅ **所有核心功能已完成** (2024-12-02)

| 步骤 | 状态 | 说明 |
|------|------|------|
| 1. attempt_completion 工具 | ✅ | 已添加到 FileEditorServer |
| 2. AgenticLoopService | ✅ | 循环状态管理服务已创建 |
| 3. assistantResponse 循环逻辑 | ✅ | 已实现自动迭代和工具结果回传 |
| 4. Agentic 模式检测 | ✅ | 基于 @aether/file-editor 自动启用 |
| 5. 系统提示词更新 | ✅ | AI 知道如何使用 attempt_completion |
| 6. UI 状态显示 | ✅ | 实时显示迭代进度和状态 |
| 7. 测试和验证 | ⏳ | 待用户测试 |

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        用户请求                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              assistantResponse.ts                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. 检测 Agentic 模式 (有 @aether/file-editor?)      │   │
│  │ 2. 启动 AgenticLoopService.startLoop()             │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agentic 循环 (while loop)                   │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Loop Start:                                       │      │
│  │ • startIteration() - 迭代计数                     │      │
│  │ • sendChatMessage() - 调用 AI                     │      │
│  │ • collectToolResults() - 收集工具结果              │      │
│  │ • 检查 attempt_completion                         │      │
│  │ • processToolResult() - 更新状态                  │      │
│  │ • buildMessagesWithToolResults() - 构建新消息      │      │
│  │ • shouldContinue() - 检查是否继续                 │      │
│  └──────────────────────────────────────────────────┘      │
│                         │                                     │
│                    ┌────┴────┐                               │
│                    │ 继续? │                                │
│                    └────┬────┘                               │
│                         │                                     │
│              ┌──────────┴──────────┐                         │
│              ▼                      ▼                         │
│           是，继续              否，结束                       │
└─────────────┬──────────────────────┬──────────────────────────┘
              │                      │
              ▼                      ▼
        下一次迭代            endLoop() 清理状态
```

## 核心组件

### 1. attempt_completion 工具

**文件：** `src/shared/services/mcp/servers/FileEditorServer.ts`

```typescript
const ATTEMPT_COMPLETION_TOOL: Tool = {
  name: 'attempt_completion',
  description: '当你认为已经完成了用户的任务时，使用此工具来结束任务...',
  inputSchema: {
    properties: {
      result: { type: 'string', description: '任务完成摘要' },
      command: { type: 'string', description: '建议执行的命令（可选）' }
    },
    required: ['result']
  }
};
```

**特点：**
- 返回特殊标记 `__agentic_completion__: true`
- AgenticLoopService 检测此标记后终止循环
- 可选返回建议执行的命令

### 2. AgenticLoopService

**文件：** `src/shared/services/AgenticLoopService.ts`

```typescript
class AgenticLoopService extends EventEmitter {
  // 配置
  config: {
    maxIterations: 25,              // 最大迭代次数
    consecutiveMistakeLimit: 3,     // 连续错误限制
    enabledMCPServers: ['@aether/file-editor']
  }
  
  // 核心方法
  startLoop(topicId: string)                          // 开始循环
  startIteration(): number                            // 开始新迭代
  processToolResult(result: ToolCallResult)           // 处理工具结果
  shouldContinue(): boolean                           // 检查是否继续
  isCompletionSignal(toolResult: any): boolean        // 检测完成信号
  endLoop(): AgenticLoopState                         // 结束循环
  
  // 事件
  on('iteration:start', (iteration) => {})
  on('iteration:end', (iteration, result) => {})
  on('complete', (state) => {})
  on('mistake', (count, limit) => {})
}
```

**状态管理：**
- `isAgenticMode` - 是否处于 Agentic 模式
- `currentIteration` - 当前迭代次数
- `consecutiveMistakeCount` - 连续错误次数
- `isComplete` - 是否已完成
- `completionReason` - 完成原因

### 3. 循环逻辑实现

**文件：** `src/shared/store/thunks/message/assistantResponse.ts`

**关键修改：**

```typescript
// 1. 检测并启动 Agentic 模式
const shouldEnableAgentic = agenticLoopService.shouldEnableAgenticMode(enabledServerNames);
if (shouldEnableAgentic) {
  agenticLoopService.startLoop(topicId);
}

// 2. Agentic 循环
let shouldContinueLoop = true;
while (shouldContinueLoop) {
  // 开始新迭代
  agenticLoopService.startIteration();
  
  // 调用 AI
  response = await apiProvider.sendChatMessage(...);
  
  // 收集工具结果
  const toolResults = await collectToolResults(messageId);
  
  // 检查完成信号
  if (hasCompletion) {
    agenticLoopService.processToolResult(...);
    break;
  }
  
  // 检查是否继续
  if (!agenticLoopService.shouldContinue()) {
    break;
  }
  
  // 将工具结果发回 AI
  currentMessagesToSend = await buildMessagesWithToolResults(...);
}
```

**辅助函数：**
- `collectToolResults()` - 从 Redux 收集工具调用结果
- `buildMessagesWithToolResults()` - 构建包含工具结果的消息（支持 Gemini/OpenAI 格式）

### 4. 模式检测

**文件：** `src/shared/services/mcp/core/MCPService.ts`

```typescript
// 检查是否应该启用 Agentic 模式
public shouldEnableAgenticMode(): boolean {
  return this.hasActiveServer('@aether/file-editor');
}
```

### 5. 系统提示词

**文件：** `src/shared/utils/mcpPrompt.ts`

**新增内容：**
```markdown
## Agentic Mode - Task Completion

When file editing tools are enabled, you are operating in **Agentic Mode**.

**CRITICAL: Task Completion Protocol**

When you have completed the user's task, you MUST call the attempt_completion tool:

<tool_use>
  <name>attempt_completion</name>
  <arguments>{"result": "Brief summary of what you accomplished"}</arguments>
</tool_use>

**When to call attempt_completion:**
✅ After successfully completing all requested file edits
✅ After verifying your changes are correct
...
```

### 6. UI 状态显示

**文件：**
- `src/components/Chat/AgenticLoopIndicator.tsx` - React 组件
- `src/components/Chat/AgenticLoopIndicator.css` - 样式

**功能：**
- 实时显示迭代次数和进度
- 显示连续错误计数
- 不同状态的颜色和图标
- 完成后显示摘要和建议命令
- 自动隐藏（完成后2秒）
- 支持暗黑模式和移动端

## 终止条件

Agentic 循环会在以下情况终止：

| 条件 | 原因代码 | 说明 |
|------|----------|------|
| AI 调用 attempt_completion | `attempt_completion` | AI 认为任务完成 ✅ |
| 达到最大迭代次数 | `max_iterations_reached` | 25次迭代限制 |
| 连续错误过多 | `consecutive_mistakes` | 连续3次错误 |
| 没有工具调用 | (自动) | AI 没有调用任何工具 |
| 用户取消 | `user_cancelled` | 用户主动取消 |
| 发生错误 | `error` | 系统错误 |

## 消息格式支持

### Gemini 格式

```json
{
  "role": "function",
  "parts": [{
    "functionResponse": {
      "name": "tool_name",
      "response": {
        "content": "tool result"
      }
    }
  }]
}
```

### OpenAI 格式

```json
{
  "role": "tool",
  "tool_call_id": "call_xxx",
  "content": "tool result"
}
```

## 使用场景

### 适用场景

✅ 多文件编辑任务
✅ 需要读取-修改-验证的工作流
✅ 复杂的代码重构
✅ 文件搜索和批量操作
✅ 项目结构分析和修改

### 不适用场景

❌ 简单的单次操作
❌ 纯对话交互（无需工具）
❌ 实时性要求极高的场景
❌ 需要用户每步确认的操作

## 配置选项

### AgenticLoopService 配置

```typescript
const agenticLoopService = new AgenticLoopService({
  maxIterations: 25,                          // 最大迭代次数
  consecutiveMistakeLimit: 3,                 // 连续错误限制
  enabledMCPServers: ['@aether/file-editor']  // 启用的 MCP 服务器
});
```

### 修改默认配置

```typescript
// 运行时更新
agenticLoopService.updateConfig({
  maxIterations: 30,
  consecutiveMistakeLimit: 5
});
```

## 集成指南

### 1. 启用 @aether/file-editor MCP

在 MCP 设置中启用内置的 `@aether/file-editor` 服务器。

### 2. 集成 UI 组件

在聊天页面添加：

```typescript
import { AgenticLoopIndicator } from '@/components/Chat/AgenticLoopIndicator';

function ChatPage() {
  return (
    <div>
      {/* 聊天内容 */}
      <AgenticLoopIndicator />
    </div>
  );
}
```

### 3. 测试

发送需要多步操作的任务，例如：
```
请帮我创建一个新的 React 组件 TodoList.tsx，包含基本的增删改查功能
```

观察：
- UI 指示器显示迭代进度
- AI 连续调用多个工具
- 最终调用 attempt_completion 结束

## 监控和调试

### 日志标识

所有 Agentic 相关日志使用 `[Agentic]` 前缀：

```typescript
console.log(`[Agentic] 开始第 ${iteration} 次迭代`);
console.log(`[Agentic] 检测到 attempt_completion，任务完成`);
console.log(`[Agentic] 循环终止条件满足，结束循环`);
```

### 状态查询

```typescript
// 获取当前状态
const state = agenticLoopService.getState();
console.log('当前迭代:', state.currentIteration);
console.log('是否完成:', state.isComplete);
console.log('完成原因:', state.completionReason);

// 获取统计信息
const stats = agenticLoopService.getStats();
console.log('统计:', stats);
```

### 事件监听

```typescript
// 监听迭代开始
agenticLoopService.on('iteration:start', (iteration) => {
  console.log(`迭代 ${iteration} 开始`);
});

// 监听完成
agenticLoopService.on('complete', (state) => {
  console.log('循环完成:', state.completionReason);
});

// 监听错误
agenticLoopService.on('mistake', (count, limit) => {
  console.warn(`连续错误: ${count}/${limit}`);
});
```

## 性能考虑

### 优化点

1. **迭代限制** - 默认25次，防止无限循环
2. **错误限制** - 连续3次错误后终止
3. **自动终止** - 无工具调用时自动结束
4. **UI 延迟隐藏** - 完成后2秒自动隐藏

### 潜在问题

- **Token 消耗** - 多轮对话会消耗更多 tokens
- **延迟累积** - 每次迭代都需要 API 调用
- **状态同步** - Redux 状态更新频繁

## 测试清单

### 功能测试

- [ ] Agentic 模式自动检测
- [ ] 工具结果正确回传
- [ ] attempt_completion 正确终止
- [ ] 达到迭代限制时终止
- [ ] 连续错误后终止
- [ ] 无工具调用时终止
- [ ] UI 指示器正确显示

### 兼容性测试

- [ ] Gemini 格式消息
- [ ] OpenAI 格式消息
- [ ] 移动端显示
- [ ] 暗黑模式

### 压力测试

- [ ] 长时间运行（接近25次迭代）
- [ ] 频繁错误场景
- [ ] 多个并发会话

## 已知问题

暂无

## 未来增强

- [ ] 用户可暂停/继续循环
- [ ] 更详细的执行日志查看
- [ ] 循环历史记录
- [ ] 自定义迭代限制（UI 设置）
- [ ] 性能优化（工具结果缓存）
- [ ] 多 Agent 协作支持

## 参考资料

- [Roo-Code 项目](../参考项目/Roo-Code-main/)
- [实现文档 - assistantResponse 修改指南](../implementation/agentic-loop-assistantResponse-guide.md)
- [实现文档 - UI 集成指南](../implementation/agentic-loop-ui-integration.md)
- [分析文档 - Roo-Code 迭代流程分析](../analysis/roocode-tool-iteration-flow-analysis.md)

## 贡献者

- 实现日期：2024-12-02
- 版本：v1.0.0
