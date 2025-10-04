import { leagueseason, Prisma } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbLeague,
  dbLeagueCreateInput,
  dbLeagueSeason,
  dbLeagueUpdateInput,
} from '../types/dbTypes.js';

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
  findLeagueSeason(
    leagueId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeason | null>;
}
