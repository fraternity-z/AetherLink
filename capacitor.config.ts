/// <reference types="capacitor-edge-to-edge" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.llmhouse.app',
  appName: 'AetherLink',
  webDir: 'dist',
  android: {
    initialFocus: true,
    captureInput: false,
    webContentsDebuggingEnabled: true,
    //  Android WebView 允许混合内容
    allowMixedContent: true
  },
  ios: {
    scheme: 'AetherLink',
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
    // 🚀 修复 iOS 键盘二次弹起问题
    contentInset: 'never', // 禁用自动内容插入，防止 iOS 自动调整布局
  },
  server: {
    androidScheme: 'https',  // 保持https以避免数据丢失
    allowNavigation: [],
    cleartext: true  // 允许HTTP明文传输
  },
  plugins: {
    CapacitorHttp: {
      enabled: false  //  禁用CapacitorHttp，使用标准fetch支持流式输出
    },
    CorsBypass: {
      // CORS 绕过插件配置
      enabled: true, // 启用 CORS 绕过功能
      timeout: 30000, // 默认超时时间 30 秒
      retries: 3, // 默认重试次数
      userAgent: 'AetherLink-Mobile/1.0', // 自定义 User-Agent
      // 添加常用的请求头
      defaultHeaders: {
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache'
      }
    },
    WebView: {
      scrollEnabled: true,
      allowFileAccess: true
    },
    Keyboard: {
      resizeOnFullScreen: false // 根据edge-to-edge插件要求设置为false
    },
    StatusBar: {
      // 移除硬编码的背景色，由StatusBarService动态设置
      // backgroundColor: '#475569',
      style: 'DEFAULT', // 使用默认样式，由StatusBarService动态控制
      overlaysWebView: true // 启用！让内容延伸到状态栏下方，实现"打通"效果（模仿 rikkahub）
    },
    SplashScreen: {
      launchShowDuration: 0, // 立即隐藏原生启动画面
      launchAutoHide: true, // 自动隐藏启动画面
      backgroundColor: '#F8FAFC', // 保持背景色一致
      androidSplashResourceName: 'splash', // 保留资源名称
      iosSplashResourceName: 'Splash', // 保留资源名称
      showSpinner: false, // 不显示加载指示器
      splashFullScreen: false, // 禁用全屏模式
      splashImmersive: false // 非沉浸式模式
    },
    // EdgeToEdge: 新插件通过代码动态控制，无需静态配置
  }
};

export default config;
