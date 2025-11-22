import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'  // Rolldown-Vite 官方推荐，已内置 OXC 优化
import solidPlugin from 'vite-plugin-solid'

// Rolldown-Vite + OXC + SolidJS 混合配置
// OXC 处理 React（高性能且与 rolldown 深度集成）
// SolidJS 用于性能关键页面
export default defineConfig({
  plugins: [
    // SolidJS 插件 - 必须在 React 之前，处理 .solid.tsx 文件
    // 注意：vite-plugin-solid 尚未完全兼容 Rolldown，会有 esbuildOptions 警告（不影响功能）
    solidPlugin({
      include: /\.solid\.(tsx|jsx|ts|js)$/,
    }),
    // Rolldown-Vite 官方 React 插件（已内置 OXC 优化）
    react({
      include: /^(?!.*\.solid\.(tsx|jsx|ts|js)$).*\.(tsx|jsx)$/,
    }),
    // 注意：Rolldown-Vite 内置了类型检查和优化，不需要额外插件
  ],

  // 开发服务器配置
  server: {
    port: 5173,
    host: process.env.TAURI_DEV_HOST || '0.0.0.0', // 使用 Tauri 提供的主机地址
    cors: false, // 完全禁用 CORS 检查
    strictPort: true, // 严格端口模式
    // 预热常用文件，提升首次加载速度
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx', './src/shared/store/index.ts'],
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    },
    // 配置 HMR WebSocket 以支持 Tauri 移动端
    hmr: process.env.TAURI_DEV_HOST ? {
      protocol: 'ws',
      host: process.env.TAURI_DEV_HOST,
      port: 5174,
    } : {
      port: 5174,
      host: '0.0.0.0'
    }
    // 注意：CORS 代理已迁移到独立的 scripts/cors-proxy.js
    // 所有跨域请求通过 http://localhost:8888/proxy 统一处理
  },

  // 构建配置 - Rolldown-Vite 会自动使用内置优化
  build: {
    sourcemap: false, // 生产环境不生成sourcemap
    target: 'es2022', // 现代浏览器目标，生成更小的代码
    outDir: 'dist',
    rollupOptions: {
      // Rolldown 自动启用多线程优化，无需手动配置
      output: {
        // 使用 static 目录结构
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
    // 注意：Rolldown 已自动启用持久化缓存（通过 cacheDir）
  },
  // 优化依赖预构建 - Rolldown-Vite 会自动优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'redux-persist',
      'react-redux',
      'lodash',
      '@emotion/react',
      '@emotion/styled',
      'axios',
      'solid-js',
      'solid-js/web',
    ],
    // 移除 force: true，避免每次都重新构建
    // force: true
    // 注意：Rolldown-Vite 使用内置优化，不需要 esbuildOptions
    // 启用持久化缓存
    holdUntilCrawlEnd: false, // 提前开始预构建，不等待所有依赖扫描完成
  },

  // 缓存配置 - 持久化缓存目录
  cacheDir: 'node_modules/.vite',
  
  // Rolldown 性能优化配置
  experimental: {
    // 启用 Rolldown 的实验性优化特性
    hmrPartialAccept: true, // HMR 部分接受优化
  },

  // 解析配置
  resolve: {
    alias: {
      '@': '/src'
    }
  },

  // 定义全局常量
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },
})
