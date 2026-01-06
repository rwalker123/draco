import {
  listGolfLeagueCourses,
  listGolfMatchesForSeason,
  listSeasonLeagueSeasons,
  createGolfMatch,
  updateGolfMatch,
  deleteGolfMatch,
} from '@draco/shared-api-client';
import type { GolfMatch, CreateGolfMatch, UpdateGolfMatch } from '@draco/shared-api-client';
import type { TeamSeasonType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../../utils/apiResult';
import { mapLeagueSetup } from '../../../utils/leagueSeasonMapper';
import type {
  SportScheduleAdapter,
  ScheduleLocation,
  LoadLocationsParams,
  LoadTeamsParams,
  LoadTeamsResult,
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
    gameDate: match.matchDateTime,
    homeTeamId: match.team1.id,
    visitorTeamId: match.team2.id,
    homeScore: match.team1TotalScore ?? 0,
    visitorScore: match.team2TotalScore ?? 0,
    homePoints: match.team1Points,
    visitorPoints: match.team2Points,
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
    teeId: match.tee?.id,
    tee: match.tee
      ? {
          id: match.tee.id,
          teeName: match.tee.teeName,
          teeColor: match.tee.teeColor,
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

async function loadGames({
  accountId,
  seasonId,
  startDate,
  endDate,
  apiClient,
}: LoadGamesParams): Promise<Game[]> {
  const result = await listGolfMatchesForSeason({
    client: apiClient,
    path: { accountId, seasonId },
    query: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
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

async function loadTeams({
  accountId,
  seasonId,
  apiClient,
}: LoadTeamsParams): Promise<LoadTeamsResult> {
  const result = await listSeasonLeagueSeasons({
    client: apiClient,
    path: { accountId, seasonId },
    query: {
      includeTeams: true,
      includeUnassignedTeams: true,
    },
    throwOnError: false,
  });

  const data = unwrapApiResult(result, 'Failed to load flights');
  const mapped = mapLeagueSetup(data);

  const leagueTeamsCache = new Map<string, TeamSeasonType[]>();
  const leagues = mapped.leagueSeasons.map((leagueSeason) => {
    leagueTeamsCache.set(leagueSeason.id, leagueSeason.unassignedTeams ?? []);
    return { id: leagueSeason.id, name: leagueSeason.league.name };
  });

  return { leagues, leagueTeamsCache };
}

export const golfAdapter: SportScheduleAdapter = {
  sportType: 'golf',
  locationLabel: 'Course',
  hasOfficials: false,

  loadLocations,
  loadTeams,
  loadGames,

  createGame: createGameOperation,
  updateGame: updateGameOperation,
  deleteGame: deleteGameOperation,

  GameDialog: GolfMatchDialog,
  ScoreEntryDialog: GolfScoreEntryDialog,
};
