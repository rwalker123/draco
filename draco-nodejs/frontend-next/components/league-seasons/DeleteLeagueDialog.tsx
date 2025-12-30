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
  removeLeagueFromSeason as apiRemoveLeagueFromSeason,
  deleteLeague,
} from '@draco/shared-api-client';
import type { LeagueSeasonWithDivisionTeamsAndUnassignedType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../utils/apiResult';
import { useApiClient } from '../../hooks/useApiClient';

interface DeleteLeagueDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType | null;
  onSuccess: (leagueSeasonId: string, message: string) => void;
  onError?: (error: string) => void;
}

const DeleteLeagueDialog: React.FC<DeleteLeagueDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
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
    if (!leagueSeason) return;

    setLoading(true);
    setError(null);

    try {
      const removeResult = await apiRemoveLeagueFromSeason({
        client: apiClient,
        path: { accountId, seasonId, leagueSeasonId: leagueSeason.id },
        throwOnError: false,
      });

      unwrapApiResult(removeResult, 'Failed to remove league from season');

      // Try to delete the league definition (it may fail if used in other seasons)
      try {
        await deleteLeague({
          client: apiClient,
          path: { accountId, leagueId: leagueSeason.league.id },
          throwOnError: false,
        });
      } catch {
        // Ignore errors when deleting the league definition
      }

      onSuccess(leagueSeason.id, `League "${leagueSeason.league.name}" removed from this season`);
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove league';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [leagueSeason, accountId, seasonId, apiClient, onSuccess, onError, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove League from Season</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to remove the league{' '}
          <strong>{`'${leagueSeason?.league.name}'`}</strong> from this season?
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action will remove the league from this season and all its associated data
          (divisions, teams, etc.). The system will also attempt to delete the league definition
          {" if it's not used in other seasons."}
        </Alert>
        {leagueSeason && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              This league currently has:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • {leagueSeason.divisions?.length || 0} divisions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • {leagueSeason.unassignedTeams?.length || 0} unassigned teams
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Remove League'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteLeagueDialog;
