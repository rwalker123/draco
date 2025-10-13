import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Save as SaveIcon } from '@mui/icons-material';
import Image from 'next/image';
import { getLogoSize, validateLogoFile } from '../config/teams';
import { TeamSeasonType } from '@draco/shared-schemas';
import {
  useTeamManagement,
  type UpdateTeamMetadataResult,
} from '../hooks/useTeamManagement';

interface EditTeamDialogProps {
  open: boolean;
  accountId: string;
  seasonId: string;
  teamSeason: TeamSeasonType | null;
  onClose: () => void;
  onSuccess?: (result: UpdateTeamMetadataResult) => void;
  onError?: (error: string) => void;
}

const EditTeamDialog: React.FC<EditTeamDialogProps> = ({
  open,
  accountId,
  seasonId,
  teamSeason,
  onClose,
  onSuccess,
  onError,
}) => {
  const LOGO_SIZE = getLogoSize();
  const [editingTeamName, setEditingTeamName] = useState<string>('');
  const [editingLogoFile, setEditingLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editDialogError, setEditDialogError] = useState<string | null>(null);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const { updateTeamMetadata, loading, error, clearError } = useTeamManagement({
    accountId,
    seasonId,
  });

  useEffect(() => {
    if (teamSeason) {
      setEditingTeamName(teamSeason.name || '');
      setLogoPreview(teamSeason.team.logoUrl || null);
      setEditingLogoFile(null);
      setEditDialogError(null);
      setLogoPreviewError(false);
    } else {
      setEditingTeamName('');
      setLogoPreview(null);
      setEditingLogoFile(null);
      setEditDialogError(null);
      setLogoPreviewError(false);
    }
    clearError();
  }, [teamSeason, open, clearError]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = validateLogoFile(file);
      if (validationError) {
        setEditDialogError(validationError);
        return;
      }
      setEditingLogoFile(file);
      setEditDialogError(null);
      clearError();
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!teamSeason) {
      return;
    }

    const trimmedName = editingTeamName.trim();
    if (!trimmedName) {
      setEditDialogError('Team name is required');
      return;
    }

    setEditDialogError(null);
    clearError();

    try {
      const result = await updateTeamMetadata({
        teamSeasonId: teamSeason.id,
        name: trimmedName,
        logoFile: editingLogoFile,
      });
      onSuccess?.(result);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update team';
      if (message === 'Team name is required') {
        setEditDialogError(message);
      }
      onError?.(message);
    }
  };

  const handleCancel = () => {
    setEditDialogError(null);
    clearError();
    onClose();
  };

  useEffect(() => {
    setLogoPreviewError(false);
  }, [logoPreview]);

  const displayedError = editDialogError ?? error;

  if (!teamSeason) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Team</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {displayedError && (
            <Alert
              severity="error"
              onClose={() => {
                setEditDialogError(null);
                clearError();
              }}
            >
              {displayedError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Team Name"
            value={editingTeamName}
            onChange={(e) => {
              setEditingTeamName(e.target.value);
              if (editDialogError) {
                setEditDialogError(null);
              }
              if (error) {
                clearError();
              }
            }}
            disabled={loading}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Team Logo
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: LOGO_SIZE,
                  height: LOGO_SIZE,
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
                    alt={editingTeamName + ' logo preview'}
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                    onError={() => setLogoPreviewError(true)}
                  />
                ) : (
                  <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                    {editingTeamName ? editingTeamName.charAt(0).toUpperCase() : '?'}
                  </Typography>
                )}
              </Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
                disabled={loading}
              >
                Upload Logo
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </Button>
            </Box>
            <Typography variant="caption" color="textSecondary">
              Recommended size: {LOGO_SIZE}x{LOGO_SIZE} pixels. Max file size: 10MB.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTeamDialog;
