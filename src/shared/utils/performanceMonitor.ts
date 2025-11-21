import { getFeatureFlag } from '../config/featureFlags';

/**
 * 性能监控器
 * 用于收集和分析 BlockManager 的性能数据
 */
class PerformanceMonitor {
  private enabled: boolean = false;
  private metrics: {
    reduxUpdateCount: number;
    renderCount: number;
    dbWriteCount: number;
    startTime: number;
    endTime: number | null;
  } = {
    reduxUpdateCount: 0,
    renderCount: 0,
    dbWriteCount: 0,
    startTime: 0,
    endTime: null
  };

  constructor() {
    this.enabled = getFeatureFlag('ENABLE_PERFORMANCE_MONITORING');
  }

  /**
   * 开始监控
   */
  start(): void {
    if (!this.enabled) return;

    this.metrics = {
      reduxUpdateCount: 0,
      renderCount: 0,
      dbWriteCount: 0,
      startTime: Date.now(),
      endTime: null
    };

    console.log('[PerformanceMonitor] 开始监控');
  }

  /**
   * 记录 Redux 更新
   */
  recordReduxUpdate(): void {
    if (!this.enabled) return;
    this.metrics.reduxUpdateCount++;
  }

  /**
   * 记录组件渲染
   */
  recordRender(): void {
    if (!this.enabled) return;
    this.metrics.renderCount++;
  }

  /**
   * 记录数据库写入
   */
  recordDbWrite(): void {
    if (!this.enabled) return;
    this.metrics.dbWriteCount++;
  }

  /**
   * 停止监控并输出结果
   */
  stop() {
    if (!this.enabled) return;

    this.metrics.endTime = Date.now();
    const duration = this.metrics.endTime - this.metrics.startTime;

    console.log('='.repeat(60));
    console.log('[PerformanceMonitor] 性能监控结果');
    console.log('='.repeat(60));
    console.log(`总耗时: ${duration}ms`);
    console.log(`Redux 更新次数: ${this.metrics.reduxUpdateCount}`);
    console.log(`组件渲染次数: ${this.metrics.renderCount}`);
    console.log(`数据库写入次数: ${this.metrics.dbWriteCount}`);
    console.log(`平均更新间隔: ${(duration / this.metrics.reduxUpdateCount).toFixed(2)}ms`);
    console.log('='.repeat(60));

    // 验证是否达标
    const passed = this.metrics.reduxUpdateCount < 20 && this.metrics.renderCount < 50;
    console.log(passed ? '✅ 性能测试通过' : '❌ 性能测试未通过');

    return this.getMetrics();
  }

  /**
   * 获取当前指标
   */
  getMetrics() {
    return {
      ...this.metrics,
      duration: this.metrics.endTime 
        ? this.metrics.endTime - this.metrics.startTime 
        : Date.now() - this.metrics.startTime
    };
  }

  /**
   * 重置监控
   */
  reset(): void {
    this.metrics = {
      reduxUpdateCount: 0,
      renderCount: 0,
      dbWriteCount: 0,
      startTime: Date.now(),
      endTime: null
    };
  }
}

/**
 * 全局性能监控实例
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * 在浏览器控制台使用的辅助函数
 */
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
  (window as any).startPerformanceMonitoring = () => {
    performanceMonitor.start();
    console.log('✅ 性能监控已启动，发送一条消息后查看结果');
  };
  (window as any).stopPerformanceMonitoring = () => {
    return performanceMonitor.stop();
  };
}

export default performanceMonitor;
