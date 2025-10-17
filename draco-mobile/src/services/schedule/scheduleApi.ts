import {
  getAccountUserTeams,
  getCurrentSeason,
  getCurrentUserRoles,
  listSeasonGames,
  listSeasonTeams,
  type GamesWithRecaps,
  type RegisteredUserWithRoles,
  type TeamSeason
} from '@draco/shared-api-client';
import type { LeagueSeasonWithDivision } from '@draco/shared-api-client';
import type {
  ScorekeeperAssignment,
  ScheduleSnapshot,
  TeamSummary,
  UpcomingGame
} from '../../types/schedule';
import { createApiClient } from '../api/apiClient';
import { getApiErrorMessage, unwrapApiResult } from '../api/apiResult';

type FetchScheduleParams = {
  token: string;
  accountId: string;
};

const ROLE_SCOPE_MAP: Record<string, ScorekeeperAssignment['scope']> = {
  AccountAdmin: 'account',
  LeagueAdmin: 'league',
  TeamAdmin: 'team'
};

const UPCOMING_LIMIT = 50;
const RECENT_BUFFER_MS = 1000 * 60 * 60 * 6; // include games up to 6 hours ago to cover in-progress games

export async function fetchScheduleSnapshot({ token, accountId }: FetchScheduleParams): Promise<ScheduleSnapshot> {
  const client = createApiClient({ token });

  const currentSeason = await loadCurrentSeason(client, accountId);

  const [teamsResult, gamesResult, userTeamsResult, rolesResult] = await Promise.all([
    listSeasonTeams({
      client,
      path: { accountId, seasonId: currentSeason.id },
      throwOnError: false
    }),
    listSeasonGames({
      client,
      path: { accountId, seasonId: currentSeason.id },
      query: { startDate: new Date(Date.now() - RECENT_BUFFER_MS).toISOString(), sortOrder: 'asc', limit: UPCOMING_LIMIT },
      throwOnError: false
    }),
    getAccountUserTeams({
      client,
      path: { accountId },
      throwOnError: false
    }),
    getCurrentUserRoles({
      client,
      query: { accountId },
      throwOnError: false
    })
  ]);

  const teams = unwrapApiResult<TeamSeason[]>(teamsResult, 'Failed to load teams for the season');
  const rawGames = unwrapApiResult<GamesWithRecaps>(gamesResult, 'Failed to load upcoming games').games ?? [];
  const userTeams = unwrapApiResult<TeamSeason[]>(userTeamsResult, 'Failed to load teams assigned to the user');
  const userRoles = unwrapApiResult<RegisteredUserWithRoles>(rolesResult, 'Failed to load user roles');

  const assignments = buildAssignments(accountId, userRoles, userTeams);
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  const upcomingGames = buildUpcomingGames(rawGames, assignments, teamsById);
  const normalizedTeams = teams.map(normalizeTeam);

  return {
    games: upcomingGames,
    teams: normalizedTeams,
    assignments
  };
}

async function loadCurrentSeason(
  client: ReturnType<typeof createApiClient>,
  accountId: string,
): Promise<LeagueSeasonWithDivision> {
  const result = await getCurrentSeason({
    client,
    path: { accountId },
    throwOnError: false
  });

  const data = result.data;
  if (data) {
    return data as LeagueSeasonWithDivision;
  }

  if (result.error) {
    throw new Error(getApiErrorMessage(result.error, 'Failed to load the current season for this account.'));
  }

  throw new Error('No current season is configured for this account.');
}

