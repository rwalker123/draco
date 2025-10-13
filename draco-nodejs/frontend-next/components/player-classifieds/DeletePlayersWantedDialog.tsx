'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { PlayersWantedClassifiedType } from '@draco/shared-schemas';
import { usePlayersWantedClassifieds } from '../../hooks/useClassifiedsService';

export interface DeletePlayersWantedSuccessEvent {
  message: string;
  id: string;
}

interface DeletePlayersWantedDialogProps {
  accountId: string;
  open: boolean;
  classified: PlayersWantedClassifiedType | null;
  onClose: () => void;
  onSuccess?: (event: DeletePlayersWantedSuccessEvent) => void;
  onError?: (message: string) => void;
}

const DeletePlayersWantedDialog: React.FC<DeletePlayersWantedDialogProps> = ({
  accountId,
  open,
  classified,
  onClose,
  onSuccess,
  onError,
}) => {
  const {
    deletePlayersWanted,
    loading: operationLoading,
    error: serviceError,
    resetError,
  } = usePlayersWantedClassifieds(accountId);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceError) {
      setLocalError(serviceError);
    }
  }, [serviceError]);

  if (!classified) return null;

  const handleClose = () => {
    setLocalError(null);
    resetError();
    onClose();
  };

  const handleConfirm = async () => {
    setLocalError(null);
    resetError();

    const result = await deletePlayersWanted(classified.id.toString());

    if (result.success) {
      const successMessage = result.message ?? 'Players Wanted ad deleted successfully';
      onSuccess?.({ message: successMessage, id: classified.id.toString() });
      handleClose();
      return;
    }

    const message = result.error ?? 'Failed to delete Players Wanted ad';
    setLocalError(message);
    onError?.(message);
  };

  const createdDate = classified.dateCreated ? new Date(classified.dateCreated) : null;
  const positionsNeeded = classified.positionsNeeded.split(',').map((pos) => pos.trim());

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Players Wanted Ad</DialogTitle>

      <DialogContent>
        {localError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError(null)}>
            {localError}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete this Players Wanted ad?
        </Typography>

        <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Ad Details:
          </Typography>

          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Team/Event:</strong> {classified.teamEventName}
          </Typography>

          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Created:</strong>{' '}
            {createdDate ? format(createdDate, 'MMMM d, yyyy') : 'Unknown'}
          </Typography>

          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Created by:</strong> {classified.creator.firstName}{' '}
            {classified.creator.lastName}
          </Typography>

          {classified.description && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Description:</strong> {classified.description}
            </Typography>
          )}

          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Positions Needed:</strong>
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {positionsNeeded.map((position: string) => (
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
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={operationLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={operationLoading}
        >
          {operationLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletePlayersWantedDialog;
