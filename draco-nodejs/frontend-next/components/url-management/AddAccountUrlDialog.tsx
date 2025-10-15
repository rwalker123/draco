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
import { getDomainValidationError, isValidDomain } from '../../utils/validation';
import { AccountUrlCreateResult, useAccountUrlsService } from '../../hooks/useAccountUrlsService';

interface AddAccountUrlDialogProps {
  accountId: string;
  accountName: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: AccountUrlCreateResult) => void;
}

const AddAccountUrlDialog: React.FC<AddAccountUrlDialogProps> = ({
  accountId,
  accountName,
  open,
  onClose,
  onSuccess,
}) => {
  const { createUrl, loading, error, clearError } = useAccountUrlsService(accountId);
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
    }
  }, [open, resetState]);

  const handleClose = React.useCallback(() => {
    onClose();
    resetState();
  }, [onClose, resetState]);

  const handleSubmit = async () => {
    const trimmedDomain = domain.trim();

    if (!trimmedDomain || !isValidDomain(trimmedDomain)) {
      setValidationError(getDomainValidationError(trimmedDomain));
      return;
    }

    try {
      const result = await createUrl(`${protocol}${trimmedDomain}`);
      onSuccess?.(result);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add URL';
      setValidationError(message);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add URL for {accountName}</DialogTitle>
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
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          Add URL
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAccountUrlDialog;
