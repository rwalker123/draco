'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.widget.surface,
        border: `1px solid ${theme.palette.widget.border}`,
        borderRadius: '12px',
        padding: theme.spacing(3),
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          backgroundColor: theme.palette.primary.main,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing(2),
          color: theme.palette.primary.contrastText,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: theme.spacing(1) }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}
