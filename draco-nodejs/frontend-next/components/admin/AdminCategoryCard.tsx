'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, CardActionArea, Typography, Chip, Stack, useTheme } from '@mui/material';

export interface AdminMetric {
  value: number | string;
  label: string;
  status?: 'default' | 'warning' | 'success' | 'error';
}

interface AdminCategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  metrics?: AdminMetric[];
}

const statusColorMap = {
  default: 'default',
  warning: 'warning',
  success: 'success',
  error: 'error',
} as const;

const AdminCategoryCard: React.FC<AdminCategoryCardProps> = ({
  title,
  description,
  icon,
  href,
  metrics = [],
}) => {
  const router = useRouter();
  const theme = useTheme();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[4],
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          p: 3,
        }}
        aria-label={`Navigate to ${title} administration`}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 1.5,
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            mb: 2,
            flexGrow: 1,
          }}
        >
          {description}
        </Typography>

        {metrics.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {metrics.map((metric, index) => (
              <Chip
                key={index}
                label={`${metric.value} ${metric.label}`}
                size="small"
                color={statusColorMap[metric.status || 'default']}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
                aria-label={`${metric.value} ${metric.label}`}
              />
            ))}
          </Stack>
        )}
      </CardActionArea>
    </Card>
  );
};

export default AdminCategoryCard;
