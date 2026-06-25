import { describe, it, expect, beforeEach, afterEach, vi, type Mocked } from 'vitest';

import { ScheduleService } from '../scheduleService.js';
import { ServiceFactory } from '../serviceFactory.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import type { IScheduleRepository } from '../../repositories/interfaces/IScheduleRepository.js';
import type { EmailService } from '../emailService.js';
import type { dbScheduleGameWithDetails } from '../../repositories/types/index.js';
import { ConflictError } from '../../utils/customErrors.js';
import { partialMock } from '../../test-utils/partialMock.js';

const makeGame = (overrides: Partial<dbScheduleGameWithDetails> = {}): dbScheduleGameWithDetails =>
  ({
    id: 1n,
    leagueid: 10n,
    hteamid: 100n,
    vteamid: 200n,
    gamedate: new Date('2025-06-10T19:00:00Z'),
    fieldid: 7n,
    gamestatus: 0,
    gametype: 0,
    hscore: 0,
    vscore: 0,
    comment: '',
    umpire1: null,
    umpire2: null,
    umpire3: null,
    umpire4: null,
    availablefields: null,
    leagueseason: {
      id: 10n,
      seasonid: 5n,
      leagueid: 1n,
      league: { id: 1n, name: 'Summer League', accountid: 99n },
      season: { id: 5n, name: '2025 Season', accountid: 99n, schedulevisible: true },
    },
    _count: { gamerecap: 0 },
    ...overrides,
  }) as dbScheduleGameWithDetails;

describe('ScheduleService — field booking conflicts', () => {
  let scheduleRepositoryMock: Mocked<IScheduleRepository>;
  let service: ScheduleService;

  const accountId = 99n;
  const seasonId = 5n;
  const userId = 'user-abc';
  const gameId = 1n;

  beforeEach(() => {
    scheduleRepositoryMock = partialMock<IScheduleRepository>({
      findGameWithAccountContext: vi.fn(),
      createGame: vi.fn().mockResolvedValue(makeGame()),
      updateGame: vi.fn().mockResolvedValue(makeGame()),
      findTeamsInLeagueSeason: vi
        .fn()
        .mockResolvedValue([{ id: 100n } as never, { id: 200n } as never]),
      findFieldConflict: vi.fn().mockResolvedValue(null),
      getTeamNames: vi.fn().mockResolvedValue(
        new Map([
          ['100', 'Home Team'],
          ['200', 'Visitor Team'],
        ]),
      ),
    });

    vi.spyOn(RepositoryFactory, 'getScheduleRepository').mockReturnValue(scheduleRepositoryMock);
    vi.spyOn(ServiceFactory, 'getEmailService').mockReturnValue(
      partialMock<EmailService>({ composeAndSendEmailFromUser: vi.fn() }),
    );

    service = new ScheduleService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseCreatePayload = {
    leagueSeasonId: '10',
    gameDate: '2025-06-10T19:00:00Z',
    homeTeam: { id: '100' },
    visitorTeam: { id: '200' },
    field: { id: '7' },
    comment: '',
    gameStatus: 0,
    gameType: 0,
  };

  describe('createGame', () => {
    it('throws ConflictError when the field is already booked at that date/time', async () => {
      scheduleRepositoryMock.findFieldConflict.mockResolvedValue(makeGame({ id: 2n }));

      await expect(
        service.createGame(accountId, seasonId, baseCreatePayload, userId),
      ).rejects.toBeInstanceOf(ConflictError);

      expect(scheduleRepositoryMock.findFieldConflict).toHaveBeenCalledWith(
        7n,
        new Date('2025-06-10T19:00:00Z'),
        10n,
      );
      expect(scheduleRepositoryMock.createGame).not.toHaveBeenCalled();
    });

    it('creates the game when no field conflict exists', async () => {
      await service.createGame(accountId, seasonId, baseCreatePayload, userId);

      expect(scheduleRepositoryMock.createGame).toHaveBeenCalledTimes(1);
    });

    it('skips the conflict check when no field is set', async () => {
      await service.createGame(accountId, seasonId, { ...baseCreatePayload, field: null }, userId);

      expect(scheduleRepositoryMock.findFieldConflict).not.toHaveBeenCalled();
      expect(scheduleRepositoryMock.createGame).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateGame', () => {
    const existingGame = makeGame({
      id: gameId,
      gamedate: new Date('2025-06-10T19:00:00Z'),
      fieldid: 7n,
    });

    const baseUpdatePayload = { ...baseCreatePayload };

    beforeEach(() => {
      scheduleRepositoryMock.findGameWithAccountContext.mockResolvedValue(existingGame as never);
    });

    it('throws ConflictError when the date/time moves onto an occupied slot on the same field', async () => {
      scheduleRepositoryMock.findFieldConflict.mockResolvedValue(makeGame({ id: 2n }));

      await expect(
        service.updateGame(
          accountId,
          seasonId,
          gameId,
          { ...baseUpdatePayload, gameDate: '2025-06-10T21:00:00Z' },
          userId,
        ),
      ).rejects.toBeInstanceOf(ConflictError);

      expect(scheduleRepositoryMock.findFieldConflict).toHaveBeenCalledWith(
        7n,
        new Date('2025-06-10T21:00:00Z'),
        10n,
        gameId,
      );
      expect(scheduleRepositoryMock.updateGame).not.toHaveBeenCalled();
    });

    it('throws ConflictError when the field changes to an occupied slot', async () => {
      scheduleRepositoryMock.findFieldConflict.mockResolvedValue(makeGame({ id: 2n }));

      await expect(
        service.updateGame(
          accountId,
          seasonId,
          gameId,
          { ...baseUpdatePayload, field: { id: '8' } },
          userId,
        ),
      ).rejects.toBeInstanceOf(ConflictError);

      expect(scheduleRepositoryMock.findFieldConflict).toHaveBeenCalledWith(
        8n,
        new Date('2025-06-10T19:00:00Z'),
        10n,
        gameId,
      );
    });

    it('does not run the conflict check when field and date are unchanged', async () => {
      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, comment: 'updated note' },
        userId,
      );

      expect(scheduleRepositoryMock.findFieldConflict).not.toHaveBeenCalled();
      expect(scheduleRepositoryMock.updateGame).toHaveBeenCalledTimes(1);
    });

    it('does not run the conflict check when the field is cleared', async () => {
      await service.updateGame(
        accountId,
        seasonId,
        gameId,
        { ...baseUpdatePayload, field: null },
        userId,
      );

      expect(scheduleRepositoryMock.findFieldConflict).not.toHaveBeenCalled();
      expect(scheduleRepositoryMock.updateGame).toHaveBeenCalledTimes(1);
    });
  });
});
