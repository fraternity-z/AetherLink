# Roo-Code 工具调用迭代流程分析

## 概述

本文档详细分析了 Roo-Code 项目中工具调用和迭代的完整流程。Roo-Code 是一个 VS Code 扩展，它使用 LLM（大语言模型）来执行各种开发任务，通过工具调用实现与系统的交互。

## 核心组件架构

```mermaid
graph TB
    subgraph 核心组件
        Task[Task.ts - 任务管理器]
        BaseTool[BaseTool.ts - 工具基类]
        Present[presentAssistantMessage.ts - 消息处理器]
        Parser[AssistantMessageParser.ts - XML解析器]
        NativeParser[NativeToolCallParser.ts - Native协议解析器]
    end
    
    subgraph 工具层
        ReadFile[ReadFileTool]
        WriteFile[WriteToFileTool]
        ApplyDiff[ApplyDiffTool]
        ExecuteCmd[ExecuteCommandTool]
        Browser[BrowserActionTool]
        MCP[UseMcpToolTool]
        OtherTools[其他工具...]
    end
    
    Task --> Present
    Present --> BaseTool
    BaseTool --> ReadFile
    BaseTool --> WriteFile
    BaseTool --> ApplyDiff
    BaseTool --> ExecuteCmd
    BaseTool --> Browser
    BaseTool --> MCP
    BaseTool --> OtherTools
    Task --> Parser
    Task --> NativeParser
```

## 完整迭代流程

### 1. 任务启动阶段

```mermaid
sequenceDiagram
    participant User as 用户
    participant Provider as ClineProvider
    participant Task as Task
    participant API as LLM API
    
    User->>Provider: 发送任务消息
    Provider->>Task: new Task 或 createTask
    Task->>Task: startTask 或 resumeTaskFromHistory
    Task->>Task: initiateTaskLoop
    Task->>API: 构建系统提示词 + 用户消息
```

### 2. 主循环流程

[`Task.ts`](docs/参考项目/Roo-Code-main/src/core/task/Task.ts:2003) 中的 `initiateTaskLoop` 方法是入口：

```typescript
private async initiateTaskLoop(userContent: Anthropic.Messages.ContentBlockParam[]): Promise<void> {
    // 初始化检查点服务
    getCheckpointService(this)
    
    let nextUserContent = userContent
    let includeFileDetails = true
    
    this.emit(RooCodeEventName.TaskStarted)
    
    while (!this.abort) {
        // 递归调用 LLM 获取响应
        const didEndLoop = await this.recursivelyMakeClineRequests(nextUserContent, includeFileDetails)
        includeFileDetails = false
        
        if (didEndLoop) {
            break
        } else {
            // 如果模型没有使用工具，提示它使用工具或完成任务
            nextUserContent = [{ type: "text", text: formatResponse.noToolsUsed(toolProtocol) }]
            this.consecutiveMistakeCount++
        }
    }
}
```

### 3. 递归请求流程

```mermaid
flowchart TD
    A[recursivelyMakeClineRequests] --> B{是否中止?}
    B -->|是| C[抛出错误]
    B -->|否| D[检查连续错误限制]
    D --> E[处理子任务暂停]
    E --> F[构建用户消息内容]
    F --> G[添加环境详情]
    G --> H[调用 attemptApiRequest]
    H --> I[流式处理 API 响应]
    I --> J{响应类型?}
    
    J -->|reasoning| K[更新推理消息]
    J -->|usage| L[更新token使用]
    J -->|text| M[解析文本内容]
    J -->|tool_call| N[处理工具调用]
    J -->|tool_call_partial| O[处理流式工具调用]
    
    M --> P[presentAssistantMessage]
    N --> P
    O --> P
    
    P --> Q{是否完成?}
    Q -->|否| R[等待更多内容]
    R --> I
    Q -->|是| S[收集工具结果]
    S --> T{是否有工具使用?}
    T -->|是| U[将结果加入 userMessageContent]
    U --> V[推入栈继续循环]
    T -->|否| W[提示使用工具]
    W --> V
    V --> A
```

### 4. API 请求与流处理

[`Task.ts`](docs/参考项目/Roo-Code-main/src/core/task/Task.ts:3320) 中的 `attemptApiRequest` 方法：

