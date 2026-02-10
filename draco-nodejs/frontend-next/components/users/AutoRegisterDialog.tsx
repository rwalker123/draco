import React, { useState } from 'react';
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
import { useRegistrationOperations } from '@/hooks/useRegistrationOperations';

interface AutoRegisterDialogProps {
  open: boolean;
  contact: ContactType | null;
  accountId: string;
  onClose: () => void;
  onSuccess: (result: { contactId: string; userId: string; message?: string }) => void;
  onConflict: (data: {
    contact: ContactType;
    otherContactName?: string;
    otherContactId?: string;
    email?: string;
    message?: string;
  }) => void;
}

const AutoRegisterDialog: React.FC<AutoRegisterDialogProps> = ({
  open,
  contact,
  accountId,
  onClose,
  onSuccess,
  onConflict,
}) => {
  const { autoRegisterContact, loading } = useRegistrationOperations(accountId);
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setError(null);
    }
  }

  const handleConfirm = async () => {
    if (!contact) return;

    setError(null);
    const result = await autoRegisterContact(contact.id);

    if (!result.success || !result.response) {
      setError(result.error || 'Auto registration failed');
      return;
    }

    const response = result.response;

    if (response.status === 'conflict-other-contact') {
      onConflict({
        contact,
        otherContactId: response.otherContactId,
        otherContactName: response.otherContactName,
        email: contact.email || response.userName || undefined,
        message: response.message,
      });
      return;
    }

    if (response.status === 'missing-email') {
      setError('This contact does not have an email, so they cannot be auto-registered.');
      return;
    }

    if (response.status === 'already-linked' && response.userId) {
      onSuccess({
        contactId: response.contactId,
        userId: response.userId,
        message: response.message || 'Contact is already linked to this user. No action taken.',
      });
      onClose();
      return;
    }

    if (response.userId) {
      onSuccess({
        contactId: response.contactId,
        userId: response.userId,
        message:
          response.message ||
          (response.status === 'created-new-user'
            ? 'User created and invitation sent.'
            : 'User linked and invitation sent.'),
      });
      onClose();
      return;
    }

    setError('Auto registration did not complete.');
  };

  if (!open || !contact) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Auto Register Contact</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography>
            You are about to auto register{' '}
            <strong>
              {contact.firstName} {contact.lastName}
            </strong>
            . An account will be linked/created using their email:
          </Typography>
          <Typography fontWeight={600}>{contact.email || 'No email provided'}</Typography>
          <Typography variant="body2" color="text.secondary">
            If successful, we will send them a password setup email so they can sign in.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={loading || !contact.email}>
          {loading ? 'Processing...' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutoRegisterDialog;
