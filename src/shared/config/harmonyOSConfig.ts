/**
 * HarmonyOS 配置文件
 * 鸿蒙系统专用配置和常量
 */

/**
 * 鸿蒙权限类型
 */
export enum HarmonyOSPermission {
  // 剪贴板权限
  READ_CLIPBOARD = 'ohos.permission.READ_CLIPBOARD',
  WRITE_CLIPBOARD = 'ohos.permission.WRITE_CLIPBOARD',
  
  // 存储权限
  READ_USER_STORAGE = 'ohos.permission.READ_USER_STORAGE',
  WRITE_USER_STORAGE = 'ohos.permission.WRITE_USER_STORAGE',
  
  // 相机权限
  CAMERA = 'ohos.permission.CAMERA',
  MEDIA_LOCATION = 'ohos.permission.MEDIA_LOCATION',
  
  // 麦克风权限
  MICROPHONE = 'ohos.permission.MICROPHONE',
  
  // 通知权限
  NOTIFICATION = 'ohos.permission.NOTIFICATION',
  
  // 网络权限
  INTERNET = 'ohos.permission.INTERNET',
  GET_NETWORK_INFO = 'ohos.permission.GET_NETWORK_INFO',
  
  // 设备信息权限
  GET_DEVICE_INFO = 'ohos.permission.GET_DEVICE_INFO',
}

/**
 * 权限状态
 */
export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt',
  PERMANENT_DENIED = 'permanent_denied', // 永久拒绝，需要引导用户到设置
}

/**
 * 权限配置
 */
export interface PermissionConfig {
  permission: HarmonyOSPermission;
  name: string;
  description: string;
  reason: string;
  usageScenes: string[];
  critical: boolean; // 是否为关键权限
  fallbackAvailable: boolean; // 是否有降级方案
}

/**
 * 鸿蒙权限配置映射
 */
export const HARMONYOS_PERMISSION_CONFIG: Record<HarmonyOSPermission, PermissionConfig> = {
  [HarmonyOSPermission.READ_CLIPBOARD]: {
    permission: HarmonyOSPermission.READ_CLIPBOARD,
    name: '读取剪贴板',
    description: '允许应用读取剪贴板内容',
    reason: '为了支持粘贴功能，需要读取剪贴板中的文本和图片',
    usageScenes: ['聊天输入框粘贴', '代码编辑器粘贴', '文件路径粘贴'],
    critical: true,
    fallbackAvailable: false,
  },
  [HarmonyOSPermission.WRITE_CLIPBOARD]: {
    permission: HarmonyOSPermission.WRITE_CLIPBOARD,
    name: '写入剪贴板',
    description: '允许应用写入内容到剪贴板',
    reason: '为了支持复制功能，需要将文本、代码等内容写入剪贴板',
    usageScenes: ['复制消息内容', '复制代码块', '分享链接'],
    critical: true,
    fallbackAvailable: false,
  },
  [HarmonyOSPermission.READ_USER_STORAGE]: {
    permission: HarmonyOSPermission.READ_USER_STORAGE,
    name: '读取存储',
    description: '允许应用读取用户文件',
    reason: '为了上传文件和图片，需要访问您的文件系统',
    usageScenes: ['上传文档', '选择图片', '导入数据'],
    critical: false,
    fallbackAvailable: true,
  },
  [HarmonyOSPermission.WRITE_USER_STORAGE]: {
    permission: HarmonyOSPermission.WRITE_USER_STORAGE,
    name: '写入存储',
    description: '允许应用保存文件',
    reason: '为了导出聊天记录和保存文件，需要写入存储权限',
    usageScenes: ['导出聊天记录', '保存生成的文件', '下载附件'],
    critical: false,
    fallbackAvailable: true,
  },
  [HarmonyOSPermission.CAMERA]: {
    permission: HarmonyOSPermission.CAMERA,
    name: '相机',
    description: '允许应用使用相机',
    reason: '为了拍照和扫描二维码，需要访问相机',
    usageScenes: ['拍照上传', '扫描二维码', '视频通话'],
    critical: false,
    fallbackAvailable: true,
  },
  [HarmonyOSPermission.MEDIA_LOCATION]: {
    permission: HarmonyOSPermission.MEDIA_LOCATION,
    name: '媒体位置',
    description: '允许应用访问照片的位置信息',
    reason: '为了显示照片的拍摄位置',
    usageScenes: ['查看照片位置', '地图定位'],
    critical: false,
    fallbackAvailable: true,
  },
  [HarmonyOSPermission.MICROPHONE]: {
    permission: HarmonyOSPermission.MICROPHONE,
    name: '麦克风',
    description: '允许应用使用麦克风',
    reason: '为了支持语音输入和语音消息，需要访问麦克风',
    usageScenes: ['语音转文字', '发送语音消息', '语音通话'],
    critical: false,
    fallbackAvailable: true,
  },
  [HarmonyOSPermission.NOTIFICATION]: {
    permission: HarmonyOSPermission.NOTIFICATION,
    name: '通知',
    description: '允许应用发送通知',
    reason: '为了及时提醒您新消息和重要事件',
    usageScenes: ['消息提醒', '任务完成通知', '系统提醒'],
    critical: false,
    fallbackAvailable: true,
  },
  [HarmonyOSPermission.INTERNET]: {
    permission: HarmonyOSPermission.INTERNET,
    name: '网络访问',
    description: '允许应用访问网络',
    reason: '应用需要联网才能正常使用',
    usageScenes: ['API 请求', '数据同步', '在线通信'],
    critical: true,
    fallbackAvailable: false,
  },
  [HarmonyOSPermission.GET_NETWORK_INFO]: {
    permission: HarmonyOSPermission.GET_NETWORK_INFO,
    name: '网络状态',
    description: '允许应用获取网络状态',
    reason: '为了判断网络连接状态，提供更好的用户体验',
    usageScenes: ['网络监测', '离线提示', '自动重连'],
    critical: false,
    fallbackAvailable: true,
  },
  [HarmonyOSPermission.GET_DEVICE_INFO]: {
    permission: HarmonyOSPermission.GET_DEVICE_INFO,
    name: '设备信息',
    description: '允许应用获取设备信息',
    reason: '为了适配不同设备，提供最佳体验',
    usageScenes: ['设备识别', '性能优化', '兼容性检测'],
    critical: false,
    fallbackAvailable: true,
  },
};

