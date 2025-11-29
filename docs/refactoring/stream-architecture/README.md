# 流式输出架构重构计划

> 基于参考项目 参考项目 的架构分析，制定流式/非流式输出链路优化方案

## 📋 重构目标

1. **消除冗余代码** - 删除未使用的文件和重复逻辑
2. **统一回调机制** - 从双回调（onUpdate + onChunk）迁移到单一回调（onChunk）
3. **简化处理层次** - 减少响应处理的嵌套层级
4. **提升可维护性** - 代码结构更清晰，职责更明确

## 🏗️ 当前架构问题

### 问题 1：完全未使用的 ResponseHandler 类
- **文件**: `src/shared/api/openai/responseHandler.ts` (320行)
- **状态**: 在 `provider.ts` 中被注释掉，从未调用
- **影响**: 代码冗余，增加维护成本

### 问题 2：两个流式处理方法 90% 代码重复
- **文件**: `src/shared/api/openai/provider.ts`
- **方法**: 
  - `handleStreamResponse()` (行 542-639)
  - `handleStreamResponseWithoutCallback()` (行 651-747)
- **影响**: 修改一处必须同步修改另一处

### 问题 3：双回调机制混乱
- **位置**: `src/shared/store/thunks/message/assistantResponse.ts:369-388`
- **问题**: 同时传递 `onUpdate` 和 `onChunk`，职责重叠
- **影响**: 可能导致双重处理，数据流不清晰

### 问题 4：handleStringContent 中冗余的 JSON 解析
- **文件**: `src/shared/services/messages/ResponseHandler.ts:147-163`
- **问题**: JSON 解析逻辑几乎不会被触发
- **影响**: 增加不必要的 try-catch 开销

### 问题 5：名称冲突
- `api/openai/responseHandler.ts` 的 `createResponseHandler`
- `services/messages/ResponseHandler.ts` 的 `createResponseHandler`
- **影响**: 容易混淆，难以理解

## 📊 重构阶段

### Phase 1: 清理未使用代码 (低风险)
**预计时间**: 1小时

| 任务 | 文件 | 操作 |
|------|------|------|
| 1.1 | `src/shared/api/openai/responseHandler.ts` | 删除整个文件 |
| 1.2 | `src/shared/api/openai/index.ts` | 移除相关导出 |
| 1.3 | `src/shared/api/openai/provider.ts` | 移除注释掉的 import |

**验证方式**: 全局搜索确认无引用后删除，运行构建确保无报错

---

### Phase 2: 合并重复的流式处理方法 (中风险)
**预计时间**: 2小时

#### 2.1 合并 `handleStreamResponse` 和 `handleStreamResponseWithoutCallback`

**目标文件**: `src/shared/api/openai/provider.ts`

**重构方案**:
```typescript
// 合并后的方法签名
private async handleStreamResponseUnified(
  params: any,
  options: {
    onUpdate?: (content: string, reasoning?: string) => void;
    onChunk?: (chunk: Chunk) => void;
    enableTools?: boolean;
    mcpTools?: MCPTool[];
    abortSignal?: AbortSignal;
  }
): Promise<string | StreamProcessingResult>
```

**验证方式**: 
- 测试流式输出功能
- 测试非流式输出功能
- 测试工具调用循环

---

### Phase 3: 统一回调机制 (高风险)
**预计时间**: 4小时

#### 3.1 废弃 `onUpdate` 回调

**涉及文件**:
- `src/shared/store/thunks/message/assistantResponse.ts`
- `src/shared/api/openai/provider.ts`
- `src/shared/api/openai/unifiedStreamProcessor.ts`
- `src/shared/services/messages/ResponseHandler.ts`

**迁移策略**:
1. 将 `onUpdate` 的调用方转换为使用 `onChunk`
2. 在 `UnifiedStreamProcessor` 中只使用 `onChunk`
3. 移除 `handleStringContent` 的 JSON 解析逻辑

**兼容方案**:
```typescript
// 临时兼容层 - 将 onUpdate 转换为 onChunk
if (onUpdate && !onChunk) {
  onChunk = (chunk) => {
    if (chunk.type === ChunkType.TEXT_DELTA) {
      onUpdate(chunk.text, '');
    } else if (chunk.type === ChunkType.THINKING_DELTA) {
      onUpdate('', chunk.text);
    }
  };
}
```

