import type { PrismaClient } from '#prisma/client';
import type { ISchedulerMatchupRepository } from '../interfaces/ISchedulerMatchupRepository.js';

export class PrismaSchedulerMatchupRepository implements ISchedulerMatchupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listLeagueTeamsWithDivision(
    leagueSeasonIds: bigint[],
  ): Promise<
    Array<{ leagueseasonid: bigint; teamseasonid: bigint; divisionseasonid: bigint | null }>
  > {
    const rows = await this.prisma.teamsseason.findMany({
      where: { leagueseasonid: { in: leagueSeasonIds } },
      select: { id: true, leagueseasonid: true, divisionseasonid: true },
    });
    return rows.map((row) => ({
      leagueseasonid: row.leagueseasonid,
      teamseasonid: row.id,
      divisionseasonid: row.divisionseasonid,
    }));
  }

  async listLeagueSeasonIdsBySeasonAndAccount(
    seasonId: bigint,
    accountId: bigint,
  ): Promise<bigint[]> {
    const rows = await this.prisma.leagueseason.findMany({
      where: { seasonid: seasonId, league: { accountid: accountId } },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }
}
