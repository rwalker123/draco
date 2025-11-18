'use client';

import React, { useState, useMemo, use } from 'react';
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
import { WorkoutSourcesType } from '@draco/shared-schemas';

const EMPTY_SOURCES: WorkoutSourcesType = { options: [] };
const DEFAULT_FALLBACK_SOURCES: WorkoutSourcesType = {
  options: ['Website', 'Friend', 'Social Media', 'Other'],
};

export const WorkoutSourcesForm: React.FC = () => {
  const params = useParams();
  const accountParam = params.accountId;
  const resolvedAccountId = Array.isArray(accountParam) ? accountParam[0] : accountParam;

  const initialLoadPromise = useMemo(() => {
    if (!resolvedAccountId) {
      return Promise.resolve({ data: EMPTY_SOURCES, error: 'Account not found' as string | null });
    }

    return getSources(resolvedAccountId)
      .then((data) => ({ data: data ?? EMPTY_SOURCES, error: null as string | null }))
      .catch((err) => {
        console.error('Error fetching sources:', err);
        return { data: DEFAULT_FALLBACK_SOURCES, error: 'Failed to load sources' as string | null };
      });
  }, [resolvedAccountId]);

  const { data: initialSources, error: initialLoadError } = use(initialLoadPromise);

  const [error, setError] = useState<string | null>(initialLoadError);
  const [newOption, setNewOption] = useState('');
  const [success, setSuccess] = useState(false);
  const [sources, setSources] = useState<WorkoutSourcesType>({
    options: [...initialSources.options],
  });
  const router = useRouter();
  const { token } = useAuth();

  const handleAddOption = async () => {
    if (newOption.trim() && !sources.options.includes(newOption.trim())) {
      const trimmed = newOption.trim();
      const previousSources = sources;
      const updatedSources = {
        ...sources,
        options: [...sources.options, trimmed],
      };
      setSources(updatedSources);
      setNewOption('');

      try {
        if (!resolvedAccountId) {
          throw new Error('Account not found');
        }
        setError(null);
        await putSources(resolvedAccountId, updatedSources, token || undefined);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError('Failed to save new option');
        // Revert on failure
        setSources(previousSources);
        console.error('Error saving new option:', err);
      }
    }
  };

  const handleRemoveOption = async (optionToRemove: string) => {
    const previousSources = sources;
    const updatedSources = {
      ...sources,
      options: sources.options.filter((option: string) => option !== optionToRemove),
    };
    setSources(updatedSources);

    try {
      if (!resolvedAccountId) {
        throw new Error('Account not found');
      }
      setError(null);
      await putSources(resolvedAccountId, updatedSources, token || undefined);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to remove option');
      // Revert on failure
      setSources(previousSources);
      console.error('Error removing option:', err);
    }
  };

  const handleBackToWorkouts = () => {
    if (!resolvedAccountId) {
      return;
    }
    router.push(`/account/${resolvedAccountId}/workouts`);
  };

  // Ensure sources.options is always an array
  const options = sources?.options || [];

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={resolvedAccountId ?? ''}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
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
