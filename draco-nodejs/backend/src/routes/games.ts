import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * GET /api/accounts/:accountId/games/scoreboard/public
 * Get games for scoreboard display (today, yesterday, previous, recaps) - PUBLIC ENDPOINT
 */
router.get('/scoreboard/public',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const teamId = req.query.teamId ? BigInt(req.query.teamId as string) : null;

      // Get current season for this account
      const currentSeasonRecord = await prisma.currentseason.findUnique({
        where: {
          accountid: accountId
        }
      });

      if (!currentSeasonRecord) {
        res.json({
          success: true,
          data: {
            today: [],
            yesterday: [],
            previous: [],
            recaps: []
          }
        });
        return;
      }

      const currentSeason = await prisma.season.findUnique({
        where: {
          id: currentSeasonRecord.seasonid
        }
      });

      if (!currentSeason) {
        res.json({
          success: true,
          data: {
            today: [],
            yesterday: [],
            previous: [],
            recaps: []
          }
        });
        return;
      }

      // Calculate date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Base where clause
      const baseWhere = {
        leagueseason: {
          seasonid: currentSeason.id,
          league: {
            accountid: accountId
          }
        },
        ...(teamId && {
          OR: [
            { hteamid: teamId },
            { vteamid: teamId }
          ]
        })
      };

      // Get today's games
      const todayGames = await prisma.leagueschedule.findMany({
        where: {
          ...baseWhere,
          gamedate: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          leagueseason: {
            include: {
              league: {
                select: {
                  name: true
                }
              }
            }
          },
          availablefields: {
            select: {
              id: true,
              name: true,
              shortname: true
            }
          },
          gamerecap: {
            select: {
              teamid: true,
              recap: true
            }
          }
        },
        orderBy: {
          gamedate: 'asc'
        }
      });

      // Get games from yesterday
      const yesterdayGames = await prisma.leagueschedule.findMany({
        where: {
          ...baseWhere,
          gamedate: {
            gte: yesterday,
            lt: today
          }
        },
        include: {
          leagueseason: {
            include: {
              league: {
                select: {
                  name: true
                }
              }
            }
          },
          availablefields: {
            select: {
              id: true,
              name: true,
              shortname: true
            }
          },
          gamerecap: {
            select: {
              teamid: true,
              recap: true
            }
          }
        },
        orderBy: {
          gamedate: 'asc'
        }
      });

      // Get games with recaps (2-5 days ago)
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const recapGames = await prisma.leagueschedule.findMany({
        where: {
          ...baseWhere,
          gamedate: {
            gte: fiveDaysAgo,
            lt: twoDaysAgo
          },
          gamerecap: {
            some: {}
          }
        },
        include: {
          leagueseason: {
            include: {
              league: {
                select: {
                  name: true
                }
              }
            }
          },
          availablefields: {
            select: {
              id: true,
              name: true,
              shortname: true
            }
          },
          gamerecap: {
            select: {
              teamid: true,
              recap: true
            }
          }
        },
        orderBy: {
          gamedate: 'desc'
        }
      });

      // Helper function to get team names
      const getTeamNames = async (homeTeamId: bigint, awayTeamId: bigint) => {
        const teams = await prisma.teamsseason.findMany({
          where: {
            id: {
              in: [homeTeamId, awayTeamId]
            }
          },
          select: {
            id: true,
            name: true
          }
        });

        const homeTeam = teams.find(t => t.id === homeTeamId);
        const awayTeam = teams.find(t => t.id === awayTeamId);

        return {
          homeTeamName: homeTeam?.name || `Team ${homeTeamId}`,
          awayTeamName: awayTeam?.name || `Team ${awayTeamId}`
        };
      };

      // Helper function to format game data
      const formatGameData = (game: any, teamNames: any) => ({
        id: game.id.toString(),
        date: game.gamedate.toISOString(),
        homeTeamId: game.hteamid.toString(),
        awayTeamId: game.vteamid.toString(),
        homeTeamName: teamNames.homeTeamName,
        awayTeamName: teamNames.awayTeamName,
        homeScore: game.hscore,
        awayScore: game.vscore,
        gameStatus: game.gamestatus,
        gameStatusText: getGameStatusText(game.gamestatus),
        leagueName: game.leagueseason.league.name,
        fieldId: game.fieldid?.toString() || null,
        fieldName: game.availablefields?.name || null,
        fieldShortName: game.availablefields?.shortname || null,
        hasGameRecap: game.gamerecap.length > 0,
        gameRecaps: game.gamerecap.map((recap: any) => ({
          teamId: recap.teamid.toString(),
          recap: recap.recap
        }))
      });

      // Helper function to get game status text
      const getGameStatusText = (status: number): string => {
        switch (status) {
          case 0: return 'Scheduled';
          case 1: return 'Final';
          case 2: return 'In Progress';
          case 3: return 'Postponed';
          case 4: return 'Forfeit';
          case 5: return 'Did Not Report';
          default: return 'Unknown';
        }
      };

      // Process all games and get team names
      const processGames = async (games: any[]) => {
        const processedGames = [];
        for (const game of games) {
          const teamNames = await getTeamNames(game.hteamid, game.vteamid);
          processedGames.push(formatGameData(game, teamNames));
        }
        return processedGames;
      };

      const [todayProcessed, yesterdayProcessed, recapsProcessed] = await Promise.all([
        processGames(todayGames),
        processGames(yesterdayGames),
        processGames(recapGames)
      ]);

      res.json({
        success: true,
        data: {
          today: todayProcessed,
          yesterday: yesterdayProcessed,
          recaps: recapsProcessed
        }
      });
    } catch (error) {
      console.error('Error fetching public scoreboard games:', error);
      next(error);
    }
  }
);

