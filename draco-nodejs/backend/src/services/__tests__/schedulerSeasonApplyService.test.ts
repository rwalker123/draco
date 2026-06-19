import { beforeEach, afterEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SchedulerSeasonApplyService } from '../schedulerSeasonApplyService.js';
import { ServiceFactory } from '../serviceFactory.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import { partialMock } from '../../test-utils/partialMock.js';
import type { SchedulerProblemSpecService } from '../schedulerProblemSpecService.js';
import type { SchedulerApplyService } from '../schedulerApplyService.js';
import type { ISchedulerApplyAuditLogRepository } from '../../repositories/interfaces/ISchedulerApplyAuditLogRepository.js';
import type { SchedulerSeasonApplyRequest, SchedulerApplyResult } from '@draco/shared-schemas';
import type { SchedulerProblemSpec } from '@draco/shared-schemas';

const accountId = 42n;
const seasonId = 7n;
const actingUser = { id: 'aspnet-user-99', username: 'tester@example.com' };

const baseSpec: SchedulerProblemSpec = {
  season: {
    id: seasonId.toString(),
    name: 'Spring 2026',
    startDate: '2026-04-01',
    endDate: '2026-08-31',
    gameDurations: { defaultMinutes: 75 },
  },
  teams: [
    { id: 'team-1', teamSeasonId: 'ts-1', league: { id: 'l-1', name: 'Open' } },
    { id: 'team-2', teamSeasonId: 'ts-2', league: { id: 'l-1', name: 'Open' } },
  ],
  fields: [{ id: 'field-1', name: 'Field 1' }],
  umpires: [{ id: 'ump-1', name: 'Alice' }],
  games: [
    {
      id: 'game-1',
      leagueSeasonId: 'ls-1',
      homeTeamSeasonId: 'ts-1',
      visitorTeamSeasonId: 'ts-2',
      earliestStart: '2026-04-05T09:00:00Z',
      latestEnd: '2026-04-05T14:00:00Z',
      requiredUmpires: 1,
    },
  ],
  fieldSlots: [
    {
      id: 'slot-1',
      fieldId: 'field-1',
      startTime: '2026-04-05T09:00:00Z',
      endTime: '2026-04-05T10:30:00Z',
    },
  ],
  umpireAvailability: [
    { umpireId: 'ump-1', startTime: '2026-04-05T08:00:00Z', endTime: '2026-04-05T18:00:00Z' },
  ],
  teamBlackouts: [],
  constraints: { hard: {} },
};

const makeApplyResult = (overrides: Partial<SchedulerApplyResult> = {}): SchedulerApplyResult => ({
  runId: 'run-1',
  status: 'applied',
  appliedGameIds: ['game-1'],
  skipped: [],
  ...overrides,
});

