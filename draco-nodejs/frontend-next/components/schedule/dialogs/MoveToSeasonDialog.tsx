'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { listAccountSeasons } from '@draco/shared-api-client';
import type { LeagueSeasonWithDivision } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../utils/apiResult';

interface MoveToSeasonDialogProps {
  open: boolean;
  accountId: string;
  onClose: () => void;
  onConfirm: (seasonId: string) => Promise<void>;
  loading: boolean;
}

const MoveToSeasonDialog: React.FC<MoveToSeasonDialogProps> = ({
  open,
  accountId,
  onClose,
  onConfirm,
  loading,
}) => {
  const apiClient = useApiClient();
  const [seasons, setSeasons] = useState<LeagueSeasonWithDivision[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    const loadSeasons = async () => {
      setLoadingSeasons(true);
      setError(null);
      try {
        const result = await listAccountSeasons({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;
        const data = unwrapApiResult(result, 'Failed to load seasons');
        setSeasons(data);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load seasons');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSeasons(false);
        }
      }
    };

    void loadSeasons();

    return () => {
      controller.abort();
    };
  }, [open, accountId, apiClient]);

  const handleConfirm = async () => {
    if (!selectedSeasonId) return;
    setError(null);
    try {
      await onConfirm(selectedSeasonId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to move match');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box sx={{ p: 3, pb: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Move Match to Season
        </Typography>
      </Box>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" sx={{ mb: 2 }}>
          Select the season to move this match to. The match will be moved to the same flight in the
          target season. Both teams must exist in the target season.
        </Typography>
        {loadingSeasons ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <FormControl fullWidth>
            <InputLabel>Target Season</InputLabel>
            <Select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              label="Target Season"
            >
              {seasons.map((season) => (
                <MenuItem key={season.id} value={season.id}>
                  {season.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedSeasonId || loading || loadingSeasons}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          Move
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoveToSeasonDialog;
