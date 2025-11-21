/**
 * Feature Flags 配置
 * 用于控制新功能的启用/禁用
 */

export const FeatureFlags = {
  /**
   * 启用性能监控
   * 记录 Redux 更新次数、渲染次数等性能指标
   */
  ENABLE_PERFORMANCE_MONITORING: false,  // 默认关闭，需要时开启

  /**
   * 启用详细日志
   * 用于调试和问题排查
   */
  ENABLE_VERBOSE_LOGGING: false,
} as const;

/**
 * 获取 Feature Flag 值
 */
export function getFeatureFlag(flag: keyof typeof FeatureFlags): boolean {
  return FeatureFlags[flag];
}

/**
 * 动态设置 Feature Flag（仅用于开发和测试）
 */
export function setFeatureFlag(flag: keyof typeof FeatureFlags, value: boolean): void {
  if (process.env.NODE_ENV === 'development') {
    (FeatureFlags as any)[flag] = value;
    console.log(`[FeatureFlags] ${flag} = ${value}`);
  } else {
    console.warn(`[FeatureFlags] 生产环境不允许动态修改 Feature Flags`);
  }
}

export default FeatureFlags;
