import { listGolfLeagueCourses } from '@draco/shared-api-client';
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
  apiClient: _apiClient,
}: LoadGamesParams): Promise<Game[]> {
  // TODO: Implement when golf match API endpoints are added to OpenAPI spec
  // For now, return empty array - golf matches will be loaded when API is available
  console.log('Golf match loading not yet implemented - waiting for API endpoints', {
    accountId,
    seasonId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  return [];
}

async function createGameOperation(_params: CreateGameParams): Promise<Game> {
  // TODO: Implement when golf match API endpoints are added to OpenAPI spec
  throw new Error('Golf match creation not yet implemented - waiting for API endpoints');
}

async function updateGameOperation(_params: UpdateGameParams): Promise<Game> {
  // TODO: Implement when golf match API endpoints are added to OpenAPI spec
  throw new Error('Golf match update not yet implemented - waiting for API endpoints');
}

async function deleteGameOperation(_params: DeleteGameParams): Promise<void> {
  // TODO: Implement when golf match API endpoints are added to OpenAPI spec
  throw new Error('Golf match deletion not yet implemented - waiting for API endpoints');
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
