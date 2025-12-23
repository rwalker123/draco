import { PrismaClient, schedulerumpireexclusions } from '#prisma/client';
import type {
  ISchedulerUmpireExclusionsRepository,
  SchedulerUmpireExclusionCreateData,
  SchedulerUmpireExclusionUpdateData,
} from '../interfaces/ISchedulerUmpireExclusionsRepository.js';

export class PrismaSchedulerUmpireExclusionsRepository implements ISchedulerUmpireExclusionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findForAccount(id: bigint, accountId: bigint): Promise<schedulerumpireexclusions | null> {
    return this.prisma.schedulerumpireexclusions.findFirst({
      where: { id, accountid: accountId },
    });
  }

  async listForSeason(accountId: bigint, seasonId: bigint): Promise<schedulerumpireexclusions[]> {
    return this.prisma.schedulerumpireexclusions.findMany({
      where: { accountid: accountId, seasonid: seasonId },
      orderBy: [{ umpireid: 'asc' }, { starttime: 'asc' }, { endtime: 'asc' }],
    });
  }

  async create(data: SchedulerUmpireExclusionCreateData): Promise<schedulerumpireexclusions> {
    return this.prisma.schedulerumpireexclusions.create({
      data: {
        accountid: data.accountid,
        seasonid: data.seasonid,
        umpireid: data.umpireid,
        starttime: data.starttime,
        endtime: data.endtime,
        note: data.note,
        enabled: data.enabled,
      },
    });
  }

  async update(
    id: bigint,
    data: SchedulerUmpireExclusionUpdateData,
  ): Promise<schedulerumpireexclusions> {
    return this.prisma.schedulerumpireexclusions.update({
      where: { id },
      data: {
        umpireid: data.umpireid,
        starttime: data.starttime,
        endtime: data.endtime,
        note: data.note,
        enabled: data.enabled,
      },
    });
  }

  async delete(id: bigint): Promise<schedulerumpireexclusions> {
    return this.prisma.schedulerumpireexclusions.delete({ where: { id } });
  }
}
