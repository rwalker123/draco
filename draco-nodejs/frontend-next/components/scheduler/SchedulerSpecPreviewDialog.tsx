'use client';

import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { SchedulerProblemSpecPreview } from '@draco/shared-schemas';

interface SchedulerSpecPreviewDialogProps {
  open: boolean;
  specPreview: SchedulerProblemSpecPreview | null;
  onClose: () => void;
}

export const SchedulerSpecPreviewDialog: React.FC<SchedulerSpecPreviewDialogProps> = ({
  open,
  specPreview,
  onClose,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>Scheduler Problem Spec Preview</DialogTitle>
    <DialogContent dividers>
      {specPreview ? (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Loaded {specPreview.games.length} game(s).
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              overflowX: 'auto',
              fontSize: 12,
              lineHeight: 1.4,
              maxHeight: 520,
            }}
          >
            {JSON.stringify(specPreview, null, 2)}
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No preview loaded.
        </Typography>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);
