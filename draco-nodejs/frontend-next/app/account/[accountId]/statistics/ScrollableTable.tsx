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

// Store scroll position outside component to survive re-mounts
const scrollPositionStore = new Map<string, number>();
import { Box, IconButton, Fade } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

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
    console.log(
      '🔄 ScrollableTable useMemo triggered - dataVersion:',
      dataVersion,
      'storeKey:',
      storeKey,
    );
    if (preserveScrollOnUpdate && scrollRef.current) {
      const currentScroll = scrollRef.current.scrollLeft;
      // Only save if we have a meaningful scroll position
      if (currentScroll > 0) {
        scrollPositionStore.set(storeKey, currentScroll);
        console.log(
          '💾 ScrollableTable saved scroll position:',
          currentScroll,
          'to key:',
          storeKey,
        );
      } else {
        console.log(
          '⚠️ Current scroll is 0, keeping stored position:',
          scrollPositionStore.get(storeKey) || 0,
        );
      }
      console.log('📊 ScrollRef exists:', !!scrollRef.current);
      console.log('📏 ScrollRef info:', {
        scrollLeft: scrollRef.current.scrollLeft,
        scrollWidth: scrollRef.current.scrollWidth,
        clientWidth: scrollRef.current.clientWidth,
      });
    } else {
      console.log(
        '❌ ScrollRef is null or preserveScrollOnUpdate is false, stored position:',
        scrollPositionStore.get(storeKey) || 0,
      );
    }
  }, [dataVersion, preserveScrollOnUpdate, storeKey]);

  const checkScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftScroll(scrollLeft > 10); // Small buffer to avoid flickering
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Restore scroll position AFTER render but BEFORE paint
  useLayoutEffect(() => {
    const storedPosition = scrollPositionStore.get(storeKey) || 0;
    console.log(
      '🎨 ScrollableTable useLayoutEffect triggered - dataVersion:',
      dataVersion,
      'storeKey:',
      storeKey,
    );
    console.log('📍 Attempting to restore scroll position:', storedPosition);

    if (preserveScrollOnUpdate && scrollRef.current) {
      console.log('✅ ScrollRef exists in useLayoutEffect');
      console.log('📏 Current ScrollRef info:', {
        scrollLeft: scrollRef.current.scrollLeft,
        scrollWidth: scrollRef.current.scrollWidth,
        clientWidth: scrollRef.current.clientWidth,
      });

      if (storedPosition > 0) {
        // Temporarily disable smooth scrolling for instant restore
        const originalBehavior = scrollRef.current.style.scrollBehavior;
        scrollRef.current.style.scrollBehavior = 'auto';

        // Apply scroll position immediately without animation
        console.log('🔧 Restoring scroll from', scrollRef.current.scrollLeft, 'to', storedPosition);
        scrollRef.current.scrollLeft = storedPosition;
        console.log('✔️ After restore - scrollLeft:', scrollRef.current.scrollLeft);

        // Restore smooth scrolling and update button visibility
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.style.scrollBehavior = originalBehavior;
            console.log('🎬 Restored scroll behavior and updating buttons');
            checkScrollButtons();
          }
        });
      } else {
        console.log('⚠️ Stored scroll position is 0 or negative, not restoring');
      }
    } else {
      console.log('❌ ScrollRef is null or preserveScrollOnUpdate is false in useLayoutEffect');
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
