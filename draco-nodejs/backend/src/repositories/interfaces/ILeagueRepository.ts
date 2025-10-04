import { leagueseason, Prisma } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbDivisionDefinition,
  dbDivisionSeasonWithDefinition,
  dbDivisionSeasonWithTeams,
  dbLeague,
  dbLeagueSeason,
  dbLeagueCreateInput,
  dbLeagueSeasonRecord,
  dbLeagueSeasonWithCounts,
  dbLeagueSeasonWithDivisionDetails,
  dbLeagueSeasonWithTeams,
  dbLeagueUpdateInput,
  dbScheduleGameWithDetails,
  dbTeamSeasonCountResult,
  dbTeamSeasonWithTeam,
} from '../types/dbTypes.js';

export interface LeagueSeasonListOptions {
  includeTeams?: boolean;
}

export interface LeagueSeasonGameFilters {
  startDate?: Date;
  endDate?: Date;
  teamId?: bigint;
}

export interface ILeagueRepository
  extends IBaseRepository<
    leagueseason,
    Prisma.leagueseasonCreateInput,
    Prisma.leagueseasonUpdateInput
  > {
  findAccountLeagues(accountId: bigint): Promise<dbLeague[]>;
  findLeaguesWithSeasons(accountId: bigint): Promise<dbLeague[]>;
  findLeagueById(accountId: bigint, leagueId: bigint): Promise<dbLeague | null>;
  findLeagueByName(accountId: bigint, name: string): Promise<dbLeague | null>;
  findLeagueByNameExcludingId(
    accountId: bigint,
    name: string,
    excludeLeagueId: bigint,
  ): Promise<dbLeague | null>;
  createLeague(data: dbLeagueCreateInput): Promise<dbLeague>;
  updateLeague(leagueId: bigint, data: dbLeagueUpdateInput): Promise<dbLeague>;
  deleteLeague(leagueId: bigint): Promise<dbLeague>;
  hasLeagueSeasons(leagueId: bigint): Promise<boolean>;
  findSeasonLeagueSeasons(
    seasonId: bigint,
    accountId: bigint,
    options?: LeagueSeasonListOptions,
  ): Promise<dbLeagueSeasonWithTeams[]>;
  findLeagueSeasonById(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeasonWithDivisionDetails | null>;
  findLeagueSeason(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeason | null>;
  findLeagueSeasonRecord(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeasonRecord | null>;
  findLeagueSeasonByLeague(
    leagueId: bigint,
    seasonId: bigint,
  ): Promise<dbLeagueSeasonRecord | null>;
  createLeagueSeason(seasonId: bigint, leagueId: bigint): Promise<dbLeagueSeasonRecord>;
  deleteLeagueSeason(leagueSeasonId: bigint): Promise<void>;
  getLeagueSeasonRelationCounts(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeasonWithCounts | null>;
  getPlayerCountsForLeagueSeasons(
    leagueSeasonIds: bigint[],
    accountId: bigint,
  ): Promise<dbTeamSeasonCountResult[]>;
  getManagerCountsForLeagueSeasons(
    leagueSeasonIds: bigint[],
    accountId: bigint,
  ): Promise<dbTeamSeasonCountResult[]>;
  findDivisionSeasons(
    leagueSeasonId: bigint,
    accountId: bigint,
  ): Promise<dbDivisionSeasonWithTeams[]>;
  findDivisionSeasonById(
    divisionSeasonId: bigint,
    leagueSeasonId: bigint,
    accountId: bigint,
  ): Promise<dbDivisionSeasonWithDefinition | null>;
  findDivisionSeasonByDivision(
    leagueSeasonId: bigint,
    divisionId: bigint,
  ): Promise<dbDivisionSeasonWithDefinition | null>;
  createDivisionSeason(
    leagueSeasonId: bigint,
    divisionId: bigint,
    priority: number,
  ): Promise<dbDivisionSeasonWithDefinition>;
  updateDivisionSeasonPriority(divisionSeasonId: bigint, priority: number): Promise<void>;
  deleteDivisionSeason(divisionSeasonId: bigint): Promise<void>;
  divisionSeasonHasTeams(divisionSeasonId: bigint): Promise<boolean>;
  findDivisionDefinitionById(
    accountId: bigint,
    divisionId: bigint,
  ): Promise<dbDivisionDefinition | null>;
  findDivisionDefinitionByName(
    accountId: bigint,
    name: string,
  ): Promise<dbDivisionDefinition | null>;
  createDivisionDefinition(accountId: bigint, name: string): Promise<dbDivisionDefinition>;
  updateDivisionDefinitionName(divisionId: bigint, name: string): Promise<dbDivisionDefinition>;
  findTeamSeasonsByIds(teamSeasonIds: bigint[]): Promise<dbTeamSeasonWithTeam[]>;
  updateTeamSeasonDivision(teamSeasonId: bigint, divisionSeasonId: bigint | null): Promise<void>;
  findLeagueSeasonGames(
    leagueSeasonId: bigint,
    accountId: bigint,
    filters?: LeagueSeasonGameFilters,
  ): Promise<dbScheduleGameWithDetails[]>;
}
