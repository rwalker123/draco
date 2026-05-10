'use client';

import React, { useState } from 'react';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface CopyableUrlProps {
  url: string;
  onCopy: () => void;
}

export default function CopyableUrl({ url, onCopy }: CopyableUrlProps) {
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
      slotProps={{
        input: {
          readOnly: true,
          sx: { fontFamily: 'monospace', fontSize: '0.8rem' },
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
                <IconButton size="small" onClick={handleCopy} aria-label="copy URL">
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
