import { afterEach, describe, expect, it, vi } from 'vitest';
import type { schedulerrun } from '#prisma/client';
import type {
  SchedulerProblemSpec,
  SchedulerSeasonSolveRequest,
  SchedulerSolveResult,
} from '@draco/shared-schemas';
import type {
  ISchedulerRunRepository,
  SchedulerRunCreateData,
  SchedulerRunProgressUpdate,
} from '../../repositories/interfaces/ISchedulerRunRepository.js';
import { SchedulerRunService } from '../schedulerRunService.js';
import type { SchedulerEngineService } from '../schedulerEngineService.js';
import type { SchedulerProblemSpecService } from '../schedulerProblemSpecService.js';
import { ServiceFactory } from '../serviceFactory.js';

class FakeRunRepository implements ISchedulerRunRepository {
  rows = new Map<string, schedulerrun>();
  createCalls = 0;

  async create(data: SchedulerRunCreateData): Promise<schedulerrun> {
    this.createCalls += 1;
    const row: schedulerrun = {
      runid: data.runid,
      accountid: data.accountid,
      seasonid: data.seasonid,
      status: data.status,
      processed: 0,
      total: data.total,
      result: null,
      error: null,
      createdat: new Date('2026-06-21T00:00:00Z'),
      updatedat: new Date('2026-06-21T00:00:00Z'),
    };
    this.rows.set(data.runid, row);
    return row;
  }

  async findByRunId(
    accountid: bigint,
    seasonid: bigint,
    runid: string,
  ): Promise<schedulerrun | null> {
    const row = this.rows.get(runid);
    return row && row.accountid === accountid && row.seasonid === seasonid ? row : null;
  }

  async claimQueued(runid: string, total: number): Promise<boolean> {
    const row = this.rows.get(runid);
    if (!row || row.status !== 'queued') return false;
    row.status = 'running';
    row.processed = 0;
    row.total = total;
    return true;
  }

  async update(runid: string, data: SchedulerRunProgressUpdate): Promise<schedulerrun> {
    const row = this.rows.get(runid);
    if (!row) throw new Error(`run ${runid} not found`);
    if (data.status !== undefined) row.status = data.status;
    if (data.processed !== undefined) row.processed = data.processed;
    if (data.total !== undefined) row.total = data.total;
    if (data.result !== undefined) row.result = data.result as schedulerrun['result'];
    if (data.error !== undefined) row.error = data.error;
    return row;
  }
}

const buildProblemSpec = (gameCount: number): SchedulerProblemSpec => ({
  season: { id: 's1', name: 'S1', startDate: '2026-04-01', endDate: '2026-08-31' },
  teams: [
    { id: 't1', teamSeasonId: 'ts1', league: { id: 'l1', name: 'Open' } },
    { id: 't2', teamSeasonId: 'ts2', league: { id: 'l1', name: 'Open' } },
  ],
  fields: [{ id: 'f1', name: 'Field 1' }],
  umpires: [],
  games: Array.from({ length: gameCount }, (_, i) => ({
    id: `game-${i + 1}`,
    leagueSeasonId: 'l1',
    homeTeamSeasonId: 'ts1',
    visitorTeamSeasonId: 'ts2',
  })),
  fieldSlots: [
    {
      id: 'slot-1',
      fieldId: 'f1',
      startTime: '2026-04-05T09:00:00Z',
      endTime: '2026-04-05T11:00:00Z',
    },
  ],
});

const buildResult = (): SchedulerSolveResult => ({
  runId: 'placeholder',
  status: 'completed',
  metrics: { totalGames: 2, scheduledGames: 2, unscheduledGames: 0, objectiveValue: 2 },
  assignments: [],
  unscheduled: [],
});

const stubServices = (problemSpec: SchedulerProblemSpec, solveResult: SchedulerSolveResult) => {
  const solveAsync = vi.fn(async (_spec, _ctx, options) => {
    options?.onProgress?.(problemSpec.games.length, problemSpec.games.length);
    return solveResult;
  });
  const problemSpecService: Pick<SchedulerProblemSpecService, 'buildProblemSpecForSolve'> = {
    buildProblemSpecForSolve: vi.fn(async () => ({
      problemSpec,
      timeZoneId: 'UTC',
      fieldGameLengthById: {},
    })),
  };
  const engineService: Pick<SchedulerEngineService, 'solveAsync'> = { solveAsync };
  vi.spyOn(ServiceFactory, 'getSchedulerProblemSpecService').mockReturnValue(
    problemSpecService as SchedulerProblemSpecService,
  );
  vi.spyOn(ServiceFactory, 'getSchedulerEngineService').mockReturnValue(
    engineService as SchedulerEngineService,
  );
  return { solveAsync };
};

const waitFor = async (predicate: () => boolean, timeoutMs = 1000): Promise<void> => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('timeout waiting for condition');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};

const request: SchedulerSeasonSolveRequest = {
  objectives: { primary: 'maximize_scheduled_games' },
};

describe('SchedulerRunService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enqueues a queued run and processes it to completion', async () => {
    const repo = new FakeRunRepository();
    const problemSpec = buildProblemSpec(2);
    const { solveAsync } = stubServices(problemSpec, buildResult());
    const service = new SchedulerRunService(repo);

    const enqueued = await service.enqueue(1n, 5n, request);
    expect(enqueued.status).toBe('queued');
    expect(enqueued.progress).toEqual({ processed: 0, total: 2 });
    expect(repo.createCalls).toBe(1);

    await waitFor(() => repo.rows.get(enqueued.runId)?.status === 'completed');

    const finalState = await service.getRun(1n, 5n, enqueued.runId);
    expect(finalState?.status).toBe('completed');
    expect(finalState?.progress).toEqual({ processed: 2, total: 2 });
    expect(finalState?.result?.status).toBe('completed');
    expect(solveAsync).toHaveBeenCalledTimes(1);
  });

  it('reuses the existing run only when the same idempotency key is supplied', async () => {
    const repo = new FakeRunRepository();
    const problemSpec = buildProblemSpec(2);
    const { solveAsync } = stubServices(problemSpec, buildResult());
    const service = new SchedulerRunService(repo);

    const first = await service.enqueue(1n, 5n, request, 'key-1');
    await waitFor(() => repo.rows.get(first.runId)?.status === 'completed');

    const second = await service.enqueue(1n, 5n, request, 'key-1');
    expect(second.runId).toBe(first.runId);
    expect(repo.createCalls).toBe(1);
    expect(solveAsync).toHaveBeenCalledTimes(1);
  });

  it('restarts processing when an idempotent retry finds a still-queued run', async () => {
    const repo = new FakeRunRepository();
    const problemSpec = buildProblemSpec(2);
    const { solveAsync } = stubServices(problemSpec, buildResult());
    const service = new SchedulerRunService(repo);

    const first = await service.enqueue(1n, 5n, request, 'key-1');
    await waitFor(() => repo.rows.get(first.runId)?.status === 'completed');
    expect(solveAsync).toHaveBeenCalledTimes(1);

    const stuck = repo.rows.get(first.runId);
    if (!stuck) throw new Error('expected run row to exist');
    stuck.status = 'queued';

    const second = await service.enqueue(1n, 5n, request, 'key-1');
    expect(second.runId).toBe(first.runId);
    expect(repo.createCalls).toBe(1);

    await waitFor(() => repo.rows.get(first.runId)?.status === 'completed');
    expect(solveAsync).toHaveBeenCalledTimes(2);
  });

  it('does not double-process when concurrent retries resume a queued run', async () => {
    const repo = new FakeRunRepository();
    const problemSpec = buildProblemSpec(2);
    const { solveAsync } = stubServices(problemSpec, buildResult());
    const service = new SchedulerRunService(repo);

    const first = await service.enqueue(1n, 5n, request, 'key-1');
    await waitFor(() => repo.rows.get(first.runId)?.status === 'completed');
    expect(solveAsync).toHaveBeenCalledTimes(1);

    const stuck = repo.rows.get(first.runId);
    if (!stuck) throw new Error('expected run row to exist');
    stuck.status = 'queued';

    await Promise.all([
      service.enqueue(1n, 5n, request, 'key-1'),
      service.enqueue(1n, 5n, request, 'key-1'),
    ]);

    await waitFor(() => repo.rows.get(first.runId)?.status === 'completed');
    expect(solveAsync).toHaveBeenCalledTimes(2);
  });

  it('returns the existing run when create races on the idempotency key (P2002)', async () => {
    const repo = new FakeRunRepository();
    const problemSpec = buildProblemSpec(2);
    const { solveAsync } = stubServices(problemSpec, buildResult());

    repo.create = async (data: SchedulerRunCreateData): Promise<schedulerrun> => {
      const winner: schedulerrun = {
        runid: data.runid,
        accountid: data.accountid,
        seasonid: data.seasonid,
        status: 'queued',
        processed: 0,
        total: data.total,
        result: null,
        error: null,
        createdat: new Date('2026-06-21T00:00:00Z'),
        updatedat: new Date('2026-06-21T00:00:00Z'),
      };
      repo.rows.set(data.runid, winner);
      throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    };

    const service = new SchedulerRunService(repo);
    const result = await service.enqueue(1n, 5n, request, 'key-race');

    expect(result.status).toBe('queued');
    await waitFor(() => repo.rows.get(result.runId)?.status === 'completed');
    expect(solveAsync).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh run for each generate when no idempotency key is supplied', async () => {
    const repo = new FakeRunRepository();
    const problemSpec = buildProblemSpec(2);
    const { solveAsync } = stubServices(problemSpec, buildResult());
    const service = new SchedulerRunService(repo);

    const first = await service.enqueue(1n, 5n, request);
    await waitFor(() => repo.rows.get(first.runId)?.status === 'completed');

    const second = await service.enqueue(1n, 5n, request);
    await waitFor(() => repo.rows.get(second.runId)?.status === 'completed');

    expect(second.runId).not.toBe(first.runId);
    expect(repo.createCalls).toBe(2);
    expect(solveAsync).toHaveBeenCalledTimes(2);
  });

  it('persists a failure when the solve throws', async () => {
    const repo = new FakeRunRepository();
    const problemSpec = buildProblemSpec(2);
    stubServices(problemSpec, buildResult());
    const failingEngine: Pick<SchedulerEngineService, 'solveAsync'> = {
      solveAsync: vi.fn(async () => {
        throw new Error('boom');
      }),
    };
    vi.spyOn(ServiceFactory, 'getSchedulerEngineService').mockReturnValue(
      failingEngine as SchedulerEngineService,
    );
    const service = new SchedulerRunService(repo);

    const enqueued = await service.enqueue(1n, 5n, request);
    await waitFor(() => repo.rows.get(enqueued.runId)?.status === 'failed');

    const failedState = await service.getRun(1n, 5n, enqueued.runId);
    expect(failedState?.status).toBe('failed');
    expect(failedState?.error).toBe('boom');
  });

  it('returns null for an unknown run', async () => {
    const repo = new FakeRunRepository();
    const service = new SchedulerRunService(repo);
    expect(await service.getRun(1n, 5n, 'nope')).toBeNull();
  });
});
