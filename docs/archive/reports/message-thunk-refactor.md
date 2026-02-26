# `messageThunk.ts` 重构总结

## 1. 重构目的

将 `src/shared/store/thunks/messageThunk.ts` 中庞大的消息处理逻辑拆分为更小、职责更单一的模块，提高可读性、可维护性和可测试性。

## 2. 当前文件结构

```
src/shared/store/thunks/
├── messageThunk.ts                    # 聚合文件，重新导出 message/ 下的模块
└── message/
    ├── index.ts                       # 统一导出
    ├── utils.ts                       # 通用辅助函数（saveMessageAndBlocksToDB 等）
    ├── sendMessage.ts                 # 用户消息发送逻辑
    ├── apiPreparation.ts              # API 消息格式准备
    ├── assistantResponse.ts           # 助手响应处理（流式、状态更新）
    ├── knowledgeIntegration.ts        # 知识库搜索和集成
    ├── memoryIntegration.ts           # 记忆系统集成
    ├── messageOperations.ts           # 消息操作（删除、重发、重新生成）
    └── helpers/
        ├── index.ts                   # helpers 统一导出
        ├── types.ts                   # 类型定义
        ├── agenticLoop.ts             # Agentic Loop 逻辑
        ├── assistantHelpers.ts        # 助手响应辅助函数
        ├── blockHelpers.ts            # 消息块辅助函数
        ├── dbHelpers.ts               # 数据库操作辅助
        ├── imageGeneration.ts         # 图像生成处理
        ├── mcpHelpers.ts              # MCP 工具调用辅助
        ├── messagePreparation.ts      # 消息准备辅助
        ├── modelDetection.ts          # 模型检测辅助
        └── webSearchTool.ts           # Web 搜索工具处理
```

## 3. 模块职责

- **`utils.ts`** — 通用辅助函数（如 `saveMessageAndBlocksToDB`）
- **`sendMessage.ts`** — 用户消息的创建、保存和触发助手响应
- **`apiPreparation.ts`** — 准备发送给 AI 模型的消息格式（历史消息、知识库上下文、图片/文件）
- **`assistantResponse.ts`** — AI 助手响应处理（流式处理、状态更新）
- **`knowledgeIntegration.ts`** — 知识库搜索和 RAG 集成
- **`memoryIntegration.ts`** — 记忆系统集成
- **`messageOperations.ts`** — 删除、重发、重新生成等操作
- **`helpers/agenticLoop.ts`** — Agentic Loop 工具迭代逻辑
- **`helpers/mcpHelpers.ts`** — MCP 工具调用处理
- **`helpers/webSearchTool.ts`** — Web 搜索工具处理
- **`helpers/imageGeneration.ts`** — 图像生成流程
- **`helpers/blockHelpers.ts`** — 消息块的创建和管理
- **`helpers/dbHelpers.ts`** — 数据库持久化操作
- **`helpers/modelDetection.ts`** — 模型能力检测
- **`helpers/messagePreparation.ts`** — 消息格式准备辅助
- **`helpers/assistantHelpers.ts`** — 助手响应辅助函数
- **`helpers/types.ts`** — 共享类型定义