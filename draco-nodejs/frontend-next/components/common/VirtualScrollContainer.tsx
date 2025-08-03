'use client';

// Reusable Virtual Scroll Container following SOLID principles
// Single Responsibility: Handles virtual scrolling presentation only
// Open/Closed: Extensible through renderer interface without modification
// Liskov Substitution: Any VirtualItemRenderer can be used
// Interface Segregation: Focused on virtual scrolling concerns only
// Dependency Inversion: Depends on renderer abstraction

import React, { forwardRef, useImperativeHandle } from 'react';
import { Box, Typography } from '@mui/material';
import { useVirtualScroll } from '../../hooks/useVirtualScroll';
import {
  VirtualScrollItem,
  VirtualScrollContainerProps,
  VirtualScrollActions,
  VirtualScrollState,
  VIRTUAL_SCROLL_PRESETS,
} from '../../types/virtualScroll';

// Export ref interface for parent components
export interface VirtualScrollContainerRef {
  actions: VirtualScrollActions;
  state: VirtualScrollState;
}

// Generic Virtual Scroll Container Component
function VirtualScrollContainerComponent<T extends VirtualScrollItem>(
  {
    items,
    config,
    renderer,
    className,
    style,
    onScroll,
    onItemsRendered,
  }: VirtualScrollContainerProps<T>,
  ref: React.Ref<VirtualScrollContainerRef>,
) {
  // Use virtual scroll hook
  const { state, actions, visibleItems, containerProps, wrapperProps } = useVirtualScroll(
    items,
    config,
    renderer,
  );

  // Expose actions and state to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      actions,
      state,
    }),
    [actions, state],
  );

  // Notify parent of items rendered
  React.useEffect(() => {
    onItemsRendered?.(state.startIndex, state.endIndex);
  }, [state.startIndex, state.endIndex, onItemsRendered]);

  // Notify parent of scroll changes
  React.useEffect(() => {
    onScroll?.(state);
  }, [state, onScroll]);

  // Don't virtualize if under threshold
  if (items.length < config.threshold) {
    return (
      <Box
        className={className}
        style={style}
        sx={{
          maxHeight: config.containerHeight,
          overflow: 'auto',
        }}
        role={config.role}
        aria-label={config.ariaLabel}
      >
        {items.map((item, index) => {
          const itemStyle: React.CSSProperties = {
            width: '100%',
          };

          return (
            <Box key={renderer.getItemKey?.(item, index) || item.id} style={itemStyle}>
              {renderer.renderItem(item, index, itemStyle)}
            </Box>
          );
        })}
      </Box>
    );
  }

  // Virtualized rendering
  return (
    <Box
      className={className}
      style={{
        ...containerProps.style,
        ...style,
      }}
      onScroll={containerProps.onScroll}
      ref={containerProps.ref}
      role={config.role}
      aria-label={config.ariaLabel}
      tabIndex={0} // Enable keyboard navigation
    >
      <Box {...wrapperProps}>
        {visibleItems.map(({ item, index, style: itemStyle }) => (
          <Box key={renderer.getItemKey?.(item, index) || item.id} style={itemStyle}>
            {renderer.renderItem(item, index, itemStyle)}
          </Box>
        ))}
      </Box>

      {/* Performance indicator in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            fontSize: '0.75rem',
            color: 'text.secondary',
            zIndex: 9999,
            minWidth: 200,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.main' }}>
            Virtual Scroll Active
          </Typography>
          <br />
          <Typography variant="caption">
            Items: {state.startIndex}-{state.endIndex} of {items.length}
          </Typography>
          <br />
          <Typography variant="caption">
            Rendered: {state.visibleItemCount} / {items.length}
          </Typography>
          <br />
          <Typography variant="caption">
            Efficiency: {Math.round((state.visibleItemCount / items.length) * 100)}%
          </Typography>
          <br />
          <Typography variant="caption">Height: {Math.round(state.totalHeight)}px</Typography>
        </Box>
      )}
    </Box>
  );
}

// Create forwardRef component with proper typing
export const VirtualScrollContainer = forwardRef(VirtualScrollContainerComponent) as <
  T extends VirtualScrollItem,
>(
  props: VirtualScrollContainerProps<T> & { ref?: React.Ref<VirtualScrollContainerRef> },
) => ReturnType<typeof VirtualScrollContainerComponent>;

// Helper function to create virtual scroll config (Factory pattern)
export const createVirtualScrollConfig = (
  preset: keyof typeof VIRTUAL_SCROLL_PRESETS,
  overrides?: Partial<VirtualScrollContainerProps<VirtualScrollItem>['config']>,
) => ({
  ...VIRTUAL_SCROLL_PRESETS[preset],
  ...overrides,
});

// Performance monitoring hook
export const useVirtualScrollPerformance = (
  containerRef: React.RefObject<VirtualScrollContainerRef>,
) => {
  const [metrics, setMetrics] = React.useState({
    renderTime: 0,
    scrollTime: 0,
    itemsRendered: 0,
    totalItems: 0,
  });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const startTime = performance.now();

    const updateMetrics = () => {
      const endTime = performance.now();
      const state = containerRef.current?.state;

      if (state) {
        setMetrics((prev) => ({
          ...prev,
          renderTime: endTime - startTime,
          scrollTime: 0, // Would need scroll event timing
          itemsRendered: state.visibleItemCount,
          totalItems: state.endIndex - state.startIndex + 1,
        }));
      }
    };

    // Update metrics on next frame
    requestAnimationFrame(updateMetrics);
  }, [containerRef]);

  return metrics;
};

export default VirtualScrollContainer;
