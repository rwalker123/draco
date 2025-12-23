import type { schedulerteamseasonexclusions } from '#prisma/client';

export interface SchedulerTeamSeasonExclusionCreateData {
  accountid: bigint;
  seasonid: bigint;
  teamseasonid: bigint;
  starttime: Date;
  endtime: Date;
  note: string | null;
  enabled: boolean;
}

export interface SchedulerTeamSeasonExclusionUpdateData {
  teamseasonid: bigint;
  starttime: Date;
  endtime: Date;
  note: string | null;
  enabled: boolean;
}

export interface ISchedulerTeamSeasonExclusionsRepository {
  findForAccount(id: bigint, accountId: bigint): Promise<schedulerteamseasonexclusions | null>;
  listForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerteamseasonexclusions[]>;
  create(data: SchedulerTeamSeasonExclusionCreateData): Promise<schedulerteamseasonexclusions>;
  update(
    id: bigint,
    data: SchedulerTeamSeasonExclusionUpdateData,
  ): Promise<schedulerteamseasonexclusions>;
  delete(id: bigint): Promise<schedulerteamseasonexclusions>;
}
