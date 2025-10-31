'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Box, IconButton, Fade } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

// Store scroll position outside component to survive re-mounts
const scrollPositionStore = new Map<string, number>();

interface ScrollableTableProps {
  children: ReactNode;
  preserveScrollOnUpdate?: boolean;
  dataVersion?: string | number; // Key that changes when data updates
}

export default function ScrollableTable({
  children,
  preserveScrollOnUpdate = true,
  dataVersion,
}: ScrollableTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const storeKey = `scroll-${dataVersion?.toString().split('-').slice(0, -1).join('-') || 'default'}`; // Group by sort field/order, not data length

  // Save scroll position BEFORE render when data is about to change
  useMemo(() => {
    if (preserveScrollOnUpdate && scrollRef.current) {
      const currentScroll = scrollRef.current.scrollLeft;
      // Only save if we have a meaningful scroll position
      if (currentScroll > 0) {
        scrollPositionStore.set(storeKey, currentScroll);
      }
    }
  }, [preserveScrollOnUpdate, storeKey]);

  const checkScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftScroll(scrollLeft > 10); // Small buffer to avoid flickering
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Restore scroll position AFTER render but BEFORE paint
  useLayoutEffect(() => {
    const storedPosition = scrollPositionStore.get(storeKey) || 0;

    if (preserveScrollOnUpdate && scrollRef.current) {
      if (storedPosition > 0) {
        // Temporarily disable smooth scrolling for instant restore
        const originalBehavior = scrollRef.current.style.scrollBehavior;
        scrollRef.current.style.scrollBehavior = 'auto';

        // Apply scroll position immediately without animation
        scrollRef.current.scrollLeft = storedPosition;

        // Restore smooth scrolling and update button visibility
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.style.scrollBehavior = originalBehavior;
            checkScrollButtons();
          }
        });
      }
    }
  }, [dataVersion, preserveScrollOnUpdate, checkScrollButtons, storeKey]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const updateButtonPositions = () => {
      const rect = scrollElement.getBoundingClientRect();
      const rightOffset = window.innerWidth - rect.right;

      // Calculate button position constrained within table bounds
      const viewportCenter = window.innerHeight / 2;
      const buttonHeight = 40; // Button height
      const buttonHalfHeight = buttonHeight / 2;

      // Calculate desired position (viewport center)
      let buttonTop = viewportCenter - buttonHalfHeight;

      // Constrain within table bounds
      const tableTop = rect.top;
      const tableBottom = rect.bottom;
      const minButtonTop = tableTop + 8; // 8px padding from table top
      const maxButtonTop = tableBottom - buttonHeight - 8; // 8px padding from table bottom

      // Snap to table bounds if necessary
      if (buttonTop < minButtonTop) {
        buttonTop = minButtonTop;
      } else if (buttonTop > maxButtonTop) {
        buttonTop = maxButtonTop;
      }

      // Set CSS custom properties for button positioning
      document.documentElement.style.setProperty('--table-left-offset', `${rect.left}px`);
      document.documentElement.style.setProperty('--table-right-offset', `${rightOffset}px`);
      document.documentElement.style.setProperty('--button-top', `${buttonTop}px`);
    };

    // Initial check after a short delay to allow table to render
    const timeoutId = setTimeout(() => {
      checkScrollButtons();
      updateButtonPositions();
    }, 100);

    // Add scroll event listener
    scrollElement.addEventListener('scroll', checkScrollButtons);

    // Add resize observer to detect when table size changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        checkScrollButtons();
        updateButtonPositions();
      }, 50); // Small delay to let DOM settle
    });
    resizeObserver.observe(scrollElement);

    // Also observe the table inside (in case it changes size)
    const tableElement = scrollElement.querySelector('table');
    if (tableElement) {
      resizeObserver.observe(tableElement);
    }

    // Update positions on window resize and scroll
    const updatePositions = () => {
      updateButtonPositions();
    };

    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      clearTimeout(timeoutId);
      scrollElement.removeEventListener('scroll', checkScrollButtons);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [checkScrollButtons]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <Box
      position="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Left scroll button */}
      <Fade in={showLeftScroll && isHovering}>
        <IconButton
          onClick={scrollLeft}
          sx={{
            position: 'fixed',
            left: (theme) => `calc(${theme.spacing(1)} + var(--table-left-offset, 0px))`,
            top: 'var(--button-top, 50vh)',
            zIndex: 1001, // Higher than gradients
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2,
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: 'action.hover',
              boxShadow: 4,
            },
          }}
          size="small"
        >
          <ChevronLeftIcon />
        </IconButton>
      </Fade>

      {/* Right scroll button */}
      <Fade in={showRightScroll && isHovering}>
        <IconButton
          onClick={scrollRight}
          sx={{
            position: 'fixed',
            right: (theme) => `calc(${theme.spacing(1)} + var(--table-right-offset, 0px))`,
            top: 'var(--button-top, 50vh)',
            zIndex: 1001, // Higher than gradients
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2,
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: 'action.hover',
              boxShadow: 4,
            },
          }}
          size="small"
        >
          <ChevronRightIcon />
        </IconButton>
      </Fade>

      {/* Scrollable content */}
      <Box
        ref={scrollRef}
        sx={{
          overflowX: 'auto',
          overflowY: 'visible',
          // Hide scrollbar but keep functionality
          scrollbarWidth: 'none', // Firefox
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome/Safari
          },
          // Smooth scrolling
          scrollBehavior: 'smooth',
          // Prevent table from shrinking - this is key for proper scroll detection
          '& .MuiTableContainer-root': {
            minWidth: 'max-content',
          },
          '& .MuiTable-root': {
            minWidth: 'max-content',
          },
        }}
      >
        {children}
      </Box>

      {/* Gradient overlays to indicate scrollable content */}
      {showLeftScroll && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 30,
            background: 'linear-gradient(to right, rgba(255,255,255,0.9), transparent)',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}

      {showRightScroll && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 30,
            background: 'linear-gradient(to left, rgba(255,255,255,0.9), transparent)',
            pointerEvents: 'none',
            zIndex: 999,
          }}
        />
      )}
    </Box>
  );
}
