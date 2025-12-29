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
  Box,
  Autocomplete,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { addDivisionToLeagueSeason as apiAddDivisionToLeagueSeason } from '@draco/shared-api-client';
import type {
  LeagueSeasonType,
  DivisionType,
  DivisionSeasonWithTeamsType,
  TeamSeasonType,
} from '@draco/shared-schemas';
import { unwrapApiResult } from '../../utils/apiResult';
import { useApiClient } from '../../hooks/useApiClient';
import PageSectionHeader from '../common/PageSectionHeader';

export interface AddDivisionResult {
  leagueSeasonId: string;
  divisionSeason: DivisionSeasonWithTeamsType;
}

interface AddDivisionDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  leagueSeason: LeagueSeasonType | null;
  availableDivisions: DivisionType[];
  onSuccess: (result: AddDivisionResult, message: string) => void;
  onError?: (error: string) => void;
}

const AddDivisionDialog: React.FC<AddDivisionDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  leagueSeason,
  availableDivisions,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const [createMode, setCreateMode] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<DivisionType | null>(null);
  const [newDivisionName, setNewDivisionName] = useState('');
  const [priority, setPriority] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setCreateMode(false);
    setSelectedDivision(null);
    setNewDivisionName('');
    setPriority(0);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleAddExistingDivision = useCallback(async () => {
    if (!leagueSeason || !selectedDivision) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiAddDivisionToLeagueSeason({
        client: apiClient,
        path: {
          accountId,
          seasonId,
          leagueSeasonId: leagueSeason.id,
        },
        body: {
          divisionId: selectedDivision.id,
          priority,
        },
        throwOnError: false,
      });

      const divisionSeason = unwrapApiResult(result, 'Failed to add division to league season');

      const mappedDivisionSeason: DivisionSeasonWithTeamsType = {
        id: divisionSeason.id,
        division: {
          id: divisionSeason.division.id,
          name: divisionSeason.division.name,
        },
        priority: divisionSeason.priority,
        teams: [] as TeamSeasonType[],
      };

      onSuccess(
        { leagueSeasonId: leagueSeason.id, divisionSeason: mappedDivisionSeason },
        `Division added to ${leagueSeason.league.name}`,
      );
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add division';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    leagueSeason,
    selectedDivision,
    priority,
    accountId,
    seasonId,
    apiClient,
    onSuccess,
    onError,
    handleClose,
  ]);

  const handleCreateDivision = useCallback(async () => {
    if (!leagueSeason || !newDivisionName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiAddDivisionToLeagueSeason({
        client: apiClient,
        path: {
          accountId,
          seasonId,
          leagueSeasonId: leagueSeason.id,
        },
        body: {
          name: newDivisionName.trim(),
          priority,
        },
        throwOnError: false,
      });

      const divisionSeason = unwrapApiResult(result, 'Failed to create division');

      const mappedDivisionSeason: DivisionSeasonWithTeamsType = {
        id: divisionSeason.id,
        division: {
          id: divisionSeason.division.id,
          name: divisionSeason.division.name,
        },
        priority: divisionSeason.priority,
        teams: [] as TeamSeasonType[],
      };

      onSuccess(
        { leagueSeasonId: leagueSeason.id, divisionSeason: mappedDivisionSeason },
        `Division "${newDivisionName.trim()}" created and added to ${leagueSeason.league.name}`,
      );
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create division';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    leagueSeason,
    newDivisionName,
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
      <DialogTitle>Add Division to League</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" sx={{ mb: 2 }}>
          Adding division to: <strong>{leagueSeason?.league.name}</strong>
        </Typography>

        {!createMode ? (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <PageSectionHeader title="Select Existing Division" gutterBottom />
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setCreateMode(true);
                  setNewDivisionName('');
                  setError(null);
                }}
                startIcon={<AddIcon />}
                disabled={loading}
              >
                Create New Division
              </Button>
            </Box>
            <Autocomplete
              options={availableDivisions}
              getOptionLabel={(option) => option.name}
              value={selectedDivision}
              onChange={(_, newValue) => setSelectedDivision(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Division"
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              )}
              noOptionsText={
                availableDivisions.length === 0
                  ? 'All divisions are already assigned to this league'
                  : 'No divisions available'
              }
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
          </>
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <PageSectionHeader title="Create New Division" gutterBottom />
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setCreateMode(false);
                  setSelectedDivision(null);
                  setError(null);
                }}
                disabled={loading}
              >
                Select Existing
              </Button>
            </Box>
            <TextField
              autoFocus
              margin="dense"
              label="Division Name"
              fullWidth
              variant="outlined"
              value={newDivisionName}
              onChange={(e) => setNewDivisionName(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
            />
            {leagueSeason && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This division will be created and added to league {leagueSeason.league.name}.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {!createMode ? (
          <Button
            onClick={handleAddExistingDivision}
            variant="contained"
            disabled={loading || !selectedDivision}
          >
            {loading ? <CircularProgress size={20} /> : 'Add Division'}
          </Button>
        ) : (
          <Button
            onClick={handleCreateDivision}
            variant="contained"
            disabled={loading || !newDivisionName.trim()}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Division'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddDivisionDialog;
