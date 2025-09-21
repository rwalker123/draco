import { teamsseason, teams, teamseasonmanager } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbTeamSeasonManagerContact, dbTeamSeasonWithLeague } from '../types/dbTypes.js';

export interface ITeamRepository extends IBaseRepository<teamsseason> {
  findBySeasonId(seasonId: bigint, accountId: bigint): Promise<teamsseason[]>;
  findTeamSeasonWithLeague(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonWithLeague | null>;
  findTeamDefinition(teamId: bigint): Promise<teams | null>;
  findTeamManager(
    contactId: bigint,
    teamId: bigint,
    seasonId: bigint,
  ): Promise<teamseasonmanager | null>;
  findTeamSeason(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<teamsseason | null>;
  findTeamSeasonManagers(
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonManagerContact[]>;
}
