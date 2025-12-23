'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import type { SponsorType } from '@draco/shared-schemas';
import { useSponsorOperations } from '../../hooks/useSponsorOperations';
import ConfirmDeleteDialog from '../social/ConfirmDeleteDialog';

interface SponsorDeleteDialogProps {
  accountId: string;
  open: boolean;
  sponsor: SponsorType | null;
  onClose: () => void;
  onSuccess?: (result: { message: string; sponsor: SponsorType }) => void;
  onError?: (message: string) => void;
}

export const SponsorDeleteDialog: React.FC<SponsorDeleteDialogProps> = ({
  accountId,
  open,
  sponsor,
  onClose,
  onSuccess,
  onError,
}) => {
  const { deleteSponsor } = useSponsorOperations({ type: 'account', accountId });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!sponsor) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteSponsor(sponsor.id);
      onSuccess?.({ message: 'Sponsor deleted successfully', sponsor });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete sponsor';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    onClose();
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete Sponsor"
      message={`Are you sure you want to delete ${sponsor?.name ?? 'this sponsor'}?`}
      content={
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
          {error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}
        </>
      }
      onConfirm={handleDelete}
      onClose={handleClose}
      confirmLabel={loading ? 'Deleting…' : 'Delete Sponsor'}
      confirmButtonProps={{ disabled: loading }}
      cancelButtonProps={{ color: 'inherit', disabled: loading }}
      dialogProps={{ maxWidth: 'sm', fullWidth: true }}
      dialogContentProps={{ dividers: true }}
    />
  );
};

export default SponsorDeleteDialog;
