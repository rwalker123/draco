import type { GameType, TeamSeasonType } from '@draco/shared-schemas';
import { requestJson } from '../api/httpClient';
import type {
  ScorekeeperAssignment,
  ScheduleSnapshot,
  TeamSummary,
  UpcomingGame
} from '../../types/schedule';

type UpcomingGamesResponse = {
  games: GameType[];
};

type TeamsResponse = {
  teams: TeamSeasonType[];
};

type AssignmentsResponse = {
  assignments: ScorekeeperAssignment[];
};

const UPCOMING_GAMES_PATH = '/api/mobile/schedule/upcoming';
const TEAMS_PATH = '/api/mobile/teams';
const ASSIGNMENTS_PATH = '/api/mobile/scorekeeper-assignments';

export async function fetchScheduleSnapshot(token: string): Promise<ScheduleSnapshot> {
  const [upcoming, teams, assignments] = await Promise.all([
    fetchUpcomingGames(token),
    fetchTeams(token),
    fetchScorekeeperAssignments(token)
  ]);

  return {
    games: upcoming,
    teams,
    assignments
  };
}

export async function fetchUpcomingGames(token: string): Promise<UpcomingGame[]> {
  const response = await requestJson<UpcomingGamesResponse>(UPCOMING_GAMES_PATH, {
    token
  });

  return (response.games ?? []).map(normalizeUpcomingGame).sort(sortGamesChronologically);
}

export async function fetchTeams(token: string): Promise<TeamSummary[]> {
  const response = await requestJson<TeamsResponse>(TEAMS_PATH, {
    token
  });

  return (response.teams ?? []).map(normalizeTeam);
}

export async function fetchScorekeeperAssignments(token: string): Promise<ScorekeeperAssignment[]> {
  const response = await requestJson<AssignmentsResponse>(ASSIGNMENTS_PATH, {
    token
  });

  return (response.assignments ?? []).map(normalizeAssignment);
}

function normalizeUpcomingGame(game: GameType): UpcomingGame {
  return {
    id: game.id,
    gameDate: game.gameDate,
    startsAt: game.gameDate,
    homeTeam: game.homeTeam,
    visitorTeam: game.visitorTeam,
    field: game.field,
    league: game.league,
    season: game.season,
    gameStatus: game.gameStatus,
    gameStatusText: game.gameStatusText
  };
}

function normalizeTeam(team: TeamSeasonType): TeamSummary {
  return {
    id: team.id,
    name: team.name,
    league: team.league,
    division: team.division
  };
}

function normalizeAssignment(assignment: ScorekeeperAssignment): ScorekeeperAssignment {
  return {
    ...assignment,
    updatedAt: assignment.updatedAt ?? new Date().toISOString(),
    scope: assignment.scope
  };
}

function sortGamesChronologically(a: UpcomingGame, b: UpcomingGame): number {
  const dateDiff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  if (dateDiff !== 0) {
    return dateDiff;
  }

  return a.id.localeCompare(b.id);
}
