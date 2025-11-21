# 秘塔AI搜索 MCP 集成指南

## 📋 概述

秘塔AI搜索官方API已成功集成到 AetherLink 的内置 MCP 服务器中，提供强大的 AI 驱动的网络搜索和学术搜索能力。

> **⚠️ 重要说明**：本集成使用秘塔AI官方开放平台API，需要申请API Key才能使用。

## ✨ 功能特性

- **🔍 网页搜索**：智能网页搜索，返回结构化结果
  - 支持自定义返回数量
  - 包含标题、链接、摘要
  - 可选AI生成的内容总结
- **📖 内容阅读器**：提取网页文本内容
  - 自动解析网页正文
  - 返回纯文本格式
  - 过滤广告和无关内容

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

使用秘塔AI进行网页搜索，返回结构化的搜索结果。

**参数**：
- `query` (必填): 搜索关键词或问题
- `size` (可选): 返回结果数量，默认10，最大可能支持更多
- `includeSummary` (可选): 是否包含AI生成的摘要，默认true

**返回内容**：
- 标题
- URL链接
- 页面摘要
- AI生成的内容总结（如果开启）

**示例**：
```
使用秘塔AI搜索：最新的AI技术发展趋势
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

## 💡 使用技巧

1. **搜索结果优化**：
   - 调整 `size` 参数获取更多结果
   - 设置 `includeSummary: false` 加快响应速度（不需要AI总结时）
   - 使用具体的关键词提高搜索精度

2. **阅读器最佳实践**：
   - 适用于新闻文章、博客等内容页面
   - 自动提取正文，过滤导航和广告
   - 返回纯文本便于AI处理

3. **API Key管理**：
   - API Key 可能会过期或达到使用限制
   - 如遇到认证失败，检查 API Key 是否有效
   - 在开放平台可以查看使用情况和限额

4. **组合使用**：
   - 先用 `metaso_search` 查找相关页面
   - 再用 `metaso_reader` 提取详细内容
   - 实现完整的信息检索流程

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
- **请求体**:
  ```json
  {
    "q": "搜索关键词",
    "scope": "webpage",
    "includeSummary": true,
    "size": "10",
    "includeRawContent": false,
    "conciseSnippet": false
  }
  ```

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
