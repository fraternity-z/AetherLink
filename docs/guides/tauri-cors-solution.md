# Tauri CORS 解决方案完整指南

## 概述

在Tauri桌面应用开发中，虽然应用运行在原生环境中，但前端代码仍然在WebView中执行，因此会受到CORS（跨域资源共享）限制。本文档提供了在Tauri应用中解决CORS问题的完整解决方案。

## 问题背景

### 为什么Tauri会有CORS问题？

1. **WebView环境**：Tauri前端运行在WebView中，遵循浏览器的安全策略
2. **同源策略**：WebView会阻止跨域请求，即使是桌面应用
3. **开发vs生产**：开发环境和生产环境的行为可能不同

### 常见错误信息

```
Access to fetch at 'https://api.example.com' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present 
on the requested resource.
```

## 解决方案

### 方案一：使用Tauri HTTP插件（推荐）

这是最佳解决方案，使用Tauri的原生HTTP客户端绕过CORS限制。

#### 1. 安装HTTP插件

**Cargo.toml**
```toml
[dependencies]
tauri-plugin-http = "2.0.0-rc"
```

**package.json**
```bash
npm install @tauri-apps/plugin-http
```

#### 2. 注册插件

**src-tauri/src/lib.rs**
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

#### 3. 配置权限

根据应用需求，可以选择不同的权限配置策略：

**选项一：开放所有HTTPS/HTTP请求（推荐用于开发和通用应用）**
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "enables the default permissions",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "http:default",
      "allow": [
        { "url": "https://**" },
        { "url": "http://**" }
      ]
    }
  ]
}
```

**选项二：限制特定域名（推荐用于生产环境）**
```json
{
  "permissions": [
    "core:default",
    {
      "identifier": "http:default",
      "allow": [
        { "url": "https://api.openai.com/**" },
        { "url": "https://api.anthropic.com/**" },
        { "url": "https://dav.jianguoyun.com/**" },
        { "url": "https://*.googleapis.com/**" }
      ]
    }
  ]
}
```

**选项三：按功能模块配置**
```json
{
  "permissions": [
    "core:default",
    {
      "identifier": "http:default",
      "allow": [
        { "url": "https://**" },
        { "url": "http://localhost:**" },
        { "url": "http://127.0.0.1:**" }
      ],
      "deny": [
        { "url": "https://malicious-site.com/**" }
      ]
    }
  ]
}
```

#### 4. 前端使用

```typescript
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

// 使用Tauri的fetch替代标准fetch
const response = await tauriFetch('https://api.example.com/data', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  }
});

const data = await response.text();
console.log(data);
```

### 方案二：平台检测 + 多重策略

为了兼容不同平台，可以实现智能的平台检测和请求策略。

#### 1. 平台检测工具

**src/shared/utils/platformDetection.ts**
```typescript
export enum PlatformType {
  WEB = 'web',
  CAPACITOR = 'capacitor', // 移动端
  TAURI = 'tauri', // 桌面端
}

export function detectPlatform(): PlatformType {
  // 检测 Tauri 环境
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return PlatformType.TAURI;
  }

  // 检测 Capacitor 环境
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    return PlatformType.CAPACITOR;
  }

  // 默认为 Web 环境
  return PlatformType.WEB;
}
```

#### 2. 统一HTTP服务

```typescript
import { detectPlatform, PlatformType } from '../utils/platformDetection';

