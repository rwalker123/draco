import {
  dbRosterMember,
  dbRosterPlayer,
  dbRosterSeason,
  dbRosterSeasonContactReference,
} from '../types/dbTypes.js';

export interface IRosterRepository {
  findRosterMembersByTeamSeason(teamSeasonId: bigint): Promise<dbRosterSeason[]>;
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
}
