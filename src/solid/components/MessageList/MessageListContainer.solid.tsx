/**
 * MessageListContainer - 使用 SolidJS 的消息列表容器组件
 * 外壳用 SolidJS 实现滚动优化，内容由 React 通过 Portal 渲染
 */
import { createSignal, createEffect, onCleanup, onMount } from 'solid-js';

export interface MessageListContainerProps {
  children?: any;
  themeMode?: 'light' | 'dark';
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  onScrollToTop?: () => void;
  onScrollToBottom?: () => void;
  autoScrollToBottom?: boolean;
  isStreaming?: boolean;
  chatBackground?: {
    enabled: boolean;
  };
}

export function MessageListContainer(props: MessageListContainerProps) {
  let containerRef: HTMLDivElement | undefined;
  
  const [isNearBottom, setIsNearBottom] = createSignal(true);
  
  // 滚动阈值
  const BOTTOM_THRESHOLD = 150;
  const TOP_THRESHOLD = 100;
  
  // 节流控制
  let scrollThrottleTimer: number | null = null;
  const SCROLL_THROTTLE_MS = 16; // ~60fps
  
  // 处理滚动事件
  const handleScroll = () => {
    if (scrollThrottleTimer) return;
    
    scrollThrottleTimer = window.setTimeout(() => {
      scrollThrottleTimer = null;
      
      if (!containerRef) return;
      
      const { scrollTop: st, scrollHeight, clientHeight } = containerRef;
      
      // 检查是否接近底部
      const distanceFromBottom = scrollHeight - st - clientHeight;
      setIsNearBottom(distanceFromBottom < BOTTOM_THRESHOLD);
      
      // 回调
      props.onScroll?.(st, scrollHeight, clientHeight);
      
      // 检查是否接近顶部，触发加载更多
      if (st < TOP_THRESHOLD) {
        props.onScrollToTop?.();
      }
    }, SCROLL_THROTTLE_MS);
  };
  
  // 滚动到底部
  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (!containerRef) return;
    
    containerRef.scrollTo({
      top: containerRef.scrollHeight,
      behavior
    });
  };
  
  // 暴露滚动方法到全局（供 React 调用）
  onMount(() => {
    // 创建全局方法供 React 调用
    (window as any).__solidMessageListScrollToBottom = scrollToBottom;
    (window as any).__solidMessageListGetContainer = () => containerRef;
    
    // 初始滚动到底部
    if (props.autoScrollToBottom !== false) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  });
  
  // 监听流式输出时自动滚动
  createEffect(() => {
    if (props.isStreaming && isNearBottom() && props.autoScrollToBottom !== false) {
      scrollToBottom();
    }
  });
  
  // 清理
  onCleanup(() => {
    if (scrollThrottleTimer) {
      clearTimeout(scrollThrottleTimer);
    }
    delete (window as any).__solidMessageListScrollToBottom;
    delete (window as any).__solidMessageListGetContainer;
  });
  
  // 获取背景样式
  const getBackgroundStyle = () => {
    if (props.chatBackground?.enabled) {
      return {};
    }
    return {
      'background-color': props.themeMode === 'dark' ? '#121212' : '#ffffff'
    };
  };
  
  // 获取滚动条样式
  const getScrollbarStyle = () => {
    const isDark = props.themeMode === 'dark';
    return `
      .solid-message-list-container::-webkit-scrollbar {
        width: 6px;
      }
      .solid-message-list-container::-webkit-scrollbar-track {
        background: transparent;
      }
      .solid-message-list-container::-webkit-scrollbar-thumb {
        background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
        border-radius: 3px;
      }
      .solid-message-list-container::-webkit-scrollbar-thumb:hover {
        background: ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
      }
    `;
  };

  return (
    <>
      <style>{getScrollbarStyle()}</style>
      <div
        ref={containerRef}
        class="solid-message-list-container"
        id="messageList"
        style={{
          display: 'flex',
          'flex-direction': 'column',
          'flex-grow': 1,
          'overflow-y': 'auto',
          'overflow-x': 'hidden',
          width: '100%',
          'max-width': '100%',
          'padding-left': 0,
          'padding-right': 0,
          'padding-top': 0,
          'padding-bottom': '8px',
          // 滚动优化
          'will-change': 'scroll-position',
          'scroll-behavior': 'auto',
          '-webkit-overflow-scrolling': 'touch',
          'overscroll-behavior': 'contain',
          // 背景
          ...getBackgroundStyle()
        }}
        onScroll={handleScroll}
      >
        {props.children}
      </div>
    </>
  );
}

export default MessageListContainer;
