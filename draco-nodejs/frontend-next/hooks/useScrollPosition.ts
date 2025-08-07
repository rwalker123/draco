import { useCallback, useRef, useEffect } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface UseScrollPositionOptions {
  debounceMs?: number;
  elementId?: string;
  enabled?: boolean;
}

export const useScrollPosition = (options: UseScrollPositionOptions = {}) => {
  const { debounceMs = 100, elementId, enabled = true } = options;
  const scrollPositionRef = useRef<ScrollPosition>({ x: 0, y: 0, timestamp: Date.now() });
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Save current scroll position
  const saveScrollPosition = useCallback(() => {
    if (!enabled) return;

    const element = elementId ? document.getElementById(elementId) : window;
    if (!element) return;

    const newPosition: ScrollPosition = {
      x: element === window ? window.scrollX : (element as Element).scrollLeft,
      y: element === window ? window.scrollY : (element as Element).scrollTop,
      timestamp: Date.now(),
    };

    scrollPositionRef.current = newPosition;
  }, [elementId, enabled]);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (!enabled) return;

    const element = elementId ? document.getElementById(elementId) : window;
    if (!element) return;

    const position = scrollPositionRef.current;
    if (position.x === 0 && position.y === 0) return;

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (element === window) {
        window.scrollTo(position.x, position.y);
      } else {
        (element as Element).scrollLeft = position.x;
        (element as Element).scrollTop = position.y;
      }
    });
  }, [elementId, enabled]);

  // Get current scroll position
  const getScrollPosition = useCallback((): ScrollPosition => {
    return { ...scrollPositionRef.current };
  }, []);

  // Set scroll position manually
  const setScrollPosition = useCallback((position: Partial<ScrollPosition>) => {
    scrollPositionRef.current = {
      ...scrollPositionRef.current,
      ...position,
      timestamp: Date.now(),
    };
  }, []);

  // Debounced scroll position saving
  const saveScrollPositionDebounced = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      saveScrollPosition();
    }, debounceMs);
  }, [saveScrollPosition, debounceMs]);

  // Setup scroll event listeners
  useEffect(() => {
    if (!enabled) return;

    const element = elementId ? document.getElementById(elementId) : window;
    if (!element) return;

    // Save initial position
    saveScrollPosition();

    // Add scroll listener
    element.addEventListener('scroll', saveScrollPositionDebounced, { passive: true });

    return () => {
      element.removeEventListener('scroll', saveScrollPositionDebounced);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [enabled, elementId, saveScrollPositionDebounced, saveScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    getScrollPosition,
    setScrollPosition,
    saveScrollPositionDebounced,
  };
};
