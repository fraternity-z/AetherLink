/**
 * 滚动性能优化配置
 * 集中管理所有与滚动性能相关的CSS属性和配置
 */

// 🚀 硬件加速和合成层优化的通用样式
export const scrollOptimizationStyles = {
  // 基础硬件加速
  willChange: 'transform',
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const,
  
  // 渲染优化
  contain: 'layout style paint' as const,
  
  // 3D渲染上下文
  perspective: 1000,
} as const;

// 🚀 滚动容器优化样式
export const scrollContainerStyles = {
  ...scrollOptimizationStyles,
  willChange: 'scroll-position',
  
  // iOS滚动优化
  WebkitOverflowScrolling: 'touch',
  
  // 禁用平滑滚动以提升性能
  scrollBehavior: 'auto' as const,
} as const;

// 🚀 消息项优化样式
export const messageItemStyles = {
  ...scrollOptimizationStyles,
  
  // 避免layout thrashing
  position: 'relative' as const,
  
  // 优化重绘
  isolation: 'isolate' as const,
} as const;

// 🚀 气泡样式优化
export const bubbleStyles = {
  ...messageItemStyles,
  
  // 减少圆角计算负担
  borderRadius: '8px',
  
  // 移除性能杀手效果
  // backdropFilter: 'none',
  // WebkitBackdropFilter: 'none',
  
  // 简化阴影
  boxShadow: 'none',
} as const;

// 🚀 滚动条优化样式
export const scrollbarStyles = (isDark: boolean) => ({
  scrollbarWidth: 'thin' as const,
  scrollbarColor: `${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} transparent`,
  
  '&::-webkit-scrollbar': {
    width: '3px', // 更细的滚动条
  },
  
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    borderRadius: '2px', // 减少圆角计算
  },
  
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
  },
});

// 🚀 性能监控配置
export const performanceConfig = {
  // ✅ 使用 rAF 自适应，不再使用固定 throttle
  useRAF: true,
  
  // resize 事件可以用较长的 debounce（用户不会一直 resize）
  resizeDebounce: 150,
  
  // 虚拟滚动配置
  virtualScrollThreshold: 50, // 超过50个项目启用虚拟滚动
  
  // overscan 根据帧率动态调整
  getOverscanCount: (fps: number) => {
    if (fps >= 120) return 8;  // 高刷需要更多预渲染
    if (fps >= 90) return 5;
    return 3;
  },
  
  // 渲染优化
  batchUpdateDelay: 16, // 批量更新延迟
  
  // 内存管理
  maxCachedItems: 100, // 最大缓存项目数
} as const;

// 🚀 检测设备性能等级
export const getDevicePerformanceLevel = (): 'low' | 'medium' | 'high' => {
  // 检测硬件并发数
  const cores = navigator.hardwareConcurrency || 4;
  
  // 检测内存（如果可用）
  const memory = (navigator as any).deviceMemory || 4;
  
  // 检测连接类型
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  
  if (cores >= 8 && memory >= 8 && effectiveType === '4g') {
    return 'high';
  } else if (cores >= 4 && memory >= 4) {
    return 'medium';
  } else {
    return 'low';
  }
};

// 🚀 检测设备实际刷新率
export const getRefreshRate = (): number => {
  // 方法1: 使用实验性 API（部分浏览器支持）
  if ('screen' in window && 'refreshRate' in (screen as any)) {
    return (screen as any).refreshRate;
  }
  
  // 方法2: 回退默认值
  return 60;
};

// 🚀 动态计算帧时间
export const getFrameTime = (): number => {
  const refreshRate = getRefreshRate();
  return Math.floor(1000 / refreshRate);
};

// 🚀 运行时测量实际帧率
export const measureActualFrameRate = (): Promise<number> => {
  return new Promise((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();
    
    const countFrame = () => {
      frameCount++;
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(countFrame);
      } else {
        resolve(frameCount);
      }
    };
    
    requestAnimationFrame(countFrame);
  });
};

// 🚀 根据设备性能调整配置
export const getOptimizedConfig = () => {
  const performanceLevel = getDevicePerformanceLevel();
  
  switch (performanceLevel) {
    case 'high':
      return {
        ...performanceConfig,
        virtualScrollThreshold: 100,
      };
    
    case 'medium':
      return {
        ...performanceConfig,
        virtualScrollThreshold: 50,
      };
    
    case 'low':
      return {
        ...performanceConfig,
        virtualScrollThreshold: 20,
      };
    
    default:
      return performanceConfig;
  }
};

// 🚀 调试工具
export const debugScrollPerformance = () => {
  const config = getOptimizedConfig();
  const level = getDevicePerformanceLevel();
  
  console.log('🚀 滚动性能配置:', {
    设备性能等级: level,
    硬件并发数: navigator.hardwareConcurrency,
    设备内存: (navigator as any).deviceMemory,
    网络类型: (navigator as any).connection?.effectiveType,
    优化配置: config,
  });
  
  return { level, config };
};
