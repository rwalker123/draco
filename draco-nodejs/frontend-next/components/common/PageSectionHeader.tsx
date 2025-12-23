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
  const shouldWrap = showDivider || !!actions;

  const typography = (
    <Typography
      variant={variant}
      component={component}
      color="text.primary"
      sx={{
        fontWeight,
        ...(!shouldWrap && gutterBottom ? { mb: 2 } : {}),
        ...(!shouldWrap ? sx : {}),
      }}
    >
      {title}
    </Typography>
  );

  if (shouldWrap) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          ...(showDivider
            ? {
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }
            : {}),
          ...(gutterBottom ? { mb: 2 } : {}),
          ...sx,
        }}
      >
        {typography}
        {actions ? <Box>{actions}</Box> : null}
      </Box>
    );
  }

  return typography;
};

export default PageSectionHeader;
