'use client';

import React from 'react';
import { IconButton, type IconButtonProps, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface BaseActionIconButtonProps extends Omit<IconButtonProps, 'color'> {
  tooltipTitle?: string;
}

export const EditIconButton: React.FC<BaseActionIconButtonProps> = ({
  tooltipTitle = 'Edit',
  size = 'small',
  ...props
}) => {
  const button = (
    <IconButton color="primary" size={size} {...props}>
      <EditIcon fontSize="small" />
    </IconButton>
  );

  if (tooltipTitle) {
    return <Tooltip title={tooltipTitle}>{button}</Tooltip>;
  }

  return button;
};

interface DeleteIconButtonProps extends BaseActionIconButtonProps {
  tooltipTitle?: string;
}

export const DeleteIconButton: React.FC<DeleteIconButtonProps> = ({
  tooltipTitle = 'Delete',
  size = 'small',
  ...props
}) => {
  const button = (
    <IconButton color="error" size={size} {...props}>
      <DeleteIcon fontSize="small" />
    </IconButton>
  );

  if (tooltipTitle) {
    return <Tooltip title={tooltipTitle}>{button}</Tooltip>;
  }

  return button;
};
