'use client';

import React from 'react';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface Step {
  label: string;
}

interface OneClickCardProps {
  title: string;
  description: string;
  note?: string;
  primaryButtonLabel: string;
  primaryButtonHref?: string;
  onPrimaryClick?: () => void;
  steps?: Step[];
  badge?: string;
}

export default function OneClickCard({
  title,
  description,
  note,
  primaryButtonLabel,
  primaryButtonHref,
  onPrimaryClick,
  steps,
  badge,
}: OneClickCardProps) {
  const [stepsOpen, setStepsOpen] = React.useState(false);

  const handlePrimary = () => {
    if (primaryButtonHref) {
      window.open(primaryButtonHref, '_blank', 'noopener,noreferrer');
    }
    onPrimaryClick?.();
  };

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          {badge && <Chip label={badge} size="small" color="primary" variant="outlined" />}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {description}
        </Typography>
        {note && (
          <Typography variant="caption" color="text.secondary">
            {note}
          </Typography>
        )}
        <Stack spacing={1}>
          <Button
            variant="contained"
            size="small"
            endIcon={<OpenInNewIcon />}
            onClick={handlePrimary}
            sx={{ alignSelf: 'flex-start' }}
          >
            {primaryButtonLabel}
          </Button>
          {steps && steps.length > 0 && (
            <Button
              size="small"
              variant="text"
              onClick={() => setStepsOpen((prev) => !prev)}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              {stepsOpen ? 'Hide setup steps' : 'Setup steps'}
            </Button>
          )}
        </Stack>
        {steps && stepsOpen && (
          <Box component="ol" sx={{ pl: 2, m: 0 }}>
            {steps.map((step, i) => (
              <Typography
                component="li"
                key={i}
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                {step.label}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
