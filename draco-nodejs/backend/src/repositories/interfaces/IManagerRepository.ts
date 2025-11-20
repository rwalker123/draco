import { teamseasonmanager } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbSeasonManagerWithRelations, dbTeamManagerWithContact } from '../types/dbTypes.js';

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
  findTeamManagers(teamSeasonId: bigint): Promise<dbTeamManagerWithContact[]>;
  createTeamManager(teamSeasonId: bigint, contactId: bigint): Promise<dbTeamManagerWithContact>;
  findTeamManager(teamSeasonId: bigint, contactId: bigint): Promise<teamseasonmanager | null>;
}
