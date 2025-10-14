import { Prisma, PrismaClient, availablefields } from '@prisma/client';
import { IFieldRepository } from '../interfaces/IFieldRepository.js';
import { dbAvailableField } from '../types/dbTypes.js';

export class PrismaFieldRepository implements IFieldRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<availablefields | null> {
    return this.prisma.availablefields.findUnique({
      where: { id: Number(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<availablefields[]> {
    return this.prisma.availablefields.findMany({ where });
  }

  async create(data: Prisma.availablefieldsCreateInput): Promise<availablefields> {
    return this.prisma.availablefields.create({
      data: data as Parameters<typeof this.prisma.availablefields.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Prisma.availablefieldsUpdateInput): Promise<availablefields> {
    return this.prisma.availablefields.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<availablefields> {
    return this.prisma.availablefields.delete({
      where: { id: Number(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.availablefields.count({ where });
  }

  async findByAccount(
    accountId: bigint,
    options: {
      skip: number;
      take: number;
      orderBy: Prisma.availablefieldsOrderByWithRelationInput;
    },
  ): Promise<dbAvailableField[]> {
    return this.prisma.availablefields.findMany({
      where: { accountid: accountId },
      orderBy: options.orderBy,
      skip: options.skip,
      take: options.take,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipcode: true,
        shortname: true,
        comment: true,
        directions: true,
        rainoutnumber: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  async countByAccount(accountId: bigint): Promise<number> {
    return this.prisma.availablefields.count({
      where: { accountid: accountId },
    });
  }

  async findByName(accountId: bigint, name: string): Promise<availablefields | null> {
    return this.prisma.availablefields.findFirst({
      where: {
        accountid: accountId,
        name,
      },
    });
  }

  async findByNameExcludingId(
    accountId: bigint,
    name: string,
    excludeFieldId: bigint,
  ): Promise<availablefields | null> {
    return this.prisma.availablefields.findFirst({
      where: {
        accountid: accountId,
        name,
        id: { not: excludeFieldId },
      },
    });
  }

  async findAccountField(accountId: bigint, fieldId: bigint): Promise<availablefields | null> {
    return this.prisma.availablefields.findFirst({
      where: {
        id: fieldId,
        accountid: accountId,
      },
    });
  }

  async isFieldInUse(fieldId: bigint): Promise<boolean> {
    const scheduledGames = await this.prisma.leagueschedule.count({
      where: { fieldid: fieldId },
    });

    return scheduledGames > 0;
  }
}
