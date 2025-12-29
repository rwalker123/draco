import {
  listGolfLeagueCourses,
  listGolfMatchesForSeason,
  createGolfMatch,
  updateGolfMatch,
  deleteGolfMatch,
} from '@draco/shared-api-client';
import type { GolfMatch, CreateGolfMatch, UpdateGolfMatch } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../../utils/apiResult';
import type {
  SportScheduleAdapter,
  ScheduleLocation,
  LoadLocationsParams,
  LoadGamesParams,
  CreateGameParams,
  UpdateGameParams,
  DeleteGameParams,
} from '../types/sportAdapter';
import type { Game } from '@/types/schedule';
import GolfMatchDialog from '../dialogs/GolfMatchDialog';
import GolfScoreEntryDialog from '../dialogs/GolfScoreEntryDialog';

function getGameStatusText(status: number): string {
  switch (status) {
    case 0:
      return 'Scheduled';
    case 1:
      return 'Completed';
    case 2:
      return 'Rainout';
    case 3:
      return 'Postponed';
    case 4:
      return 'Forfeit';
    default:
      return 'Unknown';
  }
}

function getGameStatusShortText(status: number): string {
  switch (status) {
    case 0:
      return 'Sched';
    case 1:
      return 'Final';
    case 2:
      return 'Rain';
    case 3:
      return 'Ppd';
    case 4:
      return 'Forf';
    default:
      return '?';
  }
}

function mapGolfMatchToGame(match: GolfMatch): Game {
  return {
    id: match.id,
    gameDate: match.matchDate,
    homeTeamId: match.team1.id,
    visitorTeamId: match.team2.id,
    homeScore: 0,
    visitorScore: 0,
    comment: match.comment ?? '',
    fieldId: match.course?.id,
    field: match.course
      ? {
          id: match.course.id,
          name: match.course.name,
          shortName: match.course.name,
          address: match.course.address ?? '',
          city: match.course.city ?? '',
          state: match.course.state ?? '',
        }
      : undefined,
    gameStatus: match.matchStatus,
    gameStatusText: getGameStatusText(match.matchStatus),
    gameStatusShortText: getGameStatusShortText(match.matchStatus),
    gameType: match.matchType,
    league: {
      id: match.leagueSeasonId,
      name: '',
    },
    season: {
      id: match.leagueSeasonId,
      name: '',
    },
  };
}

async function loadLocations({
  accountId,
  apiClient,
}: LoadLocationsParams): Promise<ScheduleLocation[]> {
  const result = await listGolfLeagueCourses({
    client: apiClient,
    path: { accountId },
    throwOnError: false,
  });

  const leagueCourses = unwrapApiResult(result, 'Failed to load courses');

  return leagueCourses.map((leagueCourse) => ({
    id: leagueCourse.course.id,
    name: leagueCourse.course.name,
    shortName: leagueCourse.course.name,
    address: leagueCourse.course.address ?? undefined,
    city: leagueCourse.course.city ?? undefined,
    state: leagueCourse.course.state ?? undefined,
    zipCode: leagueCourse.course.zip ?? undefined,
    latitude: undefined,
    longitude: undefined,
  }));
}

async function loadGames({ accountId, seasonId, apiClient }: LoadGamesParams): Promise<Game[]> {
  const result = await listGolfMatchesForSeason({
    client: apiClient,
    path: { accountId, seasonId },
    throwOnError: false,
  });

  const matches = unwrapApiResult(result, 'Failed to load matches');

  return matches.map(mapGolfMatchToGame);
}

async function createGameOperation({
  accountId,
  seasonId,
  data,
  apiClient,
}: CreateGameParams): Promise<Game> {
  const matchData = data as CreateGolfMatch;

  const result = await createGolfMatch({
    client: apiClient,
    path: { accountId, seasonId },
    body: matchData,
    throwOnError: false,
  });

  const match = unwrapApiResult(result, 'Failed to create match');

  return mapGolfMatchToGame(match);
}

async function updateGameOperation({
  accountId,
  gameId,
  data,
  apiClient,
}: UpdateGameParams): Promise<Game> {
  const matchData = data as UpdateGolfMatch;

  const result = await updateGolfMatch({
    client: apiClient,
    path: { accountId, matchId: gameId },
    body: matchData,
    throwOnError: false,
  });

  const match = unwrapApiResult(result, 'Failed to update match');

  return mapGolfMatchToGame(match);
}

async function deleteGameOperation({
  accountId,
  gameId,
  apiClient,
}: DeleteGameParams): Promise<void> {
  const result = await deleteGolfMatch({
    client: apiClient,
    path: { accountId, matchId: gameId },
    throwOnError: false,
  });

  if (result.error) {
    throw new Error('Failed to delete match');
  }
}

export const golfAdapter: SportScheduleAdapter = {
  sportType: 'golf',
  locationLabel: 'Course',
  hasOfficials: false,

  loadLocations,
  loadGames,

  createGame: createGameOperation,
  updateGame: updateGameOperation,
  deleteGame: deleteGameOperation,

  GameDialog: GolfMatchDialog,
  ScoreEntryDialog: GolfScoreEntryDialog,
};
