'use client';

import React, { useCallback, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { AccountPollType } from '@draco/shared-schemas';
import { usePollsService } from '@/hooks/usePollsService';

export interface PollDeleteDialogProps {
  accountId: string;
  open: boolean;
  poll: AccountPollType | null;
  onClose: () => void;
  onSuccess?: (result: { message: string; pollId: string }) => void;
  onError?: (message: string) => void;
}

const PollDeleteDialog: React.FC<PollDeleteDialogProps> = ({
  accountId,
  open,
  poll,
  onClose,
  onSuccess,
  onError,
}) => {
  const { deletePoll, loading, resetError } = usePollsService(accountId);

  useEffect(() => {
    resetError();
  }, [open, resetError]);

  const handleDelete = useCallback(async () => {
    if (!poll) {
      return;
    }

    try {
      const result = await deletePoll(poll.id);

      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('Failed to delete poll:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete poll.';
      onError?.(message);
    }
  }, [deletePoll, onClose, onError, onSuccess, poll]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Poll</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the poll &quot;{poll?.question}&quot;? This action cannot
          be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} color="error" disabled={loading}>
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PollDeleteDialog;