export class UnifiedHttpService {
  async makeRequest(options: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    data?: string | Blob;
  }) {
    const platform = detectPlatform();
    
    try {
      switch (platform) {
        case PlatformType.TAURI:
          return await this.tauriRequest(options);
        case PlatformType.CAPACITOR:
          return await this.capacitorRequest(options);
        case PlatformType.WEB:
        default:
          return await this.webRequest(options);
      }
    } catch (error) {
      console.error(`HTTP请求失败 (${platform}):`, error);
      throw error;
    }
  }

  private async tauriRequest(options: any) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
    
    const response = await tauriFetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.data
    });

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: await response.text(),
      error: response.ok ? undefined : `${response.status} ${response.statusText}`
    };
  }

  private async capacitorRequest(options: any) {
    // 使用Capacitor的HTTP插件或CORS绕过服务
    // 实现细节...
  }

  private async webRequest(options: any) {
    // 使用代理或标准fetch
    // 实现细节...
  }
}
```

## 最佳实践

### 1. 权限配置策略

#### 开发环境配置
```json
{
  "identifier": "http:default",
  "allow": [
    { "url": "https://**" },
    { "url": "http://**" }
  ]
}
```

#### 生产环境配置
```json
{
  "identifier": "http:default",
  "allow": [
    { "url": "https://api.myapp.com/**" },
    { "url": "https://*.trusted-domain.com/**" },
    { "url": "https://dav.jianguoyun.com/**" }
  ],
  "deny": [
    { "url": "https://api.myapp.com/admin/**" }
  ]
}
```

#### WebDAV专用配置
```json
{
  "identifier": "http:default",
  "allow": [
    { "url": "https://dav.jianguoyun.com/**" },
    { "url": "https://webdav.yandex.com/**" },
    { "url": "https://dav.box.com/**" },
    { "url": "https://*.4shared.com/**" }
  ]
}
```

### 2. 错误处理

```typescript
async function safeHttpRequest(url: string, options: any) {
  try {
    const response = await tauriFetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    if (error.message.includes('CORS')) {
      console.error('CORS错误，请检查权限配置');
    }
    throw error;
  }
}
```

### 3. 开发调试

```typescript
// 添加详细的调试日志
console.log('🖥️ [HTTP] Tauri请求:', {
  url: options.url,
  method: options.method,
  platform: detectPlatform()
});

const response = await tauriFetch(options.url, options);

console.log('🖥️ [HTTP] Tauri响应:', {
  status: response.status,
  statusText: response.statusText,
  headers: Object.fromEntries(response.headers.entries())
});
```

## 常见问题

### Q: 为什么配置了权限还是有CORS错误？

A: 检查以下几点：
1. 确保插件正确注册
2. 权限配置中的URL模式是否正确
3. 是否使用了Tauri的fetch而不是标准fetch

### Q: 如何处理动态域名？

A: 使用通配符或在运行时动态配置权限：

```json
{
  "allow": [{ "url": "https://*.api-service.com/**" }]
}
```

### Q: 开发环境正常，生产环境有问题？

A: 检查：
1. 生产环境的权限配置
2. 构建时是否包含了HTTP插件
3. 证书和HTTPS配置

## 实际案例：WebDAV集成

以下是一个完整的WebDAV服务集成案例，展示如何在实际项目中应用CORS解决方案。

### WebDAV服务实现

```typescript
export class WebDavManagerService {
  private config: WebDavConfig;
  private authHeader: string;

  constructor(config: WebDavConfig) {
    this.config = config;
    this.authHeader = `Basic ${btoa(`${config.webdavUser}:${config.webdavPass}`)}`;
  }

  private async makeRequest(options: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    data?: string | Blob;
  }) {
    const platform = detectPlatform();

    try {
      if (platform === PlatformType.TAURI) {
        return await this.tauriDirectFetch(options);
      } else if (platform === PlatformType.CAPACITOR) {
        return await this.capacitorRequest(options);
      } else {
        return await this.webProxyRequest(options);
      }
    } catch (error) {
      console.error(`WebDAV请求失败 (${platform}):`, error);
      throw error;
    }
  }

  private async tauriDirectFetch(options: any) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');

    const headers = {
      'Authorization': this.authHeader,
      ...options.headers
    };

    const response = await tauriFetch(options.url, {
      method: options.method,
      headers,
      body: options.data
    });

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: await response.text(),
      error: response.ok ? undefined : `${response.status} ${response.statusText}`
    };
  }

  async uploadFile(fileName: string, data: string | Blob) {
    const url = this.buildUrl(fileName);

    const response = await this.makeRequest({
      url,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      data: data
    });

    return {
      success: response.success,
      fileName: response.success ? fileName : undefined,
      error: response.error
    };
  }

  async downloadFile(fileName: string) {
    const url = this.buildUrl(fileName);

    const response = await this.makeRequest({
      url,
      method: 'GET'
    });

    return {
      success: response.success,
      data: response.success ? response.data : undefined,
      error: response.error
    };
  }
}
```

### 权限配置示例

**开发环境配置（推荐）**
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "AetherLink开发环境权限配置",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "http:default",
      "allow": [
        { "url": "https://**" },
        { "url": "http://**" }
      ]
    }
  ]
}
```

