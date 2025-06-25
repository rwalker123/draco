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
 * PUT /api/accounts/:accountId/seasons/:seasonId/games/:gameId/results
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

      // Validate forfeit scores
      if (gameStatus === 4) { // Forfeit
        if (homeScore === 0 && awayScore === 0) {
          res.status(400).json({
            success: false,
            message: 'For forfeit games, one team must have a score of 0 and the other team must have a score greater than 0.'
          });
          return;
        }
        if (homeScore > 0 && awayScore > 0) {
          res.status(400).json({
            success: false,
            message: 'For forfeit games, one team must have a score of 0 and the other team must have a score greater than 0.'
          });
          return;
        }
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
    case 0: return 'Incomplete';
    case 1: return 'Final';
    case 2: return 'In Progress';
    case 3: return 'Postponed';
    case 4: return 'Forfeit';
    case 5: return 'Did Not Report';
    default: return 'Unknown';
  }
};

/**
 * SCHEDULE MANAGEMENT ENDPOINTS
 */

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/games
 * Get all games for a season (acrossß all leagues)
 */
router.get('/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { seasonId } = req.params;
      const { startDate, endDate, teamId } = req.query;

      // Build where clause
      const where: any = {
        leagueseason: {
          seasonid: BigInt(seasonId)
        }
      };

      if (startDate && endDate) {
        where.gamedate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      if (teamId) {
        where.OR = [
          { hteamid: BigInt(teamId as string) },
          { vteamid: BigInt(teamId as string) }
        ];
      }

      const games = await prisma.leagueschedule.findMany({
        where,
        include: {
          availablefields: true,
          leagueseason: {
            include: {
              league: true,
              season: true
            }
          }
        },
        orderBy: {
          gamedate: 'asc'
        }
      });

      // Helper function to get team names
      const getTeamNames = async (homeTeamId: bigint, visitorTeamId: bigint) => {
        const teams = await prisma.teamsseason.findMany({
          where: {
            id: {
              in: [homeTeamId, visitorTeamId]
            }
          },
          select: {
            id: true,
            name: true
          }
        });

        const homeTeam = teams.find(t => t.id === homeTeamId);
        const visitorTeam = teams.find(t => t.id === visitorTeamId);

        return {
          homeTeamName: homeTeam?.name || `Team ${homeTeamId}`,
          visitorTeamName: visitorTeam?.name || `Team ${visitorTeamId}`
        };
      };

      // Process games to include team names
      const processedGames = [];
      for (const game of games) {
        const teamNames = await getTeamNames(game.hteamid, game.vteamid);
        processedGames.push({
          id: game.id.toString(),
          gameDate: game.gamedate ? game.gamedate.toISOString() : null,
          homeTeamId: game.hteamid.toString(),
          visitorTeamId: game.vteamid.toString(),
          homeTeamName: teamNames.homeTeamName,
          visitorTeamName: teamNames.visitorTeamName,
          homeScore: game.hscore,
          visitorScore: game.vscore,
          comment: game.comment,
          fieldId: game.fieldid?.toString(),
          field: game.availablefields ? {
            id: game.availablefields.id.toString(),
            name: game.availablefields.name,
            shortName: game.availablefields.shortname,
            address: game.availablefields.address,
            city: game.availablefields.city,
            state: game.availablefields.state
          } : null,
          gameStatus: game.gamestatus,
          gameType: game.gametype,
          umpire1: game.umpire1?.toString(),
          umpire2: game.umpire2?.toString(),
          umpire3: game.umpire3?.toString(),
          umpire4: game.umpire4?.toString(),
          league: {
            id: game.leagueseason.league.id.toString(),
            name: game.leagueseason.league.name
          },
          season: {
            id: game.leagueseason.season.id.toString(),
            name: game.leagueseason.season.name
          }
        });
      }

      res.json({
        success: true,
        data: {
          games: processedGames
        }
      });
    } catch (error) {
      console.error('Error fetching season games:', error);
      next(error);
    }
  }
);

