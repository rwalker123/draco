import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulerApplyService } from '../schedulerApplyService.js';
import type { IScheduleRepository } from '../../repositories/interfaces/IScheduleRepository.js';
import type {
  dbScheduleGameForAccount,
  dbScheduleGameWithDetails,
  dbScheduleUpdateData,
} from '../../repositories/index.js';
import type { SchedulerApplyRequest } from '@draco/shared-schemas';

class ScheduleRepositoryStub implements IScheduleRepository {
  findById = vi.fn<IScheduleRepository['findById']>();
  findMany = vi.fn<IScheduleRepository['findMany']>();
  create = vi.fn<IScheduleRepository['create']>();
  update = vi.fn<IScheduleRepository['update']>();
  delete = vi.fn<IScheduleRepository['delete']>();
  count = vi.fn<IScheduleRepository['count']>();
  findGameWithAccountContext = vi.fn<IScheduleRepository['findGameWithAccountContext']>();
  findGameWithDetails = vi.fn<IScheduleRepository['findGameWithDetails']>();
  listSeasonGames = vi.fn<IScheduleRepository['listSeasonGames']>();
  countSeasonGames = vi.fn<IScheduleRepository['countSeasonGames']>();
  findTeamsInLeagueSeason = vi.fn<IScheduleRepository['findTeamsInLeagueSeason']>();
  createGame = vi.fn<IScheduleRepository['createGame']>();
  updateGame = vi.fn<IScheduleRepository['updateGame']>();
  updateGameResults = vi.fn<IScheduleRepository['updateGameResults']>();
  deleteGame = vi.fn<IScheduleRepository['deleteGame']>();
  findFieldConflict = vi.fn<IScheduleRepository['findFieldConflict']>();
  findRecap = vi.fn<IScheduleRepository['findRecap']>();
  upsertRecap = vi.fn<IScheduleRepository['upsertRecap']>();
  getTeamNames = vi.fn<IScheduleRepository['getTeamNames']>();
  listUpcomingGamesForTeam = vi.fn<IScheduleRepository['listUpcomingGamesForTeam']>();
  listRecentGamesForTeam = vi.fn<IScheduleRepository['listRecentGamesForTeam']>();
}

const makeAccountGame = (
  overrides: Partial<dbScheduleGameForAccount> & { id: bigint },
): dbScheduleGameForAccount =>
  ({
    id: overrides.id,
    gamedate: overrides.gamedate ?? new Date('2026-04-05T08:00:00.000Z'),
    hteamid: 1n,
    vteamid: 2n,
    hscore: 0,
    vscore: 0,
    comment: '',
    fieldid: overrides.fieldid ?? 10n,
    leagueid: overrides.leagueid ?? 99n,
    gamestatus: 0,
    gametype: 0,
    umpire1: overrides.umpire1 ?? null,
    umpire2: overrides.umpire2 ?? null,
    umpire3: overrides.umpire3 ?? null,
    umpire4: overrides.umpire4 ?? null,
    leagueseason: {
      id: 99n,
      leagueid: 1n,
      seasonid: 2n,
      league: { id: 1n, accountid: 42n, name: 'Test League', active: true },
      season: { id: 2n, name: 'Test Season', accountid: 42n, currentseason: false },
    },
  }) as dbScheduleGameForAccount;

const makeGameWithDetails = (id: bigint): dbScheduleGameWithDetails =>
  ({
    id,
    gamedate: new Date(),
    hteamid: 1n,
    vteamid: 2n,
    hscore: 0,
    vscore: 0,
    comment: '',
    fieldid: 10n,
    leagueid: 99n,
    gamestatus: 0,
    gametype: 0,
    umpire1: null,
    umpire2: null,
    umpire3: null,
    umpire4: null,
    availablefields: null,
    leagueseason: {
      id: 99n,
      leagueid: 1n,
      seasonid: 2n,
      league: { id: 1n, accountid: 42n, name: 'Test League', active: true },
      season: { id: 2n, name: 'Test Season', accountid: 42n, currentseason: false },
    },
    _count: { gamerecap: 0 },
  }) as dbScheduleGameWithDetails;

describe('SchedulerApplyService.applyProposal', () => {
  const accountId = 42n;
  let repository: ScheduleRepositoryStub;
  let service: SchedulerApplyService;

  beforeEach(() => {
    repository = new ScheduleRepositoryStub();
    service = new SchedulerApplyService(repository);
    repository.findFieldConflict.mockResolvedValue(null);
    repository.updateGame.mockImplementation(async (gameId: bigint, _data: dbScheduleUpdateData) =>
      makeGameWithDetails(gameId),
    );
  });

  it('applies all assignments and returns applied status', async () => {
    repository.findGameWithAccountContext.mockResolvedValue(makeAccountGame({ id: 123n }));

    const request: SchedulerApplyRequest = {
      runId: 'run-1',
      mode: 'all',
      assignments: [
        {
          gameId: '123',
          fieldId: '10',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
          umpireIds: ['77'],
        },
      ],
    };

    const result = await service.applyProposal(accountId, request);

    expect(result.status).toBe('applied');
    expect(result.appliedGameIds).toEqual(['123']);
    expect(result.skipped).toHaveLength(0);
    expect(repository.updateGame).toHaveBeenCalledTimes(1);
  });

  it('applies subset and skips missing assignments', async () => {
    repository.findGameWithAccountContext.mockResolvedValue(makeAccountGame({ id: 123n }));

    const request: SchedulerApplyRequest = {
      runId: 'run-2',
      mode: 'subset',
      gameIds: ['123', '124'],
      assignments: [
        {
          gameId: '123',
          fieldId: '10',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
          umpireIds: [],
        },
      ],
    };

    const result = await service.applyProposal(accountId, request);

    expect(result.status).toBe('partial');
    expect(result.appliedGameIds).toEqual(['123']);
    expect(result.skipped).toEqual([
      { gameId: '124', reason: 'No assignment provided for requested gameId' },
    ]);
  });

  it('skips assignments when field conflict exists', async () => {
    repository.findGameWithAccountContext.mockResolvedValue(makeAccountGame({ id: 123n }));
    repository.findFieldConflict.mockResolvedValue({ id: 999n } as never);

    const request: SchedulerApplyRequest = {
      runId: 'run-3',
      mode: 'all',
      assignments: [
        {
          gameId: '123',
          fieldId: '10',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
          umpireIds: [],
        },
      ],
    };

    const result = await service.applyProposal(accountId, request);

    expect(result.status).toBe('failed');
    expect(result.appliedGameIds).toEqual([]);
    expect(result.skipped).toEqual([
      { gameId: '123', reason: 'Field is already booked for this date and time' },
    ]);
    expect(repository.updateGame).not.toHaveBeenCalled();
  });

  it('does not update when assignment already matches persisted state', async () => {
    repository.findGameWithAccountContext.mockResolvedValue(
      makeAccountGame({
        id: 123n,
        gamedate: new Date('2026-04-05T09:00:00.000Z'),
        fieldid: 10n,
        umpire1: 77n,
        umpire2: null,
        umpire3: null,
        umpire4: null,
      }),
    );

    const request: SchedulerApplyRequest = {
      runId: 'run-4',
      mode: 'all',
      assignments: [
        {
          gameId: '123',
          fieldId: '10',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
          umpireIds: ['77'],
        },
      ],
    };

    const result = await service.applyProposal(accountId, request);

    expect(result.status).toBe('applied');
    expect(result.appliedGameIds).toEqual(['123']);
    expect(repository.updateGame).not.toHaveBeenCalled();
  });
});
