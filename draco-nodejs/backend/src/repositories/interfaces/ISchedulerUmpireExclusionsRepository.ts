import type { schedulerumpireexclusions } from '#prisma/client';

export interface SchedulerUmpireExclusionCreateData {
  accountid: bigint;
  seasonid: bigint;
  umpireid: bigint;
  starttime: Date;
  endtime: Date;
  note: string | null;
  enabled: boolean;
}

export interface SchedulerUmpireExclusionUpdateData {
  umpireid: bigint;
  starttime: Date;
  endtime: Date;
  note: string | null;
  enabled: boolean;
}

export interface ISchedulerUmpireExclusionsRepository {
  findForAccount(id: bigint, accountId: bigint): Promise<schedulerumpireexclusions | null>;
  listForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerumpireexclusions[]>;
  create(data: SchedulerUmpireExclusionCreateData): Promise<schedulerumpireexclusions>;
  update(id: bigint, data: SchedulerUmpireExclusionUpdateData): Promise<schedulerumpireexclusions>;
  delete(id: bigint): Promise<schedulerumpireexclusions>;
}
