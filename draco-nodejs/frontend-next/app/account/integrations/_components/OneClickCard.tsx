'use client';

import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Stack, Tooltip, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material/styles';

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
  fallbackSnippet?: string;
  onFallbackCopy?: () => void;
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
  fallbackSnippet,
  onFallbackCopy,
}: OneClickCardProps) {
  const theme = useTheme();
  const [stepsOpen, setStepsOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePrimary = () => {
    if (primaryButtonHref) {
      window.open(primaryButtonHref, '_blank', 'noopener,noreferrer');
    }
    onPrimaryClick?.();
  };

  const handleFallbackCopy = async () => {
    if (!fallbackSnippet) return;
    await navigator.clipboard.writeText(fallbackSnippet);
    setCopied(true);
    onFallbackCopy?.();
    setTimeout(() => setCopied(false), 2000);
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
          {fallbackSnippet && (
            <Button
              size="small"
              variant="text"
              onClick={() => setFallbackOpen((prev) => !prev)}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              {fallbackOpen ? 'Hide manual setup' : 'Show manual setup'}
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
        {fallbackSnippet && fallbackOpen && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              component="pre"
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? '#0d1117' : '#f6f8fa',
                color: theme.palette.mode === 'dark' ? '#e6edf3' : '#24292f',
                borderRadius: 1,
                p: 1.5,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                overflow: 'auto',
                whiteSpace: 'pre',
                m: 0,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {fallbackSnippet}
            </Box>
            <Tooltip title={copied ? 'Copied!' : 'Copy snippet'}>
              <Button
                size="small"
                variant="outlined"
                startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                onClick={handleFallbackCopy}
                color={copied ? 'success' : 'primary'}
                sx={{ alignSelf: 'flex-start' }}
              >
                {copied ? 'Copied!' : 'Copy snippet'}
              </Button>
            </Tooltip>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