**验证方式**:
- 测试普通对话流式输出
- 测试带思考过程的模型（DeepSeek-R1等）
- 测试模型组合功能

---

### Phase 4: 简化 ResponseHandler (中风险)
**预计时间**: 2小时

#### 4.1 简化 `handleStringContent`

**目标文件**: `src/shared/services/messages/ResponseHandler.ts`

**当前代码** (问题):
```typescript
async handleStringContent(content: string, reasoning?: string): Promise<string> {
  // 检查消息状态...
  // 检查对比结果...
  try {
    if (reasoning?.trim()) {
      // 处理推理...
    } else {
      // 尝试解析JSON格式 ← 冗余
      try {
        const parsed = JSON.parse(content);
        // ...
      } catch {
        // 不是JSON
      }
      // 处理文本...
    }
  } catch (error) {
    // ...
  }
}
```

**重构后**:
```typescript
async handleStringContent(content: string, reasoning?: string): Promise<string> {
  if (this.isMessageComplete()) {
    return chunkProcessor.content;
  }

  if (reasoning?.trim()) {
    await this.handleChunk({
      type: ChunkType.THINKING_DELTA,
      text: reasoning,
      thinking_millsec: 0
    });
  }
  
  if (content?.trim()) {
    await this.handleChunk({
      type: ChunkType.TEXT_DELTA,
      text: content
    });
  }

  return chunkProcessor.content;
}
```

---

## 📁 文件变更清单

### 删除文件
- [ ] `src/shared/api/openai/responseHandler.ts`

### 修改文件
- [ ] `src/shared/api/openai/index.ts` - 移除 responseHandler 导出
- [ ] `src/shared/api/openai/provider.ts` - 合并流式处理方法
- [ ] `src/shared/store/thunks/message/assistantResponse.ts` - 统一回调
- [ ] `src/shared/services/messages/ResponseHandler.ts` - 简化处理逻辑
- [ ] `src/shared/api/openai/unifiedStreamProcessor.ts` - 移除 onUpdate 支持

### 新增文件
- [ ] `docs/refactoring/stream-architecture/README.md` (本文档)
- [ ] `docs/refactoring/stream-architecture/CHANGELOG.md` (变更记录)

---

## ✅ 验证检查清单

### 基础功能
- [ ] 普通对话 - 流式输出正常
- [ ] 普通对话 - 非流式输出正常
- [ ] 思考模型 - 思考过程正确显示
- [ ] 思考模型 - 思考时间正确计算

### 工具调用
- [ ] MCP 工具 - 函数调用模式
- [ ] MCP 工具 - 提示词模式
- [ ] 工具调用循环 - 多轮工具调用

### 特殊场景
- [ ] 请求中断 - 用户取消正确处理
- [ ] 错误处理 - API 错误正确显示
- [ ] 模型组合 - 组合模型推理正常

---

## 📈 预期收益

| 指标 | 当前 | 重构后 | 改善 |
|------|------|--------|------|
| 回调机制 | 2种混用 | 1种统一 | 简化 50% |
| 重复代码 | ~200行 | ~0行 | 减少 100% |
| 未使用代码 | ~320行 | 0行 | 减少 100% |
| 处理层次 | 4层 | 2-3层 | 减少 25-50% |

---

## 🚀 执行顺序

```
Phase 1 (清理) → Phase 2 (合并) → Phase 4 (简化) → Phase 3 (统一回调)
     ↓              ↓                  ↓                  ↓
  低风险         中风险             中风险             高风险
  1小时          2小时              2小时              4小时
```

**建议**: 按风险从低到高执行，每个阶段完成后进行完整测试。

---

## 📝 参考资料

- 参考项目: `docs/参考项目/参考项目/`
- 关键文件:
  - `packages/aiCore/src/core/runtime/executor.ts`
  - `src/renderer/src/aiCore/chunk/AiSdkToChunkAdapter.ts`
  - `src/renderer/src/services/StreamProcessingService.ts`
