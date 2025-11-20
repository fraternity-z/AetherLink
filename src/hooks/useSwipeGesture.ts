import { useRef, useCallback, useEffect } from 'react';

/**
 * 手势配置接口
 */
export interface SwipeGestureConfig {
  /** 边缘触发区域宽度（px） */
  edgeWidth?: number;
  /** 最小滑动距离阈值（px） */
  minSwipeDistance?: number;
  /** 最小滑动速度阈值（px/ms） */
  minSwipeVelocity?: number;
  /** 打开/关闭的位置阈值（0-1） */
  hysteresis?: number;
  /** 侧边栏宽度（px） */
  drawerWidth?: number;
  /** 是否启用手势 */
  enabled?: boolean;
  /** 是否启用调试日志 */
  debug?: boolean;
}

/**
 * 手势状态接口
 */
interface GestureState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 起始触摸点 X 坐标 */
  startX: number;
  /** 起始触摸点 Y 坐标 */
  startY: number;
  /** 当前触摸点 X 坐标 */
  currentX: number;
  /** 当前触摸点 Y 坐标 */
  currentY: number;
  /** 起始时间戳 */
  startTime: number;
  /** 当前拖拽偏移量 */
  dragOffset: number;
  /** 是否从边缘开始 */
  isEdgeSwipe: boolean;
}

/**
 * 手势回调接口
 */
export interface SwipeGestureCallbacks {
  /** 开始拖拽回调 */
  onDragStart?: () => void;
  /** 拖拽中回调 */
  onDragMove?: (offset: number, progress: number) => void;
  /** 拖拽结束回调 */
  onDragEnd?: (shouldOpen: boolean) => void;
  /** 手势取消回调 */
  onCancel?: () => void;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<SwipeGestureConfig> = {
  edgeWidth: 30,
  minSwipeDistance: 50,
  minSwipeVelocity: 0.3,
  hysteresis: 0.52,
  drawerWidth: 320,
  enabled: true,
  debug: false,
};

/**
 * 自定义 Hook：实现符合行业标准的滑动手势
 * 
 * 参考标准：
 * - Material Design Swipeable Drawer
 * - React Native Gesture Handler
 * - iOS Human Interface Guidelines
 * 
 * @param isOpen - 侧边栏是否打开
 * @param callbacks - 手势回调函数
 * @param config - 手势配置
 */
export function useSwipeGesture(
  isOpen: boolean,
  callbacks: SwipeGestureCallbacks,
  config: SwipeGestureConfig = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    edgeWidth,
    minSwipeDistance,
    minSwipeVelocity,
    hysteresis,
    drawerWidth,
    enabled,
    debug,
  } = mergedConfig;

