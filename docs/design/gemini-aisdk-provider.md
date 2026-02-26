# Gemini AI SDK Provider 实现规划

## 📋 项目概述

基于现有的 `OpenAI AI SDK Provider` (`src/shared/api/openai-aisdk/`) 架构，创建一个新的 `Gemini AI SDK Provider`，使用 `@ai-sdk/google` 包实现。

### 目标
1. **功能对等**：保证与 OpenAI AI SDK Provider 相同的核心功能
2. **Gemini 独有功能**：增加 Gemini 特有的能力
3. **统一接口**：使用 AI SDK 的统一 `streamText`/`generateText` 接口

---

## 🏗️ 架构设计

### 目录结构

```
src/shared/api/gemini-aisdk/
├── index.ts          # 模块导出入口
├── client.ts         # 客户端创建和配置
├── stream.ts         # 流式/非流式响应处理
├── tools.ts          # MCP 工具转换和 Gemini 内置工具
├── provider.ts       # GeminiAISDKProvider 类
└── features/         # Gemini 独有功能
    ├── googleSearch.ts    # Google Search Grounding
    ├── imageOutput.ts     # 多模态图像输出
    └── caching.ts         # 缓存功能
```

### 架构图

```mermaid
graph TB
    subgraph User Layer
        A[sendChatMessage]
    end

    subgraph Provider Layer
        B[GeminiAISDKProvider]
        B1[AbstractBaseProvider]
    end

    subgraph Core Modules
        C[client.ts]
        D[stream.ts]
        E[tools.ts]
    end

    subgraph Gemini Features
        F[Google Search Grounding]
        G[Multi-modal Output]
        H[Caching]
    end

    subgraph AI SDK
        I[@ai-sdk/google]
        J[streamText / generateText]
    end

    A --> B
    B --> B1
    B --> C
    B --> D
    B --> E
    D --> F
    D --> G
    D --> H
    C --> I
    D --> J
```

---

## 📦 依赖配置

### 需要安装的包

```json
{
  "dependencies": {
    "@ai-sdk/google": "^1.x.x"
  }
}
```

### package.json 更新

```bash
npm install @ai-sdk/google
```

---

## 🔧 核心模块实现

### 1. client.ts - 客户端模块

**功能职责**：
- 使用 `createGoogleGenerativeAI()` 创建 Gemini 客户端
- 支持 API Key 和自定义 Base URL
- 平台适配（Tauri、Capacitor、Web）

**关键代码结构**：

```typescript
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { GoogleGenerativeAIProvider } from '@ai-sdk/google';

export function createClient(model: Model): GoogleGenerativeAIProvider {
  const apiKey = model.apiKey;
  const baseURL = model.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  
  const client = createGoogleGenerativeAI({
    apiKey,
    baseURL,
    fetch: createPlatformFetch(model),
    headers: model.extraHeaders,
  });
  
  return client;
}
```

**对比 OpenAI AI SDK**：

| 特性 | OpenAI AI SDK | Gemini AI SDK |
|------|---------------|---------------|
| 创建函数 | `createOpenAI()` | `createGoogleGenerativeAI()` |
| 包名 | `@ai-sdk/openai` | `@ai-sdk/google` |
| 模型调用 | `client.chat(modelId)` | `client(modelId)` |
| 默认 Base URL | `api.openai.com/v1` | `generativelanguage.googleapis.com/v1beta` |

### 2. stream.ts - 流式处理模块

**功能职责**：
- 使用 `streamText` 实现流式响应
- 使用 `generateText` 实现非流式响应
- 解析推理标签（`<think>` 等）
- 处理工具调用

**关键代码结构**：

```typescript
import { streamText, generateText } from 'ai';

export async function streamCompletion(
  client: GoogleGenerativeAIProvider,
  modelId: string,
  messages: any[],
  temperature?: number,
  maxTokens?: number,
  additionalParams?: StreamParams,
  onChunk?: (chunk: Chunk) => void
): Promise<StreamResult> {
  
  const result = await streamText({
    model: client(modelId),
    messages: processedMessages,
    temperature,
    maxTokens,
    tools: convertMcpToolsToGemini(mcpTools),
    abortSignal: signal,
  });
  
  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'text-delta':
        const textContent = part.text || '';
        onChunk?.({ type: ChunkType.TEXT_DELTA, text: textContent });
        break;
      case 'tool-call':
        console.log('检测到工具调用:', part.toolName);
        break;
      case 'finish':
        console.log('流式响应完成');
        break;
    }
  }
  
  return { content: fullContent, reasoning: fullReasoning };
}
```

