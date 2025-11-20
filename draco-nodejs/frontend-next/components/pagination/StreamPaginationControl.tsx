'use client';

// Stream Navigation Pagination Control
// Innovative pagination with progressive dot navigation and memory system
// Single Responsibility: Manage pagination with context-aware navigation

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
  Paper,
  SelectChangeEvent,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  FastRewind as FastRewindIcon,
  FastForward as FastForwardIcon,
  MoreHoriz as MoreIcon,
} from '@mui/icons-material';

export interface StreamPaginationControlProps {
  page: number;
  rowsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onJumpToPage?: (page: number) => void;

  // Context props
  currentItems: number;
  itemLabel?: string;
  loading?: boolean;

  // Customization
  variant?: 'default' | 'compact' | 'mobile';
  showPageSize?: boolean;
  showJumpControls?: boolean;
  maxVisitedPages?: number;
}

interface VisitedPage {
  page: number;
  itemRange: string;
  timestamp: Date;
}

const StreamPaginationControl: React.FC<StreamPaginationControlProps> = ({
  page,
  rowsPerPage,
  hasNext,
  hasPrev,
  onNextPage,
  onPrevPage,
  onRowsPerPageChange,
  onJumpToPage,
  currentItems,
  itemLabel = 'Items',
  loading = false,
  variant = 'default',
  showPageSize = true,
  showJumpControls = true,
  maxVisitedPages = 10,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [visitedPages, setVisitedPages] = useState<VisitedPage[]>([]);

  // Calculate current range
  const startItem = (page - 1) * rowsPerPage + 1;
  const endItem = startItem + currentItems - 1;
  const currentRange = `${itemLabel} ${startItem}-${endItem}`;

  // Memoized button styles for consistent theming
  const prevButtonSx = useMemo(
    () => ({
      backgroundColor: hasPrev ? theme.palette.primary.main : 'transparent',
      color: hasPrev ? 'white' : 'text.disabled',
      transition: theme.transitions.create(['background-color'], {
        duration: theme.transitions.duration.short,
      }),
      '&:hover': {
        backgroundColor: hasPrev ? theme.palette.primary.dark : 'transparent',
      },
    }),
    [hasPrev, theme.palette.primary.main, theme.palette.primary.dark, theme.transitions],
  );

  const nextButtonSx = useMemo(
    () => ({
      backgroundColor: hasNext ? theme.palette.primary.main : 'transparent',
      color: hasNext ? 'white' : 'text.disabled',
      transition: theme.transitions.create(['background-color'], {
        duration: theme.transitions.duration.short,
      }),
      '&:hover': {
        backgroundColor: hasNext ? theme.palette.primary.dark : 'transparent',
      },
    }),
    [hasNext, theme.palette.primary.main, theme.palette.primary.dark, theme.transitions],
  );

  // Desktop button styles
  const desktopPrevButtonSx = useMemo(
    () => ({
      minWidth: 100,
      backgroundColor: hasPrev ? theme.palette.primary.main : 'action.hover',
      color: hasPrev ? theme.palette.primary.contrastText : theme.palette.text.disabled,
      transition: theme.transitions.create(['background-color', 'opacity'], {
        duration: theme.transitions.duration.short,
      }),
      '&:hover': {
        backgroundColor: hasPrev ? theme.palette.primary.dark : 'action.hover',
      },
    }),
    [
      hasPrev,
      theme.palette.primary.main,
      theme.palette.primary.dark,
      theme.palette.primary.contrastText,
      theme.palette.text.disabled,
      theme.transitions,
    ],
  );

  const desktopNextButtonSx = useMemo(
    () => ({
      minWidth: 100,
      backgroundColor: hasNext ? theme.palette.primary.main : 'action.hover',
      color: hasNext ? theme.palette.primary.contrastText : theme.palette.text.disabled,
      transition: theme.transitions.create(['background-color', 'opacity'], {
        duration: theme.transitions.duration.short,
      }),
      '&:hover': {
        backgroundColor: hasNext ? theme.palette.primary.dark : 'action.hover',
      },
    }),
    [
      hasNext,
      theme.palette.primary.main,
      theme.palette.primary.dark,
      theme.palette.primary.contrastText,
      theme.palette.text.disabled,
      theme.transitions,
    ],
  );

  // Track current page - use direct useEffect to avoid callback recreation
  React.useEffect(() => {
    const newPage: VisitedPage = {
      page,
      itemRange: currentRange,
      timestamp: new Date(),
    };

    setVisitedPages((prev) => {
      const existing = prev.find((p) => p.page === page);
      if (existing) return prev;

      const updated = [...prev, newPage];
      // Keep only the most recent pages
      if (updated.length > maxVisitedPages) {
        updated.shift();
      }
      return updated;
    });
  }, [page, currentRange, maxVisitedPages]);

  // Page size options
  const pageSizeOptions = [10, 25, 50, 100];

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (event: SelectChangeEvent<number>) => {
      const newSize =
        typeof event.target.value === 'string' ? parseInt(event.target.value) : event.target.value;
      onRowsPerPageChange(newSize);
    },
    [onRowsPerPageChange],
  );

  // Handle jump to visited page
  const handleJumpToPage = useCallback(
    (targetPage: number) => {
      if (onJumpToPage) {
        onJumpToPage(targetPage);
      }
    },
    [onJumpToPage],
  );

  // Render visited pages dots
  const renderVisitedPages = useMemo(() => {
    if (visitedPages.length <= 1) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mx: 2 }}>
        {/* Journey label */}
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          Explored:
        </Typography>

        {/* Visited page dots */}
        {visitedPages.slice(-7).map((visitedPage, index, arr) => {
          const isActive = visitedPage.page === page;
          const isClickable = !isActive && onJumpToPage;

          return (
            <Tooltip
              key={visitedPage.page}
              title={`Jump to ${visitedPage.itemRange}`}
              placement="top"
            >
              <Box
                component={isClickable ? 'button' : 'div'}
                onClick={isClickable ? () => handleJumpToPage(visitedPage.page) : undefined}
                sx={{
                  width: isActive ? 12 : 8,
                  height: isActive ? 12 : 8,
                  borderRadius: '50%',
                  backgroundColor: isActive
                    ? theme.palette.primary.main
                    : theme.palette.primary.light,
                  opacity: isActive ? 1 : 0.6,
                  transition: 'all 0.2s ease-in-out',
                  cursor: isClickable ? 'pointer' : 'default',
                  border: 'none',
                  padding: 0,
                  position: 'relative',
                  '&:hover': isClickable
                    ? {
                        opacity: 1,
                        transform: 'scale(1.2)',
                      }
                    : {},
                  // Connection line to next dot
                  '&::after':
                    index < arr.length - 1
                      ? {
                          content: '""',
                          position: 'absolute',
                          top: '50%',
                          left: '100%',
                          width: 8,
                          height: 1,
                          backgroundColor: theme.palette.primary.light,
                          opacity: 0.4,
                        }
                      : {},
                }}
              />
            </Tooltip>
          );
        })}

        {/* More indicator if many pages visited */}
        {visitedPages.length > 7 && (
          <MoreIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 0.5 }} />
        )}
      </Box>
    );
  }, [visitedPages, page, theme.palette, handleJumpToPage, onJumpToPage]);

  // Mobile compact version
  if (variant === 'mobile' || (variant === 'default' && isMobile)) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Current range display */}
          <Box sx={{ textAlign: 'center' }}>
            <Chip label={currentRange} color="primary" variant="outlined" size="small" />
          </Box>

          {/* Navigation controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton
              onClick={onPrevPage}
              disabled={!hasPrev || loading}
              size="large"
              sx={prevButtonSx}
            >
              <PrevIcon />
            </IconButton>

            {/* Page size selector */}
            {showPageSize && (
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select value={rowsPerPage} onChange={handlePageSizeChange} disabled={loading}>
                  {pageSizeOptions.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <IconButton
              onClick={onNextPage}
              disabled={!hasNext || loading}
              size="large"
              sx={nextButtonSx}
            >
              <NextIcon />
            </IconButton>
          </Box>

          {/* Visited pages on mobile */}
          {renderVisitedPages}
        </Box>
      </Paper>
    );
  }

  // Desktop version
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        {/* Left section: Current range and page size */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={currentRange}
            color="primary"
            variant="filled"
            sx={{
              fontWeight: 600,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
          />

          {showPageSize && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Per page</InputLabel>
              <Select
                value={rowsPerPage}
                label="Per page"
                onChange={handlePageSizeChange}
                disabled={loading}
              >
                {pageSizeOptions.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size} {itemLabel.toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Center section: Visited pages journey */}
        {renderVisitedPages}

        {/* Right section: Navigation controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Jump controls */}
          {showJumpControls && (
            <>
              <Tooltip title="Fast rewind">
                <IconButton
                  onClick={() => onJumpToPage?.(Math.max(1, page - 5))}
                  disabled={!hasPrev || !onJumpToPage || loading}
                  size="small"
                >
                  <FastRewindIcon />
                </IconButton>
              </Tooltip>
            </>
          )}

          {/* Previous button */}
          <Button
            variant="contained"
            onClick={onPrevPage}
            disabled={!hasPrev || loading}
            startIcon={<PrevIcon />}
            sx={desktopPrevButtonSx}
          >
            Previous
          </Button>

          {/* Page indicator */}
          <Typography
            variant="body2"
            sx={{
              mx: 2,
              minWidth: 60,
              textAlign: 'center',
              fontWeight: 500,
              color: 'text.secondary',
            }}
          >
            Page {page}
          </Typography>

          {/* Next button */}
          <Button
            variant="contained"
            onClick={onNextPage}
            disabled={!hasNext || loading}
            endIcon={<NextIcon />}
            sx={desktopNextButtonSx}
          >
            Next
          </Button>

          {/* Jump controls */}
          {showJumpControls && (
            <>
              <Tooltip title="Fast forward">
                <IconButton
                  onClick={() => onJumpToPage?.(page + 5)}
                  disabled={!hasNext || !onJumpToPage || loading}
                  size="small"
                >
                  <FastForwardIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

// Memoize to prevent unnecessary re-renders while keeping it simple
export default React.memo(StreamPaginationControl);
