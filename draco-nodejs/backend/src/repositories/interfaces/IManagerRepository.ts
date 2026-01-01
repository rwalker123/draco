import { teamseasonmanager } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbManagerExportData,
  dbSeasonManagerWithRelations,
  dbTeamManagerWithContact,
} from '../types/dbTypes.js';

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
  findLeagueManagersForExport(leagueSeasonId: bigint): Promise<dbManagerExportData[]>;
  findSeasonManagersForExport(seasonId: bigint, accountId: bigint): Promise<dbManagerExportData[]>;
}
