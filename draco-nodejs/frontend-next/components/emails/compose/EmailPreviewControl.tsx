'use client';

import React from 'react';
import { Button, Link, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Preview as PreviewIcon } from '@mui/icons-material';

interface EmailPreviewControlProps {
  onPreviewClick: () => void;
  variant: 'button' | 'link' | 'menuItem';
  size?: 'small' | 'medium';
  disabled?: boolean;
  className?: string;
  onMenuClose?: () => void; // For menuItem variant
}

/**
 * Shared preview control component for email composition interface.
 * Provides consistent preview functionality across different UI contexts.
 */
export default function EmailPreviewControl({
  onPreviewClick,
  variant,
  size = 'small',
  disabled = false,
  className,
  onMenuClose,
}: EmailPreviewControlProps) {
  const handleClick = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }

    onPreviewClick();

    // Close menu if this is a menu item
    if (variant === 'menuItem' && onMenuClose) {
      onMenuClose();
    }
  };

  switch (variant) {
    case 'button':
      return (
        <Button
          startIcon={<PreviewIcon />}
          variant="text"
          onClick={handleClick}
          size={size}
          disabled={disabled}
          className={className}
          aria-label="Preview email"
        >
          Preview
        </Button>
      );

    case 'link':
      return (
        <Link
          component="button"
          variant="caption"
          onClick={handleClick}
          disabled={disabled}
          className={className}
          sx={{
            cursor: disabled ? 'default' : 'pointer',
            textDecoration: disabled ? 'none' : undefined,
          }}
          aria-label="Click to preview email"
        >
          Click here to see the preview
        </Link>
      );

    case 'menuItem':
      return (
        <MenuItem onClick={handleClick} disabled={disabled} className={className}>
          <ListItemIcon>
            <PreviewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Preview Email</ListItemText>
        </MenuItem>
      );

    default:
      return null;
  }
}
