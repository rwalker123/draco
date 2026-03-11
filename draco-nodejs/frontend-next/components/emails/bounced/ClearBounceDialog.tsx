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
import NotificationSnackbar from '../../common/NotificationSnackbar';
import { clearContactEmailBounce } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { useNotifications } from '../../../hooks/useNotifications';
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
  const { notification, showNotification, hideNotification } = useNotifications();
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setNewEmail('');
    hideNotification();
    onClose();
  };

  const handleConfirm = async () => {
    if (!contact) return;

    try {
      setSubmitting(true);
      hideNotification();

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
      showNotification(err instanceof Error ? err.message : 'Failed to clear bounce', 'error');
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={submitting}>
          {hasNoNewEmail ? 'Clear Flag Only' : 'Clear & Update Email'}
        </Button>
      </DialogActions>
      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </Dialog>
  );
};

export default ClearBounceDialog;
