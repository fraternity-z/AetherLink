import { useEffect, useRef } from 'react';

export type GlobalPointerEventType = 'mousemove' | 'touchstart' | 'touchmove' | 'touchend';

export interface GlobalPointerEvent {
  type: GlobalPointerEventType;
  clientX: number;
  clientY: number;
  timestamp: number;
}

type PointerListener = (event: GlobalPointerEvent) => void;

const listeners = new Set<PointerListener>();
let windowBound = false;

const emitPointer = (event: GlobalPointerEvent) => {
  listeners.forEach(listener => listener(event));
};

const getTouchPoint = (event: TouchEvent): { clientX: number; clientY: number } => {
  const touch = event.touches[0] ?? event.changedTouches[0];
  if (!touch) {
    return { clientX: 0, clientY: 0 };
  }

  return {
    clientX: touch.clientX,
    clientY: touch.clientY
  };
};

const handleMouseMove = (event: MouseEvent) => {
  emitPointer({
    type: 'mousemove',
    clientX: event.clientX,
    clientY: event.clientY,
    timestamp: Date.now()
  });
};

const handleTouchStart = (event: TouchEvent) => {
  const point = getTouchPoint(event);
  emitPointer({
    type: 'touchstart',
    clientX: point.clientX,
    clientY: point.clientY,
    timestamp: Date.now()
  });
};

const handleTouchMove = (event: TouchEvent) => {
  const point = getTouchPoint(event);
  emitPointer({
    type: 'touchmove',
    clientX: point.clientX,
    clientY: point.clientY,
    timestamp: Date.now()
  });
};

const handleTouchEnd = (event: TouchEvent) => {
  const point = getTouchPoint(event);
  emitPointer({
    type: 'touchend',
    clientX: point.clientX,
    clientY: point.clientY,
    timestamp: Date.now()
  });
};

const bindWindowEvents = () => {
  if (windowBound || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  windowBound = true;
};

const subscribe = (listener: PointerListener) => {
  bindWindowEvents();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const useGlobalPointerSubscription = (
  handler: (event: GlobalPointerEvent) => void,
  enabled: boolean = true
) => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return subscribe((event) => {
      handlerRef.current(event);
    });
  }, [enabled]);
};
