import { useState, useEffect } from 'react';
import { EdgeToEdge } from 'capacitor-edge-to-edge';
import { Capacitor } from '@capacitor/core';

/**
 * 极简键盘管理 Hook - 模仿 rikkahub 的 WindowInsets.isImeVisible + imePadding
 * 
 * 核心理念：
 * - 检测键盘可见性和高度
 * - 提供键盘高度用于动态调整布局（类似 imePadding）
 * - 极简状态管理（只有 2 个状态，200+ 行代码减少到 40 行）
 * 
 * 参考：
 * - rikkahub 项目：docs/rikkahub-master/app/src/main/java/me/rerere/rikkahub/ui/components/ai/ChatInput.kt
 * - Android Compose: WindowInsets.isImeVisible + modifier.imePadding()
 * - 官方 Capacitor Keyboard 实现（已整合到 capacitor-edge-to-edge）
 * 
 * 使用方式：
 * ```typescript
 * const { isKeyboardVisible, keyboardHeight, hideKeyboard } = useKeyboard();
 * 
 * // 1. 检测键盘状态 - 类似 WindowInsets.isImeVisible
 * useEffect(() => {
 *   if (isKeyboardVisible && expanded) {
 *     setExpanded(false); // 键盘弹出时自动折叠输入框
 *   }
 * }, [isKeyboardVisible, expanded]);
 * 
 * // 2. 动态调整布局 - 类似 modifier.imePadding()
 * <div style={{ bottom: keyboardHeight }}>
 *   // 输入框会自动上移到键盘上方
 * </div>
 * 
 * // 3. 发送消息时隐藏键盘 - 类似 keyboardController?.hide()
 * const handleSend = () => {
 *   hideKeyboard();
 *   onSend();
 * };
 * ```
 * 
 * @returns {Object} 键盘管理对象
 * @property {boolean} isKeyboardVisible - 键盘是否可见（用于控制 UI 状态）
 * @property {number} keyboardHeight - 键盘高度（Android: DP，iOS: 像素）
 * @property {Function} hideKeyboard - 隐藏键盘的函数
 */
export const useKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    let showHandle: any;
    let hideHandle: any;

    /**
     * 监听 EdgeToEdge Keyboard 事件（整合自官方 Capacitor Keyboard）
     * 
     * keyboardWillShow 事件提供：
     * - keyboardHeight: 键盘高度（Android: DP，iOS: 像素）
     * 
     * 注意事项：
     * 1. Android 返回 DP 单位（跨设备一致）
     * 2. iOS 返回完整键盘高度（包含 safe area）
     * 3. 使用 willShow/willHide 获得更流畅的动画
     */
    const setupListeners = async () => {
      showHandle = await EdgeToEdge.addListener('keyboardWillShow', (info: any) => {
        setIsKeyboardVisible(true);
        // 获取键盘高度 - 类似 rikkahub 的 WindowInsets.ime
        setKeyboardHeight(info.keyboardHeight || 0);
      });

      hideHandle = await EdgeToEdge.addListener('keyboardWillHide', () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      });
    };

    setupListeners();

    return () => {
      showHandle?.remove();
      hideHandle?.remove();
    };
  }, [isNative]);

  /**
   * 隐藏键盘的工具函数 - 类似 rikkahub 的 keyboardController?.hide()
   * 
   * 使用场景：
   * - 发送消息后自动隐藏键盘
   * - 点击外部区域隐藏键盘
   * 
   * 示例：
   * ```typescript
   * const handleSubmit = () => {
   *   hideKeyboard(); // 先隐藏键盘
   *   onSend(message); // 再发送消息
   * };
   * ```
   */
  const hideKeyboard = () => {
    if (isNative) {
      // 使用 EdgeToEdge 的原生 hide() 方法
      EdgeToEdge.hide();
    }
  };

  return {
    isKeyboardVisible,
    keyboardHeight,  // 类似 imePadding 的高度值
    hideKeyboard,
  };
};