### 3. tools.ts - 工具模块

**功能职责**：
- 将 MCP 工具转换为 Gemini 格式
- 支持 Gemini 内置工具（Google Search）
- 工具调用结果转换

**关键代码结构**：

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export function convertMcpToolsToGemini(mcpTools: MCPTool[]): Record<string, any> {
  const tools: Record<string, any> = {};
  
  for (const mcpTool of mcpTools) {
    tools[mcpTool.name] = tool({
      description: mcpTool.description || '',
      parameters: convertJsonSchemaToZod(mcpTool.inputSchema),
      execute: async (args) => {
        return args;
      }
    });
  }
  
  return tools;
}

export function getGoogleSearchTool(client: GoogleGenerativeAIProvider) {
  return client.tools.googleSearch({});
}
```

### 4. provider.ts - Provider 类

**功能职责**：
- 继承 `AbstractBaseProvider`
- 实现 `sendChatMessage` 方法
- 工具调用循环处理
- 集成 Gemini 独有功能

**关键代码结构**：

```typescript
import { AbstractBaseProvider } from '../baseProvider';

export class GeminiAISDKProvider extends AbstractBaseProvider {
  protected client: GoogleGenerativeAIProvider;
  
  constructor(model: Model) {
    super(model);
    this.client = createClient(model);
  }
  
  public async sendChatMessage(
    messages: Message[],
    options?: SendChatMessageOptions
  ): Promise<string | { content: string; reasoning?: string; reasoningTime?: number }> {
    
    const apiMessages = await this.prepareAPIMessages(messages, systemPrompt, mcpTools);
    
    const geminiOptions = {
      enableGoogleSearch: options?.enableWebSearch,
      enableImageOutput: this.supportsImageOutput(),
    };
    
    if (streamEnabled) {
      return await this.handleStreamResponse(apiMessages, geminiOptions);
    } else {
      return await this.handleNonStreamResponse(apiMessages, geminiOptions);
    }
  }
  
  public convertMcpTools<T>(mcpTools: MCPTool[]): T[] {
    return convertMcpToolsToGemini(mcpTools) as T[];
  }
}
```

---

## 🌟 Gemini 独有功能

### 1. Google Search Grounding（内置网络搜索）

**实现方式**：

```typescript
import { google } from '@ai-sdk/google';

const result = await streamText({
  model: google('gemini-2.5-flash'),
  prompt: '搜索最新的新闻',
  tools: {
    google_search: google.tools.googleSearch({})
  }
});

for (const source of result.sources) {
  if (source.sourceType === 'url') {
    console.log('来源:', source.title, source.url);
  }
}
```

**功能特点**：
- 自动调用 Google 搜索获取实时信息
- 返回引用来源（URL、标题等）
- 与现有 `enableWebSearch` 选项集成

### 2. 多模态图像输出

**实现方式**：

```typescript
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
  model: google('gemini-2.5-flash-image-preview'),
  prompt: '生成一只可爱的猫咪图片',
});

for (const file of result.files) {
  if (file.mediaType.startsWith('image/')) {
    const base64Data = file.base64;
    const binaryData = file.uint8Array;
    const mimeType = file.mediaType;
  }
}
```

**功能特点**：
- 支持在对话中生成图像
- 返回多种格式（base64、Uint8Array）
- 与现有 `enableGenerateImage` 选项集成

### 3. 文件上传和多模态输入

**实现方式**：

```typescript
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
  model: google('gemini-1.5-flash'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: '这个文件讲了什么？' },
        {
          type: 'file',
          mediaType: 'application/pdf',
          data: fs.readFileSync('./document.pdf'),
          filename: 'document.pdf',
        },
      ],
    },
  ],
});
```

**功能特点**：
- 支持 PDF、图片、音频等多种格式
- 与现有文件上传功能集成

### 4. 缓存功能（可选）

**实现方式**：

```typescript
import { wrapLanguageModel } from 'ai';

