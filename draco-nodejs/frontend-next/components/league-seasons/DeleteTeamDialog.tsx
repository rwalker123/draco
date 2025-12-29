'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import {
  deleteSeasonTeam as apiDeleteSeasonTeam,
  deleteAccountTeam as apiDeleteAccountTeam,
} from '@draco/shared-api-client';
import type {
  TeamSeasonType,
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
} from '@draco/shared-schemas';
import { unwrapApiResult, assertNoApiError } from '../../utils/apiResult';
import { useApiClient } from '../../hooks/useApiClient';

interface DeleteTeamDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  teamSeason: TeamSeasonType | null;
  leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType | null;
  onSuccess: (leagueSeasonId: string, teamSeasonId: string, message: string) => void;
  onError?: (error: string) => void;
}

const DeleteTeamDialog: React.FC<DeleteTeamDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  teamSeason,
  leagueSeason,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleDelete = useCallback(async () => {
    if (!teamSeason || !leagueSeason) return;

    setLoading(true);
    setError(null);

    try {
      // First, delete the team-season relationship
      const deleteSeasonTeamResult = await apiDeleteSeasonTeam({
        path: { accountId, seasonId, teamSeasonId: teamSeason.id },
        client: apiClient,
        throwOnError: false,
      });

      unwrapApiResult(deleteSeasonTeamResult, 'Failed to remove team from season');

      // Then try to delete the team definition
      let deletedTeamDefinition = false;
      const deleteResult = await apiDeleteAccountTeam({
        path: { accountId, teamId: teamSeason.team.id },
        client: apiClient,
        throwOnError: false,
      });

      try {
        assertNoApiError(deleteResult, 'Failed to delete team definition');
        deletedTeamDefinition = true;
      } catch (deleteError) {
        const status = deleteResult.response?.status;
        if (status === 409) {
          onSuccess(
            leagueSeason.id,
            teamSeason.id,
            `Team "${teamSeason.name}" has been removed from this season. The team definition was kept because it's used in other seasons.`,
          );
          handleClose();
          return;
        } else {
          onSuccess(
            leagueSeason.id,
            teamSeason.id,
            `Team "${teamSeason.name}" has been removed from this season. There was an issue deleting the team definition, but it may still be removed later.`,
          );
          console.warn('Team definition deletion failed:', deleteError);
          handleClose();
          return;
        }
      }

      if (deletedTeamDefinition) {
        onSuccess(
          leagueSeason.id,
          teamSeason.id,
          `Team "${teamSeason.name}" has been completely deleted from the system.`,
        );
      }

      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove team from season';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamSeason, leagueSeason, accountId, seasonId, apiClient, onSuccess, onError, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove Team from Season</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to remove the team <strong>{teamSeason?.name}</strong> from this
          season?
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action will remove the team from this season and all its associated data (divisions,
          etc.). The system will also attempt to delete the team definition if
          {" it's not used in other seasons."}
        </Alert>
        {teamSeason && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              This team will be removed from the current season.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Remove Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteTeamDialog;