```typescript
public async *attemptApiRequest(retryAttempt: number = 0): ApiStream {
    // 1. 应用速率限制
    // 2. 获取系统提示词
    // 3. 管理上下文（压缩、截断）
    // 4. 检查自动审批限制
    // 5. 构建工具列表（Native协议）
    // 6. 创建消息流
    const stream = this.api.createMessage(systemPrompt, cleanConversationHistory, metadata)
    
    // 7. 等待第一个chunk（处理重试逻辑）
    const firstChunk = await iterator.next()
    yield firstChunk.value
    
    // 8. 继续yield后续chunks
    yield* iterator
}
```

### 5. 消息呈现与工具执行

[`presentAssistantMessage.ts`](docs/参考项目/Roo-Code-main/src/core/assistant-message/presentAssistantMessage.ts:61) 是核心处理函数：

```mermaid
flowchart TD
    A[presentAssistantMessage] --> B{是否锁定?}
    B -->|是| C[标记有待处理更新]
    C --> D[返回]
    B -->|否| E[加锁]
    E --> F{内容索引是否越界?}
    F -->|是| G{流是否完成?}
    G -->|是| H[设置 userMessageContentReady = true]
    F -->|否| I[克隆当前块]
    I --> J{块类型?}
    
    J -->|text| K[处理文本块]
    J -->|tool_use| L[处理工具调用]
    J -->|mcp_tool_use| M[处理MCP工具调用]
    
    K --> N[say text 到 UI]
    
    L --> O{是否已拒绝工具?}
    O -->|是| P[跳过并记录错误]
    O -->|否| Q{是否已使用工具?}
    Q -->|是| R[跳过并记录错误]
    Q -->|否| S[验证工具使用]
    S --> T[检查工具重复]
    T --> U[执行对应工具]
    
    U --> V[tool.handle]
    V --> W[收集工具结果]
    W --> X[pushToolResult]
    
    X --> Y[解锁]
    Y --> Z{块是否完成?}
    Z -->|是| AA[增加索引]
    AA --> AB{还有更多块?}
    AB -->|是| AC[递归调用自身]
    AB -->|否| AD{流完成?}
    AD -->|是| AE[设置 ready = true]
```

### 6. 工具基类设计

[`BaseTool.ts`](docs/参考项目/Roo-Code-main/src/core/tools/BaseTool.ts:44) 定义了统一的工具接口：

```typescript
export abstract class BaseTool<TName extends ToolName> {
    // 工具名称
    abstract readonly name: TName
    
    // XML协议参数解析
    abstract parseLegacy(params: Partial<Record<string, string>>): ToolParams<TName>
    
    // 工具执行逻辑
    abstract execute(params: ToolParams<TName>, task: Task, callbacks: ToolCallbacks): Promise<void>
    
    // 处理流式部分消息（可选）
    async handlePartial(task: Task, block: ToolUse<TName>): Promise<void> { }
    
    // 主入口：统一处理两种协议
    async handle(task: Task, block: ToolUse<TName>, callbacks: ToolCallbacks): Promise<void> {
        // 1. 处理部分消息
        if (block.partial) {
            await this.handlePartial(task, block)
            return
        }
        
        // 2. 解析参数
        let params: ToolParams<TName>
        if (block.nativeArgs !== undefined) {
            // Native协议：直接使用类型化参数
            params = block.nativeArgs as ToolParams<TName>
        } else {
            // XML协议：解析字符串参数
            params = this.parseLegacy(block.params)
        }
        
        // 3. 执行工具
        await this.execute(params, task, callbacks)
    }
}
```

### 7. 工具回调机制

每个工具执行时会收到一组回调函数：

```typescript
interface ToolCallbacks {
    // 请求用户审批
    askApproval: (type: ClineAsk, partialMessage?: string, progressStatus?: ToolProgressStatus) => Promise<boolean>
    
    // 处理错误
    handleError: (action: string, error: Error) => Promise<void>
    
    // 推送工具结果
    pushToolResult: (content: ToolResponse) => void
    
    // 移除流式中的闭合标签
    removeClosingTag: (tag: string, text?: string) => string
    
    // 工具协议类型
    toolProtocol: ToolProtocol
}
```

### 8. 协议支持

