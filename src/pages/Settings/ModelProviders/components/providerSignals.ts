/**
 * Signals 状态管理
 * 用于高频更新场景的性能优化
 * 
 * 优势：
 * 1. 自动依赖追踪 - 无需手动声明依赖
 * 2. 细粒度更新 - 只更新使用该 signal 的 DOM 节点
 * 3. 零 VDOM 开销 - 不触发组件 re-render
 */

import { signal, computed } from '@preact/signals-react';

// ============================================================================
// 测试相关 Signals
// ============================================================================

/**
 * 当前正在测试的模型 ID
 * 使用场景：模型列表中显示测试加载状态
 */
export const testingModelId = signal<string | null>(null);

/**
 * 测试模式开关
 * 使用场景：控制是否显示模型测试按钮
 */
export const testModeEnabled = signal<boolean>(false);

/**
 * 测试结果
 * 使用场景：显示 API 连接测试结果
 */
export const testResult = signal<{
  success: boolean;
  message: string;
} | null>(null);

/**
 * 计算属性：是否显示测试按钮
 * 结合全局配置和测试模式
 */
export const shouldShowTestButton = computed(() => {
  return testModeEnabled.value;
});

// ============================================================================
// UI 交互 Signals
// ============================================================================

/**
 * API Key 显示/隐藏状态
 * 使用场景：密码框的眼睛图标切换
 */
export const showApiKey = signal<boolean>(false);

/**
 * 对话框状态管理
 * 使用 Signals 避免父组件重渲染
 */
export const dialogStates = {
  addModel: signal<boolean>(false),
  editModel: signal<boolean>(false),
  deleteProvider: signal<boolean>(false),
  editProvider: signal<boolean>(false),
  customEndpoint: signal<boolean>(false),
  modelManagement: signal<boolean>(false),
  testResultDialog: signal<boolean>(false),
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 开始测试某个模型
 */
export function startTestingModel(modelId: string) {
  testingModelId.value = modelId;
  testResult.value = null;
}

/**
 * 结束模型测试
 */
export function finishTestingModel(success: boolean, message: string) {
  testingModelId.value = null;
  testResult.value = { success, message };
}

/**
 * 切换测试模式
 */
export function toggleTestMode() {
  testModeEnabled.value = !testModeEnabled.value;
}

/**
 * 重置所有 Signals（组件卸载时调用）
 */
export function resetProviderSignals() {
  testingModelId.value = null;
  testModeEnabled.value = false;
  testResult.value = null;
  showApiKey.value = false;
  
  // 重置所有对话框状态
  Object.values(dialogStates).forEach(signal => {
    signal.value = false;
  });
}

// ============================================================================
// 调试工具
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  // 在开发模式下暴露到 window 便于调试
  (window as any).__providerSignals = {
    testingModelId,
    testModeEnabled,
    testResult,
    showApiKey,
    dialogStates,
  };
}
