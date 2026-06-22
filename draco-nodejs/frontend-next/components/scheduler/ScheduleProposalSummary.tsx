'use client';

import React, { useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';
import SeasonSummaryWidget from '../schedule/SeasonSummaryWidget';
import { buildScheduleSummary } from '../schedule/utils/buildScheduleSummary';
import {
  buildProposalSummaryGames,
  collectProposalLeagueOptions,
  collectProposalTeamOptions,
} from './proposalSummary';

type Assignment = SchedulerSolveResult['assignments'][number];
type GameRequest = SchedulerProblemSpecPreview['games'][number];

interface ScheduleProposalSummaryProps {
  assignments: Assignment[];
  gameRequestById: Map<string, GameRequest>;
  fieldNameById: Map<string, string>;
  teamNameById: Map<string, string>;
  leagueNameById: Map<string, string>;
  timeZone: string;
}

export const ScheduleProposalSummary: React.FC<ScheduleProposalSummaryProps> = ({
  assignments,
  gameRequestById,
  fieldNameById,
  teamNameById,
  leagueNameById,
  timeZone,
}) => {
  const [leagueFilter, setLeagueFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const leagueOptions = collectProposalLeagueOptions(assignments, gameRequestById, leagueNameById);
  const teamOptions = collectProposalTeamOptions(
    assignments,
    gameRequestById,
    teamNameById,
    leagueFilter,
  );

  const summaryGames = buildProposalSummaryGames(assignments, gameRequestById, fieldNameById, {
    leagueFilter,
    teamFilter,
  });

  const summary = buildScheduleSummary(summaryGames, {
    timeZone,
    teamSeasonId: teamFilter || undefined,
  });

  const handleLeagueChange = (event: SelectChangeEvent) => {
    setLeagueFilter(event.target.value);
    setTeamFilter('');
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="proposal-summary-league">League</InputLabel>
          <Select
            labelId="proposal-summary-league"
            label="League"
            value={leagueFilter}
            onChange={handleLeagueChange}
          >
            <MenuItem value="">All leagues</MenuItem>
            {leagueOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="proposal-summary-team">Team</InputLabel>
          <Select
            labelId="proposal-summary-team"
            label="Team"
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
          >
            <MenuItem value="">All teams</MenuItem>
            {teamOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {summary.totalGames > 0 ? (
        <SeasonSummaryWidget
          title="Schedule Proposal Summary"
          summary={summary}
          loading={false}
          ready
          timeZone={timeZone}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No scheduled games match these filters.
        </Typography>
      )}
    </Box>
  );
};
