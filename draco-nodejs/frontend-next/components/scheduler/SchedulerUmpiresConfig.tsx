'use client';

import React from 'react';
import {
  Box,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type {
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
} from '@draco/shared-schemas';
import { CollapsibleSection } from './CollapsibleSection';
import { SchedulerUmpireBlackoutDates } from './SchedulerUmpireBlackoutDates';

type UmpiresPerGame = 1 | 2 | 3 | 4;
type UmpireOption = { id: string; name: string };

interface SchedulerUmpiresConfigProps {
  seasonId: string | null;
  timeZone: string;
  scheduleUmpires: boolean;
  umpiresPerGame: UmpiresPerGame;
  maxGamesPerUmpirePerDayInput: string;
  umpires: UmpireOption[];
  umpireNameById: Map<string, string>;
  umpireExclusions: SchedulerUmpireExclusion[];
  loading: boolean;
  onScheduleUmpiresChange: (value: boolean) => void;
  onUmpiresPerGameChange: (value: UmpiresPerGame) => void;
  onMaxGamesPerUmpirePerDayChange: (value: string) => void;
  onCreateUmpireExclusion: (input: SchedulerUmpireExclusionUpsert) => Promise<void>;
  onEditUmpireExclusion: (id: string, input: SchedulerUmpireExclusionUpsert) => Promise<void>;
  onDeleteUmpireExclusion: (exclusion: SchedulerUmpireExclusion) => Promise<void>;
}

export const SchedulerUmpiresConfig: React.FC<SchedulerUmpiresConfigProps> = ({
  seasonId,
  timeZone,
  scheduleUmpires,
  umpiresPerGame,
  maxGamesPerUmpirePerDayInput,
  umpires,
  umpireNameById,
  umpireExclusions,
  loading,
  onScheduleUmpiresChange,
  onUmpiresPerGameChange,
  onMaxGamesPerUmpirePerDayChange,
  onCreateUmpireExclusion,
  onEditUmpireExclusion,
  onDeleteUmpireExclusion,
}) => {
  const statusChipLabel = scheduleUmpires ? `${umpiresPerGame} per game` : 'Not scheduled';

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <CollapsibleSection
        title="Umpires"
        headerExtra={
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip size="small" label={statusChipLabel} />
            {scheduleUmpires && (
              <Chip
                size="small"
                label={`${umpireExclusions.length} blackout date${
                  umpireExclusions.length === 1 ? '' : 's'
                }`}
              />
            )}
          </Box>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={scheduleUmpires}
                onChange={(event) => onScheduleUmpiresChange(event.target.checked)}
                disabled={!seasonId}
              />
            }
            label="Schedule Umpires"
          />

          {scheduleUmpires && (
            <>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="subtitle2">Umpires Per Game:</Typography>
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
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="subtitle2">Umpire Max Games/Day:</Typography>
                <TextField
                  type="number"
                  size="small"
                  placeholder="No limit"
                  value={maxGamesPerUmpirePerDayInput}
                  onChange={(event) => onMaxGamesPerUmpirePerDayChange(event.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                  disabled={!seasonId}
                />
              </Box>

              <SchedulerUmpireBlackoutDates
                seasonId={seasonId}
                timeZone={timeZone}
                umpires={umpires}
                umpireNameById={umpireNameById}
                exclusions={umpireExclusions}
                loading={loading}
                onCreate={onCreateUmpireExclusion}
                onEdit={onEditUmpireExclusion}
                onDelete={onDeleteUmpireExclusion}
              />
            </>
          )}
        </Box>
      </CollapsibleSection>
    </>
  );
};
