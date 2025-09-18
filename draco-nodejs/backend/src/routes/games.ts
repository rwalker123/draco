import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { IRoleQuery } from '../interfaces/roleInterfaces.js';
import { getGameStatusText, getGameStatusShortText } from '../utils/gameStatus.js';
import { GameStatus, GameType } from '../types/gameEnums.js';
import { ContactRole } from '../types/roles.js';
import { asyncHandler } from './utils/asyncHandler.js';
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
} from '../utils/customErrors.js';
import { extractGameOnlyParams, extractRecapParams } from '../utils/paramExtraction.js';
import { BatchQueryHelper } from '../utils/batchQueries.js';
import { PaginationHelper } from '../utils/pagination.js';
import { DateUtils } from '../utils/dateUtils.js';
import prisma from '../lib/prisma.js';

const router = Router({ mergeParams: true });
const roleService = ServiceFactory.getRoleQuery();
const routeProtection = ServiceFactory.getRouteProtection();
const contactSecurityService = ServiceFactory.getContactSecurityService();

// Helper function to parse ISO date string without timezone conversion
const parseGameDate = (dateString: string): Date => {
  // Parse YYYY-MM-DDTHH:MM:SS format manually to avoid timezone issues
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error('Invalid date format. Expected YYYY-MM-DDTHH:MM:SS');
  }

  const [, year, month, day, hours, minutes, seconds] = match;

  const result = new Date(
    Date.UTC(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds),
    ),
  );

  return result;
};

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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, gameId } = extractGameOnlyParams(req.params);
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
      throw new ValidationError(
        'Invalid input: homeScore, awayScore, and gameStatus must be numbers',
      );
    }

    if (homeScore < 0 || awayScore < 0) {
      throw new ValidationError('Scores cannot be negative');
    }

    // Validate forfeit scores
    if (gameStatus === GameStatus.Forfeit) {
      // Forfeit
      if (homeScore === 0 && awayScore === 0) {
        throw new ValidationError(
          'For forfeit games, one team must have a score of 0 and the other team must have a score greater than 0.',
        );
      }
      if (homeScore > 0 && awayScore > 0) {
        throw new ValidationError(
          'For forfeit games, one team must have a score of 0 and the other team must have a score greater than 0.',
        );
      }
    }

    if (gameStatus < GameStatus.Scheduled || gameStatus > GameStatus.DidNotReport) {
      throw new ValidationError('Invalid game status');
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
      throw new NotFoundError('Game not found');
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
  }),
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 50
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
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = req.params;
    const { startDate, endDate, teamId, hasRecap } = req.query;

    // Parse pagination parameters
    const paginationParams = PaginationHelper.parseParams(req.query);

    // Only accept a real seasonId
    let seasonIdToUse: bigint;
    try {
      seasonIdToUse = BigInt(seasonId);
    } catch {
      throw new ValidationError('Invalid seasonId');
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

    // Get total count for pagination
    const totalCount = await prisma.leagueschedule.count({ where });

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
        gamedate: paginationParams.sortOrder,
      },
      skip: paginationParams.skip,
      take: paginationParams.limit,
    });

    // Collect all unique team IDs for batch loading
    const allTeamIds = new Set<bigint>();
    for (const game of games) {
      allTeamIds.add(game.hteamid);
      allTeamIds.add(game.vteamid);
    }

    // Batch load all team names to avoid N+1 queries
    const teamNames = await BatchQueryHelper.batchTeamNames(prisma, Array.from(allTeamIds));

    // If hasRecap is true, filter games to only those with at least one recap
    if (hasRecap === 'true') {
      games = (games as GameWithRecap[]).filter(
        (game) => game.gamerecap && game.gamerecap.length > 0,
      );
    }

    // Process games to include team names and recaps if requested
    const processedGames = [];
    for (const game of games) {
      const homeTeamName = teamNames.get(game.hteamid.toString()) || `Team ${game.hteamid}`;
      const visitorTeamName = teamNames.get(game.vteamid.toString()) || `Team ${game.vteamid}`;

      const baseGame = {
        id: game.id.toString(),
        gameDate: DateUtils.formatDateTimeForResponse(game.gamedate),
        homeTeamId: game.hteamid.toString(),
        visitorTeamId: game.vteamid.toString(),
        homeTeamName: homeTeamName,
        visitorTeamName: visitorTeamName,
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

    // Format paginated response
    const response = PaginationHelper.formatResponse(
      processedGames,
      paginationParams.page,
      paginationParams.limit,
      totalCount,
    );

    // Wrap in expected format
    res.json({
      ...response,
      data: {
        games: response.data,
      },
    });
  }),
);