/**
 * 鸿蒙系统版本
 */
export const HARMONYOS_VERSIONS = {
  MIN_VERSION: '4.0',
  TARGET_VERSION: '5.0',
  RECOMMENDED_VERSION: '5.0',
};

/**
 * 鸿蒙特性支持检测
 */
export interface HarmonyOSFeatures {
  webView: boolean; // 是否支持鸿蒙 WebView
  gestureNavigation: boolean; // 是否支持手势导航
  darkMode: boolean; // 是否支持深色模式
  splitScreen: boolean; // 是否支持分屏
  foldable: boolean; // 是否为折叠屏设备
}

/**
 * 检测鸿蒙特性支持
 */
export function detectHarmonyOSFeatures(): HarmonyOSFeatures {
  if (typeof window === 'undefined') {
    return {
      webView: false,
      gestureNavigation: false,
      darkMode: false,
      splitScreen: false,
      foldable: false,
    };
  }

  // @ts-ignore - 检测鸿蒙特定 API
  const harmonyAPI = window.harmony || window.HarmonyOS || {};

  return {
    webView: !!harmonyAPI.webView,
    gestureNavigation: !!harmonyAPI.gestureNavigation,
    darkMode: !!harmonyAPI.darkMode || window.matchMedia('(prefers-color-scheme: dark)').matches,
    splitScreen: !!harmonyAPI.splitScreen,
    foldable: !!harmonyAPI.foldable,
  };
}

/**
 * 鸿蒙剪贴板特殊配置
 */
export const HARMONYOS_CLIPBOARD_CONFIG = {
  // 剪贴板访问需要用户交互
  requiresUserGesture: true,
  
  // 剪贴板读取超时（毫秒）
  readTimeout: 5000,
  
  // 剪贴板写入超时（毫秒）
  writeTimeout: 3000,
  
  // 最大重试次数
  maxRetries: 3,
  
  // 重试间隔（毫秒）
  retryDelay: 1000,
  
  // 是否显示权限提示
  showPermissionPrompt: true,
  
  // 权限被拒绝后的提示文本
  permissionDeniedMessage: '剪贴板权限被拒绝，部分功能可能无法使用',
  
  // 引导用户到设置的文本
  guideToSettingsMessage: '请在设置中开启剪贴板权限',
};

/**
 * 鸿蒙错误码
 */
export enum HarmonyOSErrorCode {
  PERMISSION_DENIED = 'HARMONYOS_PERMISSION_DENIED',
  PERMISSION_PERMANENT_DENIED = 'HARMONYOS_PERMISSION_PERMANENT_DENIED',
  CLIPBOARD_ACCESS_DENIED = 'HARMONYOS_CLIPBOARD_ACCESS_DENIED',
  CLIPBOARD_READ_TIMEOUT = 'HARMONYOS_CLIPBOARD_READ_TIMEOUT',
  CLIPBOARD_WRITE_TIMEOUT = 'HARMONYOS_CLIPBOARD_WRITE_TIMEOUT',
  UNSUPPORTED_FEATURE = 'HARMONYOS_UNSUPPORTED_FEATURE',
  API_NOT_AVAILABLE = 'HARMONYOS_API_NOT_AVAILABLE',
}

/**
 * 鸿蒙错误消息
 */
export const HARMONYOS_ERROR_MESSAGES: Record<HarmonyOSErrorCode, string> = {
  [HarmonyOSErrorCode.PERMISSION_DENIED]: '权限被拒绝',
  [HarmonyOSErrorCode.PERMISSION_PERMANENT_DENIED]: '权限被永久拒绝，请在设置中手动开启',
  [HarmonyOSErrorCode.CLIPBOARD_ACCESS_DENIED]: '无法访问剪贴板，请授予权限',
  [HarmonyOSErrorCode.CLIPBOARD_READ_TIMEOUT]: '读取剪贴板超时',
  [HarmonyOSErrorCode.CLIPBOARD_WRITE_TIMEOUT]: '写入剪贴板超时',
  [HarmonyOSErrorCode.UNSUPPORTED_FEATURE]: '当前设备不支持此功能',
  [HarmonyOSErrorCode.API_NOT_AVAILABLE]: 'API 不可用',
};

