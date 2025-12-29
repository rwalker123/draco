'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  createLeague as apiCreateLeague,
  addLeagueToSeason as apiAddLeagueToSeason,
} from '@draco/shared-api-client';
import type { LeagueSeasonWithDivisionTeamsAndUnassignedType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../utils/apiResult';
import { useApiClient } from '../../hooks/useApiClient';

interface CreateLeagueDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  onSuccess: (
    leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType,
    message: string,
  ) => void;
  onError?: (error: string) => void;
}

const CreateLeagueDialog: React.FC<CreateLeagueDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setLeagueName('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!leagueName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const createResult = await apiCreateLeague({
        client: apiClient,
        path: { accountId },
        body: { name: leagueName.trim() },
        throwOnError: false,
      });

      const newLeague = unwrapApiResult(createResult, 'Failed to create league');

      const addResult = await apiAddLeagueToSeason({
        client: apiClient,
        path: { accountId, seasonId },
        body: { leagueId: newLeague.id },
        throwOnError: false,
      });

      const addedLeagueSeason = unwrapApiResult(addResult, 'Failed to add league to season');

      const mappedLeagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType = {
        id: addedLeagueSeason.id,
        league: {
          id: addedLeagueSeason.league.id,
          name: addedLeagueSeason.league.name,
        },
        divisions: [],
        unassignedTeams: [],
      };

      onSuccess(mappedLeagueSeason, `League "${newLeague.name}" created and added to this season`);
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create league';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [leagueName, accountId, seasonId, apiClient, onSuccess, onError, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New League</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" sx={{ mb: 2 }}>
          Create a new league and add it to this season.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="League Name"
          fullWidth
          variant="outlined"
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          disabled={loading}
          helperText="Enter a unique name for the new league"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !leagueName.trim()}>
          {loading ? <CircularProgress size={20} /> : 'Create League'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateLeagueDialog;
