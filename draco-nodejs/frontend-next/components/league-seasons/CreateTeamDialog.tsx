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
  createLeagueSeasonTeam as apiCreateLeagueSeasonTeam,
  assignLeagueSeasonTeamDivision as apiAssignLeagueSeasonTeamDivision,
} from '@draco/shared-api-client';
import type { LeagueSeasonType, DivisionSeasonType, TeamSeasonType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../utils/apiResult';
import { useApiClient } from '../../hooks/useApiClient';

export interface CreateTeamResult {
  teamSeason: TeamSeasonType;
  leagueSeasonId: string;
  divisionSeasonId: string | null;
}

interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  leagueSeason: LeagueSeasonType | null;
  division: DivisionSeasonType | null;
  onSuccess: (result: CreateTeamResult, message: string) => void;
  onError?: (error: string) => void;
}

const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  leagueSeason,
  division,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTeamName('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!leagueSeason || !teamName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const createResult = await apiCreateLeagueSeasonTeam({
        path: { accountId, seasonId, leagueSeasonId: leagueSeason.id },
        client: apiClient,
        body: { name: teamName.trim() },
        throwOnError: false,
      });

      const mappedTeam = unwrapApiResult(createResult, 'Failed to create team');
      const leagueSeasonId = leagueSeason.id;

      // If a division was specified, auto-assign the team to it
      if (division) {
        try {
          const assignResult = await apiAssignLeagueSeasonTeamDivision({
            client: apiClient,
            path: {
              accountId,
              seasonId,
              leagueSeasonId,
              teamSeasonId: mappedTeam.id,
            },
            body: { divisionSeasonId: division.id },
            throwOnError: false,
          });

          const assigned = unwrapApiResult(assignResult, 'Failed to assign team to division');

          if (assigned) {
            onSuccess(
              { teamSeason: mappedTeam, leagueSeasonId, divisionSeasonId: division.id },
              `Team "${mappedTeam.name}" created and added to division "${division.division.name}"`,
            );
          } else {
            onSuccess(
              { teamSeason: mappedTeam, leagueSeasonId, divisionSeasonId: null },
              `Team "${mappedTeam.name}" created but could not be assigned to division`,
            );
          }
        } catch (assignError) {
          console.error('Error assigning team to division:', assignError);
          onSuccess(
            { teamSeason: mappedTeam, leagueSeasonId, divisionSeasonId: null },
            `Team "${mappedTeam.name}" created but could not be assigned to division`,
          );
        }
      } else {
        onSuccess(
          { teamSeason: mappedTeam, leagueSeasonId, divisionSeasonId: null },
          `Team "${mappedTeam.name}" has been created.`,
        );
      }

      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    leagueSeason,
    division,
    teamName,
    accountId,
    seasonId,
    apiClient,
    onSuccess,
    onError,
    handleClose,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Team</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" sx={{ mb: 2 }}>
          Creating team for league: <strong>{leagueSeason?.league.name}</strong>
          {division && (
            <>
              {' '}
              in division: <strong>{division.division.name}</strong>
            </>
          )}
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Team Name"
          fullWidth
          variant="outlined"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
          helperText={
            division
              ? 'The team will be automatically added to the division'
              : 'Enter a unique name for the new team'
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !teamName.trim()}>
          {loading ? <CircularProgress size={20} /> : 'Create Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTeamDialog;
