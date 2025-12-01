'use client';

import React, { useCallback, useEffect } from 'react';
import { AccountPollType } from '@draco/shared-schemas';
import { usePollsService } from '@/hooks/usePollsService';
import ConfirmDeleteDialog from '../social/ConfirmDeleteDialog';

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
    <ConfirmDeleteDialog
      open={open}
      title="Delete Poll"
      message={`Are you sure you want to delete the poll "${poll?.question}"? This action cannot be undone.`}
      onConfirm={handleDelete}
      onClose={onClose}
      confirmLabel={loading ? 'Deleting…' : 'Delete'}
      confirmButtonProps={{ disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
      dialogProps={{ maxWidth: 'xs', fullWidth: true }}
    />
  );
};

export default PollDeleteDialog;
