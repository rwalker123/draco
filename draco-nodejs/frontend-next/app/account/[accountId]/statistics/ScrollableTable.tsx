'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { Box, IconButton, Fade } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

interface ScrollableTableProps {
  children: ReactNode;
}

export default function ScrollableTable({ children }: ScrollableTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

    setShowLeftScroll(scrollLeft > 10); // Small buffer to avoid flickering
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
  };

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
  }, []);

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
