# Skills 系统设计方案

> 状态：🚧 进行中

## 1. 背景与动机

### 1.1 问题分析

当前 AetherLink 的助手系统存在以下局限：

1. **System Prompt 硬编码** — 所有预设助手的提示词定义在 `src/shared/config/assistantPrompts.ts`，新增助手需要修改源码
2. **全量注入** — 每个助手的完整 system prompt 始终注入上下文，无论是否与当前任务相关，浪费 token
3. **无按需加载** — 不支持根据用户意图动态加载专业指令
4. **助手 ≠ 技能** — 当前"助手"是一个重量级实体（含话题、模型配置、MCP 绑定等），缺少轻量级的"技能卡片"概念
5. **用户不可扩展** — 用户无法在不修改代码的情况下添加自定义操作流程

### 1.2 目标

引入 **Skills 层**，作为 MCP（工具层）的知识补充：

- **MCP** 解决"AI 能调用什么工具" → 集成层
- **Skills** 解决"AI 在什么场景下怎么做" → 知识/策略层

```
┌──────────────────────────────────────────┐
│              AI Agent                    │
│                                          │
│  ┌─────────────┐    ┌─────────────────┐  │
│  │ Skills 层   │    │ MCP 层          │  │
│  │ (知识/策略) │    │ (工具/集成)     │  │
│  │             │    │                 │  │
│  │ 按需加载    │    │ 工具定义常驻    │  │
│  │ Markdown    │    │ JSON-RPC 协议   │  │
│  └──────┬──────┘    └────────┬────────┘  │
│         │     相辅相成       │            │
│         └─────────┬──────────┘            │
│                   ↓                      │
│          System Prompt 组装              │
│                   ↓                      │
│            API 请求发送                  │
└──────────────────────────────────────────┘
```

### 1.3 参考来源