/**
 * GET /api/accounts/:accountId/games/scoreboard
 * Get games for scoreboard display (today, yesterday, previous, recaps)
 */
router.get('/scoreboard',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const teamId = req.query.teamId ? BigInt(req.query.teamId as string) : null;

      // Get current season for this account
      const currentSeasonRecord = await prisma.currentseason.findUnique({
        where: {
          accountid: accountId
        }
      });

      if (!currentSeasonRecord) {
        res.json({
          success: true,
          data: {
            today: [],
            yesterday: [],
            recaps: []
          }
        });
        return;
      }

      const currentSeason = await prisma.season.findUnique({
        where: {
          id: currentSeasonRecord.seasonid
        }
      });

      if (!currentSeason) {
        res.json({
          success: true,
          data: {
            today: [],
            yesterday: [],
            recaps: []
          }
        });
        return;
      }

      // Calculate date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Base where clause
      const baseWhere = {
        leagueseason: {
          seasonid: currentSeason.id,
          league: {
            accountid: accountId
          }
        },
        ...(teamId && {
          OR: [
            { hteamid: teamId },
            { vteamid: teamId }
          ]
        })
      };

      // Get today's games
      const todayGames = await prisma.leagueschedule.findMany({
        where: {
          ...baseWhere,
          gamedate: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          leagueseason: {
            include: {
              league: {
                select: {
                  name: true
                }
              }
            }
          },
          availablefields: {
            select: {
              id: true,
              name: true,
              shortname: true
            }
          },
          gamerecap: {
            select: {
              teamid: true,
              recap: true
            }
          }
        },
        orderBy: {
          gamedate: 'asc'
        }
      });

      // Get yesterday's games
      const yesterdayGames = await prisma.leagueschedule.findMany({
        where: {
          ...baseWhere,
          gamedate: {
            gte: yesterday,
            lt: today
          }
        },
        include: {
          leagueseason: {
            include: {
              league: {
                select: {
                  name: true
                }
              }
            }
          },
          availablefields: {
            select: {
              id: true,
              name: true,
              shortname: true
            }
          },
          gamerecap: {
            select: {
              teamid: true,
              recap: true
            }
          }
        },
        orderBy: {
          gamedate: 'asc'
        }
      });

      // Get games with recaps (2-5 days ago)
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const recapGames = await prisma.leagueschedule.findMany({
        where: {
          ...baseWhere,
          gamedate: {
            gte: fiveDaysAgo,
            lt: twoDaysAgo
          },
          gamerecap: {
            some: {}
          }
        },
        include: {
          leagueseason: {
            include: {
              league: {
                select: {
                  name: true
                }
              }
            }
          },
          availablefields: {
            select: {
              id: true,
              name: true,
              shortname: true
            }
          },
          gamerecap: {
            select: {
              teamid: true,
              recap: true
            }
          }
        },
        orderBy: {
          gamedate: 'desc'
        }
      });

      // Helper function to get team names
      const getTeamNames = async (homeTeamId: bigint, awayTeamId: bigint) => {
        const teams = await prisma.teamsseason.findMany({
          where: {
            id: {
              in: [homeTeamId, awayTeamId]
            }
          },
          select: {
            id: true,
            name: true
          }
        });

        const homeTeam = teams.find(t => t.id === homeTeamId);
        const awayTeam = teams.find(t => t.id === awayTeamId);

        return {
          homeTeamName: homeTeam?.name || `Team ${homeTeamId}`,
          awayTeamName: awayTeam?.name || `Team ${awayTeamId}`
        };
      };

      // Helper function to format game data
      const formatGameData = (game: any, teamNames: any) => ({
        id: game.id.toString(),
        date: game.gamedate.toISOString(),
        homeTeamId: game.hteamid.toString(),
        awayTeamId: game.vteamid.toString(),
        homeTeamName: teamNames.homeTeamName,
        awayTeamName: teamNames.awayTeamName,
        homeScore: game.hscore,
        awayScore: game.vscore,
        gameStatus: game.gamestatus,
        gameStatusText: getGameStatusText(game.gamestatus),
        leagueName: game.leagueseason.league.name,
        fieldId: game.fieldid?.toString() || null,
        fieldName: game.availablefields?.name || null,
        fieldShortName: game.availablefields?.shortname || null,
        hasGameRecap: game.gamerecap.length > 0,
        gameRecaps: game.gamerecap.map((recap: any) => ({
          teamId: recap.teamid.toString(),
          recap: recap.recap
        }))
      });

      // Helper function to get game status text
      const getGameStatusText = (status: number): string => {
        switch (status) {
          case 0: return 'Scheduled';
          case 1: return 'Final';
          case 2: return 'In Progress';
          case 3: return 'Postponed';
          case 4: return 'Forfeit';
          case 5: return 'Did Not Report';
          default: return 'Unknown';
        }
      };

      // Process all games and get team names
      const processGames = async (games: any[]) => {
        const processedGames = [];
        for (const game of games) {
          const teamNames = await getTeamNames(game.hteamid, game.vteamid);
          processedGames.push(formatGameData(game, teamNames));
        }
        return processedGames;
      };

      const [todayProcessed, yesterdayProcessed, recapsProcessed] = await Promise.all([
        processGames(todayGames),
        processGames(yesterdayGames),
        processGames(recapGames)
      ]);

      res.json({
        success: true,
        data: {
          today: todayProcessed,
          yesterday: yesterdayProcessed,
          recaps: recapsProcessed
        }
      });
    } catch (error) {
      console.error('Error fetching scoreboard games:', error);
      next(error);
    }
  }
);

