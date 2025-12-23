'use client';

import React from 'react';
import { Box, Typography, type SxProps, type Theme } from '@mui/material';

interface PageSectionHeaderProps {
  title: string;
  variant?: 'h5' | 'h6';
  component?: 'h1' | 'h2' | 'h3';
  fontWeight?: number;
  showDivider?: boolean;
  gutterBottom?: boolean;
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const PageSectionHeader: React.FC<PageSectionHeaderProps> = ({
  title,
  variant = 'h6',
  component = 'h2',
  fontWeight = 600,
  showDivider = false,
  gutterBottom = false,
  actions,
  sx,
}) => {
  const typography = (
    <Typography
      variant={variant}
      component={component}
      color="text.primary"
      sx={{ fontWeight, ...(!showDivider && gutterBottom ? { mb: 2 } : {}) }}
    >
      {title}
    </Typography>
  );

  if (showDivider || actions) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...(showDivider
            ? {
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }
            : {}),
          ...sx,
        }}
      >
        {typography}
        {actions ? <Box>{actions}</Box> : null}
      </Box>
    );
  }

  if (sx) {
    return (
      <Typography
        variant={variant}
        component={component}
        color="text.primary"
        sx={{ fontWeight, ...(gutterBottom ? { mb: 2 } : {}), ...sx }}
      >
        {title}
      </Typography>
    );
  }

  return typography;
};

export default PageSectionHeader;
