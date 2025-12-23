import { Prisma, PrismaClient, leagueumpires } from '#prisma/client';
import {
  IUmpireRepository,
  UmpireCreateData,
  UmpireFindOptions,
} from '../interfaces/IUmpireRepository.js';
import { dbLeagueUmpireWithContact } from '../types/dbTypes.js';

export class PrismaUmpireRepository implements IUmpireRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<leagueumpires | null> {
    return this.prisma.leagueumpires.findUnique({
      where: { id: Number(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<leagueumpires[]> {
    return this.prisma.leagueumpires.findMany({ where });
  }

  async create(data: UmpireCreateData): Promise<leagueumpires> {
    return this.prisma.leagueumpires.create({
      data: {
        accounts: { connect: { id: Number(data.accountid) } },
        contacts: { connect: { id: Number(data.contactid) } },
      },
    });
  }

  async update(id: bigint, data: Partial<leagueumpires>): Promise<leagueumpires> {
    return this.prisma.leagueumpires.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<leagueumpires> {
    return this.prisma.leagueumpires.delete({
      where: { id: Number(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.leagueumpires.count({ where });
  }

  async findByAccount(
    accountId: bigint,
    options: UmpireFindOptions,
  ): Promise<dbLeagueUmpireWithContact[]> {
    // Build orderBy from simple sortField and sortOrder
    let orderBy: Prisma.leagueumpiresOrderByWithRelationInput = { contacts: { lastname: 'asc' } };
    if (options.sortField) {
      const sortOrder = options.sortOrder || 'asc';
      if (options.sortField.startsWith('contacts.')) {
        const contactField = options.sortField.substring(9) as keyof typeof orderBy;
        orderBy = { contacts: { [contactField]: sortOrder } };
      } else if (options.sortField === 'id') {
        orderBy = { id: sortOrder };
      }
    }

    return this.prisma.leagueumpires.findMany({
      where: { accountid: accountId },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middlename: true,
            email: true,
            phone1: true,
            phone2: true,
            phone3: true,
            streetaddress: true,
            city: true,
            state: true,
            zip: true,
            dateofbirth: true,
          },
        },
      },
      orderBy,
      skip: options.skip,
      take: options.take,
    });
  }

  async findByAccountAndId(
    accountId: bigint,
    umpireId: bigint,
  ): Promise<dbLeagueUmpireWithContact | null> {
    return this.prisma.leagueumpires.findFirst({
      where: { id: Number(umpireId), accountid: accountId },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middlename: true,
            email: true,
            phone1: true,
            phone2: true,
            phone3: true,
            streetaddress: true,
            city: true,
            state: true,
            zip: true,
            dateofbirth: true,
          },
        },
      },
    });
  }

  async findByAccountAndContact(
    accountId: bigint,
    contactId: bigint,
  ): Promise<dbLeagueUmpireWithContact | null> {
    return this.prisma.leagueumpires.findFirst({
      where: { accountid: accountId, contactid: contactId },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middlename: true,
            email: true,
            phone1: true,
            phone2: true,
            phone3: true,
            streetaddress: true,
            city: true,
            state: true,
            zip: true,
            dateofbirth: true,
          },
        },
      },
    });
  }

  async countByAccount(accountId: bigint): Promise<number> {
    return this.prisma.leagueumpires.count({
      where: { accountid: accountId },
    });
  }
}
