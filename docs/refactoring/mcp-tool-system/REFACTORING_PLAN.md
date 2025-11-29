# MCP 工具系统改造计划

> 参考项目：参考项目
> 目标：完全改造成 Cherry Studio 架构，保留双格式支持

---

## 改造概览

### 现状分析

| 模块 | 当前实现 | 改造方向 |
|------|----------|----------|
| XML 解析 | 批量正则 `parseToolUse` | → 流式状态机 `StreamTagExtractor` |
| 标签处理 | `fixBrokenToolTags` 修复 | → 删除（流式状态机自动处理） |
| 工具执行 | 直接执行 | → **保持原样**（后续可加确认机制） |
| 幻觉防护 | 无 | → 工具调用后文本丢弃 |
| 工具 UI | 基础折叠面板 | → **保持原样**（后续可加增强 UI） |
| 格式支持 | `<tool_use>` + `<tool_name>` | → **保留双格式** |

### 目标架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Stream Pipeline                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Response Stream                                              │
│        ↓                                                          │
│  ┌──────────────────────────────────────┐                        │
│  │  StreamTagExtractor（流式标签检测）    │  ← 阶段 1              │
│  │  - 状态机增量解析                      │                        │
│  │  - 支持 <tool_use> + <tool_name>      │                        │
│  │  - getPotentialStartIndex 部分匹配    │                        │
│  └──────────────────────────────────────┘                        │
│        ↓                                                          │
│  ┌──────────────────────────────────────┐                        │
│  │  ToolUseExtractionProcessor          │  ← 阶段 2              │
│  │  - 解析工具调用内容                   │                        │
│  │  - 生成 MCP_TOOL_CREATED chunk       │                        │
│  │  - 幻觉内容丢弃                       │                        │
│  └──────────────────────────────────────┘                        │
│        ↓                                                          │
│  ┌──────────────────────────────────────┐                        │
│  │  ToolResponseHandler（已有）          │  保持原样              │
│  │  - 直接执行工具                       │                        │
│  │  - 后续可加确认机制                   │                        │
│  └──────────────────────────────────────┘                        │
│        ↓                                                          │
│  ┌──────────────────────────────────────┐                        │
│  │  ToolBlock UI（已有）                  │  保持原样              │
│  │  - 后续可加确认/中止/进度             │                        │
│  └──────────────────────────────────────┘                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 阶段 1：流式标签检测器（StreamTagExtractor）

### 1.1 目标
- 完全参考 Cherry Studio 的 `TagExtractor` 实现
- 实现增量状态机解析
- 支持双格式 `<tool_use>` + `<tool_name>`

### 1.2 新增文件
```
src/shared/utils/
├── tagExtraction/
│   ├── index.ts              # 导出
│   ├── StreamTagExtractor.ts # 核心状态机（参考 TagExtractor）
│   ├── types.ts              # 类型定义
│   └── getPotentialIndex.ts  # 部分匹配检测（参考 Cherry Studio）
```

### 1.3 删除文件
```
src/shared/utils/mcpToolParser.ts 中的:
- fixBrokenToolTags()  # 删除，流式状态机自动处理
```

### 1.4 核心实现（参考 Cherry Studio）

```typescript
// StreamTagExtractor.ts - 完全参考 Cherry Studio 的 TagExtractor
interface TagExtractionState {
  textBuffer: string;
  isInsideTag: boolean;
  isFirstTag: boolean;
  isFirstText: boolean;
  afterSwitch: boolean;
  accumulatedTagContent: string;
  hasTagContent: boolean;
}

class StreamTagExtractor {
  private config: TagConfig;
  private state: TagExtractionState;
  
  processText(newText: string): TagExtractionResult[];
  finalize(): TagExtractionResult | null;
  reset(): void;
}

// getPotentialIndex.ts - 参考 Cherry Studio
function getPotentialStartIndex(text: string, tag: string): number | null {
  // 完整匹配
  const fullMatchIndex = text.indexOf(tag);
  if (fullMatchIndex !== -1) return fullMatchIndex;
  
  // 部分匹配（标签可能被分割到多个 chunk）
  for (let i = 1; i < tag.length; i++) {
    if (text.endsWith(tag.slice(0, i))) {
      return text.length - i;
    }
  }
  return null;
}
```

