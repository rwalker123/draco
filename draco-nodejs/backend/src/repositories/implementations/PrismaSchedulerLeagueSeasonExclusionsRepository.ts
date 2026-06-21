import { PrismaClient, schedulerleagueseasonexclusions } from '#prisma/client';
import type {
  ISchedulerLeagueSeasonExclusionsRepository,
  SchedulerLeagueSeasonExclusionCreateData,
  SchedulerLeagueSeasonExclusionUpdateData,
} from '../interfaces/ISchedulerLeagueSeasonExclusionsRepository.js';

export class PrismaSchedulerLeagueSeasonExclusionsRepository implements ISchedulerLeagueSeasonExclusionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findForAccount(
    id: bigint,
    accountId: bigint,
  ): Promise<schedulerleagueseasonexclusions | null> {
    return this.prisma.schedulerleagueseasonexclusions.findFirst({
      where: { id, accountid: accountId },
    });
  }

  async listForSeason(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<schedulerleagueseasonexclusions[]> {
    return this.prisma.schedulerleagueseasonexclusions.findMany({
      where: { accountid: accountId, seasonid: seasonId },
      orderBy: [{ leagueseasonid: 'asc' }, { starttime: 'asc' }, { endtime: 'asc' }],
    });
  }

  async create(
    data: SchedulerLeagueSeasonExclusionCreateData,
  ): Promise<schedulerleagueseasonexclusions> {
    return this.prisma.schedulerleagueseasonexclusions.create({
      data: {
        accountid: data.accountid,
        seasonid: data.seasonid,
        leagueseasonid: data.leagueseasonid,
        starttime: data.starttime,
        endtime: data.endtime,
        note: data.note,
        enabled: data.enabled,
      },
    });
  }

  async update(
    id: bigint,
    data: SchedulerLeagueSeasonExclusionUpdateData,
  ): Promise<schedulerleagueseasonexclusions> {
    return this.prisma.schedulerleagueseasonexclusions.update({
      where: { id },
      data: {
        leagueseasonid: data.leagueseasonid,
        starttime: data.starttime,
        endtime: data.endtime,
        note: data.note,
        enabled: data.enabled,
      },
    });
  }

  async delete(id: bigint): Promise<schedulerleagueseasonexclusions> {
    return this.prisma.schedulerleagueseasonexclusions.delete({ where: { id } });
  }
}
