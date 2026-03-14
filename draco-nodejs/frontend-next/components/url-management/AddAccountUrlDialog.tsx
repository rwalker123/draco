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
import NotificationSnackbar from '../common/NotificationSnackbar';
import { AccountUrlCreateResult, useAccountUrlsService } from '../../hooks/useAccountUrlsService';
import {
  AccountUrlProtocol,
  buildAccountUrlPreview,
  validateAccountUrlInput,
} from './accountUrlValidation';
import { useNotifications } from '../../hooks/useNotifications';

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
  const { createUrl, loading, clearError } = useAccountUrlsService(accountId);
  const { notification, showNotification, hideNotification } = useNotifications();
  const [protocol, setProtocol] = React.useState<AccountUrlProtocol>('https://');
  const [domain, setDomain] = React.useState('');

  const clearErrorRef = React.useRef(clearError);
  React.useEffect(() => {
    clearErrorRef.current = clearError;
  }, [clearError]);

  const urlPreview = buildAccountUrlPreview(protocol, domain);

  const resetState = () => {
    setProtocol('https://');
    setDomain('');
    hideNotification();
    clearErrorRef.current();
  };

  React.useEffect(() => {
    if (!open) {
      setProtocol('https://');
      setDomain('');
      hideNotification();
      clearErrorRef.current();
    }
  }, [open, hideNotification]);

  const handleClose = () => {
    onClose();
    resetState();
  };

  const handleSubmit = async () => {
    const validationResult = validateAccountUrlInput(protocol, domain);

    if (!validationResult.success) {
      showNotification(validationResult.error, 'error');
      return;
    }

    try {
      const result = await createUrl(validationResult.url);
      onSuccess?.(result);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add URL';
      showNotification(message, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: 'text.primary' }}>Add URL for {accountName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
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
              hideNotification();
              clearError();
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
      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </Dialog>
  );
};

export default AddAccountUrlDialog;
