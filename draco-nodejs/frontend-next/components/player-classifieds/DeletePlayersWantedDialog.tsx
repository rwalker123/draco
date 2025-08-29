'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import { IPlayersWantedResponse } from '../../types/playerClassifieds';

interface DeletePlayersWantedDialogProps {
  open: boolean;
  classified: IPlayersWantedResponse | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const DeletePlayersWantedDialog: React.FC<DeletePlayersWantedDialogProps> = ({
  open,
  classified,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!classified) return null;

  const createdDate = classified.dateCreated ? new Date(classified.dateCreated) : null;
  const positionsNeeded = classified.positionsNeeded.split(',').map((pos) => pos.trim());

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Players Wanted Ad</DialogTitle>

      <DialogContent>
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
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletePlayersWantedDialog;
