import { PrismaClient, Prisma, schedulerseasonconfig } from '#prisma/client';
import type { ISchedulerSeasonConfigRepository } from '../interfaces/ISchedulerSeasonConfigRepository.js';

export class PrismaSchedulerSeasonConfigRepository implements ISchedulerSeasonConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerseasonconfig | null> {
    return this.prisma.schedulerseasonconfig.findFirst({
      where: { accountid: accountId, seasonid: seasonId },
    });
  }

  async upsertForSeason(data: {
    accountid: bigint;
    seasonid: bigint;
    startdate: Date;
    enddate: Date;
    umpirespergame: number;
    maxgamesperumpireperday: number | null;
  }): Promise<schedulerseasonconfig> {
    return this.prisma.schedulerseasonconfig.upsert({
      where: { seasonid: data.seasonid },
      create: {
        startdate: data.startdate,
        enddate: data.enddate,
        umpirespergame: data.umpirespergame,
        maxgamesperumpireperday: data.maxgamesperumpireperday,
        accounts: { connect: { id: data.accountid } },
        season: { connect: { id: data.seasonid } },
      } satisfies Prisma.schedulerseasonconfigCreateInput,
      update: {
        startdate: data.startdate,
        enddate: data.enddate,
        umpirespergame: data.umpirespergame,
        maxgamesperumpireperday: data.maxgamesperumpireperday,
      } as Prisma.schedulerseasonconfigUpdateInput,
    });
  }
}
