'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';
import SeasonSummaryWidget from '../schedule/SeasonSummaryWidget';
import LeagueTeamFilter from '../schedule/LeagueTeamFilter';
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
  teamDivisionNameById: Map<string, string>;
  leagueNameById: Map<string, string>;
  timeZone: string;
}

export const ScheduleProposalSummary: React.FC<ScheduleProposalSummaryProps> = ({
  assignments,
  gameRequestById,
  fieldNameById,
  teamNameById,
  teamDivisionNameById,
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
    teamDivisionNameById,
  );

  const summaryGames = buildProposalSummaryGames(assignments, gameRequestById, fieldNameById, {
    leagueFilter,
    teamFilter,
  });

  const summary = buildScheduleSummary(summaryGames, {
    timeZone,
    teamSeasonId: teamFilter || undefined,
  });

  const handleLeagueChange = (leagueId: string) => {
    setLeagueFilter(leagueId);
    setTeamFilter('');
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <LeagueTeamFilter
          leagues={leagueOptions}
          teams={teamOptions}
          leagueValue={leagueFilter}
          teamValue={teamFilter}
          onLeagueChange={handleLeagueChange}
          onTeamChange={setTeamFilter}
        />
      </Box>
      {summary.totalGames > 0 ? (
        <SeasonSummaryWidget
          variant="embedded"
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
