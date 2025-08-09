import { PrismaClient } from '@prisma/client';
import { GameStatus, GameType } from '../types/gameEnums.js';

export class MinimumCalculator {
  private prisma: PrismaClient;

  // Fixed minimums (matching ASP.NET constants)
  public static readonly ALL_TIME_MIN_AB = 150;
  public static readonly MIN_AB_PER_SEASON = 30;
  public static readonly ALL_TIME_MIN_IP = 100;
  public static readonly MIN_IP_PER_SEASON = 20;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Calculate minimum AB for a league
   * Formula: (totalGames * 2) / numTeams * 1.5
   * Based on 1.5 minimum at-bats per game
   */
  async calculateLeagueMinAB(leagueSeasonId: bigint): Promise<number> {
    return this.calculateLeagueMin(leagueSeasonId, 1.5);
  }

  /**
   * Calculate minimum IP for a league
   * Formula: (totalGames * 2) / numTeams * 1.0
   * Based on 1.0 minimum innings pitched per game
   */
  async calculateLeagueMinIP(leagueSeasonId: bigint): Promise<number> {
    return this.calculateLeagueMin(leagueSeasonId, 1.0);
  }

  /**
   * Calculate minimum AB for a team
   * Formula: numGames * 1.5
   */
  async calculateTeamMinAB(teamSeasonId: bigint): Promise<number> {
    return this.calculateTeamMin(teamSeasonId, 1.5);
  }

  /**
   * Calculate minimum IP for a team
   * Formula: numGames * 1.0
   */
  async calculateTeamMinIP(teamSeasonId: bigint): Promise<number> {
    return this.calculateTeamMin(teamSeasonId, 1.0);
  }

  /**
   * Private method to calculate league minimum
   * Matches ASP.NET CalculateMin method exactly
   */
  private async calculateLeagueMin(leagueSeasonId: bigint, minMultiplier: number): Promise<number> {
    // Count total completed games (GameType = RegularSeason, GameStatus in [Completed, Forfeit, DidNotReport])
    const totalGames = await this.prisma.leagueschedule.count({
      where: {
        leagueid: leagueSeasonId,
        gametype: GameType.RegularSeason,
        gamestatus: {
          in: [GameStatus.Completed, GameStatus.Forfeit, GameStatus.DidNotReport], // Completed game statuses
        },
      },
    });

    // Each game involves 2 teams, so multiply by 2
    const numGames = totalGames * 2;

    // Count number of teams in this league season
    const numTeams = await this.prisma.teamsseason.count({
      where: {
        leagueseasonid: leagueSeasonId,
      },
    });

    if (numTeams === 0) {
      return 0;
    }

    const curMin = (numGames / numTeams) * minMultiplier;

    return Math.max(0, Math.floor(curMin));
  }

  /**
   * Private method to calculate team minimum
   * Matches ASP.NET CalculateTeamMin method exactly
   */
  private async calculateTeamMin(teamSeasonId: bigint, minMultiplier: number): Promise<number> {
    // Count games where this team was home or visitor (completed games only)
    const numGames = await this.prisma.leagueschedule.count({
      where: {
        OR: [{ hteamid: teamSeasonId }, { vteamid: teamSeasonId }],
        gametype: 0,
        gamestatus: {
          in: [1, 4, 5], // Completed game statuses
        },
      },
    });

    const curMin = numGames * minMultiplier;

    return Math.max(0, Math.floor(curMin));
  }
}
