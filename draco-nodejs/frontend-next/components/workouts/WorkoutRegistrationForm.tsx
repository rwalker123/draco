'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  MenuItem,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  UpsertWorkoutRegistrationType,
  WorkoutRegistrationType,
  WorkoutSourcesType,
} from '@draco/shared-schemas';
import { getSources } from '../../services/workoutService';
import { formatPhoneNumber } from '../../utils/phoneNumber';
import { getApiErrorMessage } from '../../utils/apiResult';

interface WorkoutRegistrationFormProps {
  accountId: string;
  workoutId: string;
  registration?: WorkoutRegistrationType | null;
  onSubmit: (data: UpsertWorkoutRegistrationType) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const WorkoutRegistrationForm: React.FC<WorkoutRegistrationFormProps> = ({
  accountId,
  workoutId: _workoutId, // Prefix with underscore to indicate it's intentionally unused
  registration,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<WorkoutRegistrationType>({
    id: '',
    workoutId: '',
    name: '',
    email: '',
    age: 0,
    phone1: '',
    phone2: '',
    phone3: '',
    phone4: '',
    positions: '',
    isManager: false,
    whereHeard: '',
    dateRegistered: '',
  });

  const [sources, setSources] = useState<WorkoutSourcesType>({ options: [] });
  const [loadingSources, setLoadingSources] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!registration;

  useEffect(() => {
    if (registration) {
      setFormData({
        id: registration.id,
        workoutId: registration.workoutId,
        name: registration.name,
        email: registration.email,
        age: registration.age,
        phone1: registration.phone1 || '',
        phone2: registration.phone2 || '',
        phone3: registration.phone3 || '',
        phone4: registration.phone4 || '',
        positions: registration.positions,
        isManager: registration.isManager,
        whereHeard: registration.whereHeard,
        dateRegistered: registration.dateRegistered,
      });
    }
  }, [registration]);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoadingSources(true);
        const sourcesData = await getSources(accountId);
        setSources(sourcesData);
      } catch (err) {
        console.error('Error fetching sources:', err);
        setError('Failed to load "where heard" options');
      } finally {
        setLoadingSources(false);
      }
    };

    fetchSources();
  }, [accountId]);

  const handleTextChange = useCallback(
    (field: keyof UpsertWorkoutRegistrationType) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
          ...prev,
          [field]: event.target.value,
        }));
      },
    [],
  );

  const handleNumberChange = useCallback(
    (field: keyof UpsertWorkoutRegistrationType) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value) || 0;
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      },
    [],
  );

  const handleCheckboxChange = useCallback(
    (field: keyof UpsertWorkoutRegistrationType) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
          ...prev,
          [field]: event.target.checked,
        }));
      },
    [],
  );

  const handlePhoneChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Only format if it looks like a complete phone number
    const formattedValue = value.length >= 10 ? formatPhoneNumber(value) : value;

    setFormData((prev) => ({
      ...prev,
      phone1: formattedValue,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (formData.age <= 0) {
      setError('Age must be greater than 0');
      return;
    }
    if (!formData.positions.trim()) {
      setError('Positions are required');
      return;
    }
    if (!formData.whereHeard.trim()) {
      setError('Where heard is required');
      return;
    }

    const payload: UpsertWorkoutRegistrationType = {
      name: formData.name,
      email: formData.email,
      age: formData.age,
      phone1: formData.phone1,
      phone2: formData.phone2,
      phone3: formData.phone3,
      phone4: formData.phone4,
      positions: formData.positions,
      isManager: formData.isManager,
      whereHeard: formData.whereHeard,
    };

    try {
      await onSubmit(payload);
    } catch (submitError) {
      const message = getApiErrorMessage(
        submitError,
        'Failed to save registration',
      );
      setError(message);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isEditMode ? 'Edit Registration' : 'Add New Registration'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 2,
          }}
        >
          {/* Name and Email */}
          <Box>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={handleTextChange('name')}
              required
              disabled={isLoading}
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleTextChange('email')}
              required
              disabled={isLoading}
            />
          </Box>

          {/* Age and Positions */}
          <Box>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={formData.age || ''}
              onChange={handleNumberChange('age')}
              required
              disabled={isLoading}
              inputProps={{ min: 1, max: 100 }}
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Positions"
              value={formData.positions}
              onChange={handleTextChange('positions')}
              required
              disabled={isLoading}
              placeholder="e.g., Pitcher, Outfield"
            />
          </Box>

          {/* Phone Number */}
          <Box>
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone1}
              onChange={handlePhoneChange}
              disabled={isLoading}
              placeholder="(555) 123-4567"
            />
          </Box>

          {/* Where Heard */}
          <Box>
            <TextField
              fullWidth
              select
              label="Where Heard"
              value={formData.whereHeard}
              onChange={handleTextChange('whereHeard')}
              required
              disabled={isLoading || loadingSources}
              helperText={
                loadingSources ? 'Loading options...' : 'Select where you heard about this workout'
              }
            >
              {sources.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Is Manager Toggle */}
          <Box>
            <FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isManager}
                    onChange={handleCheckboxChange('isManager')}
                    disabled={isLoading}
                  />
                }
                label="Open to Managing a Team"
              />
            </FormControl>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Saving...' : isEditMode ? 'Update Registration' : 'Add Registration'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};
