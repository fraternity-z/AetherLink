/**
 * AppSidebar - 使用 Solid UI 的侧边栏组件
 * 基于 @kobalte/core 的 Dialog 组件实现
 */
import { createSignal, createEffect, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';

export interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: any;
  width?: number;
  themeMode?: 'light' | 'dark';
  enableSwipeGesture?: boolean; // 是否启用滑动手势（移动端）
  isDesktop?: boolean; // 是否是桌面端
}

export function AppSidebar(props: AppSidebarProps) {
  const width = () => props.width ?? 320;
  // 响应式访问 open 状态
  const isOpen = () => props.open;
  
  // 边缘滑动打开功能
  const [touchStartX, setTouchStartX] = createSignal(0);
  const [touchStartY, setTouchStartY] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragOffset, setDragOffset] = createSignal(0);
  const [isValidSwipe, setIsValidSwipe] = createSignal(false);
  
  const edgeThreshold = 30; // 边缘触发区域
  const swipeThreshold = 0.3; // 滑动触发阈值
  
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    const target = e.target as HTMLElement;
    
    // 检查触摸目标是否是需要排除手势捕获的元素
    // 包括：Slider、Dialog/Modal 遮罩层和内容、data-gesture-exclude 标记的元素
    const shouldExclude = target.closest(
      '[data-gesture-exclude], ' +
      '.MuiSlider-root, .MuiSlider-thumb, .MuiSlider-track, .MuiSlider-rail, ' +
      '.MuiDialog-root, .MuiDialog-container, .MuiDialog-paper, ' +
      '.MuiModal-root, .MuiBackdrop-root, ' +
      '[role="dialog"], [role="presentation"]'
    );
    if (shouldExclude) {
      setIsValidSwipe(false);
      return;
    }
    
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setIsValidSwipe(false);
    setIsDragging(false);
    setDragOffset(0);
    
    // 检查是否从边缘开始
    if (!isOpen() && touch.clientX <= edgeThreshold) {
      setIsValidSwipe(true);
    } else if (isOpen()) {
      setIsValidSwipe(true);
    }
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!isValidSwipe()) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX();
    const deltaY = touch.clientY - touchStartY();
    
    // 如果垂直滑动大于水平滑动，取消手势
    if (!isDragging() && Math.abs(deltaY) > Math.abs(deltaX)) {
      setIsValidSwipe(false);
      return;
    }
    
    // 开始拖拽
    if (!isDragging() && Math.abs(deltaX) > 10) {
      setIsDragging(true);
    }
    
    if (isDragging()) {
      if (isOpen()) {
        // 打开状态：只允许左滑关闭
        setDragOffset(Math.min(0, deltaX));
      } else {
        // 关闭状态：只允许右滑打开
        setDragOffset(Math.max(0, deltaX));
      }
      // 只有在事件可取消时才阻止默认行为，避免滚动中的警告
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (!isDragging()) {
      setIsValidSwipe(false);
      return;
    }
    
    const offset = dragOffset();
    const threshold = width() * swipeThreshold;
    
    if (isOpen()) {
      // 打开状态：左滑超过阈值则关闭
      if (Math.abs(offset) > threshold) {
        props.onOpenChange(false);
      }
    } else {
      // 关闭状态：右滑超过阈值则打开
      if (offset > threshold) {
        props.onOpenChange(true);
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
    setIsValidSwipe(false);
  };
  
  // 绑定全局触摸事件（仅在启用手势时）
  createEffect(() => {
    if (props.enableSwipeGesture === false) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    
    onCleanup(() => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    });
  });
  
  // 计算侧边栏位置
  const getTransform = () => {
    if (isDragging()) {
      const baseOffset = isOpen() ? 0 : -width();
      const finalOffset = Math.min(0, Math.max(-width(), baseOffset + dragOffset()));
      return `translateX(${finalOffset}px)`;
    }
    return isOpen() ? 'translateX(0)' : `translateX(-${width()}px)`;
  };
  
  // 计算遮罩透明度
  const getMaskOpacity = () => {
    if (isDragging()) {
      const progress = isOpen()
        ? 1 - Math.abs(dragOffset()) / width()
        : dragOffset() / width();
      return Math.max(0, Math.min(0.5, progress * 0.5));
    }
    return isOpen() ? 0.5 : 0;
  };
  
  const shouldShow = () => isOpen() || isDragging();
  
  const isDesktop = () => props.isDesktop ?? false;

  return (
    <Portal>
      {/* 遮罩层 - 仅移动端显示 */}
      {!isDesktop() && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            "z-index": 1200,
            "background-color": `rgba(0, 0, 0, ${getMaskOpacity()})`,
            opacity: shouldShow() ? 1 : 0,
            "pointer-events": shouldShow() ? 'auto' : 'none',
            transition: 'opacity 0.3s, background-color 0.3s',
          }}
          onClick={() => props.onOpenChange(false)}
        />
      )}
      
      {/* 侧边栏 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${width()}px`,
          // 桌面端 z-index 需要高于壁纸层(0-1)，但低于移动端遮罩
          "z-index": isDesktop() ? 10 : 1201,
          // 使用完全不透明的背景色，不受壁纸透明度影响
          "background-color": props.themeMode === 'dark' ? '#1a1a1a' : '#ffffff',
          "background-image": 'none', // 确保没有背景图
          opacity: 1, // 确保不透明
          "border-right": '1px solid rgba(0,0,0,0.1)',
          "border-radius": isDesktop() ? '0' : '0 16px 16px 0',
          "box-shadow": isDesktop() ? 'none' : '4px 0 20px rgba(0,0,0,0.15)',
          transform: getTransform(),
          transition: isDragging() ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          "flex-direction": 'column',
          overflow: 'hidden',
          // 隔离混合模式，防止被父元素透明度影响
          isolation: 'isolate',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 内容区域 - React 通过 Portal 渲染内容到这里 */}
        <div style={{ flex: 1, overflow: 'hidden' }} id="solid-sidebar-content">
          {props.children}
        </div>
      </div>
    </Portal>
  );
}

export default AppSidebar;
