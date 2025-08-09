import { PrismaClient } from '@prisma/client';
import { BatchQueryHelper } from './batchQueries.js';

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

/**
 * Calculate team record from games data
 * @param games - Array of games for the team
 * @param teamSeasonId - The team season ID to calculate record for
 * @returns TeamRecord object with wins, losses, and ties
 */
export function calculateTeamRecord(
  games: Array<{
    hteamid: bigint;
    vteamid: bigint;
    hscore: number;
    vscore: number;
    gamestatus: number;
  }>,
  teamSeasonId: bigint,
): TeamRecord {
  let wins = 0,
    losses = 0,
    ties = 0;

  for (const game of games) {
    const isHome = game.hteamid === teamSeasonId;
    const ourScore = isHome ? game.hscore : game.vscore;
    const oppScore = isHome ? game.vscore : game.hscore;
    const status = game.gamestatus;

    if (status === 5) {
      // Did not report
      losses++;
    } else if (ourScore > oppScore) {
      wins++;
    } else if (ourScore < oppScore) {
      losses++;
    } else if (status === 4) {
      // Forfeit, if tie score, then both teams get a loss (double forfeit)
      losses++;
    } else {
      ties++;
    }
  }

  return { wins, losses, ties };
}

/**
 * Fetch and calculate team record from database
 * @param prisma - Prisma client instance
 * @param teamSeasonId - The team season ID to calculate record for
 * @returns Promise<TeamRecord> object with wins, losses, and ties
 */
export async function getTeamRecord(
  prisma: PrismaClient,
  teamSeasonId: bigint,
): Promise<TeamRecord> {
  // Use batch helper for better performance when called multiple times
  const records = await BatchQueryHelper.batchTeamRecords(prisma, [teamSeasonId]);
  return records.get(teamSeasonId.toString()) || { wins: 0, losses: 0, ties: 0 };
}

/**
 * Fetch and calculate multiple team records from database (batch operation)
 * @param prisma - Prisma client instance
 * @param teamSeasonIds - Array of team season IDs to calculate records for
 * @returns Promise<Map<string, TeamRecord>> mapping team ID to record
 */
export async function getTeamRecords(
  prisma: PrismaClient,
  teamSeasonIds: bigint[],
): Promise<Map<string, TeamRecord>> {
  return BatchQueryHelper.batchTeamRecords(prisma, teamSeasonIds);
}
