/**
 * 平台检测工具
 * 用于检测当前运行环境：Web、Capacitor (移动端)、Tauri (桌面端)
 */

export enum PlatformType {
  WEB = 'web',
  CAPACITOR = 'capacitor', // 移动端
  TAURI = 'tauri', // 桌面端
}

export interface PlatformInfo {
  type: PlatformType;
  isMobile: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  platform: string;
  userAgent: string;
}

/**
 * 检测当前平台类型
 */
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

/**
 * 获取详细的平台信息
 */
export function getPlatformInfo(): PlatformInfo {
  const type = detectPlatform();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : '';

  return {
    type,
    isMobile: type === PlatformType.CAPACITOR,
    isDesktop: type === PlatformType.TAURI,
    isWeb: type === PlatformType.WEB,
    platform,
    userAgent,
  };
}

/**
 * 检查是否为移动端环境
 */
export function isMobile(): boolean {
  return detectPlatform() === PlatformType.CAPACITOR;
}

/**
 * 检查是否为桌面端环境
 */
export function isDesktop(): boolean {
  return detectPlatform() === PlatformType.TAURI;
}

/**
 * 检查是否为 Web 环境
 */
export function isWeb(): boolean {
  return detectPlatform() === PlatformType.WEB;
}

/**
 * 检查是否为 Tauri 环境
 */
export function isTauri(): boolean {
  return detectPlatform() === PlatformType.TAURI;
}

/**
 * 检查是否为 Capacitor 环境
 */
export function isCapacitor(): boolean {
  return detectPlatform() === PlatformType.CAPACITOR;
}

/**
 * 获取平台特定的配置
 */
export function getPlatformConfig() {
  const platformInfo = getPlatformInfo();
  
  return {
    // 窗口配置
    window: {
      defaultWidth: platformInfo.isDesktop ? 1200 : undefined,
      defaultHeight: platformInfo.isDesktop ? 800 : undefined,
      minWidth: platformInfo.isDesktop ? 800 : undefined,
      minHeight: platformInfo.isDesktop ? 600 : undefined,
    },
    
    // 功能支持
    features: {
      fileSystem: platformInfo.isDesktop || platformInfo.isMobile,
      notifications: true,
      clipboard: true,
      camera: platformInfo.isMobile,
      microphone: true,
      fullscreen: platformInfo.isDesktop,
      windowControls: platformInfo.isDesktop,
    },
    
    // UI 配置
    ui: {
      showTitleBar: platformInfo.isDesktop,
      showMobileNavigation: platformInfo.isMobile,
      compactMode: platformInfo.isMobile,
      sidebarCollapsible: platformInfo.isDesktop,
    },
  };
}
