import { teamsseason, teams, teamseasonmanager, Prisma } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbTeam,
  dbTeamSeasonLeague,
  dbTeamSeasonManagerContact,
  dbTeamSeasonRecord,
  dbTeamSeasonWithLeague,
  dbTeamSeasonWithLeaguesAndTeams,
  dbTeamsWithLeaguesAndDivisions,
  dbUserManagerTeams,
  dbUserTeams,
  dbTeamSeasonValidationResult,
} from '../types/dbTypes.js';

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
  findTeamSeasonWithLeaguesAndTeams(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonWithLeaguesAndTeams | null>;
  findTeamSeasonManagers(
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonManagerContact[]>;
  findContactTeams(accountId: bigint, contactId: bigint, seasonId: bigint): Promise<dbUserTeams[]>;
  findContactManager(
    accountId: bigint,
    contactid: bigint,
    seasonId: bigint,
  ): Promise<dbUserManagerTeams[]>;
  fetchTeamsWithLeagueInfo(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<dbTeamsWithLeaguesAndDivisions[]>;

  updateTeamSeasonName(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    updateData: string,
  ): Promise<teamsseason>;

  updateTeamSeason(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    updateData?: Partial<teamsseason>,
    teamUpdateData?: Partial<teams>,
  ): Promise<dbTeam>;

  getLeagueInfo(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonLeague | null>;

  getTeamRecord(teamSeasonId: bigint): Promise<dbTeamSeasonRecord>;
  getTeamRecords(teamSeasonIds: bigint[]): Promise<Map<string, dbTeamSeasonRecord>>;

  findTeamSeasonForValidation(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    include?: Prisma.teamsseasonInclude,
  ): Promise<dbTeamSeasonValidationResult | null>;
}
