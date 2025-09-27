'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { AccountPollType } from '@draco/shared-schemas';
import { deleteAccountPoll } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { assertNoApiError } from '@/utils/apiResult';

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
  const apiClient = useApiClient();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDeleting(false);
    }
  }, [open]);

  const handleDelete = useCallback(async () => {
    if (!poll) {
      return;
    }

    setDeleting(true);

    try {
      const result = await deleteAccountPoll({
        client: apiClient,
        path: { accountId, pollId: poll.id },
        throwOnError: false,
      });

      assertNoApiError(result, 'Failed to delete poll');

      onSuccess?.({ message: 'Poll deleted successfully.', pollId: poll.id });
      onClose();
    } catch (err) {
      console.error('Failed to delete poll:', err);
      const message = 'Failed to delete poll.';
      onError?.(message);
    } finally {
      setDeleting(false);
    }
  }, [accountId, apiClient, onClose, onError, onSuccess, poll]);

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
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button onClick={handleDelete} color="error" disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PollDeleteDialog;
