import { teamseasonmanager } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbSeasonManagerWithRelations } from '../types/dbTypes.js';

export interface SeasonManagerRepositoryFilters {
  leagueSeasonId?: bigint;
  teamSeasonId?: bigint;
  search?: string;
}

export interface IManagerRepository extends IBaseRepository<teamseasonmanager> {
  findSeasonManagers(
    accountId: bigint,
    seasonId: bigint,
    filters?: SeasonManagerRepositoryFilters,
  ): Promise<dbSeasonManagerWithRelations[]>;
}
