'use client';

import React, { useState } from 'react';
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
  TextField,
  Snackbar,
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
import { useNotifications } from '../../hooks/useNotifications';

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
  const { notification, showNotification, hideNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const isConfirmed = confirmationText.toLowerCase() === 'yes';

  const handleClose = () => {
    hideNotification();
    setConfirmationText('');
    onClose();
  };

  const handleDelete = async () => {
    if (!teamSeason || !leagueSeason) return;

    setLoading(true);
    hideNotification();

    try {
      const deleteSeasonTeamResult = await apiDeleteSeasonTeam({
        path: { accountId, seasonId, teamSeasonId: teamSeason.id },
        client: apiClient,
        throwOnError: false,
      });

      unwrapApiResult(deleteSeasonTeamResult, 'Failed to remove team from season');

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
      showNotification(errorMessage, 'error');
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove Team from Season</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to remove the team <strong>{teamSeason?.name}</strong> from this
          season?
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action will remove the team from the season and all players will be released. If you
          simply want to move the team to a new division, please use the Remove Team from Division
          icon.
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            If you are sure you want to continue, type <strong>yes</strong> in the field below:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type yes to confirm"
            disabled={loading}
            autoComplete="off"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading || !isConfirmed}
        >
          {loading ? <CircularProgress size={20} /> : 'Remove Team'}
        </Button>
      </DialogActions>
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={hideNotification} severity={notification?.severity} variant="filled">
          {notification?.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default DeleteTeamDialog;
