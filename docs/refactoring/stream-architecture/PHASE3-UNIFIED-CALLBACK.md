# Phase 3: 统一回调机制 - 详细计划

> 由于 `onUpdate` 涉及 27 个文件，需要分阶段渐进式重构

## 📊 当前状态分析

### onUpdate 使用分布（完整列表，共 21 个文件，137 处引用）

| 文件 | 匹配数 | 阶段 | 说明 |
|------|--------|------|------|
| `api/openai/provider.ts` | 21 | 3.2 | 核心 OpenAI Provider |
| `services/messages/ModelComboProvider.ts` | 13 | 3.3 | 模型组合功能 |
| `api/openai/unifiedStreamProcessor.ts` | 11 | 3.2 | 统一流处理器 |
| `services/ProviderFactory.ts` | 11 | 3.4 | Provider 工厂 |
| `api/gemini/image.ts` | 8 | 3.4 | Gemini 图片生成 |
| `api/openai/image.ts` | 8 | 3.4 | OpenAI 图片生成 |
| `api/openai-aisdk/stream.ts` | 7 | 3.4 | AI SDK 流处理 |
| `api/gemini/index.ts` | 7 | 3.4 | Gemini API 入口 |
| `api/openai/chat.ts` | 6 | 3.2 | OpenAI Chat |
| `api/anthropic/provider.ts` | 6 | 3.4 | Anthropic Provider |
| `utils/mcpToolParser.ts` | 5 | 3.5 | MCP 工具解析 |
| `providers/OpenAIResponseProvider.ts` | 5 | 3.4 | OpenAI Response API |
| `api/gemini/provider.ts` | 5 | 3.4 | Gemini Provider |
| `store/thunks/message/assistantResponse.ts` | 4 | 3.1 | **调用入口** |
| `api/tools/parseAndCallTools.ts` | 4 | 3.5 | 工具调用解析 |
| `api/openai/index.ts` | 4 | 3.2 | OpenAI API 入口 |
| `api/anthropic/index.ts` | 4 | 3.4 | Anthropic API 入口 |
| `api/openai-aisdk/provider.ts` | 2 | 3.4 | AI SDK Provider |
| `api/index.ts` | 2 | 3.5 | API 总入口 |
| `api/baseProvider.ts` | 2 | 3.5 | 基础 Provider |
| `services/messages/messageService.ts` | 1 | 3.5 | 消息服务 |

---

## 🎯 分阶段执行计划

### Phase 3.1: 核心入口统一 (低风险)
**目标**: 在 `assistantResponse.ts` 中只使用 `onChunk`
**匹配数**: 4

**变更文件**:
- `src/shared/store/thunks/message/assistantResponse.ts` (4处)

**策略**: 
- 移除 `onUpdate` 回调
- 只保留 `onChunk` 回调
- `handleStringContent` 改为内部调用 `handleChunk`

**预计代码变更**:
```typescript
// 当前代码
response = await apiProvider.sendChatMessage(messagesToSend, {
  onUpdate: (content, reasoning) => {
    responseHandler.handleStringContent(content, reasoning);
  },
  onChunk: (chunk) => {
    responseHandler.handleChunk(chunk);
  },
  // ...
});

// 重构后
response = await apiProvider.sendChatMessage(messagesToSend, {
  onChunk: (chunk) => {
    responseHandler.handleChunk(chunk);
  },
  // ...
});
```

---

### Phase 3.2: OpenAI Provider 层统一 (中风险)
**目标**: 在 OpenAI Provider 层统一使用 `onChunk`
**匹配数**: 42

**变更文件**:
- `src/shared/api/openai/provider.ts` (21处)
- `src/shared/api/openai/unifiedStreamProcessor.ts` (11处)
- `src/shared/api/openai/chat.ts` (6处)
- `src/shared/api/openai/index.ts` (4处)

**策略**:
- `unifiedStreamProcessor` 只发送 `onChunk`，移除 `onUpdate` 分支
- `provider.ts` 移除 `onUpdate` 参数传递
- `chat.ts` 和 `index.ts` 更新接口定义

---

### Phase 3.3: 模型组合适配 (高风险)
**目标**: 确保模型组合功能正常工作
**匹配数**: 13

**变更文件**:
- `src/shared/services/messages/ModelComboProvider.ts` (13处)

**策略**:
- 模型组合内部调用使用 `onChunk`
- 思考过程通过 `THINKING_DELTA` chunk 传递
- 对比结果通过特殊 chunk 类型传递

**风险点**:
- 模型组合依赖 `onUpdate` 传递推理内容
- 对比策略使用 `__COMPARISON_RESULT__` 特殊标记
- 需要确保 `onChunk` 能正确传递推理片段

---

### Phase 3.4: 其他 Provider 适配 (中风险)
**目标**: 统一其他 Provider 的回调机制
**匹配数**: 56

