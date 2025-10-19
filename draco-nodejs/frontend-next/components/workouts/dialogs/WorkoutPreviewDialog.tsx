'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import { WorkoutDisplay } from '../WorkoutDisplay';

interface WorkoutPreviewDialogProps {
  accountId: string;
  workoutId: string | null;
  open: boolean;
  onClose: () => void;
}

export const WorkoutPreviewDialog: React.FC<WorkoutPreviewDialogProps> = ({
  accountId,
  workoutId,
  open,
  onClose,
}) => {
  const { token } = useAuth();

  const canRenderWorkout = useMemo(() => Boolean(workoutId), [workoutId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="workout-preview-dialog-title"
    >
      <DialogTitle id="workout-preview-dialog-title">Preview Workout</DialogTitle>
      <Divider />
      <DialogContent dividers sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
        {canRenderWorkout && workoutId ? (
          <WorkoutDisplay
            accountId={accountId}
            workoutId={workoutId}
            token={token ?? undefined}
            showRegistrationButton={true}
            compact={false}
          />
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Select a workout to preview.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
