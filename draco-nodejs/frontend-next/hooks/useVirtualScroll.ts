'use client';

// Virtual scrolling hook implementation following SOLID principles
// Single Responsibility: Manages virtual scrolling logic only
// Open/Closed: Extensible through configuration and renderer interfaces
// Dependency Inversion: Depends on abstractions, not concrete implementations

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  VirtualScrollItem,
  VirtualScrollConfig,
  VirtualScrollState,
  VirtualScrollActions,
  UseVirtualScrollReturn,
  VirtualItemRenderer,
  DEFAULT_VIRTUAL_SCROLL_CONFIG,
} from '../types/virtualScroll';

// Utility functions following DRY principle
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Main virtual scroll hook
export function useVirtualScroll<T extends VirtualScrollItem>(
  items: T[],
  config: Partial<VirtualScrollConfig>,
  renderer: VirtualItemRenderer<T>,
): UseVirtualScrollReturn<T> {
  // Merge config with defaults (DRY principle)
  const finalConfig = useMemo<VirtualScrollConfig>(
    () => ({
      ...DEFAULT_VIRTUAL_SCROLL_CONFIG,
      ...config,
    }),
    [config],
  );

  // Refs for DOM elements
  const scrollElementRef = useRef<HTMLElement>(null);

  // State management
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());

  // Calculate item height (supports both fixed and dynamic)
  const getItemHeight = useCallback(
    (index: number): number => {
      if (typeof finalConfig.itemHeight === 'function') {
        return finalConfig.itemHeight(index);
      }

      if (finalConfig.enableDynamicHeight && itemHeights.has(index)) {
        return itemHeights.get(index)!;
      }

      if (renderer.getItemHeight && items[index]) {
        return renderer.getItemHeight(items[index], index);
      }

      return typeof finalConfig.itemHeight === 'number'
        ? finalConfig.itemHeight
        : (DEFAULT_VIRTUAL_SCROLL_CONFIG.itemHeight as number);
    },
    [finalConfig.itemHeight, finalConfig.enableDynamicHeight, itemHeights, renderer, items],
  );

  // Calculate total height
  const totalHeight = useMemo(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, getItemHeight]);

  // Calculate visible range
  const { startIndex, endIndex, visibleItemCount } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, visibleItemCount: 0 };
    }

    let currentHeight = 0;
    let start = 0;
    let end = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemHeight = getItemHeight(i);
      if (currentHeight + itemHeight >= scrollTop) {
        start = Math.max(0, i - finalConfig.overscan);
        break;
      }
      currentHeight += itemHeight;
    }

    // Find end index
    currentHeight = 0;
    for (let i = 0; i < items.length; i++) {
      if (i >= start) {
        const itemHeight = getItemHeight(i);
        currentHeight += itemHeight;
        if (
          currentHeight >=
          finalConfig.containerHeight + finalConfig.overscan * getItemHeight(i)
        ) {
          end = Math.min(items.length - 1, i + finalConfig.overscan);
          break;
        }
      }
    }

    if (end === 0) {
      end = items.length - 1;
    }

    return {
      startIndex: start,
      endIndex: end,
      visibleItemCount: end - start + 1,
    };
  }, [items.length, scrollTop, finalConfig.containerHeight, finalConfig.overscan, getItemHeight]);

  // Create virtual scroll state
  const state: VirtualScrollState = useMemo(
    () => ({
      startIndex,
      endIndex,
      totalHeight,
      scrollTop,
      visibleItemCount,
      isScrolling,
    }),
    [startIndex, endIndex, totalHeight, scrollTop, visibleItemCount, isScrolling],
  );

  // Scroll actions following Command pattern
  const actions: VirtualScrollActions = useMemo(
    () => ({
      scrollToItem: (index: number, align: 'start' | 'center' | 'end' = 'start') => {
        if (!scrollElementRef.current || index < 0 || index >= items.length) return;

        let targetScrollTop = 0;
        for (let i = 0; i < index; i++) {
          targetScrollTop += getItemHeight(i);
        }

        if (align === 'center') {
          targetScrollTop -= finalConfig.containerHeight / 2 - getItemHeight(index) / 2;
        } else if (align === 'end') {
          targetScrollTop -= finalConfig.containerHeight - getItemHeight(index);
        }

        targetScrollTop = clamp(targetScrollTop, 0, totalHeight - finalConfig.containerHeight);
        scrollElementRef.current.scrollTop = targetScrollTop;
      },

      scrollToTop: () => {
        if (scrollElementRef.current) {
          scrollElementRef.current.scrollTop = 0;
        }
      },

      scrollToBottom: () => {
        if (scrollElementRef.current) {
          scrollElementRef.current.scrollTop = totalHeight - finalConfig.containerHeight;
        }
      },

      refresh: () => {
        setItemHeights(new Map());
        if (scrollElementRef.current) {
          // Force re-render by triggering scroll event
          const event = new Event('scroll');
          scrollElementRef.current.dispatchEvent(event);
        }
      },

      updateItemHeight: (index: number, height: number) => {
        if (finalConfig.enableDynamicHeight) {
          setItemHeights((prev) => new Map(prev).set(index, height));
        }
      },
    }),
    [
      items.length,
      getItemHeight,
      finalConfig.containerHeight,
      totalHeight,
      finalConfig.enableDynamicHeight,
    ],
  );

  // Calculate visible items with positioning
  const visibleItems = useMemo(() => {
    const items_to_render = [];
    let currentTop = 0;

    // Calculate offset to start index
    for (let i = 0; i < startIndex; i++) {
      currentTop += getItemHeight(i);
    }

    // Create visible items with style
    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      const height = getItemHeight(i);
      const style: React.CSSProperties = {
        position: 'absolute',
        top: currentTop,
        left: 0,
        right: 0,
        height,
        width: '100%',
      };

      items_to_render.push({
        item: items[i],
        index: i,
        style,
      });

      currentTop += height;
    }

    return items_to_render;
  }, [items, startIndex, endIndex, getItemHeight]);

  // Debounced scroll handler for performance
  const debouncedScrollHandler = useMemo(
    () =>
      debounce((scrollTop: unknown) => {
        setScrollTop(scrollTop as number);
        setIsScrolling(false);
      }, finalConfig.debounceMs || 16),
    [finalConfig.debounceMs],
  );

  // Scroll event handler
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLElement>) => {
      const target = event.currentTarget;
      const newScrollTop = target.scrollTop;

      setIsScrolling(true);
      setScrollTop(newScrollTop);
      debouncedScrollHandler(newScrollTop);
    },
    [debouncedScrollHandler, state],
  );

  // Container props
  const containerProps = useMemo(
    () => ({
      style: {
        height: finalConfig.containerHeight,
        overflow: 'auto',
        position: 'relative' as const,
      },
      onScroll: handleScroll,
      ref: scrollElementRef,
    }),
    [finalConfig.containerHeight, handleScroll],
  );

  // Wrapper props for absolute positioning
  const wrapperProps = useMemo(
    () => ({
      style: {
        height: totalHeight,
        position: 'relative' as const,
        width: '100%',
      },
    }),
    [totalHeight],
  );

  // Keyboard navigation support
  useEffect(() => {
    if (!finalConfig.enableScrollRestoration) return;

    const element = scrollElementRef.current;
    if (!element) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          actions.scrollToItem(Math.max(0, startIndex - 1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          actions.scrollToItem(Math.min(items.length - 1, startIndex + 1));
          break;
        case 'Home':
          event.preventDefault();
          actions.scrollToTop();
          break;
        case 'End':
          event.preventDefault();
          actions.scrollToBottom();
          break;
        case 'PageUp':
          event.preventDefault();
          actions.scrollToItem(Math.max(0, startIndex - Math.floor(visibleItemCount / 2)));
          break;
        case 'PageDown':
          event.preventDefault();
          actions.scrollToItem(
            Math.min(items.length - 1, startIndex + Math.floor(visibleItemCount / 2)),
          );
          break;
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [actions, startIndex, items.length, visibleItemCount, finalConfig.enableScrollRestoration]);

  return {
    state,
    actions,
    visibleItems,
    containerProps,
    wrapperProps,
  };
}
