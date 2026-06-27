import { describe, expect, it, vi } from 'vitest';
import { MinimumCalculator } from '../minimumCalculator.js';
import { GameStatus, GameType } from '../../types/gameEnums.js';
import { partialPrismaMock } from '../../test-utils/partialMock.js';

interface PrismaMockOptions {
  leagueSeasonIds: bigint[];
  totalGames: number;
  numTeams: number;
}

const createPrismaMock = ({ leagueSeasonIds, totalGames, numTeams }: PrismaMockOptions) => {
  const findMany = vi.fn().mockResolvedValue(leagueSeasonIds.map((id) => ({ id })));
  const scheduleCount = vi.fn().mockResolvedValue(totalGames);
  const teamsCount = vi.fn().mockResolvedValue(numTeams);

  const prisma = partialPrismaMock({
    leagueseason: { findMany },
    leagueschedule: { count: scheduleCount },
    teamsseason: { count: teamsCount },
  });

  return { prisma, findMany, scheduleCount, teamsCount };
};

describe('MinimumCalculator season-wide minimums', () => {
  it('aggregates games and teams across every league in the season for AB', async () => {
    const { prisma, findMany, scheduleCount, teamsCount } = createPrismaMock({
      leagueSeasonIds: [10n, 11n],
      totalGames: 40,
      numTeams: 8,
    });
    const calculator = new MinimumCalculator(prisma);

    const result = await calculator.calculateSeasonMinAB(5n, 7n);

    expect(result).toBe(15);

    expect(findMany).toHaveBeenCalledWith({
      where: { seasonid: 5n, season: { accountid: 7n } },
      select: { id: true },
    });
    expect(scheduleCount).toHaveBeenCalledWith({
      where: {
        leagueid: { in: [10n, 11n] },
        gametype: GameType.RegularSeason,
        gamestatus: {
          in: [GameStatus.Completed, GameStatus.Forfeit, GameStatus.DidNotReport],
        },
      },
    });
    expect(teamsCount).toHaveBeenCalledWith({
      where: { leagueseasonid: { in: [10n, 11n] } },
    });
  });

  it('uses the 1.0 multiplier for IP', async () => {
    const { prisma } = createPrismaMock({
      leagueSeasonIds: [10n, 11n],
      totalGames: 40,
      numTeams: 8,
    });
    const calculator = new MinimumCalculator(prisma);

    await expect(calculator.calculateSeasonMinIP(5n, 7n)).resolves.toBe(10);
  });

  it('returns 0 when the season has no leagues', async () => {
    const { prisma, scheduleCount } = createPrismaMock({
      leagueSeasonIds: [],
      totalGames: 0,
      numTeams: 0,
    });
    const calculator = new MinimumCalculator(prisma);

    await expect(calculator.calculateSeasonMinAB(5n, 7n)).resolves.toBe(0);
    expect(scheduleCount).not.toHaveBeenCalled();
  });

  it('returns 0 when the season has leagues but no teams', async () => {
    const { prisma } = createPrismaMock({
      leagueSeasonIds: [10n],
      totalGames: 12,
      numTeams: 0,
    });
    const calculator = new MinimumCalculator(prisma);

    await expect(calculator.calculateSeasonMinAB(5n, 7n)).resolves.toBe(0);
  });
});
