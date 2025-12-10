/// <reference types="capacitor-edge-to-edge" />

import { CapacitorConfig } from 'aetherlink-capacitor-cli';

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
    handleApplicationNotifications: false
  },
  server: {
    androidScheme: 'https',  // 保持https以避免数据丢失
    allowNavigation: [],
    cleartext: true  // 允许HTTP明文传输
  },
  plugins: {
    // 🚀 同步桥接配置 - 提升原生调用性能 10-50 倍
    SyncBridge: {
      enabled: true,
      // 对这些插件启用同步调用
      enabledPlugins: [
        'Preferences',    // 偏好设置
        'Device',         // 设备信息
        'App',            // 应用状态
        'Clipboard',      // 剪贴板
        'Haptics',        // 触觉反馈
        'StatusBar',      // 状态栏
        'Toast',          // 提示框
        'SplashScreen',   // 启动屏
        'LocalNotifications', // 通知权限检查
      ],
      // 细粒度方法控制
      enabledMethods: {
        'Preferences': ['get', 'set', 'remove', 'keys', 'clear'],
        'Device': ['getInfo', 'getId', 'getBatteryInfo', 'getLanguageCode'],
        'App': ['getInfo', 'getState', 'getLaunchUrl'],
        'Clipboard': ['read', 'write'],
        'Haptics': ['impact', 'notification', 'vibrate', 'selectionStart', 'selectionEnd', 'selectionChanged'],
        'StatusBar': ['setStyle', 'setBackgroundColor', 'show', 'hide', 'getInfo', 'setOverlaysWebView'],
        'Toast': ['show'],
        'SplashScreen': ['show', 'hide'],
        'LocalNotifications': ['checkPermissions', 'areEnabled'],
      },
      timeout: 5000,
    },
    // 💾 结果缓存配置 - 缓存读取结果避免重复调用
    // 注意：当前项目主要用 IndexedDB 存储，Capacitor 插件调用不频繁，缓存收益不大
    ResultCache: {
      enabled: false,  // 暂时关闭
      methods: {
        // 设备信息 - 几乎不变，缓存 5 分钟
        'Device': {
          'getInfo': 300000,
          'getId': 300000,
          'getBatteryInfo': 30000,
          'getLanguageCode': 300000,
        },
        // 应用信息 - 不变，缓存 5 分钟
        'App': {
          'getInfo': 300000,
          'getState': 5000,
          'getLaunchUrl': 300000,
        },
        // 偏好设置 - 缓存 30 秒（配合同步调用，二次读取直接返回）
        'Preferences': {
          'get': 30000,
          'keys': 30000,
        },
        // 状态栏信息 - 缓存 10 秒
        'StatusBar': {
          'getInfo': 10000,
        },
      },
      maxEntries: 100,
    },
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
      showSpinner: false, // 不显示加载指示器
      splashFullScreen: false, // 禁用全屏模式
      splashImmersive: false // 非沉浸式模式
    },
    // EdgeToEdge: 新插件通过代码动态控制，无需静态配置
  }
};

export default config;
