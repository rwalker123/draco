import type { SchedulerProblemSpecPreview, SchedulerSolveResult } from '@draco/shared-schemas';
import { GameStatus } from '@/types/schedule';
import type { ScheduleSummaryGame } from '../schedule/utils/buildScheduleSummary';

type Assignment = SchedulerSolveResult['assignments'][number];
type GameRequest = SchedulerProblemSpecPreview['games'][number];

export interface ProposalSummaryOption {
  id: string;
  name: string;
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
    .map((id) => ({ id, name: teamNameById.get(id) ?? `Team ${id}` }))
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
        name: fieldNameById.get(assignment.fieldId) ?? '',
        shortName: '',
      },
      homeTeamId: matchup?.homeTeamSeasonId,
      visitorTeamId: matchup?.visitorTeamSeasonId,
    });
  }
  return games;
};
