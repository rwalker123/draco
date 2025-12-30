'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, CardActionArea, Typography, Chip, Stack, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export interface AdminSubItemMetric {
  value: number | string;
  label: string;
  status?: 'default' | 'warning' | 'success' | 'error';
}

interface AdminSubItemCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  metrics?: AdminSubItemMetric[];
}

const statusColorMap = {
  default: 'default',
  warning: 'warning',
  success: 'success',
  error: 'error',
} as const;

const AdminSubItemCard: React.FC<AdminSubItemCardProps> = ({
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
          p: 2.5,
        }}
        aria-label={`Manage ${title}`}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 1,
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor:
                theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
              color: theme.palette.primary.main,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="subtitle1"
            component="h3"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              flexGrow: 1,
            }}
          >
            {title}
          </Typography>
          <ArrowForwardIcon
            sx={{
              color: theme.palette.text.secondary,
              fontSize: 20,
            }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            mb: metrics.length > 0 ? 2 : 0,
            flexGrow: 1,
            lineHeight: 1.5,
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

export default AdminSubItemCard;
