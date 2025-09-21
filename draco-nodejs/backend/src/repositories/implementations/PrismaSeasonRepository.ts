import { PrismaClient } from '@prisma/client';
import { ISeasonRepository } from '../interfaces/index.js';
import { dbSeason } from '../types/dbTypes.js';

export class PrismaSeasonRepository implements ISeasonRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: bigint): Promise<dbSeason | null> {
    return await this.prisma.season.findUnique({
      where: { id: id },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<dbSeason[]> {
    return await this.prisma.season.findMany({ where });
  }

  async create(data: Partial<dbSeason>): Promise<dbSeason> {
    return this.prisma.season.create({
      data: data as Parameters<typeof this.prisma.season.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<dbSeason>): Promise<dbSeason> {
    return await this.prisma.season.update({
      where: { id: id },
      data,
    });
  }

  async delete(id: bigint): Promise<dbSeason> {
    return await this.prisma.season.delete({
      where: { id: id },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return await this.prisma.season.count({ where });
  }

  async findCurrentSeason(accountId: bigint): Promise<dbSeason | null> {
    const currentSeason = await this.prisma.currentseason.findFirst({
      where: { accountid: accountId },
    });
    if (!currentSeason) {
      return null;
    }
    return await this.prisma.season.findUnique({
      where: { id: currentSeason.seasonid },
    });
  }
}
