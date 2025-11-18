import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

interface DenyPhotoSubmissionDialogProps {
  open: boolean;
  submissionTitle?: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean> | boolean;
}

const normalizeTitle = (title?: string): string | undefined => {
  if (!title) {
    return undefined;
  }

  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const DenyPhotoSubmissionDialog: React.FC<DenyPhotoSubmissionDialogProps> = ({
  open,
  submissionTitle,
  loading = false,
  error,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setReason('');
    setValidationError(null);
  }, []);

  const normalizedTitle = useMemo(() => normalizeTitle(submissionTitle), [submissionTitle]);

  const handleDialogClose = useCallback(() => {
    if (loading) {
      return;
    }
    resetForm();
    onClose();
  }, [loading, onClose, resetForm]);

  const handleConfirm = async () => {
    const trimmedReason = reason.trim();

    if (trimmedReason.length === 0) {
      setValidationError('Please provide a denial reason.');
      return;
    }

    setValidationError(null);
    const result = await onConfirm(trimmedReason);

    if (result) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>Deny Photo Submission</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <Typography variant="body1" gutterBottom>
            {normalizedTitle
              ? `Provide a reason for denying “${normalizedTitle}”.`
              : 'Provide a reason for denying this submission.'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The submitter will receive this explanation in their notification email.
          </Typography>
        </DialogContentText>
        <Box mt={3}>
          <TextField
            autoFocus
            multiline
            minRows={3}
            fullWidth
            label="Denial reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={loading}
            error={Boolean(validationError)}
            helperText={validationError}
          />
        </Box>
        {error && (
          <Box mt={2}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          Deny Submission
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DenyPhotoSubmissionDialog;