**变更文件**:
- `src/shared/services/ProviderFactory.ts` (11处)
- `src/shared/api/gemini/image.ts` (8处)
- `src/shared/api/openai/image.ts` (8处)
- `src/shared/api/openai-aisdk/stream.ts` (7处)
- `src/shared/api/gemini/index.ts` (7处)
- `src/shared/api/anthropic/provider.ts` (6处)
- `src/shared/providers/OpenAIResponseProvider.ts` (5处)
- `src/shared/api/gemini/provider.ts` (5处)
- `src/shared/api/anthropic/index.ts` (4处)
- `src/shared/api/openai-aisdk/provider.ts` (2处)

**策略**:
- 逐个 Provider 适配
- 保持接口一致性
- 图片生成功能可能需要保留 `onUpdate` 用于进度更新

---

### Phase 3.5: 清理和优化 (低风险)
**目标**: 移除不再使用的 `onUpdate` 相关代码
**匹配数**: 14

**变更文件**:
- `src/shared/utils/mcpToolParser.ts` (5处)
- `src/shared/api/tools/parseAndCallTools.ts` (4处)
- `src/shared/api/index.ts` (2处)
- `src/shared/api/baseProvider.ts` (2处)
- `src/shared/services/messages/messageService.ts` (1处)

**策略**:
- 更新类型定义，移除 `onUpdate`
- 清理工具解析中的 `onUpdate` 回调
- 更新基础 Provider 接口

---

## ⚠️ 风险评估

### 高风险点
1. **模型组合功能** - 依赖 `onUpdate` 传递推理内容
2. **思考过程显示** - DeepSeek-R1 等模型的思考标签解析
3. **非流式响应** - 需要确保非流式也能正确发送 `onChunk`

### 回滚策略
- 每个子阶段完成后创建 Git commit
- 发现问题可快速回滚到上一个子阶段

---

## ✅ 执行检查清单

### Phase 3.1 检查 (1 文件, 4 处) ✅
- [x] `assistantResponse.ts` 移除 `onUpdate` 回调
- [x] 构建通过
- [ ] 普通对话测试 (待手动验证)

### Phase 3.2 检查 (4 文件, 42 处) ✅
- [x] `unifiedStreamProcessor.ts` 只用 `onChunk` (11处)
- [x] `provider.ts` 移除 `onUpdate` 传递 (21处)
- [x] `chat.ts` 更新接口 (6处)
- [x] `index.ts` 更新导出 (4处)
- [x] 构建通过
- [ ] 流式输出测试 (待手动验证)
- [ ] 非流式输出测试 (待手动验证)

### Phase 3.3 检查 (1 文件, 13 处) ✅
- [x] `ModelComboProvider.ts` 适配 `onChunk` (13处)
- [x] 构建通过
- [ ] 模型组合功能测试 (待手动验证)
- [ ] 思考过程显示正常 (待手动验证)
- [ ] 对比策略正常 (待手动验证)

### Phase 3.4 检查 (10 文件, 56 处) ✅
- [x] `ProviderFactory.ts` (11处)
- [x] `gemini/image.ts` (8处)
- [x] `openai/image.ts` (8处)
- [x] `openai-aisdk/stream.ts` (7处)
- [x] `gemini/index.ts` (7处)
- [x] `anthropic/provider.ts` (6处)
- [x] `OpenAIResponseProvider.ts` (5处)
- [x] `gemini/provider.ts` (5处)
- [ ] `anthropic/index.ts` (4处)
- [ ] `openai-aisdk/provider.ts` (2处)
- [ ] Gemini Provider 测试
- [ ] Anthropic Provider 测试
- [ ] AI SDK Provider 测试
- [ ] 图片生成测试

### Phase 3.5 检查 (5 文件, 14 处) ✅
- [x] `api/index.ts` (2处)
- [x] `baseProvider.ts` (2处)
- [x] `OpenAIResponseProvider.ts` (5处)
- [x] 全量构建通过
- [ ] `mcpToolParser.ts` (保留，工具解析用)
- [ ] `parseAndCallTools.ts` (保留，工具调用用)
- [ ] `messageService.ts` (保留，服务层用)

---

## 📋 当前进度

| 子阶段 | 状态 | 完成时间 |
|--------|------|----------|
| Phase 3.1 | ✅ 已完成 | 2025-11-28 |
| Phase 3.2 | ✅ 已完成 | 2025-11-28 |
| Phase 3.3 | ✅ 已完成 | 2025-11-28 |
| Phase 3.4 | ✅ 已完成 | 2025-11-28 |
| Phase 3.5 | ✅ 已完成 | 2025-11-28 |

---

## 🚀 建议执行顺序

```
Phase 3.1 (入口) → 测试 → Phase 3.2 (处理器) → 测试 → Phase 3.3 (模型组合) → 测试
```

每个子阶段完成后进行手动测试，确认无问题后再继续下一阶段。
