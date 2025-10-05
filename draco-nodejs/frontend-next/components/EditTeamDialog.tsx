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

interface EditTeamDialogProps {
  open: boolean;
  teamSeason: TeamSeasonType | null;
  onClose: () => void;
  onSave: (updatedName: string, logoFile: File | null) => Promise<void>;
}

const EditTeamDialog: React.FC<EditTeamDialogProps> = ({ open, teamSeason, onClose, onSave }) => {
  const LOGO_SIZE = getLogoSize();
  const [editingTeamName, setEditingTeamName] = useState<string>('');
  const [editingLogoFile, setEditingLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editDialogError, setEditDialogError] = useState<string | null>(null);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [saving, setSaving] = useState(false);

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
  }, [teamSeason, open]);

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
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editingTeamName.trim()) {
      setEditDialogError('Team name is required');
      return;
    }
    setSaving(true);
    setEditDialogError(null);
    try {
      await onSave(editingTeamName.trim(), editingLogoFile);
      onClose();
    } catch (err) {
      setEditDialogError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  useEffect(() => {
    setLogoPreviewError(false);
  }, [logoPreview]);

  if (!teamSeason) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Team</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {editDialogError && (
            <Alert severity="error" onClose={() => setEditDialogError(null)}>
              {editDialogError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Team Name"
            value={editingTeamName}
            onChange={(e) => setEditingTeamName(e.target.value)}
            disabled={saving}
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
                disabled={saving}
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
        <Button onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTeamDialog;