/**
 * GET /api/accounts/:accountId/games/:gameId
 * Get specific game details
 */
router.get('/:gameId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const gameId = BigInt(req.params.gameId);

      const game = await prisma.leagueschedule.findFirst({
        where: {
          id: gameId,
          leagueseason: {
            league: {
              accountid: accountId
            }
          }
        },
        include: {
          leagueseason: {
            include: {
              league: {
                select: {
                  name: true
                }
              }
            }
          },
          availablefields: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          gamerecap: {
            select: {
              teamid: true,
              recap: true
            }
          },
          batstatsum: {
            include: {
              rosterseason: {
                include: {
                  roster: {
                    include: {
                      contacts: {
                        select: {
                          firstname: true,
                          lastname: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          pitchstatsum: {
            include: {
              rosterseason: {
                include: {
                  roster: {
                    include: {
                      contacts: {
                        select: {
                          firstname: true,
                          lastname: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Game not found'
        });
        return;
      }

      // Get team names
      const teams = await prisma.teamsseason.findMany({
        where: {
          id: {
            in: [game.hteamid, game.vteamid]
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      const homeTeam = teams.find(t => t.id === game.hteamid);
      const awayTeam = teams.find(t => t.id === game.vteamid);

      res.json({
        success: true,
        data: {
          id: game.id.toString(),
          date: game.gamedate.toISOString(),
          homeTeamId: game.hteamid.toString(),
          awayTeamId: game.vteamid.toString(),
          homeTeamName: homeTeam?.name || `Team ${game.hteamid}`,
          awayTeamName: awayTeam?.name || `Team ${game.vteamid}`,
          homeScore: game.hscore,
          awayScore: game.vscore,
          gameStatus: game.gamestatus,
          gameStatusText: getGameStatusText(game.gamestatus),
          leagueName: game.leagueseason.league.name,
          field: game.availablefields ? {
            id: game.availablefields.id.toString(),
            name: game.availablefields.name,
            address: game.availablefields.address
          } : null,
          comment: game.comment,
          gameRecaps: game.gamerecap.map((recap: any) => ({
            teamId: recap.teamid.toString(),
            recap: recap.recap
          })),
          battingStats: game.batstatsum.map((stat: any) => ({
            playerId: stat.playerid.toString(),
            teamId: stat.teamid.toString(),
            playerName: `${stat.rosterseason.roster.contacts.firstname} ${stat.rosterseason.roster.contacts.lastname}`,
            ab: stat.ab,
            h: stat.h,
            r: stat.r,
            rbi: stat.rbi,
            hr: stat.hr,
            bb: stat.bb,
            so: stat.so
          })),
          pitchingStats: game.pitchstatsum.map((stat: any) => ({
            playerId: stat.playerid.toString(),
            teamId: stat.teamid.toString(),
            playerName: `${stat.rosterseason.roster.contacts.firstname} ${stat.rosterseason.roster.contacts.lastname}`,
            ip: stat.ip,
            ip2: stat.ip2,
            h: stat.h,
            r: stat.r,
            er: stat.er,
            bb: stat.bb,
            so: stat.so,
            w: stat.w,
            l: stat.l,
            s: stat.s
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching game details:', error);
      next(error);
    }
  }
);

/**
 * PUT /api/accounts/:accountId/games/:gameId/results
 * Update game results (scores, status, notifications)
 */
router.put('/:gameId/results',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const gameId = BigInt(req.params.gameId);
      const { homeScore, awayScore, gameStatus, emailPlayers, postToTwitter, postToBluesky, postToFacebook } = req.body;

      // Validate input
      if (typeof homeScore !== 'number' || typeof awayScore !== 'number' || typeof gameStatus !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Invalid input: homeScore, awayScore, and gameStatus must be numbers'
        });
        return;
      }

      if (homeScore < 0 || awayScore < 0) {
        res.status(400).json({
          success: false,
          message: 'Scores cannot be negative'
        });
        return;
      }

      if (gameStatus < 0 || gameStatus > 5) {
        res.status(400).json({
          success: false,
          message: 'Invalid game status'
        });
        return;
      }

      // Check if game exists and belongs to this account
      const game = await prisma.leagueschedule.findFirst({
        where: {
          id: gameId,
          leagueseason: {
            league: {
              accountid: accountId
            }
          }
        },
        include: {
          leagueseason: {
            include: {
              league: {
                select: {
                  name: true
                }
              }
            }
          },
          availablefields: {
            select: {
              name: true,
              shortname: true
            }
          }
        }
      });

      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Game not found'
        });
        return;
      }

      // Update game results
      await prisma.leagueschedule.update({
        where: { id: gameId },
        data: {
          hscore: homeScore,
          vscore: awayScore,
          gamestatus: gameStatus
        }
      });

      // Handle notifications and social media posts
      const notifications = [];
      
      if (emailPlayers) {
        notifications.push('Email players about game results');
        // TODO: Implement email functionality
      }
      
      if (postToTwitter) {
        notifications.push('Post to Twitter');
        // TODO: Implement Twitter posting
      }
      
      if (postToBluesky) {
        notifications.push('Post to Bluesky');
        // TODO: Implement Bluesky posting
      }
      
      if (postToFacebook) {
        notifications.push('Post to Facebook');
        // TODO: Implement Facebook posting
      }

      res.json({
        success: true,
        message: 'Game results updated successfully',
        data: {
          gameId: gameId.toString(),
          homeScore,
          awayScore,
          gameStatus,
          notifications
        }
      });
    } catch (error) {
      console.error('Error updating game results:', error);
      next(error);
    }
  }
);

// Helper function to get game status text
const getGameStatusText = (status: number): string => {
  switch (status) {
    case 0: return 'Scheduled';
    case 1: return 'Final';
    case 2: return 'In Progress';
    case 3: return 'Postponed';
    case 4: return 'Forfeit';
    case 5: return 'Did Not Report';
    default: return 'Unknown';
  }
};

export default router; 