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
import { PLAYER_CLASSIFIED_VALIDATION } from '../../utils/characterValidation';
import CharacterCounter from '../common/CharacterCounter';

// Use shared validation constants
const VALIDATION_CONSTANTS = PLAYER_CLASSIFIED_VALIDATION.PLAYERS_WANTED;

interface CreatePlayersWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IPlayersWantedFormState) => Promise<void>;
  loading?: boolean;
  editMode?: boolean;
  initialData?: IPlayersWantedFormState;
}

// Available positions for players wanted - using IDs that match backend validation
const AVAILABLE_POSITIONS = [
  'any',
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
  any: 'Any Position',
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
  editMode = false,
  initialData,
}) => {
  // Authentication check
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Form state
  const [formData, setFormData] = useState<IPlayersWantedFormState>(
    initialData || {
      teamEventName: '',
      description: '',
      positionsNeeded: [],
    },
  );

  // Form validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof IPlayersWantedFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Update form data when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

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
    const selectedPositions = typeof value === 'string' ? value.split(',') : value;

    // Limit to maximum of 3 positions
    const limitedPositions = selectedPositions.slice(0, 3);

    setFormData((prev) => ({
      ...prev,
      positionsNeeded: limitedPositions,
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
    } else if (
      formData.teamEventName.trim().length < VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MIN_LENGTH
    ) {
      newErrors.teamEventName = `Team/Event name must be at least ${VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MIN_LENGTH} characters`;
    } else if (
      formData.teamEventName.trim().length > VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MAX_LENGTH
    ) {
      newErrors.teamEventName = `Team/Event name must not exceed ${VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MAX_LENGTH} characters`;
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < VALIDATION_CONSTANTS.DESCRIPTION.MIN_LENGTH) {
      newErrors.description = `Description must be at least ${VALIDATION_CONSTANTS.DESCRIPTION.MIN_LENGTH} characters`;
    } else if (formData.description.trim().length > VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH) {
      newErrors.description = `Description must not exceed ${VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH} characters`;
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
      setSubmitError(
        error instanceof Error
          ? error.message
          : `Failed to ${editMode ? 'update' : 'create'} Players Wanted ad`,
      );
    }
  };

  // Handle dialog close
  const handleClose = () => {
    // Reset form state to initial values or empty
    setFormData(
      initialData || {
        teamEventName: '',
        description: '',
        positionsNeeded: [],
      },
    );
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editMode ? 'Edit Players Wanted' : 'Post Players Wanted'}</DialogTitle>
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
            <Box>
              <TextField
                label="Team/Event Name"
                value={formData.teamEventName}
                onChange={(e) => handleFieldChange('teamEventName', e.target.value)}
                error={!!errors.teamEventName}
                helperText={errors.teamEventName || 'Name of your team or event'}
                required
                fullWidth
                disabled={loading || !isAuthenticated}
                slotProps={{
                  htmlInput: {
                    maxLength: VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MAX_LENGTH,
                  },
                }}
              />
              <CharacterCounter
                currentLength={formData.teamEventName.length}
                maxLength={VALIDATION_CONSTANTS.TEAM_EVENT_NAME.MAX_LENGTH}
              />
            </Box>

            {/* Description */}
            <Box>
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
                fullWidth
                multiline
                rows={4}
                disabled={loading || !isAuthenticated}
                slotProps={{
                  htmlInput: {
                    maxLength: VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH,
                  },
                }}
              />
              <CharacterCounter
                currentLength={formData.description.length}
                maxLength={VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH}
              />
            </Box>

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
                  <MenuItem
                    key={position}
                    value={position}
                    disabled={
                      formData.positionsNeeded.length >= 3 &&
                      !formData.positionsNeeded.includes(position)
                    }
                  >
                    {POSITION_LABELS[position]}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {errors.positionsNeeded ||
                  'Select up to 3 positions you need players for (select "Any Position" if flexible)'}
              </FormHelperText>
            </FormControl>

            {/* Information Notice */}
            <Alert severity="info">
              Your Players Wanted ad will be visible to all visitors of the site for 45 days.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading || !isAuthenticated}>
            {loading
              ? editMode
                ? 'Updating...'
                : 'Creating...'
              : editMode
                ? 'Update Ad'
                : 'Create Ad'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreatePlayersWantedDialog;
