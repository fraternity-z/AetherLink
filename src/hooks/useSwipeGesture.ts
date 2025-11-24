import { useCallback, useRef, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  onSwipeProgress?: (deltaX: number, direction: 'left' | 'right') => void; // 滑动进度回调（实际像素值）
  threshold?: number; // 触发手势的最小距离
  velocityThreshold?: number; // 触发手势的最小速度
  preventDefaultOnSwipe?: boolean; // 是否在滑动时阻止默认行为
  enabled?: boolean; // 是否启用手势
  edgeThreshold?: number; // 边缘触发区域宽度（像素）
  enableEdgeDetection?: boolean; // 是否启用边缘检测
  maxSwipeDistance?: number; // 最大滑动距离（像素），用于限制滑动范围
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  isTracking: boolean;
  currentX: number;
  currentY: number;
}

/**
 * 滑动手势Hook
 * 支持左滑和右滑检测，可用于侧边栏控制等场景
 */
export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipeRight,
    onSwipeLeft,
    onSwipeProgress,
    threshold = 50, // 最小滑动距离50px
    velocityThreshold = 0.3, // 最小速度0.3px/ms
    preventDefaultOnSwipe = false,
    enabled = true,
    edgeThreshold = 50, // 边缘区域宽度50px
    enableEdgeDetection = false, // 默认不启用边缘检测
    maxSwipeDistance = 320 // 默认最大滑动距离320px（侧边栏宽度）
  } = options;

  const swipeStateRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false,
    currentX: 0,
    currentY: 0
  });

  const [isSwipeActive, setIsSwipeActive] = useState(false);

  // 重置滑动状态
  const resetSwipeState = useCallback(() => {
    swipeStateRef.current = {
      startX: 0,
      startY: 0,
      startTime: 0,
      isTracking: false,
      currentX: 0,
      currentY: 0
    };
    setIsSwipeActive(false);
  }, []);

  // 触摸开始
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    const now = Date.now();

    // 如果启用边缘检测，在后续的滑动处理中会进行边缘检查
    // 这里不做预先过滤，让所有触摸都通过，在滑动结束时再判断是否有效

    swipeStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      isTracking: true,
      currentX: touch.clientX,
      currentY: touch.clientY
    };

    setIsSwipeActive(true);
  }, [enabled, enableEdgeDetection, edgeThreshold]);

  // 触摸移动
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !swipeStateRef.current.isTracking) return;

    const touch = e.touches[0];
    const state = swipeStateRef.current;

    state.currentX = touch.clientX;
    state.currentY = touch.clientY;

    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    // 如果垂直滑动距离大于水平滑动距离，则不处理（可能是滚动）
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    // 计算滑动进度并触发回调（传递实际像素值）
    if (onSwipeProgress && Math.abs(deltaX) > 5) {
      // 如果启用边缘检测，只在有效的边缘区域内才显示进度
      let shouldShowProgress = true;

      if (enableEdgeDetection) {
        const startX = state.startX;
        const isStartInLeftEdge = startX <= edgeThreshold;

        // 右滑：必须从左边缘开始（打开侧边栏）
        // 左滑：任意位置都可以（关闭侧边栏）
        shouldShowProgress = (deltaX > 0 && isStartInLeftEdge) || (deltaX < 0);
      }

      if (shouldShowProgress) {
        // 限制滑动距离在 0 到 maxSwipeDistance 之间
        const clampedDeltaX = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, deltaX));
        const direction = deltaX > 0 ? 'right' : 'left';
        onSwipeProgress(clampedDeltaX, direction);
      }
    }

    // 如果水平滑动距离超过阈值，阻止默认行为（如果启用）
    if (preventDefaultOnSwipe && Math.abs(deltaX) > threshold / 2) {
      e.preventDefault();
    }
  }, [enabled, threshold, preventDefaultOnSwipe, onSwipeProgress, enableEdgeDetection, edgeThreshold]);

  // 触摸结束
  const handleTouchEnd = useCallback((_e: TouchEvent) => {
    if (!enabled || !swipeStateRef.current.isTracking) return;

    const state = swipeStateRef.current;
    const endTime = Date.now();
    const deltaTime = endTime - state.startTime;
    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;

    // 计算速度 (px/ms)
    const velocity = Math.abs(deltaX) / deltaTime;

    // 检查是否满足滑动条件
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isDistanceEnough = Math.abs(deltaX) > threshold;
    const isVelocityEnough = velocity > velocityThreshold;

    // 追踪是否触发了操作
    let triggered = false;

    if (isHorizontalSwipe && (isDistanceEnough || isVelocityEnough)) {
      // 如果启用边缘检测，还需要验证滑动方向和起始位置的匹配
      if (enableEdgeDetection) {
        const startX = state.startX;
        const isStartInLeftEdge = startX <= edgeThreshold;

        if (deltaX > 0 && onSwipeRight && isStartInLeftEdge) {
          // 右滑：从左边缘开始，用于打开侧边栏
          onSwipeRight();
          triggered = true;
        } else if (deltaX < 0 && onSwipeLeft) {
          // 左滑：任意位置都可以，用于关闭侧边栏
          onSwipeLeft();
          triggered = true;
        }
      } else {
        // 不启用边缘检测时的原有逻辑
        if (deltaX > 0 && onSwipeRight) {
          // 右滑
          onSwipeRight();
          triggered = true;
        } else if (deltaX < 0 && onSwipeLeft) {
          // 左滑
          onSwipeLeft();
          triggered = true;
        }
      }
    }

    // 只有在未触发操作时才重置进度，避免回弹
    // 如果触发了操作，让状态变化自然完成动画
    if (!triggered && onSwipeProgress) {
      onSwipeProgress(0, deltaX > 0 ? 'right' : 'left');
    }

    resetSwipeState();
  }, [enabled, threshold, velocityThreshold, onSwipeRight, onSwipeLeft, onSwipeProgress, enableEdgeDetection, edgeThreshold, resetSwipeState]);

  // 触摸取消
  const handleTouchCancel = useCallback(() => {
    const state = swipeStateRef.current;
    const deltaX = state.currentX - state.startX;
    // 重置进度
    if (onSwipeProgress) {
      onSwipeProgress(0, deltaX > 0 ? 'right' : 'left');
    }
    resetSwipeState();
  }, [resetSwipeState, onSwipeProgress]);

  // 绑定事件监听器的函数
  const bindSwipeEvents = useCallback((element: HTMLElement | null) => {
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  // React事件处理器（用于React组件）
  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      handleTouchStart(e.nativeEvent);
    },
    onTouchMove: (e: React.TouchEvent) => {
      handleTouchMove(e.nativeEvent);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      handleTouchEnd(e.nativeEvent);
    },
    onTouchCancel: () => {
      handleTouchCancel();
    }
  };

  return {
    swipeHandlers,
    bindSwipeEvents,
    isSwipeActive,
    resetSwipeState
  };
};

/**
 * 专门用于侧边栏的滑动手势Hook
 * 预配置了适合侧边栏的参数
 */
export const useSidebarSwipeGesture = (
  onOpenSidebar?: () => void,
  onCloseSidebar?: () => void,
  enabled: boolean = true,
  onSwipeProgress?: (deltaX: number, direction: 'left' | 'right') => void,
  drawerWidth: number = 320
) => {
  return useSwipeGesture({
    onSwipeRight: onOpenSidebar,
    onSwipeLeft: onCloseSidebar,
    onSwipeProgress,
    threshold: drawerWidth * 0.4, // 滑动超过40%宽度才触发
    velocityThreshold: 0.3, // 降低速度要求，让手势更灵敏
    preventDefaultOnSwipe: true, // 阻止默认行为
    enabled,
    enableEdgeDetection: true, // 启用边缘检测
    edgeThreshold: 50, // 增大边缘区域到50px，更容易触发
    maxSwipeDistance: drawerWidth // 最大滑动距离等于侧边栏宽度
  });
};
