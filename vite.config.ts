import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-oxc'  // 使用 OXC 处理 React，更适配 rolldown-vite
import solidPlugin from 'vite-plugin-solid'

// Rolldown-Vite + OXC + SolidJS 混合配置
// OXC 处理 React（高性能且与 rolldown 深度集成）
// SolidJS 用于性能关键页面
export default defineConfig({
  plugins: [
    // SolidJS 插件 - 必须在 React 之前，处理 .solid.tsx 文件
    solidPlugin({
      include: /\.solid\.(tsx|jsx|ts|js)$/,
    }),
    // 使用 OXC 处理 React - rolldown-vite 推荐方案
    react({
      include: /^(?!.*\.solid\.(tsx|jsx|ts|js)$).*\.(tsx|jsx)$/,
    }),
    {
      name: 'rolldown-clean-optimize-deps',
      enforce: 'post',
      config: () => ({
        optimizeDeps: {
          // 删除已废弃的 esbuildOptions，避免 rolldown-vite 警告
          esbuildOptions: undefined
        }
      }),
      configResolved(resolvedConfig) {
        // 清理 esbuildOptions
        if (resolvedConfig.optimizeDeps?.esbuildOptions) {
          delete resolvedConfig.optimizeDeps.esbuildOptions
        }
        // 清理 rollupOptions.jsx（Rolldown 不支持此选项）
        const optimizeDeps = resolvedConfig.optimizeDeps as any
        if (optimizeDeps?.rollupOptions?.jsx) {
          delete optimizeDeps.rollupOptions.jsx
        }
      }
    }
    // 注意：Rolldown-Vite 内置了类型检查，不需要额外的 checker 插件
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
      output: {
        // 使用 static 目录结构
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500
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
  },

  // 缓存配置
  cacheDir: 'node_modules/.vite',

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
