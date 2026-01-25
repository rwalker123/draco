import { useRef, useEffect } from 'react';

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
  const scrollPositionRef = useRef<ScrollPosition>({ x: 0, y: 0, timestamp: 0 });
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Save current scroll position - uses current option values from closure
  const saveScrollPosition = () => {
    if (!enabled) return;

    const element = elementId ? document.getElementById(elementId) : window;
    if (!element) return;

    const newPosition: ScrollPosition = {
      x: element === window ? window.scrollX : (element as Element).scrollLeft,
      y: element === window ? window.scrollY : (element as Element).scrollTop,
      timestamp: Date.now(),
    };

    scrollPositionRef.current = newPosition;
  };

  // Restore scroll position
  const restoreScrollPosition = () => {
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
  };

  // Get current scroll position
  const getScrollPosition = (): ScrollPosition => {
    return { ...scrollPositionRef.current };
  };

  // Set scroll position manually
  const setScrollPosition = (position: Partial<ScrollPosition>) => {
    scrollPositionRef.current = {
      ...scrollPositionRef.current,
      ...position,
      timestamp: Date.now(),
    };
  };

  // Debounced scroll position saving - uses current debounceMs from closure
  const saveScrollPositionDebounced = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      saveScrollPosition();
    }, debounceMs);
  };

  // Setup scroll event listeners
  useEffect(() => {
    if (!enabled) return;

    const element = elementId ? document.getElementById(elementId) : window;
    if (!element) return;

    // Save initial position - define inline to capture current values
    const saveInitialPosition = () => {
      const newPosition: ScrollPosition = {
        x: element === window ? window.scrollX : (element as Element).scrollLeft,
        y: element === window ? window.scrollY : (element as Element).scrollTop,
        timestamp: Date.now(),
      };
      scrollPositionRef.current = newPosition;
    };

    saveInitialPosition();

    // Create scroll handler that captures current debounceMs
    const handleScroll = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        const newPosition: ScrollPosition = {
          x: element === window ? window.scrollX : (element as Element).scrollLeft,
          y: element === window ? window.scrollY : (element as Element).scrollTop,
          timestamp: Date.now(),
        };
        scrollPositionRef.current = newPosition;
      }, debounceMs);
    };

    // Add scroll listener
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [enabled, elementId, debounceMs]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    getScrollPosition,
    setScrollPosition,
    saveScrollPositionDebounced,
  };
};
