import { PrismaClient, sponsors } from '@prisma/client';
import { ISponsorRepository } from '../interfaces/ISponsorRepository.js';
import { dbSponsor } from '../types/index.js';

export class PrismaSponsorRepository implements ISponsorRepository {
  private readonly sponsorSelect = {
    id: true,
    accountid: true,
    teamid: true,
    name: true,
    streetaddress: true,
    citystatezip: true,
    description: true,
    email: true,
    phone: true,
    fax: true,
    website: true,
  } as const;

  constructor(private prisma: PrismaClient) {}

  async findById(id: bigint): Promise<sponsors | null> {
    return this.prisma.sponsors.findUnique({ where: { id: BigInt(id) } });
  }

  async findByIdAndAccount(sponsorId: bigint, accountId: bigint): Promise<dbSponsor | null> {
    return this.prisma.sponsors.findFirst({
      where: { id: sponsorId, accountid: accountId },
      select: this.sponsorSelect,
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<sponsors[]> {
    return this.prisma.sponsors.findMany({ where });
  }

  async listAccountSponsors(accountId: bigint): Promise<dbSponsor[]> {
    return this.prisma.sponsors.findMany({
      where: { accountid: accountId, teamid: null },
      select: this.sponsorSelect,
      orderBy: { name: 'asc' },
    });
  }

  async listTeamSponsors(accountId: bigint, teamId: bigint): Promise<dbSponsor[]> {
    return this.prisma.sponsors.findMany({
      where: { accountid: accountId, teamid: teamId },
      select: this.sponsorSelect,
      orderBy: { name: 'asc' },
    });
  }

  async create(data: Partial<sponsors>): Promise<sponsors> {
    return this.prisma.sponsors.create({
      data: data as Parameters<typeof this.prisma.sponsors.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<sponsors>): Promise<sponsors> {
    return this.prisma.sponsors.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<sponsors> {
    return this.prisma.sponsors.delete({ where: { id: BigInt(id) } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.sponsors.count({ where });
  }
}
