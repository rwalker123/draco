'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useIndividualGolfAccountService } from '../../../hooks/useIndividualGolfAccountService';
import ConfirmDeleteDialog from '../../social/ConfirmDeleteDialog';

interface DeleteIndividualGolfAccountDialogProps {
  open: boolean;
  accountId: string;
  accountName: string;
  canDeleteUser: boolean;
  onClose: () => void;
  onSuccess?: (result: { accountId: string; message: string; userDeleted: boolean }) => void;
  onError?: (message: string) => void;
}

const DeleteIndividualGolfAccountDialog: React.FC<DeleteIndividualGolfAccountDialogProps> = ({
  open,
  accountId,
  accountName,
  canDeleteUser,
  onClose,
  onSuccess,
  onError,
}) => {
  const { deleteAccount } = useIndividualGolfAccountService();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteUserChecked, setDeleteUserChecked] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const isConfirmValid = confirmText === 'DELETE';

  useEffect(() => {
    if (open) {
      setError(null);
      setDeleteUserChecked(false);
      setConfirmText('');
    }
  }, [open]);

  const handleClose = useCallback(() => {
    if (isDeleting) {
      return;
    }
    onClose();
  }, [isDeleting, onClose]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteAccount(accountId, deleteUserChecked);

      if (!result.success) {
        throw new Error(result.error);
      }

      onSuccess?.({
        accountId,
        message: result.message,
        userDeleted: deleteUserChecked,
      });

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
      onError?.(message);
    } finally {
      setIsDeleting(false);
    }
  }, [accountId, deleteAccount, deleteUserChecked, onClose, onSuccess, onError]);

  const content = (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary">
        This will permanently delete your golf account and all associated data including:
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        <Typography component="li" variant="body2" color="text.secondary">
          Your golfer profile
        </Typography>
        <Typography component="li" variant="body2" color="text.secondary">
          All recorded scores and statistics
        </Typography>
        <Typography component="li" variant="body2" color="text.secondary">
          Handicap history
        </Typography>
      </Box>
      {canDeleteUser && (
        <FormControlLabel
          control={
            <Checkbox
              checked={deleteUserChecked}
              onChange={(e) => setDeleteUserChecked(e.target.checked)}
              disabled={isDeleting}
            />
          }
          label={
            <Typography variant="body2">
              Also delete my login account (you will need to create a new account to use this
              service again)
            </Typography>
          }
        />
      )}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Type <strong>DELETE</strong> to confirm:
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          disabled={isDeleting}
          autoComplete="off"
        />
      </Box>
    </Stack>
  );

  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete Golf Account"
      message={`Are you sure you want to delete '${accountName}'? This action cannot be undone.`}
      content={content}
      onClose={handleClose}
      onConfirm={handleDelete}
      confirmLabel={isDeleting ? 'Deleting...' : 'Delete Account'}
      confirmButtonProps={{
        color: 'error',
        variant: 'contained',
        disabled: isDeleting || !isConfirmValid,
      }}
      cancelButtonProps={{ disabled: isDeleting }}
      dialogProps={{ maxWidth: 'sm', fullWidth: true }}
    />
  );
};

export default DeleteIndividualGolfAccountDialog;
