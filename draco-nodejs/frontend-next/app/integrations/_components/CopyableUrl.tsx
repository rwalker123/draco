'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface CopyableUrlProps {
  url: string;
  onCopy: () => void;
  onError?: (message: string) => void;
  label?: string;
  multiline?: boolean;
}

export default function CopyableUrl({
  url,
  onCopy,
  onError,
  label = 'URL',
  multiline = false,
}: CopyableUrlProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to copy to clipboard';
      onError?.(message);
      return;
    }
    setCopied(true);
    onCopy();
    if (copiedTimeoutRef.current !== null) {
      clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = setTimeout(() => {
      copiedTimeoutRef.current = null;
      setCopied(false);
    }, 2000);
  };

  return (
    <TextField
      value={url}
      size="small"
      fullWidth
      multiline={multiline}
      slotProps={{
        input: {
          readOnly: true,
          sx: { fontFamily: 'monospace', fontSize: '0.8rem' },
          endAdornment: (
            <InputAdornment
              position="end"
              sx={multiline ? { alignItems: 'flex-start' } : undefined}
            >
              <Tooltip title={copied ? 'Copied!' : `Copy ${label}`}>
                <IconButton size="small" onClick={handleCopy} aria-label={`copy ${label}`}>
                  {copied ? (
                    <CheckIcon fontSize="small" color="success" />
                  ) : (
                    <ContentCopyIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
