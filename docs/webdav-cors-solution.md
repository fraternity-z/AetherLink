# WebDAV CORS 问题解决方案

## 📋 问题背景

在 Web 端使用 WebDAV 云备份功能时，由于浏览器的同源策略（CORS），直接请求第三方 WebDAV 服务器会被浏览器阻止，导致以下错误：

```
Access to fetch at 'https://webdav.123pan.cn/webdav/AetherLink/' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ 解决方案：使用 Vite 反向代理

通过 Vite 开发服务器的反向代理功能，将前端请求转发到 WebDAV 服务器，从而绕过浏览器的 CORS 限制。

### 🔧 实现步骤

#### 1. 配置 Vite 代理规则

在 `vite.config.ts` 中添加 WebDAV 服务器的代理配置：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      // WebDAV 代理 - 123 云盘 (.cn)
      '/api/webdav/123pan-cn': {
        target: 'https://webdav.123pan.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webdav\/123pan-cn/, ''),
        headers: {
          'Origin': 'https://webdav.123pan.cn'
        }
      },
      
      // WebDAV 代理 - 123 云盘 (.com)
      '/api/webdav/123pan': {
        target: 'https://webdav.123pan.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webdav\/123pan/, ''),
        headers: {
          'Origin': 'https://webdav.123pan.com'
        }
      },
      
      // WebDAV 代理 - 坚果云
      '/api/webdav/jianguoyun': {
        target: 'https://dav.jianguoyun.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webdav\/jianguoyun/, '/dav'),
        headers: {
          'Origin': 'https://dav.jianguoyun.com'
        }
      },
    }
  }
})
```

**配置说明：**

- **`target`**: 目标 WebDAV 服务器地址
- **`changeOrigin: true`**: 修改请求头中的 Origin 和 Host，使其匹配目标服务器
- **`rewrite`**: 重写请求路径，去掉代理前缀
- **`headers`**: 设置额外的请求头，确保服务器接受请求

#### 2. 实现服务器检测逻辑

在 `WebDavManagerService.ts` 中添加服务器类型检测：

```typescript
/**
 * 检测 WebDAV 服务器类型
 */
private detectWebDavProvider(url: string): 'jianguoyun' | '123pan' | '123pan3' | 'unknown' {
  if (url.includes('dav.jianguoyun.com') || url.includes('jianguoyun')) {
    return 'jianguoyun';
  } else if (url.includes('webdav3.123pan')) {
    return '123pan3';
  } else if (url.includes('webdav.123pan') || url.includes('123pan')) {
    return '123pan';
  }
  return 'unknown';
}
```

#### 3. 实现代理路径转换

在 `fallbackFetch` 方法中根据服务器类型转换请求路径：

```typescript
private async fallbackFetch(options: {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: string | Blob;
}) {
  const provider = this.detectWebDavProvider(options.url);
  let proxyUrl = options.url;
  let useProxy = false;

  if (options.url.startsWith('http')) {
    const originalUrl = new URL(options.url);
    
    if (provider === 'jianguoyun') {
      // 坚果云：使用代理
      // 将 https://dav.jianguoyun.com/dav/AetherLink/ 转换为 /api/webdav/jianguoyun/AetherLink/
      const pathWithoutDav = originalUrl.pathname.replace(/^\/dav/, '');
      proxyUrl = `/api/webdav/jianguoyun${pathWithoutDav}`;
      useProxy = true;
    } else if (provider === '123pan' || provider === '123pan3') {
      // 123 云盘：使用代理
      // 将 https://webdav.123pan.cn/webdav/AetherLink/ 转换为 /api/webdav/123pan-cn/webdav/AetherLink/
      const isCnDomain = originalUrl.hostname.includes('123pan.cn');
      const proxyPrefix = isCnDomain ? '/api/webdav/123pan-cn' : '/api/webdav/123pan';
      proxyUrl = `${proxyPrefix}${originalUrl.pathname}`;
      useProxy = true;
    } else {
      // 其他 WebDAV 服务器：直接请求（可能遇到 CORS 问题）
      console.warn('⚠️ [WebDAV] 检测到非标准 WebDAV 服务器，Web 端可能遇到 CORS 限制');
      console.warn('💡 [WebDAV] 建议：使用桌面端(Tauri)或移动端(Capacitor)以获得最佳体验');
      useProxy = false;
    }
  }

  const finalUrl = useProxy ? proxyUrl : options.url;
  const response = await fetch(finalUrl, {
    method: options.method,
    headers: {
      'Authorization': this.authHeader,
      ...options.headers
    },
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
```

### 📊 工作流程图

```
用户请求
    ↓
https://webdav.123pan.cn/webdav/AetherLink/
    ↓
检测服务器类型 → 123pan (.cn)
    ↓
转换为代理路径
    ↓
/api/webdav/123pan-cn/webdav/AetherLink/
    ↓
Vite 代理拦截
    ↓
rewrite: 去掉 /api/webdav/123pan-cn
    ↓
转发到目标服务器
    ↓
https://webdav.123pan.cn/webdav/AetherLink/
    ↓
✅ 请求成功（无 CORS 问题）
```

## 🎯 支持的 WebDAV 服务器

### 1. 123 云盘

**配置示例：**
```
服务器地址: https://webdav.123pan.cn/webdav
用户名: 您的 123 云盘用户名
密码: 应用密码（在 123 云盘中生成）
备份路径: /AetherLink
```

