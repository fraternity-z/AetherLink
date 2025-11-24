import { useState, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
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
 * @property {number} keyboardHeight - 键盘高度（像素，用于调整布局位置）
 * @property {Function} hideKeyboard - 隐藏键盘的函数
 */
export const useKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    if (!isNative) return;

    let showHandle: any;
    let hideHandle: any;
    let debounceTimer: NodeJS.Timeout | null = null;

    /**
     * 监听 Capacitor Keyboard 事件
     * 
     * keyboardWillShow 事件提供：
     * - keyboardHeight: 键盘高度（像素）
     * 
     * iOS 特殊处理：
     * - iOS 键盘弹出时会触发两次布局调整
     * - 第一次：keyboardWillShow 正常定位
     * - 第二次：iOS WebView 自动调整（约 100-200ms 后）
     * - 解决方案：使用防抖，只采用第一次的值，忽略后续调整
     * 
     * 注意事项：
     * 1. 必须在 capacitor.config.ts 中配置：
     *    Keyboard: { resizeOnFullScreen: false }
     *    ios: { contentInset: 'never' }
     * 2. 使用 willShow/willHide 而不是 didShow/didHide，获得更流畅的动画
     */
    const setupListeners = async () => {
      showHandle = await Keyboard.addListener('keyboardWillShow', (info: any) => {
        // 🚀 iOS 防抖：只采用第一次的键盘高度，忽略二次调整
        if (isIOS && debounceTimer) {
          return; // 忽略二次触发
        }

        setIsKeyboardVisible(true);
        // 获取键盘高度 - 类似 rikkahub 的 WindowInsets.ime
        setKeyboardHeight(info.keyboardHeight || 0);

        // iOS 设置防抖锁，300ms 内忽略后续事件
        if (isIOS) {
          debounceTimer = setTimeout(() => {
            debounceTimer = null;
          }, 300);
        }
      });

      hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
        // 清除防抖锁
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      });
    };

    setupListeners();

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      showHandle?.remove();
      hideHandle?.remove();
    };
  }, [isNative, isIOS]);

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
      Keyboard.hide();
    }
  };

  return {
    isKeyboardVisible,
    keyboardHeight,  // 类似 imePadding 的高度值
    hideKeyboard,
  };
};
