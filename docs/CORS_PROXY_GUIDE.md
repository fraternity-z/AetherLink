# 通用 CORS 代理服务器使用指南

## 概述

这是一个轻量级的通用 CORS 代理服务器，可以与 `npm run dev` 自动并行启动。它支持任意域名的请求代理，无需为每个域名单独配置，完全解决浏览器 CORS 问题。

## 工作原理

```
浏览器 → 本地代理 (http://localhost:8888) → 目标服务器 (https://api.example.com)
         ↓
      自动注入 CORS 头
      自动处理重定向
      保留所有请求方法和头
```

## 快速开始

### 1. 启动开发环境

```bash
npm run dev
```

这会同时启动：
- 🚀 CORS 代理服务器（http://localhost:8888）
- 🔧 Vite 开发服务器（http://localhost:5173）

### 2. 在代码中使用

#### 方法 A：直接构造代理 URL（推荐简单场景）

```typescript
const targetUrl = 'https://api.openai.com/v1/chat/completions';
const proxyUrl = `http://localhost:8888/proxy?url=${encodeURIComponent(targetUrl)}`;

const response = await fetch(proxyUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-xxx'
  },
  body: JSON.stringify({ ... })
});
```

#### 方法 B：使用辅助函数（推荐复杂场景）

在 `src/shared/utils/universalFetch.ts` 中添加代理支持：

```typescript
// 辅助函数
function createProxyUrl(targetUrl: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:8888/proxy?url=${encodeURIComponent(targetUrl)}`;
  }
  return targetUrl;
}

// 使用
const response = await fetch(createProxyUrl('https://api.example.com/endpoint'), {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({ ... })
});
```

## 特性

✅ **通用代理** - 支持任意域名，无需单独配置  
✅ **全方法支持** - GET、POST、PUT、DELETE、PATCH、HEAD 等  
✅ **流式响应** - 完美支持 SSE、chunked transfer 等流式数据  
✅ **自动重定向** - 自动跟随最多 5 次重定向  
✅ **头部透传** - 保留原始请求头和响应头  
✅ **超时处理** - 5 分钟超时，适合长连接  
✅ **错误处理** - 清晰的错误提示和日志  

## API 端点

### 代理请求
```
GET/POST/PUT/DELETE/PATCH http://localhost:8888/proxy?url=<目标URL>
```

**参数：**
- `url` (必需) - 目标服务器的完整 URL，需要 URL 编码

**示例：**
```bash
# 简单 GET 请求
curl "http://localhost:8888/proxy?url=https://api.example.com/data"

# 带查询参数的 GET 请求
curl "http://localhost:8888/proxy?url=https://api.example.com/search%3Fq%3Dtest"

# POST 请求
curl -X POST http://localhost:8888/proxy?url=https://api.example.com/create \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
```

### 健康检查
```
GET http://localhost:8888/health
或
GET http://localhost:8888/
```

**响应示例：**
```json
{
  "status": "ok",
  "service": "Universal CORS Proxy",
  "port": 8888,
  "usage": "http://localhost:8888/proxy?url=https://example.com/api",
  "timestamp": "2025-11-19T17:54:00.000Z"
}
```

## 使用示例

### 示例 1：调用 OpenAI API

```typescript
async function callOpenAI(messages: any[]) {
  const proxyUrl = `http://localhost:8888/proxy?url=${encodeURIComponent(
    'https://api.openai.com/v1/chat/completions'
  )}`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages,
      stream: true
    })
  });

  return response;
}
```

### 示例 2：调用第三方 API