**注意事项：**
- 需要 VIP 会员
- 需要先在 123 云盘根目录创建 `AetherLink` 目录
- 使用应用密码而非账户密码

### 2. 坚果云

**配置示例：**
```
服务器地址: https://dav.jianguoyun.com/dav
用户名: 您的坚果云邮箱
密码: 应用密码（在坚果云中生成）
备份路径: /AetherLink
```

**注意事项：**
- 需要在坚果云设置中生成应用密码
- 路径必须以 `/` 开头

### 3. Nextcloud

**配置示例：**
```
服务器地址: https://your-domain.com/remote.php/webdav
用户名: 您的 Nextcloud 用户名
密码: 您的 Nextcloud 密码或应用密码
备份路径: /AetherLink
```

### 4. ownCloud

**配置示例：**
```
服务器地址: https://your-domain.com/remote.php/webdav
用户名: 您的 ownCloud 用户名
密码: 您的 ownCloud 密码
备份路径: /AetherLink
```

### 5. Synology NAS

**配置示例：**
```
服务器地址: https://your-nas-ip:5006/webdav
用户名: 您的 NAS 用户名
密码: 您的 NAS 密码
备份路径: /AetherLink
```

## 🔐 安全性说明

### 开发环境

- ✅ 代理仅在开发环境（`npm run dev`）中生效
- ✅ 使用 HTTPS 连接确保数据传输安全
- ✅ 认证信息通过 Basic Auth 加密传输

### 生产环境

在生产环境中，不同平台有不同的处理方式：

1. **Web 端（浏览器）**
   - 如果 WebDAV 服务器支持 CORS，可以直接请求
   - 如果不支持 CORS，建议用户使用桌面端或移动端

2. **桌面端（Tauri）**
   - 使用 Tauri 的 HTTP 客户端直接请求
   - 不受浏览器 CORS 限制

3. **移动端（Capacitor）**
   - 使用 Capacitor 的 HTTP 插件直接请求
   - 不受浏览器 CORS 限制

## 📝 添加新的 WebDAV 服务器支持

如果需要支持新的 WebDAV 服务器，按以下步骤操作：

### 1. 添加 Vite 代理规则

在 `vite.config.ts` 中添加：

```typescript
'/api/webdav/your-service': {
  target: 'https://your-webdav-server.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/webdav\/your-service/, ''),
  headers: {
    'Origin': 'https://your-webdav-server.com'
  }
}
```

### 2. 更新服务器检测逻辑

在 `detectWebDavProvider` 方法中添加：

```typescript
private detectWebDavProvider(url: string): 'jianguoyun' | '123pan' | 'your-service' | 'unknown' {
  // ... 现有代码 ...
  
  if (url.includes('your-webdav-server.com')) {
    return 'your-service';
  }
  
  return 'unknown';
}
```

### 3. 添加路径转换逻辑

在 `fallbackFetch` 方法中添加：

```typescript
else if (provider === 'your-service') {
  // 根据服务器的路径结构进行转换
  proxyUrl = `/api/webdav/your-service${originalUrl.pathname}`;
  useProxy = true;
}
```

### 4. 更新配置说明

在 UI 中添加该服务器的配置示例和说明。

## 🐛 常见问题

### Q1: 为什么移动端正常，Web 端异常？

**A:** 移动端使用原生 HTTP 客户端，不受浏览器 CORS 限制。Web 端需要通过代理或 CORS 扩展来解决跨域问题。

### Q2: 代理配置后仍然 404？

**A:** 检查以下几点：
1. 确认 `webdavPath` 配置正确（必须以 `/` 开头）
2. 确认目标服务器上已创建对应目录
3. 检查 Vite 代理的 `rewrite` 规则是否正确
4. 查看浏览器控制台的详细错误信息

### Q3: 如何调试代理请求？

**A:** 在开发环境中，代理请求会在控制台输出日志：

```
🔍 [WebDAV] buildUrl debug: { host, basePath, path }
🌐 [WebDAV] 代理请求: /api/webdav/123pan-cn/webdav/AetherLink/
```

### Q4: 生产环境如何处理 CORS？

**A:** 
- **推荐方案**：引导用户使用桌面端或移动端
- **备选方案**：使用服务端代理（需要部署后端服务）
- **不推荐**：要求用户安装 CORS 扩展（体验不佳）

## 📚 相关资源

- [Vite 代理配置文档](https://vitejs.dev/config/server-options.html#server-proxy)
- [WebDAV 协议规范](https://tools.ietf.org/html/rfc4918)
- [CORS 跨域资源共享](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [123 云盘 WebDAV 配置指南](https://123yunpan.yuque.com/org-wiki-123yunpan-muaork/icankw/pd1xgy4oyhinqs4k)

## 🎉 总结

通过 Vite 反向代理解决 WebDAV CORS 问题的优势：

- ✅ **简单易用**：无需用户安装额外扩展
- ✅ **开发友好**：仅在开发环境生效
- ✅ **易于扩展**：支持添加新的 WebDAV 服务器
- ✅ **安全可靠**：使用标准的 HTTP 代理机制
- ✅ **跨平台一致**：统一的代码逻辑

---

**最后更新时间**: 2025-11-11  
**维护者**: AetherLink 开发团队
