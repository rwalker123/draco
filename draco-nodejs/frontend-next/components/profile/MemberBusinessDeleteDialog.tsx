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
import type { MemberBusinessType } from '@draco/shared-schemas';
import { deleteMemberBusiness } from '@draco/shared-api-client';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';

export type MemberBusinessDeleteResult = {
  message: string;
  memberBusinessId: string;
};

interface MemberBusinessDeleteDialogProps {
  open: boolean;
  accountId: string | null;
  memberBusiness: MemberBusinessType | null;
  onClose: () => void;
  onSuccess?: (result: MemberBusinessDeleteResult) => void;
  onError?: (message: string) => void;
}

const MemberBusinessDeleteDialog: React.FC<MemberBusinessDeleteDialogProps> = ({
  open,
  accountId,
  memberBusiness,
  onClose,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const handleDialogError = (message: string) => {
    setError(message);
    onError?.(message);
  };

  const handleConfirm = async () => {
    if (!accountId || !memberBusiness) {
      handleDialogError('Unable to delete member business.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await deleteMemberBusiness({
        client: apiClient,
        path: { accountId, memberBusinessId: memberBusiness.id },
        security: [{ type: 'http', scheme: 'bearer' }],
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to delete member business');
      onSuccess?.({
        message: 'Member business removed.',
        memberBusinessId: memberBusiness.id,
      });
      onClose();
    } catch (err) {
      console.error('Failed to delete member business', err);
      handleDialogError('Unable to delete the member business right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose}>
      <DialogTitle>Delete Member Business</DialogTitle>
      <DialogContent dividers>
        <Typography>
          Are you sure you want to remove <strong>{memberBusiness?.name}</strong> from your member
          business listings?
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={handleConfirm} disabled={submitting}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemberBusinessDeleteDialog;
