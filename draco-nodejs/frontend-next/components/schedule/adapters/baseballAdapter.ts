import {
  listAccountFields,
  listAccountUmpires,
  listSeasonGames,
  listSeasonLeagueSeasons,
  listTeamSeasonSchedule,
  createGame,
  updateGame,
  deleteGame,
} from '@draco/shared-api-client';
import type { TeamSeasonType } from '@draco/shared-schemas';
import { unwrapApiResult, ApiClientError } from '../../../utils/apiResult';
import { mapGameResponseToScheduleGame } from '../../../utils/gameTransformers';
import { mapLeagueSetup } from '../../../utils/leagueSeasonMapper';
import type {
  SportScheduleAdapter,
  ScheduleLocation,
  ScheduleOfficial,
  LoadLocationsParams,
  LoadOfficialsParams,
  LoadTeamsParams,
  LoadTeamsResult,
  LoadGamesParams,
  LoadTeamGamesParams,
  LoadTeamGameDateRangeParams,
  TeamGameDateRange,
  CreateGameParams,
  UpdateGameParams,
  DeleteGameParams,
} from '../types/sportAdapter';
import type { Game } from '@/types/schedule';
import { sortGamesAscending } from '../hooks/scheduleDateHelpers';
import GameDialog from '../dialogs/GameDialog';
import GameResultsDialog from '../dialogs/GameResultsDialog';

async function loadLocations({
  accountId,
  apiClient,
  signal,
}: LoadLocationsParams): Promise<ScheduleLocation[]> {
  const result = await listAccountFields({
    client: apiClient,
    path: { accountId },
    signal,
    throwOnError: false,
  });

  const data = unwrapApiResult(result, 'Failed to load fields');

  return data.fields.map((field) => ({
    id: field.id,
    name: field.name,
    shortName: field.shortName,
    address: field.address ?? undefined,
    city: field.city ?? undefined,
    state: field.state ?? undefined,
    zipCode: field.zip ?? undefined,
    latitude: field.latitude ? String(field.latitude) : undefined,
    longitude: field.longitude ? String(field.longitude) : undefined,
  }));
}

