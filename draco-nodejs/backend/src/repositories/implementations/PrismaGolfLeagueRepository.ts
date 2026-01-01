import { PrismaClient, golfleaguesetup, golfseasonconfig } from '#prisma/client';
import {
  IGolfLeagueRepository,
  GolfLeagueSetupWithOfficers,
  GolfAccountInfo,
} from '../interfaces/IGolfLeagueRepository.js';

export class PrismaGolfLeagueRepository implements IGolfLeagueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByLeagueSeasonId(leagueSeasonId: bigint): Promise<GolfLeagueSetupWithOfficers | null> {
    return this.prisma.golfleaguesetup.findUnique({
      where: { leagueseasonid: leagueSeasonId },
      include: {
        contacts_golfleaguesetup_presidentidTocontacts: true,
        contacts_golfleaguesetup_vicepresidentidTocontacts: true,
        contacts_golfleaguesetup_secretaryidTocontacts: true,
        contacts_golfleaguesetup_treasureridTocontacts: true,
        leagueseason: {
          include: {
            golfseasonconfig: true,
          },
        },
      },
    });
  }

  async getLeagueSeasonId(accountId: bigint, seasonId: bigint): Promise<bigint | null> {
    const leagueSeason = await this.prisma.leagueseason.findFirst({
      where: {
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
      select: { id: true },
    });
    return leagueSeason?.id ?? null;
  }

  async create(data: Partial<golfleaguesetup>): Promise<golfleaguesetup> {
    return this.prisma.golfleaguesetup.create({
      data: data as Parameters<typeof this.prisma.golfleaguesetup.create>[0]['data'],
    });
  }

  async update(leagueSeasonId: bigint, data: Partial<golfleaguesetup>): Promise<golfleaguesetup> {
    return this.prisma.golfleaguesetup.update({
      where: { leagueseasonid: leagueSeasonId },
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

  async upsertSeasonConfig(leagueSeasonId: bigint, teamSize: number): Promise<golfseasonconfig> {
    return this.prisma.golfseasonconfig.upsert({
      where: { leagueseasonid: leagueSeasonId },
      update: { teamsize: teamSize },
      create: { leagueseasonid: leagueSeasonId, teamsize: teamSize },
    });
  }
}
