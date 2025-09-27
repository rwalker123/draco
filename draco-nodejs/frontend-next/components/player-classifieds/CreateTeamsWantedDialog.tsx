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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formatPhoneNumber } from '../../utils/phoneNumber';
import { isValidEmailFormat } from '../../utils/emailValidation';
import { UpsertTeamsWantedClassifiedType } from '@draco/shared-schemas';

interface CreateTeamsWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpsertTeamsWantedClassifiedType) => Promise<void>;
  loading?: boolean;
  editMode?: boolean;
  initialData?: UpsertTeamsWantedClassifiedType | null;
  _classifiedId?: string;
}

// Available positions for teams wanted - using IDs that match backend validation
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

// Experience level is now a free-form text input

const CreateTeamsWantedDialog: React.FC<CreateTeamsWantedDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  editMode = false,
  initialData,
  _classifiedId,
}) => {
  // Form state
  const [formData, setFormData] = useState<UpsertTeamsWantedClassifiedType>(
    initialData || {
      name: '',
      email: '',
      phone: '',
      experience: '',
      positionsPlayed: '',
      birthDate: '',
    },
  );

  const selectedPositions = React.useMemo(() => {
    return formData.positionsPlayed
      ? formData.positionsPlayed
          .split(',')
          .map((position) => position.trim())
          .filter((position) => position.length > 0)
      : [];
  }, [formData.positionsPlayed]);

  // Form validation errors
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpsertTeamsWantedClassifiedType, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Update form data when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Handle form field changes
  const handleFieldChange = (
    field: keyof UpsertTeamsWantedClassifiedType,
    value: string | Date | string[] | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle positions selection
  const handlePositionsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const nextSelected = (typeof value === 'string' ? value.split(',') : value).slice(0, 3);

    setFormData((prev) => ({
      ...prev,
      positionsPlayed: nextSelected.join(','),
    }));

    if (errors.positionsPlayed) {
      setErrors((prev) => ({ ...prev, positionsPlayed: undefined }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpsertTeamsWantedClassifiedType, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmailFormat(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.experience.trim()) {
      newErrors.experience = 'Experience level is required';
    } else if (formData.experience.trim().length < 2) {
      newErrors.experience = 'Experience level must be at least 2 characters';
    } else if (formData.experience.trim().length > 255) {
      newErrors.experience = 'Experience level must be 255 characters or less';
    }

    if (selectedPositions.length === 0) {
      newErrors.positionsPlayed = 'Please select at least one position';
    } else if (selectedPositions.length > 3) {
      newErrors.positionsPlayed = 'Please select no more than 3 positions';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    } else {
      const today = new Date();
      const birthDate = new Date(formData.birthDate);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (age < 13 || (age === 13 && monthDiff < 0)) {
        newErrors.birthDate = 'You must be at least 13 years old';
      }
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
      await onSubmit(formData);
      // Close dialog immediately on success
      handleClose();
    } catch (error) {
      // The service layer now handles parsing detailed server errors
      setSubmitError(
        error instanceof Error
          ? error.message
          : `Failed to ${editMode ? 'update' : 'create'} Teams Wanted ad`,
      );
    }
  };

  // Handle dialog close
  const handleClose = () => {
    // Reset form state to initial values or empty
    setFormData(
      initialData || {
        name: '',
        email: '',
        phone: '',
        experience: '',
        positionsPlayed: '',
        birthDate: '',
      },
    );
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editMode ? 'Edit Teams Wanted' : 'Post Teams Wanted'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DialogContent>
            {/* Error Alert */}
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            {/* Name Field */}
            <TextField
              fullWidth
              margin="dense"
              label="Full Name"
              value={formData.name}
              onChange={(e) => {
                // Sanitize input: remove potentially dangerous characters
                const sanitizedValue = e.target.value
                  .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
                  .replace(/javascript:/gi, '') // Remove javascript: protocol
                  .replace(/on\w+=/gi, ''); // Remove event handlers
                handleFieldChange('name', sanitizedValue);
              }}
              error={!!errors.name}
              helperText={errors.name}
              required
              sx={{ mb: 2 }}
            />

            {/* Contact Fields */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                mb: 2,
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                />
              </Box>
              <Box sx={{ width: { xs: '100%', md: 220 } }}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const digitsOnly = rawValue.replace(/\D/g, '');

                    // Limit to 10 digits maximum
                    if (digitsOnly.length > 10) {
                      return;
                    }

                    // Only format if it looks like a complete phone number (10 digits)
                    const formattedValue =
                      digitsOnly.length === 10 ? formatPhoneNumber(digitsOnly) : digitsOnly;
                    handleFieldChange('phone', formattedValue);
                  }}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  required
                />
              </Box>
            </Box>

            {/* Experience Level */}
            <TextField
              fullWidth
              margin="dense"
              label="Experience Level"
              multiline
              rows={4}
              value={formData.experience}
              onChange={(e) => handleFieldChange('experience', e.target.value)}
              error={!!errors.experience}
              helperText={
                errors.experience || `${255 - formData.experience.length} characters remaining`
              }
              placeholder="Describe your baseball experience in detail...
Examples: 
• 5 years playing recreational softball in local league
• 2 years competitive baseball, primarily shortstop and second base  
• High school varsity team experience, all-state recognition
• Coached youth teams for 3 years"
              required
              inputProps={{ maxLength: 255 }}
              sx={{ mb: 2 }}
            />

            {/* Positions Played */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                mb: 2,
              }}
            >
              <FormControl
                fullWidth
                margin="dense"
                error={!!errors.positionsPlayed}
                sx={{ flexGrow: 1 }}
              >
                <InputLabel id="positions-played-label">Positions Played</InputLabel>
                <Select
                  labelId="positions-played-label"
                  id="positions-played-select"
                  multiple
                  value={selectedPositions}
                  onChange={handlePositionsChange}
                  input={<OutlinedInput label="Positions Played" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(Array.isArray(selected) ? selected : [])
                        .map((value) => value as string)
                        .map((value) => (
                          <Chip key={value} label={POSITION_LABELS[value] || value} size="small" />
                        ))}
                    </Box>
                  )}
                  required
                >
                  {AVAILABLE_POSITIONS.map((position) => (
                    <MenuItem
                      key={position}
                      value={position}
                      disabled={
                        selectedPositions.length >= 3 && !selectedPositions.includes(position)
                      }
                    >
                      {POSITION_LABELS[position] || position}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText error={!!errors.positionsPlayed}>
                  {errors.positionsPlayed || `${selectedPositions.length}/3 positions selected`}
                </FormHelperText>
              </FormControl>
              <Box sx={{ width: { xs: '100%', md: 220 } }}>
                <DatePicker
                  label="Birth Date"
                  value={formData.birthDate ? new Date(formData.birthDate) : null}
                  onChange={(date) => handleFieldChange('birthDate', date || null)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'dense',
                      error: !!errors.birthDate,
                      helperText: errors.birthDate,
                      required: true,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Help Text */}
            {!editMode && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Alert severity="info" icon={false}>
                  <strong>Important:</strong> After submitting, you&apos;ll receive an access code
                  via email. Keep this code safe - you&apos;ll need it to edit or delete your ad
                  later.
                </Alert>
              </Box>
            )}
          </DialogContent>
        </LocalizationProvider>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading
              ? editMode
                ? 'Updating...'
                : 'Creating...'
              : editMode
                ? 'Update Teams Wanted'
                : 'Post Teams Wanted'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTeamsWantedDialog;
