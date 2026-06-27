import { describe, expect, it, vi } from 'vitest';
import { StatisticsService } from '../statisticsService.js';
import {
  BattingStatisticsFiltersSchema,
  PitchingStatisticsFiltersSchema,
} from '@draco/shared-schemas';
import { partialMock, partialPrismaMock } from '../../test-utils/partialMock.js';
import type {
  IBattingStatisticsRepository,
  IContactRepository,
  ILeagueLeadersDisplayRepository,
  IPitchingStatisticsRepository,
  IScheduleRepository,
} from '../../repositories/interfaces/index.js';

const buildService = () => {
  const findBattingStatistics = vi.fn().mockResolvedValue([]);
  const findPitchingStatistics = vi.fn().mockResolvedValue([]);

  const battingRepository = partialMock<IBattingStatisticsRepository>({
    findBattingStatistics,
    findTeamsForPlayers: vi.fn().mockResolvedValue([]),
  });
  const pitchingRepository = partialMock<IPitchingStatisticsRepository>({
    findPitchingStatistics,
    findTeamsForPlayers: vi.fn().mockResolvedValue([]),
  });

  const service = new StatisticsService(
    partialPrismaMock({}),
    battingRepository,
    pitchingRepository,
    partialMock<ILeagueLeadersDisplayRepository>({}),
    partialMock<IContactRepository>({}),
    partialMock<IScheduleRepository>({}),
  );

  return { service, findBattingStatistics, findPitchingStatistics };
};

describe('StatisticsService all-time game-type scoping', () => {
  it('includes postseason games for historical batting queries', async () => {
    const { service, findBattingStatistics } = buildService();
    const filters = BattingStatisticsFiltersSchema.parse({
      sortField: 'avg',
      isHistorical: 'true',
    });

    await service.getBattingStats(1n, filters);

    expect(findBattingStatistics).toHaveBeenCalledWith(
      expect.objectContaining({ includeAllGameTypes: true }),
    );
  });

  it('restricts to regular season for non-historical batting queries by default', async () => {
    const { service, findBattingStatistics } = buildService();
    const filters = BattingStatisticsFiltersSchema.parse({ sortField: 'avg' });

    await service.getBattingStats(1n, filters);

    expect(findBattingStatistics).toHaveBeenCalledWith(
      expect.objectContaining({ includeAllGameTypes: false }),
    );
  });

  it('includes postseason games for historical pitching queries', async () => {
    const { service, findPitchingStatistics } = buildService();
    const filters = PitchingStatisticsFiltersSchema.parse({
      sortField: 'era',
      isHistorical: 'true',
    });

    await service.getPitchingStats(1n, filters);

    expect(findPitchingStatistics).toHaveBeenCalledWith(
      expect.objectContaining({ includeAllGameTypes: true }),
    );
  });

  it('still honors an explicit includeAllGameTypes flag when not historical', async () => {
    const { service, findPitchingStatistics } = buildService();
    const filters = PitchingStatisticsFiltersSchema.parse({
      sortField: 'era',
      includeAllGameTypes: 'true',
    });

    await service.getPitchingStats(1n, filters);

    expect(findPitchingStatistics).toHaveBeenCalledWith(
      expect.objectContaining({ includeAllGameTypes: true }),
    );
  });
});
