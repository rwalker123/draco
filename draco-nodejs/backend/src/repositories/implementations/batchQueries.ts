import { PrismaClient } from '#prisma/client';

/**
 * Utility class for performing batch queries to eliminate N+1 query problems
 */
export class BatchQueryHelper {
  private static teamNameCache = new Map<string, { name: string; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Batch load team names for multiple team IDs
   * @param prisma - Prisma client instance
   * @param teamIds - Array of team season IDs
   * @returns Map of team ID to team name
   */
  static async batchTeamNames(
    prisma: PrismaClient,
    teamIds: bigint[],
  ): Promise<Map<string, string>> {
    if (teamIds.length === 0) {
      return new Map();
    }

    const result = new Map<string, string>();
    const uncachedIds: bigint[] = [];
    const now = Date.now();

    // Check cache first
    for (const teamId of teamIds) {
      const key = teamId.toString();
      const cached = this.teamNameCache.get(key);

      if (cached && now - cached.timestamp < this.CACHE_TTL) {
        result.set(key, cached.name);
      } else {
        uncachedIds.push(teamId);
        // Remove expired cache entry
        this.teamNameCache.delete(key);
      }
    }

    // Fetch uncached team names in a single query
    if (uncachedIds.length > 0) {
      const teams = await prisma.teamsseason.findMany({
        where: {
          id: {
            in: uncachedIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Add to result and cache
      for (const team of teams) {
        const key = team.id.toString();
        result.set(key, team.name);
        this.teamNameCache.set(key, {
          name: team.name,
          timestamp: now,
        });
      }
    }

    return result;
  }

  /**
   * Batch load team records for multiple team IDs
   * @param prisma - Prisma client instance
   * @param teamIds - Array of team season IDs
   * @returns Map of team ID to team record
   */
  static async batchTeamRecords(
    prisma: PrismaClient,
    teamIds: bigint[],
  ): Promise<Map<string, { wins: number; losses: number; ties: number }>> {
    if (teamIds.length === 0) {
      return new Map();
    }

    // Fetch all games for all teams in a single query
    const games = await prisma.leagueschedule.findMany({
      where: {
        OR: [{ hteamid: { in: teamIds } }, { vteamid: { in: teamIds } }],
        gamestatus: { in: [1, 4, 5] }, // Final, Forfeit, Did Not Report
      },
      select: {
        hteamid: true,
        vteamid: true,
        hscore: true,
        vscore: true,
        gamestatus: true,
      },
    });

    // Calculate records for each team
    const records = new Map<string, { wins: number; losses: number; ties: number }>();

    // Initialize all teams with 0 record
    for (const teamId of teamIds) {
      records.set(teamId.toString(), { wins: 0, losses: 0, ties: 0 });
    }

    // Process games and update records
    for (const game of games) {
      const homeTeamKey = game.hteamid.toString();
      const awayTeamKey = game.vteamid.toString();

      if (records.has(homeTeamKey)) {
        const record = records.get(homeTeamKey)!;
        this.updateTeamRecord(record, game, true);
      }

      if (records.has(awayTeamKey)) {
        const record = records.get(awayTeamKey)!;
        this.updateTeamRecord(record, game, false);
      }
    }

    return records;
  }

  /**
   * Update team record based on game result
   */
  private static updateTeamRecord(
    record: { wins: number; losses: number; ties: number },
    game: {
      hscore: number;
      vscore: number;
      gamestatus: number;
    },
    isHome: boolean,
  ): void {
    const ourScore = isHome ? game.hscore : game.vscore;
    const oppScore = isHome ? game.vscore : game.hscore;

    if (game.gamestatus === 5) {
      // Did not report
      record.losses++;
    } else if (ourScore > oppScore) {
      record.wins++;
    } else if (ourScore < oppScore) {
      record.losses++;
    } else if (game.gamestatus === 4) {
      // Forfeit with tie score = double forfeit
      record.losses++;
    } else {
      record.ties++;
    }
  }

  /**
   * Clear expired cache entries
   */
  static clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.teamNameCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.teamNameCache.delete(key);
      }
    }
  }

  /**
   * Clear all caches (useful for testing)
   */
  static clearAllCaches(): void {
    this.teamNameCache.clear();
  }
}