  // 手势状态
  const gestureState = useRef<GestureState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    dragOffset: 0,
    isEdgeSwipe: false,
  });

  // 日志函数
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[SwipeGesture]', ...args);
    }
  }, [debug]);

  /**
   * 计算滑动速度（px/ms）
   */
  const calculateVelocity = useCallback((state: GestureState): number => {
    const deltaX = state.currentX - state.startX;
    const deltaTime = Date.now() - state.startTime;
    return deltaTime > 0 ? Math.abs(deltaX) / deltaTime : 0;
  }, []);

  /**
   * 判断是否应该打开侧边栏
   */
  const shouldOpen = useCallback((state: GestureState): boolean => {
    const deltaX = state.currentX - state.startX;
    const velocity = calculateVelocity(state);
    
    // 快速滑动：根据速度判断
    if (velocity > minSwipeVelocity) {
      log('快速滑动检测', { velocity, threshold: minSwipeVelocity, direction: deltaX > 0 ? '右' : '左' });
      return deltaX > 0;
    }
    
    // 慢速滑动：根据位置判断
    const progress = isOpen 
      ? 1 + (deltaX / drawerWidth)  // 已打开：从 1 开始减少
      : deltaX / drawerWidth;        // 未打开：从 0 开始增加
    
    log('位置判断', { progress, hysteresis, isOpen });
    return progress > hysteresis;
  }, [isOpen, drawerWidth, hysteresis, minSwipeVelocity, calculateVelocity, log]);

  /**
   * 处理触摸开始
   */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    const state = gestureState.current;

    // 检查是否在边缘区域
    const isInEdge = !isOpen && touch.clientX < edgeWidth;
    const isOnDrawer = isOpen && touch.clientX < drawerWidth;

    if (!isInEdge && !isOnDrawer) {
      log('触摸位置不在有效区域', { x: touch.clientX, edgeWidth, drawerWidth, isOpen });
      return;
    }

    // 初始化手势状态
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.currentX = touch.clientX;
    state.currentY = touch.clientY;
    state.startTime = Date.now();
    state.isEdgeSwipe = isInEdge;
    state.dragOffset = 0;

    log('触摸开始', { 
      x: touch.clientX, 
      y: touch.clientY,
      isEdgeSwipe: isInEdge,
      isOnDrawer 
    });
  }, [enabled, isOpen, edgeWidth, drawerWidth, log]);

  /**
   * 处理触摸移动
   */
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    const state = gestureState.current;

    // 更新当前位置
    state.currentX = touch.clientX;
    state.currentY = touch.clientY;

    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;

    // 如果还没开始拖拽，检查是否满足开始条件
    if (!state.isDragging) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // 距离太小，还不确定意图
      if (distance < 10) {
        return;
      }

      // 方向判断：水平滑动距离必须大于垂直滑动距离的 2 倍
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 2;
      
      if (!isHorizontal) {
        log('非水平滑动，取消手势', { deltaX, deltaY });
        callbacks.onCancel?.();
        return;
      }

      // 方向检查：从边缘滑动必须向右，从抽屉滑动必须向左
      const isValidDirection = state.isEdgeSwipe ? deltaX > 0 : deltaX < 0;
      
      if (!isValidDirection) {
        log('滑动方向无效', { isEdgeSwipe: state.isEdgeSwipe, deltaX });
        callbacks.onCancel?.();
        return;
      }

      // 开始拖拽
      state.isDragging = true;
      log('开始拖拽', { deltaX, deltaY, isHorizontal });
      callbacks.onDragStart?.();
      
      // 阻止默认行为和事件冒泡
      e.preventDefault();
    }

    // 正在拖拽中
    if (state.isDragging) {
      // 计算拖拽偏移量
      let offset = deltaX;
      
      // ✅ 简化：直接限制拖拽范围，不要橡皮筋效果
      if (isOpen) {
        // 已打开：只能向左拖（关闭方向），范围 [0, -drawerWidth]
        offset = Math.max(-drawerWidth, Math.min(0, offset));
      } else {
        // 未打开：只能向右拖（打开方向），范围 [0, drawerWidth]
        offset = Math.max(0, Math.min(drawerWidth, offset));
      }

      state.dragOffset = offset;

      // 计算进度（0-1）
      const progress = isOpen
        ? 1 + (offset / drawerWidth)
        : offset / drawerWidth;

      log('拖拽中', { offset, progress: progress.toFixed(2) });
      callbacks.onDragMove?.(offset, Math.max(0, Math.min(1, progress)));

      // 阻止默认行为
      e.preventDefault();
    }
  }, [enabled, isOpen, drawerWidth, callbacks, log]);

  /**
   * 处理触摸结束
   */
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const state = gestureState.current;

    if (!state.isDragging) {
      log('触摸结束（未拖拽）');
      return;
    }

    const deltaX = state.currentX - state.startX;
    const distance = Math.abs(deltaX);

    log('触摸结束', { 
      deltaX, 
      distance, 
      minDistance: minSwipeDistance 
    });

    // 检查是否满足最小滑动距离
    if (distance < minSwipeDistance) {
      log('滑动距离不足，取消操作');
      callbacks.onCancel?.();
    } else {
      // 判断是否应该打开
      const open = shouldOpen(state);
      log('手势完成', { shouldOpen: open });
      callbacks.onDragEnd?.(open);
    }

    // 重置状态
    state.isDragging = false;
    state.dragOffset = 0;

    e.preventDefault();
  }, [enabled, minSwipeDistance, shouldOpen, callbacks, log]);

  /**
   * 处理触摸取消
   */
  const handleTouchCancel = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const state = gestureState.current;

    if (state.isDragging) {
      log('触摸取消');
      callbacks.onCancel?.();
      state.isDragging = false;
      state.dragOffset = 0;
      
      // 阻止浏览器默认行为（如页面刷新）
      e.preventDefault();
    }
  }, [enabled, callbacks, log]);

  /**
   * 绑定事件监听器
   */
  useEffect(() => {
    if (!enabled) return;

    // 使用 passive: false 以便可以调用 preventDefault
    const options = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);
    document.addEventListener('touchcancel', handleTouchCancel, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return {
    isDragging: gestureState.current.isDragging,
    dragOffset: gestureState.current.dragOffset,
  };
}
