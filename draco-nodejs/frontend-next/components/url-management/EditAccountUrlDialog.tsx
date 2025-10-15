'use client';

import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { AccountUrlType } from '@draco/shared-schemas';
import { getDomainValidationError, isValidDomain } from '../../utils/validation';
import { AccountUrlUpdateResult, useAccountUrlsService } from '../../hooks/useAccountUrlsService';

interface EditAccountUrlDialogProps {
  accountId: string;
  open: boolean;
  url: AccountUrlType | null;
  onClose: () => void;
  onSuccess?: (result: AccountUrlUpdateResult) => void;
}

const EditAccountUrlDialog: React.FC<EditAccountUrlDialogProps> = ({
  accountId,
  open,
  url,
  onClose,
  onSuccess,
}) => {
  const { updateUrl, loading, error, clearError } = useAccountUrlsService(accountId);
  const [protocol, setProtocol] = React.useState<'https://' | 'http://'>('https://');
  const [domain, setDomain] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const resetState = React.useCallback(() => {
    setProtocol('https://');
    setDomain('');
    setValidationError(null);
    clearError();
  }, [clearError]);

  React.useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    if (url) {
      try {
        const parsed = new URL(url.url);
        const parsedProtocol = parsed.protocol === 'http:' ? 'http://' : 'https://';
        setProtocol(parsedProtocol);
        setDomain(parsed.host);
      } catch (parseError) {
        console.error('Failed to parse account URL', parseError);
        setProtocol('https://');
        setDomain('');
      }
    }

    setValidationError(null);
    clearError();
  }, [open, url, resetState, clearError]);

  const handleClose = React.useCallback(() => {
    onClose();
    resetState();
  }, [onClose, resetState]);

  const handleSubmit = async () => {
    if (!url) {
      return;
    }

    const trimmedDomain = domain.trim();

    if (!trimmedDomain || !isValidDomain(trimmedDomain)) {
      setValidationError(getDomainValidationError(trimmedDomain));
      return;
    }

    try {
      const result = await updateUrl(url.id, `${protocol}${trimmedDomain}`);
      onSuccess?.(result);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update URL';
      setValidationError(message);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit URL</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {(validationError || error) && (
            <Alert
              severity="error"
              onClose={() => {
                setValidationError(null);
                clearError();
              }}
            >
              {validationError ?? error}
            </Alert>
          )}
          <FormControl fullWidth>
            <InputLabel>Protocol</InputLabel>
            <Select
              value={protocol}
              label="Protocol"
              onChange={(event) => setProtocol(event.target.value as 'https://' | 'http://')}
              disabled={loading}
            >
              <MenuItem value="https://">HTTPS (Recommended)</MenuItem>
              <MenuItem value="http://">HTTP</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Domain"
            value={domain}
            onChange={(event) => {
              setDomain(event.target.value);
              if (validationError) {
                setValidationError(null);
              }
              if (error) {
                clearError();
              }
            }}
            placeholder="example.com or subdomain.example.com"
            helperText="Enter the domain name only (e.g., example.com, www.example.com)"
            fullWidth
            required
            disabled={loading}
          />
          {protocol && domain.trim() && (
            <Alert severity="info">Full URL: {`${protocol}${domain.trim()}`}</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !url}>
          Update URL
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditAccountUrlDialog;
