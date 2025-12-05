'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import { ContactType } from '@draco/shared-schemas';

export interface AutoRegisterConflictData {
  contact: ContactType;
  otherContactName?: string;
  otherContactId?: string;
  email?: string;
  message?: string;
}

interface AutoRegisterConflictDialogProps {
  open: boolean;
  data: AutoRegisterConflictData | null;
  onClose: () => void;
}

const AutoRegisterConflictDialog: React.FC<AutoRegisterConflictDialogProps> = ({
  open,
  data,
  onClose,
}) => {
  if (!open || !data) {
    return null;
  }

  const { contact, otherContactName, email, message } = data;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Auto Register Contact</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="error">User already linked to another contact in this account.</Alert>
          <Typography>
            {contact.firstName} {contact.lastName} cannot be auto registered because this email is
            already linked to {otherContactName || 'another contact'} in this account.
          </Typography>
          {email && (
            <Typography fontWeight={600} data-testid="auto-register-conflict-email">
              {email}
            </Typography>
          )}
          {message && (
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            No changes were made. Please confirm the correct email or update the existing user
            manually.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutoRegisterConflictDialog;
