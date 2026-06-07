'use client';

import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import type { UnsavedChangesDecision, UnsavedChangesPrompt } from '../types';

type BusyAction = 'save' | 'discard' | null;

interface UnsavedChangesDialogProps {
  open: boolean;
  prompt: UnsavedChangesPrompt | null;
  busyAction: BusyAction;
  error: string | null;
  onDecision: (decision: UnsavedChangesDecision) => void;
  onClose: () => void;
}

const TAB_LABELS: Record<UnsavedChangesPrompt['tab'], string> = {
  batting: 'Batting',
  pitching: 'Pitching',
  recap: 'Recap',
  lineScore: 'Line Score',
};

const buildDescription = (prompt: UnsavedChangesPrompt | null): string => {
  if (!prompt) {
    return '';
  }

  const { reason, playerName, tab } = prompt;
  const tabLabel = TAB_LABELS[tab];

  switch (reason) {
    case 'switch-row':
      return `You have unsaved changes for ${playerName}. Save or discard them before editing another row.`;
    case 'tab-change':
      return `You have unsaved changes for ${playerName}. Save or discard them before leaving the ${tabLabel} tab.`;
    case 'exit-edit':
      return `You have unsaved changes for ${playerName}. Save or discard them before exiting edit mode.`;
    case 'game-change':
      return `You have unsaved changes for ${playerName}. Save or discard them before changing games.`;
    default:
      return `You have unsaved changes for ${playerName}. Save or discard them before continuing.`;
  }
};

const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  open,
  prompt,
  busyAction,
  error,
  onDecision,
  onClose,
}) => {
  const description = buildDescription(prompt);

  return (
    <Dialog open={open} onClose={busyAction ? undefined : onClose}>
      <DialogTitle>Unsaved changes</DialogTitle>
      <DialogContent dividers>
        <Typography>{description}</Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={busyAction !== null}>
          Cancel
        </Button>
        <Button
          onClick={() => onDecision('discard')}
          color="inherit"
          disabled={busyAction !== null}
        >
          Discard
        </Button>
        <Button
          onClick={() => onDecision('save')}
          variant="contained"
          disabled={busyAction !== null}
        >
          {busyAction === 'save' ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnsavedChangesDialog;