// Create a new game
router.post('/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireRole('AccountAdmin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { seasonId, leagueSeasonId } = req.params;
      const {
        gameDate,
        homeTeamId,
        visitorTeamId,
        fieldId,
        comment,
        gameType = 1,
        umpire1,
        umpire2,
        umpire3,
        umpire4
      } = req.body;

      // Validate required fields
      if (!gameDate || !homeTeamId || !visitorTeamId) {
        res.status(400).json({
          success: false,
          message: 'Game date, home team, and visitor team are required'
        });
        return;
      }

      // Check if teams exist in the league season
      const teamsInLeague = await prisma.teamsseason.findMany({
        where: {
          leagueseasonid: BigInt(leagueSeasonId),
          id: {
            in: [BigInt(homeTeamId), BigInt(visitorTeamId)]
          }
        }
      });

      if (teamsInLeague.length !== 2) {
        res.status(400).json({
          success: false,
          message: 'Both teams must be in the specified league season'
        });
        return;
      }

      // Check field availability if field is specified
      if (fieldId) {
        const existingGame = await prisma.leagueschedule.findFirst({
          where: {
            fieldid: BigInt(fieldId),
            gamedate: new Date(gameDate),
            leagueid: BigInt(leagueSeasonId)
          }
        });

        if (existingGame) {
          res.status(400).json({
            success: false,
            message: 'Field is already booked for this date and time'
          });
          return;
        }
      }

      const game = await prisma.leagueschedule.create({
        data: {
          gamedate: new Date(gameDate),
          hteamid: BigInt(homeTeamId),
          vteamid: BigInt(visitorTeamId),
          hscore: 0,
          vscore: 0,
          comment: comment || '',
          fieldid: fieldId ? BigInt(fieldId) : null,
          leagueid: BigInt(leagueSeasonId),
          gamestatus: 0, // Scheduled
          gametype: gameType,
          umpire1: umpire1 ? BigInt(umpire1) : null,
          umpire2: umpire2 ? BigInt(umpire2) : null,
          umpire3: umpire3 ? BigInt(umpire3) : null,
          umpire4: umpire4 ? BigInt(umpire4) : null
        },
        include: {
          availablefields: true,
          leagueseason: {
            include: {
              league: true,
              season: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: {
          game: {
            id: game.id.toString(),
            gameDate: game.gamedate ? game.gamedate.toISOString() : null,
            homeTeamId: game.hteamid.toString(),
            visitorTeamId: game.vteamid.toString(),
            homeScore: game.hscore,
            visitorScore: game.vscore,
            comment: game.comment,
            fieldId: game.fieldid?.toString(),
            field: game.availablefields ? {
              id: game.availablefields.id.toString(),
              name: game.availablefields.name,
              shortName: game.availablefields.shortname,
              address: game.availablefields.address,
              city: game.availablefields.city,
              state: game.availablefields.state
            } : null,
            gameStatus: game.gamestatus,
            gameType: game.gametype,
            umpire1: game.umpire1?.toString(),
            umpire2: game.umpire2?.toString(),
            umpire3: game.umpire3?.toString(),
            umpire4: game.umpire4?.toString(),
            league: {
              id: game.leagueseason.league.id.toString(),
              name: game.leagueseason.league.name
            },
            season: {
              id: game.leagueseason.season.id.toString(),
              name: game.leagueseason.season.name
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating game:', error);
      next(error);
    }
  }
);

// Update a game
router.put('/:gameId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireRole('AccountAdmin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { gameId } = req.params;
      const {
        gameDate,
        homeTeamId,
        visitorTeamId,
        fieldId,
        comment,
        gameStatus,
        gameType,
        umpire1,
        umpire2,
        umpire3,
        umpire4
      } = req.body;

      // Check if game exists
      const existingGame = await prisma.leagueschedule.findUnique({
        where: { id: BigInt(gameId) },
        include: {
          leagueseason: {
            include: {
              league: true
            }
          }
        }
      });

      if (!existingGame) {
        res.status(404).json({
          success: false,
          message: 'Game not found'
        });
        return;
      }

      // Check field availability if field is being changed
      if (fieldId && fieldId !== existingGame.fieldid?.toString()) {
        const conflictingGame = await prisma.leagueschedule.findFirst({
          where: {
            fieldid: BigInt(fieldId),
            gamedate: gameDate ? new Date(gameDate) : existingGame.gamedate,
            leagueid: existingGame.leagueid,
            id: { not: BigInt(gameId) }
          }
        });

        if (conflictingGame) {
          res.status(400).json({
            success: false,
            message: 'Field is already booked for this date and time'
          });
          return;
        }
      }

      const updatedGame = await prisma.leagueschedule.update({
        where: { id: BigInt(gameId) },
        data: {
          gamedate: gameDate ? new Date(gameDate) : undefined,
          hteamid: homeTeamId ? BigInt(homeTeamId) : undefined,
          vteamid: visitorTeamId ? BigInt(visitorTeamId) : undefined,
          comment: comment !== undefined ? comment : undefined,
          fieldid: fieldId ? BigInt(fieldId) : fieldId === null ? null : undefined,
          gamestatus: gameStatus !== undefined ? gameStatus : undefined,
          gametype: gameType !== undefined ? gameType : undefined,
          umpire1: umpire1 ? BigInt(umpire1) : umpire1 === null ? null : undefined,
          umpire2: umpire2 ? BigInt(umpire2) : umpire2 === null ? null : undefined,
          umpire3: umpire3 ? BigInt(umpire3) : umpire3 === null ? null : undefined,
          umpire4: umpire4 ? BigInt(umpire4) : umpire4 === null ? null : undefined
        },
        include: {
          availablefields: true,
          leagueseason: {
            include: {
              league: true,
              season: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: {
          game: {
            id: updatedGame.id.toString(),
            gameDate: updatedGame.gamedate ? updatedGame.gamedate.toISOString() : null,
            homeTeamId: updatedGame.hteamid.toString(),
            visitorTeamId: updatedGame.vteamid.toString(),
            homeScore: updatedGame.hscore,
            visitorScore: updatedGame.vscore,
            comment: updatedGame.comment,
            fieldId: updatedGame.fieldid?.toString(),
            field: updatedGame.availablefields ? {
              id: updatedGame.availablefields.id.toString(),
              name: updatedGame.availablefields.name,
              shortName: updatedGame.availablefields.shortname,
              address: updatedGame.availablefields.address,
              city: updatedGame.availablefields.city,
              state: updatedGame.availablefields.state
            } : null,
            gameStatus: updatedGame.gamestatus,
            gameType: updatedGame.gametype,
            umpire1: updatedGame.umpire1?.toString(),
            umpire2: updatedGame.umpire2?.toString(),
            umpire3: updatedGame.umpire3?.toString(),
            umpire4: updatedGame.umpire4?.toString(),
            league: {
              id: updatedGame.leagueseason.league.id.toString(),
              name: updatedGame.leagueseason.league.name
            },
            season: {
              id: updatedGame.leagueseason.season.id.toString(),
              name: updatedGame.leagueseason.season.name
            }
          }
        },
        message: 'Game updated successfully'
      });
    } catch (error) {
      console.error('Error updating game:', error);
      next(error);
    }
  }
);

// Delete a game
router.delete('/:gameId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireRole('AccountAdmin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { gameId } = req.params;

      // Check if game exists
      const existingGame = await prisma.leagueschedule.findUnique({
        where: { id: BigInt(gameId) }
      });

      if (!existingGame) {
        res.status(404).json({
          success: false,
          message: 'Game not found'
        });
        return;
      }

      await prisma.leagueschedule.delete({
        where: { id: BigInt(gameId) }
      });

      res.json({
        success: true,
        message: 'Game deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting game:', error);
      next(error);
    }
  }
);

export default router; 