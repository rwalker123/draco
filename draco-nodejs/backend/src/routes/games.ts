import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { getGameStatusText, getGameStatusShortText } from '../utils/gameStatus';
import { ContactRole } from '../types/roles';
import prisma from '../lib/prisma';

const router = Router({ mergeParams: true });
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * @swagger
 * /api/accounts/{accountId}/seasons/{seasonId}/games/{gameId}/results:
 *   put:
 *     summary: Update game results
 *     description: Update game results including scores, status, and notifications
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *         example: "123"
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Season ID
 *         example: "456"
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *         example: "789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - homeScore
 *               - awayScore
 *               - gameStatus
 *             properties:
 *               homeScore:
 *                 type: integer
 *                 minimum: 0
 *                 description: Home team score
 *                 example: 5
 *               awayScore:
 *                 type: integer
 *                 minimum: 0
 *                 description: Away team score
 *                 example: 3
 *               gameStatus:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Game status (0=Incomplete, 1=Final, 2=In Progress, 3=Postponed, 4=Forfeit, 5=Did Not Report)
 *                 example: 1
 *               emailPlayers:
 *                 type: boolean
 *                 description: Send email notification to players
 *                 example: false
 *               postToTwitter:
 *                 type: boolean
 *                 description: Post results to Twitter
 *                 example: false
 *               postToBluesky:
 *                 type: boolean
 *                 description: Post results to Bluesky
 *                 example: false
 *               postToFacebook:
 *                 type: boolean
 *                 description: Post results to Facebook
 *                 example: false
 *     responses:
 *       200:
 *         description: Game results updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Game results updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     gameId:
 *                       type: string
 *                       example: "789"
 *                     homeScore:
 *                       type: integer
 *                       example: 5
 *                     awayScore:
 *                       type: integer
 *                       example: 3
 *                     gameStatus:
 *                       type: integer
 *                       example: 1
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - no access to account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Game not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:gameId/results',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const gameId = BigInt(req.params.gameId);
      const {
        homeScore,
        awayScore,
        gameStatus,
        emailPlayers,
        postToTwitter,
        postToBluesky,
        postToFacebook,
      } = req.body;

      // Validate input
      if (
        typeof homeScore !== 'number' ||
        typeof awayScore !== 'number' ||
        typeof gameStatus !== 'number'
      ) {
        res.status(400).json({
          success: false,
          message: 'Invalid input: homeScore, awayScore, and gameStatus must be numbers',
        });
        return;
      }

      if (homeScore < 0 || awayScore < 0) {
        res.status(400).json({
          success: false,
          message: 'Scores cannot be negative',
        });
        return;
      }

      // Validate forfeit scores
      if (gameStatus === 4) {
        // Forfeit
        if (homeScore === 0 && awayScore === 0) {
          res.status(400).json({
            success: false,
            message:
              'For forfeit games, one team must have a score of 0 and the other team must have a score greater than 0.',
          });
          return;
        }
        if (homeScore > 0 && awayScore > 0) {
          res.status(400).json({
            success: false,
            message:
              'For forfeit games, one team must have a score of 0 and the other team must have a score greater than 0.',
          });
          return;
        }
      }

      if (gameStatus < 0 || gameStatus > 5) {
        res.status(400).json({
          success: false,
          message: 'Invalid game status',
        });
        return;
      }

      // Check if game exists and belongs to the account
      const game = await prisma.leagueschedule.findFirst({
        where: {
          id: gameId,
          leagueseason: {
            league: {
              accountid: accountId,
            },
          },
        },
        include: {
          leagueseason: {
            include: {
              league: true,
              season: true,
            },
          },
        },
      });

      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Game not found',
        });
        return;
      }

      // Update the game
      const updatedGame = await prisma.leagueschedule.update({
        where: { id: gameId },
        data: {
          hscore: homeScore,
          vscore: awayScore,
          gamestatus: gameStatus,
        },
        include: {
          leagueseason: {
            include: {
              league: true,
              season: true,
            },
          },
        },
      });

      // Handle notifications (placeholder for now)
      const notifications: string[] = [];
      if (emailPlayers) {
        notifications.push('Email sent to players');
      }
      if (postToTwitter) {
        notifications.push('Posted to Twitter');
      }
      if (postToBluesky) {
        notifications.push('Posted to Bluesky');
      }
      if (postToFacebook) {
        notifications.push('Posted to Facebook');
      }

      res.json({
        success: true,
        message: 'Game results updated successfully',
        data: {
          gameId: updatedGame.id.toString(),
          homeScore: updatedGame.hscore,
          awayScore: updatedGame.vscore,
          gameStatus: updatedGame.gamestatus,
          notifications,
        },
      });
    } catch (error) {
      console.error('Error updating game results:', error);
      next(error);
    }
  },
);

