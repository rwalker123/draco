import { PrismaClient, leagueevents, socialliveevents, Prisma } from '#prisma/client';
import { NotFoundError } from '../../utils/customErrors.js';
import { ILiveEventRepository, LiveEventQuery } from '../interfaces/ILiveEventRepository.js';
import { dbLiveEvent } from '../types/dbTypes.js';

export class PrismaLiveEventRepository implements ILiveEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listLiveEvents(query: LiveEventQuery): Promise<dbLiveEvent[]> {
    const { accountId, seasonId, teamSeasonId, status, featuredOnly } = query;

    return this.prisma.socialliveevents.findMany({
      where: {
        leagueevents: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
        ...(teamSeasonId ? { teamseasonid: teamSeasonId } : {}),
        ...(status?.length ? { status: { in: status } } : {}),
        ...(featuredOnly ? { featured: true } : {}),
      },
      include: this.liveEventIncludes,
      orderBy: [
        {
          leagueevents: {
            eventdate: 'asc',
          },
        },
        { id: 'asc' },
      ],
    });
  }

  async findLiveEventById(
    accountId: bigint,
    seasonId: bigint,
    liveEventId: bigint,
  ): Promise<dbLiveEvent | null> {
    return this.prisma.socialliveevents.findFirst({
      where: {
        id: liveEventId,
        leagueevents: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: this.liveEventIncludes,
    });
  }

  async findLiveEventByLeagueEventId(
    accountId: bigint,
    seasonId: bigint,
    leagueEventId: bigint,
  ): Promise<dbLiveEvent | null> {
    return this.prisma.socialliveevents.findFirst({
      where: {
        leagueeventid: leagueEventId,
        leagueevents: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: this.liveEventIncludes,
    });
  }

  async createLeagueEvent(data: Prisma.leagueeventsUncheckedCreateInput): Promise<leagueevents> {
    return this.prisma.leagueevents.create({ data });
  }

  async updateLeagueEvent(
    leagueEventId: bigint,
    data: Prisma.leagueeventsUncheckedUpdateInput,
  ): Promise<leagueevents> {
    return this.prisma.leagueevents.update({
      where: { id: leagueEventId },
      data,
    });
  }

  async deleteLeagueEvent(leagueEventId: bigint): Promise<void> {
    await this.prisma.leagueevents.delete({ where: { id: leagueEventId } });
  }

  async createLiveEventDetails(
    data: Prisma.socialliveeventsUncheckedCreateInput,
  ): Promise<socialliveevents> {
    return this.prisma.socialliveevents.create({ data });
  }

  async updateLiveEventDetails(
    liveEventId: bigint,
    data: Prisma.socialliveeventsUncheckedUpdateInput,
  ): Promise<socialliveevents> {
    return this.prisma.socialliveevents.update({
      where: { id: liveEventId },
      data,
    });
  }

  async deleteLiveEventDetails(liveEventId: bigint): Promise<void> {
    await this.prisma.socialliveevents.delete({ where: { id: liveEventId } });
  }

  async ensureLeagueSeasonAccess(
    accountId: bigint,
    seasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<void> {
    const leagueSeason = await this.prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found for account/season');
    }
  }

  async ensureTeamSeasonAccess(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
  ): Promise<void> {
    const teamSeason = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found for account/season');
    }
  }

  async ensureLeagueEventAccess(
    accountId: bigint,
    seasonId: bigint,
    leagueEventId: bigint,
  ): Promise<leagueevents> {
    const record = await this.prisma.leagueevents.findFirst({
      where: {
        id: leagueEventId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundError('League event not found for account/season');
    }

    return record;
  }

  private readonly liveEventIncludes = {
    leagueevents: {
      select: {
        id: true,
        eventdate: true,
        description: true,
        leagueseasonid: true,
        leagueseason: {
          select: {
            id: true,
            seasonid: true,
            leagueid: true,
            league: {
              select: {
                id: true,
                accountid: true,
                name: true,
              },
            },
          },
        },
      },
    },
    teamsseason: {
      select: {
        id: true,
        teamid: true,
        name: true,
        leagueseasonid: true,
      },
    },
  } as const;
}
