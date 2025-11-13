'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import { LinkOff as LinkOffIcon, WarningAmber as WarningAmberIcon } from '@mui/icons-material';
import { useAccountDiscordAdmin } from '@/hooks/useAccountDiscordAdmin';

interface ConfirmDiscordDisconnectDialogProps {
  open: boolean;
  accountId: string;
  onClose: () => void;
  onDisconnected?: () => Promise<void> | void;
}

const ConfirmDiscordDisconnectDialog: React.FC<ConfirmDiscordDisconnectDialogProps> = ({
  open,
  accountId,
  onClose,
  onDisconnected,
}) => {
  const { disconnectGuild } = useAccountDiscordAdmin();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleDisconnect = useCallback(async () => {
    if (!accountId) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await disconnectGuild(accountId);
      await onDisconnected?.();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to disconnect the Discord integration.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [accountId, disconnectGuild, onClose, onDisconnected]);

  if (!accountId) {
    return null;
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Disconnect Discord</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberIcon color="warning" />
            <Typography fontWeight={600}>
              Removing Discord will delete all mappings and linked accounts.
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            This action removes the guild configuration, channel ingestion mappings, role mappings,
            and linked user accounts for this organization. You will need to reinstall the bot and
            reconfigure settings to enable Discord features again.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleDisconnect}
          variant="contained"
          color="error"
          startIcon={submitting ? <CircularProgress size={18} /> : <LinkOffIcon fontSize="small" />}
          disabled={submitting}
        >
          Disconnect
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDiscordDisconnectDialog;
