import type { schedulerseasonleagueselections } from '#prisma/client';

export interface ISchedulerSeasonLeagueSelectionsRepository {
  listForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerseasonleagueselections[]>;

  replaceForSeason(input: {
    accountid: bigint;
    seasonid: bigint;
    leagueseasonids: bigint[];
  }): Promise<schedulerseasonleagueselections[]>;
}
