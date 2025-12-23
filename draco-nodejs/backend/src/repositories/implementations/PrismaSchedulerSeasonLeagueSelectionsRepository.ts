import type { PrismaClient } from '#prisma/client';
import type { schedulerseasonleagueselections } from '#prisma/client';
import type { ISchedulerSeasonLeagueSelectionsRepository } from '../interfaces/ISchedulerSeasonLeagueSelectionsRepository.js';

export class PrismaSchedulerSeasonLeagueSelectionsRepository implements ISchedulerSeasonLeagueSelectionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForSeason(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<schedulerseasonleagueselections[]> {
    return this.prisma.schedulerseasonleagueselections.findMany({
      where: { accountid: accountId, seasonid: seasonId },
    });
  }

  async replaceForSeason(input: {
    accountid: bigint;
    seasonid: bigint;
    leagueseasonids: bigint[];
  }): Promise<schedulerseasonleagueselections[]> {
    const { accountid, seasonid, leagueseasonids } = input;

    await this.prisma.$transaction(async (tx) => {
      await tx.schedulerseasonleagueselections.deleteMany({
        where: { accountid, seasonid },
      });

      if (leagueseasonids.length > 0) {
        await tx.schedulerseasonleagueselections.createMany({
          data: leagueseasonids.map((leagueseasonid) => ({
            accountid,
            seasonid,
            leagueseasonid,
            enabled: true,
          })),
        });
      }
    });

    return this.prisma.schedulerseasonleagueselections.findMany({
      where: { accountid, seasonid },
    });
  }
}