/**
 * @swagger
 * /api/accounts/{accountId}/seasons/{seasonId}/games:
 *   get:
 *     summary: Get all games for a season
 *     description: Retrieve all games for a season across all leagues with optional filtering
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *         example: "123"
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Season ID
 *         example: "456"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering games (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering games (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Filter games by team ID
 *         example: "101"
 *     responses:
 *       200:
 *         description: Games retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     games:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "789"
 *                           gameDate:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-06-15T18:00:00Z"
 *                           homeTeam:
 *                             type: string
 *                             example: "Red Sox"
 *                           awayTeam:
 *                             type: string
 *                             example: "Yankees"
 *                           homeScore:
 *                             type: integer
 *                             example: 5
 *                           awayScore:
 *                             type: integer
 *                             example: 3
 *                           gameStatus:
 *                             type: integer
 *                             example: 1
 *                           gameStatusText:
 *                             type: string
 *                             example: "Final"
 *                           field:
 *                             type: string
 *                             example: "Fenway Park"
 *                           league:
 *                             type: string
 *                             example: "Major League"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { seasonId } = req.params;
    const { startDate, endDate, teamId, hasRecap } = req.query;

    // Only accept a real seasonId
    let seasonIdToUse: bigint;
    try {
      seasonIdToUse = BigInt(seasonId);
    } catch {
      res.status(400).json({ success: false, message: 'Invalid seasonId' });
      return;
    }

    // Build where clause
    const where: Prisma.leaguescheduleWhereInput = {
      leagueseason: {
        seasonid: seasonIdToUse,
      },
    };

    if (startDate && endDate) {
      where.gamedate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (teamId) {
      where.OR = [{ hteamid: BigInt(teamId as string) }, { vteamid: BigInt(teamId as string) }];
    }

    // If hasRecap is true, include recaps and filter games
    type GameWithRecap = Prisma.leaguescheduleGetPayload<{
      include: {
        availablefields: true;
        leagueseason: {
          include: {
            league: true;
            season: true;
          };
        };
        gamerecap: true;
      };
    }>;
    let games = await prisma.leagueschedule.findMany({
      where,
      include: {
        availablefields: true,
        leagueseason: {
          include: {
            league: true,
            season: true,
          },
        },
        ...(hasRecap === 'true' && {
          gamerecap: {
            select: {
              teamid: true,
              recap: true,
            },
          },
        }),
      },
      orderBy: {
        gamedate: 'asc',
      },
    });

    // Helper function to get team names
    const getTeamNames = async (homeTeamId: bigint, visitorTeamId: bigint) => {
      const teams = await prisma.teamsseason.findMany({
        where: {
          id: {
            in: [homeTeamId, visitorTeamId],
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const homeTeam = teams.find((t) => t.id === homeTeamId);
      const visitorTeam = teams.find((t) => t.id === visitorTeamId);

      return {
        homeTeamName: homeTeam?.name || `Team ${homeTeamId}`,
        visitorTeamName: visitorTeam?.name || `Team ${visitorTeamId}`,
      };
    };

    // If hasRecap is true, filter games to only those with at least one recap
    if (hasRecap === 'true') {
      games = (games as GameWithRecap[]).filter(
        (game) => game.gamerecap && game.gamerecap.length > 0,
      );
    }

    // Process games to include team names and recaps if requested
    const processedGames = [];
    for (const game of games) {
      const teamNames = await getTeamNames(game.hteamid, game.vteamid);
      const baseGame = {
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
        field: game.availablefields
          ? {
              id: game.availablefields.id.toString(),
              name: game.availablefields.name,
              shortName: game.availablefields.shortname,
              address: game.availablefields.address,
              city: game.availablefields.city,
              state: game.availablefields.state,
            }
          : null,
        gameStatus: game.gamestatus,
        gameStatusText: getGameStatusText(game.gamestatus),
        gameStatusShortText: getGameStatusShortText(game.gamestatus),
        gameType: game.gametype,
        umpire1: game.umpire1?.toString(),
        umpire2: game.umpire2?.toString(),
        umpire3: game.umpire3?.toString(),
        umpire4: game.umpire4?.toString(),
        league: {
          id: game.leagueseason.id.toString(), // leagueSeasonId
          name: game.leagueseason.league.name,
        },
        season: {
          id: game.leagueseason.season.id.toString(),
          name: game.leagueseason.season.name,
        },
      };
      if (hasRecap === 'true') {
        processedGames.push({
          ...baseGame,
          recaps: (game as GameWithRecap).gamerecap.map((recap) => ({
            teamId: recap.teamid.toString(),
            recap: recap.recap,
          })),
        });
      } else {
        processedGames.push(baseGame);
      }
    }

    res.json({
      success: true,
      data: {
        games: processedGames,
      },
    });
  } catch (error) {
    console.error('Error fetching season games:', error);
    next(error);
  }
});

// Create a new game
router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireRole('AccountAdmin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        leagueSeasonId,
        gameDate,
        homeTeamId,
        visitorTeamId,
        fieldId,
        comment,
        gameType = 1,
        umpire1,
        umpire2,
        umpire3,
        umpire4,
      } = req.body;

      // Validate required fields
      if (!leagueSeasonId || !gameDate || !homeTeamId || !visitorTeamId) {
        res.status(400).json({
          success: false,
          message: 'League season ID, game date, home team, and visitor team are required',
        });
        return;
      }

      // Validate that home team and visitor team are different
      if (homeTeamId === visitorTeamId) {
        res.status(400).json({
          success: false,
          message: 'Home team and visitor team cannot be the same',
        });
        return;
      }

      // Check if teams exist in the league season
      const teamsInLeague = await prisma.teamsseason.findMany({
        where: {
          leagueseasonid: BigInt(leagueSeasonId),
          id: {
            in: [BigInt(homeTeamId), BigInt(visitorTeamId)],
          },
        },
      });

      if (teamsInLeague.length !== 2) {
        res.status(400).json({
          success: false,
          message: 'Both teams must be in the specified league season',
        });
        return;
      }

      // Check field availability if field is specified
      if (fieldId) {
        const existingGame = await prisma.leagueschedule.findFirst({
          where: {
            fieldid: BigInt(fieldId),
            gamedate: new Date(gameDate),
            leagueid: BigInt(leagueSeasonId),
          },
        });

        if (existingGame) {
          res.status(400).json({
            success: false,
            message: 'Field is already booked for this date and time',
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
          umpire4: umpire4 ? BigInt(umpire4) : null,
        },
        include: {
          availablefields: true,
          leagueseason: {
            include: {
              league: true,
              season: true,
            },
          },
        },
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
            field: game.availablefields
              ? {
                  id: game.availablefields.id.toString(),
                  name: game.availablefields.name,
                  shortName: game.availablefields.shortname,
                  address: game.availablefields.address,
                  city: game.availablefields.city,
                  state: game.availablefields.state,
                }
              : null,
            gameStatus: game.gamestatus,
            gameType: game.gametype,
            umpire1: game.umpire1?.toString(),
            umpire2: game.umpire2?.toString(),
            umpire3: game.umpire3?.toString(),
            umpire4: game.umpire4?.toString(),
            league: {
              id: game.leagueseason.league.id.toString(),
              name: game.leagueseason.league.name,
            },
            season: {
              id: game.leagueseason.season.id.toString(),
              name: game.leagueseason.season.name,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error creating game:', error);
      next(error);
    }
  },
);

// Update a game
router.put(
  '/:gameId',
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
        umpire4,
      } = req.body;

      // Check if game exists
      const existingGame = await prisma.leagueschedule.findUnique({
        where: { id: BigInt(gameId) },
        include: {
          leagueseason: {
            include: {
              league: true,
            },
          },
        },
      });

      if (!existingGame) {
        res.status(404).json({
          success: false,
          message: 'Game not found',
        });
        return;
      }

      // Validate that home team and visitor team are different (if both are provided)
      if (homeTeamId && visitorTeamId && homeTeamId === visitorTeamId) {
        res.status(400).json({
          success: false,
          message: 'Home team and visitor team cannot be the same',
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
            id: { not: BigInt(gameId) },
          },
        });

        if (conflictingGame) {
          res.status(400).json({
            success: false,
            message: 'Field is already booked for this date and time',
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
          umpire4: umpire4 ? BigInt(umpire4) : umpire4 === null ? null : undefined,
        },
        include: {
          availablefields: true,
          leagueseason: {
            include: {
              league: true,
              season: true,
            },
          },
        },
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
            field: updatedGame.availablefields
              ? {
                  id: updatedGame.availablefields.id.toString(),
                  name: updatedGame.availablefields.name,
                  shortName: updatedGame.availablefields.shortname,
                  address: updatedGame.availablefields.address,
                  city: updatedGame.availablefields.city,
                  state: updatedGame.availablefields.state,
                }
              : null,
            gameStatus: updatedGame.gamestatus,
            gameType: updatedGame.gametype,
            umpire1: updatedGame.umpire1?.toString(),
            umpire2: updatedGame.umpire2?.toString(),
            umpire3: updatedGame.umpire3?.toString(),
            umpire4: updatedGame.umpire4?.toString(),
            league: {
              id: updatedGame.leagueseason.league.id.toString(),
              name: updatedGame.leagueseason.league.name,
            },
            season: {
              id: updatedGame.leagueseason.season.id.toString(),
              name: updatedGame.leagueseason.season.name,
            },
          },
        },
        message: 'Game updated successfully',
      });
    } catch (error) {
      console.error('Error updating game:', error);
      next(error);
    }
  },
);

// Delete a game
router.delete(
  '/:gameId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireRole('AccountAdmin'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { gameId } = req.params;

      // Check if game exists
      const existingGame = await prisma.leagueschedule.findUnique({
        where: { id: BigInt(gameId) },
      });

      if (!existingGame) {
        res.status(404).json({
          success: false,
          message: 'Game not found',
        });
        return;
      }

      await prisma.leagueschedule.delete({
        where: { id: BigInt(gameId) },
      });

      res.json({
        success: true,
        message: 'Game deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting game:', error);
      next(error);
    }
  },
);

// Async utility to check if user has team admin rights for a teamSeasonId
async function userHasTeamAdminRights(
  userId: string,
  accountId: string,
  teamSeasonId: string,
  roleService: RoleService,
  prisma: PrismaClient,
): Promise<boolean> {
  // 1. Check contactrole for TeamAdmin
  const userRoles = await roleService.getUserRoles(userId, BigInt(accountId));
  const isTeamAdmin = userRoles.contactRoles.some(
    (role: ContactRole) =>
      role.roleId === 'TeamAdmin' &&
      teamSeasonId &&
      teamSeasonId.toString() === role.roleData.toString(),
  );
  if (isTeamAdmin) return true;
  // 2. Look up contactid for this user/account
  const contact = await prisma.contacts.findFirst({
    where: {
      userid: userId,
      creatoraccountid: BigInt(accountId),
    },
  });
  if (!contact) return false;
  // 3. Check teamseasonmanager for this contactid
  const managerRecord = await prisma.teamseasonmanager.findFirst({
    where: {
      contactid: BigInt(contact.id),
      teamseasonid: BigInt(teamSeasonId),
    },
  });
  return !!managerRecord;
}

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/games/:gameId/recap/:teamSeasonId
 * Get the recap for the current user's team for a specific game
 * Only accessible to team admins/coaches for the home or away team
 */
