# 插件系统引入方案

> **优先级：⚠️ 中 | 风险：⚠️ 中 | 时间：4-6 周 | 前置：BlockManager + Chunk适配器**

## 🎯 目标

- 核心代码减少 70%（500 行 → 150 行）
- 扩展性提升 10 倍
- 新功能添加成本降低 90%

## 📋 当前问题

**功能全部硬编码在 Provider 中：**

```typescript
async sendChatMessage() {
  // 500+ 行混在一起
  
  // 代理逻辑
  if (needsProxy) { ... }
  
  // 工具调用
  if (usePromptMode) { ... }
  
  // 多 Key 轮换
  if (multiKey) { ... }
  
  // 流式处理
  for await (chunk of stream) { ... }
  
  // 错误重试
  try { ... } catch { ... }
}
```

**问题：**
- 功能耦合严重
- 扩展困难
- 测试复杂
- 修改风险高

## 🏗️ 设计方案

### 插件化架构

```
用户请求
    ↓
PluginManager（调度器）
    ↓
┌─────────────────────────────────┐
│ beforeRequest 钩子               │
│  ├─ ProxyPlugin                 │
│  ├─ MultiKeyPlugin              │
│  └─ AuthPlugin                  │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ transformParams 钩子             │
│  ├─ ToolUsePlugin               │
│  └─ WebSearchPlugin             │
└─────────────────────────────────┘
    ↓
API 请求
    ↓
┌─────────────────────────────────┐
│ onChunk 钩子                     │
│  ├─ ReasoningPlugin             │
│  ├─ ThrottlePlugin              │
│  └─ ToolExecutionPlugin         │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ afterRequest 钩子                │
│  ├─ LoggingPlugin               │
│  └─ MetricsPlugin               │
└─────────────────────────────────┘
```

### 核心组件

#### 1. 插件接口

```typescript
// src/shared/plugins/types.ts
export interface ProviderPlugin {
  name: string
  enforce?: 'pre' | 'post'
  
  // 生命周期钩子
  beforeRequest?(context: RequestContext): Promise<void>
  transformParams?(params: any): Promise<any>
  onChunk?(chunk: UnifiedChunk): Promise<void>
  transformResult?(result: any): Promise<any>
  afterRequest?(result: any): Promise<void>
  onError?(error: Error): Promise<void>
}
```

#### 2. 插件管理器

```typescript
// src/shared/plugins/PluginManager.ts
export class PluginManager {
  private plugins: ProviderPlugin[] = []
  
  use(plugin: ProviderPlugin): this {
    this.plugins = this.sortPlugins([...this.plugins, plugin])
    return this
  }
  
  async executeHook(
    hookName: keyof ProviderPlugin,
    ...args: any[]
  ): Promise<void> {
    for (const plugin of this.plugins) {
      const hook = plugin[hookName]
      if (hook) {
        await hook.apply(plugin, args)
      }
    }
  }
  
  async executeSequential<T>(
    hookName: 'transformParams' | 'transformResult',
    initialValue: T
  ): Promise<T> {
    let result = initialValue
    for (const plugin of this.plugins) {
      const hook = plugin[hookName]
      if (hook) {
        result = await hook.call(plugin, result)
      }
    }
    return result
  }
}
```

#### 3. 内置插件

**ProxyPlugin**
```typescript
export class ProxyPlugin implements ProviderPlugin {
  name = 'proxy'
  enforce = 'pre' as const
  
  async transformParams(params: RequestParams) {
    if (this.needsProxy(params.url)) {
      params.url = this.getProxyUrl(params.url)
      console.log('[ProxyPlugin] 使用代理:', params.url)
    }
    return params
  }
}
```

**ToolUsePlugin**
```typescript
export class ToolUsePlugin implements ProviderPlugin {
  name = 'tool-use'
  
  async transformParams(params: RequestParams) {
    if (this.isPromptMode()) {
      // 移除 tools 参数
      delete params.tools
      // 注入系统提示
      params.system = this.buildToolPrompt(params.tools)
    }
    return params
  }
  
  async onChunk(chunk: UnifiedChunk) {
    if (chunk.type === ChunkType.TEXT_DELTA) {
      // 检测 <tool_use> 标签
      const toolCalls = this.parseToolUse(chunk.text)
      if (toolCalls.length > 0) {
        await this.executeTools(toolCalls)
      }
    }
  }
}
```

**MultiKeyPlugin**
```typescript
export class MultiKeyPlugin implements ProviderPlugin {
  name = 'multi-key'
  enforce = 'pre' as const
  private currentKeyIndex = 0
  
  async beforeRequest(context: RequestContext) {
    // 选择可用 Key
    const key = this.selectNextKey()
    context.apiKey = key
  }
  
  async onError(error: Error) {
    // 切换到下一个 Key
    this.currentKeyIndex++
    console.log('[MultiKeyPlugin] 切换 Key')
  }
}
```

