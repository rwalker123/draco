'use client';

import React, { useState } from 'react';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface CopyableUrlProps {
  url: string;
  onCopy: () => void;
  label?: string;
  multiline?: boolean;
}

export default function CopyableUrl({
  url,
  onCopy,
  label = 'URL',
  multiline = false,
}: CopyableUrlProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
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
