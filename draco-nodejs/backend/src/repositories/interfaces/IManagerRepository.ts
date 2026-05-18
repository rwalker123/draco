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
  findManagersForTeams(teamSeasonIds: bigint[]): Promise<dbTeamManagerWithContact[]>;
  createTeamManager(teamSeasonId: bigint, contactId: bigint): Promise<dbTeamManagerWithContact>;
  findTeamManager(teamSeasonId: bigint, contactId: bigint): Promise<teamseasonmanager | null>;
  findLeagueManagersForExport(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<{ leagueName: string; managers: dbManagerExportData[] }>;
  findSeasonManagersForExport(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<{ seasonName: string; managers: dbManagerExportData[] }>;
}
