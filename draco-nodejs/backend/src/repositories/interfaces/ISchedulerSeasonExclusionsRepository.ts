import type { schedulerseasonexclusions } from '#prisma/client';

export interface SchedulerSeasonExclusionCreateData {
  accountid: bigint;
  seasonid: bigint;
  starttime: Date;
  endtime: Date;
  note: string | null;
  enabled: boolean;
}

export interface SchedulerSeasonExclusionUpdateData {
  starttime: Date;
  endtime: Date;
  note: string | null;
  enabled: boolean;
}

export interface ISchedulerSeasonExclusionsRepository {
  findForAccount(id: bigint, accountId: bigint): Promise<schedulerseasonexclusions | null>;
  listForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerseasonexclusions[]>;
  create(data: SchedulerSeasonExclusionCreateData): Promise<schedulerseasonexclusions>;
  update(id: bigint, data: SchedulerSeasonExclusionUpdateData): Promise<schedulerseasonexclusions>;
  delete(id: bigint): Promise<schedulerseasonexclusions>;
}
