import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { IRoleQuery } from '../interfaces/roleInterfaces.js';
import { getGameStatusText, getGameStatusShortText } from '../utils/gameStatus.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
} from '../utils/customErrors.js';
import { extractGameOnlyParams, extractRecapParams } from '../utils/paramExtraction.js';
import { BatchQueryHelper } from '../repositories/implementations/batchQueries.js';
import { PaginationHelper } from '../utils/pagination.js';
import { DateUtils } from '../utils/dateUtils.js';
import prisma from '../lib/prisma.js';
import {
  ContactRoleType,
  GameResultType,
  GameStatusEnumType,
  GameStatusShortEnumType,
  GameType as GameTypeShared,
  GamesWithRecapsType,
  UpdateGameResultsSchema,
  UpsertGameRecapSchema,
  UpsertGameSchema,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const roleService = ServiceFactory.getRoleQuery();
const routeProtection = ServiceFactory.getRouteProtection();
const contactService = ServiceFactory.getContactService();

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
 * PUT /api/accounts/:accountId/games/:gameId/results
 * Update the results for a game
 */
router.put(
  '/:gameId/results',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, gameId } = extractGameOnlyParams(req.params);

    const input = UpdateGameResultsSchema.parse(req.body);
    const { homeScore, visitorScore, gameStatus } = input;

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
        vscore: visitorScore,
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

    const result: GameResultType = {
      id: updatedGame.id.toString(),
      homeScore: updatedGame.hscore,
      visitorScore: updatedGame.vscore,
      gameStatus: updatedGame.gamestatus,
    };

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/games
 * Get games for a season
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
        gameDate: DateUtils.formatDateTimeForResponse(game.gamedate) || '',
        homeTeam: {
          id: game.hteamid.toString(),
          name: homeTeamName,
        },
        visitorTeam: {
          id: game.vteamid.toString(),
          name: visitorTeamName,
        },
        homeScore: game.hscore,
        visitorScore: game.vscore,
        comment: game.comment,
        field: game.availablefields
          ? {
              id: game.availablefields.id.toString(),
              name: game.availablefields.name,
              shortName: game.availablefields.shortname,
              address: game.availablefields.address,
              city: game.availablefields.city,
              state: game.availablefields.state,
            }
          : undefined,
        gameStatus: game.gamestatus,
        gameStatusText: getGameStatusText(game.gamestatus) as GameStatusEnumType,
        gameStatusShortText: getGameStatusShortText(game.gamestatus) as GameStatusShortEnumType,
        gameType: game.gametype.toString(),
        umpire1: game.umpire1
          ? {
              id: game.umpire1.toString(),
            }
          : undefined,
        umpire2: game.umpire2
          ? {
              id: game.umpire2.toString(),
            }
          : undefined,
        umpire3: game.umpire3
          ? {
              id: game.umpire3.toString(),
            }
          : undefined,
        umpire4: game.umpire4
          ? {
              id: game.umpire4.toString(),
            }
          : undefined,
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
            team: { id: recap.teamid.toString() },
            recap: recap.recap,
          })),
        });
      } else {
        processedGames.push(baseGame);
      }
    }

    const response: GamesWithRecapsType = {
      games: processedGames,
      pagination: {
        total: totalCount,
        page: paginationParams.page,
        limit: paginationParams.limit,
      },
    };

    // Wrap in expected format
    res.json(response);
  }),
);

