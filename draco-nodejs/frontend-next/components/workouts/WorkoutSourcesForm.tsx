'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Alert,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AccountPageHeader from '../AccountPageHeader';
import { getSources, putSources } from '../../services/workoutService';
import { WorkoutSources } from '../../types/workouts';

export const WorkoutSourcesForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  const [success, setSuccess] = useState(false);
  const [sources, setSources] = useState<WorkoutSources>({ options: [] });
  const { accountId } = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const fetchSources = useCallback(async () => {
    try {
      setError(null);
      const data = await getSources(accountId as string);
      setSources(data || { options: [] });
    } catch (err) {
      console.error('Error fetching sources:', err);
      setError('Failed to load sources');
      // Set default options if fetch fails
      setSources({ options: ['Website', 'Friend', 'Social Media', 'Other'] });
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      fetchSources();
    }
  }, [fetchSources, accountId]);

  const handleAddOption = async () => {
    if (newOption.trim() && !sources.options.includes(newOption.trim())) {
      const updatedSources = {
        ...sources,
        options: [...sources.options, newOption.trim()],
      };
      setSources(updatedSources);
      setNewOption('');

      try {
        await putSources(accountId as string, updatedSources, token || undefined);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError('Failed to save new option');
        // Revert on failure
        setSources(sources);
        console.error('Error saving new option:', err);
      }
    }
  };

  const handleRemoveOption = async (optionToRemove: string) => {
    const updatedSources = {
      ...sources,
      options: sources.options.filter((option: string) => option !== optionToRemove),
    };
    setSources(updatedSources);

    try {
      await putSources(accountId as string, updatedSources, token || undefined);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to remove option');
      // Revert on failure
      setSources(sources);
      console.error('Error removing option:', err);
    }
  };

  const handleBackToWorkouts = () => {
    router.push(`/account/${accountId}/workouts`);
  };

  // Ensure sources.options is always an array
  const options = sources?.options || [];

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId as string}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Workout Where Heard
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Breadcrumb Navigation */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body1"
            onClick={handleBackToWorkouts}
            sx={{
              cursor: 'pointer',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Workouts
          </Link>
          <Typography color="text.primary">Where Heard</Typography>
        </Breadcrumbs>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Configure the &quot;Where did you hear about this workout?&quot; options that will be
          available to users when registering for workouts.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Sources updated successfully!
          </Alert>
        )}

        <Paper sx={{ p: 4 }}>
          {/* Add New Option */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Add New Option
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                label="New Option"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="e.g., Email Newsletter"
                inputProps={{ maxLength: 25 }}
                helperText={`${newOption.length}/25 characters`}
              />
              <Button
                variant="contained"
                onClick={handleAddOption}
                disabled={!newOption.trim() || newOption.length > 25}
              >
                Add
              </Button>
            </Box>
          </Box>

          {/* Current Options */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Current Options ({options.length})
            </Typography>
            {options.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No options configured yet. Add some options above.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {options.map((option: string) => (
                  <Box
                    key={option}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography>{option}</Typography>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveOption(option)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </main>
  );
};