describe('SchedulerSeasonApplyService.applySeasonProposal', () => {
  let problemSpecService: Mocked<SchedulerProblemSpecService>;
  let applyService: Mocked<SchedulerApplyService>;
  let auditRepo: Mocked<ISchedulerApplyAuditLogRepository>;
  let service: SchedulerSeasonApplyService;

  const baseRequest: SchedulerSeasonApplyRequest = {
    runId: 'run-1',
    mode: 'all',
    assignments: [
      {
        gameId: 'game-1',
        fieldId: 'field-1',
        startTime: '2026-04-05T09:00:00Z',
        endTime: '2026-04-05T10:30:00Z',
        umpireIds: ['ump-1'],
      },
    ],
    constraints: { hard: {} },
  };

  beforeEach(() => {
    problemSpecService = partialMock<SchedulerProblemSpecService>({
      buildProblemSpec: vi.fn(),
    });
    applyService = partialMock<SchedulerApplyService>({ applyProposal: vi.fn() });
    auditRepo = partialMock<ISchedulerApplyAuditLogRepository>({ create: vi.fn() });

    vi.spyOn(ServiceFactory, 'getSchedulerProblemSpecService').mockReturnValue(problemSpecService);
    vi.spyOn(ServiceFactory, 'getSchedulerApplyService').mockReturnValue(applyService);
    vi.spyOn(RepositoryFactory, 'getSchedulerApplyAuditLogRepository').mockReturnValue(auditRepo);

    problemSpecService.buildProblemSpec.mockResolvedValue(baseSpec);
    auditRepo.create.mockResolvedValue({
      id: 1n,
      accountid: accountId,
      seasonid: seasonId,
      runid: 'run-1',
      mode: 'all',
      appliedbyuserid: actingUser.id,
      appliedbyusername: actingUser.username,
      appliedcount: 1,
      skippedcount: 0,
      createdat: new Date(),
    });

    service = new SchedulerSeasonApplyService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('happy path: builds spec, delegates to apply, returns result', async () => {
    applyService.applyProposal.mockResolvedValue(makeApplyResult());

    const result = await service.applySeasonProposal(accountId, seasonId, baseRequest, actingUser);

    expect(problemSpecService.buildProblemSpec).toHaveBeenCalledOnce();
    expect(applyService.applyProposal).toHaveBeenCalledOnce();
    expect(result.status).toBe('applied');
    expect(result.appliedGameIds).toEqual(['game-1']);
    expect(result.skipped).toHaveLength(0);
  });

  it('passes seasonId and season teams through to applyProposal context', async () => {
    applyService.applyProposal.mockResolvedValue(makeApplyResult());

    await service.applySeasonProposal(accountId, seasonId, baseRequest, actingUser);

    const [, , context] = applyService.applyProposal.mock.calls[0] ?? [];
    expect(context).toEqual({ seasonId, matchups: undefined, seasonTeams: baseSpec.teams });
  });

  it('partial-apply: propagates partial status when some assignments are rejected', async () => {
    const partialResult = makeApplyResult({
      status: 'partial',
      appliedGameIds: [],
      skipped: [{ gameId: 'game-1', reason: 'Field is already booked for this date and time' }],
    });
    applyService.applyProposal.mockResolvedValue(partialResult);

    const result = await service.applySeasonProposal(accountId, seasonId, baseRequest, actingUser);

    expect(result.status).toBe('partial');
    expect(result.appliedGameIds).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]?.reason).toMatch(/already booked/);
  });

  it('all-rejected: propagates failed status when every assignment is skipped', async () => {
    const twoGameRequest: SchedulerSeasonApplyRequest = {
      ...baseRequest,
      assignments: [
        { ...baseRequest.assignments[0]!, gameId: 'game-1' },
        {
          gameId: 'game-2',
          fieldId: 'field-1',
          startTime: '2026-04-05T11:00:00Z',
          endTime: '2026-04-05T12:30:00Z',
          umpireIds: [],
        },
      ],
    };

    const allRejectedResult = makeApplyResult({
      status: 'failed',
      appliedGameIds: [],
      skipped: [
        { gameId: 'game-1', reason: 'Season exclusion window conflict' },
        { gameId: 'game-2', reason: 'Season exclusion window conflict' },
      ],
    });
    applyService.applyProposal.mockResolvedValue(allRejectedResult);

    const result = await service.applySeasonProposal(
      accountId,
      seasonId,
      twoGameRequest,
      actingUser,
    );

    expect(result.status).toBe('failed');
    expect(result.appliedGameIds).toHaveLength(0);
    expect(result.skipped).toHaveLength(2);
  });

  it('forwards constraints from the assembled spec to applyProposal', async () => {
    const specWithConstraints: SchedulerProblemSpec = {
      ...baseSpec,
      constraints: {
        hard: {
          maxGamesPerUmpirePerDay: 3,
          requireLightsAfter: { enabled: true, startHourLocal: 18, timeZone: 'UTC' },
        },
      },
    };
    problemSpecService.buildProblemSpec.mockResolvedValue(specWithConstraints);
    applyService.applyProposal.mockResolvedValue(makeApplyResult());

    await service.applySeasonProposal(accountId, seasonId, baseRequest, actingUser);

    const [, applyRequest] = applyService.applyProposal.mock.calls[0] ?? [];
    expect(applyRequest?.constraints).toEqual(specWithConstraints.constraints);
  });

  it('writes exactly one audit row with correct payload values after a partial apply', async () => {
    const mixedResult: SchedulerApplyResult = {
      runId: 'run-audit',
      status: 'partial',
      appliedGameIds: ['game-1', 'game-2'],
      skipped: [{ gameId: 'game-3', reason: 'Field is already booked for this date and time' }],
    };
    applyService.applyProposal.mockResolvedValue(mixedResult);

    const auditRequest: SchedulerSeasonApplyRequest = {
      ...baseRequest,
      runId: 'run-audit',
      mode: 'all',
    };

    await service.applySeasonProposal(accountId, seasonId, auditRequest, actingUser);

    expect(auditRepo.create).toHaveBeenCalledOnce();
    expect(auditRepo.create).toHaveBeenCalledWith({
      accountid: 42n,
      seasonid: 7n,
      runid: 'run-audit',
      mode: 'all',
      appliedbyuserid: 'aspnet-user-99',
      appliedbyusername: 'tester@example.com',
      appliedcount: 2,
      skippedcount: 1,
    });
  });

  it('returns the apply result even when the audit repository throws', async () => {
    const applyResult = makeApplyResult();
    applyService.applyProposal.mockResolvedValue(applyResult);
    auditRepo.create.mockRejectedValue(new Error('DB connection lost'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await service.applySeasonProposal(accountId, seasonId, baseRequest, actingUser);

    expect(result).toEqual(applyResult);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[SchedulerSeasonApplyService] Failed to write audit log:',
      expect.any(Error),
    );
  });

  it('does not write an audit row when applyProposal rejects', async () => {
    applyService.applyProposal.mockRejectedValue(new Error('Unexpected apply failure'));

    await expect(
      service.applySeasonProposal(accountId, seasonId, baseRequest, actingUser),
    ).rejects.toThrow('Unexpected apply failure');

    expect(auditRepo.create).not.toHaveBeenCalled();
  });
});
