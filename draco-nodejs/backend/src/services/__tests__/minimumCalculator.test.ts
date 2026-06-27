import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '#prisma/client';
import { MinimumCalculator } from '../minimumCalculator.js';
import { GameStatus, GameType } from '../../types/gameEnums.js';

interface PrismaMockOptions {
  leagueSeasonIds: bigint[];
  totalGames: number;
  numTeams: number;
}

const createPrismaMock = ({ leagueSeasonIds, totalGames, numTeams }: PrismaMockOptions) => {
  const findMany = vi.fn().mockResolvedValue(leagueSeasonIds.map((id) => ({ id })));
  const scheduleCount = vi.fn().mockResolvedValue(totalGames);
  const teamsCount = vi.fn().mockResolvedValue(numTeams);

  const prisma = {
    leagueseason: { findMany },
    leagueschedule: { count: scheduleCount },
    teamsseason: { count: teamsCount },
  } as unknown as PrismaClient;

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

    const result = await calculator.calculateSeasonMinAB(5n);

    // (40 games * 2 appearances) / 8 teams * 1.5 = 15
    expect(result).toBe(15);

    expect(findMany).toHaveBeenCalledWith({
      where: { seasonid: 5n },
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

    // (40 * 2) / 8 * 1.0 = 10
    await expect(calculator.calculateSeasonMinIP(5n)).resolves.toBe(10);
  });

  it('returns 0 when the season has no leagues', async () => {
    const { prisma, scheduleCount } = createPrismaMock({
      leagueSeasonIds: [],
      totalGames: 0,
      numTeams: 0,
    });
    const calculator = new MinimumCalculator(prisma);

    await expect(calculator.calculateSeasonMinAB(5n)).resolves.toBe(0);
    // Short-circuits before counting games once no leagues exist
    expect(scheduleCount).not.toHaveBeenCalled();
  });

  it('returns 0 when the season has leagues but no teams', async () => {
    const { prisma } = createPrismaMock({
      leagueSeasonIds: [10n],
      totalGames: 12,
      numTeams: 0,
    });
    const calculator = new MinimumCalculator(prisma);

    await expect(calculator.calculateSeasonMinAB(5n)).resolves.toBe(0);
  });
});