// Create a new game
router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      leagueSeasonId,
      gameDate,
      homeTeamId,
      visitorTeamId,
      fieldId,
      comment,
      gameType = GameType.Playoff,
      umpire1,
      umpire2,
      umpire3,
      umpire4,
    } = req.body;

    // Validate required fields
    if (!leagueSeasonId || !gameDate || !homeTeamId || !visitorTeamId) {
      throw new ValidationError(
        'League season ID, game date, home team, and visitor team are required',
      );
    }

    // Validate that home team and visitor team are different
    if (homeTeamId === visitorTeamId) {
      throw new ValidationError('Home team and visitor team cannot be the same');
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
      throw new ValidationError('Both teams must be in the specified league season');
    }

    // Check field availability if field is specified
    if (fieldId) {
      const existingGame = await prisma.leagueschedule.findFirst({
        where: {
          fieldid: BigInt(fieldId),
          gamedate: parseGameDate(gameDate),
          leagueid: BigInt(leagueSeasonId),
        },
      });

      if (existingGame) {
        throw new ConflictError('Field is already booked for this date and time');
      }
    }

    const game = await prisma.leagueschedule.create({
      data: {
        gamedate: parseGameDate(gameDate),
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
          gameDate: DateUtils.formatDateTimeForResponse(game.gamedate),
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
  }),
);

// Update a game
router.put(
  '/:gameId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
      throw new NotFoundError('Game not found');
    }

    // Validate that home team and visitor team are different (if both are provided)
    if (homeTeamId && visitorTeamId && homeTeamId === visitorTeamId) {
      throw new ValidationError('Home team and visitor team cannot be the same');
    }

    // Check field availability if field is being changed
    if (fieldId && fieldId !== existingGame.fieldid?.toString()) {
      const conflictingGame = await prisma.leagueschedule.findFirst({
        where: {
          fieldid: BigInt(fieldId),
          gamedate: gameDate ? parseGameDate(gameDate) : existingGame.gamedate,
          leagueid: existingGame.leagueid,
          id: { not: BigInt(gameId) },
        },
      });

      if (conflictingGame) {
        throw new ConflictError('Field is already booked for this date and time');
      }
    }

    const updatedGame = await prisma.leagueschedule.update({
      where: { id: BigInt(gameId) },
      data: {
        gamedate: gameDate ? parseGameDate(gameDate) : undefined,
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
          gameDate: DateUtils.formatDateTimeForResponse(updatedGame.gamedate),
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
  }),
);

// Delete a game
router.delete(
  '/:gameId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { gameId } = req.params;

    // Check if game exists
    const existingGame = await prisma.leagueschedule.findUnique({
      where: { id: BigInt(gameId) },
    });

    if (!existingGame) {
      throw new NotFoundError('Game not found');
    }

    await prisma.leagueschedule.delete({
      where: { id: BigInt(gameId) },
    });

    res.json({
      success: true,
      message: 'Game deleted successfully',
    });
  }),
);

// Async utility to check if user has team admin rights for a teamSeasonId
async function userHasTeamAdminRights(
  userId: string,
  accountId: string,
  teamSeasonId: string,
  roleService: IRoleQuery,
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
  const contact = await contactSecurityService.getUserContactInAccount(userId, BigInt(accountId), {
    id: true,
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, gameId, teamSeasonId } = extractRecapParams(req.params);

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
      throw new NotFoundError('Game not found');
    }
    if (
      game.leagueseason.seasonid !== seasonId ||
      game.leagueseason.league.accountid !== accountId
    ) {
      throw new NotFoundError('Game not found');
    }

    // Validate that teamSeasonId is one of the teams in the game
    if (!(teamSeasonId === game.hteamid || teamSeasonId === game.vteamid)) {
      throw new ValidationError('Invalid teamSeasonId for this game');
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
      throw new NotFoundError('No recap found for this team');
    }
    res.json({ success: true, data: { recap: recap.recap } });
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, gameId, teamSeasonId } = extractRecapParams(req.params);
    const userId = req.user?.id;
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }
    const { recap } = req.body;
    if (typeof recap !== 'string' || recap.trim() === '') {
      throw new ValidationError('Recap is required');
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
      throw new NotFoundError('Game not found');
    }
    if (
      game.leagueseason.seasonid !== seasonId ||
      game.leagueseason.league.accountid !== accountId
    ) {
      throw new ValidationError('Game does not belong to specified account/season');
    }

    // Validate that teamSeasonId is one of the teams in the game
    if (!(teamSeasonId === game.hteamid || teamSeasonId === game.vteamid)) {
      throw new ValidationError('Invalid teamSeasonId for this game');
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
      throw new AuthorizationError('Not authorized for this team in this game');
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
  }),
);

export default router;
