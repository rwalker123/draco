'use client';

import React, { useState } from 'react';
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
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getLogoSize, validateLogoFile } from '../config/teams';
import { TeamSeasonType, nameSchema } from '@draco/shared-schemas';
import { useTeamManagement, type UpdateTeamMetadataResult } from '../hooks/useTeamManagement';

const TeamMetadataFormSchema = z.object({
  name: nameSchema.min(1, 'Team name is required'),
});

type TeamMetadataFormValues = z.infer<typeof TeamMetadataFormSchema>;

interface EditTeamDialogProps {
  open: boolean;
  accountId: string;
  seasonId: string;
  teamSeason: TeamSeasonType | null;
  onClose: () => void;
  onSuccess?: (result: UpdateTeamMetadataResult) => void;
  onError?: (error: string) => void;
}

const EditTeamDialog: React.FC<EditTeamDialogProps> = ({ open, teamSeason, ...rest }) => {
  if (!open || !teamSeason) {
    return null;
  }

  const dialogKey = `${teamSeason.id}-${teamSeason.team.logoUrl ?? 'no-logo'}`;

  return <EditTeamDialogInner key={dialogKey} teamSeason={teamSeason} {...rest} />;
};

interface EditTeamDialogInnerProps extends Omit<EditTeamDialogProps, 'open' | 'teamSeason'> {
  teamSeason: TeamSeasonType;
}

const EditTeamDialogInner: React.FC<EditTeamDialogInnerProps> = ({
  accountId,
  seasonId,
  teamSeason,
  onClose,
  onSuccess,
  onError,
}) => {
  const LOGO_SIZE = getLogoSize();
  const initialName = teamSeason.name ?? '';
  const initialLogoUrl = teamSeason.team.logoUrl ?? null;
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const { updateTeamMetadata, loading, error, clearError } = useTeamManagement({
    accountId,
    seasonId,
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamMetadataFormValues>({
    resolver: zodResolver(TeamMetadataFormSchema),
    defaultValues: { name: initialName },
  });

  const watchedName = useWatch({
    control,
    name: 'name',
    defaultValue: initialName,
  });
  const isBusy = loading || isSubmitting;

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      setLogoPreviewError(false);
      setLogoError(null);
      setLogoFile(file);
      clearError();

      const validationError = validateLogoFile(file);
      if (validationError) {
        setLogoError(validationError);
        setLogoFile(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview(initialLogoUrl);
      setLogoPreviewError(false);
      setLogoError(null);
      clearError();
    }
  };

  const handleFormSubmit = handleSubmit(async (values) => {
    clearError();

    try {
      const result = await updateTeamMetadata({
        teamSeasonId: teamSeason.id,
        name: values.name.trim(),
        logoFile: logoFile ?? undefined,
      });
      reset(
        {
          name: result.teamSeason.name ?? '',
        },
        { keepErrors: false, keepDirty: false, keepTouched: false },
      );
      setLogoFile(null);
      setLogoError(null);
      onSuccess?.(result);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update team';
      onError?.(message);
    }
  });

  const handleCancel = () => {
    reset(
      {
        name: initialName,
      },
      { keepErrors: false, keepDirty: false, keepTouched: false },
    );
    setLogoPreview(initialLogoUrl);
    setLogoPreviewError(false);
    setLogoFile(null);
    setLogoError(null);
    clearError();
    onClose();
  };

  const displayedError = error;

  const fallbackInitial =
    watchedName?.trim().charAt(0).toUpperCase() ||
    teamSeason.name?.trim().charAt(0).toUpperCase() ||
    '?';

  return (
    <Dialog open onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Team</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {displayedError && (
            <Alert
              severity="error"
              onClose={() => {
                clearError();
              }}
            >
              {displayedError}
            </Alert>
          )}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Team Name"
                disabled={isBusy}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                onChange={(event) => {
                  field.onChange(event);
                  if (error) {
                    clearError();
                  }
                }}
              />
            )}
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
                    alt={`${watchedName || teamSeason.name || 'Team'} logo preview`}
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                    onError={() => setLogoPreviewError(true)}
                  />
                ) : (
                  <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                    {fallbackInitial}
                  </Typography>
                )}
              </Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
                disabled={isBusy}
              >
                Upload Logo
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </Button>
            </Box>
            {logoError && (
              <Typography variant="caption" color="error">
                {logoError}
              </Typography>
            )}
            <Typography variant="caption" color="textSecondary">
              Recommended size: {LOGO_SIZE}x{LOGO_SIZE} pixels. Max file size: 10MB.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isBusy}>
          Cancel
        </Button>
        <Button
          onClick={handleFormSubmit}
          variant="contained"
          startIcon={isBusy ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={isBusy}
        >
          {isBusy ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTeamDialog;
