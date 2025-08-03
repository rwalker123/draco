'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  Stack,
  Chip,
  useTheme,
  alpha,
  Badge,
} from '@mui/material';
import { ChevronLeft, ChevronRight, TouchApp } from '@mui/icons-material';

interface GesturePaginationProps {
  page: number;
  rowsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  itemLabel?: string;
  currentItems?: number;
}

const GesturePaginationControl: React.FC<GesturePaginationProps> = ({
  page,
  rowsPerPage,
  hasNext,
  hasPrev,
  onNextPage,
  onPrevPage,
  onRowsPerPageChange,
  itemLabel = 'Items',
  currentItems = rowsPerPage,
}) => {
  const theme = useTheme();
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    // Hide hint after first interaction
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startTime.current = Date.now();
    setIsDragging(true);
    setShowHint(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setDragOffset(Math.max(-150, Math.min(150, diff)));
  };

  const handleTouchEnd = () => {
    const swipeTime = Date.now() - startTime.current;
    const isQuickSwipe = swipeTime < 300;
    const threshold = isQuickSwipe ? 30 : 60;

    if (Math.abs(dragOffset) > threshold) {
      // Haptic feedback for supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      if (dragOffset > 0 && hasPrev) {
        onPrevPage();
      } else if (dragOffset < 0 && hasNext) {
        onNextPage();
      }
    }

    setDragOffset(0);
    setIsDragging(false);
  };

  const getSwipeHint = () => {
    if (Math.abs(dragOffset) > 60) {
      return dragOffset > 0 ? 'Release to go back' : 'Release to go forward';
    }
    if (Math.abs(dragOffset) > 30) {
      return dragOffset > 0 ? 'Keep swiping...' : 'Keep swiping...';
    }
    if (showHint) {
      return 'Swipe left or right to navigate pages';
    }
    return `Page ${page} • ${itemLabel} ${(page - 1) * rowsPerPage + 1}-${(page - 1) * rowsPerPage + currentItems}`;
  };

  const swipeIntensity = Math.abs(dragOffset) / 150;
  const canSwipe = (dragOffset > 0 && hasPrev) || (dragOffset < 0 && hasNext);

  return (
    <Card
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        transform: `translateX(${dragOffset * 0.2}px) scale(${1 + swipeIntensity * 0.02})`,
        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing',
        },
        background:
          canSwipe && Math.abs(dragOffset) > 30
            ? `linear-gradient(135deg, 
              ${alpha(theme.palette.success.main, 0.15)} 0%, 
              ${alpha(theme.palette.primary.main, 0.15)} 100%)`
            : `linear-gradient(135deg, 
              ${alpha(theme.palette.primary.main, 0.08)} 0%, 
              ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
        boxShadow: isDragging
          ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`
          : theme.shadows[2],
      }}
    >
      {/* Swipe Direction Indicators */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${(Math.max(0, dragOffset) / 150) * 100}%`,
          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.info.main, 0.2)})`,
          opacity: dragOffset > 0 ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: `${(Math.max(0, -dragOffset) / 150) * 100}%`,
          background: `linear-gradient(270deg, transparent, ${alpha(theme.palette.success.main, 0.2)})`,
          opacity: dragOffset < 0 ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />

      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {/* Previous Button */}
          <Badge
            badgeContent={hasPrev ? '←' : ''}
            color="primary"
            invisible={!isDragging || dragOffset <= 0}
          >
            <IconButton
              onClick={onPrevPage}
              disabled={!hasPrev}
              sx={{
                transform:
                  dragOffset > 0 ? `scale(${1 + Math.min(dragOffset * 0.008, 0.3)})` : 'scale(1)',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                color: dragOffset > 30 && hasPrev ? theme.palette.info.main : 'inherit',
              }}
            >
              <ChevronLeft />
            </IconButton>
          </Badge>

          {/* Center Content */}
          <Stack alignItems="center" spacing={2} sx={{ flex: 1 }}>
            <Typography variant="h5" textAlign="center" fontWeight="bold">
              Page {page}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              {showHint && (
                <TouchApp
                  sx={{
                    fontSize: 18,
                    color: 'text.secondary',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 0.5 },
                      '50%': { opacity: 1 },
                      '100%': { opacity: 0.5 },
                    },
                  }}
                />
              )}
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{
                  minHeight: 20,
                  transition: 'color 0.2s ease',
                  color:
                    Math.abs(dragOffset) > 60
                      ? canSwipe
                        ? theme.palette.success.main
                        : theme.palette.error.main
                      : 'text.secondary',
                }}
              >
                {getSwipeHint()}
              </Typography>
            </Stack>

            {/* Page Size Selector */}
            <Stack direction="row" spacing={1}>
              {[10, 25, 50, 100].map((size) => (
                <Chip
                  key={size}
                  label={size}
                  size="small"
                  variant={rowsPerPage === size ? 'filled' : 'outlined'}
                  color={rowsPerPage === size ? 'primary' : 'default'}
                  onClick={() => onRowsPerPageChange(size)}
                  sx={{
                    minWidth: 45,
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                    transition: 'transform 0.2s ease',
                  }}
                />
              ))}
            </Stack>
          </Stack>

          {/* Next Button */}
          <Badge
            badgeContent={hasNext ? '→' : ''}
            color="success"
            invisible={!isDragging || dragOffset >= 0}
          >
            <IconButton
              onClick={onNextPage}
              disabled={!hasNext}
              sx={{
                transform:
                  dragOffset < 0 ? `scale(${1 + Math.min(-dragOffset * 0.008, 0.3)})` : 'scale(1)',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                color: dragOffset < -30 && hasNext ? theme.palette.success.main : 'inherit',
              }}
            >
              <ChevronRight />
            </IconButton>
          </Badge>
        </Stack>

        {/* Progress Indicator */}
        {isDragging && (
          <LinearProgress
            variant="determinate"
            value={Math.min((Math.abs(dragOffset) / 60) * 100, 100)}
            sx={{
              mt: 3,
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.action.hover, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor:
                  Math.abs(dragOffset) > 60 && canSwipe
                    ? theme.palette.success.main
                    : Math.abs(dragOffset) > 60
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                transition: 'background-color 0.2s ease',
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default GesturePaginationControl;