### 1.5 任务清单
- [x] 创建 `getPotentialStartIndex` 函数（参考 Cherry Studio）
- [x] 创建 `StreamTagExtractor` 类（参考 Cherry Studio 的 TagExtractor）
- [x] 支持 `<tool_use>` 格式配置
- [x] 扩展支持 `<tool_name>` 直接格式（`ToolTagExtractor`）
- [ ] 删除 `fixBrokenToolTags` 函数（阶段3清理）
- [ ] 单元测试（可选）

### 1.6 预计时间
**2-3 小时** ✅ 已完成

---

## 阶段 2：工具提取处理器（ToolUseExtractionProcessor）

### 2.1 目标
- 集成到响应处理流程
- 实现幻觉内容丢弃
- 生成工具调用事件

### 2.2 修改文件
```
src/shared/services/messages/responseHandlers/
├── ToolUseExtractionProcessor.ts  # 新增
├── ResponseChunkProcessor.ts       # 修改：集成新处理器
└── ToolResponseHandler.ts          # 修改：接收新事件类型
```

### 2.3 核心逻辑

```typescript
// ToolUseExtractionProcessor.ts
class ToolUseExtractionProcessor {
  private tagExtractor: StreamTagExtractor;
  private hasAnyToolUse = false;  // 幻觉防护标志
  
  processTextChunk(chunk: TextDeltaChunk): ProcessedResult {
    const results = this.tagExtractor.processChunk(chunk.text);
    
    for (const result of results) {
      if (result.complete && result.tagContentExtracted) {
        // 解析工具调用
        const toolResponses = this.parseToolContent(result.tagContentExtracted);
        this.hasAnyToolUse = true;
        
        // 发送 MCP_TOOL_CREATED 事件
        return { type: 'tool_created', responses: toolResponses };
      }
      
      if (!result.isTagContent && !this.hasAnyToolUse) {
        // 只有没有工具调用时才返回文本
        return { type: 'text', content: result.content };
      }
      
      // 幻觉防护：工具调用后的文本被静默丢弃
    }
  }
}
```

### 2.4 任务清单
- [x] 创建 `ToolUseExtractionProcessor` 类
- [x] 实现幻觉内容丢弃逻辑
- [x] 新增 `ChunkType.MCP_TOOL_CREATED` 事件类型
- [x] 修改 `ResponseHandler` 集成新处理器
- [x] 修改 `ToolResponseHandler` 处理新事件
- [ ] 集成测试（阶段3）

### 2.5 预计时间
**2-3 小时** ✅ 已完成

---

## 阶段 3：集成测试与优化

### 3.1 目标
- 端到端测试
- 性能优化
- 边界情况处理

### 3.2 任务清单
- [x] 标记旧代码 `fixBrokenToolTags` 为 @deprecated
- [x] 标记旧代码 `parseToolUse` 为 @deprecated
- [x] 保留向后兼容（渲染层仍可使用旧函数）
- [x] 验证编译通过
- [ ] 流式解析完整测试（手动测试）
- [ ] 幻觉防护测试（手动测试）

### 3.3 预计时间
**1-2 小时** ✅ 已完成

---

## 时间线总览

| 阶段 | 内容 | 预计时间 | 依赖 |
|------|------|----------|------|
| 阶段 1 | StreamTagExtractor | 2-3 小时 | 无 |
| 阶段 2 | ToolUseExtractionProcessor | 2-3 小时 | 阶段 1 |
| 阶段 3 | 集成测试与优化 | 1-2 小时 | 阶段 2 |
| **总计** | | **5-8 小时** | |

---

## 后续可选（暂不实现）

以下功能保持原样，后续有需求再改造：

- **工具确认机制**：ToolExecutionManager
- **工具 UI 增强**：确认/取消/倒计时/进度/中止

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 流式解析边界情况 | 高 | 充分单元测试 |
| 事件类型兼容 | 中 | 保持现有事件格式 |

---

## 改造原则

1. **完全参考 Cherry Studio**：流式解析架构对齐
2. **保留双格式**：`<tool_use>` + `<tool_name>` 两种格式
3. **最小改动**：工具执行和 UI 保持原样
4. **向后兼容**：现有 API 调用方式不变

---

## 开始执行

准备好后，我们从 **阶段 1：StreamTagExtractor** 开始。

请确认计划后回复"开始阶段1"。