router.get(
  '/:gameId/recap/:teamSeasonId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const seasonId = BigInt(req.params.seasonId);
      const gameId = BigInt(req.params.gameId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);

      // Fetch the game and validate it belongs to the account and season
      const game = await prisma.leagueschedule.findUnique({
        where: { id: gameId },
        include: {
          leagueseason: {
            include: {
              league: true,
              season: true,
            },
          },
        },
      });
      if (!game) {
        res.status(404).json({ success: false, message: 'Game not found' });
        return;
      }
      if (
        game.leagueseason.seasonid !== seasonId ||
        game.leagueseason.league.accountid !== accountId
      ) {
        res.status(404).json({ success: false, message: 'Game not found' });
        return;
      }

      // Validate that teamSeasonId is one of the teams in the game
      if (!(teamSeasonId === game.hteamid || teamSeasonId === game.vteamid)) {
        res.status(400).json({ success: false, message: 'Invalid teamSeasonId for this game' });
        return;
      }

      // Fetch the recap for this team/game
      const recap = await prisma.gamerecap.findUnique({
        where: {
          gameid_teamid: {
            gameid: gameId,
            teamid: teamSeasonId,
          },
        },
      });
      if (!recap) {
        res.status(404).json({ success: false, message: 'No recap found for this team' });
        return;
      }
      res.json({ success: true, data: { recap: recap.recap } });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/games/:gameId/recap/:teamSeasonId
 * Create or update the recap for the specified team for a specific game
 * Only accessible to team admins (contactrole) or team managers (teamseasonmanager) for the specified team
 * Body: { recap: string }
 */
router.put(
  '/:gameId/recap/:teamSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const seasonId = BigInt(req.params.seasonId);
      const gameId = BigInt(req.params.gameId);
      const teamSeasonId = BigInt(req.params.teamSeasonId);
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }
      const { recap } = req.body;
      if (typeof recap !== 'string' || recap.trim() === '') {
        res.status(400).json({ success: false, message: 'Recap is required' });
        return;
      }

      // Fetch the game and validate it belongs to the account and season
      const game = await prisma.leagueschedule.findUnique({
        where: { id: gameId },
        include: {
          leagueseason: {
            include: {
              league: true,
              season: true,
            },
          },
        },
      });
      if (!game) {
        res.status(404).json({ success: false, message: 'Game not found' });
        return;
      }
      if (
        game.leagueseason.seasonid !== seasonId ||
        game.leagueseason.league.accountid !== accountId
      ) {
        res
          .status(400)
          .json({ success: false, message: 'Game does not belong to specified account/season' });
        return;
      }

      // Validate that teamSeasonId is one of the teams in the game
      if (!(teamSeasonId === game.hteamid || teamSeasonId === game.vteamid)) {
        res.status(400).json({ success: false, message: 'Invalid teamSeasonId for this game' });
        return;
      }

      // Check admin rights for the provided teamSeasonId
      const hasRights = await userHasTeamAdminRights(
        String(userId),
        String(accountId),
        String(teamSeasonId),
        roleService,
        prisma,
      );
      if (!hasRights) {
        res
          .status(403)
          .json({ success: false, message: 'Not authorized for this team in this game' });
        return;
      }

      // Upsert the recap for this team/game
      const updatedRecap = await prisma.gamerecap.upsert({
        where: {
          gameid_teamid: {
            gameid: gameId,
            teamid: teamSeasonId,
          },
        },
        update: {
          recap,
        },
        create: {
          gameid: gameId,
          teamid: teamSeasonId,
          recap,
        },
      });
      res.json({ success: true, data: { recap: updatedRecap.recap } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
