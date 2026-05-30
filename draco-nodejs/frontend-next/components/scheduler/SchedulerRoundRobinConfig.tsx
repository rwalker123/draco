'use client';

import React from 'react';
import { Box, Divider, TextField, Typography } from '@mui/material';

export interface LeagueRoundRobinCount {
  leagueSeasonId: string;
  inDivisionGameCount: number;
  crossDivisionGameCount: number;
}

interface EntityOption {
  id: string;
  name: string;
}

interface SchedulerRoundRobinConfigProps {
  accountId: string;
  seasonId: string | null;
  selectedLeagueSeasonIds: string[];
  leagues: EntityOption[];
  leagueNameById: Map<string, string>;
  counts: Map<string, LeagueRoundRobinCount>;
  onCountsChange: (counts: Map<string, LeagueRoundRobinCount>) => void;
}

const buildStorageKey = (accountId: string, seasonId: string) =>
  `scheduler:rrCounts:${accountId}:${seasonId}`;

export const loadRoundRobinCounts = (
  accountId: string,
  seasonId: string,
): Map<string, LeagueRoundRobinCount> => {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = window.localStorage.getItem(buildStorageKey(accountId, seasonId));
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as LeagueRoundRobinCount[];
    return new Map(parsed.map((entry) => [entry.leagueSeasonId, entry]));
  } catch {
    return new Map();
  }
};

const saveRoundRobinCounts = (
  accountId: string,
  seasonId: string,
  counts: Map<string, LeagueRoundRobinCount>,
): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      buildStorageKey(accountId, seasonId),
      JSON.stringify(Array.from(counts.values())),
    );
  } catch {}
};

export const SchedulerRoundRobinConfig: React.FC<SchedulerRoundRobinConfigProps> = ({
  accountId,
  seasonId,
  selectedLeagueSeasonIds,
  leagues,
  leagueNameById,
  counts,
  onCountsChange,
}) => {
  if (!seasonId || selectedLeagueSeasonIds.length === 0 || leagues.length === 0) {
    return null;
  }

  const handleChange = (
    leagueSeasonId: string,
    field: 'inDivisionGameCount' | 'crossDivisionGameCount',
    rawValue: string,
  ) => {
    const parsed = parseInt(rawValue, 10);
    const value = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    const existing = counts.get(leagueSeasonId) ?? {
      leagueSeasonId,
      inDivisionGameCount: 0,
      crossDivisionGameCount: 0,
    };
    const next = new Map(counts);
    next.set(leagueSeasonId, { ...existing, [field]: value });
    saveRoundRobinCounts(accountId, seasonId, next);
    onCountsChange(next);
  };

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Round-Robin Game Counts</Typography>
          <Typography variant="body2" color="text.secondary">
            Per-league game counts for generating matchups. In-division and cross-division counts
            are applied per opponent pair.
          </Typography>
        </Box>

        {selectedLeagueSeasonIds.map((id) => {
          const leagueName = leagueNameById.get(id) ?? `League ${id}`;
          const entry = counts.get(id) ?? {
            leagueSeasonId: id,
            inDivisionGameCount: 0,
            crossDivisionGameCount: 0,
          };

          return (
            <Box key={id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="text.primary">
                {leagueName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  label="In-division games"
                  type="number"
                  size="small"
                  value={entry.inDivisionGameCount}
                  onChange={(event) => handleChange(id, 'inDivisionGameCount', event.target.value)}
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ width: 180 }}
                />
                <TextField
                  label="Cross-division games"
                  type="number"
                  size="small"
                  value={entry.crossDivisionGameCount}
                  onChange={(event) =>
                    handleChange(id, 'crossDivisionGameCount', event.target.value)
                  }
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ width: 200 }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </>
  );
};
