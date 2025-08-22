'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormHelperText,
  SelectChangeEvent,
} from '@mui/material';
import { IPlayersWantedFormState } from '../../types/playerClassifieds';
import { useAuth } from '../../context/AuthContext';

interface CreatePlayersWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IPlayersWantedFormState) => Promise<void>;
  loading?: boolean;
}

// Available positions for players wanted - using IDs that match backend validation
const AVAILABLE_POSITIONS = [
  'pitcher',
  'catcher',
  'first-base',
  'second-base',
  'third-base',
  'shortstop',
  'left-field',
  'center-field',
  'right-field',
  'utility',
  'designated-hitter',
];

// Position display names
const POSITION_LABELS: Record<string, string> = {
  pitcher: 'Pitcher',
  catcher: 'Catcher',
  'first-base': 'First Base',
  'second-base': 'Second Base',
  'third-base': 'Third Base',
  shortstop: 'Shortstop',
  'left-field': 'Left Field',
  'center-field': 'Center Field',
  'right-field': 'Right Field',
  utility: 'Utility',
  'designated-hitter': 'Designated Hitter',
};

const CreatePlayersWantedDialog: React.FC<CreatePlayersWantedDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
}) => {
  // Authentication check
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Form state
  const [formData, setFormData] = useState<IPlayersWantedFormState>({
    teamEventName: '',
    description: '',
    positionsNeeded: [],
  });

  // Form validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof IPlayersWantedFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle form field changes
  const handleFieldChange = (field: keyof IPlayersWantedFormState, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle positions selection
  const handlePositionsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      positionsNeeded: typeof value === 'string' ? value.split(',') : value,
    }));

    if (errors.positionsNeeded) {
      setErrors((prev) => ({ ...prev, positionsNeeded: undefined }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof IPlayersWantedFormState, string>> = {};

    if (!formData.teamEventName.trim()) {
      newErrors.teamEventName = 'Team/Event name is required';
    } else if (formData.teamEventName.trim().length < 3) {
      newErrors.teamEventName = 'Team/Event name must be at least 3 characters';
    } else if (formData.teamEventName.trim().length > 100) {
      newErrors.teamEventName = 'Team/Event name must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (formData.positionsNeeded.length === 0) {
      newErrors.positionsNeeded = 'Please select at least one position';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    try {
      // Trim whitespace from text fields before submitting
      const cleanedData: IPlayersWantedFormState = {
        teamEventName: formData.teamEventName.trim(),
        description: formData.description.trim(),
        positionsNeeded: formData.positionsNeeded,
      };

      await onSubmit(cleanedData);
      handleClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create Players Wanted ad');
    }
  };

  // Handle dialog close
  const handleClose = () => {
    // Reset form state
    setFormData({
      teamEventName: '',
      description: '',
      positionsNeeded: [],
    });
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Post Players Wanted</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Authentication Required Alert */}
            {!isAuthenticated && (
              <Alert severity="warning">
                You must be signed in and a member of this account to post Players Wanted ads.
              </Alert>
            )}

            {/* Submit Error Alert */}
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            {/* Team/Event Name */}
            <TextField
              label="Team/Event Name"
              value={formData.teamEventName}
              onChange={(e) => handleFieldChange('teamEventName', e.target.value)}
              error={!!errors.teamEventName}
              helperText={errors.teamEventName || 'Name of your team or event'}
              required
              disabled={loading || !isAuthenticated}
              inputProps={{ maxLength: 100 }}
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              error={!!errors.description}
              helperText={
                errors.description ||
                "Describe what kind of players you're looking for, league details, schedule, etc."
              }
              required
              multiline
              rows={4}
              disabled={loading || !isAuthenticated}
              inputProps={{ maxLength: 1000 }}
            />

            {/* Positions Needed */}
            <FormControl error={!!errors.positionsNeeded} disabled={loading || !isAuthenticated}>
              <InputLabel>Positions Needed</InputLabel>
              <Select
                multiple
                value={formData.positionsNeeded}
                onChange={handlePositionsChange}
                input={<OutlinedInput label="Positions Needed" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={POSITION_LABELS[value] || value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {AVAILABLE_POSITIONS.map((position) => (
                  <MenuItem key={position} value={position}>
                    {POSITION_LABELS[position]}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {errors.positionsNeeded || 'Select the positions you need players for'}
              </FormHelperText>
            </FormControl>

            {/* Information Notice */}
            <Alert severity="info">
              Your Players Wanted ad will be visible to all account members. Include clear details
              about your team, league, schedule, and any requirements to attract the right players.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading || !isAuthenticated}>
            {loading ? 'Creating...' : 'Create Ad'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreatePlayersWantedDialog;
