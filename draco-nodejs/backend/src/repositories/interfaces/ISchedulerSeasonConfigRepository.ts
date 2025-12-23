import type { schedulerseasonconfig } from '#prisma/client';

export interface ISchedulerSeasonConfigRepository {
  findForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerseasonconfig | null>;
  upsertForSeason(data: {
    accountid: bigint;
    seasonid: bigint;
    startdate: Date;
    enddate: Date;
    umpirespergame: number;
    maxgamesperumpireperday: number | null;
  }): Promise<schedulerseasonconfig>;
}
