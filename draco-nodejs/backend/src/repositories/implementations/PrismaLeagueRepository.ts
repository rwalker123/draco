import { PrismaClient, leagueseason, Prisma } from '@prisma/client';
import {
  ILeagueRepository,
  LeagueSeasonGameFilters,
  LeagueSeasonListOptions,
} from '../interfaces/index.js';
import {
  dbDivisionDefinition,
  dbDivisionSeasonWithDefinition,
  dbDivisionSeasonWithTeams,
  dbLeague,
  dbLeagueSeason,
  dbLeagueCreateInput,
  dbLeagueSeasonRecord,
  dbLeagueSeasonWithCounts,
  dbLeagueSeasonWithDivisionDetails,
  dbLeagueSeasonWithTeams,
  dbLeagueUpdateInput,
  dbScheduleGameWithDetails,
  dbTeamSeasonCountResult,
  dbTeamSeasonWithTeam,
} from '../types/dbTypes.js';

const LEAGUE_SELECT = {
  id: true,
  name: true,
  accountid: true,
} as const;

const SEASON_SELECT = {
  id: true,
  name: true,
  accountid: true,
} as const;

const DIVISION_DEF_SELECT = {
  id: true,
  name: true,
  accountid: true,
} as const;

const TEAM_SELECT = {
  id: true,
  webaddress: true,
  youtubeuserid: true,
  defaultvideo: true,
  autoplayvideo: true,
} as const;

export class PrismaLeagueRepository implements ILeagueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<leagueseason | null> {
    return this.prisma.leagueseason.findUnique({ where: { id } });
  }

  async findMany(where?: Record<string, unknown>): Promise<leagueseason[]> {
    return this.prisma.leagueseason.findMany({
      where: where as Prisma.leagueseasonWhereInput | undefined,
    });
  }

  async create(data: Prisma.leagueseasonCreateInput): Promise<leagueseason> {
    return this.prisma.leagueseason.create({ data });
  }

  async update(id: bigint, data: Prisma.leagueseasonUpdateInput): Promise<leagueseason> {
    return this.prisma.leagueseason.update({ where: { id }, data });
  }

  async delete(id: bigint): Promise<leagueseason> {
    return this.prisma.leagueseason.delete({ where: { id } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.leagueseason.count({
      where: where as Prisma.leagueseasonWhereInput | undefined,
    });
  }

  async findAccountLeagues(accountId: bigint): Promise<dbLeague[]> {
    return this.prisma.league.findMany({
      where: {
        accountid: accountId,
      },
      select: LEAGUE_SELECT,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findLeaguesWithSeasons(accountId: bigint): Promise<dbLeague[]> {
    return this.prisma.league.findMany({
      where: {
        accountid: accountId,
        leagueseason: {
          some: {},
        },
      },
      select: LEAGUE_SELECT,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findLeagueById(accountId: bigint, leagueId: bigint): Promise<dbLeague | null> {
    return this.prisma.league.findFirst({
      where: {
        id: leagueId,
        accountid: accountId,
      },
      select: LEAGUE_SELECT,
    });
  }

  async findLeagueByName(accountId: bigint, name: string): Promise<dbLeague | null> {
    return this.prisma.league.findFirst({
      where: {
        accountid: accountId,
        name,
      },
      select: LEAGUE_SELECT,
    });
  }

  async findLeagueByNameExcludingId(
    accountId: bigint,
    name: string,
    excludeLeagueId: bigint,
  ): Promise<dbLeague | null> {
    return this.prisma.league.findFirst({
      where: {
        accountid: accountId,
        name,
        id: {
          not: excludeLeagueId,
        },
      },
      select: LEAGUE_SELECT,
    });
  }

  async createLeague(data: dbLeagueCreateInput): Promise<dbLeague> {
    return this.prisma.league.create({
      data,
      select: LEAGUE_SELECT,
    });
  }

  async updateLeague(leagueId: bigint, data: dbLeagueUpdateInput): Promise<dbLeague> {
    return this.prisma.league.update({
      where: {
        id: leagueId,
      },
      data,
      select: LEAGUE_SELECT,
    });
  }

  async deleteLeague(leagueId: bigint): Promise<dbLeague> {
    return this.prisma.league.delete({
      where: {
        id: leagueId,
      },
      select: LEAGUE_SELECT,
    });
  }

  async hasLeagueSeasons(leagueId: bigint): Promise<boolean> {
    const seasonCount = await this.prisma.leagueseason.count({
      where: {
        leagueid: leagueId,
      },
    });

    return seasonCount > 0;
  }

  async findSeasonLeagueSeasons(
    seasonId: bigint,
    accountId: bigint,
    _options: LeagueSeasonListOptions = {},
  ): Promise<dbLeagueSeasonWithTeams[]> {
    return this.prisma.leagueseason.findMany({
      where: {
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
      include: {
        league: {
          select: LEAGUE_SELECT,
        },
        season: {
          select: SEASON_SELECT,
        },
        divisionseason: {
          include: {
            divisiondefs: {
              select: DIVISION_DEF_SELECT,
            },
            teamsseason: {
              include: {
                teams: {
                  select: TEAM_SELECT,
                },
              },
            },
          },
          orderBy: {
            priority: 'asc',
          },
        },
        teamsseason: {
          include: {
            teams: {
              select: TEAM_SELECT,
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        league: {
          name: 'asc',
        },
      },
    }) as Promise<dbLeagueSeasonWithTeams[]>;
  }

  async findLeagueSeasonById(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeasonWithDivisionDetails | null> {
    return this.prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
      include: {
        league: {
          select: LEAGUE_SELECT,
        },
        divisionseason: {
          include: {
            divisiondefs: {
              select: DIVISION_DEF_SELECT,
            },
            teamsseason: {
              include: {
                teams: {
                  select: TEAM_SELECT,
                },
              },
            },
          },
          orderBy: {
            priority: 'asc',
          },
        },
        teamsseason: {
          where: {
            divisionseasonid: null,
          },
          include: {
            teams: {
              select: TEAM_SELECT,
            },
          },
        },
      },
    }) as Promise<dbLeagueSeasonWithDivisionDetails | null>;
  }

  async findLeagueSeason(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeason | null> {
    return this.prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
      include: {
        league: {
          select: LEAGUE_SELECT,
        },
      },
    }) as Promise<dbLeagueSeason | null>;
  }

  async findLeagueSeasonRecord(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeasonRecord | null> {
    return this.prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
      select: {
        id: true,
        leagueid: true,
        seasonid: true,
      },
    }) as Promise<dbLeagueSeasonRecord | null>;
  }

  async findLeagueSeasonByLeague(
    leagueId: bigint,
    seasonId: bigint,
  ): Promise<dbLeagueSeasonRecord | null> {
    return this.prisma.leagueseason.findFirst({
      where: {
        leagueid: leagueId,
        seasonid: seasonId,
      },
      select: {
        id: true,
        leagueid: true,
        seasonid: true,
      },
    }) as Promise<dbLeagueSeasonRecord | null>;
  }

  async createLeagueSeason(seasonId: bigint, leagueId: bigint): Promise<dbLeagueSeasonRecord> {
    return this.prisma.leagueseason.create({
      data: {
        seasonid: seasonId,
        leagueid: leagueId,
      },
      select: {
        id: true,
        leagueid: true,
        seasonid: true,
      },
    }) as Promise<dbLeagueSeasonRecord>;
  }

  async deleteLeagueSeason(leagueSeasonId: bigint): Promise<void> {
    await this.prisma.leagueseason.delete({
      where: {
        id: leagueSeasonId,
      },
    });
  }

  async getLeagueSeasonRelationCounts(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeasonWithCounts | null> {
    return this.prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
      include: {
        league: {
          select: LEAGUE_SELECT,
        },
        _count: {
          select: {
            divisionseason: true,
            gameejections: true,
            golfmatch: true,
            leagueevents: true,
            leagueschedule: true,
            playoffsetup: true,
            teamsseason: true,
          },
        },
      },
    }) as Promise<dbLeagueSeasonWithCounts | null>;
  }

  async getPlayerCountsForLeagueSeasons(
    leagueSeasonIds: bigint[],
    accountId: bigint,
  ): Promise<dbTeamSeasonCountResult[]> {
    if (!leagueSeasonIds.length) {
      return [];
    }

    const results = await this.prisma.rosterseason.groupBy({
      by: ['teamseasonid'],
      where: {
        teamsseason: {
          leagueseasonid: {
            in: leagueSeasonIds,
          },
        },
        roster: {
          contacts: {
            creatoraccountid: accountId,
          },
        },
      },
      _count: {
        playerid: true,
      },
    });

    return results.map((result) => ({
      teamseasonid: result.teamseasonid,
      count: result._count.playerid,
    }));
  }

  async getManagerCountsForLeagueSeasons(
    leagueSeasonIds: bigint[],
    accountId: bigint,
  ): Promise<dbTeamSeasonCountResult[]> {
    if (!leagueSeasonIds.length) {
      return [];
    }

    const results = await this.prisma.teamseasonmanager.groupBy({
      by: ['teamseasonid'],
      where: {
        teamsseason: {
          leagueseasonid: {
            in: leagueSeasonIds,
          },
        },
        contacts: {
          creatoraccountid: accountId,
        },
      },
      _count: {
        contactid: true,
      },
    });

    return results.map((result) => ({
      teamseasonid: result.teamseasonid,
      count: result._count.contactid,
    }));
  }

  async findDivisionSeasons(
    leagueSeasonId: bigint,
    accountId: bigint,
  ): Promise<dbDivisionSeasonWithTeams[]> {
    return this.prisma.divisionseason.findMany({
      where: {
        leagueseasonid: leagueSeasonId,
        leagueseason: {
          league: {
            accountid: accountId,
          },
        },
      },
      include: {
        divisiondefs: {
          select: DIVISION_DEF_SELECT,
        },
        teamsseason: {
          include: {
            teams: {
              select: TEAM_SELECT,
            },
          },
        },
      },
      orderBy: {
        priority: 'asc',
      },
    }) as Promise<dbDivisionSeasonWithTeams[]>;
  }

  async findDivisionSeasonById(
    divisionSeasonId: bigint,
    leagueSeasonId: bigint,
    accountId: bigint,
  ): Promise<dbDivisionSeasonWithDefinition | null> {
    return this.prisma.divisionseason.findFirst({
      where: {
        id: divisionSeasonId,
        leagueseasonid: leagueSeasonId,
        leagueseason: {
          league: {
            accountid: accountId,
          },
        },
      },
      include: {
        divisiondefs: {
          select: DIVISION_DEF_SELECT,
        },
      },
    }) as Promise<dbDivisionSeasonWithDefinition | null>;
  }

  async findDivisionSeasonByDivision(
    leagueSeasonId: bigint,
    divisionId: bigint,
  ): Promise<dbDivisionSeasonWithDefinition | null> {
    return this.prisma.divisionseason.findFirst({
      where: {
        leagueseasonid: leagueSeasonId,
        divisionid: divisionId,
      },
      include: {
        divisiondefs: {
          select: DIVISION_DEF_SELECT,
        },
      },
    }) as Promise<dbDivisionSeasonWithDefinition | null>;
  }

  async createDivisionSeason(
    leagueSeasonId: bigint,
    divisionId: bigint,
    priority: number,
  ): Promise<dbDivisionSeasonWithDefinition> {
    return this.prisma.divisionseason.create({
      data: {
        leagueseasonid: leagueSeasonId,
        divisionid: divisionId,
        priority,
      },
      include: {
        divisiondefs: {
          select: DIVISION_DEF_SELECT,
        },
      },
    }) as Promise<dbDivisionSeasonWithDefinition>;
  }

  async updateDivisionSeasonPriority(divisionSeasonId: bigint, priority: number): Promise<void> {
    await this.prisma.divisionseason.update({
      where: {
        id: divisionSeasonId,
      },
      data: {
        priority,
      },
    });
  }

  async deleteDivisionSeason(divisionSeasonId: bigint): Promise<void> {
    await this.prisma.divisionseason.delete({
      where: {
        id: divisionSeasonId,
      },
    });
  }

  async divisionSeasonHasTeams(divisionSeasonId: bigint): Promise<boolean> {
    const count = await this.prisma.teamsseason.count({
      where: {
        divisionseasonid: divisionSeasonId,
      },
    });

    return count > 0;
  }

  async findDivisionDefinitionById(
    accountId: bigint,
    divisionId: bigint,
  ): Promise<dbDivisionDefinition | null> {
    return this.prisma.divisiondefs.findFirst({
      where: {
        id: divisionId,
        accountid: accountId,
      },
      select: DIVISION_DEF_SELECT,
    }) as Promise<dbDivisionDefinition | null>;
  }

  async findDivisionDefinitionByName(
    accountId: bigint,
    name: string,
  ): Promise<dbDivisionDefinition | null> {
    return this.prisma.divisiondefs.findFirst({
      where: {
        accountid: accountId,
        name,
      },
      select: DIVISION_DEF_SELECT,
    }) as Promise<dbDivisionDefinition | null>;
  }

  async createDivisionDefinition(accountId: bigint, name: string): Promise<dbDivisionDefinition> {
    return this.prisma.divisiondefs.create({
      data: {
        name,
        accountid: accountId,
      },
      select: DIVISION_DEF_SELECT,
    }) as Promise<dbDivisionDefinition>;
  }

  async updateDivisionDefinitionName(
    divisionId: bigint,
    name: string,
  ): Promise<dbDivisionDefinition> {
    return this.prisma.divisiondefs.update({
      where: {
        id: divisionId,
      },
      data: {
        name,
      },
      select: DIVISION_DEF_SELECT,
    }) as Promise<dbDivisionDefinition>;
  }

  async findTeamSeasonsByIds(teamSeasonIds: bigint[]): Promise<dbTeamSeasonWithTeam[]> {
    if (!teamSeasonIds.length) {
      return [];
    }

    return this.prisma.teamsseason.findMany({
      where: {
        id: {
          in: teamSeasonIds,
        },
      },
      include: {
        teams: {
          select: TEAM_SELECT,
        },
      },
    }) as Promise<dbTeamSeasonWithTeam[]>;
  }

  async updateTeamSeasonDivision(
    teamSeasonId: bigint,
    divisionSeasonId: bigint | null,
  ): Promise<void> {
    await this.prisma.teamsseason.update({
      where: {
        id: teamSeasonId,
      },
      data: {
        divisionseasonid: divisionSeasonId,
      },
    });
  }

  async findLeagueSeasonGames(
    leagueSeasonId: bigint,
    accountId: bigint,
    filters: LeagueSeasonGameFilters = {},
  ): Promise<dbScheduleGameWithDetails[]> {
    const where: Prisma.leaguescheduleWhereInput = {
      leagueid: leagueSeasonId,
      leagueseason: {
        league: {
          accountid: accountId,
        },
      },
    };

    if (filters.startDate && filters.endDate) {
      where.gamedate = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    if (filters.teamId) {
      where.OR = [{ hteamid: filters.teamId }, { vteamid: filters.teamId }];
    }

    return this.prisma.leagueschedule.findMany({
      where,
      include: {
        availablefields: true,
        leagueseason: {
          include: {
            league: {
              select: LEAGUE_SELECT,
            },
            season: {
              select: SEASON_SELECT,
            },
          },
        },
      },
      orderBy: {
        gamedate: 'asc',
      },
    }) as Promise<dbScheduleGameWithDetails[]>;
  }
}
