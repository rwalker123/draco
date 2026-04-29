import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeasonService } from '../seasonService.js';
import { ISeasonsRepository, dbSeason } from '../../repositories/index.js';
import { NotFoundError } from '../../utils/customErrors.js';

class SeasonsRepositoryStub implements ISeasonsRepository {
  findAccountSeasons = vi.fn<ISeasonsRepository['findAccountSeasons']>();
  findSeasonWithLeagues = vi.fn<ISeasonsRepository['findSeasonWithLeagues']>();
  findSeasonById = vi.fn<ISeasonsRepository['findSeasonById']>();
  findSeasonByName = vi.fn<ISeasonsRepository['findSeasonByName']>();
  createSeason = vi.fn<ISeasonsRepository['createSeason']>();
  updateSeasonName = vi.fn<ISeasonsRepository['updateSeasonName']>();
  deleteSeason = vi.fn<ISeasonsRepository['deleteSeason']>();
  findCurrentSeason = vi.fn<ISeasonsRepository['findCurrentSeason']>();
  upsertCurrentSeason = vi.fn<ISeasonsRepository['upsertCurrentSeason']>();
  createLeagueSeason = vi.fn<ISeasonsRepository['createLeagueSeason']>();
  countSeasonParticipants = vi.fn<ISeasonsRepository['countSeasonParticipants']>();
  findSeasonParticipants = vi.fn<ISeasonsRepository['findSeasonParticipants']>();
  findSeasonForCopy = vi.fn<ISeasonsRepository['findSeasonForCopy']>();
  copySeasonStructure = vi.fn<ISeasonsRepository['copySeasonStructure']>();
  updateScheduleVisibility = vi.fn<ISeasonsRepository['updateScheduleVisibility']>();
}

const accountId = 10n;
const seasonId = 25n;

const makeSeason = (overrides: Partial<dbSeason> = {}): dbSeason => ({
  id: seasonId,
  name: 'Spring 2024',
  accountid: accountId,
  schedulevisible: true,
  ...overrides,
});

describe('SeasonService.setScheduleVisibility', () => {
  let repo: SeasonsRepositoryStub;
  let service: SeasonService;

  beforeEach(() => {
    repo = new SeasonsRepositoryStub();
    service = new SeasonService(repo);
  });

  it('returns updated visibility when season exists and is hidden', async () => {
    repo.findSeasonById.mockResolvedValue(makeSeason({ schedulevisible: true }));
    repo.updateScheduleVisibility.mockResolvedValue(makeSeason({ schedulevisible: false }));

    const result = await service.setScheduleVisibility(accountId, seasonId, false);

    expect(result).toEqual({ scheduleVisible: false });
    expect(repo.updateScheduleVisibility).toHaveBeenCalledWith(accountId, seasonId, false);
  });

  it('returns updated visibility when season exists and is shown', async () => {
    repo.findSeasonById.mockResolvedValue(makeSeason({ schedulevisible: false }));
    repo.updateScheduleVisibility.mockResolvedValue(makeSeason({ schedulevisible: true }));

    const result = await service.setScheduleVisibility(accountId, seasonId, true);

    expect(result).toEqual({ scheduleVisible: true });
    expect(repo.updateScheduleVisibility).toHaveBeenCalledWith(accountId, seasonId, true);
  });

  it('throws NotFoundError when season does not exist', async () => {
    repo.findSeasonById.mockResolvedValue(null);

    await expect(service.setScheduleVisibility(accountId, seasonId, false)).rejects.toThrow(
      NotFoundError,
    );

    expect(repo.updateScheduleVisibility).not.toHaveBeenCalled();
  });
});

describe('SeasonService.findSeasonById', () => {
  let repo: SeasonsRepositoryStub;
  let service: SeasonService;

  beforeEach(() => {
    repo = new SeasonsRepositoryStub();
    service = new SeasonService(repo);
  });

  it('returns formatted season when found', async () => {
    repo.findSeasonById.mockResolvedValue(makeSeason({ schedulevisible: false }));

    const result = await service.findSeasonById(accountId, seasonId);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(seasonId.toString());
    expect(result?.scheduleVisible).toBe(false);
  });

  it('returns null when season does not exist', async () => {
    repo.findSeasonById.mockResolvedValue(null);

    const result = await service.findSeasonById(accountId, seasonId);

    expect(result).toBeNull();
  });

  it('correctly exposes scheduleVisible as true', async () => {
    repo.findSeasonById.mockResolvedValue(makeSeason({ schedulevisible: true }));

    const result = await service.findSeasonById(accountId, seasonId);

    expect(result?.scheduleVisible).toBe(true);
  });
});

describe('SeasonService.isScheduleHiddenForCurrentSeason', () => {
  let repo: SeasonsRepositoryStub;
  let service: SeasonService;

  beforeEach(() => {
    repo = new SeasonsRepositoryStub();
    service = new SeasonService(repo);
  });

  it('returns true when season is hidden and is the current season', async () => {
    repo.findSeasonById.mockResolvedValue(makeSeason({ schedulevisible: false }));
    repo.findCurrentSeason.mockResolvedValue(makeSeason({ id: seasonId }));

    const result = await service.isScheduleHiddenForCurrentSeason(accountId, seasonId);

    expect(result).toBe(true);
  });

  it('returns false when season is hidden but is NOT the current season', async () => {
    const otherSeasonId = 99n;
    repo.findSeasonById.mockResolvedValue(makeSeason({ schedulevisible: false }));
    repo.findCurrentSeason.mockResolvedValue(makeSeason({ id: otherSeasonId }));

    const result = await service.isScheduleHiddenForCurrentSeason(accountId, seasonId);

    expect(result).toBe(false);
  });

  it('returns false when season is visible and is the current season', async () => {
    repo.findSeasonById.mockResolvedValue(makeSeason({ schedulevisible: true }));
    repo.findCurrentSeason.mockResolvedValue(makeSeason({ id: seasonId }));

    const result = await service.isScheduleHiddenForCurrentSeason(accountId, seasonId);

    expect(result).toBe(false);
  });

  it('returns false when season is hidden and there is no current season', async () => {
    repo.findSeasonById.mockResolvedValue(makeSeason({ schedulevisible: false }));
    repo.findCurrentSeason.mockResolvedValue(null);

    const result = await service.isScheduleHiddenForCurrentSeason(accountId, seasonId);

    expect(result).toBe(false);
  });

  it('returns false when the season itself does not exist', async () => {
    repo.findSeasonById.mockResolvedValue(null);
    repo.findCurrentSeason.mockResolvedValue(makeSeason({ id: seasonId }));

    const result = await service.isScheduleHiddenForCurrentSeason(accountId, seasonId);

    expect(result).toBe(false);
  });
});
