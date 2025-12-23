import type {
  PrismaClient,
  availablefields,
  accounts,
  leagueschedule,
  teamsseason,
} from '#prisma/client';
import type { ISchedulerProblemSpecRepository } from '../interfaces/ISchedulerProblemSpecRepository.js';
import type { dbLeagueUmpireWithContact } from '../types/dbTypes.js';

export class PrismaSchedulerProblemSpecRepository implements ISchedulerProblemSpecRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAccount(accountId: bigint): Promise<accounts | null> {
    return this.prisma.accounts.findUnique({ where: { id: accountId } });
  }

  async listSeasonTeams(seasonId: bigint): Promise<teamsseason[]> {
    return this.prisma.teamsseason.findMany({
      where: { leagueseason: { seasonid: seasonId } },
    });
  }

  async listAccountFields(accountId: bigint): Promise<availablefields[]> {
    return this.prisma.availablefields.findMany({
      where: { accountid: accountId },
    });
  }

  async listAccountUmpires(accountId: bigint): Promise<dbLeagueUmpireWithContact[]> {
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
    });
  }

  async listSeasonGames(seasonId: bigint): Promise<leagueschedule[]> {
    return this.prisma.leagueschedule.findMany({
      where: { leagueseason: { seasonid: seasonId } },
    });
  }
}
