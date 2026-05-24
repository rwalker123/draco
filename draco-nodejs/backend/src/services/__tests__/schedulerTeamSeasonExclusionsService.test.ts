import { beforeEach, afterEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { SchedulerTeamSeasonExclusionsService } from '../schedulerTeamSeasonExclusionsService.js';
import { RepositoryFactory } from '../../repositories/repositoryFactory.js';
import { partialMock } from '../../test-utils/partialMock.js';
import type { ISchedulerTeamSeasonExclusionsRepository } from '../../repositories/interfaces/ISchedulerTeamSeasonExclusionsRepository.js';
import type { ISeasonsRepository } from '../../repositories/interfaces/ISeasonsRepository.js';
import type { ITeamRepository } from '../../repositories/interfaces/ITeamRepository.js';
import { NotFoundError } from '../../utils/customErrors.js';
import type { schedulerteamseasonexclusions } from '#prisma/client';
import type { dbSeason, dbTeamSeasonValidationResult } from '../../repositories/types/dbTypes.js';

const accountId = 10n;
const otherAccountId = 99n;
const seasonId = 5n;
const teamSeasonId = 20n;

const makeSeason = (): dbSeason => ({
  id: seasonId,
  name: 'Spring 2026',
  accountid: accountId,
  schedulevisible: true,
});

const makeTeamSeasonValidation = (): dbTeamSeasonValidationResult =>
  ({
    id: teamSeasonId,
    teamid: 200n,
    name: 'Team A',
    leagueseasonid: 55n,
    divisionseasonid: null,
    leagueseason: {
      id: 55n,
      seasonid: seasonId,
      leagueid: 1n,
      league: { id: 1n, name: 'Open', accountid: accountId },
    },
  }) as dbTeamSeasonValidationResult;

const makeExclusion = (
  overrides: Partial<schedulerteamseasonexclusions> = {},
): schedulerteamseasonexclusions =>
  ({
    id: 1n,
    accountid: accountId,
    seasonid: seasonId,
    teamseasonid: teamSeasonId,
    starttime: new Date('2026-04-10T00:00:00Z'),
    endtime: new Date('2026-04-11T00:00:00Z'),
    note: null,
    enabled: true,
    createdat: new Date(),
    updatedat: new Date(),
    ...overrides,
  }) as schedulerteamseasonexclusions;

describe('SchedulerTeamSeasonExclusionsService', () => {
  let exclusionsRepo: Mocked<ISchedulerTeamSeasonExclusionsRepository>;
  let seasonsRepo: Mocked<ISeasonsRepository>;
  let teamRepo: Mocked<ITeamRepository>;
  let service: SchedulerTeamSeasonExclusionsService;

  beforeEach(() => {
    exclusionsRepo = {
      findForAccount: vi.fn(),
      listForSeason: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as Mocked<ISchedulerTeamSeasonExclusionsRepository>;

    seasonsRepo = {
      findSeasonById: vi.fn(),
      findAccountSeasons: vi.fn(),
      findSeasonWithLeagues: vi.fn(),
      findSeasonByName: vi.fn(),
      createSeason: vi.fn(),
      updateSeasonName: vi.fn(),
      deleteSeason: vi.fn(),
      findCurrentSeason: vi.fn(),
      upsertCurrentSeason: vi.fn(),
      createLeagueSeason: vi.fn(),
      countSeasonParticipants: vi.fn(),
      findSeasonParticipants: vi.fn(),
      findSeasonForCopy: vi.fn(),
      copySeasonStructure: vi.fn(),
      updateScheduleVisibility: vi.fn(),
    } as Mocked<ISeasonsRepository>;

    teamRepo = partialMock<ITeamRepository>({
      findTeamSeasonForValidation: vi.fn(),
    });

    vi.spyOn(RepositoryFactory, 'getSchedulerTeamSeasonExclusionsRepository').mockReturnValue(
      exclusionsRepo,
    );
    vi.spyOn(RepositoryFactory, 'getSeasonsRepository').mockReturnValue(seasonsRepo);
    vi.spyOn(RepositoryFactory, 'getTeamRepository').mockReturnValue(teamRepo);

    seasonsRepo.findSeasonById.mockResolvedValue(makeSeason());
    teamRepo.findTeamSeasonForValidation.mockResolvedValue(makeTeamSeasonValidation());

    service = new SchedulerTeamSeasonExclusionsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createExclusion', () => {
    it('creates and returns the formatted exclusion', async () => {
      const created = makeExclusion({ id: 8n });
      exclusionsRepo.create.mockResolvedValue(created);

      const result = await service.createExclusion(accountId, seasonId, {
        seasonId: seasonId.toString(),
        teamSeasonId: teamSeasonId.toString(),
        startTime: '2026-04-10T00:00:00Z',
        endTime: '2026-04-11T00:00:00Z',
        enabled: true,
      });

      expect(exclusionsRepo.create).toHaveBeenCalledOnce();
      expect(result.id).toBe('8');
      expect(result.teamSeasonId).toBe(teamSeasonId.toString());
    });

    it('throws NotFoundError when teamSeason does not belong to this account/season', async () => {
      teamRepo.findTeamSeasonForValidation.mockResolvedValue(null);

      await expect(
        service.createExclusion(accountId, seasonId, {
          seasonId: seasonId.toString(),
          teamSeasonId: teamSeasonId.toString(),
          startTime: '2026-04-10T00:00:00Z',
          endTime: '2026-04-11T00:00:00Z',
          enabled: true,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteExclusion', () => {
    it('deletes and returns the formatted exclusion', async () => {
      const existing = makeExclusion({ id: 4n });
      exclusionsRepo.findForAccount.mockResolvedValue(existing);
      exclusionsRepo.delete.mockResolvedValue(existing);

      const result = await service.deleteExclusion(accountId, seasonId, 4n);

      expect(exclusionsRepo.delete).toHaveBeenCalledWith(4n);
      expect(result.id).toBe('4');
    });

    it('throws NotFoundError when exclusion belongs to a different account', async () => {
      exclusionsRepo.findForAccount.mockResolvedValue(null);

      await expect(service.deleteExclusion(accountId, seasonId, 4n)).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.delete).not.toHaveBeenCalled();
    });

    it('enforces account boundary: record from another account cannot be deleted', async () => {
      exclusionsRepo.findForAccount.mockImplementation(async (id, acctId) => {
        if (acctId !== otherAccountId) return null;
        return makeExclusion({ id, accountid: otherAccountId });
      });

      await expect(service.deleteExclusion(accountId, seasonId, 4n)).rejects.toThrow(NotFoundError);

      expect(exclusionsRepo.delete).not.toHaveBeenCalled();
    });
  });
});