```typescript
async function fetchWeatherData(city: string) {
  const targetUrl = `https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=${city}`;
  const proxyUrl = `http://localhost:8888/proxy?url=${encodeURIComponent(targetUrl)}`;

  const response = await fetch(proxyUrl);
  return response.json();
}
```

### 示例 3：处理 SSE 流

```typescript
async function* streamOpenAI(prompt: string) {
  const proxyUrl = `http://localhost:8888/proxy?url=${encodeURIComponent(
    'https://api.openai.com/v1/chat/completions'
  )}`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      stream: true
    })
  });

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value);
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data !== '[DONE]') {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        }
      }
    }
  }
}
```

## 配置选项

### 更改代理端口

编辑 `scripts/cors-proxy.js`，修改以下行：

```javascript
const PROXY_PORT = 8888;  // 改成你需要的端口
```

### 添加请求头过滤

如果需要过滤特定的请求头，编辑 `scripts/cors-proxy.js`：

```javascript
const FILTERED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  // 添加你的自定义过滤
  'custom-header'
]);
```

### 修改超时时间

编辑 `scripts/cors-proxy.js`，修改以下行：

```javascript
timeout: 300000,  // 改成毫秒数（当前为 5 分钟）
```

## 日志和调试

代理服务器会输出详细的日志，格式为：

```
→ GET https://api.example.com/endpoint
✓ 200 https://api.example.com/endpoint
ℹ 重定向到: https://new-location.example.com
✗ 代理请求失败: ECONNREFUSED
```

### 常见日志含义

- `→` - 正在转发请求
- `✓` - 请求成功
- `ℹ` - 信息提示
- `⚠` - 警告
- `✗` - 错误

## 故障排查

### 问题 1：代理服务器无法启动

**症状：** 运行 `npm run dev` 时出错

**解决：**
1. 检查 8888 端口是否被占用
2. 改为其他端口：编辑 `scripts/cors-proxy.js`，修改 `PROXY_PORT`
3. 在 Windows 上杀死占用端口的进程：
   ```bash
   netstat -ano | findstr :8888
   taskkill /PID <PID> /F
   ```

### 问题 2：请求超时

**症状：** 代理请求返回 504 错误

**解决：**
1. 检查目标服务器是否在线
2. 增加超时时间：编辑 `scripts/cors-proxy.js`，修改 `timeout` 值
3. 检查网络连接

### 问题 3：请求头丢失

**症状：** 某些请求头没有被转发到目标服务器

**解决：**
检查请求头是否在 `FILTERED_REQUEST_HEADERS` 中，如果不应该被过滤，在配置中移除它。

## 生产环境配置

### 方案 1：继续使用代理服务器

在生产环境中，不建议使用本地代理。但如果必须，可以：

1. 启动专用的代理服务器：
   ```bash
   node scripts/cors-proxy.js &
   ```

2. 修改代码，根据环境选择：
   ```typescript
   function getProxyUrl(targetUrl: string): string {
     if (process.env.NODE_ENV === 'development') {
       return `http://localhost:8888/proxy?url=${encodeURIComponent(targetUrl)}`;
     }
     // 生产环境直接调用
     return targetUrl;
   }
   ```

### 方案 2：使用服务端代理（推荐）

在生产环境，应该在后端服务器上处理代理请求，而不是在浏览器中。

### 方案 3：配置 CORS 在目标服务器上

如果你控制目标服务器，直接在服务器上配置 CORS 是最佳方案。

## 与 Vite 代理的区别

| 特性 | 本代理 | Vite 代理 |
|------|------|---------|
| 启动方式 | 自动随 npm run dev 启动 | Vite 配置中定义 |
| 端口 | 8888（独立）| 5173（与 Vite 同端口）|
| 配置 | 无需配置，任意 URL | 需要预先配置每个 API |
| 性能 | 极轻量（~10KB） | 嵌入在 Vite 中 |
| 支持度 | 所有 HTTP 方法 | 所有 HTTP 方法 |
| 错误处理 | 详细日志 | 在 Vite 日志中 |
| **适用场景** | 多个 API、动态 URL | 固定几个 API |

## 性能考虑

- 代理服务器极轻量，不会对 CPU/内存造成压力
- 流式响应由 Node.js 直接管道传输，无缓冲
- 支持无限并发请求
- 建议在生产环境使用真正的反向代理（如 Nginx）

## 许可证

MIT

## 相关资源

- [Node.js HTTP 文档](https://nodejs.org/api/http.html)
- [CORS 规范](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)