import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'  // Rolldown-Vite 官方推荐，已内置 OXC 优化
import solidPlugin from 'vite-plugin-solid'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// Rolldown-Vite + OXC + SolidJS 混合配置
// OXC 处理 React（高性能且与 rolldown 深度集成）
// SolidJS 用于性能关键页面
export default defineConfig(({ mode }) => ({
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
    // 🖼️ 图片优化插件 - 仅在构建时启用，开发环境跳过
    ...(mode === 'production' ? [
      ViteImageOptimizer({
        // PNG 优化 (有损压缩，质量 80)
        png: {
          quality: 80, // 0-100，推荐 70-85
        },
        // JPEG 优化
        jpeg: {
          quality: 85, // 0-100，推荐 80-90
        },
        // SVG 优化 (移除无用代码)
        svg: {
          multipass: true,
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  cleanupNumericValues: false,
                  removeViewBox: false,
                },
              },
            },
          ],
        },
        // 缓存优化结果，避免重复处理
        cache: true,
        cacheLocation: 'node_modules/.cache/vite-plugin-image-optimizer',
      })
    ] : []),
    // 注意：Rolldown-Vite 内置了类型检查和优化，不需要额外插件
  ],


  // 开发服务器配置
  server: {
    port: 5173,
    host: process.env.TAURI_DEV_HOST || '0.0.0.0', // 使用 Tauri 提供的主机地址
    cors: false, // 完全禁用 CORS 检查
    strictPort: true, // 严格端口模式
    // 🚀 性能优化：预热关键文件，提升首次加载速度
    warmup: {
      clientFiles: [
        // 核心入口
        './src/main.tsx',
        './src/App.tsx',
        
        // 关键组件
        './src/components/AppContent.tsx',
        './src/routes/index.tsx',
        
        // 首屏路由 (用户最常访问)
        './src/pages/ChatPage/index.tsx',
        './src/pages/WelcomePage/index.tsx',
        
        // 核心状态管理
        './src/shared/store/index.ts',
        './src/shared/store/settingsSlice.ts',
        './src/shared/store/slices/newMessagesSlice.ts',
        
        // 关键 Hooks
        './src/hooks/useAppInitialization.ts',
        './src/hooks/useTheme.ts',
        
        // 性能追踪
        './src/utils/performanceMetrics.ts',
      ],
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
  // 🚀 优化依赖预构建 - 提升首次加载速度
  optimizeDeps: {
    include: [
      // React 核心
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      
      // 路由和状态管理
      'react-router-dom',
      '@reduxjs/toolkit',
      'redux-persist',
      'redux-persist/integration/react',
      'react-redux',
      
      // UI 库
      '@mui/material',
      '@mui/system',
      '@emotion/react',
      '@emotion/styled',
      'notistack',
      
      // 工具库
      'lodash',
      'axios',
      'dayjs',
      'uuid',
      
      // SolidJS
      'solid-js',
      'solid-js/web',
    ],
    // 🚀 性能优化：不等待所有依赖扫描完成，提前开始预构建
    holdUntilCrawlEnd: false,
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
}))
