import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';
import { GameStatus, type Game as ScheduleGame } from '@/types/schedule';
import type { ScheduleSummaryGame } from '../schedule/utils/buildScheduleSummary';
import { getGameStatusText, getGameStatusShortText } from '../../utils/gameUtils';

type Assignment = SchedulerSolveResult['assignments'][number];
type GameRequest = SchedulerProblemSpecPreview['games'][number];

export interface ProposalSummaryOption {
  id: string;
  name: string;
  divisionName?: string;
}

export interface ProposalSummaryFilters {
  leagueFilter: string;
  teamFilter: string;
}

export const collectProposalLeagueOptions = (
  assignments: Assignment[],
  gameRequestById: Map<string, GameRequest>,
  leagueNameById: Map<string, string>,
): ProposalSummaryOption[] => {
  const leagueIds = new Set<string>();
  for (const assignment of assignments) {
    const matchup = gameRequestById.get(assignment.gameId);
    if (matchup?.leagueSeasonId) {
      leagueIds.add(matchup.leagueSeasonId);
    }
  }
  return Array.from(leagueIds)
    .map((id) => ({ id, name: leagueNameById.get(id) ?? `League ${id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const collectProposalTeamOptions = (
  assignments: Assignment[],
  gameRequestById: Map<string, GameRequest>,
  teamNameById: Map<string, string>,
  leagueFilter: string,
  teamDivisionNameById?: Map<string, string>,
): ProposalSummaryOption[] => {
  const teamIds = new Set<string>();
  for (const assignment of assignments) {
    const matchup = gameRequestById.get(assignment.gameId);
    if (!matchup) continue;
    if (leagueFilter && matchup.leagueSeasonId !== leagueFilter) continue;
    teamIds.add(matchup.homeTeamSeasonId);
    teamIds.add(matchup.visitorTeamSeasonId);
  }
  return Array.from(teamIds)
    .map((id) => ({
      id,
      name: teamNameById.get(id) ?? `Team ${id}`,
      divisionName: teamDivisionNameById?.get(id) || undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const buildProposalSummaryGames = (
  assignments: Assignment[],
  gameRequestById: Map<string, GameRequest>,
  fieldNameById: Map<string, string>,
  filters: ProposalSummaryFilters,
): ScheduleSummaryGame[] => {
  const { leagueFilter, teamFilter } = filters;
  const games: ScheduleSummaryGame[] = [];
  for (const assignment of assignments) {
    const matchup = gameRequestById.get(assignment.gameId);
    if (leagueFilter && matchup?.leagueSeasonId !== leagueFilter) continue;
    if (
      teamFilter &&
      matchup?.homeTeamSeasonId !== teamFilter &&
      matchup?.visitorTeamSeasonId !== teamFilter
    ) {
      continue;
    }
    games.push({
      gameStatus: GameStatus.Scheduled,
      gameDate: assignment.startTime,
      fieldId: assignment.fieldId,
      field: {
        id: assignment.fieldId,
        name: assignment.fieldId
          ? fieldNameById.get(assignment.fieldId) || `Field ${assignment.fieldId}`
          : '',
        shortName: '',
      },
      homeTeamId: matchup?.homeTeamSeasonId,
      visitorTeamId: matchup?.visitorTeamSeasonId,
    });
  }
  return games;
};

export const buildMatchupLabel = (
  gameId: string,
  gameRequestById: Map<string, GameRequest>,
  teamNameById: Map<string, string>,
  leagueNameById: Map<string, string>,
): string => {
  const matchup = gameRequestById.get(gameId);
  if (!matchup) {
    return `Game ${gameId}`;
  }
  const home = teamNameById.get(matchup.homeTeamSeasonId) ?? 'Unknown Home';
  const visitor = teamNameById.get(matchup.visitorTeamSeasonId) ?? 'Unknown Visitor';
  const league = matchup.leagueSeasonId ? leagueNameById.get(matchup.leagueSeasonId) : undefined;
  const label = `${home} vs ${visitor}`;
  return league ? `[${league}] ${label}` : label;
};

export const buildProposalScheduleGames = (
  assignments: Assignment[],
  gameRequestById: Map<string, GameRequest>,
  fieldNameById: Map<string, string>,
  fieldShortNameById: Map<string, string>,
  teamNameById: Map<string, string>,
  leagueNameById: Map<string, string>,
  seasonId: string,
  seasonName: string,
): ScheduleGame[] => {
  const games: ScheduleGame[] = [];
  for (const assignment of assignments) {
    const matchup = gameRequestById.get(assignment.gameId);
    if (!matchup) {
      continue;
    }
    const fieldName = assignment.fieldId
      ? (fieldNameById.get(assignment.fieldId) ?? `Field ${assignment.fieldId}`)
      : '';
    const fieldShortName = assignment.fieldId
      ? (fieldShortNameById.get(assignment.fieldId) ?? fieldName)
      : '';
    games.push({
      id: assignment.gameId,
      gameDate: assignment.startTime,
      homeTeamId: matchup.homeTeamSeasonId,
      visitorTeamId: matchup.visitorTeamSeasonId,
      homeTeamName: teamNameById.get(matchup.homeTeamSeasonId) ?? 'Unknown Team',
      visitorTeamName: teamNameById.get(matchup.visitorTeamSeasonId) ?? 'Unknown Team',
      homeScore: 0,
      visitorScore: 0,
      comment: '',
      fieldId: assignment.fieldId,
      field: {
        id: assignment.fieldId,
        name: fieldName,
        shortName: fieldShortName,
        address: '',
        city: '',
        state: '',
      },
      gameStatus: GameStatus.Scheduled,
      gameStatusText: getGameStatusText(GameStatus.Scheduled),
      gameStatusShortText: getGameStatusShortText(GameStatus.Scheduled),
      gameType: 0,
      league: {
        id: matchup.leagueSeasonId ?? '',
        name: matchup.leagueSeasonId ? (leagueNameById.get(matchup.leagueSeasonId) ?? '') : '',
      },
      season: {
        id: seasonId,
        name: seasonName,
      },
    });
  }
  return games;
};
