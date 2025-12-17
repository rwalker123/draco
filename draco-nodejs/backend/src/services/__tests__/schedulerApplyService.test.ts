import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulerApplyService } from '../schedulerApplyService.js';
import type { IScheduleRepository } from '../../repositories/interfaces/IScheduleRepository.js';
import type { IFieldRepository } from '../../repositories/interfaces/IFieldRepository.js';
import type {
  dbScheduleGameForAccount,
  dbScheduleGameWithDetails,
  dbScheduleUpdateData,
} from '../../repositories/index.js';
import type { SchedulerApplyRequest } from '@draco/shared-schemas';
import type { availablefields } from '#prisma/client';

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
  countFieldBookingsAtTime = vi.fn<IScheduleRepository['countFieldBookingsAtTime']>();
  countTeamBookingsAtTime = vi.fn<IScheduleRepository['countTeamBookingsAtTime']>();
  countUmpireBookingsAtTime = vi.fn<IScheduleRepository['countUmpireBookingsAtTime']>();
  countTeamGamesInRange = vi.fn<IScheduleRepository['countTeamGamesInRange']>();
  countUmpireGamesInRange = vi.fn<IScheduleRepository['countUmpireGamesInRange']>();
  findRecap = vi.fn<IScheduleRepository['findRecap']>();
  upsertRecap = vi.fn<IScheduleRepository['upsertRecap']>();
  getTeamNames = vi.fn<IScheduleRepository['getTeamNames']>();
  listUpcomingGamesForTeam = vi.fn<IScheduleRepository['listUpcomingGamesForTeam']>();
  listRecentGamesForTeam = vi.fn<IScheduleRepository['listRecentGamesForTeam']>();
}

class FieldRepositoryStub implements IFieldRepository {
  findById = vi.fn<IFieldRepository['findById']>();
  findMany = vi.fn<IFieldRepository['findMany']>();
  create = vi.fn<IFieldRepository['create']>();
  update = vi.fn<IFieldRepository['update']>();
  delete = vi.fn<IFieldRepository['delete']>();
  count = vi.fn<IFieldRepository['count']>();
  findByAccount = vi.fn<IFieldRepository['findByAccount']>();
  countByAccount = vi.fn<IFieldRepository['countByAccount']>();
  findByName = vi.fn<IFieldRepository['findByName']>();
  findByNameExcludingId = vi.fn<IFieldRepository['findByNameExcludingId']>();
  findAccountField = vi.fn<IFieldRepository['findAccountField']>();
  isFieldInUse = vi.fn<IFieldRepository['isFieldInUse']>();
}