- [Agent Skills 开放规范](https://agentskills.io/) — Anthropic 2025.10 开源
- OpenClaw Skills 系统 — `skills/*/SKILL.md` 结构化技能定义
- Claude Skills — 渐进式加载（Progressive Disclosure）机制

## 2. 核心概念

### 2.1 Skill 定义

一个 Skill 是一个**轻量级的结构化指令包**，包含：

```typescript
// src/shared/types/Skill.ts

export interface Skill {
  id: string;                    // 唯一标识
  name: string;                  // 技能名称，如 "代码审查"
  description: string;           // 触发描述（AI 用此判断是否匹配）
  emoji?: string;                // 展示图标
  tags?: string[];               // 分类标签，如 ["编程", "审查"]
  
  // 技能内容
  content: string;               // SKILL.md 正文（Markdown 格式的详细指令）
  
  // 触发条件
  triggerPhrases?: string[];     // 触发短语示例，如 ["审查代码", "review PR"]
  
  // 关联配置（可选）
  mcpServerId?: string;          // 关联的 MCP 服务器
  modelOverride?: string;        // 推荐使用的模型
  temperatureOverride?: number;  // 推荐温度参数
  
  // 元数据
  source: 'builtin' | 'user' | 'community';  // 来源
  version?: string;              // 版本号
  author?: string;               // 作者
  enabled: boolean;              // 是否启用
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 与现有系统的关系

```
Assistant（助手）
├── systemPrompt          ← 基础人设 / 角色定义
├── skills: string[]      ← 🆕 绑定的 Skill ID 列表
├── mcpConfigId           ← 绑定的 MCP 配置
├── model                 ← 使用的模型
└── topics[]              ← 话题列表

Topic（话题）
├── prompt                ← 话题级追加提示词
└── messageIds[]          ← 消息列表

Skill（技能）  ← 🆕
├── description           ← 摘要（始终注入，占用极少 token）
├── content               ← 完整指令（按需加载）
└── mcpServerId?          ← 关联的 MCP 工具
```

**层级优先级**（prompt 组装顺序）：

```
1. Assistant.systemPrompt       — 基础角色定义
2. Skills 摘要列表              — 可用技能的 name + description（始终注入）
3. 匹配 Skill.content           — 按需加载的详细指令（仅当 AI 判断匹配时）
4. Topic.prompt                 — 话题级追加指令
```

### 2.3 渐进式加载机制

这是 Skills 系统的核心设计，参考 Claude Skills 的 Progressive Disclosure：

**阶段 1 — 摘要注入（每次对话都执行）**

将所有已启用 Skill 的 `name + description` 拼接为一段紧凑文本注入 system prompt：

```
<available_skills>
- 代码审查: 审查代码变更，检查潜在bug、代码风格、性能问题和安全隐患
- 天气查询: 查询全球城市的当前天气和未来天气预报
- SQL优化: 分析和优化SQL查询，提供索引建议和执行计划分析
</available_skills>

规则：当用户请求明确匹配某个技能时，加载该技能的完整指令并严格遵循。
如果没有匹配的技能，按你的通用能力回答。
```

> 每个技能摘要约 20-30 tokens，10 个技能 ≈ 200-300 tokens，开销极小。

**阶段 2 — 按需注入（仅匹配时执行）**

当 AI 的回复中触发了某个 Skill，将 `Skill.content` 完整内容追加到下一轮对话的 system prompt 中。

**两种触发模式**：

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **手动模式** | 用户在聊天中通过 `/skill 代码审查` 命令手动激活 | 精确控制 |
| **自动模式** | AI 根据摘要列表自主判断是否匹配，自动加载 | 智能匹配 |

初版建议先实现**手动模式**，后续再实现自动模式。

## 3. 技术架构

### 3.1 新增文件结构

```
src/shared/
├── types/
│   └── Skill.ts                    # Skill 类型定义
├── config/
│   └── builtinSkills.ts            # 内置技能定义
├── services/
│   └── skills/
│       ├── index.ts                # 统一导出
│       ├── SkillManager.ts         # 技能 CRUD 管理
│       ├── SkillMatcher.ts         # 技能匹配逻辑
│       └── SkillPromptBuilder.ts   # 技能 → system prompt 组装
├── store/
│   └── slices/
│       └── skillsSlice.ts          # Redux 状态管理
src/pages/
└── Settings/
    └── SkillSettings/
        ├── index.tsx               # 技能管理主页面
        ├── SkillEditor.tsx         # 技能编辑器
        └── SkillCard.tsx           # 技能卡片组件
src/components/
└── SkillSelector/
    └── index.tsx                   # 聊天页技能选择器（输入框附近）
```

### 3.2 存储层

使用现有的 Dexie（IndexedDB）存储，新增 `skills` 表：

```typescript
// 在 DexieStorageService 中新增
skills: '&id, name, source, enabled, updatedAt'
```

**数据库迁移**：

```typescript
// DexieStorageService.ts — 版本升级示例
// 假设当前版本是 N，新增 skills 表后升级为 N+1
db.version(N + 1).stores({
  // 保留原有表定义不变
  assistants: '&id, name, updatedAt',
  topics: '&id, assistantId, updatedAt',
  messages: '&id, topicId, createdAt',
  // 新增 skills 表
  skills: '&id, name, source, enabled, updatedAt'
});

// 首次启动时导入内置技能
db.on('ready', async () => {
  const skillCount = await db.table('skills').count();
  if (skillCount === 0) {
    const { builtinSkills } = await import('../config/builtinSkills');
    await db.table('skills').bulkPut(builtinSkills);
  }
});
```

> Dexie 原生支持版本迁移，此操作无技术障碍。

**数据流**：

```
builtinSkills.ts → 首次启动时写入 IndexedDB
用户创建技能   → 直接写入 IndexedDB
技能列表查询   → 从 IndexedDB 读取 → 缓存到 Redux store
```

### 3.3 Prompt 组装流程改造

当前流程（`src/shared/store/thunks/message/apiPreparation.ts`）：

```
assistant.systemPrompt + topic.prompt → systemPrompt
```

改造后：

```
assistant.systemPrompt
  + SkillPromptBuilder.buildSkillsSummary(enabledSkills)    // 阶段1：摘要列表
  + SkillPromptBuilder.buildActiveSkillContent(activeSkill) // 阶段2：已激活技能内容
  + topic.prompt
  → systemPrompt
```

### 3.4 核心服务设计

#### SkillManager

```typescript
// src/shared/services/skills/SkillManager.ts

export class SkillManager {
  // CRUD
  static async getAllSkills(): Promise<Skill[]>;
  static async getEnabledSkills(): Promise<Skill[]>;
  static async getSkillById(id: string): Promise<Skill | null>;
  static async saveSkill(skill: Skill): Promise<boolean>;
  static async deleteSkill(id: string): Promise<boolean>;
  static async toggleSkill(id: string, enabled: boolean): Promise<boolean>;
  
  // 助手关联
  static async getSkillsForAssistant(assistantId: string): Promise<Skill[]>;
  static async bindSkillToAssistant(skillId: string, assistantId: string): Promise<void>;
  static async unbindSkillFromAssistant(skillId: string, assistantId: string): Promise<void>;
  
  // 初始化
  static async initializeBuiltinSkills(): Promise<void>;
}
```

#### SkillPromptBuilder

```typescript
// src/shared/services/skills/SkillPromptBuilder.ts

export class SkillPromptBuilder {
  /**
   * 阶段1：构建技能摘要列表（始终注入）
   * 输出紧凑的 <available_skills> 文本块
   */
  static buildSkillsSummary(skills: Skill[]): string;
  
  /**
   * 阶段2：构建已激活技能的完整内容
   * 当用户手动激活或 AI 自动匹配时调用
   */
  static buildActiveSkillContent(skill: Skill): string;
  
  /**
   * 组装完整的 system prompt
   * 合并 assistant prompt + skills summary + active skill + topic prompt
   */
  static assembleSystemPrompt(params: {
    assistantPrompt: string;
    enabledSkills: Skill[];
    activeSkill?: Skill | null;
    topicPrompt?: string;
  }): string;
}
```

**`assembleSystemPrompt` 实现要点**：

```typescript
static assembleSystemPrompt({ assistantPrompt, enabledSkills, activeSkill, topicPrompt }) {
  let systemPrompt = assistantPrompt;

  // 阶段1：技能摘要（隔离标记防止与原有 prompt 冲突）
  if (enabledSkills.length > 0) {
    const summary = this.buildSkillsSummary(enabledSkills);
    systemPrompt += `\n\n${summary}`;
  }

  // 阶段2：激活技能的完整内容
  if (activeSkill) {
    const content = this.buildActiveSkillContent(activeSkill);
    systemPrompt += `\n\n<!-- 激活技能：${activeSkill.name} -->\n${content}`;
  }

  // 话题追加指令
  if (topicPrompt?.trim()) {
    systemPrompt += `\n\n${topicPrompt}`;
  }

  return systemPrompt;
}
```

> 关键：使用隔离标记（HTML 注释）分隔各段 prompt，避免内容互相干扰，同时不影响 LLM 理解。

## 4. UI 设计

### 4.1 入口位置分析

基于当前项目 UI 结构，Skills 功能需要在以下位置添加入口：

#### 入口 1 — 设置页（技能管理中心）

**位置**：`src/pages/Settings/index.tsx` → "模型与服务" 分组

放在 `agent-prompts`（智能体提示词）和 `mcp-server`（MCP 服务器）之间，逻辑上形成：

```
模型与服务
├── 默认模型
├── 辅助模型  
├── 智能体提示词
├── 🆕 技能管理        ← 新增入口
├── AI 辩论
├── 模型组合
├── 上下文压缩
├── 网络搜索
└── MCP 服务器
```

**理由**：Skills 是 AI 行为配置的一部分，与"智能体提示词"和"MCP 服务器"属于同一范畴，用户可以在相邻位置管理三者。

**路由**：`/settings/skills` 和 `/settings/skills/:skillId`

#### 入口 2 — 助手编辑对话框（技能绑定）

**位置**：`src/components/TopicManagement/AssistantTab/EditAssistantDialog.tsx`

在编辑助手时增加"技能"区域，允许为每个助手选择要启用的技能：

```
编辑助手
├── 名称
├── 头像
├── 系统提示词
├── 🆕 技能绑定        ← 多选技能列表
├── 正则规则
├── 聊天壁纸
└── 记忆开关
```

#### 入口 3 — 聊天输入框区域（快捷激活）

**位置**：聊天页输入框上方或工具栏

提供快捷方式让用户在对话中手动激活技能：

- **方式 A**：输入框支持 `/skill` 斜杠命令
- **方式 B**：输入框上方显示当前助手已绑定的技能标签，点击可激活/停用

建议初版使用 **方式 B**（技能标签），体验更直观。

#### 入口 4 — 侧边栏（可选，后续迭代）

当前侧边栏已有 5 个 Tab（助手、话题、设置、笔记、工作区），不建议初版再增加 Tab。可以在助手 Tab 的助手列表项中显示已绑定技能的标签。

### 4.2 技能管理页面（/settings/skills）

```
┌──────────────────────────────────────┐
│ ← 技能管理                    [+ 新建] │
├──────────────────────────────────────┤
│ 🔍 搜索技能...                        │
├──────────────────────────────────────┤
│                                      │
│ 内置技能                              │
│ ┌──────────────────────────────────┐ │
│ │ 💻 代码审查          [已启用 ●]  │ │
│ │ 审查代码变更，检查bug和安全隐患   │ │
│ ├──────────────────────────────────┤ │
│ │ 🌤️ 天气查询          [已启用 ●]  │ │
│ │ 查询城市天气和未来预报           │ │
│ ├──────────────────────────────────┤ │
│ │ 🗄️ SQL 优化          [已启用 ●]  │ │
│ │ 分析和优化SQL查询                │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 自定义技能                            │
│ ┌──────────────────────────────────┐ │
│ │ 📝 我的写作风格       [已启用 ●]  │ │
│ │ 使用我偏好的写作风格和用词习惯   │ │
│ └──────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
```

### 4.3 技能编辑器（/settings/skills/:id）

```
┌──────────────────────────────────────┐
│ ← 编辑技能                   [保存]  │
├──────────────────────────────────────┤
│                                      │
│ 技能名称                              │
│ ┌──────────────────────────────────┐ │
│ │ 代码审查                          │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 图标                                  │
│ ┌──┐                                │
│ │💻│                                │
│ └──┘                                │
│                                      │
│ 描述（AI 用此判断是否匹配）           │
│ ┌──────────────────────────────────┐ │
│ │ 审查代码变更，检查潜在bug...      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 触发短语（可选）                      │
│ ┌──────────────────────────────────┐ │
│ │ 审查代码, review PR, code review │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 技能指令（Markdown 格式）     [预览]  │
│ ┌──────────────────────────────────┐ │
│ │ # 代码审查技能                    │ │
│ │                                  │ │
│ │ ## 审查流程                       │ │
│ │ 1. 检查代码变更的范围和目的       │ │
│ │ 2. 逐文件审查...                 │ │
│ │ ...                              │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 高级设置                              │
│ ├── 关联 MCP 服务器: [下拉选择]      │
│ ├── 推荐模型: [下拉选择]             │
│ └── 推荐温度: [滑块 0.0-2.0]        │
│                                      │
│ 标签                                  │
│ [编程] [审查] [+]                    │
│                                      │
└──────────────────────────────────────┘
```

## 5. 内置技能示例

初版提供 5-8 个内置技能，覆盖常见场景：

| 技能 | 描述 | 关联 MCP |
|------|------|----------|
| 代码审查 | 审查代码变更，检查bug、风格、性能和安全 | - |
| 文档写作 | 按照结构化模板撰写技术文档 | - |
| SQL 优化 | 分析SQL查询性能，提供优化建议 | - |
| API 设计 | 设计 RESTful API，遵循最佳实践 | - |
| 数据分析 | 分析数据集，生成统计摘要和可视化建议 | - |
| 会议纪要 | 将会议录音转录整理为结构化纪要 | - |
| 网页摘要 | 提取和总结网页内容的关键信息 | web-search |
| Git 助手 | 生成规范的 commit message 和 PR 描述 | - |

## 6. Assistant 类型扩展

在现有 `Assistant` 接口中新增字段：

```typescript
// src/shared/types/Assistant.ts — 新增字段

export interface Assistant {
  // ... 现有字段保持不变
  
  // 🆕 Skills 关联
  skillIds?: string[];           // 绑定的技能 ID 列表
  activeSkillId?: string | null; // 当前激活的技能 ID（会话级别）
}
```

## 7. 实施计划

### Phase 1 — 基础框架（MVP）

- [ ] 定义 `Skill` 类型（`src/shared/types/Skill.ts`）
- [ ] 实现 `SkillManager` 服务（CRUD + Dexie 存储）
- [ ] 实现 `SkillPromptBuilder`（prompt 组装）
- [ ] 创建内置技能配置（`src/shared/config/builtinSkills.ts`）
- [ ] 改造 `apiPreparation.ts`，集成 Skills 摘要注入
- [ ] 添加 Redux `skillsSlice`

### Phase 2 — UI 层

- [ ] 技能管理页面（`/settings/skills`）
- [ ] 技能编辑器页面（`/settings/skills/:id`）
- [ ] 设置页入口项
- [ ] 路由注册
- [ ] 助手编辑对话框中增加技能绑定

### Phase 3 — 聊天集成

- [ ] 聊天页技能激活标签（输入框上方）
- [ ] `/skill` 斜杠命令支持（可选）
- [ ] 自动模式：AI 根据摘要自主选择技能（需要额外一轮 LLM 判断）

### Phase 4 — 增强功能（后续迭代）

- [ ] 技能导入/导出（JSON 格式）
- [ ] 社区技能市场
- [ ] 技能版本管理
- [ ] 技能使用统计
- [ ] 技能与 MCP 工具的深度联动

## 8. 可行性分析

### 8.1 技术可行性

方案基于现有技术栈（TypeScript、React、Redux、Dexie）增量升级，无需引入新技术依赖：

- **类型定义** — `Skill` 接口与 `Assistant` 接口扩展（`skillIds`/`activeSkillId`）符合 TypeScript 最佳实践，不破坏现有类型体系
- **存储层** — Dexie 新增 `skills` 表是常规操作，原生支持版本迁移，无技术障碍
- **Prompt 组装** — 在 `apiPreparation.ts` 中增加两步拼接（摘要 + 激活内容），改动量小且逻辑清晰
- **UI 层** — 新增页面基于现有 MUI + Lucide 组件库，组件设计符合项目既有范式

### 8.2 业务价值

精准解决当前系统的核心痛点：

| 痛点 | Skills 如何解决 |
|------|----------------|
| System Prompt 硬编码 | 内置技能配置 + 用户自定义技能，无需改源码 |
| Token 浪费 | 渐进式加载（摘要 ~300 tokens，内容按需加载） |
| 助手实体过重 | 轻量级 Skill 卡片，解耦「角色定义」和「操作知识」 |
| 用户不可扩展 | 用户可在 UI 中创建、编辑、绑定自定义技能 |
| 功能兼容 | 增量式升级，不替换现有 Assistant/Topic 体系 |

### 8.3 实施复杂度评估

| 阶段 | 预估工作量 | 核心风险 |
|------|-----------|----------|
| Phase 1 基础框架 | 1-2 周 | 低 — 类型定义 + CRUD + Prompt 拼接 |
| Phase 2 UI 层 | 1-2 周 | 低 — 常规前端页面开发 |
| Phase 3 聊天集成 | 1 周 | 中 — 输入框交互需考虑移动端适配 |
| Phase 4 增强功能 | 按需 | 低 — 独立模块，不影响核心 |

## 9. 落地关键建议

### 9.1 优先实现手动触发模式

初版跳过「AI 自动匹配」，只做手动触发（聊天页技能标签 / `/skill` 命令）：

- 自动匹配需额外调用 LLM 判断，增加 Token 消耗和响应延迟
- 手动触发逻辑简单，用户体验可控，可先验证核心价值
- 后续基于手动触发的使用数据，优化自动匹配的提示词和判断逻辑

### 9.2 控制技能摘要的 Token 开销

- **摘要长度标准化** — 每个技能的 `name + description` 总长度不超过 50 字（约 30 Token）
- **数量上限** — SkillManager 中限制「已启用技能」最多 20 个
- **格式紧凑** — 使用固定的 `<available_skills>` XML 标签格式，避免冗余字符
- **前端提示** — 技能管理页显示当前摘要列表的 Token 预估值

### 9.3 保证与现有 Prompt 的兼容

严格遵循 Prompt 组装优先级，各段用隔离标记分隔：

```
assistant.systemPrompt          ← 原有逻辑不变
<!-- available_skills -->        ← 隔离标记
<available_skills>...</>         ← 技能摘要
<!-- 激活技能：xxx -->           ← 隔离标记
[技能完整内容]                   ← 按需注入
topic.prompt                     ← 原有逻辑不变
```

> 即使 Skills 功能完全关闭，Prompt 组装回退到 `assistant.systemPrompt + topic.prompt`，与当前行为完全一致。

### 9.4 全局开关

增加全局配置项 `enableSkillsSystem`（默认 `true`），可在设置中一键关闭整个 Skills 功能，便于灰度发布和故障回退。

## 10. 风险与应对措施

| 风险点 | 应对措施 |
|--------|----------|
| Token 预算超支 | 1. 限制已启用技能数量（≤20）；2. 摘要长度标准化；3. 前端显示 Token 预估提示 |
| 自动匹配准确性低 | 1. 初版仅做手动触发；2. 后续基于用户行为优化匹配提示词；3. 支持用户手动校正匹配结果 |
| 现有功能兼容问题 | 1. 严格遵循 Prompt 优先级和隔离标记；2. 全局开关可一键关闭；3. 灰度发布 |
| 性能问题 | 1. Redux 缓存技能列表，避免重复查询数据库；2. 技能列表分页加载；3. 编辑器实时保存防抖 |
| 存储迁移失败 | 1. Dexie 版本号递增，遵循官方迁移流程；2. 首次启动时检查技能表是否存在；3. 异常时降级到无技能模式 |

## 11. 总结

本方案的核心优势：

1. **技术低风险** — 基于现有技术栈增量升级，无突破性技术依赖，改造成本可控
2. **业务高价值** — 精准解决硬编码、Token 浪费、扩展性差等核心痛点
3. **落地节奏清晰** — 分阶段实施，MVP 可快速验证核心价值

**建议优先落地**：Phase 1（基础框架）+ Phase 2（UI 管理）+ Phase 3 手动触发部分，完成 MVP 后根据用户反馈迭代自动匹配和增强功能。
