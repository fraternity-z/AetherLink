# AI Settings MCP Server 架构文档

> 内置 MCP 服务器，让 AI 在任意聊天中直接管理应用设置。MVP 聚焦知识库管理。

## 1. 设计目标

- **统一入口**：通过 MCP 工具协议，AI 在对话中直接操作应用设置，无需专用页面
- **安全可控**：权限分级 + 敏感操作强制确认，拦截在网关层，AI 无法绕过
- **可扩展**：模块化工具注册，新增领域只需添加 `*.tools.ts` 文件
- **多端适配**：确认 UI 内嵌于工具调用块，天然兼容移动端/桌面端

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      AI 模型层                           │
│            （发起 tool_use 调用）                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               MCPService.callTool()                      │
│              （统一网关 — 所有 MCP 工具的入口）             │
│                                                          │
│   1. 记忆工具拦截（isMemoryTool）                         │
│   2. ★ 敏感操作确认拦截（ToolConfirmationService）        │
│   3. 正常执行（重试 + 错误处理）                          │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌────────────┐ ┌────────┐ ┌──────────┐
   │ @aether/   │ │ 外部   │ │ 其他内置  │
   │ settings   │ │ MCP    │ │ MCP      │
   │ Server     │ │ 服务器  │ │ 服务器    │
   └────────────┘ └────────┘ └──────────┘
```

---

## 3. 服务器分类体系

MCP 服务器通过 `MCPServerCategory` 字段进行逻辑分类，与传输类型 `MCPServerType` 正交：

| 分类 | 说明 | 管理方式 |
|------|------|----------|
| `external` | 用户配置的远程服务器 | 通用 MCP 服务器详情页 |
| `builtin` | 内置工具（time, fetch, calculator 等） | Tab 内直接启停 |
| `assistant` | AI 智能助手（settings 等） | 独立管理页（逻域分组 + 工具级控制） |

---

## 4. 目录结构

```
src/shared/
├── types/index.ts                             # MCPServerCategory, MCPServer.category
└── config/builtinMCPServers.ts                 # 内置服务器配置（含 category 字段）

src/shared/services/mcp/
├── confirmation/                              # 确认系统
│   ├── types.ts                               # ToolConfirmationRequest, RiskLevel 等
│   └── ToolConfirmationService.ts             # 确认服务（单例 + 事件驱动）
├── core/
│   ├── MCPService.ts                          # callTool() 集成确认拦截
│   └── MCPServerFactory.ts                   # 注册 @aether/settings
└── servers/settings/                          # Settings MCP Server
    ├── types.ts                               # ToolPermission, SettingsTool, ToolModule
    ├── storeAccess.ts                         # Redux Store 安全访问层
    ├── SettingsServer.ts                      # Server 主类
    └── tools/
        ├── index.ts                           # 工具注册中心
        └── knowledge.tools.ts                 # 知识库工具（MVP）

src/pages/Settings/
├── MCPServerSettings.tsx                      # Tab 分类列表（外部/内置/助手）
└── MCPAssistantDetail.tsx                     # 助手独立管理页（可折叠分组 + 搜索）

src/components/message/blocks/
└── ToolBlock.tsx                               # 工具块 UI（含内联确认）
```

---

## 5. 权限分级

| 级别 | 说明 | 执行方式 |
|------|------|----------|
| `read` | 只读操作 | 直接执行 |
| `write` | 低风险写入（白名单字段） | 直接执行 |
| `confirm` | 高风险操作（创建/删除/添加文档） | 需用户在 ToolBlock 内确认 |
| `navigate` | 导航操作 | 返回目标路径（预留） |

---

## 6. 知识库工具清单（MVP）

### 知识库级

| 工具名 | 权限 | 功能 |
|--------|------|------|
| `list_knowledge_bases` | read | 列出所有知识库 |
| `get_knowledge_base` | read | 获取知识库详情 |
| `create_knowledge_base` | confirm | 创建知识库 |
| `update_knowledge_base` | write | 更新知识库设置 |
| `delete_knowledge_base` | confirm | 删除知识库及关联文档 |
| `search_knowledge_base` | read | 搜索知识库内容 |

### 文档级

| 工具名 | 权限 | 功能 |
|--------|------|------|
| `list_documents` | read | 列出文档（分页 + 文件分组统计） |
| `add_document` | confirm | 添加文本到知识库（自动分块+向量化） |
| `delete_document` | confirm | 删除单个文档片段 |

---

## 7. 敏感操作确认系统

### 7.1 设计原则

- **拦截点在 MCPService 网关层**：不在各 Server 内部判断，覆盖所有 MCP 工具
- **事件驱动解耦**：服务层通过 EventEmitter 与 UI 通信，互不依赖
- **UI 内嵌 ToolBlock**：不弹 Dialog，用户在聊天上下文中操作
- **超时自动拒绝**：60 秒无响应自动拒绝，防止 Promise 泄漏

### 7.2 确认流程

```
AI 调用 confirm 级工具
       │
       ▼
MCPService.callTool()
       │
       ▼
ToolConfirmationService.needsConfirmation(toolName) → YES
       │
       ▼
