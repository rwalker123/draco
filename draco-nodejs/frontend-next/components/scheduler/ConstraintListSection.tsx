'use client';

import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';

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
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Button size="small" variant="outlined" onClick={onEdit}>
      Edit
    </Button>
    <Button size="small" color="error" variant="outlined" onClick={onDelete}>
      Delete
    </Button>
  </Box>
);

interface ConstraintListSectionProps<T> {
  title: string;
  seasonId: string | null;
  items: T[];
  unitLabel?: string;
  renderRow: (item: T) => React.ReactNode;
}

export const ConstraintListSection = <T,>({
  title,
  seasonId,
  items,
  unitLabel = 'entry(s)',
  renderRow,
}: ConstraintListSectionProps<T>) => (
  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Box>
      <Typography variant="subtitle2">{title}</Typography>
      {seasonId && (
        <Typography variant="body2" color="text.secondary">
          {items.length} {unitLabel} configured.
        </Typography>
      )}
    </Box>
    {items.length > 0 && <Stack spacing={1}>{items.map(renderRow)}</Stack>}
  </Box>
);
