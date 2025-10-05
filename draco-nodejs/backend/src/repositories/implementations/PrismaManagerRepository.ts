import { PrismaClient, Prisma, teamseasonmanager } from '@prisma/client';
import {
  IManagerRepository,
  SeasonManagerRepositoryFilters,
} from '../interfaces/IManagerRepository.js';
import { dbSeasonManagerWithRelations, dbTeamManagerWithContact } from '../types/dbTypes.js';

export class PrismaManagerRepository implements IManagerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<teamseasonmanager | null> {
    return this.prisma.teamseasonmanager.findUnique({
      where: { id: Number(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<teamseasonmanager[]> {
    return this.prisma.teamseasonmanager.findMany({ where });
  }

  async create(data: Partial<teamseasonmanager>): Promise<teamseasonmanager> {
    return this.prisma.teamseasonmanager.create({
      data: data as Parameters<typeof this.prisma.teamseasonmanager.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<teamseasonmanager>): Promise<teamseasonmanager> {
    return this.prisma.teamseasonmanager.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<teamseasonmanager> {
    return this.prisma.teamseasonmanager.delete({
      where: { id: Number(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.teamseasonmanager.count({ where });
  }

  async findSeasonManagers(
    accountId: bigint,
    seasonId: bigint,
    filters?: SeasonManagerRepositoryFilters,
  ): Promise<dbSeasonManagerWithRelations[]> {
    const teamSeasonWhere: Prisma.teamsseasonWhereInput = {
      leagueseason: {
        season: {
          id: seasonId,
          accountid: accountId,
        },
      },
    };

    if (filters?.leagueSeasonId) {
      teamSeasonWhere.leagueseasonid = filters.leagueSeasonId;
    }

    const whereClause: Prisma.teamseasonmanagerWhereInput = {
      teamsseason: teamSeasonWhere,
    };

    if (filters?.teamSeasonId) {
      whereClause.teamseasonid = filters.teamSeasonId;
    }

    if (filters?.search) {
      whereClause.contacts = {
        OR: [
          { firstname: { contains: filters.search, mode: 'insensitive' } },
          { lastname: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.teamseasonmanager.findMany({
      where: whereClause,
      select: {
        id: true,
        contactid: true,
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            phone1: true,
            phone2: true,
            phone3: true,
          },
        },
        teamsseason: {
          select: {
            id: true,
            name: true,
            leagueseasonid: true,
            leagueseason: {
              select: {
                id: true,
                league: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ contacts: { lastname: 'asc' } }, { contacts: { firstname: 'asc' } }],
    });
  }

  async findTeamManagers(teamSeasonId: bigint): Promise<dbTeamManagerWithContact[]> {
    return this.prisma.teamseasonmanager.findMany({
      where: { teamseasonid: teamSeasonId },
      include: { contacts: true },
    });
  }

  async createTeamManager(
    teamSeasonId: bigint,
    contactId: bigint,
  ): Promise<dbTeamManagerWithContact> {
    return this.prisma.teamseasonmanager.create({
      data: {
        teamseasonid: teamSeasonId,
        contactid: contactId,
      },
      include: { contacts: true },
    });
  }

  async findTeamManager(
    teamSeasonId: bigint,
    contactId: bigint,
  ): Promise<teamseasonmanager | null> {
    return this.prisma.teamseasonmanager.findFirst({
      where: {
        teamseasonid: teamSeasonId,
        contactid: contactId,
      },
    });
  }
}
