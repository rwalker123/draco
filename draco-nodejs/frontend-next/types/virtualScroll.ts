// Virtual scrolling types following SOLID principles
// Single Responsibility: Each interface has one clear purpose

import { ReactNode } from 'react';

// Core item interface that all virtual scroll items must implement
export interface VirtualScrollItem {
  id: string | number;
  height?: number; // Optional for dynamic height calculation
}

// Virtual scroll configuration interface
export interface VirtualScrollConfig {
  // Performance settings
  itemHeight: number | ((index: number) => number); // Fixed or dynamic height
  containerHeight: number;
  overscan: number; // Extra items to render outside visible area
  threshold: number; // Minimum items to enable virtualization

  // Optimization settings
  enableDynamicHeight?: boolean;
  enableScrollRestoration?: boolean;
  debounceMs?: number; // Scroll event debouncing

  // Accessibility
  ariaLabel?: string;
  role?: string;
}

// Virtual scroll state interface
export interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  scrollTop: number;
  visibleItemCount: number;
  isScrolling: boolean;
}

// Item renderer interface (Strategy pattern)
export interface VirtualItemRenderer<T extends VirtualScrollItem> {
  renderItem: (item: T, index: number, style: React.CSSProperties) => ReactNode;
  getItemHeight?: (item: T, index: number) => number;
  getItemKey?: (item: T, index: number) => string;
}

// Virtual scroll actions interface
export interface VirtualScrollActions {
  scrollToItem: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  refresh: () => void;
  updateItemHeight: (index: number, height: number) => void;
}

// Hook return interface
export interface UseVirtualScrollReturn<T extends VirtualScrollItem> {
  state: VirtualScrollState;
  actions: VirtualScrollActions;
  visibleItems: Array<{
    item: T;
    index: number;
    style: React.CSSProperties;
  }>;
  containerProps: {
    style: React.CSSProperties;
    onScroll: (event: React.UIEvent<HTMLElement>) => void;
    ref: React.RefObject<HTMLElement | null>;
  };
  wrapperProps: {
    style: React.CSSProperties;
  };
}

// Props for the main VirtualScrollContainer component
export interface VirtualScrollContainerProps<T extends VirtualScrollItem> {
  items: T[];
  config: VirtualScrollConfig;
  renderer: VirtualItemRenderer<T>;
  className?: string;
  style?: React.CSSProperties;
  onScroll?: (state: VirtualScrollState) => void;
  onItemsRendered?: (startIndex: number, endIndex: number) => void;
}

// Factory interface for creating different virtual scroll implementations
export interface VirtualScrollFactory {
  createUserCardScroll<T extends VirtualScrollItem>(): VirtualItemRenderer<T>;
  createUserListScroll<T extends VirtualScrollItem>(): VirtualItemRenderer<T>;
  createTableRowScroll<T extends VirtualScrollItem>(): VirtualItemRenderer<T>;
}

// Performance metrics interface
export interface VirtualScrollPerformance {
  renderTime: number;
  scrollTime: number;
  visibleItemCount: number;
  totalItemCount: number;
  memoryUsage?: number;
}

// Default configurations following DRY principle
export const DEFAULT_VIRTUAL_SCROLL_CONFIG: VirtualScrollConfig = {
  itemHeight: 80,
  containerHeight: 400,
  overscan: 5,
  threshold: 100,
  enableDynamicHeight: false,
  enableScrollRestoration: true,
  debounceMs: 16, // ~60fps
  ariaLabel: 'Virtual scrollable list',
  role: 'listbox',
};

// Configuration presets for common use cases
export const VIRTUAL_SCROLL_PRESETS = {
  USER_CARDS: {
    ...DEFAULT_VIRTUAL_SCROLL_CONFIG,
    itemHeight: 220,
    containerHeight: 600,
    overscan: 3,
    threshold: 50,
    enableDynamicHeight: true,
  } as VirtualScrollConfig,

  USER_LIST_COMPACT: {
    ...DEFAULT_VIRTUAL_SCROLL_CONFIG,
    itemHeight: 56,
    containerHeight: 400,
    overscan: 10,
    threshold: 200,
  } as VirtualScrollConfig,

  USER_LIST_COMFORTABLE: {
    ...DEFAULT_VIRTUAL_SCROLL_CONFIG,
    itemHeight: 72,
    containerHeight: 500,
    overscan: 8,
    threshold: 150,
  } as VirtualScrollConfig,

  USER_LIST_SPACIOUS: {
    ...DEFAULT_VIRTUAL_SCROLL_CONFIG,
    itemHeight: 96,
    containerHeight: 600,
    overscan: 6,
    threshold: 100,
    enableDynamicHeight: true,
  } as VirtualScrollConfig,

  TABLE_ROWS: {
    ...DEFAULT_VIRTUAL_SCROLL_CONFIG,
    itemHeight: 48,
    containerHeight: 400,
    overscan: 15,
    threshold: 300,
  } as VirtualScrollConfig,
} as const;

// Performance optimization flags
export interface VirtualScrollOptimizations {
  enableItemCaching: boolean;
  enableRenderDebouncing: boolean;
  enableScrollMomentum: boolean;
  enableKeyboardNavigation: boolean;
  enableInfiniteScrolling: boolean;
}

export const DEFAULT_OPTIMIZATIONS: VirtualScrollOptimizations = {
  enableItemCaching: true,
  enableRenderDebouncing: true,
  enableScrollMomentum: false,
  enableKeyboardNavigation: true,
  enableInfiniteScrolling: false,
};
