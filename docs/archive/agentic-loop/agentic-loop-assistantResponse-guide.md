# Agentic Loop - assistantResponse.ts 修改指南

> ✅ **实现状态**: 已完成 (2024-12-02)

## 概述

本文档说明如何修改 `src/shared/store/thunks/message/assistantResponse.ts` 实现 Agentic 循环功能。

## 实现进度

| 步骤 | 说明 | 状态 |
|------|------|------|
| 1 | 导入 AgenticLoopService | ✅ 已完成 |
| 2 | 添加 Agentic 模式检测逻辑 | ✅ 已完成 |
| 3 | 修改 API 请求流程，添加循环逻辑 | ✅ 已完成 |
| 4 | 实现 collectToolResults 辅助函数 | ✅ 已完成 |
| 5 | 实现 buildMessagesWithToolResults 辅助函数 | ✅ 已完成 |
| 6 | 添加错误处理中的 Agentic 循环取消逻辑 | ✅ 已完成 |

## 核心改动点

### 1. 导入 AgenticLoopService ✅

```typescript
// 在文件顶部添加（第27行）
import { agenticLoopService } from '../../../services/AgenticLoopService';
```

> 💡 同时导入了 `store` 用于辅助函数访问 Redux 状态，以及 `ToolMessageBlock` 类型。

### 2. 修改 processAssistantResponse 函数签名

**当前代码：**
```typescript
export const processAssistantResponse = async (
  dispatch: AppDispatch,
  _getState: () => RootState,
  assistantMessage: Message,
  topicId: string,
  model: Model,
  toolsEnabled?: boolean
) => {
  // ...
}
```

**无需修改函数签名，但需要在内部添加 Agentic 逻辑**

### 3. 在函数开始处检查并启动 Agentic 循环 ✅

**位置：** 在第 4 步 "获取 MCP 工具" 之后（约第 108-120 行）

```typescript
// 🔄 4.1 检测并启动 Agentic 模式
const enabledServerNames = mcpTools
  .map(tool => tool.serverName)
  .filter((name, index, self): name is string => !!name && self.indexOf(name) === index);

const shouldEnableAgentic = agenticLoopService.shouldEnableAgenticMode(enabledServerNames);

if (shouldEnableAgentic) {
  console.log(`[Agentic] 检测到 @aether/file-editor，启用 Agentic 模式`);
  agenticLoopService.startLoop(topicId);
}
```

> 💡 使用类型谓词 `name is string` 确保过滤后的数组类型正确。

### 4. 修改 API 请求流程，添加循环逻辑

**位置：** 在调用 `responseHandler.processStream()` 之后

**当前代码结构：**
```typescript
try {
  // 省略前面的代码...
  
  // 处理流式响应
  await responseHandler.processStream(
    stream,
    {
      model: model,
      apiKey: provider.apiKey,
      requestId: assistantMessage.id,
      messages: finalMessages,
      controller,
      provider: apiProvider
    },
    mcpTools
  );
  
  // 流处理完成后的状态更新
  dispatch(newMessagesActions.updateMessage({
    id: assistantMessage.id,
    changes: { status: AssistantMessageStatus.COMPLETE }
  }));
  
  // 保存最终状态
  await dexieStorage.updateMessage(assistantMessage.id, {
    status: AssistantMessageStatus.COMPLETE,
    updatedAt: new Date().toISOString()
  });
  
} catch (error) {
  // 错误处理...
}
```

**实际实现：** ✅

```typescript
// 🔄 Agentic 循环 (约第 450-540 行)
let shouldContinueLoop = true;

while (shouldContinueLoop) {
  // 🔄 开始新迭代
  if (agenticLoopService.getState().isAgenticMode) {
    const iteration = agenticLoopService.startIteration();
    console.log(`[Agentic] 开始第 ${iteration} 次迭代`);
  }

  // 调用 API (使用 sendChatMessage)
  response = await apiProvider.sendChatMessage(
    currentMessagesToSend as any,
    {
      onChunk: async (chunk) => {
        await responseHandler.handleChunk(chunk);
      },
      enableTools: toolsEnabled !== false || !!webSearchTool,
      mcpTools: allTools,
      mcpMode: mcpMode,
      abortSignal: abortController.signal,
      assistant: assistant,
      systemPrompt: isActualGeminiProvider ? systemPromptForProvider : undefined
    }
  );

  // 🔄 检查是否在 Agentic 模式
  if (!agenticLoopService.getState().isAgenticMode) {
    shouldContinueLoop = false;
    break;
  }

  // 🔄 收集工具调用结果
  const toolResults = await collectToolResults(assistantMessage.id);
  
  // 如果没有工具调用结果，说明 AI 没有调用任何工具，结束循环
  if (toolResults.length === 0) {
    console.log(`[Agentic] 没有工具调用，结束循环`);
    shouldContinueLoop = false;
    break;
  }

  // 🔄 检查是否有完成信号 (attempt_completion)
  const hasCompletion = toolResults.some(result =>
    agenticLoopService.isCompletionSignal(result)
  );
  
  if (hasCompletion) {
    const completionResult = toolResults.find(result =>
      agenticLoopService.isCompletionSignal(result)
    );
    
    agenticLoopService.processToolResult({
      toolName: 'attempt_completion',
      success: true,
      isCompletion: true,
      content: completionResult
    });
    
    console.log(`[Agentic] 检测到 attempt_completion，任务完成`);
    shouldContinueLoop = false;
    break;
  }

  // 🔄 处理工具结果
  for (const result of toolResults) {
    agenticLoopService.processToolResult({
      toolName: result.toolName || 'unknown',
      success: !result.isError,
      isCompletion: false,
      content: result.content,
      error: result.error?.message
    });
  }

  // 🔄 检查是否应该继续
  if (!agenticLoopService.shouldContinue()) {
    console.log(`[Agentic] 循环终止条件满足，结束循环`);
    shouldContinueLoop = false;
    break;
  }

  // 🔄 将工具结果添加到消息历史，继续下一轮
  console.log(`[Agentic] 工具执行完成，将结果发回 AI 继续下一轮`);
  currentMessagesToSend = await buildMessagesWithToolResults(
    currentMessagesToSend,
    toolResults,
    isActualGeminiProvider
  );
}

// 🔄 结束 Agentic 循环
if (agenticLoopService.getState().isAgenticMode) {
  const finalState = agenticLoopService.endLoop();
  console.log(`[Agentic] 循环结束:`, {
    totalIterations: finalState.currentIteration,
    completionReason: finalState.completionReason,
    hasCompletionResult: !!finalState.completionResult
  });
}
```

