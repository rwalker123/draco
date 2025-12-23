import { PrismaClient, schedulerseasonexclusions } from '#prisma/client';
import type {
  ISchedulerSeasonExclusionsRepository,
  SchedulerSeasonExclusionCreateData,
  SchedulerSeasonExclusionUpdateData,
} from '../interfaces/ISchedulerSeasonExclusionsRepository.js';

export class PrismaSchedulerSeasonExclusionsRepository implements ISchedulerSeasonExclusionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findForAccount(id: bigint, accountId: bigint): Promise<schedulerseasonexclusions | null> {
    return this.prisma.schedulerseasonexclusions.findFirst({
      where: { id, accountid: accountId },
    });
  }

  async listForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerseasonexclusions[]> {
    return this.prisma.schedulerseasonexclusions.findMany({
      where: { accountid: accountId, seasonid: seasonId },
      orderBy: [{ starttime: 'asc' }, { endtime: 'asc' }],
    });
  }

  async create(data: SchedulerSeasonExclusionCreateData): Promise<schedulerseasonexclusions> {
    return this.prisma.schedulerseasonexclusions.create({
      data: {
        accounts: { connect: { id: data.accountid } },
        season: { connect: { id: data.seasonid } },
        starttime: data.starttime,
        endtime: data.endtime,
        note: data.note,
        enabled: data.enabled,
      },
    });
  }

  async update(
    id: bigint,
    data: SchedulerSeasonExclusionUpdateData,
  ): Promise<schedulerseasonexclusions> {
    return this.prisma.schedulerseasonexclusions.update({
      where: { id },
      data: {
        starttime: data.starttime,
        endtime: data.endtime,
        note: data.note,
        enabled: data.enabled,
      },
    });
  }

  async delete(id: bigint): Promise<schedulerseasonexclusions> {
    return this.prisma.schedulerseasonexclusions.delete({ where: { id } });
  }
}
