import { throttle } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

// 滚动条颜色 CSS 变量（在 GlobalStyles 或主题中定义）
// 如果未定义，使用内联 fallback
const SCROLLBAR_DEFAULTS = {
  thumbDark: 'rgba(255, 255, 255, 0.15)',
  thumbDarkHover: 'rgba(255, 255, 255, 0.2)',
  thumbLight: 'rgba(0, 0, 0, 0.15)',
  thumbLightHover: 'rgba(0, 0, 0, 0.2)',
  width: '3px',
  radius: '10px',
};

export interface ScrollbarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onScroll'> {
  ref?: React.Ref<HTMLDivElement | null>;
  onScroll?: () => void;
  /** 自定义滚动条宽度 */
  scrollbarWidth?: string;
  /** 是否同时支持横向滚动 */
  horizontal?: boolean;
}

/**
 * Scrollbar - 通用滚动容器组件（参考 cherry-studio Scrollbar）
 *
 * 功能：
 * - 滚动条默认透明隐藏
 * - 滚动时自动显示，停止 1.5s 后自动隐藏
 * - hover 滚动条时始终可见
 * - 支持外部 onScroll 回调
 *
 * @example
 * ```tsx
 * <Scrollbar style={{ height: 300 }}>
 *   <div>可滚动内容...</div>
 * </Scrollbar>
 * ```
 */
const Scrollbar: React.FC<ScrollbarProps> = ({
  ref: passedRef,
  children,
  onScroll: externalOnScroll,
  scrollbarWidth,
  horizontal = false,
  ...htmlProps
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearScrollingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    clearScrollingTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      timeoutRef.current = null;
    }, 1500);
  }, [clearScrollingTimeout]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledInternalScrollHandler = useCallback(
    throttle(handleScroll, 100, { leading: true, trailing: true }),
    [handleScroll]
  );

  const combinedOnScroll = useCallback(() => {
    throttledInternalScrollHandler();
    if (externalOnScroll) {
      externalOnScroll();
    }
  }, [throttledInternalScrollHandler, externalOnScroll]);

  useEffect(() => {
    return () => {
      clearScrollingTimeout();
      throttledInternalScrollHandler.cancel();
    };
  }, [throttledInternalScrollHandler, clearScrollingTimeout]);

  return (
    <ScrollBarContainer
      {...htmlProps}
      $isScrolling={isScrolling}
      $scrollbarWidth={scrollbarWidth}
      $horizontal={horizontal}
      onScroll={combinedOnScroll}
      ref={passedRef}
    >
      {children}
    </ScrollBarContainer>
  );
};

interface ScrollBarContainerProps {
  $isScrolling: boolean;
  $scrollbarWidth?: string;
  $horizontal: boolean;
}

const ScrollBarContainer = styled.div<ScrollBarContainerProps>`
  overflow-y: auto;
  overflow-x: ${(props) => (props.$horizontal ? 'auto' : 'hidden')};
  scrollbar-gutter: stable;

  &::-webkit-scrollbar {
    width: ${(props) => props.$scrollbarWidth || SCROLLBAR_DEFAULTS.width};
    height: ${(props) => (props.$horizontal ? props.$scrollbarWidth || SCROLLBAR_DEFAULTS.width : '0')};
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: ${SCROLLBAR_DEFAULTS.radius};
    transition: background 0.3s ease;
    background: ${(props) => (props.$isScrolling ? SCROLLBAR_DEFAULTS.thumbLight : 'transparent')};

    &:hover {
      background: ${SCROLLBAR_DEFAULTS.thumbLightHover};
    }
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: ${(props) => (props.$isScrolling ? `${SCROLLBAR_DEFAULTS.thumbLight} transparent` : 'transparent transparent')};

  /* 暗色模式自动适配 */
  @media (prefers-color-scheme: dark) {
    &::-webkit-scrollbar-thumb {
      background: ${(props) => (props.$isScrolling ? SCROLLBAR_DEFAULTS.thumbDark : 'transparent')};

      &:hover {
        background: ${SCROLLBAR_DEFAULTS.thumbDarkHover};
      }
    }

    scrollbar-color: ${(props) => (props.$isScrolling ? `${SCROLLBAR_DEFAULTS.thumbDark} transparent` : 'transparent transparent')};
  }
`;

Scrollbar.displayName = 'Scrollbar';

export default Scrollbar;
