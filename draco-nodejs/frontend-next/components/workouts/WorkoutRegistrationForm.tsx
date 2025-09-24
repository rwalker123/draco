'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { WorkoutRegistrationDTO, WorkoutRegistration, WorkoutSources } from '../../types/workouts';
import { getSources } from '../../services/workoutService';
import { formatPhoneNumber } from '../../utils/phoneNumber';

interface WorkoutRegistrationFormProps {
  accountId: string;
  workoutId: string;
  registration?: WorkoutRegistration | null;
  onSubmit: (data: WorkoutRegistrationDTO) => Promise<void>;
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
  const [formData, setFormData] = useState<WorkoutRegistrationDTO>({
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
  });

  const [sources, setSources] = useState<WorkoutSources>({ options: [] });
  const [loadingSources, setLoadingSources] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!registration;

  useEffect(() => {
    if (registration) {
      setFormData({
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
    (field: keyof WorkoutRegistrationDTO) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    },
    [],
  );

  const handleNumberChange = useCallback(
    (field: keyof WorkoutRegistrationDTO) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value) || 0;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleCheckboxChange = useCallback(
    (field: keyof WorkoutRegistrationDTO) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.checked,
      }));
    },
    [],
  );

  const handlePhoneChange = useCallback(
    (field: 'phone1' | 'phone2' | 'phone3' | 'phone4') =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        // Only format if it looks like a complete phone number
        const formattedValue = value.length >= 10 ? formatPhoneNumber(value) : value;

        setFormData((prev) => ({
          ...prev,
          [field]: formattedValue,
        }));
      },
    [],
  );

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

    try {
      await onSubmit(formData);
    } catch {
      setError('Failed to save registration');
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

          {/* Phone Numbers */}
          <Box>
            <TextField
              fullWidth
              label="Phone 1"
              value={formData.phone1}
              onChange={handlePhoneChange('phone1')}
              disabled={isLoading}
              placeholder="(555) 123-4567"
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Phone 2"
              value={formData.phone2}
              onChange={handlePhoneChange('phone2')}
              disabled={isLoading}
              placeholder="(555) 123-4567"
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Phone 3"
              value={formData.phone3}
              onChange={handlePhoneChange('phone3')}
              disabled={isLoading}
              placeholder="(555) 123-4567"
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Phone 4"
              value={formData.phone4}
              onChange={handlePhoneChange('phone4')}
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

          {/* Is Manager Checkbox */}
          <Box>
            <FormControl>
              <FormControlLabel
                control={
                  <Checkbox
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
