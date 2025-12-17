import type {
  PrismaClient,
  availablefields,
  accounts,
  leagueumpires,
  leagueschedule,
  teamsseason,
} from '#prisma/client';
import type { ISchedulerProblemSpecRepository } from '../interfaces/ISchedulerProblemSpecRepository.js';

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

  async listAccountUmpires(accountId: bigint): Promise<leagueumpires[]> {
    return this.prisma.leagueumpires.findMany({
      where: { accountid: accountId },
    });
  }

  async listSeasonGames(seasonId: bigint): Promise<leagueschedule[]> {
    return this.prisma.leagueschedule.findMany({
      where: { leagueseason: { seasonid: seasonId } },
    });
  }
}
