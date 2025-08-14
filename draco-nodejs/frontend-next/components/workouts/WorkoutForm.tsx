'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { createWorkout, updateWorkout, getWorkout } from '../../services/workoutService';
import { WorkoutCreateDTO, WorkoutUpdateDTO } from '../../types/workouts';
import RichTextEditor from '../email/RichTextEditor';
import AccountPageHeader from '../AccountPageHeader';

interface WorkoutFormProps {
  mode: 'create' | 'edit';
  accountId?: string;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ mode, accountId: propAccountId }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<WorkoutCreateDTO>({
    workoutDesc: '',
    workoutDate: new Date().toISOString(),
    fieldId: null,
    comments: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Array<{ id: string; name: string }>>([]);

  // Refs to preserve cursor position and get RichTextEditor content
  const workoutDescRef = useRef<HTMLInputElement>(null);
  const richTextEditorRef = useRef<{ getCurrentContent: () => string }>(null);

  const router = useRouter();
  const params = useParams();
  const accountId =
    propAccountId || (Array.isArray(params.accountId) ? params.accountId[0] : params.accountId);
  const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;

  const fetchWorkout = useCallback(async () => {
    if (mode === 'edit' && workoutId) {
      try {
        setLoading(true);
        const workout = await getWorkout(
          accountId as string,
          workoutId as string,
          token || undefined,
        );
        setFormData({
          workoutDesc: workout.workoutDesc,
          workoutDate: workout.workoutDate,
          fieldId: workout.fieldId,
          comments: workout.comments,
        });
      } catch (err) {
        setError('Failed to load workout');
        console.error('Error fetching workout:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [mode, workoutId, accountId, token]);

  const fetchFields = useCallback(async () => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/fields`);
      const data = await response.json();
      setFields(data.data.fields);
    } catch (err) {
      console.error('Error fetching fields:', err);
      setError('Failed to load fields');
    }
  }, [accountId]);

  useEffect(() => {
    fetchWorkout();
    fetchFields();
  }, [fetchWorkout, fetchFields]);

  // Effect to preserve cursor position when form data changes
  useEffect(() => {
    if (workoutDescRef.current && document.activeElement === workoutDescRef.current) {
      const input = workoutDescRef.current;
      const cursorPosition = input.selectionStart;

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (input && document.activeElement === input) {
          input.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    }
  }, [formData.workoutDesc]);

  const handleTextChange = useCallback(
    (field: keyof WorkoutCreateDTO) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const cursorPosition = input.selectionStart;
      const newValue = input.value;
      setFormData((prev) => ({ ...prev, [field]: newValue }));
      // Preserve cursor position after state update
      setTimeout(() => {
        if (field === 'workoutDesc' && workoutDescRef.current) {
          workoutDescRef.current.setSelectionRange(cursorPosition, cursorPosition);
          workoutDescRef.current.focus();
        }
      }, 0);
    },
    [],
  );

  const handleDateChange = useCallback((newValue: Date | null) => {
    if (newValue) {
      setFormData((prev) => ({ ...prev, workoutDate: newValue.toISOString() }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workoutDesc || !formData.workoutDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Get the current content from RichTextEditor
      const currentComments = richTextEditorRef.current?.getCurrentContent() || formData.comments;

      // Create the data to submit with current comments
      const submitData = {
        ...formData,
        comments: currentComments,
      };

      if (mode === 'create') {
        await createWorkout(accountId as string, submitData, token || undefined);
        router.push(`/account/${accountId}/workouts`);
      } else {
        const updateData: WorkoutUpdateDTO = submitData;
        await updateWorkout(
          accountId as string,
          workoutId as string,
          updateData,
          token || undefined,
        );
        router.push(`/account/${accountId}/workouts`);
      }
    } catch (err) {
      setError('Failed to save workout');
      console.error('Error saving workout:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/account/${accountId}/workouts`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading workout...
          </Typography>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId || ''}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            {mode === 'create' ? 'Create New Workout' : 'Edit Workout'}
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              key={`workout-title-${mode}-${workoutId || 'new'}`}
              fullWidth
              label="Workout Title"
              value={formData.workoutDesc}
              onChange={handleTextChange('workoutDesc')}
              required
              inputRef={workoutDescRef}
              slotProps={{
                htmlInput: {
                  'data-testid': 'workout-title-input',
                  'data-cursor-preserve': 'true',
                },
              }}
              sx={{ mb: 3 }}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Workout Date & Time"
                value={new Date(formData.workoutDate)}
                onChange={handleDateChange}
                sx={{ mb: 3, width: '100%' }}
              />
            </LocalizationProvider>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Field (Optional)</InputLabel>
              <Select
                value={formData.fieldId || ''}
                label="Field (Optional)"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fieldId: e.target.value || null }))
                }
              >
                <MenuItem value="">
                  <em>No field selected</em>
                </MenuItem>
                {fields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <RichTextEditor
                value={formData.comments}
                placeholder="Enter workout description..."
                ref={richTextEditorRef}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : null}
              >
                {saving ? 'Saving...' : mode === 'create' ? 'Create Workout' : 'Update Workout'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </main>
  );
};
