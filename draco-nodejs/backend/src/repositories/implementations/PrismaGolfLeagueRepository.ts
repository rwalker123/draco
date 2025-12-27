import { PrismaClient, golfleaguesetup } from '#prisma/client';
import {
  IGolfLeagueRepository,
  GolfLeagueSetupWithOfficers,
  GolfAccountInfo,
} from '../interfaces/IGolfLeagueRepository.js';

export class PrismaGolfLeagueRepository implements IGolfLeagueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAccountId(accountId: bigint): Promise<GolfLeagueSetupWithOfficers | null> {
    return this.prisma.golfleaguesetup.findUnique({
      where: { id: accountId },
      include: {
        contacts_golfleaguesetup_presidentidTocontacts: true,
        contacts_golfleaguesetup_vicepresidentidTocontacts: true,
        contacts_golfleaguesetup_secretaryidTocontacts: true,
        contacts_golfleaguesetup_treasureridTocontacts: true,
      },
    });
  }

  async create(data: Partial<golfleaguesetup>): Promise<golfleaguesetup> {
    return this.prisma.golfleaguesetup.create({
      data: data as Parameters<typeof this.prisma.golfleaguesetup.create>[0]['data'],
    });
  }

  async update(accountId: bigint, data: Partial<golfleaguesetup>): Promise<golfleaguesetup> {
    return this.prisma.golfleaguesetup.update({
      where: { id: accountId },
      data,
    });
  }

  async getGolfAccounts(): Promise<GolfAccountInfo[]> {
    const accounts = await this.prisma.accounts.findMany({
      where: {
        accounttypes: {
          name: { contains: 'Golf', mode: 'insensitive' },
        },
      },
      include: {
        accounttypes: true,
        golfleaguesetup: {
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      accountTypeName: account.accounttypes.name,
      hasGolfSetup: account.golfleaguesetup !== null,
    }));
  }
}
