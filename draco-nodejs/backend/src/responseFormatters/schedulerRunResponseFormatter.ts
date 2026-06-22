import type { Prisma, schedulerrun } from '#prisma/client';
import {
  SchedulerSolveResultSchema,
  type SchedulerRunLifecycleStatus,
  type SchedulerRunState,
  type SchedulerSolveResult,
} from '@draco/shared-schemas';

const LIFECYCLE_STATUSES: SchedulerRunLifecycleStatus[] = [
  'queued',
  'running',
  'completed',
  'failed',
];

const toLifecycleStatus = (value: string): SchedulerRunLifecycleStatus =>
  LIFECYCLE_STATUSES.includes(value as SchedulerRunLifecycleStatus)
    ? (value as SchedulerRunLifecycleStatus)
    : 'failed';

export class SchedulerRunResponseFormatter {
  static format(run: schedulerrun): SchedulerRunState {
    return {
      runId: run.runid,
      status: toLifecycleStatus(run.status),
      progress: { processed: run.processed, total: run.total },
      result: run.result == null ? undefined : SchedulerSolveResultSchema.parse(run.result),
      error: run.error ?? undefined,
    };
  }

  static toStoredResult(result: SchedulerSolveResult): Prisma.InputJsonValue {
    return result as Prisma.InputJsonValue;
  }
}
