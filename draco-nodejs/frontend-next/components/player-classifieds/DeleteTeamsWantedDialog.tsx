'use client';

import React, { useState } from 'react';
import { Alert, Box, Chip, Typography } from '@mui/material';
import { format } from 'date-fns';
import {
  TeamsWantedOwnerClassifiedType,
  TeamsWantedPublicClassifiedType,
} from '@draco/shared-schemas';
import { useTeamsWantedClassifieds } from '../../hooks/useClassifiedsService';
import ConfirmDeleteDialog from '../social/ConfirmDeleteDialog';

export interface DeleteTeamsWantedSuccessEvent {
  message: string;
  id: string;
}

interface DeleteTeamsWantedDialogProps {
  accountId: string;
  open: boolean;
  classified: TeamsWantedPublicClassifiedType | TeamsWantedOwnerClassifiedType | null;
  accessCode?: string;
  onClose: () => void;
  onSuccess?: (event: DeleteTeamsWantedSuccessEvent) => void;
  onError?: (message: string) => void;
}

const DeleteTeamsWantedDialog: React.FC<DeleteTeamsWantedDialogProps> = ({
  accountId,
  open,
  classified,
  accessCode,
  onClose,
  onSuccess,
  onError,
}) => {
  const {
    deleteTeamsWanted,
    loading: operationLoading,
    error: serviceError,
    resetError,
  } = useTeamsWantedClassifieds(accountId);
  const [localError, setLocalError] = useState<string | null>(null);

  const combinedError = localError ?? serviceError;

  if (!classified) return null;

  const handleClose = () => {
    setLocalError(null);
    resetError();
    onClose();
  };

  const handleConfirm = async () => {
    setLocalError(null);
    resetError();

    const result = await deleteTeamsWanted(classified.id.toString(), {
      accessCode,
    });

    if (result.success) {
      const successMessage = result.message ?? 'Teams Wanted ad deleted successfully';
      onSuccess?.({ message: successMessage, id: classified.id.toString() });
      handleClose();
      return;
    }

    const message = result.error ?? 'Failed to delete Teams Wanted ad';
    setLocalError(message);
    onError?.(message);
  };

  const createdDate = classified.dateCreated ? new Date(classified.dateCreated) : null;
  const positionsPlayed = (classified.positionsPlayed ?? '')
    .split(',')
    .map((position) => position.trim())
    .filter((position) => position.length > 0);

  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete Teams Wanted Ad"
      message="Are you sure you want to delete this Teams Wanted ad?"
      content={
        <>
          {combinedError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => {
                setLocalError(null);
                resetError();
              }}
            >
              {combinedError}
            </Alert>
          )}

          <Box
            sx={(theme) => ({
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? theme.palette.widget.surface : 'grey.100',
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
            })}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Ad Details:
            </Typography>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Player:</strong> {classified.name}
            </Typography>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Created:</strong>{' '}
              {createdDate ? format(createdDate, 'MMMM d, yyyy') : 'Unknown'}
            </Typography>

            {classified.age !== null && classified.age !== undefined ? (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Age:</strong> {classified.age}
              </Typography>
            ) : null}

            {classified.experience ? (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Experience:</strong> {classified.experience}
              </Typography>
            ) : null}

            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Positions Played:</strong>
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {positionsPlayed.map((position) => (
                  <Chip
                    key={position}
                    label={position}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          </Box>

          <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'medium' }}>
            This action cannot be undone.
          </Typography>
        </>
      }
      onClose={handleClose}
      onConfirm={handleConfirm}
      confirmLabel={operationLoading ? 'Deleting...' : 'Delete'}
      confirmButtonProps={{ color: 'error', variant: 'contained', disabled: operationLoading }}
      cancelButtonProps={{ disabled: operationLoading }}
      dialogProps={{ maxWidth: 'sm', fullWidth: true }}
    />
  );
};

export default DeleteTeamsWantedDialog;
