import type { schedulerleagueseasonexclusions } from '#prisma/client';

export interface SchedulerLeagueSeasonExclusionCreateData {
  accountid: bigint;
  seasonid: bigint;
  leagueseasonid: bigint;
  starttime: Date;
  endtime: Date;
  note: string | null;
  enabled: boolean;
}

export interface SchedulerLeagueSeasonExclusionUpdateData {
  leagueseasonid: bigint;
  starttime: Date;
  endtime: Date;
  note: string | null;
  enabled: boolean;
}

export interface ISchedulerLeagueSeasonExclusionsRepository {
  findForAccount(id: bigint, accountId: bigint): Promise<schedulerleagueseasonexclusions | null>;
  listForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerleagueseasonexclusions[]>;
  create(data: SchedulerLeagueSeasonExclusionCreateData): Promise<schedulerleagueseasonexclusions>;
  update(
    id: bigint,
    data: SchedulerLeagueSeasonExclusionUpdateData,
  ): Promise<schedulerleagueseasonexclusions>;
  delete(id: bigint): Promise<schedulerleagueseasonexclusions>;
}
