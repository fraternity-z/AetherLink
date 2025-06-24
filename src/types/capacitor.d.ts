// Capacitor 相关类型定义
export type VibrateStyle = 'HEAVY' | 'MEDIUM' | 'LIGHT'
export type CameraSource = 'CAMERA' | 'PHOTOS'
export type ToastDuration = 'short' | 'long'

// 全局类型定义
declare global {
  type VibrateStyleType = VibrateStyle
  type CameraSourceType = CameraSource
  type ToastDurationType = ToastDuration
}