function buildUpcomingGames(
  games: GamesWithRecaps['games'],
  assignments: ScorekeeperAssignment[],
  teamsById: Map<string, TeamSeason>,
): UpcomingGame[] {
  const allowAll = assignments.some((assignment) => assignment.scope === 'account');
  const leagueIds = new Set(
    assignments
      .filter((assignment) => assignment.scope === 'league' && assignment.leagueId)
      .map((assignment) => assignment.leagueId as string),
  );
  const teamSeasonIds = new Set(
    assignments
      .filter((assignment) => assignment.scope === 'team' && assignment.teamSeasonId)
      .map((assignment) => assignment.teamSeasonId as string),
  );

  const now = Date.now();

  return games
    .filter((game) => new Date(game.gameDate).getTime() >= now - RECENT_BUFFER_MS)
    .filter((game) =>
      allowAll ||
      teamSeasonIds.has(game.homeTeam.id) ||
      teamSeasonIds.has(game.visitorTeam.id) ||
      (game.league?.id ? leagueIds.has(game.league.id) : false),
    )
    .slice(0, UPCOMING_LIMIT)
    .map((game) => normalizeUpcomingGame(game, teamsById))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

function buildAssignments(
  accountId: string,
  roles: RegisteredUserWithRoles,
  userTeams: TeamSeason[],
): ScorekeeperAssignment[] {
  const nowIso = new Date().toISOString();
  const assignments: ScorekeeperAssignment[] = [];
  const seen = new Set<string>();
  const teamLookup = new Map(userTeams.map((team) => [team.id, team]));

  const contactRoles = roles.contactRoles ?? [];
  contactRoles.forEach((role) => {
    if (role.accountId && role.accountId !== accountId) {
      return;
    }

    const scope = ROLE_SCOPE_MAP[role.roleId ?? ''];
    if (!scope) {
      return;
    }

    if (scope === 'account') {
      const id = `account-${accountId}`;
      if (!seen.has(id)) {
        assignments.push({ id, scope, accountId, updatedAt: nowIso });
        seen.add(id);
      }
      return;
    }

    if (scope === 'league' && role.roleData) {
      const id = `league-${role.roleData}`;
      if (!seen.has(id)) {
        assignments.push({ id, scope, accountId, leagueId: role.roleData, updatedAt: nowIso });
        seen.add(id);
      }
      return;
    }

    if (scope === 'team' && role.roleData) {
      const id = `team-${role.roleData}`;
      if (seen.has(id)) {
        return;
      }
      const team = teamLookup.get(role.roleData);
      assignments.push({
        id,
        scope,
        accountId,
        teamSeasonId: role.roleData,
        teamId: team?.team?.id ?? undefined,
        leagueId: team?.league?.id ?? undefined,
        updatedAt: nowIso
      });
      seen.add(id);
    }
  });

  if (assignments.length === 0) {
    userTeams.forEach((team) => {
      const id = `team-${team.id}`;
      if (seen.has(id)) {
        return;
      }

      assignments.push({
        id,
        scope: 'team',
        accountId,
        teamSeasonId: team.id,
        teamId: team.team?.id ?? undefined,
        leagueId: team.league?.id ?? undefined,
        updatedAt: nowIso
      });
      seen.add(id);
    });
  }

  return assignments;
}

function normalizeTeam(team: TeamSeason): TeamSummary {
  return {
    id: team.id,
    name: team.name,
    league: team.league,
    division: team.division
  };
}

function normalizeUpcomingGame(game: GamesWithRecaps['games'][number], teamsById: Map<string, TeamSeason>): UpcomingGame {
  const resolvedHome = teamsById.get(game.homeTeam.id);
  const resolvedVisitor = teamsById.get(game.visitorTeam.id);

  return {
    id: game.id,
    gameDate: game.gameDate,
    startsAt: game.gameDate,
    homeTeam: resolvedHome ? { id: resolvedHome.id, name: resolvedHome.name } : game.homeTeam,
    visitorTeam: resolvedVisitor ? { id: resolvedVisitor.id, name: resolvedVisitor.name } : game.visitorTeam,
    field: game.field,
    league: game.league,
    season: game.season,
    gameStatus: game.gameStatus,
    gameStatusText: game.gameStatusText
  };
}