async function loadOfficials({
  accountId,
  apiClient,
}: LoadOfficialsParams): Promise<ScheduleOfficial[]> {
  try {
    const result = await listAccountUmpires({
      client: apiClient,
      path: { accountId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load umpires');

    return data.umpires.map((umpire) => ({
      id: umpire.id,
      contactId: umpire.contactId,
      firstName: umpire.firstName,
      lastName: umpire.lastName,
      email: umpire.email ?? '',
    }));
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      return [];
    }
    console.warn('Failed to load umpires:', err);
    return [];
  }
}

const API_PAGE_LIMIT = 100;

async function loadGames({
  accountId,
  seasonId,
  startDate,
  endDate,
  apiClient,
}: LoadGamesParams): Promise<Game[]> {
  const aggregated = new Map<string, Game>();
  let page = 1;

  while (true) {
    const result = await listSeasonGames({
      client: apiClient,
      path: { accountId, seasonId },
      query: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        sortOrder: 'asc',
        page,
        limit: API_PAGE_LIMIT,
      },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load games');
    const mappedGames = data.games.map(mapGameResponseToScheduleGame);

    mappedGames.forEach((game) => {
      aggregated.set(game.id, game);
    });

    const { total, limit } = data.pagination;
    if (limit === 0 || page * limit >= total) {
      break;
    }
    page += 1;
  }

  return Array.from(aggregated.values()).sort(sortGamesAscending);
}

async function loadTeamGames({
  accountId,
  seasonId,
  teamSeasonId,
  startDate,
  endDate,
  apiClient,
  signal,
}: LoadTeamGamesParams): Promise<Game[]> {
  const aggregated = new Map<string, Game>();
  let page = 1;

  while (true) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const result = await listTeamSeasonSchedule({
      client: apiClient,
      path: { accountId, seasonId, teamSeasonId },
      query: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        sortOrder: 'asc',
        page,
        limit: API_PAGE_LIMIT,
      },
      signal,
      throwOnError: false,
    });

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const data = unwrapApiResult(result, 'Failed to load team schedule');
    const mappedGames = data.games.map(mapGameResponseToScheduleGame);

    mappedGames.forEach((game) => {
      aggregated.set(game.id, game);
    });

    const { total, limit } = data.pagination;
    if (limit === 0 || page * limit >= total) {
      break;
    }
    page += 1;
  }

  return Array.from(aggregated.values()).sort(sortGamesAscending);
}

async function loadTeamGameDateRange({
  accountId,
  seasonId,
  teamSeasonId,
  apiClient,
  signal,
}: LoadTeamGameDateRangeParams): Promise<TeamGameDateRange> {
  const fetchBoundary = async (sortOrder: 'asc' | 'desc'): Promise<Date | null> => {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const result = await listTeamSeasonSchedule({
      client: apiClient,
      path: { accountId, seasonId, teamSeasonId },
      query: { page: 1, limit: 1, sortOrder },
      signal,
      throwOnError: false,
    });
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const data = unwrapApiResult(result, 'Failed to load team schedule range');
    const game = data.games[0];
    return game ? new Date(game.gameDate) : null;
  };

  const [earliest, latest] = await Promise.all([fetchBoundary('asc'), fetchBoundary('desc')]);
  return { earliest, latest };
}

async function createGameOperation({
  accountId,
  seasonId,
  data,
  apiClient,
}: CreateGameParams): Promise<Game> {
  const result = await createGame({
    client: apiClient,
    path: { accountId, seasonId },
    body: data as Parameters<typeof createGame>[0]['body'],
    throwOnError: false,
  });

  const createdGame = unwrapApiResult(result, 'Failed to create game');
  return mapGameResponseToScheduleGame(createdGame);
}

async function updateGameOperation({
  accountId,
  gameId,
  data,
  apiClient,
}: UpdateGameParams): Promise<Game> {
  const typedData = data as { seasonId: string } & Parameters<typeof updateGame>[0]['body'];

  const result = await updateGame({
    client: apiClient,
    path: {
      accountId,
      seasonId: typedData.seasonId,
      gameId,
    },
    body: typedData,
    throwOnError: false,
  });

  const updatedGame = unwrapApiResult(result, 'Failed to update game');
  return mapGameResponseToScheduleGame(updatedGame);
}

async function deleteGameOperation({
  accountId,
  seasonId,
  gameId,
  apiClient,
}: DeleteGameParams): Promise<void> {
  const result = await deleteGame({
    client: apiClient,
    path: { accountId, seasonId, gameId },
    throwOnError: false,
  });

  unwrapApiResult(result, 'Failed to delete game');
}

async function loadTeams({
  accountId,
  seasonId,
  apiClient,
  signal,
}: LoadTeamsParams): Promise<LoadTeamsResult> {
  const result = await listSeasonLeagueSeasons({
    client: apiClient,
    path: { accountId, seasonId },
    query: {
      includeTeams: true,
      includeUnassignedTeams: false,
    },
    signal,
    throwOnError: false,
  });

  const data = unwrapApiResult(result, 'Failed to load leagues');
  const mapped = mapLeagueSetup(data);

  const leagueTeamsCache = new Map<string, TeamSeasonType[]>();
  const leagues = mapped.leagueSeasons.map((leagueSeason) => {
    const teams: TeamSeasonType[] = [];
    leagueSeason.divisions?.forEach((division) => {
      division.teams.forEach((team) => {
        teams.push(team);
      });
    });
    leagueTeamsCache.set(leagueSeason.id, teams);
    return { id: leagueSeason.id, name: leagueSeason.league.name };
  });

  return { leagues, leagueTeamsCache };
}

export const baseballAdapter: SportScheduleAdapter = {
  sportType: 'baseball',
  locationLabel: 'Field',
  hasOfficials: true,
  officialLabel: 'Umpire',

  loadLocations,
  loadOfficials,
  loadTeams,
  loadGames,
  loadTeamGames,
  loadTeamGameDateRange,

  createGame: createGameOperation,
  updateGame: updateGameOperation,
  deleteGame: deleteGameOperation,

  GameDialog,
  ScoreEntryDialog: GameResultsDialog,
};
