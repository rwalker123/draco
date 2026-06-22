import type { Prisma, schedulerrun } from '#prisma/client';

export interface SchedulerRunCreateData {
  runid: string;
  accountid: bigint;
  seasonid: bigint;
  status: string;
  total: number;
}

export interface SchedulerRunProgressUpdate {
  status?: string;
  processed?: number;
  total?: number;
  result?: Prisma.InputJsonValue;
  error?: string | null;
}

export interface ISchedulerRunRepository {
  create(data: SchedulerRunCreateData): Promise<schedulerrun>;
  findByRunId(accountid: bigint, seasonid: bigint, runid: string): Promise<schedulerrun | null>;
  update(runid: string, data: SchedulerRunProgressUpdate): Promise<schedulerrun>;
  claimQueued(runid: string, total: number): Promise<boolean>;
}
