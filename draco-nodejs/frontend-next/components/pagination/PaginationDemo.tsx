'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { ViewStream, OpenWith, TouchApp } from '@mui/icons-material';
import StreamPaginationControl from './StreamPaginationControl';
import FloatingPaginationControl from './FloatingPaginationControl';
import GesturePaginationControl from './GesturePaginationControl';

const PaginationDemo: React.FC = () => {
  const [page, setPage] = useState(2);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedDemo, setSelectedDemo] = useState<string>('stream');

  // Mock data simulation
  const hasNext = page < 10;
  const hasPrev = page > 1;
  const currentItems = page === 10 ? 13 : rowsPerPage; // Last page has fewer items

  const handleNextPage = () => {
    if (hasNext) setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (hasPrev) setPage((prev) => prev - 1);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1); // Reset to first page when changing page size
  };

  const handleJumpToPage = (targetPage: number) => {
    setPage(Math.max(1, Math.min(10, targetPage)));
  };

  const demoOptions = [
    { value: 'stream', label: 'Stream Navigation', icon: <ViewStream /> },
    { value: 'floating', label: 'Floating Controls', icon: <OpenWith /> },
    { value: 'gesture', label: 'Gesture Controls', icon: <TouchApp /> },
  ];

  const renderCurrentDemo = () => {
    const commonProps = {
      page,
      rowsPerPage,
      hasNext,
      hasPrev,
      onNextPage: handleNextPage,
      onPrevPage: handlePrevPage,
      onRowsPerPageChange: handleRowsPerPageChange,
      itemLabel: 'Users',
      currentItems,
    };

    switch (selectedDemo) {
      case 'stream':
        return <StreamPaginationControl {...commonProps} onJumpToPage={handleJumpToPage} />;
      case 'floating':
        return <FloatingPaginationControl {...commonProps} />;
      case 'gesture':
        return <GesturePaginationControl {...commonProps} />;
      default:
        return null;
    }
  };

  const getDemoDescription = () => {
    switch (selectedDemo) {
      case 'stream':
        return {
          title: 'Stream Navigation',
          description:
            'Visual breadcrumb navigation with progress dots showing your exploration journey. Features smart context labels and memory system for quick return to visited pages.',
          features: [
            'Progressive dot navigation',
            'Smart context labels',
            'Memory system',
            'Jump navigation',
          ],
        };
      case 'floating':
        return {
          title: 'Floating Action Controls',
          description:
            'Modern floating controls that appear on scroll with expandable settings panel. Perfect for content-heavy pages where traditional pagination might get lost.',
          features: [
            'Scroll-triggered appearance',
            'Expandable settings',
            'Glassmorphism design',
            'Minimal footprint',
          ],
        };
      case 'gesture':
        return {
          title: 'Gesture-Enabled Controls',
          description:
            'Touch-optimized pagination with swipe gestures, haptic feedback, and visual swipe indicators. Ideal for mobile and tablet interfaces.',
          features: ['Swipe navigation', 'Haptic feedback', 'Visual feedback', 'Touch optimized'],
        };
      default:
        return { title: '', description: '', features: [] };
    }
  };

  const currentDemo = getDemoDescription();

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom textAlign="center">
        Creative Pagination Controls Demo
      </Typography>

      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Modern pagination solutions that work without total count data
      </Typography>

      {/* Demo Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ToggleButtonGroup
          value={selectedDemo}
          exclusive
          onChange={(_, value) => value && setSelectedDemo(value)}
          aria-label="pagination demo type"
          size="large"
        >
          {demoOptions.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              <Stack direction="row" spacing={1} alignItems="center">
                {option.icon}
                <Typography variant="body2">{option.label}</Typography>
              </Stack>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={4}>
        {/* Demo Description */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {currentDemo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {currentDemo.description}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Key Features:
              </Typography>
              <Stack spacing={0.5}>
                {currentDemo.features.map((feature, index) => (
                  <Typography key={index} variant="body2" component="li">
                    {feature}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>API Constraints:</strong> These controls work with limited backend data
              (hasNext, hasPrev, page, rowsPerPage) - no total count required!
            </Typography>
          </Alert>
        </Grid>

        {/* Demo Area */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={3}
            sx={{
              minHeight: 400,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Mock Content Area */}
            <Box sx={{ flex: 1, p: 3, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Sample User Management Table
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This represents your table/grid/list content. The pagination controls work
                seamlessly with any data display format.
              </Typography>

              <Box sx={{ mt: 2, p: 2, backgroundColor: 'white', borderRadius: 1 }}>
                <Typography variant="body2">
                  Showing {currentItems} users on page {page}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • Previous page available: {hasPrev ? 'Yes' : 'No'}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  • Next page available: {hasNext ? 'Yes' : 'No'}
                </Typography>
              </Box>
            </Box>

            {/* Demo Pagination Control */}
            <Box sx={{ backgroundColor: 'background.paper' }}>{renderCurrentDemo()}</Box>
          </Paper>

          {selectedDemo === 'gesture' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Try it:</strong> On touch devices, swipe left/right on the pagination card
                to navigate!
              </Typography>
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaginationDemo;
