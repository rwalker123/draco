'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { SchedulerSeasonWindowConfig } from '@draco/shared-schemas';

type UmpiresPerGame = 1 | 2 | 3 | 4;

interface EntityOption {
  id: string;
  name: string;
}

interface SeasonSchedulerConfigPanelProps {
  seasonId: string | null;
  seasonWindowConfig: SchedulerSeasonWindowConfig | null;
  seasonStartDate: string;
  seasonEndDate: string;
  umpiresPerGame: UmpiresPerGame;
  maxGamesPerUmpirePerDayInput: string;
  leagues: EntityOption[];
  umpires: EntityOption[];
  selectedLeagueSeasonIds: string[];
  leagueSeasonIdFilter: string | undefined;
  leagueSeasonSelection: string[] | null;
  leagueNameById: Map<string, string>;
  onSeasonStartDateChange: (value: string) => void;
  onSeasonEndDateChange: (value: string) => void;
  onUmpiresPerGameChange: (value: UmpiresPerGame) => void;
  onMaxGamesPerUmpirePerDayChange: (value: string) => void;
  onLeagueSelectionChange: (ids: string[]) => void;
  onSave: () => void;
}

export const SeasonSchedulerConfigPanel: React.FC<SeasonSchedulerConfigPanelProps> = ({
  seasonId,
  seasonWindowConfig,
  seasonStartDate,
  seasonEndDate,
  umpiresPerGame,
  maxGamesPerUmpirePerDayInput,
  leagues,
  umpires,
  selectedLeagueSeasonIds,
  leagueSeasonIdFilter,
  leagueSeasonSelection,
  leagueNameById,
  onSeasonStartDateChange,
  onSeasonEndDateChange,
  onUmpiresPerGameChange,
  onMaxGamesPerUmpirePerDayChange,
  onLeagueSelectionChange,
  onSave,
}) => {
  const allLeagueSeasonIds = leagues.map((league) => league.id);

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Season Dates</Typography>
          {seasonId ? (
            <Typography variant="body2" color="text.secondary">
              {seasonWindowConfig
                ? `Configured: ${seasonWindowConfig.startDate}–${seasonWindowConfig.endDate}`
                : 'Not configured. Set start/end dates to enable scheduling.'}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading season…
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Season Start"
            type="date"
            size="small"
            value={seasonStartDate}
            onChange={(event) => onSeasonStartDateChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!seasonId}
          />
          <TextField
            label="Season End"
            type="date"
            size="small"
            value={seasonEndDate}
            onChange={(event) => onSeasonEndDateChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!seasonId}
          />
          <Button
            variant="contained"
            onClick={onSave}
            disabled={
              !seasonId || seasonStartDate.trim().length === 0 || seasonEndDate.trim().length === 0
            }
          >
            Save Scheduler Settings
          </Button>
        </Box>

        {seasonId && !seasonWindowConfig && (
          <Alert severity="info">
            Set the season scheduling window to begin. Enter start and end dates above and save.
          </Alert>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Leagues to Schedule</Typography>
          <Typography variant="body2" color="text.secondary">
            {leagues.length > 0
              ? `${selectedLeagueSeasonIds.length}/${leagues.length} league(s) selected.`
              : 'No leagues found for this season.'}
          </Typography>
          {leagueSeasonIdFilter && leagueSeasonSelection === null && (
            <Typography variant="caption" color="text.secondary">
              Defaulted from the schedule page league filter.
            </Typography>
          )}
        </Box>

        {leagues.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 320 }}>
              <InputLabel id="scheduler-leagues-filter">Leagues</InputLabel>
              <Select
                labelId="scheduler-leagues-filter"
                label="Leagues"
                multiple
                value={selectedLeagueSeasonIds}
                onChange={(event) => {
                  const next = Array.isArray(event.target.value)
                    ? event.target.value
                    : String(event.target.value).split(',');
                  if (next.length === 0) {
                    return;
                  }
                  onLeagueSelectionChange(next);
                }}
                renderValue={(selected) =>
                  selected.map((id) => leagueNameById.get(id) ?? `League ${id}`).join(', ')
                }
              >
                {leagues.map((league) => (
                  <MenuItem key={league.id} value={league.id}>
                    {league.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="outlined" onClick={() => onLeagueSelectionChange(allLeagueSeasonIds)}>
              Select All
            </Button>
          </Box>
        )}

        {leagues.length > 0 && selectedLeagueSeasonIds.length === 0 && (
          <Alert severity="warning">Select at least one league to schedule.</Alert>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Umpires Per Game</Typography>
          <Typography variant="body2" color="text.secondary">
            Sets the required umpire count for each scheduled game (applies to proposal generation
            only).
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 240 }} disabled={!seasonId}>
            <InputLabel id="scheduler-umpires-per-game">Umpires</InputLabel>
            <Select
              labelId="scheduler-umpires-per-game"
              label="Umpires"
              value={umpiresPerGame}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (next === 1 || next === 2 || next === 3 || next === 4) {
                  onUmpiresPerGameChange(next);
                }
              }}
            >
              <MenuItem value={1}>1 per game</MenuItem>
              <MenuItem value={2}>2 per game</MenuItem>
              <MenuItem value={3}>3 per game</MenuItem>
              <MenuItem value={4}>4 per game</MenuItem>
            </Select>
          </FormControl>
          {umpires.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {umpires.length} umpire(s) available for assignment.
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2">Umpire Max Games/Day</Typography>
          <Typography variant="body2" color="text.secondary">
            Optional global limit applied during proposal generation (leave blank for no limit).
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Max games/day per umpire"
            type="number"
            size="small"
            value={maxGamesPerUmpirePerDayInput}
            onChange={(event) => onMaxGamesPerUmpirePerDayChange(event.target.value)}
            inputProps={{ min: 1, step: 1 }}
            disabled={!seasonId}
          />
        </Box>
      </Box>
    </>
  );
};
