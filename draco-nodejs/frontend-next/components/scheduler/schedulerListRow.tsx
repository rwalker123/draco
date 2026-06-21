'use client';

import React from 'react';
import { Box } from '@mui/material';
import { EditIconButton, DeleteIconButton } from '../common/ActionIconButtons';

export const listRowSx = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 2,
  p: 1,
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
} as const;

interface ListRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const ListRowActions: React.FC<ListRowActionsProps> = ({ onEdit, onDelete }) => (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    <EditIconButton onClick={onEdit} />
    <DeleteIconButton onClick={onDelete} />
  </Box>
);
