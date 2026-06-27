import { describe, expect, it, vi } from 'vitest';
import { PrismaBattingStatisticsRepository } from '../PrismaBattingStatisticsRepository.js';
import type { BattingStatisticsQueryOptions } from '../../interfaces/IBattingStatisticsRepository.js';
import { partialPrismaMock } from '../../../test-utils/partialMock.js';

const baseQuery: BattingStatisticsQueryOptions = {
  accountId: 99n,
  isHistorical: false,
  sortField: 'avg',
  sortOrder: 'desc',
  page: 1,
  pageSize: 50,
  minAtBats: 0,
  includeAllGameTypes: false,
};

const createRepo = () => {
  const queryRawUnsafe = vi.fn().mockResolvedValue([]);
  const prisma = partialPrismaMock({ $queryRawUnsafe: queryRawUnsafe });
  return { repo: new PrismaBattingStatisticsRepository(prisma), queryRawUnsafe };
};

describe('PrismaBattingStatisticsRepository account scoping', () => {
  it('always joins season and scopes by account, even with no league or season filter', async () => {
    const { repo, queryRawUnsafe } = createRepo();

    await repo.findBattingStatistics(baseQuery);

    const [sql, ...params] = queryRawUnsafe.mock.calls[0];
    expect(sql).toContain('LEFT JOIN season s ON ls.seasonid = s.id');
    expect(sql).toContain('s.accountid = $1');
    expect(params).toEqual([99n]);
  });

  it('enforces account scoping in addition to the league filter', async () => {
    const { repo, queryRawUnsafe } = createRepo();

    await repo.findBattingStatistics({ ...baseQuery, leagueId: 7n });

    const [sql, ...params] = queryRawUnsafe.mock.calls[0];
    expect(sql).toContain('s.accountid = $1');
    expect(sql).toContain('ls.id = $2');
    expect(params).toEqual([99n, 7n]);
  });

  it('enforces account scoping in addition to the season filter', async () => {
    const { repo, queryRawUnsafe } = createRepo();

    await repo.findBattingStatistics({ ...baseQuery, seasonId: 3n });

    const [sql, ...params] = queryRawUnsafe.mock.calls[0];
    expect(sql).toContain('s.accountid = $1');
    expect(sql).toContain('ls.seasonid = $2');
    expect(params).toEqual([99n, 3n]);
  });

  it('enforces account scoping for historical single-league queries (master league id)', async () => {
    const { repo, queryRawUnsafe } = createRepo();

    await repo.findBattingStatistics({ ...baseQuery, isHistorical: true, leagueId: 7n });

    const [sql, ...params] = queryRawUnsafe.mock.calls[0];
    expect(sql).toContain('s.accountid = $1');
    expect(sql).toContain('ls.leagueid = $2');
    expect(params).toEqual([99n, 7n]);
  });
});
