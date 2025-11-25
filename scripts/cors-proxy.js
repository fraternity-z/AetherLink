/**
 * 通用 CORS 代理服务器
 * 
 * 功能：
 * - 支持任意域名的请求代理，无需单独配置
 * - 自动处理 CORS 问题
 * - 支持 GET、POST、PUT、DELETE、PATCH 等所有 HTTP 方法
 * - 保留原始请求头和响应头
 * - 支持流式响应（SSE、chunked transfer）
 * 
 * 使用方式：
 * 1. 启动代理：node scripts/cors-proxy.js
 * 2. 在代码中使用：http://localhost:8888/proxy?url=https://api.example.com/endpoint
 * 
 * 示例：
 * fetch('http://localhost:8888/proxy?url=' + encodeURIComponent('https://api.openai.com/v1/chat/completions'))
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const PROXY_PORT = 8888;
const MAX_REDIRECTS = 5;

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  request: (method, url) => console.log(`${colors.magenta}→ ${method}${colors.reset} ${colors.blue}${url}${colors.reset}`),
};

// 需要过滤的请求头（不转发到目标服务器）
const FILTERED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'keep-alive',
  'proxy-connection',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  // 移除来源相关头，避免目标服务器拒绝
  'origin',
  'referer',
]);

// 需要过滤的响应头（不返回给客户端）
const FILTERED_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  // 过滤 CORS 头，使用代理服务器自己的 CORS 头
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-allow-credentials',
  'access-control-max-age',
  'access-control-expose-headers',
]);

/**
 * 处理代理请求
 */
function handleProxyRequest(req, res, redirectCount = 0) {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // 解析目标 URL
  const urlParams = new URL(req.url, `http://localhost:${PROXY_PORT}`);
  const targetUrl = urlParams.searchParams.get('url');

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Missing url parameter',
      usage: `http://localhost:${PROXY_PORT}/proxy?url=https://example.com/api`
    }));
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Invalid URL',
      message: error.message
    }));
    return;
  }

  log.request(req.method, targetUrl);

  // 记录请求头
  console.log(`${colors.cyan}[Request Headers]${colors.reset}`, JSON.stringify(req.headers, null, 2));

  // 准备代理请求选项
  const isHttps = parsedUrl.protocol === 'https:';
  const httpModule = isHttps ? https : http;

  // 复制并过滤请求头
  const proxyHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lowerKey = key.toLowerCase();
    if (!FILTERED_REQUEST_HEADERS.has(lowerKey)) {
      proxyHeaders[key] = value;
    }
  }

  // 记录转发的请求头
  console.log(`${colors.yellow}[Proxy Headers]${colors.reset}`, JSON.stringify(proxyHeaders, null, 2));

  // 设置必要的请求头
  // proxyHeaders['host'] = parsedUrl.host; // 让 Node.js 自动设置 Host 头，避免与 SNI 冲突
  if (!proxyHeaders['user-agent']) {
    proxyHeaders['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: req.method,
    headers: proxyHeaders,
    // 显式设置 SNI，解决 "Client network socket disconnected before secure TLS connection was established" 错误
    servername: parsedUrl.hostname,
    // 忽略自签名证书错误（仅用于调试，解决某些网络环境下的连接问题）
    rejectUnauthorized: false,
    // 增加超时时间以支持长时间连接（如 SSE）
    timeout: 300000, // 5 分钟
  };

  // 发起代理请求
  const proxyReq = httpModule.request(options, (proxyRes) => {
    // 处理重定向
    if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode)) {
      const location = proxyRes.headers.location;
      if (location && redirectCount < MAX_REDIRECTS) {
        log.warning(`重定向到: ${location}`);
        
        // 构建新的请求 URL
        const redirectUrl = new URL(location, targetUrl);
        const newReq = { ...req, url: `/proxy?url=${encodeURIComponent(redirectUrl.toString())}` };
        
        // 递归处理重定向
        handleProxyRequest(newReq, res, redirectCount + 1);
        return;
      } else if (redirectCount >= MAX_REDIRECTS) {
        log.error('重定向次数过多');
      }
    }

    // 复制响应头（过滤不需要的头）
    const responseHeaders = {};
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      const lowerKey = key.toLowerCase();
      if (!FILTERED_RESPONSE_HEADERS.has(lowerKey)) {
        responseHeaders[key] = value;
      }
    }

    // 设置 CORS 头（这会覆盖任何来自目标服务器的 CORS 头）
    setCorsHeaders(res);

    // 写入响应头
    res.writeHead(proxyRes.statusCode, responseHeaders);

    // 流式传输响应体
    proxyRes.pipe(res);

    proxyRes.on('end', () => {
      log.success(`${proxyRes.statusCode} ${targetUrl}`);
    });
  });

  // 错误处理
  proxyReq.on('error', (error) => {
    log.error(`代理请求失败: ${error.message}`);
    
    if (!res.headersSent) {
      setCorsHeaders(res);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Proxy request failed',
        message: error.message,
        target: targetUrl
      }));
    }
  });

  proxyReq.on('timeout', () => {
    log.error('代理请求超时');
    proxyReq.destroy();
    
    if (!res.headersSent) {
      setCorsHeaders(res);
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Proxy request timeout',
        target: targetUrl
      }));
    }
  });

  // 如果有请求体，转发它
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

