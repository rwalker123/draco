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
} from '@mui/material';
import { removeLeagueSeasonTeamDivision as apiRemoveLeagueSeasonTeamDivision } from '@draco/shared-api-client';
import type { TeamSeasonType, LeagueSeasonWithDivisionTeamsType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../utils/apiResult';
import { useApiClient } from '../../hooks/useApiClient';

export interface RemoveTeamFromDivisionResult {
  leagueSeasonId: string;
  divisionSeasonId: string;
  teamSeason: TeamSeasonType;
}

interface RemoveTeamFromDivisionDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  teamSeason: TeamSeasonType | null;
  leagueSeason: LeagueSeasonWithDivisionTeamsType | null;
  onSuccess: (result: RemoveTeamFromDivisionResult, message: string) => void;
}

const RemoveTeamFromDivisionDialog: React.FC<RemoveTeamFromDivisionDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  teamSeason,
  leagueSeason,
  onSuccess,
}) => {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleRemove = useCallback(async () => {
    if (!teamSeason || !leagueSeason) return;

    const divisionSeason = leagueSeason.divisions?.find((div) =>
      div.teams?.some((team) => team.id === teamSeason.id),
    );

    if (!divisionSeason) {
      setError('Could not find the division for this team');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiRemoveLeagueSeasonTeamDivision({
        client: apiClient,
        path: {
          accountId,
          seasonId,
          leagueSeasonId: leagueSeason.id,
          teamSeasonId: teamSeason.id,
        },
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to remove team from division');

      onSuccess(
        {
          leagueSeasonId: leagueSeason.id,
          divisionSeasonId: divisionSeason.id,
          teamSeason,
        },
        `Team "${teamSeason.name}" removed from division`,
      );

      handleClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove team from division';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamSeason, leagueSeason, accountId, seasonId, apiClient, onSuccess, handleClose]);

  const divisionName =
    leagueSeason?.divisions?.find((div) => div.teams?.some((team) => team.id === teamSeason?.id))
      ?.division.name ?? 'the division';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove Team from Division</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to remove <strong>{teamSeason?.name}</strong> from{' '}
          <strong>{divisionName}</strong>?
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Players will not be released from the team and cannot be signed by other teams in the
          league until the team is assigned to a new division.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleRemove} variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Remove from Division'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveTeamFromDivisionDialog;
