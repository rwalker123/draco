import { PrismaClient, teamsseason, teams, teamseasonmanager } from '@prisma/client';
import { ITeamRepository } from '../interfaces/ITeamRepository.js';
import { dbTeamSeasonManagerContact, dbTeamSeasonWithLeague } from '../types/dbTypes.js';

export class PrismaTeamRepository implements ITeamRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: bigint): Promise<teamsseason | null> {
    return this.prisma.teamsseason.findUnique({
      where: { id: Number(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<teamsseason[]> {
    return this.prisma.teamsseason.findMany({ where });
  }

  async create(data: Partial<teamsseason>): Promise<teamsseason> {
    return this.prisma.teamsseason.create({
      data: data as Parameters<typeof this.prisma.teamsseason.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<teamsseason>): Promise<teamsseason> {
    return this.prisma.teamsseason.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<teamsseason> {
    return this.prisma.teamsseason.delete({
      where: { id: Number(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.teamsseason.count({ where });
  }

  async findBySeasonId(seasonId: bigint, accountId: bigint): Promise<teamsseason[]> {
    return this.prisma.teamsseason.findMany({
      where: {
        leagueseason: {
          seasonid: seasonId,
          season: {
            accountid: accountId,
          },
        },
      },
      include: {
        teams: true,
        leagueseason: {
          include: {
            league: true,
            divisionseason: true,
          },
        },
      },
    });
  }

  async findTeamSeasonWithLeague(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonWithLeague | null> {
    const result = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          season: {
            accountid: accountId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        leagueseason: {
          include: {
            league: true,
            divisionseason: true,
          },
        },
      },
    });

    return result;
  }

  async findTeamDefinition(teamId: bigint): Promise<teams | null> {
    return this.prisma.teams.findUnique({
      where: { id: teamId },
    });
  }

  async findTeamManager(
    contactId: bigint,
    teamId: bigint,
    seasonId: bigint,
  ): Promise<teamseasonmanager | null> {
    return this.prisma.teamseasonmanager.findFirst({
      where: {
        contactid: contactId,
        teamseasonid: teamId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
          },
        },
      },
    });
  }

  async findTeamSeason(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<teamsseason | null> {
    return this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: { seasonid: seasonId, league: { accountid: accountId } },
      },
    });
  }

  async findTeamSeasonManagers(
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbTeamSeasonManagerContact[]> {
    // Query team managers for the current season using Prisma relations
    return await this.prisma.teamseasonmanager.findMany({
      where: {
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
          },
        },
        contacts: {
          creatoraccountid: accountId,
        },
      },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        teamsseason: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { contacts: { lastname: 'asc' } },
        { contacts: { firstname: 'asc' } },
        { teamsseason: { name: 'asc' } },
      ],
    });
  }
}
