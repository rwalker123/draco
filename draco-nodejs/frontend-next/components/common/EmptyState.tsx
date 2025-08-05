'use client';

import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  minHeight?: number;
  wrapper?: 'box' | 'table-row' | 'none';
  colSpan?: number; // for table rows
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon,
  minHeight = 300,
  wrapper = 'box',
  colSpan = 100,
  sx,
  children,
}) => {
  const EmptyStateContent = () => (
    <>
      {icon && <Box sx={{ mb: 2, color: 'text.secondary' }}>{icon}</Box>}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {children}
    </>
  );

  if (wrapper === 'table-row') {
    return (
      <tr>
        <td colSpan={colSpan} style={{ textAlign: 'center', padding: '40px' }}>
          <EmptyStateContent />
        </td>
      </tr>
    );
  }

  if (wrapper === 'none') {
    return <EmptyStateContent />;
  }

  // Default box wrapper
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        textAlign: 'center',
        color: 'text.secondary',
        ...sx,
      }}
    >
      <EmptyStateContent />
    </Box>
  );
};

export default EmptyState;
