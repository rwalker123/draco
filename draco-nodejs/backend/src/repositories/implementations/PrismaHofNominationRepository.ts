import { PrismaClient } from '@prisma/client';
import {
  CreateHofNominationData,
  HofNominationListResult,
  IHofNominationRepository,
} from '../interfaces/IHofNominationRepository.js';
import { dbHofNomination } from '../types/dbTypes.js';

export class PrismaHofNominationRepository implements IHofNominationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(accountId: bigint, data: CreateHofNominationData): Promise<dbHofNomination> {
    return this.prisma.hofnomination.create({
      data: {
        accountid: accountId,
        nominator: data.nominator,
        nominee: data.nominee,
        phonenumber: data.phoneNumber,
        email: data.email,
        reason: data.reason,
      },
      select: {
        id: true,
        accountid: true,
        nominator: true,
        phonenumber: true,
        email: true,
        nominee: true,
        reason: true,
      },
    });
  }

  async list(accountId: bigint, skip: number, take: number): Promise<HofNominationListResult> {
    const [nominations, total] = await Promise.all([
      this.prisma.hofnomination.findMany({
        where: {
          accountid: accountId,
        },
        orderBy: {
          id: 'desc',
        },
        skip,
        take,
        select: {
          id: true,
          accountid: true,
          nominator: true,
          phonenumber: true,
          email: true,
          nominee: true,
          reason: true,
        },
      }),
      this.prisma.hofnomination.count({
        where: {
          accountid: accountId,
        },
      }),
    ]);

    return {
      nominations: nominations as dbHofNomination[],
      total,
    };
  }

  async delete(accountId: bigint, nominationId: bigint): Promise<boolean> {
    const result = await this.prisma.hofnomination.deleteMany({
      where: {
        accountid: accountId,
        id: nominationId,
      },
    });

    return result.count > 0;
  }
}
