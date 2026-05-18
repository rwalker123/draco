import {
  dbRosterExportData,
  dbRosterMember,
  dbRosterPlayer,
  dbRosterSeason,
  dbRosterSeasonContactReference,
  dbWaiverExportData,
} from '../types/dbTypes.js';

export interface IRosterRepository {
  findRosterMembersByTeamSeason(
    teamSeasonId: bigint,
    includeInactive?: boolean,
  ): Promise<dbRosterSeason[]>;
  findActiveTeamSeasonIdsForUser(
    accountId: bigint,
    seasonId: bigint,
    userId: string,
  ): Promise<bigint[]>;
  findActiveRosterContactsByLeagueSeason(
    leagueSeasonId: bigint,
  ): Promise<dbRosterSeasonContactReference[]>;
  findRosterMemberForAccount(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbRosterMember | null>;
  findRosterMemberInLeagueSeason(
    playerId: bigint,
    leagueSeasonId: bigint,
  ): Promise<dbRosterMember | null>;
  countGamesPlayedByTeamSeason(
    teamSeasonId: bigint,
  ): Promise<Array<{ rosterSeasonId: bigint; gamesPlayed: number }>>;
  findRosterPlayerByContactId(contactId: bigint): Promise<dbRosterPlayer | null>;
  createRosterPlayer(
    contactId: bigint,
    submittedDriversLicense: boolean,
    firstYear: number,
  ): Promise<dbRosterPlayer>;
  updateRosterPlayer(
    playerId: bigint,
    submittedDriversLicense?: boolean,
    firstYear?: number,
  ): Promise<dbRosterPlayer>;
  createRosterSeasonEntry(
    playerId: bigint,
    teamSeasonId: bigint,
    playerNumber: number,
    submittedWaiver: boolean,
  ): Promise<dbRosterMember>;
  updateRosterSeasonEntry(
    rosterSeasonId: bigint,
    playerNumber?: number,
    submittedWaiver?: boolean,
    inactive?: boolean,
  ): Promise<dbRosterMember>;
  deleteRosterMember(rosterMemberId: bigint): Promise<void>;
  hasGameStats(rosterMemberId: bigint): Promise<boolean>;
  findRosterMembersForExport(teamSeasonId: bigint, seasonId: bigint): Promise<dbRosterExportData[]>;
  findLeagueRosterForExport(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<{ leagueName: string; members: dbRosterExportData[] }>;
  findSeasonRosterForExport(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<{ seasonName: string; members: dbRosterExportData[] }>;
  findTeamWaiverRosterForExport(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
  ): Promise<{ teamName: string; members: dbWaiverExportData[] }>;
  findLeagueWaiverRosterForExport(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<{ leagueName: string; members: dbWaiverExportData[] }>;
}
