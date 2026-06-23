'use client';

import React, { useState } from 'react';
import type {
  SchedulerProblemSpecPreview,
  SchedulerSolveResult,
  TeamSeasonType,
} from '@draco/shared-schemas';
import { ScheduleControl, useScheduleFilters } from '../schedule';
import type { ScheduleLocation } from '../schedule/types/sportAdapter';
import { convertGameToGameCardData } from '../../utils/gameTransformers';
import type { Game, League } from '@/types/schedule';
import {
  buildProposalScheduleGames,
  collectProposalLeagueOptions,
  collectProposalTeamOptions,
} from './proposalSummary';

type GameRequest = SchedulerProblemSpecPreview['games'][number];

interface ProposedScheduleControlProps {
  accountId: string;
  seasonId: string;
  seasonName: string | null;
  timeZone: string;
  proposal: SchedulerSolveResult;
  gameRequestById: Map<string, GameRequest>;
  fieldNameById: Map<string, string>;
  fieldShortNameById: Map<string, string>;
  teamNameById: Map<string, string>;
  leagueNameById: Map<string, string>;
  teams: TeamSeasonType[];
  locations: ScheduleLocation[];
}

const getEarliestAssignmentDate = (proposal: SchedulerSolveResult): Date => {
  const times = proposal.assignments
    .map((assignment) => new Date(assignment.startTime).getTime())
    .filter((time) => Number.isFinite(time));
  if (times.length === 0) {
    return new Date();
  }
  return new Date(Math.min(...times));
};

export const ProposedScheduleControl: React.FC<ProposedScheduleControlProps> = ({
  accountId,
  seasonId,
  seasonName,
  timeZone,
  proposal,
  gameRequestById,
  fieldNameById,
  fieldShortNameById,
  teamNameById,
  leagueNameById,
  teams,
  locations,
}) => {
  const [filterDate, setFilterDate] = useState<Date>(() => getEarliestAssignmentDate(proposal));
  const [trackedRunId, setTrackedRunId] = useState(proposal.runId);

  if (proposal.runId !== trackedRunId) {
    setTrackedRunId(proposal.runId);
    setFilterDate(getEarliestAssignmentDate(proposal));
  }

  const scheduleGames = buildProposalScheduleGames(
    proposal.assignments,
    gameRequestById,
    fieldNameById,
    fieldShortNameById,
    teamNameById,
    leagueNameById,
    seasonId,
    seasonName ?? '',
  );

  const {
    filterType,
    filterLeagueSeasonId,
    filterTeamSeasonId,
    viewMode,
    startDate,
    endDate,
    isNavigating,
    setFilterType,
    setFilterLeagueSeasonId,
    setFilterTeamSeasonId,
    setViewMode,
    navigateToWeek,
    navigate,
    filteredGames,
  } = useScheduleFilters({ games: scheduleGames, filterDate, setFilterDate });

  const proposalLeagues: League[] = collectProposalLeagueOptions(
    proposal.assignments,
    gameRequestById,
    leagueNameById,
  ).map((option) => ({ id: option.id, name: option.name }));

  const proposalTeamIds = new Set(
    collectProposalTeamOptions(
      proposal.assignments,
      gameRequestById,
      teamNameById,
      filterLeagueSeasonId,
    ).map((option) => option.id),
  );
  const proposalLeagueTeams = teams.filter((team) => proposalTeamIds.has(team.id));

  return (
    <ScheduleControl
      accountId={accountId}
      filteredGames={filteredGames}
      leagues={proposalLeagues}
      leagueTeams={proposalLeagueTeams}
      loadingGames={false}
      filterType={filterType}
      filterDate={filterDate}
      filterLeagueSeasonId={filterLeagueSeasonId}
      filterTeamSeasonId={filterTeamSeasonId}
      viewMode={viewMode}
      setFilterType={setFilterType}
      setFilterLeagueSeasonId={setFilterLeagueSeasonId}
      setFilterTeamSeasonId={setFilterTeamSeasonId}
      onViewModeChange={setViewMode}
      clearLeagueTeams={() => {}}
      startDate={startDate}
      endDate={endDate}
      isNavigating={isNavigating}
      navigateToWeek={navigateToWeek}
      navigate={navigate}
      setFilterDate={setFilterDate}
      timeZone={timeZone}
      convertGameToGameCardData={(game: Game) => convertGameToGameCardData(game, teams, locations)}
      canEditSchedule={false}
      showLeagueTeamFilters
      readOnly
    />
  );
};
