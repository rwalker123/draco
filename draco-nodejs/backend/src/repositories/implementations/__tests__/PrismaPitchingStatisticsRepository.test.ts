import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '#prisma/client';
import { PrismaPitchingStatisticsRepository } from '../PrismaPitchingStatisticsRepository.js';
import type { PitchingStatisticsQueryOptions } from '../../interfaces/IPitchingStatisticsRepository.js';

const baseQuery: PitchingStatisticsQueryOptions = {
  accountId: 99n,
  isHistorical: false,
  sortField: 'era',
  sortOrder: 'asc',
  page: 1,
  pageSize: 50,
  minInningsPitched: 0,
  includeAllGameTypes: false,
};

const createRepo = () => {
  const queryRawUnsafe = vi.fn().mockResolvedValue([]);
  const prisma = { $queryRawUnsafe: queryRawUnsafe } as unknown as PrismaClient;
  return { repo: new PrismaPitchingStatisticsRepository(prisma), queryRawUnsafe };
};

describe('PrismaPitchingStatisticsRepository account scoping', () => {
  it('always joins season and scopes by account, even with no league or season filter', async () => {
    const { repo, queryRawUnsafe } = createRepo();

    await repo.findPitchingStatistics(baseQuery);

    const [sql, ...params] = queryRawUnsafe.mock.calls[0];
    expect(sql).toContain('LEFT JOIN season s ON ls.seasonid = s.id');
    expect(sql).toContain('s.accountid = $1');
    expect(params).toEqual([99n]);
  });

  it('enforces account scoping in addition to the league filter', async () => {
    const { repo, queryRawUnsafe } = createRepo();

    await repo.findPitchingStatistics({ ...baseQuery, leagueId: 7n });

    const [sql, ...params] = queryRawUnsafe.mock.calls[0];
    expect(sql).toContain('s.accountid = $1');
    expect(sql).toContain('ls.id = $2');
    expect(params).toEqual([99n, 7n]);
  });
});
