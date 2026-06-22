import type {
  SchedulerProblemSpec,
  SchedulerRunState,
  SchedulerSeasonSolveRequest,
} from '@draco/shared-schemas';
import crypto from 'node:crypto';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { ISchedulerRunRepository } from '../repositories/interfaces/ISchedulerRunRepository.js';
import { SchedulerRunResponseFormatter } from '../responseFormatters/schedulerRunResponseFormatter.js';
import { ServiceFactory } from './serviceFactory.js';
import { buildDeterministicRunId } from './schedulerEngineService.js';

const PROGRESS_PERSIST_INTERVAL = 100;
const SOLVE_YIELD_EVERY_N = 50;

export class SchedulerRunService {
  constructor(
    private readonly runRepository: ISchedulerRunRepository = RepositoryFactory.getSchedulerRunRepository(),
  ) {}

  async enqueue(
    accountId: bigint,
    seasonId: bigint,
    request: SchedulerSeasonSolveRequest,
    idempotencyKey?: string,
  ): Promise<SchedulerRunState> {
    const schedulerProblemSpecService = ServiceFactory.getSchedulerProblemSpecService();
    const { problemSpec, timeZoneId, fieldGameLengthById } =
      await schedulerProblemSpecService.buildProblemSpecForSolve(accountId, seasonId, request);

    const runId = idempotencyKey
      ? buildDeterministicRunId({ accountId, idempotencyKey, problemSpec })
      : `sched_account_${accountId.toString()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

    if (idempotencyKey) {
      const existing = await this.runRepository.findByRunId(accountId, seasonId, runId);
      if (existing) {
        if (existing.status === 'queued') {
          const specForExisting: SchedulerProblemSpec = { ...problemSpec, runId };
          this.startRun(
            accountId,
            runId,
            specForExisting,
            timeZoneId,
            idempotencyKey,
            problemSpec.games.length,
            fieldGameLengthById,
          );
        }
        return SchedulerRunResponseFormatter.format(existing);
      }
    }

    const total = problemSpec.games.length;
    const created = await this.runRepository.create({
      runid: runId,
      accountid: accountId,
      seasonid: seasonId,
      status: 'queued',
      total,
    });

    const specForRun: SchedulerProblemSpec = { ...problemSpec, runId };
    this.startRun(
      accountId,
      runId,
      specForRun,
      timeZoneId,
      idempotencyKey,
      total,
      fieldGameLengthById,
    );

    return SchedulerRunResponseFormatter.format(created);
  }

  async getRun(
    accountId: bigint,
    seasonId: bigint,
    runId: string,
  ): Promise<SchedulerRunState | null> {
    const run = await this.runRepository.findByRunId(accountId, seasonId, runId);
    return run ? SchedulerRunResponseFormatter.format(run) : null;
  }

  private startRun(
    accountId: bigint,
    runId: string,
    problemSpec: SchedulerProblemSpec,
    timeZoneId: string,
    idempotencyKey: string | undefined,
    total: number,
    fieldGameLengthById: Record<string, number>,
  ): void {
    setImmediate(() => {
      void this.processRun(
        accountId,
        runId,
        problemSpec,
        timeZoneId,
        idempotencyKey,
        total,
        fieldGameLengthById,
      );
    });
  }

  private async processRun(
    accountId: bigint,
    runId: string,
    problemSpec: SchedulerProblemSpec,
    timeZoneId: string,
    idempotencyKey: string | undefined,
    total: number,
    fieldGameLengthById: Record<string, number>,
  ): Promise<void> {
    const engine = ServiceFactory.getSchedulerEngineService();
    const logPrefix = `[scheduler:run account=${accountId.toString()} run=${runId}]`;

    try {
      await this.runRepository.update(runId, { status: 'running', processed: 0, total });

      const result = await engine.solveAsync(
        problemSpec,
        { accountId, idempotencyKey, timeZoneId, fieldGameLengthById },
        {
          yieldEveryN: SOLVE_YIELD_EVERY_N,
          onProgress: (processed, progressTotal) => {
            if (processed % PROGRESS_PERSIST_INTERVAL === 0 && processed !== progressTotal) {
              void this.runRepository
                .update(runId, { processed, total: progressTotal })
                .catch((err) => {
                  console.error(`${logPrefix} failed to persist progress`, err);
                });
            }
          },
        },
      );

      await this.runRepository.update(runId, {
        status: 'completed',
        processed: total,
        total,
        result: SchedulerRunResponseFormatter.toStoredResult(result),
        error: null,
      });
      console.log(`${logPrefix} completed: status=${result.status}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Schedule generation failed';
      console.error(`${logPrefix} failed`, err);
      await this.runRepository
        .update(runId, { status: 'failed', error: message })
        .catch((updateErr) => {
          console.error(`${logPrefix} failed to persist failure`, updateErr);
        });
    }
  }
}