// Create a new game
router.post(
  '/',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.games.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { seasonId } = req.params;

    const input = UpsertGameSchema.parse(req.body);
    const {
      leagueSeasonId,
      gameDate,
      homeTeam,
      visitorTeam,
      field,
      comment,
      gameType,
      umpire1,
      umpire2,
      umpire3,
      umpire4,
    } = input;
    const homeTeamId = homeTeam.id;
    const visitorTeamId = visitorTeam.id;
    const fieldId = field?.id;

    // Check if teams exist in the league season, ensure they are from the same
    // seasonId as well.
    const teamsInLeague = await prisma.teamsseason.findMany({
      where: {
        leagueseason: {
          id: BigInt(leagueSeasonId),
          seasonid: BigInt(seasonId),
        },
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
        fieldid: fieldId ? BigInt(fieldId) : undefined,
        leagueid: BigInt(leagueSeasonId),
        gamestatus: 0, // Scheduled
        gametype: BigInt(gameType),
        umpire1: umpire1?.id ? BigInt(umpire1.id) : undefined,
        umpire2: umpire2?.id ? BigInt(umpire2.id) : undefined,
        umpire3: umpire3?.id ? BigInt(umpire3.id) : undefined,
        umpire4: umpire4?.id ? BigInt(umpire4.id) : undefined,
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

    const result: GameTypeShared = {
      id: game.id.toString(),
      gameDate: DateUtils.formatDateTimeForResponse(game.gamedate) || '',
      homeTeam: {
        id: game.hteamid.toString(),
      },
      visitorTeam: {
        id: game.vteamid.toString(),
      },
      homeScore: game.hscore,
      visitorScore: game.vscore,
      comment: game.comment,
      field: game.availablefields
        ? {
            id: game.availablefields.id.toString(),
            name: game.availablefields.name,
            shortName: game.availablefields.shortname,
            address: game.availablefields.address,
            city: game.availablefields.city,
            state: game.availablefields.state,
          }
        : undefined,
      gameStatus: game.gamestatus,
      gameType: game.gametype.toString(),
      umpire1: game.umpire1
        ? {
            id: game.umpire1.toString(),
          }
        : undefined,
      umpire2: game.umpire2
        ? {
            id: game.umpire2.toString(),
          }
        : undefined,
      umpire3: game.umpire3
        ? {
            id: game.umpire3.toString(),
          }
        : undefined,
      umpire4: game.umpire4
        ? {
            id: game.umpire4.toString(),
          }
        : undefined,
      league: {
        id: game.leagueseason.league.id.toString(),
        name: game.leagueseason.league.name,
      },
      season: {
        id: game.leagueseason.season.id.toString(),
        name: game.leagueseason.season.name,
      },
    };

    res.json(result);
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

    const input = UpsertGameSchema.parse(req.body);
    const {
      gameDate,
      homeTeam,
      visitorTeam,
      field,
      comment,
      gameStatus,
      gameType,
      umpire1,
      umpire2,
      umpire3,
      umpire4,
    } = input;

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
    if (homeTeam.id && visitorTeam.id && homeTeam.id === visitorTeam.id) {
      throw new ValidationError('Home team and visitor team cannot be the same');
    }

    // Check field availability if field is being changed
    if (field?.id && field.id !== existingGame.fieldid?.toString()) {
      const conflictingGame = await prisma.leagueschedule.findFirst({
        where: {
          fieldid: BigInt(field.id),
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
        hteamid: homeTeam?.id ? BigInt(homeTeam.id) : undefined,
        vteamid: visitorTeam?.id ? BigInt(visitorTeam.id) : undefined,
        comment: comment !== undefined ? comment : undefined,
        fieldid: field?.id ? BigInt(field.id) : field === null ? null : undefined,
        gamestatus: gameStatus !== undefined ? gameStatus : undefined,
        gametype: BigInt(gameType),
        // allow removing umpire by setting to null, undefined means no change
        umpire1: umpire1 ? BigInt(umpire1.id) : umpire1 === null ? null : undefined,
        umpire2: umpire2 ? BigInt(umpire2.id) : umpire2 === null ? null : undefined,
        umpire3: umpire3 ? BigInt(umpire3.id) : umpire3 === null ? null : undefined,
        umpire4: umpire4 ? BigInt(umpire4.id) : umpire4 === null ? null : undefined,
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

    const result: GameTypeShared = {
      id: updatedGame.id.toString(),
      gameDate: DateUtils.formatDateTimeForResponse(updatedGame.gamedate) || '',
      homeTeam: {
        id: updatedGame.hteamid.toString(),
      },
      visitorTeam: {
        id: updatedGame.vteamid.toString(),
      },
      homeScore: updatedGame.hscore,
      visitorScore: updatedGame.vscore,
      comment: updatedGame.comment,
      field: updatedGame.availablefields
        ? {
            id: updatedGame.availablefields.id.toString(),
            name: updatedGame.availablefields.name,
            shortName: updatedGame.availablefields.shortname,
            address: updatedGame.availablefields.address,
            city: updatedGame.availablefields.city,
            state: updatedGame.availablefields.state,
            zip: updatedGame.availablefields.zipcode,
          }
        : undefined,
      gameStatus: updatedGame.gamestatus,
      gameType: updatedGame.gametype.toString(),
      umpire1: updatedGame.umpire1
        ? {
            id: updatedGame.umpire1?.toString(),
          }
        : undefined,
      umpire2: updatedGame.umpire2
        ? {
            id: updatedGame.umpire2?.toString(),
          }
        : undefined,
      umpire3: updatedGame.umpire3
        ? {
            id: updatedGame.umpire3?.toString(),
          }
        : undefined,
      umpire4: updatedGame.umpire4
        ? {
            id: updatedGame.umpire4?.toString(),
          }
        : undefined,
      league: {
        id: updatedGame.leagueseason.league.id.toString(),
        name: updatedGame.leagueseason.league.name,
      },
      season: {
        id: updatedGame.leagueseason.season.id.toString(),
        name: updatedGame.leagueseason.season.name,
      },
    };

    res.json(result);
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

    res.json(true);
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
    (role: ContactRoleType) =>
      role.roleId === 'TeamAdmin' &&
      teamSeasonId &&
      teamSeasonId.toString() === role.roleData.toString(),
  );
  if (isTeamAdmin) return true;
  // 2. Look up contactid for this user/account
  const contact = await contactService.getContactByUserId(userId, BigInt(accountId));
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
    res.json(recap.recap);
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
    const input = UpsertGameRecapSchema.parse(req.body);
    const { recap } = input;

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
    res.json(updatedRecap.recap);
  }),
);

export default router;
