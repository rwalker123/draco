'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
import { updateLeagueSeasonDivision as apiUpdateLeagueSeasonDivision } from '@draco/shared-api-client';
import type { DivisionSeasonType, LeagueSeasonType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../utils/apiResult';
import { useApiClient } from '../../hooks/useApiClient';

export interface EditDivisionResult {
  leagueSeasonId: string;
  divisionSeasonId: string;
  name: string;
  priority: number;
}

interface EditDivisionDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  divisionSeason: DivisionSeasonType | null;
  leagueSeason: LeagueSeasonType | null;
  onSuccess: (result: EditDivisionResult, message: string) => void;
  onError?: (error: string) => void;
}

interface ConflictInfo {
  existingDivisionId: string;
  existingDivisionName: string;
}

const EditDivisionDialog: React.FC<EditDivisionDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  divisionSeason,
  leagueSeason,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const [divisionName, setDivisionName] = useState('');
  const [priority, setPriority] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  useEffect(() => {
    if (divisionSeason) {
      setDivisionName(divisionSeason.division.name);
      setPriority(divisionSeason.priority);
    }
  }, [divisionSeason]);

  const resetForm = useCallback(() => {
    setDivisionName('');
    setPriority(0);
    setError(null);
    setConflict(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const performUpdate = useCallback(
    async (switchToExisting: boolean) => {
      if (!divisionSeason || !leagueSeason || !divisionName.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const result = await apiUpdateLeagueSeasonDivision({
          client: apiClient,
          path: {
            accountId,
            seasonId,
            leagueSeasonId: leagueSeason.id,
            divisionSeasonId: divisionSeason.id,
          },
          body: {
            name: divisionName.trim(),
            priority,
            switchToExistingDivision: switchToExisting,
          },
          throwOnError: false,
        });

        const response = unwrapApiResult(result, 'Failed to update division');

        if (response.conflict) {
          setConflict(response.conflict);
          setLoading(false);
          return;
        }

        if (response.success) {
          onSuccess(
            {
              leagueSeasonId: leagueSeason.id,
              divisionSeasonId: divisionSeason.id,
              name: divisionName.trim(),
              priority,
            },
            switchToExisting
              ? `Switched to existing division "${divisionName.trim()}"`
              : 'Division updated successfully',
          );
          handleClose();
        } else {
          setError('Failed to update division');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update division';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      divisionSeason,
      leagueSeason,
      divisionName,
      priority,
      accountId,
      seasonId,
      apiClient,
      onSuccess,
      onError,
      handleClose,
    ],
  );

  const handleSubmit = useCallback(() => {
    setConflict(null);
    performUpdate(false);
  }, [performUpdate]);

  const handleSwitchToExisting = useCallback(() => {
    performUpdate(true);
  }, [performUpdate]);

  const handleCancelConflict = useCallback(() => {
    setConflict(null);
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Division</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {conflict && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              A division named <strong>&quot;{conflict.existingDivisionName}&quot;</strong> already
              exists.
            </Typography>
            <Typography variant="body2">
              Would you like to switch this division to use the existing one, or cancel and choose a
              different name?
            </Typography>
          </Alert>
        )}
        <Typography variant="body2" sx={{ mb: 2 }}>
          Editing division in league: <strong>{leagueSeason?.league.name}</strong>
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Division Name"
          fullWidth
          variant="outlined"
          value={divisionName}
          onChange={(e) => setDivisionName(e.target.value)}
          disabled={loading || !!conflict}
          sx={{ mb: 2 }}
          helperText="Enter the new name for the division"
        />
        <TextField
          margin="dense"
          label="Priority"
          type="number"
          fullWidth
          variant="outlined"
          value={priority}
          onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
          disabled={loading || !!conflict}
          helperText="Lower numbers have higher priority"
        />
      </DialogContent>
      <DialogActions>
        {conflict ? (
          <>
            <Button onClick={handleCancelConflict} disabled={loading}>
              Choose Different Name
            </Button>
            <Button
              onClick={handleSwitchToExisting}
              variant="contained"
              disabled={loading}
              color="warning"
            >
              {loading ? <CircularProgress size={20} /> : 'Switch to Existing Division'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !divisionName.trim()}
            >
              {loading ? <CircularProgress size={20} /> : 'Update Division'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EditDivisionDialog;
