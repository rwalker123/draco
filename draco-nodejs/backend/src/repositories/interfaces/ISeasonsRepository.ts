import {
  dbContactEmailOnly,
  dbLeagueSeasonBasic,
  dbSeason,
  dbSeasonCopySource,
  dbSeasonWithLeagues,
} from '../types/dbTypes.js';

export interface ISeasonsRepository {
  findAccountSeasons(accountId: bigint, includeDivisions: boolean): Promise<dbSeasonWithLeagues[]>;
  findSeasonWithLeagues(
    accountId: bigint,
    seasonId: bigint,
    includeDivisions: boolean,
  ): Promise<dbSeasonWithLeagues | null>;
  findSeasonById(accountId: bigint, seasonId: bigint): Promise<dbSeason | null>;
  findSeasonByName(
    accountId: bigint,
    name: string,
    excludeSeasonId?: bigint,
  ): Promise<dbSeason | null>;
  createSeason(data: { name: string; accountid: bigint }): Promise<dbSeason>;
  updateSeasonName(seasonId: bigint, name: string): Promise<dbSeason>;
  deleteSeason(seasonId: bigint): Promise<dbSeason>;
  findCurrentSeason(accountId: bigint): Promise<dbSeason | null>;
  upsertCurrentSeason(accountId: bigint, seasonId: bigint): Promise<void>;
  createLeagueSeason(seasonId: bigint, leagueId: bigint): Promise<dbLeagueSeasonBasic>;
  countSeasonParticipants(accountId: bigint, seasonId: bigint): Promise<number>;
  findSeasonParticipants(accountId: bigint, seasonId: bigint): Promise<dbContactEmailOnly[]>;
  findSeasonForCopy(accountId: bigint, seasonId: bigint): Promise<dbSeasonCopySource | null>;
  copySeasonStructure(
    accountId: bigint,
    sourceSeason: dbSeasonCopySource,
    newSeasonName: string,
  ): Promise<dbSeasonWithLeagues>;
}
