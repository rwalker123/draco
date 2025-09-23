'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SponsorType } from '@draco/shared-schemas';
import {
  SponsorFormValues,
  SponsorScope,
  useSponsorOperations,
} from '../../hooks/useSponsorOperations';

interface SponsorFormDialogProps {
  open: boolean;
  onClose: () => void;
  context: SponsorScope;
  mode: 'create' | 'edit';
  initialSponsor?: SponsorType | null;
  onSuccess?: (result: { sponsor: SponsorType; message: string }) => void;
  onError?: (message: string) => void;
}

const defaultValues: SponsorFormValues = {
  name: '',
  streetAddress: '',
  cityStateZip: '',
  description: '',
  email: '',
  phone: '',
  fax: '',
  website: '',
  photo: null,
};

const SponsorFormDialog: React.FC<SponsorFormDialogProps> = ({
  open,
  onClose,
  context,
  mode,
  initialSponsor,
  onSuccess,
  onError,
}) => {
  const operations = useSponsorOperations(context);
  const [formValues, setFormValues] = React.useState<SponsorFormValues>(defaultValues);
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setFormValues(defaultValues);
      setLocalError(null);
      operations.clearError();
      return;
    }

    if (mode === 'edit' && initialSponsor) {
      setFormValues({
        name: initialSponsor.name,
        streetAddress: initialSponsor.streetAddress ?? '',
        cityStateZip: initialSponsor.cityStateZip ?? '',
        description: initialSponsor.description ?? '',
        email: initialSponsor.email ?? '',
        phone: initialSponsor.phone ?? '',
        fax: initialSponsor.fax ?? '',
        website: initialSponsor.website ?? '',
        photo: null,
      });
    } else {
      setFormValues(defaultValues);
    }
    setLocalError(null);
    operations.clearError();
  }, [open, mode, initialSponsor, operations]);

  const handleChange =
    (field: keyof SponsorFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      if (field === 'photo') {
        setFormValues((prev) => ({
          ...prev,
          photo: event.target.files && event.target.files.length > 0 ? event.target.files[0] : null,
        }));
        return;
      }

      const { value } = event.target;
      setFormValues((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValues.name.trim()) {
      setLocalError('Sponsor name is required');
      return;
    }

    try {
      setLocalError(null);
      operations.clearError();

      const sponsor =
        mode === 'create'
          ? await operations.createSponsor(formValues)
          : await operations.updateSponsor(initialSponsor!.id, formValues);

      onSuccess?.({
        sponsor,
        message:
          mode === 'create' ? 'Sponsor created successfully' : 'Sponsor updated successfully',
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save sponsor';
      setLocalError(message);
      onError?.(message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? 'Add Sponsor' : 'Edit Sponsor'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {(localError || operations.error) && (
              <Alert severity="error" onClose={() => setLocalError(null)}>
                {localError || operations.error}
              </Alert>
            )}
            <TextField
              label="Name"
              value={formValues.name}
              onChange={handleChange('name')}
              required
              fullWidth
            />
            <TextField
              label="Street Address"
              value={formValues.streetAddress}
              onChange={handleChange('streetAddress')}
              fullWidth
            />
            <TextField
              label="City, State, ZIP"
              value={formValues.cityStateZip}
              onChange={handleChange('cityStateZip')}
              fullWidth
            />
            <TextField
              label="Description"
              value={formValues.description}
              onChange={handleChange('description')}
              fullWidth
              multiline
              minRows={3}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Email"
                value={formValues.email}
                onChange={handleChange('email')}
                type="email"
                fullWidth
              />
              <TextField
                label="Phone"
                value={formValues.phone}
                onChange={handleChange('phone')}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Fax"
                value={formValues.fax}
                onChange={handleChange('fax')}
                fullWidth
              />
              <TextField
                label="Website"
                value={formValues.website}
                onChange={handleChange('website')}
                fullWidth
              />
            </Stack>
            <Button variant="outlined" component="label">
              {formValues.photo ? 'Change Photo' : 'Upload Photo'}
              <input hidden type="file" accept="image/*" onChange={handleChange('photo')} />
            </Button>
            {mode === 'edit' && initialSponsor?.photoUrl && !formValues.photo && (
              <Typography variant="caption" color="text.secondary">
                Current photo will be retained unless a new file is uploaded.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={operations.loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={operations.loading}>
            {operations.loading ? (
              <CircularProgress size={20} />
            ) : mode === 'create' ? (
              'Create Sponsor'
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default SponsorFormDialog;
