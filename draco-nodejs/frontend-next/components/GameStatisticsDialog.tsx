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
  DialogTitle,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  type GameBattingStatsType,
  type GamePitchingStatsType,
  type LineScoreType,
} from '@draco/shared-schemas';
import { getGameLineScore } from '@draco/shared-api-client';

import { useApiClient } from '@/hooks/useApiClient';
import { TeamStatsEntryService } from '../services/teamStatsEntryService';
import BattingStatsViewTable from './team-stats-entry/BattingStatsViewTable';
import PitchingStatsViewTable from './team-stats-entry/PitchingStatsViewTable';
import LineScoreTable from './team-stats-entry/LineScoreTable';

export interface StatsTab {
  teamSeasonId: string;
  teamName: string;
}

interface GameStatisticsDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  gameId: string;
  teamSeasonId: string;
  teamName?: string;
  gameDate?: string;
  homeScore?: number;
  visitorScore?: number;
  homeTeamName?: string;
  visitorTeamName?: string;
  statsTabs?: StatsTab[];
  initialTeamSeasonId?: string;
}

const GameStatisticsDialog: React.FC<GameStatisticsDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  gameId,
  teamSeasonId,
  teamName,
  gameDate,
  homeScore,
  visitorScore,
  homeTeamName,
  visitorTeamName,
  statsTabs,
  initialTeamSeasonId,
}) => {
  const theme = useTheme();
  const apiClient = useApiClient();

  const defaultTeamSeasonId = initialTeamSeasonId ?? statsTabs?.[0]?.teamSeasonId ?? teamSeasonId;

  const [battingStats, setBattingStats] = useState<GameBattingStatsType | null>(null);
  const [pitchingStats, setPitchingStats] = useState<GamePitchingStatsType | null>(null);
  const [lineScore, setLineScore] = useState<LineScoreType | null>(null);
  const [selectedTeamSeasonId, setSelectedTeamSeasonId] = useState<string>(defaultTeamSeasonId);
  const [requestedTeamSeasonId, setRequestedTeamSeasonId] = useState<string>(defaultTeamSeasonId);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedTeamSeasonId(defaultTeamSeasonId);
      setRequestedTeamSeasonId(defaultTeamSeasonId);
      setInitializing(true);
      setBattingStats(null);
      setPitchingStats(null);
      setError(null);
    }
  }, [open, defaultTeamSeasonId]);

  useEffect(() => {
    if (!open || !accountId || !seasonId || !gameId) {
      return;
    }

    const controller = new AbortController();

    const loadLineScore = async () => {
      try {
        const result = await getGameLineScore({
          client: apiClient,
          path: { accountId, seasonId, gameId },
          signal: controller.signal,
          throwOnError: false,
        });
        if (controller.signal.aborted) {
          return;
        }
        setLineScore(result.data ?? null);
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setLineScore(null);
      }
    };

    void loadLineScore();

    return () => {
      controller.abort();
    };
  }, [open, accountId, seasonId, gameId, apiClient]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    const service = new TeamStatsEntryService(null, apiClient);

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const [batting, pitching] = await Promise.all([
          service.getGameBattingStats(
            accountId,
            seasonId,
            requestedTeamSeasonId,
            gameId,
            controller.signal,
          ),
          service.getGamePitchingStats(
            accountId,
            seasonId,
            requestedTeamSeasonId,
            gameId,
            controller.signal,
          ),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setBattingStats(batting);
        setPitchingStats(pitching);
        setSelectedTeamSeasonId(requestedTeamSeasonId);
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load game statistics');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    void loadStats();

    return () => {
      controller.abort();
    };
  }, [open, accountId, seasonId, requestedTeamSeasonId, gameId, apiClient]);

  const formattedGameDate = gameDate
    ? Number.isNaN(new Date(gameDate).getTime())
      ? gameDate
      : new Date(gameDate).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
    : null;

  const scoreboardLine =
    homeScore !== undefined && visitorScore !== undefined && homeTeamName && visitorTeamName
      ? `${visitorTeamName} ${visitorScore} at ${homeTeamName} ${homeScore}`
      : null;

  const hasTabs = Boolean(statsTabs && statsTabs.length > 1);
  const activeTeamName =
    statsTabs?.find((tab) => tab.teamSeasonId === selectedTeamSeasonId)?.teamName ?? teamName;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.widget.surface,
          color: theme.palette.text.primary,
          borderRadius: 2,
          boxShadow: theme.shadows[theme.palette.mode === 'dark' ? 12 : 4],
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: theme.palette.widget.headerText,
        }}
      >
        Game Statistics
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {formattedGameDate && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formattedGameDate}
          </Typography>
        )}
        {lineScore ? (
          <Box sx={{ mb: 2 }}>
            <LineScoreTable lineScore={lineScore} />
          </Box>
        ) : (
          scoreboardLine && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {scoreboardLine}
            </Typography>
          )
        )}

        {hasTabs ? (
          <Tabs
            value={selectedTeamSeasonId}
            onChange={(_event, value: string) => setRequestedTeamSeasonId(value)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            {statsTabs?.map((tab) => (
              <Tab key={tab.teamSeasonId} value={tab.teamSeasonId} label={tab.teamName} />
            ))}
          </Tabs>
        ) : (
          activeTeamName && (
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {activeTeamName}
            </Typography>
          )
        )}

        {initializing && loading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Batting
              </Typography>
              <BattingStatsViewTable stats={battingStats} totals={battingStats?.totals ?? null} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Pitching
              </Typography>
              <PitchingStatsViewTable
                stats={pitchingStats}
                totals={pitchingStats?.totals ?? null}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GameStatisticsDialog;
