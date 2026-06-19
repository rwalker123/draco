import type { schedulerapplyauditlog } from '#prisma/client';

export interface SchedulerApplyAuditLogCreateData {
  accountid: bigint;
  seasonid: bigint;
  runid: string;
  mode: string;
  appliedbyuserid: string;
  appliedbyusername: string;
  appliedcount: number;
  skippedcount: number;
}

export interface ISchedulerApplyAuditLogRepository {
  create(data: SchedulerApplyAuditLogCreateData): Promise<schedulerapplyauditlog>;
}
