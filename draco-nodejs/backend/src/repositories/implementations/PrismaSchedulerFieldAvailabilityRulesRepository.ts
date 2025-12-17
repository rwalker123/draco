import { PrismaClient, Prisma, schedulerfieldavailabilityrules } from '#prisma/client';
import { ISchedulerFieldAvailabilityRulesRepository } from '../interfaces/ISchedulerFieldAvailabilityRulesRepository.js';

export class PrismaSchedulerFieldAvailabilityRulesRepository implements ISchedulerFieldAvailabilityRulesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<schedulerfieldavailabilityrules | null> {
    return this.prisma.schedulerfieldavailabilityrules.findUnique({
      where: { id },
    });
  }

  async findForAccount(
    id: bigint,
    accountId: bigint,
  ): Promise<schedulerfieldavailabilityrules | null> {
    return this.prisma.schedulerfieldavailabilityrules.findFirst({
      where: { id, accountid: accountId },
    });
  }

  async listForSeason(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<schedulerfieldavailabilityrules[]> {
    return this.prisma.schedulerfieldavailabilityrules.findMany({
      where: { accountid: accountId, seasonid: seasonId },
      orderBy: [{ fieldid: 'asc' }, { startdate: 'asc' }, { starttimelocal: 'asc' }],
    });
  }

  async create(
    data: Partial<schedulerfieldavailabilityrules>,
  ): Promise<schedulerfieldavailabilityrules> {
    return this.prisma.schedulerfieldavailabilityrules.create({
      data: data as Prisma.schedulerfieldavailabilityrulesCreateInput,
    });
  }

  async update(
    id: bigint,
    data: Partial<schedulerfieldavailabilityrules>,
  ): Promise<schedulerfieldavailabilityrules> {
    return this.prisma.schedulerfieldavailabilityrules.update({
      where: { id },
      data: data as Prisma.schedulerfieldavailabilityrulesUpdateInput,
    });
  }

  async delete(id: bigint): Promise<schedulerfieldavailabilityrules> {
    return this.prisma.schedulerfieldavailabilityrules.delete({
      where: { id },
    });
  }
}
