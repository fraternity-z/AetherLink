/**
 * useScrollHandler - 使用 requestAnimationFrame 优化的滚动处理 hook
 * 
 * ✅ rAF 自动适应设备刷新率（60Hz/120Hz/144Hz）
 * ✅ 避免固定 throttle 值导致的性能问题
 */
import { useCallback, useEffect, useRef } from 'react';

/**
 * 使用 rAF 优化的滚动处理器
 * 自动适应设备刷新率，比固定 throttle 更高效
 */
export const useScrollHandler = (callback: (scrollTop: number) => void) => {
  const rafId = useRef<number | undefined>(undefined);
  const lastScrollTop = useRef<number>(0);
  
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    
    // 取消之前的帧，确保每帧只执行一次
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      // 检查是否真的滚动了（避免无意义的更新）
      if (target.scrollTop !== lastScrollTop.current) {
        lastScrollTop.current = target.scrollTop;
        callback(target.scrollTop);
      }
    });
  }, [callback]);
  
  // 清理 rAF
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);
  
  return handleScroll;
};

/**
 * 使用 rAF 优化的滚动处理器（带元素引用版本）
 */
export const useScrollHandlerWithRef = <T extends HTMLElement>(
  callback: (scrollTop: number, element: T) => void
) => {
  const rafId = useRef<number | undefined>(undefined);
  const lastScrollTop = useRef<number>(0);
  
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as T;
    
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      if (target.scrollTop !== lastScrollTop.current) {
        lastScrollTop.current = target.scrollTop;
        callback(target.scrollTop, target);
      }
    });
  }, [callback]);
  
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);
  
  return handleScroll;
};

/**
 * 使用 rAF + fps 感知的优化滚动 hook
 */
export const useOptimizedScroll = () => {
  const fpsRef = useRef(60);
  const measuredRef = useRef(false);
  
  useEffect(() => {
    if (measuredRef.current) return;
    measuredRef.current = true;
    
    // 异步测量帧率
    let frameCount = 0;
    const startTime = performance.now();
    let rafId: number;
    
    const countFrame = () => {
      frameCount++;
      if (performance.now() - startTime < 500) { // 500ms足够准确
        rafId = requestAnimationFrame(countFrame);
      } else {
        fpsRef.current = frameCount * 2; // 乘2得到每秒帧数
      }
    };
    
    rafId = requestAnimationFrame(countFrame);
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);
  
  // 根据帧率动态计算 overscan
  const getOverscan = useCallback(() => {
    const fps = fpsRef.current;
    if (fps >= 120) return 8;
    if (fps >= 90) return 5;
    return 3;
  }, []);
  
  return { 
    fps: fpsRef.current, 
    getOverscan 
  };
};

export default useScrollHandler;
