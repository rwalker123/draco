'use client';

import React from 'react';
import { Paper, SxProps, Theme } from '@mui/material';

export interface SectionCardProps {
  children: React.ReactNode;
  hover?: boolean;
  sx?: SxProps<Theme>;
}

const SectionCard: React.FC<SectionCardProps> = ({ children, hover = true, sx }) => {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...(hover && {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

export default SectionCard;
