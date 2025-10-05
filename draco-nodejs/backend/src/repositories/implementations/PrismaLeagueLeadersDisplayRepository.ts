import { PrismaClient } from '@prisma/client';
import { ILeagueLeadersDisplayRepository } from '../interfaces/ILeagueLeadersDisplayRepository.js';
import { dbLeaderCategoryConfig } from '../types/dbTypes.js';

export class PrismaLeagueLeadersDisplayRepository implements ILeagueLeadersDisplayRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findLeaderCategories(accountId: bigint): Promise<dbLeaderCategoryConfig[]> {
    return this.prisma.displayleagueleaders.findMany({
      where: { accountid: accountId },
      select: {
        fieldname: true,
        isbatleader: true,
      },
      orderBy: { fieldname: 'asc' },
    });
  }

  async findCategory(accountId: bigint, fieldName: string): Promise<dbLeaderCategoryConfig | null> {
    return this.prisma.displayleagueleaders.findFirst({
      where: {
        accountid: accountId,
        fieldname: {
          equals: fieldName,
          mode: 'insensitive',
        },
      },
      select: {
        fieldname: true,
        isbatleader: true,
      },
    });
  }
}
