'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { PersonRemove as PersonRemoveIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useRegistrationOperations } from '../../hooks/useRegistrationOperations';

interface RevokeRegistrationDialogProps {
  open: boolean;
  contactId: string | null;
  onClose: () => void;
  onSuccess?: (result: { message: string; contactId: string }) => void;
  accountId: string;
}

/**
 * RevokeRegistrationDialog Component
 * Self-contained dialog for revoking user registrations with internal error handling
 */
const RevokeRegistrationDialog: React.FC<RevokeRegistrationDialogProps> = ({
  open,
  contactId,
  onClose,
  onSuccess,
  accountId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const { revokeRegistration, loading } = useRegistrationOperations(accountId);

  // Handle registration revocation with internal error handling
  const handleRevokeRegistration = useCallback(async () => {
    if (!contactId) return;

    // Clear any previous errors
    setError(null);

    const result = await revokeRegistration(contactId);

    if (result.success) {
      onSuccess?.({
        message: result.message || 'Registration revoked successfully',
        contactId: result.contactId!,
      });
      onClose(); // Close dialog on success
    } else {
      // Handle error internally
      setError(result.error || 'Failed to revoke registration');
    }
  }, [contactId, revokeRegistration, onSuccess, onClose]);

  // Clear error when dialog opens
  React.useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  if (!contactId) {
    return null; // Don't render if missing required data
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Revoke Registration</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Error display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon color="warning" />
            <Typography variant="body1">
              {
                "Are you sure you want to revoke this user's registration? This will remove their login access."
              }
            </Typography>
          </Stack>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone. The user will lose access to
              their account and will need to register again to regain access.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleRevokeRegistration}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonRemoveIcon />}
        >
          Revoke Registration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RevokeRegistrationDialog;
