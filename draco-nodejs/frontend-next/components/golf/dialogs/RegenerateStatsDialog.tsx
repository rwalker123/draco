'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Stack,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { regenerateGolfStats } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { useAccountTimezone } from '../../../context/AccountContext';
import { unwrapApiResult } from '../../../utils/apiResult';

interface RegenerateStatsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  accountId: string;
  leagueSeasonId: string;
}

type WeekBoundary =
  | 'sun-sat'
  | 'mon-sun'
  | 'tue-mon'
  | 'wed-tue'
  | 'thu-wed'
  | 'fri-thu'
  | 'sat-fri';

const weekBoundaryOptions: { value: WeekBoundary; label: string }[] = [
  { value: 'sun-sat', label: 'Sunday - Saturday' },
  { value: 'mon-sun', label: 'Monday - Sunday' },
  { value: 'tue-mon', label: 'Tuesday - Monday' },
  { value: 'wed-tue', label: 'Wednesday - Tuesday' },
  { value: 'thu-wed', label: 'Thursday - Wednesday' },
  { value: 'fri-thu', label: 'Friday - Thursday' },
  { value: 'sat-fri', label: 'Saturday - Friday' },
];

interface RegenerateStatsFormProps {
  onClose: () => void;
  onSuccess?: (message: string) => void;
  accountId: string;
  leagueSeasonId: string;
}

function RegenerateStatsForm({
  onClose,
  onSuccess,
  accountId,
  leagueSeasonId,
}: RegenerateStatsFormProps) {
  const apiClient = useApiClient();
  const timeZone = useAccountTimezone();
  const [regenerateGir, setRegenerateGir] = useState(false);
  const [regenerateWeekNumbers, setRegenerateWeekNumbers] = useState(false);
  const [weekBoundary, setWeekBoundary] = useState<WeekBoundary>('mon-sun');
  const [recalculateMatchPoints, setRecalculateMatchPoints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anyOptionSelected = regenerateGir || regenerateWeekNumbers || recalculateMatchPoints;

  const handleRegenerate = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await regenerateGolfStats({
        client: apiClient,
        path: { accountId },
        body: {
          leagueSeasonId,
          regenerateGir,
          regenerateWeekNumbers,
          weekBoundary: regenerateWeekNumbers ? weekBoundary : undefined,
          timeZone,
          recalculateMatchPoints,
        },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to regenerate statistics');
      const message = `Updated ${data.girScoresUpdated} GIR scores, assigned ${data.weekNumbersAssigned} week numbers, recalculated ${data.matchPointsRecalculated} matches`;
      onSuccess?.(message);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>Regenerate Statistics</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={regenerateGir}
                  onChange={(e) => setRegenerateGir(e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body1" fontWeight="medium">
                  Regenerate Greens in Regulation
                </Typography>
              }
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 6.5 }}>
              Recalculates GIR for all scores that have putt data. GIR is determined when (score
              &minus; putts) &le; (par &minus; 2).
            </Typography>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={regenerateWeekNumbers}
                  onChange={(e) => setRegenerateWeekNumbers(e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body1" fontWeight="medium">
                  Assign Week Numbers
                </Typography>
              }
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 6.5 }}>
              Groups matches into weeks based on their dates for skins and contest grouping.
            </Typography>
            {regenerateWeekNumbers && (
              <FormControl size="small" sx={{ ml: 6.5, mt: 1.5, minWidth: 220 }}>
                <InputLabel id="week-boundary-label">Week boundary</InputLabel>
                <Select
                  labelId="week-boundary-label"
                  value={weekBoundary}
                  label="Week boundary"
                  onChange={(e) => setWeekBoundary(e.target.value as WeekBoundary)}
                  disabled={loading}
                >
                  {weekBoundaryOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={recalculateMatchPoints}
                  onChange={(e) => setRecalculateMatchPoints(e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body1" fontWeight="medium">
                  Recalculate Match Points
                </Typography>
              }
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 6.5 }}>
              Recalculates points for all completed matches using the current scoring configuration.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleRegenerate}
          disabled={loading || !anyOptionSelected}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Regenerating...' : 'Regenerate'}
        </Button>
      </DialogActions>
    </>
  );
}

export function RegenerateStatsDialog({
  open,
  onClose,
  onSuccess,
  accountId,
  leagueSeasonId,
}: RegenerateStatsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open && (
        <RegenerateStatsForm
          onClose={onClose}
          onSuccess={onSuccess}
          accountId={accountId}
          leagueSeasonId={leagueSeasonId}
        />
      )}
    </Dialog>
  );
}