const makeAvailableField = (
  overrides: Partial<availablefields> & { id: bigint; accountid: bigint },
): availablefields => ({
  id: overrides.id,
  accountid: overrides.accountid,
  name: overrides.name ?? 'Field 10',
  shortname: overrides.shortname ?? 'F10',
  comment: overrides.comment ?? '',
  address: overrides.address ?? '',
  city: overrides.city ?? '',
  state: overrides.state ?? '',
  zipcode: overrides.zipcode ?? '',
  directions: overrides.directions ?? '',
  rainoutnumber: overrides.rainoutnumber ?? '',
  latitude: overrides.latitude ?? '',
  longitude: overrides.longitude ?? '',
  haslights: overrides.haslights ?? true,
  maxparallelgames: overrides.maxparallelgames ?? 1,
});

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
  let fieldRepository: FieldRepositoryStub;
  let service: SchedulerApplyService;
  let fieldMeta: { haslights: boolean; maxparallelgames: number };
  let gamesById: Map<bigint, dbScheduleGameForAccount>;

  const resolveUpdatedDate = (value: dbScheduleUpdateData['gamedate'], fallback: Date): Date => {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    if (value && typeof value === 'object' && 'set' in value) {
      const setValue = (value as { set?: unknown }).set;
      if (setValue instanceof Date) {
        return setValue;
      }
      if (typeof setValue === 'string') {
        const parsed = new Date(setValue);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    return fallback;
  };

  const resolveUpdatedNullableBigInt = (value: unknown, fallback: bigint | null): bigint | null => {
    if (value === null || typeof value === 'bigint') {
      return value;
    }
    if (value && typeof value === 'object' && 'set' in value) {
      const setValue = (value as { set?: unknown }).set;
      if (setValue === null || typeof setValue === 'bigint') {
        return setValue;
      }
    }
    return fallback;
  };

  beforeEach(() => {
    repository = new ScheduleRepositoryStub();
    fieldRepository = new FieldRepositoryStub();
    gamesById = new Map();
    fieldMeta = { haslights: true, maxparallelgames: 1 };
    fieldRepository.findAccountField.mockImplementation(async (account, fieldId) => {
      if (account !== accountId) {
        return null;
      }

      if (fieldId !== 10n) {
        return null;
      }

      return makeAvailableField({
        id: 10n,
        accountid: accountId,
        haslights: fieldMeta.haslights,
        maxparallelgames: fieldMeta.maxparallelgames,
      });
    });

    service = new SchedulerApplyService({
      scheduleRepository: repository,
      fieldRepository,
    });

    repository.findGameWithAccountContext.mockImplementation(
      async (gameId: bigint, account: bigint) => {
        if (account !== accountId) {
          return null;
        }
        return gamesById.get(gameId) ?? null;
      },
    );

    repository.updateGame.mockImplementation(async (gameId: bigint, data: dbScheduleUpdateData) => {
      const existing = gamesById.get(gameId);
      if (!existing) {
        throw new Error(`Game not found: ${gameId.toString()}`);
      }

      gamesById.set(gameId, {
        ...existing,
        gamedate: resolveUpdatedDate(data.gamedate, existing.gamedate),
        fieldid: resolveUpdatedNullableBigInt(data.fieldid, existing.fieldid),
        umpire1: resolveUpdatedNullableBigInt(data.umpire1, existing.umpire1),
        umpire2: resolveUpdatedNullableBigInt(data.umpire2, existing.umpire2),
        umpire3: resolveUpdatedNullableBigInt(data.umpire3, existing.umpire3),
        umpire4: resolveUpdatedNullableBigInt(data.umpire4, existing.umpire4),
      });

      return makeGameWithDetails(gameId);
    });

    repository.countFieldBookingsAtTime.mockImplementation(
      async (fieldId: bigint, gameDate: Date, leagueSeasonId: bigint, excludeGameId?: bigint) => {
        let count = 0;
        for (const game of gamesById.values()) {
          if (excludeGameId && game.id === excludeGameId) {
            continue;
          }
          if (game.fieldid !== fieldId) {
            continue;
          }
          if (game.leagueid !== leagueSeasonId) {
            continue;
          }
          if (game.gamedate.getTime() !== gameDate.getTime()) {
            continue;
          }
          count += 1;
        }
        return count;
      },
    );

    repository.countTeamBookingsAtTime.mockImplementation(
      async (
        teamSeasonId: bigint,
        gameDate: Date,
        leagueSeasonId: bigint,
        excludeGameId?: bigint,
      ) => {
        let count = 0;
        for (const game of gamesById.values()) {
          if (excludeGameId && game.id === excludeGameId) {
            continue;
          }
          if (game.leagueid !== leagueSeasonId) {
            continue;
          }
          if (game.gamedate.getTime() !== gameDate.getTime()) {
            continue;
          }
          if (game.hteamid !== teamSeasonId && game.vteamid !== teamSeasonId) {
            continue;
          }
          count += 1;
        }
        return count;
      },
    );

    repository.countUmpireBookingsAtTime.mockImplementation(
      async (umpireId: bigint, gameDate: Date, leagueSeasonId: bigint, excludeGameId?: bigint) => {
        let count = 0;
        for (const game of gamesById.values()) {
          if (excludeGameId && game.id === excludeGameId) {
            continue;
          }
          if (game.leagueid !== leagueSeasonId) {
            continue;
          }
          if (game.gamedate.getTime() !== gameDate.getTime()) {
            continue;
          }
          if (
            game.umpire1 !== umpireId &&
            game.umpire2 !== umpireId &&
            game.umpire3 !== umpireId &&
            game.umpire4 !== umpireId
          ) {
            continue;
          }
          count += 1;
        }
        return count;
      },
    );

    repository.countTeamGamesInRange.mockImplementation(
      async (
        teamSeasonId: bigint,
        start: Date,
        end: Date,
        leagueSeasonId: bigint,
        excludeGameId?: bigint,
      ) => {
        let count = 0;
        for (const game of gamesById.values()) {
          if (excludeGameId && game.id === excludeGameId) {
            continue;
          }
          if (game.leagueid !== leagueSeasonId) {
            continue;
          }
          if (
            game.gamedate.getTime() < start.getTime() ||
            game.gamedate.getTime() >= end.getTime()
          ) {
            continue;
          }
          if (game.hteamid !== teamSeasonId && game.vteamid !== teamSeasonId) {
            continue;
          }
          count += 1;
        }
        return count;
      },
    );

    repository.countUmpireGamesInRange.mockImplementation(
      async (
        umpireId: bigint,
        start: Date,
        end: Date,
        leagueSeasonId: bigint,
        excludeGameId?: bigint,
      ) => {
        let count = 0;
        for (const game of gamesById.values()) {
          if (excludeGameId && game.id === excludeGameId) {
            continue;
          }
          if (game.leagueid !== leagueSeasonId) {
            continue;
          }
          if (
            game.gamedate.getTime() < start.getTime() ||
            game.gamedate.getTime() >= end.getTime()
          ) {
            continue;
          }
          if (
            game.umpire1 !== umpireId &&
            game.umpire2 !== umpireId &&
            game.umpire3 !== umpireId &&
            game.umpire4 !== umpireId
          ) {
            continue;
          }
          count += 1;
        }
        return count;
      },
    );
  });

  it('applies all assignments and returns applied status', async () => {
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    fieldMeta = { haslights: true, maxparallelgames: 1 };

    const request: SchedulerApplyRequest = {
      runId: 'run-1',
      mode: 'all',
      constraints: { hard: { noFieldOverlap: true } },
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
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    fieldMeta = { haslights: true, maxparallelgames: 1 };

    const request: SchedulerApplyRequest = {
      runId: 'run-2',
      mode: 'subset',
      gameIds: ['123', '124'],
      constraints: { hard: { noFieldOverlap: true } },
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
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    gamesById.set(
      999n,
      makeAccountGame({ id: 999n, gamedate: new Date('2026-04-05T09:00:00.000Z'), fieldid: 10n }),
    );
    fieldMeta = { haslights: true, maxparallelgames: 1 };

    const request: SchedulerApplyRequest = {
      runId: 'run-3',
      mode: 'all',
      constraints: { hard: { noFieldOverlap: true } },
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

  it('skips assignments when game is not in the requested season', async () => {
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    fieldMeta = { haslights: true, maxparallelgames: 1 };

    const request: SchedulerApplyRequest = {
      runId: 'run-3b',
      mode: 'all',
      constraints: { hard: { noFieldOverlap: true } },
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

    const result = await service.applyProposal(accountId, request, { seasonId: 123n });

    expect(result.status).toBe('failed');
    expect(result.appliedGameIds).toEqual([]);
    expect(result.skipped).toEqual([
      { gameId: '123', reason: 'Game is not in the requested season' },
    ]);
    expect(repository.updateGame).not.toHaveBeenCalled();
  });

  it('does not update when assignment already matches persisted state', async () => {
    gamesById.set(
      123n,
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
    fieldMeta = { haslights: true, maxparallelgames: 1 };

    const request: SchedulerApplyRequest = {
      runId: 'run-4',
      mode: 'all',
      constraints: { hard: { noFieldOverlap: true } },
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

  it('skips non-lit fields when requireLightsAfter is enabled', async () => {
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    fieldMeta = { haslights: false, maxparallelgames: 1 };

    const request: SchedulerApplyRequest = {
      runId: 'run-5',
      mode: 'all',
      constraints: {
        hard: { requireLightsAfter: { enabled: true, startHourLocal: 18, timeZone: 'UTC' } },
      },
      assignments: [
        {
          gameId: '123',
          fieldId: '10',
          startTime: '2026-04-05T19:00:00Z',
          endTime: '2026-04-05T20:30:00Z',
          umpireIds: [],
        },
      ],
    };

    const result = await service.applyProposal(accountId, request);

    expect(result.status).toBe('failed');
    expect(result.appliedGameIds).toEqual([]);
    expect(result.skipped).toEqual([
      { gameId: '123', reason: 'Field does not have lights for this time slot' },
    ]);
    expect(repository.updateGame).not.toHaveBeenCalled();
  });

  it('enforces maxParallelGames against database state', async () => {
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    gamesById.set(124n, makeAccountGame({ id: 124n }));
    gamesById.set(
      999n,
      makeAccountGame({ id: 999n, gamedate: new Date('2026-04-05T09:00:00.000Z'), fieldid: 10n }),
    );
    fieldMeta = { haslights: true, maxparallelgames: 2 };

    const request: SchedulerApplyRequest = {
      runId: 'run-6',
      mode: 'all',
      constraints: { hard: { noFieldOverlap: true } },
      assignments: [
        {
          gameId: '123',
          fieldId: '10',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
          umpireIds: [],
        },
        {
          gameId: '124',
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
      { gameId: '124', reason: 'Field is already booked for this date and time' },
    ]);
  });

  it('enforces noTeamOverlap using database state', async () => {
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    gamesById.set(
      999n,
      makeAccountGame({ id: 999n, gamedate: new Date('2026-04-05T09:00:00.000Z') }),
    );
    fieldMeta = { haslights: true, maxparallelgames: 2 };

    const request: SchedulerApplyRequest = {
      runId: 'run-7',
      mode: 'all',
      constraints: { hard: { noTeamOverlap: true } },
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
    expect(result.skipped).toEqual([
      { gameId: '123', reason: 'Team is already booked for this date and time' },
    ]);
    expect(repository.updateGame).not.toHaveBeenCalled();
  });

  it('enforces noUmpireOverlap using database state', async () => {
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    gamesById.set(
      999n,
      makeAccountGame({
        id: 999n,
        gamedate: new Date('2026-04-05T09:00:00.000Z'),
        umpire1: 77n,
      }),
    );
    fieldMeta = { haslights: true, maxparallelgames: 2 };

    const request: SchedulerApplyRequest = {
      runId: 'run-8',
      mode: 'all',
      constraints: { hard: { noUmpireOverlap: true } },
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

    expect(result.status).toBe('failed');
    expect(result.skipped).toEqual([
      { gameId: '123', reason: 'Umpire is already booked for this date and time' },
    ]);
    expect(repository.updateGame).not.toHaveBeenCalled();
  });

  it('enforces maxGamesPerTeamPerDay using database state', async () => {
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    gamesById.set(
      124n,
      makeAccountGame({ id: 124n, gamedate: new Date('2026-04-06T08:00:00.000Z') }),
    );
    gamesById.set(
      999n,
      makeAccountGame({ id: 999n, gamedate: new Date('2026-04-05T06:00:00.000Z') }),
    );
    fieldMeta = { haslights: true, maxparallelgames: 2 };

    const request: SchedulerApplyRequest = {
      runId: 'run-9',
      mode: 'all',
      constraints: { hard: { maxGamesPerTeamPerDay: 2 } },
      assignments: [
        {
          gameId: '123',
          fieldId: '10',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
          umpireIds: [],
        },
        {
          gameId: '124',
          fieldId: '10',
          startTime: '2026-04-05T11:00:00Z',
          endTime: '2026-04-05T12:30:00Z',
          umpireIds: [],
        },
      ],
    };

    const result = await service.applyProposal(accountId, request);

    expect(result.status).toBe('partial');
    expect(result.appliedGameIds).toEqual(['123']);
    expect(result.skipped).toEqual([{ gameId: '124', reason: 'Team daily game limit exceeded' }]);
  });

  it('enforces maxGamesPerUmpirePerDay using database state', async () => {
    gamesById.set(123n, makeAccountGame({ id: 123n }));
    gamesById.set(
      124n,
      makeAccountGame({ id: 124n, gamedate: new Date('2026-04-06T08:00:00.000Z') }),
    );
    gamesById.set(
      999n,
      makeAccountGame({ id: 999n, gamedate: new Date('2026-04-05T06:00:00.000Z'), umpire1: 77n }),
    );
    fieldMeta = { haslights: true, maxparallelgames: 2 };

    const request: SchedulerApplyRequest = {
      runId: 'run-10',
      mode: 'all',
      constraints: { hard: { maxGamesPerUmpirePerDay: 2 } },
      assignments: [
        {
          gameId: '123',
          fieldId: '10',
          startTime: '2026-04-05T09:00:00Z',
          endTime: '2026-04-05T10:30:00Z',
          umpireIds: ['77'],
        },
        {
          gameId: '124',
          fieldId: '10',
          startTime: '2026-04-05T11:00:00Z',
          endTime: '2026-04-05T12:30:00Z',
          umpireIds: ['77'],
        },
      ],
    };

    const result = await service.applyProposal(accountId, request);

    expect(result.status).toBe('partial');
    expect(result.appliedGameIds).toEqual(['123']);
    expect(result.skipped).toEqual([{ gameId: '124', reason: 'Umpire daily game limit exceeded' }]);
  });
});