const cachedModel = wrapLanguageModel({
  model: google('gemini-2.5-flash'),
  middleware: cacheMiddleware,
});
```

---

## 📝 集成计划

### 1. 更新 ProviderFactory

```typescript
import { GeminiAISDKProvider } from './gemini-aisdk/provider';

export function createProvider(model: Model): any {
  const providerType = model.providerType || model.provider;
  
  switch (providerType) {
    case 'openai':
      return new OpenAIProvider(model);
      
    case 'openai-aisdk':
      return new OpenAIAISDKProvider(model);
      
    case 'gemini-aisdk':
      return new GeminiAISDKProvider(model);
    
    case 'gemini':
      return new GeminiAISDKProvider(model);
      
    default:
      console.warn('未知的供应商类型，使用默认 OpenAI Provider');
      return new OpenAIProvider(model);
  }
}
```

### 2. 更新类型定义

```typescript
export type ProviderType = 
  | 'openai'
  | 'openai-aisdk'
  | 'gemini'
  | 'gemini-aisdk'
  | 'anthropic';
```

### 3. 更新 UI 配置

在 Provider 设置页面添加 `gemini-aisdk` 选项：

```typescript
const providerTypes = [
  { value: 'gemini', label: 'Gemini (原生 SDK)' },
  { value: 'gemini-aisdk', label: 'Gemini (AI SDK)' },
];
```

---

## ✅ 功能对照表

| 功能 | OpenAI AI SDK | Gemini AI SDK | 说明 |
|------|--------------|---------------|------|
| 流式响应 | ✅ streamText | ✅ streamText | 统一接口 |
| 非流式响应 | ✅ generateText | ✅ generateText | 统一接口 |
| MCP 工具调用 | ✅ Function Calling | ✅ Function Calling | 统一接口 |
| XML 工具调用 | ✅ 提示词模式 | ✅ 提示词模式 | 统一接口 |
| 推理标签解析 | ✅ think标签 | ✅ think标签 | 统一接口 |
| 网络搜索 | ⚠️ 有限支持 | ✅ Google Search Grounding | Gemini 优势 |
| 图像生成 | ❌ 需要 DALL-E | ✅ 内置多模态输出 | Gemini 独有 |
| 文件上传 | ⚠️ 有限支持 | ✅ 完整支持 | Gemini 优势 |
| 缓存 | ⚠️ 需要中间件 | ⚠️ 需要中间件 | 相同 |
| 来源引用 | ❌ | ✅ result.sources | Gemini 独有 |

---

## 📅 实施步骤

### 阶段一：核心功能（估计工作量：2-3天）

1. 创建目录结构 `src/shared/api/gemini-aisdk/`
2. 实现 `client.ts`
3. 实现 `stream.ts`
4. 实现 `tools.ts`
5. 实现 `provider.ts`
6. 实现 `index.ts` 导出

### 阶段二：Gemini 独有功能（估计工作量：1-2天）

7. 实现 Google Search Grounding
8. 实现多模态图像输出
9. 集成来源引用功能

### 阶段三：集成和测试（估计工作量：1天）

10. 更新 `providerFactory.ts`
11. 更新类型定义
12. 添加测试
13. 编写文档

---

## 🔍 风险评估

### 潜在风险

1. **API 兼容性**：`@ai-sdk/google` 可能有版本更新导致 API 变化
   - 缓解：锁定版本，定期检查更新

2. **功能差异**：Gemini 原生 SDK 的某些功能可能在 AI SDK 中不可用
   - 缓解：保留原有 Gemini Provider 作为后备

3. **性能影响**：AI SDK 抽象层可能带来额外开销
   - 缓解：进行性能测试对比

### 回退方案

保留现有的 `src/shared/api/gemini/` 实现，用户可以通过 `providerType: 'gemini'` 继续使用原生 SDK 版本。

---

## 📚 参考资料

- AI SDK 文档: https://ai-sdk.dev
- @ai-sdk/google 文档: https://ai-sdk.dev/providers/google-generative-ai
- Gemini API 文档: https://ai.google.dev/gemini-api
- 现有 OpenAI AI SDK Provider 实现: src/shared/api/openai-aisdk/
- 现有 Gemini Provider 实现: src/shared/api/gemini/