**ReasoningPlugin**
```typescript
export class ReasoningPlugin implements ProviderPlugin {
  name = 'reasoning'
  
  async onChunk(chunk: UnifiedChunk) {
    if (this.isThinkingTag(chunk.text)) {
      // 创建思考块
      const thinkingBlock = this.extractThinking(chunk.text)
      await this.createThinkingBlock(thinkingBlock)
    }
  }
}
```

#### 4. 重构后的 Provider

```typescript
// 改造后：只有 150 行！
export class OpenAIProvider {
  private pluginManager: PluginManager
  
  constructor() {
    this.pluginManager = new PluginManager()
      .use(new ProxyPlugin())
      .use(new MultiKeyPlugin())
      .use(new ToolUsePlugin())
      .use(new ReasoningPlugin())
      .use(new ThrottlePlugin())
  }
  
  async sendChatMessage(
    messages: Message[],
    options: Options
  ): Promise<string> {
    const context = { messages, options }
    
    // 1. 前置钩子
    await this.pluginManager.executeHook('beforeRequest', context)
    
    // 2. 参数转换
    let params = this.buildParams(messages, options)
    params = await this.pluginManager.executeSequential(
      'transformParams',
      params
    )
    
    // 3. 发送请求（核心逻辑）
    const response = await fetch(this.url, params)
    
    // 4. 流式处理（插件处理）
    for await (const chunk of this.streamResponse(response)) {
      const unified = this.adapter.transform(chunk)
      await this.pluginManager.executeHook('onChunk', unified)
    }
    
    // 5. 后置钩子
    await this.pluginManager.executeHook('afterRequest', result)
    
    return result
  }
}
```

## 📅 实施计划（6周）

### Week 1-2: 框架设计

**Day 1-3: 核心设计**
- [ ] 定义插件接口
- [ ] 设计钩子执行顺序
- [ ] 确定优先级机制

**Day 4-7: PluginManager**
- [ ] 实现 PluginManager
- [ ] 实现钩子调度
- [ ] 编写单元测试

**Day 8-10: 测试框架**
- [ ] 创建插件测试工具
- [ ] Mock 依赖
- [ ] 集成测试

### Week 3-4: 内置插件

**优先级顺序：**

1. **ProxyPlugin**（最独立）
   - Day 1-2: 开发 + 测试
   
2. **MultiKeyPlugin**
   - Day 3-4: 开发 + 测试

3. **ThrottlePlugin**（复用 BlockManager）
   - Day 5-6: 开发 + 测试

4. **ToolUsePlugin**（最复杂）
   - Day 7-10: 开发 + 测试

### Week 5-6: Provider 重构

**Day 1-3: OpenAIProvider**
- [ ] 集成 PluginManager
- [ ] 重构核心逻辑
- [ ] 完整测试

**Day 4-7: 其他 Provider**
- [ ] AnthropicProvider
- [ ] GeminiProvider
- [ ] XAIProvider

**Day 8-10: 清理优化**
- [ ] 删除旧代码
- [ ] 性能优化
- [ ] 文档完善

## 🧪 迁移策略

### 渐进式重构

```typescript
// 阶段 1: 添加插件系统（不删除旧代码）
const pluginManager = new PluginManager()
pluginManager.use(new ProxyPlugin())

// 阶段 2: 双轨运行
if (USE_PLUGIN_SYSTEM) {
  await pluginManager.executeHook('beforeRequest')
} else {
  // 旧逻辑
}

// 阶段 3: 验证通过后删除旧代码
```

### 功能开关

```typescript
interface PluginConfig {
  proxy: boolean
  multiKey: boolean
  toolUse: boolean
  reasoning: boolean
}

// 每个插件可独立开关
const config: PluginConfig = {
  proxy: true,
  multiKey: false,  // 暂时禁用
  toolUse: true,
  reasoning: true
}
```

## ✅ 验收标准

### 功能验证
- [ ] 所有现有功能正常
- [ ] 插件可独立开关
- [ ] 错误处理完善

### 性能验证
- [ ] 响应时间无增加
- [ ] 内存占用无增加
- [ ] 插件调度开销 < 5ms

### 代码质量
- [ ] 核心代码减少 70%
- [ ] 测试覆盖率 > 85%
- [ ] 文档完善

## 🎁 预期收益

| 指标 | 改造前 | 改造后 | 提升 |
|------|--------|--------|------|
| Provider 代码行数 | 500 | 150 | **70%↓** |
| 新功能添加时间 | 2 天 | 2 小时 | **90%↓** |
| 扩展性 | 低 | 高 | **10x↑** |

## 🔗 相关文档

- [BlockManager 方案](./03-blockmanager-upgrade.md)
- [Chunk 适配器方案](./04-chunk-adapter-upgrade.md)
- [实施路线图](./06-implementation-roadmap.md)
