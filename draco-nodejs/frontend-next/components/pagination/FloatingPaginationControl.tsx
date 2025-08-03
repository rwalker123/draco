'use client';

import React, { useState } from 'react';
import {
  Fab,
  Paper,
  Stack,
  Typography,
  Slide,
  useScrollTrigger,
  Box,
  Collapse,
  Chip,
} from '@mui/material';
import { NavigateBefore, NavigateNext, Settings, ExpandLess } from '@mui/icons-material';

interface FloatingPaginationProps {
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

const FloatingPaginationControl: React.FC<FloatingPaginationProps> = ({
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
  const [expanded, setExpanded] = useState(false);
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const getItemRange = () => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = (page - 1) * rowsPerPage + currentItems;
    return `${start}-${end}`;
  };

  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <Slide appear={false} direction="up" in={trigger}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Collapse in={expanded} timeout={300}>
          <Paper
            elevation={12}
            sx={{
              p: 3,
              mb: 2,
              minWidth: 280,
              borderRadius: 4,
              background:
                'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Stack spacing={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary" gutterBottom>
                  Page {page}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Showing {itemLabel} {getItemRange()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Items per page
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {pageSizeOptions.map((size) => (
                    <Chip
                      key={size}
                      label={size}
                      size="small"
                      variant={rowsPerPage === size ? 'filled' : 'outlined'}
                      color={rowsPerPage === size ? 'primary' : 'default'}
                      onClick={() => onRowsPerPageChange(size)}
                      sx={{
                        minWidth: 50,
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Fab
                  size="small"
                  color="primary"
                  onClick={onPrevPage}
                  disabled={!hasPrev}
                  sx={{
                    '&:disabled': {
                      opacity: 0.3,
                    },
                  }}
                >
                  <NavigateBefore />
                </Fab>

                <Fab
                  size="small"
                  color="primary"
                  onClick={onNextPage}
                  disabled={!hasNext}
                  sx={{
                    '&:disabled': {
                      opacity: 0.3,
                    },
                  }}
                >
                  <NavigateNext />
                </Fab>
              </Stack>
            </Stack>
          </Paper>
        </Collapse>

        <Fab
          color="primary"
          onClick={() => setExpanded(!expanded)}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #1BA3D6 90%)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {expanded ? <ExpandLess /> : <Settings />}
        </Fab>
      </Box>
    </Slide>
  );
};

export default FloatingPaginationControl;