**错误处理：** ✅

```typescript
} catch (error: any) {
  // 🔄 错误时取消 Agentic 循环
  if (agenticLoopService.getState().isAgenticMode) {
    agenticLoopService.cancel();
    console.log(`[Agentic] 由于错误取消循环`);
  }
  // ... 原有错误处理
}
```

### 5. 添加辅助函数 ✅

在文件末尾（约第 530-605 行）添加了以下辅助函数：

```typescript
// ==================== Agentic 循环辅助函数 ====================

/**
 * 工具调用结果类型
 */
interface ToolCallResultInfo {
  toolName: string;
  content: any;
  isError: boolean;
  error?: { message: string };
  _meta?: { isCompletion?: boolean };
}

/**
 * 收集消息的工具调用结果
 */
async function collectToolResults(messageId: string): Promise<ToolCallResultInfo[]> {
  const state = store.getState();
  const message = state.messages.entities[messageId];
  
  if (!message?.blocks) {
    return [];
  }
  
  const toolBlocks = message.blocks
    .map(blockId => state.messageBlocks.entities[blockId])
    .filter((block): block is ToolMessageBlock =>
      block?.type === MessageBlockType.TOOL
    );
  
  return toolBlocks.map(block => ({
    toolName: block.toolName || 'unknown',
    content: block.content,
    isError: block.status === MessageBlockStatus.ERROR,
    error: block.error ? { message: String(block.error.message || block.error) } : undefined,
    _meta: block.metadata?._meta as { isCompletion?: boolean } | undefined
  }));
}

/**
 * 构建包含工具结果的消息数组
 * 支持 Gemini 和 OpenAI 两种消息格式
 */
async function buildMessagesWithToolResults(
  previousMessages: any[],
  toolResults: ToolCallResultInfo[],
  isGeminiFormat: boolean
): Promise<any[]> {
  const toolResultMessages: any[] = [];
  
  for (const result of toolResults) {
    if (isGeminiFormat) {
      // Gemini 格式
      toolResultMessages.push({
        role: 'function',
        parts: [{
          functionResponse: {
            name: result.toolName,
            response: {
              content: result.isError
                ? `Error: ${result.error?.message || 'Unknown error'}`
                : (typeof result.content === 'string' ? result.content : JSON.stringify(result.content))
            }
          }
        }]
      });
    } else {
      // OpenAI 格式
      toolResultMessages.push({
        role: 'tool',
        tool_call_id: `call_${result.toolName}_${Date.now()}`,
        content: result.isError
          ? `Error: ${result.error?.message || 'Unknown error'}`
          : (typeof result.content === 'string' ? result.content : JSON.stringify(result.content))
      });
    }
  }
  
  return [...previousMessages, ...toolResultMessages];
}
```

## 关键要点

1. **循环条件**：只有启用 @aether/file-editor MCP 时才进入 Agentic 模式
2. **终止条件**：
   - AI 调用 `attempt_completion` 工具
   - 达到最大迭代次数（25次）
   - 连续错误超过限制（3次）
   - 用户取消
   - **新增**: 没有工具调用时自动结束
3. **工具结果处理**：每次工具执行后，结果需要发回给 AI
4. **状态同步**：确保 Redux 和数据库状态正确更新
5. **消息格式兼容**：同时支持 Gemini 和 OpenAI 格式的工具结果

## 测试要点

1. ✅ 非 Agentic 模式下正常工作（向后兼容）
2. ⏳ Agentic 模式下能正确循环
3. ⏳ attempt_completion 能正确终止循环
4. ⏳ 达到迭代限制时能正确终止
5. ✅ 错误处理正确，不会陷入死循环
6. ⏳ 工具结果正确发回 AI 进行下一轮处理

## 注意事项

- 这个改动比较复杂，建议分步测试
- 需要确保消息格式兼容性
- 注意性能，避免过多的数据库操作
- 循环中要有足够的日志输出，方便调试

## 后续优化建议

1. **UI 反馈**: 添加 Agentic 循环进度指示器
2. **用户控制**: 实现循环暂停/继续功能
3. **性能优化**: 考虑工具结果的增量更新
4. **日志增强**: 添加更详细的调试日志用于问题排查
