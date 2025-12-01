'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import type { LeagueFaqType } from '@draco/shared-schemas';
import type { LeagueFaqServiceResult } from '../../../hooks/useLeagueFaqService';
import ConfirmDeleteDialog from '../../social/ConfirmDeleteDialog';

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

  const handleClose = () => {
    if (submitting) {
      return;
    }
    onClose();
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete FAQ"
      message={
        <>
          Are you sure you want to delete the FAQ{' '}
          {faq ? <>{`'<strong>${faq.question}</strong>'`}</> : '?'}
        </>
      }
      content={
        <>
          {submitError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          ) : null}
          <Typography sx={{ mt: 1 }} variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </>
      }
      onClose={handleClose}
      onConfirm={handleDelete}
      confirmButtonProps={{ color: 'error', variant: 'contained', disabled: submitting }}
      cancelButtonProps={{ disabled: submitting }}
      dialogProps={{ fullWidth: true, maxWidth: 'xs' }}
      dialogContentProps={{ dividers: true }}
    />
  );
};

export default DeleteLeagueFaqDialog;
