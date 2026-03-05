'use client';

import React, { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { clearContactEmailBounce } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { assertNoApiError } from '../../../utils/apiResult';
import type { BouncedContact } from '../../../types/emails/bounced-contact';

interface ClearBounceDialogProps {
  open: boolean;
  accountId: string;
  contact: BouncedContact | null;
  onClose: () => void;
  onCleared: () => void;
}

const ClearBounceDialog: React.FC<ClearBounceDialogProps> = ({
  open,
  accountId,
  contact,
  onClose,
  onCleared,
}) => {
  const apiClient = useApiClient();
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setNewEmail('');
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!contact) return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await clearContactEmailBounce({
        client: apiClient,
        path: { accountId, contactId: contact.id },
        body: newEmail.trim() ? { newEmail: newEmail.trim() } : undefined,
        throwOnError: false,
      });

      assertNoApiError(result, 'Failed to clear bounce');

      setNewEmail('');
      onCleared();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear bounce');
    } finally {
      setSubmitting(false);
    }
  };

  if (!contact) return null;

  const contactName = `${contact.firstName} ${contact.lastName}`.trim();
  const hasNoNewEmail = !newEmail.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Clear Email Bounce</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Contact: <strong>{contactName}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Bounced address: {contact.email ?? '(no email on record)'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
          Enter a new valid email address for this contact, or clear the bounce flag without
          updating the address.
        </Typography>

        <TextField
          fullWidth
          label="New email address (recommended)"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={submitting}
          placeholder="name@example.com"
        />

        {hasNoNewEmail && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Without a new email address, this contact will continue to be skipped in future sends.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={submitting}>
          {hasNoNewEmail ? 'Clear Flag Only' : 'Clear & Update Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClearBounceDialog;
