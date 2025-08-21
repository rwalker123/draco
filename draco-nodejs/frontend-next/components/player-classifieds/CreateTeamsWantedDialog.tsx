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
import { ITeamsWantedFormState } from '../../types/playerClassifieds';
import { formatPhoneNumber } from '../../utils/contactUtils';
import { isValidEmailFormat } from '../../utils/emailValidation';
import { validatePhoneNumber } from '../../utils/contactValidation';

interface CreateTeamsWantedDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ITeamsWantedFormState) => Promise<void>;
  loading?: boolean;
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

// Experience levels - using IDs that match backend validation
const EXPERIENCE_LEVELS = [
  'beginner',
  'beginner-plus',
  'intermediate',
  'intermediate-plus',
  'advanced',
  'expert',
];

const CreateTeamsWantedDialog: React.FC<CreateTeamsWantedDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
}) => {
  // Form state
  const [formData, setFormData] = useState<ITeamsWantedFormState>({
    name: '',
    email: '',
    phone: '',
    experience: '',
    positionsPlayed: [],
    birthDate: null,
  });

  // Form validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof ITeamsWantedFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle form field changes
  const handleFieldChange = (
    field: keyof ITeamsWantedFormState,
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
    setFormData((prev) => ({
      ...prev,
      positionsPlayed: typeof value === 'string' ? value.split(',') : value,
    }));

    if (errors.positionsPlayed) {
      setErrors((prev) => ({ ...prev, positionsPlayed: undefined }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ITeamsWantedFormState, string>> = {};

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
    } else {
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.message || 'Please enter a valid phone number';
      }
    }

    if (!formData.experience) {
      newErrors.experience = 'Experience level is required';
    }

    if (formData.positionsPlayed.length === 0) {
      newErrors.positionsPlayed = 'Please select at least one position';
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
      handleClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create Teams Wanted ad');
    }
  };

  // Handle dialog close
  const handleClose = () => {
    // Reset form state
    setFormData({
      name: '',
      email: '',
      phone: '',
      experience: '',
      positionsPlayed: [],
      birthDate: null,
    });
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Post Teams Wanted</DialogTitle>
      <form onSubmit={handleSubmit}>
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

          {/* Email Field */}
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
            sx={{ mb: 2 }}
          />

          {/* Phone Field */}
          <TextField
            fullWidth
            margin="dense"
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => {
              const rawValue = e.target.value;
              // Only format if it looks like a complete phone number (10+ digits)
              const formattedValue =
                rawValue.replace(/\D/g, '').length >= 10 ? formatPhoneNumber(rawValue) : rawValue;
              handleFieldChange('phone', formattedValue);
            }}
            error={!!errors.phone}
            helperText={errors.phone}
            required
            sx={{ mb: 2 }}
          />

          {/* Experience Level */}
          <FormControl fullWidth margin="dense" error={!!errors.experience} sx={{ mb: 2 }}>
            <InputLabel id="experience-level-label">Experience Level</InputLabel>
            <Select
              labelId="experience-level-label"
              id="experience-level-select"
              value={formData.experience}
              onChange={(e) => handleFieldChange('experience', e.target.value)}
              label="Experience Level"
              required
            >
              {EXPERIENCE_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>
                  {level === 'beginner' && 'Beginner'}
                  {level === 'beginner-plus' && 'Beginner+'}
                  {level === 'intermediate' && 'Intermediate'}
                  {level === 'intermediate-plus' && 'Intermediate+'}
                  {level === 'advanced' && 'Advanced'}
                  {level === 'expert' && 'Expert'}
                </MenuItem>
              ))}
            </Select>
            {errors.experience && <FormHelperText>{errors.experience}</FormHelperText>}
          </FormControl>

          {/* Positions Played */}
          <FormControl fullWidth margin="dense" error={!!errors.positionsPlayed} sx={{ mb: 2 }}>
            <InputLabel id="positions-played-label">Positions Played</InputLabel>
            <Select
              labelId="positions-played-label"
              id="positions-played-select"
              multiple
              value={formData.positionsPlayed}
              onChange={handlePositionsChange}
              input={<OutlinedInput label="Positions Played" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              required
            >
              {AVAILABLE_POSITIONS.map((position) => (
                <MenuItem key={position} value={position}>
                  {position === 'pitcher' && 'Pitcher'}
                  {position === 'catcher' && 'Catcher'}
                  {position === 'first-base' && 'First Base'}
                  {position === 'second-base' && 'Second Base'}
                  {position === 'third-base' && 'Third Base'}
                  {position === 'shortstop' && 'Shortstop'}
                  {position === 'left-field' && 'Left Field'}
                  {position === 'center-field' && 'Center Field'}
                  {position === 'right-field' && 'Right Field'}
                  {position === 'utility' && 'Utility'}
                  {position === 'designated-hitter' && 'Designated Hitter'}
                </MenuItem>
              ))}
            </Select>
            {errors.positionsPlayed && <FormHelperText>{errors.positionsPlayed}</FormHelperText>}
          </FormControl>

          {/* Birth Date */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Birth Date"
              value={formData.birthDate}
              onChange={(date) => handleFieldChange('birthDate', date || null)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'dense',
                  error: !!errors.birthDate,
                  helperText: errors.birthDate,
                  required: true,
                  sx: { mb: 2 },
                },
              }}
            />
          </LocalizationProvider>

          {/* Help Text */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Alert severity="info" icon={false}>
              <strong>Important:</strong> After submitting, you&apos;ll receive an access code via
              email. Keep this code safe - you&apos;ll need it to edit or delete your ad later.
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Post Teams Wanted'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTeamsWantedDialog;
