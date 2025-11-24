import { useState, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

/**
 * 键盘管理 Hook - 使用 Visual Viewport API 处理 iOS 键盘
 * 
 * 核心理念：
 * - iOS: 使用 window.visualViewport API（浏览器原生支持，最可靠）
 * - Android: 使用 Capacitor Keyboard 事件（性能更好）
 * - 极简状态管理
 * 
 * iOS 特殊处理：
 * - iOS WebView 键盘弹出时会触发 visualViewport resize
 * - visualViewport.height 会自动减去键盘高度
 * - 使用 `top: visualViewport.height` + `transform: translateY(-100%)` 定位
 * - 不会有二次跳动问题
 * 
 * 参考：
 * - https://saricden.com/how-to-make-fixed-elements-respect-the-virtual-keyboard-on-ios
 * - rikkahub 项目：docs/rikkahub-master/app/src/main/java/me/rerere/rikkahub/ui/components/ai/ChatInput.kt
 * - Android Compose: WindowInsets.isImeVisible + modifier.imePadding()
 * 
 * 使用方式：
 * ```typescript
 * const { isKeyboardVisible, keyboardHeight, visualViewportHeight, hideKeyboard } = useKeyboard();
 * 
 * // iOS: 使用 visualViewportHeight + top 定位
 * <div style={{ 
 *   position: 'fixed', 
 *   top: `${visualViewportHeight}px`,
 *   transform: 'translateY(-100%)'
 * }}>
 * 
 * // Android: 使用 keyboardHeight + bottom 定位
 * <div style={{ 
 *   position: 'fixed', 
 *   bottom: keyboardHeight 
 * }}>
 * ```
 * 
 * @returns {Object} 键盘管理对象
 * @property {boolean} isKeyboardVisible - 键盘是否可见
 * @property {number} keyboardHeight - Android 键盘高度（像素）
 * @property {number} visualViewportHeight - iOS Visual Viewport 高度（像素）
 * @property {Function} hideKeyboard - 隐藏键盘的函数
 */
export const useKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [visualViewportHeight, setVisualViewportHeight] = useState(
    typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : window.innerHeight
  );
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0);
  
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    if (!isNative) return;

    // 🚀 iOS: 使用 Visual Viewport API（最可靠的方案）
    if (isIOS && typeof window !== 'undefined' && window.visualViewport) {
      const vv = window.visualViewport;
      const initialHeight = window.innerHeight; // 使用 innerHeight 作为基准

      const handleResize = () => {
        const currentHeight = vv.height;
        const offsetTop = vv.offsetTop;
        
        setVisualViewportHeight(currentHeight);
        setVisualViewportOffsetTop(offsetTop);
        
        // 🔥 关键：直接计算键盘高度
        // keyboardHeight = innerHeight - (visualViewport.height + visualViewport.offsetTop)
        // 参考：https://stackoverflow.com/a/71547560
        const calculatedKeyboardHeight = Math.max(0, initialHeight - (currentHeight + offsetTop));
        
        const isKeyboardUp = calculatedKeyboardHeight > 100;
        setIsKeyboardVisible(isKeyboardUp);
        setKeyboardHeight(calculatedKeyboardHeight); // iOS 也设置 keyboardHeight
      };

      vv.addEventListener('resize', handleResize);
      vv.addEventListener('scroll', handleResize); // iOS 26+ bug workaround
      handleResize(); // 初始调用

      return () => {
        vv.removeEventListener('resize', handleResize);
        vv.removeEventListener('scroll', handleResize);
      };
    }
    
    // 🚀 Android: 使用 Capacitor Keyboard 事件（性能更好）
    if (!isIOS) {
      let showHandle: any;
      let hideHandle: any;

      const setupListeners = async () => {
        showHandle = await Keyboard.addListener('keyboardWillShow', (info: any) => {
          setIsKeyboardVisible(true);
          setKeyboardHeight(info.keyboardHeight || 0);
        });

        hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        });
      };

      setupListeners();

      return () => {
        showHandle?.remove();
        hideHandle?.remove();
      };
    }
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
    keyboardHeight,  // Android 键盘高度
    visualViewportHeight, // iOS Visual Viewport 高度
    visualViewportOffsetTop, // iOS Visual Viewport 偏移
    hideKeyboard,
  };
};