requestConfirmation()
  ├─ 构造 ToolConfirmationRequest（id, toolName, args, summary, risk）
  ├─ 通过 EventEmitter 发出 REQUIRED 事件
  └─ 返回 Promise<boolean>（挂起等待用户操作）
       │
       ▼
ToolBlock（已处于 PROCESSING 状态）
  ├─ 监听 REQUIRED 事件
  ├─ 匹配 toolName → 设置 confirmationRequest 状态
  ├─ 自动展开 → 显示操作摘要 + 确认/拒绝按钮
  └─ 用户点击：
       ├─ 确认 → respond(id, true)  → Promise resolve(true)  → 工具继续执行
       └─ 拒绝 → respond(id, false) → Promise resolve(false) → 返回"用户已拒绝"
```

### 7.3 事件定义

```typescript
CONFIRMATION_EVENTS = {
  REQUIRED: 'mcp:tool_confirmation_required',  // UI 监听此事件
  EXPIRED:  'mcp:tool_confirmation_expired'    // 超时通知
}
```

### 7.4 ToolConfirmationService API

```typescript
class ToolConfirmationService {
  // 注册需要确认的工具
  registerConfirmable(toolName: string, risk: RiskLevel, summaryBuilder?): void;
  registerMultiple(entries: Array<...>): void;

  // 检查与执行
  needsConfirmation(toolName: string): boolean;
  getRiskLevel(toolName: string): RiskLevel;
  requestConfirmation(serverName, toolName, args): Promise<boolean>;

  // UI 层调用
  respond(requestId: string, approved: boolean): void;

  // 管理
  getPendingCount(): number;
  rejectAll(): void;
}
```

---

## 8. 管理 UI 架构

### MCP 服务器设置页（MCPServerSettings.tsx）

Tab 分类布局，三个 Tab 共用统一的 `Paper > List > ListItem` 风格：

| Tab | 内容 | 操作 |
|-----|------|------|
| 外部服务器 | 用户配置的服务器列表 | 添加 / 导入 / 编辑 / 启停 / 删除 |
| 内置工具 | builtin 模板列表 | 一键添加 / 启停 / 删除 |
| 智能助手 | assistant 模板列表 | 添加后点击进入独立管理页 |

### 助手管理页（MCPAssistantDetail.tsx）

专为 assistant 类服务器设计，支持工具级粒度控制：

- **服务器信息卡片**：名称 + 描述 + 全局启停开关
- **搜索栏**：实时过滤工具（名称 + 描述），搜索时自动展开匹配分组
- **可折叠分组**：按领域折叠（knowledge, appearance, providers...），显示已启用/总数徽章
- **工具列表项**：权限图标 + 工具名 + 权限 Chip + 描述 + 独立启停开关
- **权限说明**：四种权限级别的可视化图例

工具的启用/禁用通过 `MCPServer.disabledTools` 字段持久化。

路由：`/settings/mcp-assistant/:serverId`

---

## 9. 扩展指南

### 添加新工具领域

1. 创建 `src/shared/services/mcp/servers/settings/tools/xxx.tools.ts`
2. 实现 `ToolModule` 接口：

```typescript
import type { ToolModule } from '../types';

export const xxxModule: ToolModule = {
  domain: 'xxx',
  tools: [
    // SettingsTool 数组
  ]
};
```

3. 在 `tools/index.ts` 中导入并加入 `MODULES` 数组：

```typescript
import { xxxModule } from './xxx.tools';

const MODULES: ToolModule[] = [
  knowledgeModule,
  xxxModule,  // 新增
];
```

4. `confirm` 权限的工具会被 `SettingsServer` 自动注册到确认服务

### 为外部 MCP 工具添加确认

```typescript
const confirmService = ToolConfirmationService.getInstance();
confirmService.registerConfirmable('external_tool_name', 'high');
```

---

## 10. 关键文件索引

| 文件 | 职责 |
|------|------|
| `shared/types/index.ts` | MCPServerCategory, MCPServer.category |
| `shared/config/builtinMCPServers.ts` | 内置服务器声明（含 category） |
| `confirmation/types.ts` | 确认请求/响应类型 |
| `confirmation/ToolConfirmationService.ts` | 确认服务单例 |
| `servers/settings/types.ts` | ToolPermission, SettingsTool 等核心类型 |
| `servers/settings/storeAccess.ts` | Redux 安全访问 + 结果构造工具 |
| `servers/settings/SettingsServer.ts` | Server 主类，自动注册 confirm 工具 |
| `servers/settings/tools/knowledge.tools.ts` | 9 个知识库/文档管理工具 |
| `servers/settings/tools/index.ts` | 模块注册中心 |
| `core/MCPService.ts` | callTool() 确认拦截集成点 |
| `core/MCPServerFactory.ts` | @aether/settings 工厂注册 |
| `pages/Settings/MCPServerSettings.tsx` | Tab 分类列表页 |
| `pages/Settings/MCPAssistantDetail.tsx` | 助手独立管理页 |
| `components/message/blocks/ToolBlock.tsx` | 内联确认 UI |
