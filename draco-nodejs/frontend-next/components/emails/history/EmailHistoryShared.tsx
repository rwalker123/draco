'use client';

import React from 'react';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { EmailRecipientStatus, EmailStatus } from '../../../types/emails/email';

export const STATUS_LABELS: Record<EmailStatus, string> = {
  draft: 'Draft',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Failed',
  scheduled: 'Scheduled',
  partial: 'Partial',
};

export const STATUS_COLORS: Record<
  EmailStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  draft: 'default',
  sending: 'info',
  sent: 'success',
  failed: 'error',
  scheduled: 'secondary',
  partial: 'warning',
};

export const RECIPIENT_STATUS_LABELS: Record<EmailRecipientStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  delivered: 'Delivered',
  bounced: 'Bounced',
  failed: 'Failed',
  opened: 'Opened',
  clicked: 'Clicked',
};

export const RECIPIENT_STATUS_COLORS: Record<
  EmailRecipientStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  pending: 'default',
  sent: 'info',
  delivered: 'success',
  bounced: 'warning',
  failed: 'error',
  opened: 'secondary',
  clicked: 'primary',
};

export const formatRate = (value: number): string => `${value.toFixed(1)}%`;

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  helper,
  color = 'primary',
}) => {
  const backgroundColor = color === 'default' ? 'grey.100' : `${color}.light`;
  const foregroundColor = color === 'default' ? 'grey.800' : `${color}.dark`;

  return (
    <Card sx={{ flex: '1 1 240px', minWidth: 240 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: backgroundColor,
              color: foregroundColor,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
              {label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            {helper && (
              <Typography variant="caption" color="text.secondary">
                {helper}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export const StatusChip: React.FC<{ status: EmailStatus }> = ({ status }) => (
  <Chip
    label={STATUS_LABELS[status] ?? status}
    color={STATUS_COLORS[status]}
    size="small"
    variant="outlined"
  />
);

export const RecipientStatusChip: React.FC<{ status: EmailRecipientStatus }> = ({ status }) => (
  <Chip
    label={RECIPIENT_STATUS_LABELS[status] ?? status}
    color={RECIPIENT_STATUS_COLORS[status]}
    size="small"
    variant="outlined"
  />
);
