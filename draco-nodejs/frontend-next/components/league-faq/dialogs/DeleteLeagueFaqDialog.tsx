'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { LeagueFaqType } from '@draco/shared-schemas';
import type { LeagueFaqServiceResult } from '../../../hooks/useLeagueFaqService';

interface DeleteLeagueFaqDialogProps {
  open: boolean;
  faq?: LeagueFaqType;
  onClose: () => void;
  onSuccess: (result: { faqId: string; message: string }) => void;
  onError: (message: string) => void;
  deleteFaq: (faqId: string) => Promise<LeagueFaqServiceResult<null>>;
}

export const DeleteLeagueFaqDialog: React.FC<DeleteLeagueFaqDialogProps> = ({
  open,
  faq,
  onClose,
  onSuccess,
  onError,
  deleteFaq,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSubmitError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!faq) {
      const message = 'FAQ not found.';
      setSubmitError(message);
      onError(message);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await deleteFaq(faq.id);
      if (result.success) {
        onSuccess({ faqId: faq.id, message: result.message });
      } else {
        setSubmitError(result.error);
        onError(result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete FAQ.';
      setSubmitError(message);
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete FAQ</DialogTitle>
      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Typography>
          Are you sure you want to delete the FAQ
          {faq ? (
            <>
              {' "'}
              <strong>{faq.question}</strong>
              {'"'}?
            </>
          ) : (
            ' ?'
          )}
        </Typography>
        <Typography sx={{ mt: 1 }} variant="body2" color="text.secondary">
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleDelete} disabled={submitting} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteLeagueFaqDialog;
