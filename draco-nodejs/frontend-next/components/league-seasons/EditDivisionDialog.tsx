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
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
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
        },
        throwOnError: false,
      });

      const updated = unwrapApiResult(result, 'Failed to update division');

      if (updated) {
        onSuccess(
          {
            leagueSeasonId: leagueSeason.id,
            divisionSeasonId: divisionSeason.id,
            name: divisionName.trim(),
            priority,
          },
          'Division updated successfully',
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
  }, [
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
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Division</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
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
          disabled={loading}
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
          disabled={loading}
          helperText="Lower numbers have higher priority"
        />
      </DialogContent>
      <DialogActions>
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
      </DialogActions>
    </Dialog>
  );
};

export default EditDivisionDialog;