**生产环境配置**
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "AetherLink生产环境权限配置",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "http:default",
      "allow": [
        { "url": "https://api.openai.com/**" },
        { "url": "https://api.anthropic.com/**" },
        { "url": "https://*.googleapis.com/**" },
        { "url": "https://dav.jianguoyun.com/**" },
        { "url": "https://webdav.yandex.com/**" },
        { "url": "https://api.deepseek.com/**" }
      ]
    }
  ]
}
```

## 性能优化建议

### 1. 连接复用

```typescript
// 创建单例HTTP服务，复用连接
export const httpService = new UnifiedHttpService();

// 避免频繁创建新的fetch实例
const cachedFetch = await import('@tauri-apps/plugin-http');
```

### 2. 请求缓存

```typescript
class CachedHttpService {
  private cache = new Map<string, any>();

  async get(url: string, options: any) {
    const cacheKey = `${url}:${JSON.stringify(options)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await this.makeRequest({ url, method: 'GET', ...options });
    this.cache.set(cacheKey, response);

    return response;
  }
}
```

### 3. 错误重试

```typescript
async function retryRequest(requestFn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000; // 指数退避
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## 安全注意事项

### 1. 权限配置建议

**开发阶段：开放配置**
```json
{
  "identifier": "http:default",
  "allow": [
    { "url": "https://**" },
    { "url": "http://**" }
  ]
}
```

**生产阶段：精确配置**
```json
{
  "identifier": "http:default",
  "allow": [
    // ✅ 具体的API端点
    { "url": "https://api.myapp.com/v1/**" },
    // ✅ WebDAV服务
    { "url": "https://dav.jianguoyun.com/**" },
    // ✅ AI服务
    { "url": "https://api.openai.com/**" }
  ],
  "deny": [
    // ❌ 拒绝敏感端点
    { "url": "https://api.myapp.com/v1/admin/**" }
  ]
}
```

**功能模块配置**
```json
{
  "identifier": "http:default",
  "allow": [
    // WebDAV功能需要的所有域名
    { "url": "https://dav.jianguoyun.com/**" },
    { "url": "https://webdav.yandex.com/**" },
    { "url": "https://dav.box.com/**" },
    { "url": "https://*.4shared.com/**" },
    { "url": "https://webdav.pcloud.com/**" }
  ]
}
```

### 2. 敏感信息处理

```typescript
// ❌ 不要在前端硬编码敏感信息
const API_KEY = "sk-1234567890abcdef";

// ✅ 使用环境变量或安全存储
const API_KEY = await getSecureConfig('api_key');
```

### 3. 请求验证

```typescript
function validateUrl(url: string): boolean {
  const allowedDomains = ['api.myapp.com', 'dav.jianguoyun.com'];
  const urlObj = new URL(url);
  return allowedDomains.includes(urlObj.hostname);
}

async function safeRequest(url: string, options: any) {
  if (!validateUrl(url)) {
    throw new Error('不允许的请求域名');
  }

  return await tauriFetch(url, options);
}
```

## 总结

使用Tauri HTTP插件是解决CORS问题的最佳方案，它提供了：

- ✅ 完全绕过CORS限制
- ✅ 原生性能
- ✅ 完整的HTTP功能支持
- ✅ 安全的权限控制
- ✅ 跨平台兼容性

通过正确的配置和实现，可以让Tauri应用像原生应用一样自由地进行网络请求，同时保持良好的安全性和性能。

## 参考资源

- [Tauri HTTP插件官方文档](https://v2.tauri.app/plugin/http-client/)
- [Tauri权限系统](https://v2.tauri.app/security/permissions/)
- [WebDAV协议规范](https://tools.ietf.org/html/rfc4918)
