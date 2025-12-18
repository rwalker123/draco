import { PrismaClient, Prisma, schedulerfieldexclusiondates } from '#prisma/client';
import { ISchedulerFieldExclusionDatesRepository } from '../interfaces/ISchedulerFieldExclusionDatesRepository.js';

export class PrismaSchedulerFieldExclusionDatesRepository implements ISchedulerFieldExclusionDatesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<schedulerfieldexclusiondates | null> {
    return this.prisma.schedulerfieldexclusiondates.findUnique({ where: { id } });
  }

  async findForAccount(
    id: bigint,
    accountId: bigint,
  ): Promise<schedulerfieldexclusiondates | null> {
    return this.prisma.schedulerfieldexclusiondates.findFirst({
      where: { id, accountid: accountId },
    });
  }

  async listForSeason(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<schedulerfieldexclusiondates[]> {
    return this.prisma.schedulerfieldexclusiondates.findMany({
      where: { accountid: accountId, seasonid: seasonId },
      orderBy: [{ fieldid: 'asc' }, { exclusiondate: 'asc' }],
    });
  }

  async create(data: Partial<schedulerfieldexclusiondates>): Promise<schedulerfieldexclusiondates> {
    return this.prisma.schedulerfieldexclusiondates.create({
      data: data as Prisma.schedulerfieldexclusiondatesCreateInput,
    });
  }

  async update(
    id: bigint,
    data: Partial<schedulerfieldexclusiondates>,
  ): Promise<schedulerfieldexclusiondates> {
    return this.prisma.schedulerfieldexclusiondates.update({
      where: { id },
      data: data as Prisma.schedulerfieldexclusiondatesUpdateInput,
    });
  }

  async delete(id: bigint): Promise<schedulerfieldexclusiondates> {
    return this.prisma.schedulerfieldexclusiondates.delete({ where: { id } });
  }
}
