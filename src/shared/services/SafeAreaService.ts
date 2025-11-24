/**
 * 安全区域管理服务 (Rikkahub 风格)
 * 纯 CSS 实现，使用浏览器原生的 env(safe-area-inset-*) 变量
 * 不依赖任何插件 API，完全基于标准 Web API
 */
import { Capacitor } from '@capacitor/core';

export interface SafeAreaInsets {
  /** 顶部安全区域（px） */
  top: number;
  /** 右侧安全区域（px） */
  right: number;
  /** 底部安全区域（px） */
  bottom: number;
  /** 左侧安全区域（px） */
  left: number;
}

/**
 * 安全区域管理服务类
 */
export class SafeAreaService {
  private static instance: SafeAreaService;
  private currentInsets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  private isInitialized = false;
  private listeners: Array<(insets: SafeAreaInsets) => void> = [];
  private resizeObserver?: ResizeObserver;

  private constructor() {}

  public static getInstance(): SafeAreaService {
    if (!SafeAreaService.instance) {
      SafeAreaService.instance = new SafeAreaService();
    }
    return SafeAreaService.instance;
  }

  /**
   * 初始化安全区域服务 (Rikkahub 风格 - 纯 CSS 实现)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[SafeAreaService] 已初始化，跳过');
      return;
    }

    try {
      // 直接从 CSS env() 变量读取安全区域
      this.readSafeAreaFromCSS();

      // 应用到 CSS 变量（用于组件使用）
      this.applySafeAreaToCSS();

      // 监听窗口变化（方向改变、键盘弹出等）
      this.setupListeners();

      this.isInitialized = true;
      console.log('[SafeAreaService] ✅ 安全区域初始化完成 (Rikkahub 风格)', this.currentInsets);
    } catch (error) {
      console.error('[SafeAreaService] ❌ 安全区域初始化失败:', error);
      this.isInitialized = true;
    }
  }

  /**
   * 从 CSS env() 变量读取安全区域 (Rikkahub 方式)
   * 利用浏览器原生的 safe-area-inset 支持
   */
  private readSafeAreaFromCSS(): void {
    // 创建测试元素来读取 CSS env() 值
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: fixed;
      top: env(safe-area-inset-top, 0px);
      right: env(safe-area-inset-right, 0px);
      bottom: env(safe-area-inset-bottom, 0px);
      left: env(safe-area-inset-left, 0px);
      visibility: hidden;
      pointer-events: none;
    `;
    
    document.body.appendChild(testElement);
    const computed = window.getComputedStyle(testElement);
    
    this.currentInsets = {
      top: this.parsePxValue(computed.top),
      right: this.parsePxValue(computed.right),
      bottom: this.parsePxValue(computed.bottom),
      left: this.parsePxValue(computed.left)
    };
    
    document.body.removeChild(testElement);
    
    console.log('[SafeAreaService] 📏 CSS 安全区域读取:', this.currentInsets);
  }

  /**
   * 设置监听器 (监听窗口和方向变化)
   */
  private setupListeners(): void {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
    
    // 监听方向变化
    window.addEventListener('orientationchange', this.handleOrientationChange);
    
    // 使用 ResizeObserver 监听 body 变化
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.refresh();
      });
      this.resizeObserver.observe(document.body);
    }
    
    console.log('[SafeAreaService] 👂 监听器已设置');
  }

  /**
   * 处理窗口大小变化
   */
  private handleResize = (): void => {
    // 延迟执行，避免频繁触发
    setTimeout(() => this.refresh(), 100);
  };

  /**
   * 处理方向变化
   */
  private handleOrientationChange = (): void => {
    // 方向变化后延迟刷新，等待系统栏调整完成
    setTimeout(() => this.refresh(), 300);
  };


  /**
   * 应用安全区域到 CSS 变量
   */
  private applySafeAreaToCSS(): void {
    const root = document.documentElement;
    const { top, right, bottom, left } = this.currentInsets;
    
    // 应用自定义 CSS 变量（用于不支持 env() 的旧浏览器）
    root.style.setProperty('--safe-area-top', `${top}px`);
    root.style.setProperty('--safe-area-right', `${right}px`);
    root.style.setProperty('--safe-area-bottom', `${bottom}px`);
    root.style.setProperty('--safe-area-left', `${left}px`);
    
    // 聊天界面专用变量
    const chatInputPadding = bottom > 0 ? bottom + 8 : 8;
    root.style.setProperty('--chat-input-bottom-padding', `${chatInputPadding}px`);
    
    // 标记平台类型
    root.classList.add(`platform-${Capacitor.getPlatform()}`);
  }

  /**
   * 解析像素值
   */
  private parsePxValue(value: string): number {
    if (!value || value === 'none' || value === 'auto') {
      return 0;
    }

    // 匹配 px 值
    const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
    if (pxMatch) {
      return parseFloat(pxMatch[1]);
    }

    // 匹配纯数字
    const numMatch = value.match(/^(\d+(?:\.\d+)?)$/);
    if (numMatch) {
      return parseFloat(numMatch[1]);
    }

    return 0;
  }

  /**
   * 获取当前安全区域
   */
  public getCurrentInsets(): SafeAreaInsets {
    return { ...this.currentInsets };
  }

  /**
   * 刷新安全区域（方向改变、键盘弹出时调用）
   */
  public refresh(): void {
    if (!this.isInitialized) return;

    try {
      this.readSafeAreaFromCSS();
      this.applySafeAreaToCSS();
      this.notifyListeners();
    } catch (error) {
      console.error('[SafeAreaService] 刷新失败:', error);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const insets = this.getCurrentInsets();
    this.listeners.forEach(callback => {
      try {
        callback(insets);
      } catch (error) {
        console.error('[SafeAreaService] 监听器回调失败:', error);
      }
    });
  }

  /**
   * 添加安全区域变化监听器
   */
  public addListener(callback: (insets: SafeAreaInsets) => void): () => void {
    this.listeners.push(callback);
    
    // 返回移除监听器的函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 检查是否已初始化
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 获取特定区域的安全距离
   */
  public getInset(side: 'top' | 'right' | 'bottom' | 'left'): number {
    return this.currentInsets[side];
  }

  /**
   * 检查是否有底部安全区域（用于判断是否有底部导航栏）
   */
  public hasBottomInset(): boolean {
    return this.currentInsets.bottom > 0;
  }

  /**
   * 获取聊天输入框应该使用的底部边距
   */
  public getChatInputBottomPadding(): number {
    return this.currentInsets.bottom > 0 ? this.currentInsets.bottom + 8 : 8;
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    
    this.listeners = [];
    this.isInitialized = false;
  }
}

// 导出单例实例
export const safeAreaService = SafeAreaService.getInstance();
