'use client';

import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent } from '@mui/material';
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined';
import FieldDetailsCard, { FieldDetails } from './FieldDetailsCard';

interface FieldLinkProps {
  field: FieldDetails | null | undefined;
  label?: string | null;
  size?: 'small' | 'medium' | 'large';
  variant?: 'text' | 'outlined' | 'contained';
}

const FieldLink: React.FC<FieldLinkProps> = ({
  field,
  label,
  size = 'small',
  variant = 'outlined',
}) => {
  const [open, setOpen] = useState(false);
  const displayName = label ?? field?.shortName ?? field?.name ?? null;

  if (!displayName) return null;

  const handleOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        color="primary"
        size={size}
        startIcon={<FmdGoodOutlinedIcon fontSize="small" />}
        onClick={handleOpen}
        sx={{
          textTransform: 'none',
          alignSelf: 'flex-start',
          minWidth: 0,
          px: variant === 'text' ? 0.5 : undefined,
        }}
      >
        {displayName}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-label="Field details"
      >
        <DialogContent sx={{ p: 0 }}>
          <FieldDetailsCard
            field={field ?? null}
            placeholderTitle={displayName ?? 'Field details unavailable'}
            placeholderDescription="Field details are not available for this game."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FieldLink;
