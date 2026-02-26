# MCP 工具调用完整流程文档

## 概述
本文档详细描述了 MCP (Model Context Protocol) 工具调用的完整流程，包括两种模式下的调用路径，用于问题诊断和调试。

## 两种 MCP 调用模式

### 1. Function 模式 (传统模式)
- 工具通过 OpenAI API 的 `tools` 参数传递
- AI 返回标准的 `tool_calls` 格式
- 系统自动执行工具并返回结果

### 2. Prompt 模式 (提示词模式)
- 工具信息注入到系统提示词中
- AI 输出 XML 格式的工具调用标签
- 系统解析 XML 并执行工具

## 完整调用流程

### 阶段 1: 请求准备
```
用户输入 → ChatInterface → messageThunk → OpenAIProvider.sendChatMessage
```

**关键检查点:**
- `[MCP] 当前模式: prompt/function`
- `[MCP] 工具数量: X, 启用: true/false`
- `[OpenAIProvider] MCP 配置 - 模式: X, 工具数量: Y`

### 阶段 2: 模式分支处理

#### Function 模式路径:
```
OpenAIProvider → 添加 tools 参数到 API 请求 → OpenAI API 返回 tool_calls
```

#### Prompt 模式路径:
```
OpenAIProvider → buildSystemPromptWithTools → 注入工具到系统提示词 → AI 输出 XML 标签
```

**关键检查点:**
- `[MCP] 提供商层注入：将 X 个工具注入到系统提示词中`
- `[OpenAI] 不添加 tools 参数到 API 请求 - 模式: 提示词`

### 阶段 3: 流式响应处理
```
OpenAI API → OpenAIStreamProcessor → 检测工具调用 → 返回结果
```

**关键检查点:**
- `[OpenAIStreamProcessor] 开始处理流式响应`
- `[OpenAIStreamProcessor] 工具调用检测结果: true/false`
- `[OpenAIStreamProcessor] 检测到 tool_use 标签` (仅 Prompt 模式)

### 阶段 4: 工具调用检测与处理
```
OpenAIProvider → 检测 hasToolCalls → processToolUses → parseAndCallTools
```

**关键检查点:**
- `[OpenAIProvider] 流式响应检测到工具调用`
- `[OpenAIProvider] 开始处理工具调用`
- `[MCP] onChunk 回调是否存在: true/false`

### 阶段 5: 工具执行与事件发送
```
parseAndCallTools → 执行工具 → 发送 MCP 事件
```

**关键检查点:**
- `[MCP] 开始调用 X 个工具`
- `[MCP] 发送 mcp_tool_in_progress 事件，工具数量: X`
- `[MCP] 所有工具调用完成，结果数量: X`
- `[MCP] 发送 mcp_tool_complete 事件，工具数量: X`

### 阶段 6: 工具块创建
```
ResponseHandler → 处理 MCP 事件 → 创建工具块 → 保存到 Redux/数据库
```

**关键检查点:**
- `[ResponseHandler] 处理工具调用进行中事件`
- `[ResponseHandler] 创建工具块: blockId (toolId: X, toolName: Y)`
- `[ResponseHandler] 处理工具调用完成事件`

### 阶段 7: 界面渲染
```
MainTextBlock → 检测工具标签和工具块 → 原位置渲染工具块
```

**关键检查点:**
- `[MainTextBlock] 检测到 X 个工具标签，Y 个工具块`
- `[MainTextBlock] 工具标签内容: [...]`
- `[MainTextBlock] 工具块详情: [...]`

## 常见问题诊断

### 问题 1: 工具块不显示
**症状:** 有工具标签但没有工具块
**检查路径:**
1. 确认 `OpenAIStreamProcessor` 检测到工具调用
2. 确认发送了 `mcp_tool_in_progress` 事件
3. 确认 `ResponseHandler` 处理了事件并创建了工具块

### 问题 2: API 请求包含多余参数
**症状:** 请求中有 `mcpTools`、`enableTools` 等参数
**检查路径:**
1. 检查 `iterationParams` 构建过程
2. 确认只传递标准 OpenAI API 参数

### 问题 3: 工具调用未执行
**症状:** 有工具标签但工具未实际执行
**检查路径:**
1. 确认 `parseAndCallTools` 被调用
2. 确认 `onChunk` 回调正确传递
3. 确认工具服务器连接正常

