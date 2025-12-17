import { Prisma, leagueschedule, teamsseason, gamerecap } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbScheduleGameWithDetails,
  dbScheduleGameForAccount,
  dbScheduleGameWithRecaps,
  dbGameRecap,
  dbScheduleCreateData,
  dbScheduleUpdateData,
  dbScheduleResultUpdateData,
  dbGameInfo,
} from '../types/index.js';

export interface ScheduleListFilters {
  dateRange?: { start?: Date; end?: Date };
  teamId?: bigint;
  includeRecaps?: boolean;
}

export interface ScheduleListOptions {
  skip: number;
  take: number;
  sortOrder: Prisma.SortOrder;
}

export interface IScheduleRepository extends IBaseRepository<leagueschedule> {
  findGameWithAccountContext(
    gameId: bigint,
    accountId: bigint,
  ): Promise<dbScheduleGameForAccount | null>;
  findGameWithDetails(gameId: bigint): Promise<dbScheduleGameWithDetails | null>;
  listSeasonGames(
    seasonId: bigint,
    filters: ScheduleListFilters,
    options: ScheduleListOptions,
  ): Promise<dbScheduleGameWithDetails[] | dbScheduleGameWithRecaps[]>;
  countSeasonGames(seasonId: bigint, filters: ScheduleListFilters): Promise<number>;
  findTeamsInLeagueSeason(
    leagueSeasonId: bigint,
    seasonId: bigint,
    teamIds: bigint[],
  ): Promise<teamsseason[]>;
  createGame(data: dbScheduleCreateData): Promise<dbScheduleGameWithDetails>;
  updateGame(gameId: bigint, data: dbScheduleUpdateData): Promise<dbScheduleGameWithDetails>;
  updateGameResults(
    gameId: bigint,
    data: dbScheduleResultUpdateData,
  ): Promise<dbScheduleGameWithDetails>;
  deleteGame(gameId: bigint): Promise<void>;
  findFieldConflict(
    fieldId: bigint,
    gameDate: Date,
    leagueSeasonId: bigint,
    excludeGameId?: bigint,
  ): Promise<leagueschedule | null>;
  countFieldBookingsAtTime(
    fieldId: bigint,
    gameDate: Date,
    leagueSeasonId: bigint,
    excludeGameId?: bigint,
  ): Promise<number>;
  countTeamBookingsAtTime(
    teamSeasonId: bigint,
    gameDate: Date,
    leagueSeasonId: bigint,
    excludeGameId?: bigint,
  ): Promise<number>;
  countUmpireBookingsAtTime(
    umpireId: bigint,
    gameDate: Date,
    leagueSeasonId: bigint,
    excludeGameId?: bigint,
  ): Promise<number>;
  countTeamGamesInRange(
    teamSeasonId: bigint,
    start: Date,
    end: Date,
    leagueSeasonId: bigint,
    excludeGameId?: bigint,
  ): Promise<number>;
  countUmpireGamesInRange(
    umpireId: bigint,
    start: Date,
    end: Date,
    leagueSeasonId: bigint,
    excludeGameId?: bigint,
  ): Promise<number>;
  findRecap(gameId: bigint, teamSeasonId: bigint): Promise<dbGameRecap | null>;
  upsertRecap(gameId: bigint, teamSeasonId: bigint, recap: string): Promise<gamerecap>;
  getTeamNames(teamIds: bigint[]): Promise<Map<string, string>>;
  listUpcomingGamesForTeam(
    teamSeasonId: bigint,
    seasonId: bigint,
    limit: number,
    referenceDate: Date,
  ): Promise<dbGameInfo[]>;
  listRecentGamesForTeam(
    teamSeasonId: bigint,
    seasonId: bigint,
    limit: number,
    referenceDate: Date,
  ): Promise<dbGameInfo[]>;
}
