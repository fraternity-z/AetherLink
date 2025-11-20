/**
 * React ⇄ SolidJS 桥接层
 * 允许在 React 应用中嵌入 SolidJS 组件
 */
import React, { useEffect, useRef, useState } from 'react';
import { render } from 'solid-js/web';
import type { Component as SolidComponent } from 'solid-js';

interface SolidBridgeProps<T extends Record<string, any>> {
  /** SolidJS 组件 */
  component: SolidComponent<T>;
  /** 传递给 SolidJS 组件的 props */
  props?: T;
  /** 容器样式 */
  style?: React.CSSProperties;
  /** 容器类名 */
  className?: string;
  /** 卸载时的回调 */
  onUnmount?: () => void;
}

/**
 * 桥接组件：在 React 中渲染 SolidJS 组件
 * 
 * @example
 * ```tsx
 * import { SolidBridge } from '@/shared/bridges/SolidBridge';
 * import { MyPerformancePage } from '@/solid/pages/PerformancePage';
 * 
 * function ReactParent() {
 *   return (
 *     <SolidBridge
 *       component={MyPerformancePage}
 *       props={{ userId: '123' }}
 *     />
 *   );
 * }
 * ```
 */
export function SolidBridge<T extends Record<string, any>>({
  component: SolidComponentToRender,
  props = {} as T,
  style,
  className,
  onUnmount,
}: SolidBridgeProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const disposeRef = useRef<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 渲染 SolidJS 组件
    try {
      disposeRef.current = render(
        () => SolidComponentToRender(props),
        containerRef.current
      );
      setIsReady(true);
    } catch (error) {
      console.error('[SolidBridge] 渲染 SolidJS 组件失败:', error);
    }

    // 清理函数
    return () => {
      if (disposeRef.current) {
        disposeRef.current();
        disposeRef.current = null;
      }
      onUnmount?.();
      setIsReady(false);
    };
  }, [SolidComponentToRender]);

  // 当 props 变化时，重新渲染（注意：这会重置 SolidJS 组件的状态）
  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    // 如果需要响应 props 变化，重新渲染
    if (disposeRef.current) {
      disposeRef.current();
    }

    disposeRef.current = render(
      () => SolidComponentToRender(props),
      containerRef.current
    );
  }, [props, isReady]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      data-solid-bridge="true"
    />
  );
}

/**
 * 性能优化版本：使用 React.memo 避免不必要的重渲染
 */
export const MemoizedSolidBridge = React.memo(SolidBridge, (prevProps, nextProps) => {
  // 浅比较 props
  return (
    prevProps.component === nextProps.component &&
    JSON.stringify(prevProps.props) === JSON.stringify(nextProps.props) &&
    prevProps.className === nextProps.className
  );
}) as typeof SolidBridge;

/**
 * 惰性加载的 SolidJS 组件桥接
 * 用于代码分割和按需加载
 */
interface LazySolidBridgeProps<T extends Record<string, any>> {
  /** 返回 SolidJS 组件的 Promise */
  loader: () => Promise<{ default: SolidComponent<T> }>;
  /** 传递给组件的 props */
  props?: T;
  /** 加载中的占位组件 */
  fallback?: React.ReactNode;
  /** 容器样式 */
  style?: React.CSSProperties;
  /** 容器类名 */
  className?: string;
}

export function LazySolidBridge<T extends Record<string, any>>({
  loader,
  props,
  fallback = <div>Loading Solid component...</div>,
  style,
  className,
}: LazySolidBridgeProps<T>) {
  const [component, setComponent] = useState<SolidComponent<T> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loader()
      .then((module) => {
        setComponent(() => module.default);
      })
      .catch((err) => {
        console.error('[LazySolidBridge] 加载组件失败:', err);
        setError(err);
      });
  }, [loader]);

  if (error) {
    return <div style={{ color: 'red' }}>Failed to load component: {error.message}</div>;
  }

  if (!component) {
    return <>{fallback}</>;
  }

  return (
    <SolidBridge
      component={component}
      props={props}
      style={style}
      className={className}
    />
  );
}

