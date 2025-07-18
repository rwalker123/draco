import { PrismaClient } from '@prisma/client';

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
  // Fetch all games for this team where status is 1, 4, or 5 (Final, Forfeit, Did Not Report)
  const games = await prisma.leagueschedule.findMany({
    where: {
      OR: [{ hteamid: teamSeasonId }, { vteamid: teamSeasonId }],
      gamestatus: { in: [1, 4, 5] },
    },
    select: {
      hteamid: true,
      vteamid: true,
      hscore: true,
      vscore: true,
      gamestatus: true,
    },
  });

  return calculateTeamRecord(games, teamSeasonId);
}
