# 秘塔AI搜索 MCP 集成指南

## 📋 概述

秘塔AI搜索官方API已成功集成到 AetherLink 的内置 MCP 服务器中，提供强大的 AI 驱动的网络搜索和学术搜索能力。

> **⚠️ 重要说明**：本集成使用秘塔AI官方开放平台API，需要申请API Key才能使用。

## ✨ 功能特性

- **🔍 网页搜索**：智能网页搜索，返回结构化结果
  - 支持自定义返回数量和分页
  - 包含标题、链接、摘要
  - 可选AI生成的内容总结
  - 支持完整原文抓取和精简片段
  
- **📖 内容阅读器**：提取网页文本内容
  - 自动解析网页正文
  - 返回纯文本格式
  - 过滤广告和无关内容

- **💬 AI智能对话** ⭐新增：基于实时搜索的AI问答
  - 实时搜索增强回答
  - 自动提供引用来源（可验证）
  - 提取关键要点（高亮摘要）
  - 5种知识范围：网页/文库/学术/视频/播客
  - 3种模型选择：快速/思考/深度推理
  - 支持流式和非流式响应

## 🚀 快速开始

### 1. 申请 API Key

访问 [秘塔AI开放平台](https://metaso.cn/open-app) 并完成以下步骤：

1. **登录账号**
   - 访问 https://metaso.cn/open-app
   - 使用你的秘塔账号登录

2. **申请 API Key**
   - 在开放平台界面申请 API 访问权限
   - 创建新的 API Key
   - 复制生成的 API Key

> **注意**：
> - API Key 是官方提供的认证方式
> - 请妥善保管 API Key，不要泄露
> - 如果开放平台暂未对公众开放，可以联系秘塔AI官方申请

### 2. 添加内置服务器

1. 打开 AetherLink 设置
2. 进入 **MCP 服务器** 页面
3. 点击 **内置服务器** 按钮
4. 找到 **@aether/metaso-search** 并点击 **添加**

### 3. 配置环境变量

1. 在 MCP 服务器列表中找到 **@aether/metaso-search**
2. 点击进入服务器详情页
3. 在 **高级设置** 中，编辑 **环境变量** 字段
4. 添加你的 API Key：

```json
{
  "METASO_API_KEY": "你的API Key"
}
```

**配置说明**：
- `METASO_API_KEY`：必填，从秘塔AI开放平台获取的官方 API Key

5. 点击 **保存** 按钮

### 4. 启用服务器

1. 在服务器详情页，开启 **启用服务器** 开关
2. 等待服务器状态变为 **运行中**

## 🛠️ 可用工具

### metaso_search - 网页搜索

使用秘塔AI进行网页搜索，返回结构化的搜索结果。支持多种召回和内容提取选项。

**参数**：
- `query` (必填): 搜索关键词或问题
- `size` (可选): 返回结果数量，默认10，建议范围5-20
- `page` (可选): 页码，从1开始，用于分页获取更多结果
- `includeSummary` (可选): 是否包含AI生成的摘要（召回增强），默认true，推荐开启以获得更丰富的上下文
- `includeRawContent` (可选): 是否抓取所有来源网页的原文内容（完整文本），默认false，开启后返回完整网页内容但响应较慢
- `conciseSnippet` (可选): 是否返回精简的原文匹配信息（代码片段），默认false，开启后只返回关键匹配部分

**返回内容**：
- 标题
- URL链接
- 页面摘要 / 精简片段（根据 conciseSnippet 参数）
- AI生成的内容总结（根据 includeSummary 参数）
- 完整网页原文（根据 includeRawContent 参数）
- 相关度评分
- 发布日期
- 作者信息

**使用场景**：

1. **快速信息获取**（默认模式）
```
使用秘塔AI搜索：最新的AI技术发展趋势
```

2. **深度研究模式**（获取完整原文）
```
使用秘塔AI搜索：
query: "量子计算原理"
size: 5
includeRawContent: true
includeSummary: true
```

3. **精准匹配模式**（只看关键片段）
```
使用秘塔AI搜索：
query: "Python异步编程示例"
conciseSnippet: true
size: 10
```

4. **分页浏览**
```
使用秘塔AI搜索：
query: "React最佳实践"
page: 2
size: 15
```

### metaso_reader - 网页阅读器

提取指定网页的文本内容，过滤广告和无关信息。

**参数**：
- `url` (必填): 要提取内容的网页URL

**返回内容**：
- 网页正文文本
- 自动过滤广告和导航元素

**示例**：
```
使用秘塔阅读器提取：https://example.com/article
```

### metaso_chat - AI智能对话 ⭐新增

使用秘塔AI进行智能对话，基于实时搜索提供带引用来源的回答。

**参数**：
- `query` (必填): 用户的问题或查询内容
- `scope` (可选): 知识范围，默认webpage
  - `webpage`: 网页（默认，全网搜索）
  - `document`: 文库（专业文档）
  - `scholar`: 学术（论文期刊）
  - `video`: 视频（视频内容）
  - `podcast`: 播客（音频内容）
- `model` (可选): 模型选择，默认fast
  - `fast`: 快速模型（默认，速度快）
  - `fast_thinking`: 极速思考（更快）
  - `ds-r1`: 深度推理（质量高）
- `stream` (可选): 是否使用流式响应，MCP中建议false

**返回内容**：
- AI生成的回答
- 📚 引用来源（带标题、链接、日期、作者）
- ✨ 关键要点（高亮摘要）
- 支持流式和非流式响应

**使用场景**：

1. **快速问答**（默认）
```
使用秘塔AI回答：量子计算的工作原理是什么？
```

2. **学术研究**
```
使用秘塔AI回答：
query: "深度学习在医学影像中的应用"
scope: "scholar"
model: "ds-r1"
```

3. **视频内容查询**
```
使用秘塔AI回答：
query: "如何使用Python进行数据分析"
scope: "video"
```

4. **专业文档查找**
```
使用秘塔AI回答：
query: "React 18新特性详解"
scope: "document"
model: "fast_thinking"
```

## 💡 使用技巧

### 1. 参数选择策略

**快速浏览场景**：
- 使用默认参数即可
- 或设置 `includeSummary: false, conciseSnippet: true` 获取最精简信息

**深度研究场景**：
- 设置 `includeRawContent: true` 获取完整原文
- 设置 `size: 5-10` 避免信息过载
- 保持 `includeSummary: true` 获得AI辅助理解

**技术问题查找**：
- 设置 `conciseSnippet: true` 快速定位代码片段
- 增加 `size: 15-20` 提高命中率
- 关闭 `includeRawContent` 避免干扰

**多页浏览策略**：
- 第一页使用默认参数
- 发现相关内容后，使用 `page: 2, 3...` 继续挖掘
- 配合 `size` 参数控制每页数量

### 2. 性能与成本权衡

| 参数组合 | 响应速度 | 内容丰富度 | 积分消耗 | 适用场景 |
|---------|---------|-----------|---------|---------|
| 默认 | 快 ⚡ | 中等 📊 | 低 💰 | 日常查询 |
| `includeRawContent: true` | 慢 🐢 | 极高 📚 | 高 💸 | 深度研究 |
| `conciseSnippet: true` | 极快 🚀 | 低 📄 | 极低 💵 | 快速扫描 |
| `includeSummary: false` | 较快 ⚡⚡ | 较低 📋 | 较低 💰 | 只需原始数据 |

### 3. 阅读器最佳实践

- 适用于新闻文章、博客等内容页面
- 自动提取正文，过滤导航和广告
- 返回纯文本便于AI处理
- 配合搜索使用：先搜索找到URL，再用阅读器提取内容

### 4. API Key管理

- API Key 可能会过期或达到使用限制
- 如遇到认证失败，检查 API Key 是否有效
- 在开放平台可以查看使用情况和限额
- 合理使用参数组合，控制积分消耗

### 5. 工作流建议

**方案A：快速决策流程**
1. 使用默认参数搜索 → 浏览AI摘要
2. 发现感兴趣内容 → 使用 `page` 获取更多
3. 确定目标 → 用 `metaso_reader` 深入阅读

**方案B：深度研究流程**
1. `includeRawContent: true, size: 5` → 获取少量但完整的资料
2. AI分析完整原文 → 提取关键信息
3. 如需更多 → 使用 `page` 参数继续

**方案C：代码查找流程**
1. `conciseSnippet: true, size: 20` → 快速扫描大量片段
2. 定位关键代码 → 记录URL
3. `metaso_reader` 提取完整代码示例

## 🔧 技术实现

### 文件结构

```
src/shared/
├── services/mcp/
│   ├── servers/
│   │   └── MetasoSearchServer.ts    # 秘塔AI搜索服务器实现
│   └── core/
│       └── MCPServerFactory.ts      # 工厂类注册
├── config/
│   └── builtinMCPServers.ts         # 内置服务器配置
└── i18n/
    └── locales/
        ├── zh-CN/settings/
        │   └── mcpServerSettings.json
        └── en-US/settings/
            └── mcpServerSettings.json
```

### API 端点

#### 1. 搜索API
- **端点**: `https://metaso.cn/api/v1/search`
- **方法**: POST
- **认证**: Bearer Token
- **请求体参数说明**:
  ```json
  {
    "q": "搜索关键词",              // 必填
    "scope": "webpage",             // 固定为webpage
    "size": "10",                   // 返回结果数量，字符串格式
    "page": "1",                    // 页码，字符串格式
    "includeSummary": true,         // 是否包含AI摘要（召回增强）
    "includeRawContent": false,     // 是否抓取完整原文
    "conciseSnippet": false         // 是否使用精简片段
  }
  ```

**参数详解**:
- `includeSummary`: 开启后API会生成AI总结，提供更丰富的上下文信息，推荐用于需要理解内容的场景
- `includeRawContent`: 开启后会完整抓取网页原文，内容量大但信息完整，响应时间会增加
- `conciseSnippet`: 开启后只返回关键匹配的文本片段，适合快速扫描和代码查找
- `page`: 配合 `size` 使用实现分页，例如 `size=10, page=2` 获取第11-20个结果

#### 2. 阅读器API
- **端点**: `https://metaso.cn/api/v1/reader`
- **方法**: POST
- **认证**: Bearer Token
- **请求体**:
  ```json
  {
    "url": "https://example.com/article"
  }
  ```

#### 3. 智能对话API（Chat Completions）
- **端点**: `https://metaso.cn/api/v1/chat/completions`
- **方法**: POST
- **认证**: Bearer Token
- **支持MCP协议**：是
- **请求体参数说明**:
  ```json
  {
    "model": "fast",              // 模型: fast, fast_thinking, ds-r1
    "stream": false,              // 是否流式响应
    "messages": [                 // 标准的OpenAI格式消息
      {
        "role": "user",
        "content": "你的问题"
      }
    ]
  }
  ```

**响应格式（流式）**:
```
data: {"choices":[{"delta":{"citations":[...]}}]}
data: {"choices":[{"delta":{"content":"回答内容"}}]}
data: {"choices":[{"delta":{"highlights":["要点"]}}]}
data: [DONE]
```

**特色功能**:
- ✅ 实时搜索增强：基于最新网络数据回答
- ✅ 引用来源：返回可验证的citations
- ✅ 关键要点：提供highlights高亮摘要
- ✅ 多种scope：支持网页/文库/学术/视频/播客
- ✅ 多种模型：快速/思考/深度推理

## 🐛 故障排除

### 问题：未配置 API Key

**错误信息**：
```
未配置秘塔AI搜索API Key。请访问秘塔AI开放平台申请...
```

**解决方案**：
1. 访问 https://metaso.cn/open-app 申请 API Key
2. 在环境变量中正确配置 `METASO_API_KEY`
3. 确认 API Key 没有多余的空格
4. 保存配置后重新启用服务器

### 问题：认证失败

**错误信息**：
```
秘塔AI搜索请求失败 (401)
```

**解决方案**：
1. API Key 可能已过期或无效
2. 检查 API Key 是否正确配置
3. 在开放平台查看 API Key 状态
4. 如果需要，重新生成 API Key

### 问题：搜索结果为空

**解决方案**：
1. 尝试更换搜索关键词
2. 切换不同的搜索模式
3. 检查服务器日志获取详细错误信息

## 📚 相关资源

- [秘塔AI搜索官网](https://metaso.cn)
- [秘塔AI开放平台](https://metaso.cn/open-app)
- [MCP 协议文档](https://modelcontextprotocol.io)
- [项目 MCP 集成文档](./MCP_CALL_FLOW_GUIDE.md)

## 🎯 最佳实践

1. **保护 API Key安全**：不要在公共场合分享你的 API Key
2. **合理使用**：注意 API 调用限额，避免超出配额
3. **结合其他工具**：可以与其他 MCP 工具配合使用提升效率
4. **监控使用情况**：在开放平台定期查看使用统计

## 📝 更新日志

### v1.2.0 (2024-11-22) ⭐

- ✅ **新增工具**：`metaso_chat` - AI智能对话
  - 基于实时搜索的AI回答
  - 自动引用来源（citations）
  - 关键要点提取（highlights）
  - 支持5种知识范围：网页/文库/学术/视频/播客
  - 支持3种模型：fast/fast_thinking/ds-r1
  - 支持流式和非流式响应
- ✅ **API集成**：完整支持 `/api/v1/chat/completions` 端点
- ✅ **文档更新**：新增Chat API完整说明和使用示例

### v1.1.0 (2024-11-22)

- ✅ **新增参数**：开放更多搜索控制选项给AI
  - `page`: 分页浏览，支持获取更多结果
  - `includeRawContent`: 抓取完整网页原文
  - `conciseSnippet`: 返回精简匹配片段
- ✅ **优化显示**：根据参数动态显示内容
  - 智能标注启用的增强选项
  - 分页提示，引导继续浏览
  - 不同模式下的内容区分显示
- ✅ **文档增强**：
  - 详细的参数说明和使用场景
  - 性能与成本对比表
  - 多种工作流建议

### v1.0.0 (2024-11-22)

- ✅ 使用秘塔AI官方API（/api/v1/search 和 /api/v1/reader）
- ✅ 支持网页搜索，返回结构化结果
- ✅ 支持网页内容阅读器
- ✅ 可自定义搜索结果数量和AI摘要
- ✅ 集成到内置 MCP 服务器
- ✅ 支持中英文国际化
- ✅ 使用 Bearer Token (API Key) 认证

## ⚠️ 重要提示

本集成使用秘塔AI官方API，需要：
1. 访问官方开放平台申请 API Key
2. 遵守秘塔AI的使用条款和限制
3. 注意 API 调用配额和限制

如需测试搜索功能但暂时无法获取官方 API Key，建议：
- 联系秘塔AI官方申请测试权限
- 或考虑使用其他已有 API Key 的搜索服务

---

**享受秘塔AI官方API带来的智能搜索体验！** 🎉
