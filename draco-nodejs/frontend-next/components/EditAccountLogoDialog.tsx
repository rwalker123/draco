'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { addCacheBuster } from '../utils/addCacheBuster';
import {
  AccountLogoOperationSuccess,
  useAccountLogoOperations,
} from '../hooks/useAccountLogoOperations';

const LOGO_WIDTH = 512;
const LOGO_HEIGHT = 125;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface EditAccountLogoDialogProps {
  open: boolean;
  accountId: string;
  accountLogoUrl?: string | null;
  onClose: () => void;
  onSuccess?: (result: AccountLogoOperationSuccess) => void;
  onError?: (message: string) => void;
}

const logoFileSchema = z
  .custom<File>((value): value is File => value instanceof File, {
    message: 'Please select a logo to upload.',
  })
  .superRefine((file, ctx) => {
    if (!file.type.startsWith('image/')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'File must be an image.' });
    }

    if (file.size > MAX_FILE_SIZE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File size must be less than 10MB.',
      });
    }
  });

const EditAccountLogoDialog: React.FC<EditAccountLogoDialogProps> = ({
  open,
  accountId,
  accountLogoUrl,
  onClose,
  onSuccess,
  onError,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const normalizedAccountId = useMemo(() => accountId?.trim() || null, [accountId]);
  const { uploadLogo, deleteLogo, uploading, deleting, error, clearError } =
    useAccountLogoOperations(normalizedAccountId);

  const combinedError = validationError ?? error;

  useEffect(() => {
    if (open) {
      setLogoFile(null);
      setLogoPreview(accountLogoUrl ? addCacheBuster(accountLogoUrl) : null);
      setValidationError(null);
      setLogoPreviewError(false);
      clearError();
    }
  }, [open, accountLogoUrl, clearError]);

  useEffect(() => {
    if (!open) {
      setConfirmDeleteOpen(false);
    }
  }, [open]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationResult = logoFileSchema.safeParse(file);

    if (!validationResult.success) {
      const message = validationResult.error.issues[0]?.message ?? 'Invalid logo file.';
      setValidationError(message);
      return;
    }

    setLogoFile(file);
    setValidationError(null);
    clearError();
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const validationResult = logoFileSchema.safeParse(logoFile);

    if (!validationResult.success) {
      const message = validationResult.error.issues[0]?.message ?? 'Please select a logo to upload.';
      setValidationError(message);
      return;
    }
    clearError();
    const result = await uploadLogo(validationResult.data);

    if (result.success) {
      onSuccess?.(result);
      onClose();
      return;
    }

    onError?.(result.error);
  };

  const handleDelete = async () => {
    clearError();
    const result = await deleteLogo();

    if (result.success) {
      setConfirmDeleteOpen(false);
      onSuccess?.(result);
      onClose();
      return;
    }

    onError?.(result.error);
  };

  useEffect(() => {
    setLogoPreviewError(false);
  }, [logoPreview]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Account Logo</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {combinedError && (
            <Alert
              severity="error"
              onClose={() => {
                setValidationError(null);
                clearError();
              }}
            >
              {combinedError}
            </Alert>
          )}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Account Logo
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: LOGO_WIDTH / 2,
                  height: LOGO_HEIGHT / 2,
                  bgcolor: 'grey.300',
                  borderRadius: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {logoPreview && !logoPreviewError ? (
                  <Image
                    src={logoPreview}
                    alt="Account logo preview"
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                    onError={() => setLogoPreviewError(true)}
                  />
                ) : (
                  <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                    No Logo
                  </Typography>
                )}
              </Box>
              <Button
                variant="text"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={uploading || deleting}
              >
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </Button>
              {accountLogoUrl && (
                <Button
                  variant="text"
                  color="error"
                  startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={uploading || deleting}
                ></Button>
              )}
            </Box>
            <Typography variant="caption" color="textSecondary">
              Recommended size: {LOGO_WIDTH}x{LOGO_HEIGHT} pixels. Max file size: 10MB.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading || deleting}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={uploading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={uploading || deleting || !logoFile}
        >
          {uploading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Logo</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the account logo? This action is permanent and cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default EditAccountLogoDialog;