Roo-Code 支持两种工具协议：

#### XML 协议
```xml
<read_file>
<path>src/main.ts</path>
</read_file>
```

#### Native 协议
```json
{
  "type": "tool_use",
  "id": "call_123",
  "name": "read_file",
  "input": {
    "files": [{"path": "src/main.ts"}]
  }
}
```

协议选择逻辑：
- 如果 `block.id` 存在 → Native 协议
- 如果 `block.id` 不存在 → XML 协议

### 9. 工具结果收集

工具执行完成后，结果通过 `pushToolResult` 收集：

```typescript
const pushToolResult = (content: ToolResponse) => {
    if (toolProtocol === TOOL_PROTOCOL.NATIVE) {
        // Native协议：创建 tool_result 块
        cline.userMessageContent.push({
            type: "tool_result",
            tool_use_id: toolCallId,
            content: resultContent,
        })
    } else {
        // XML协议：创建 text 块
        cline.userMessageContent.push({
            type: "text",
            text: `${toolDescription()} Result:`
        })
        cline.userMessageContent.push({
            type: "text",
            text: content
        })
    }
    
    // 标记工具已使用
    cline.didAlreadyUseTool = true
}
```

### 10. 迭代终止条件

循环在以下情况下终止：

1. **用户中止** - `this.abort = true`
2. **任务完成** - `attempt_completion` 工具被调用并通过审批
3. **达到最大请求限制** - 用户拒绝重置计数
4. **上下文窗口超限** - 重试次数超过 `MAX_CONTEXT_WINDOW_RETRIES`

## 完整时序图

```mermaid
sequenceDiagram
    participant U as 用户
    participant T as Task
    participant A as API Handler
    participant P as presentAssistantMessage
    participant BT as BaseTool
    participant Tool as 具体工具

    U->>T: startTask
    T->>T: initiateTaskLoop
    
    loop 主循环
        T->>T: recursivelyMakeClineRequests
        T->>A: attemptApiRequest
        A-->>T: 流式响应
        
        loop 流处理
            T->>T: 解析chunk
            alt text chunk
                T->>P: presentAssistantMessage
                P->>P: 显示文本
            else tool_call chunk
                T->>P: presentAssistantMessage
                P->>P: 验证工具
                P->>BT: tool.handle
                BT->>BT: 解析参数
                BT->>Tool: execute
                Tool->>Tool: 执行操作
                Tool-->>U: askApproval
                U-->>Tool: 审批结果
                Tool-->>BT: 返回结果
                BT-->>P: pushToolResult
            end
        end
        
        T->>T: 收集 userMessageContent
        
        alt 有工具使用
            T->>T: 继续循环
        else 无工具使用
            T->>T: 提示使用工具
        end
        
        alt attempt_completion
            T->>T: 结束循环
        end
    end
    
    T-->>U: 任务完成
```

## 关键状态管理

| 状态变量 | 作用 | 更新时机 |
|---------|------|---------|
| `isStreaming` | 是否正在流式接收 | API请求开始/结束 |
| `didCompleteReadingStream` | 流是否完成 | 流结束时设为true |
| `userMessageContentReady` | 用户消息是否准备好 | 所有块处理完成时设为true |
| `didRejectTool` | 用户是否拒绝了工具 | askApproval返回false时 |
| `didAlreadyUseTool` | 是否已使用工具 | pushToolResult后 |
| `currentStreamingContentIndex` | 当前处理的块索引 | 块处理完成后递增 |
| `presentAssistantMessageLocked` | 消息处理是否锁定 | 进入/退出presentAssistantMessage |

## 总结

Roo-Code 的工具调用迭代流程是一个精心设计的状态机：

1. **任务驱动** - Task 类管理整个生命周期
2. **流式处理** - 支持实时流式响应处理
3. **协议兼容** - 同时支持 XML 和 Native 两种协议
4. **工具抽象** - BaseTool 提供统一的工具接口
5. **审批机制** - 所有敏感操作需要用户审批
6. **错误恢复** - 支持自动重试和上下文压缩
7. **检查点** - 文件修改前自动保存检查点

这种设计使得 Roo-Code 能够安全、可靠地执行 AI 代理任务，同时保持良好的用户体验和可扩展性。