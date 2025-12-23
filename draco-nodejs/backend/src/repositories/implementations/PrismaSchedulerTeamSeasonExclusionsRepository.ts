import { PrismaClient, schedulerteamseasonexclusions } from '#prisma/client';
import type {
  ISchedulerTeamSeasonExclusionsRepository,
  SchedulerTeamSeasonExclusionCreateData,
  SchedulerTeamSeasonExclusionUpdateData,
} from '../interfaces/ISchedulerTeamSeasonExclusionsRepository.js';

export class PrismaSchedulerTeamSeasonExclusionsRepository implements ISchedulerTeamSeasonExclusionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findForAccount(
    id: bigint,
    accountId: bigint,
  ): Promise<schedulerteamseasonexclusions | null> {
    return this.prisma.schedulerteamseasonexclusions.findFirst({
      where: { id, accountid: accountId },
    });
  }

  async listForSeason(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<schedulerteamseasonexclusions[]> {
    return this.prisma.schedulerteamseasonexclusions.findMany({
      where: { accountid: accountId, seasonid: seasonId },
      orderBy: [{ teamseasonid: 'asc' }, { starttime: 'asc' }, { endtime: 'asc' }],
    });
  }

  async create(
    data: SchedulerTeamSeasonExclusionCreateData,
  ): Promise<schedulerteamseasonexclusions> {
    return this.prisma.schedulerteamseasonexclusions.create({
      data: {
        accountid: data.accountid,
        seasonid: data.seasonid,
        teamseasonid: data.teamseasonid,
        starttime: data.starttime,
        endtime: data.endtime,
        note: data.note,
        enabled: data.enabled,
      },
    });
  }

  async update(
    id: bigint,
    data: SchedulerTeamSeasonExclusionUpdateData,
  ): Promise<schedulerteamseasonexclusions> {
    return this.prisma.schedulerteamseasonexclusions.update({
      where: { id },
      data: {
        teamseasonid: data.teamseasonid,
        starttime: data.starttime,
        endtime: data.endtime,
        note: data.note,
        enabled: data.enabled,
      },
    });
  }

  async delete(id: bigint): Promise<schedulerteamseasonexclusions> {
    return this.prisma.schedulerteamseasonexclusions.delete({ where: { id } });
  }
}
