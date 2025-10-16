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
import { AccountUrlCreateResult, useAccountUrlsService } from '../../hooks/useAccountUrlsService';
import {
  AccountUrlProtocol,
  buildAccountUrlPreview,
  validateAccountUrlInput,
} from './accountUrlValidation';

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
  const [protocol, setProtocol] = React.useState<AccountUrlProtocol>('https://');
  const [domain, setDomain] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const urlPreview = React.useMemo(() => buildAccountUrlPreview(protocol, domain), [protocol, domain]);

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
    const validationResult = validateAccountUrlInput(protocol, domain);

    if (!validationResult.success) {
      setValidationError(validationResult.error);
      return;
    }

    try {
      const result = await createUrl(validationResult.url);
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
              onChange={(event) => setProtocol(event.target.value as AccountUrlProtocol)}
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
          {urlPreview && <Alert severity="info">Full URL: {urlPreview}</Alert>}
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
