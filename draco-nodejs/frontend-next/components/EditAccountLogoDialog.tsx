import React, { useState, useEffect } from 'react';
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
import { uploadAccountLogo, deleteAccountLogo } from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';

const LOGO_WIDTH = 512;
const LOGO_HEIGHT = 125;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface EditAccountLogoDialogProps {
  open: boolean;
  accountId: string;
  accountLogoUrl?: string | null;
  onClose: () => void;
  onLogoUpdated: () => void;
}

const validateLogoFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'File must be an image.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 10MB.';
  }
  return null;
};

const EditAccountLogoDialog: React.FC<EditAccountLogoDialogProps> = ({
  open,
  accountId,
  accountLogoUrl,
  onClose,
  onLogoUpdated,
}) => {
  const apiClient = useApiClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setLogoFile(null);
      setLogoPreview(accountLogoUrl ? addCacheBuster(accountLogoUrl) : null);
      setError(null);
      setLogoPreviewError(false);
    }
  }, [open, accountLogoUrl]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = validateLogoFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setLogoFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!logoFile) {
      setError('Please select a logo to upload.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await uploadAccountLogo({
        client: apiClient,
        path: { accountId },
        body: { logo: logoFile },
        throwOnError: false,
        headers: { 'Content-Type': null },
        ...formDataBodySerializer,
      });

      if (result.error) {
        const message =
          typeof result.error === 'object' && result.error && 'message' in result.error
            ? String((result.error as { message?: unknown }).message ?? '')
            : '';
        throw new Error(message || 'Failed to upload logo');
      }
      setLogoPreview(accountLogoUrl ? addCacheBuster(accountLogoUrl) : null);
      onLogoUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteAccountLogo({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      if (result.error) {
        throw new Error('Failed to delete logo');
      }
      setLogoPreview(accountLogoUrl ? addCacheBuster(accountLogoUrl) : null);
      onLogoUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete logo');
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  useEffect(() => {
    setLogoPreviewError(false);
  }, [logoPreview]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Account Logo</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
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
                disabled={saving || deleting}
              >
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </Button>
              {accountLogoUrl && (
                <Button
                  variant="text"
                  color="error"
                  startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={saving || deleting}
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
        <Button onClick={onClose} disabled={saving || deleting}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={saving || deleting || !logoFile}
        >
          {saving ? 'Saving...' : 'Save Changes'}
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