## 调试技巧

### 1. 启用详细日志
在浏览器控制台中查看以下关键日志前缀:
- `[MCP]` - MCP 相关操作
- `[OpenAIProvider]` - 提供商层处理
- `[OpenAIStreamProcessor]` - 流式响应处理
- `[ResponseHandler]` - 响应处理器
- `[MainTextBlock]` - 界面渲染

### 2. 检查 Redux 状态
```javascript
// 检查消息和工具块状态
const state = window.__REDUX_DEVTOOLS_EXTENSION__.getState();
const messageId = 'your-message-id';
const message = state.messages.entities[messageId];
const toolBlocks = Object.values(state.messageBlocks.entities)
  .filter(block => block?.type === 'tool' && block?.messageId === messageId);
```

### 3. 验证工具配置
```javascript
// 检查当前 MCP 工具配置
const mcpService = window.mcpService; // 如果暴露到全局
console.log('MCP 工具列表:', mcpService?.getAvailableTools());
```

## 关键文件和组件

### 核心文件路径
```
src/shared/api/openai/provider.ts          - OpenAI 提供商，处理 API 调用
src/shared/api/openai/streamProcessor.ts   - 流式响应处理器
src/shared/utils/mcpToolParser.ts          - MCP 工具解析和执行
src/shared/services/messages/ResponseHandler.ts - 响应处理器，创建工具块
src/components/message/blocks/MainTextBlock.tsx - 主文本块，渲染工具块
src/components/message/blocks/ToolBlock.tsx     - 工具块组件
src/shared/services/MCPService.ts          - MCP 服务管理
```

### 关键函数和方法
```
OpenAIProvider.sendChatMessage()           - 发送聊天消息
OpenAIProvider.processToolUses()           - 处理工具调用
OpenAIStreamProcessor.process()            - 处理流式响应
parseAndCallTools()                        - 解析并执行工具
ResponseHandler.handleToolProgress()       - 处理工具进行中事件
ResponseHandler.handleToolComplete()       - 处理工具完成事件
MainTextBlock.render()                     - 渲染主文本块和工具块
```

## 数据流图

```
用户输入
    ↓
ChatInterface
    ↓
messageThunk (Redux)
    ↓
OpenAIProvider.sendChatMessage
    ↓
[模式分支]
    ↓                           ↓
Function 模式                Prompt 模式
    ↓                           ↓
添加 tools 参数              注入系统提示词
    ↓                           ↓
OpenAI API                   OpenAI API
    ↓                           ↓
返回 tool_calls             返回 XML 标签
    ↓                           ↓
    ↓←←←←←←←←←←←←←←←←←←←←←←←←←←←↓
                ↓
    OpenAIStreamProcessor.process()
                ↓
        检测工具调用 (hasToolCalls)
                ↓
    OpenAIProvider.processToolUses()
                ↓
        parseAndCallTools()
                ↓
        执行工具 + 发送 MCP 事件
                ↓
    ResponseHandler (监听事件)
                ↓
        创建/更新工具块 (Redux + 数据库)
                ↓
        MainTextBlock.render()
                ↓
        显示工具块 (原位置渲染)
```

## 故障排除清单

### 工具块不显示问题
- [ ] 检查 `OpenAIStreamProcessor` 是否检测到工具调用
- [ ] 检查是否发送了 `mcp_tool_in_progress` 事件
- [ ] 检查 `ResponseHandler` 是否处理了事件
- [ ] 检查工具块是否被创建并保存到 Redux
- [ ] 检查 `MainTextBlock` 是否正确渲染工具块

### API 请求问题
- [ ] 检查请求参数是否包含多余的内部参数
- [ ] 检查 Prompt 模式下是否正确移除了 `tools` 参数
- [ ] 检查系统提示词是否正确注入了工具信息

### 工具执行问题
- [ ] 检查 MCP 服务器连接状态
- [ ] 检查工具参数是否正确解析
- [ ] 检查工具执行是否返回了结果
- [ ] 检查错误处理是否正常工作

## 版本历史
- v1.0 - 初始版本，包含完整流程文档
- v1.1 - 添加关键文件路径、数据流图和故障排除清单
- 最后更新: 2025-05-29