/**
 * 设置 CORS 响应头
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 支持标准 HTTP 方法和 WebDAV 方法
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * 创建服务器
 */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PROXY_PORT}`);

  // 健康检查端点
  if (url.pathname === '/health' || url.pathname === '/') {
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok',
      service: 'Universal CORS Proxy',
      port: PROXY_PORT,
      usage: `http://localhost:${PROXY_PORT}/proxy?url=https://example.com/api`,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 代理请求
  if (url.pathname === '/proxy') {
    handleProxyRequest(req, res);
    return;
  }

  // 404
  setCorsHeaders(res);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Not found',
    message: 'Use /proxy endpoint with url parameter'
  }));
});

// 启动服务器 - 使用 127.0.0.1 而非 0.0.0.0 以避免网络接口枚举延迟
server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log('\n' + colors.bright + colors.green + '═'.repeat(60) + colors.reset);
  console.log(colors.bright + colors.green + '  🚀 通用 CORS 代理服务器已启动' + colors.reset);
  console.log(colors.bright + colors.green + '═'.repeat(60) + colors.reset + '\n');
  
  log.info(`监听端口: ${colors.bright}${PROXY_PORT}${colors.reset}`);
  log.info(`健康检查: ${colors.bright}http://localhost:${PROXY_PORT}/health${colors.reset}`);
  log.info(`使用示例: ${colors.bright}http://localhost:${PROXY_PORT}/proxy?url=https://api.example.com${colors.reset}\n`);
  
  console.log(colors.yellow + '  使用方法:' + colors.reset);
  console.log(colors.yellow + '  ───────────────────────────────────────' + colors.reset);
  console.log('  在你的代码中：');
  console.log(`  ${colors.cyan}const targetUrl = 'https://api.openai.com/v1/chat/completions';${colors.reset}`);
  console.log(`  ${colors.cyan}const proxyUrl = 'http://localhost:${PROXY_PORT}/proxy?url=' + encodeURIComponent(targetUrl);${colors.reset}`);
  console.log(`  ${colors.cyan}fetch(proxyUrl, { method: 'POST', ... });${colors.reset}\n`);
  
  console.log(colors.green + '  ✓ 支持所有 HTTP 方法（GET、POST、PUT、DELETE 等）' + colors.reset);
  console.log(colors.green + '  ✓ 支持流式响应（SSE、chunked）' + colors.reset);
  console.log(colors.green + '  ✓ 自动处理 CORS' + colors.reset);
  console.log(colors.green + '  ✓ 支持任意域名，无需单独配置' + colors.reset);
  console.log('\n' + colors.bright + colors.green + '═'.repeat(60) + colors.reset + '\n');
});

// 优雅关闭
process.on('SIGTERM', () => {
  log.info('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    log.success('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log.info('\n收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    log.success('服务器已关闭');
    process.exit(0);
  });
});