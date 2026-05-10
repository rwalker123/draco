'use client';

import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Tooltip, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material/styles';

interface CodeSnippetCardProps {
  title: string;
  description: string;
  snippet: string;
  copyLabel?: string;
  instruction?: string;
  onCopy: (text: string) => void;
}

export default function CodeSnippetCard({
  title,
  description,
  snippet,
  copyLabel = 'Copy snippet',
  instruction,
  onCopy,
}: CodeSnippetCardProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    onCopy(snippet);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
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
          {snippet}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title={copied ? 'Copied!' : copyLabel}>
            <Button
              size="small"
              variant="outlined"
              startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
              onClick={handleCopy}
              color={copied ? 'success' : 'primary'}
            >
              {copied ? 'Copied!' : copyLabel}
            </Button>
          </Tooltip>
          {instruction && (
            <Typography variant="caption" color="text.secondary">
              {instruction}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
