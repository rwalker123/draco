import { PrismaClient, memberbusiness } from '@prisma/client';
import { IMemberBusinessRepository } from '../interfaces/IMemberBusinessRepository.js';
import { dbMemberBusiness } from '../types/index.js';

export class PrismaMemberBusinessRepository implements IMemberBusinessRepository {
  private readonly select = {
    id: true,
    contactid: true,
    name: true,
    streetaddress: true,
    citystatezip: true,
    description: true,
    email: true,
    phone: true,
    fax: true,
    website: true,
    contacts: {
      select: {
        id: true,
        creatoraccountid: true,
        firstname: true,
        lastname: true,
      },
    },
  } as const;

  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<memberbusiness | null> {
    return this.prisma.memberbusiness.findUnique({ where: { id } });
  }

  async findByIdForAccount(
    memberBusinessId: bigint,
    accountId: bigint,
  ): Promise<dbMemberBusiness | null> {
    return this.prisma.memberbusiness.findFirst({
      where: {
        id: memberBusinessId,
        contacts: {
          creatoraccountid: accountId,
        },
      },
      select: this.select,
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<memberbusiness[]> {
    return this.prisma.memberbusiness.findMany({ where });
  }

  async listByAccount(
    accountId: bigint,
    options: { contactId?: bigint; seasonId?: bigint } = {},
  ): Promise<dbMemberBusiness[]> {
    const { contactId, seasonId } = options;

    return this.prisma.memberbusiness.findMany({
      where: {
        ...(contactId ? { contactid: contactId } : {}),
        contacts: {
          creatoraccountid: accountId,
          ...(seasonId
            ? {
                roster: {
                  is: {
                    rosterseason: {
                      some: {
                        inactive: false,
                        teamsseason: {
                          divisionseasonid: { not: null },
                          leagueseason: {
                            seasonid: seasonId,
                            league: {
                              accountid: accountId,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              }
            : {}),
        },
      },
      select: this.select,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(data: Partial<memberbusiness>): Promise<memberbusiness> {
    return this.prisma.memberbusiness.create({
      data: data as Parameters<typeof this.prisma.memberbusiness.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<memberbusiness>): Promise<memberbusiness> {
    return this.prisma.memberbusiness.update({
      where: { id },
      data,
    });
  }

  async delete(id: bigint): Promise<memberbusiness> {
    return this.prisma.memberbusiness.delete({ where: { id } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.memberbusiness.count({ where });
  }
}
