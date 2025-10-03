// LeagueSeason Management Routes for Draco Sports Manager
// Handles league-season relationships, divisions, and teams within leagues

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { getLogoUrl } from '../config/logo.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '../utils/customErrors.js';
import {
  extractSeasonParams,
  extractLeagueSeasonParams,
  extractBigIntParams,
} from '../utils/paramExtraction.js';
import { DateUtils } from '../utils/dateUtils.js';
import prisma from '../lib/prisma.js';
import { DivisionSeason } from '../interfaces/divisionInterfaces.js';
import { PrismaWhereClause } from '../interfaces/leagueInterfaces.js';
import {
  DivisionSeasonType,
  DivisionSeasonWithTeamsType,
  GameType,
  LeagueSeasonQueryParamsSchema,
  LeagueSeasonType,
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
  LeagueSetupType,
  UpsertDivisionSeasonSchema,
} from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const teamService = ServiceFactory.getTeamService();

// Types for Prisma result objects
interface dbDivisionSeasonResult {
  id: bigint;
  priority: number;
  divisiondefs: {
    id: bigint;
    name: string;
  };
}

interface dbTeamSeasonResult {
  id: bigint;
  name: string;
  divisionseasonid: bigint | null;
  teams: {
    id: bigint;
    webaddress: string | null;
    youtubeuserid: string | null;
    defaultvideo: string | null;
    autoplayvideo: boolean;
  };
}

// Type guards for safe property access
function hasDivisionSeasons(ls: unknown): ls is { divisionseason: dbDivisionSeasonResult[] } {
  return (
    typeof ls === 'object' &&
    ls !== null &&
    'divisionseason' in ls &&
    Array.isArray((ls as { divisionseason: unknown }).divisionseason)
  );
}

function hasTeamSeasons(ls: unknown): ls is { teamsseason: dbTeamSeasonResult[] } {
  return (
    typeof ls === 'object' &&
    ls !== null &&
    'teamsseason' in ls &&
    Array.isArray((ls as { teamsseason: unknown }).teamsseason)
  );
}

/**
 * Extracts team counts (players or managers) for the given league seasons
 * Consolidates duplicate logic for player and manager count calculations
 */
async function getTeamCounts(
  leagueSeasonIds: bigint[],
  accountId: bigint,
  countType: 'players' | 'managers',
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (countType === 'players') {
    // Get player counts for all teams in the league seasons
    const playerCountsByTeam = await prisma.rosterseason.groupBy({
      by: ['teamseasonid'],
      where: {
        teamsseason: {
          leagueseasonid: {
            in: leagueSeasonIds,
          },
        },
        roster: {
          contacts: {
            creatoraccountid: accountId, // Ensure account boundary
          },
        },
      },
      _count: {
        playerid: true,
      },
    });

    // Create a mapping from teamseasonid to player count
    for (const result of playerCountsByTeam) {
      counts.set(result.teamseasonid.toString(), result._count.playerid);
    }
  } else {
    // Get manager counts for all teams in the league seasons
    const managerCountsByTeam = await prisma.teamseasonmanager.groupBy({
      by: ['teamseasonid'],
      where: {
        teamsseason: {
          leagueseasonid: {
            in: leagueSeasonIds,
          },
        },
        contacts: {
          creatoraccountid: accountId, // Ensure account boundary
        },
      },
      _count: {
        contactid: true,
      },
    });

    // Create a mapping from teamseasonid to manager count
    for (const result of managerCountsByTeam) {
      counts.set(result.teamseasonid.toString(), result._count.contactid);
    }
  }

  return counts;
}

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues
 * Get leagues for a specific season with optional teams and divisions data
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    const queryParams = LeagueSeasonQueryParamsSchema.parse(req.query);
    const { includeTeams, includeUnassignedTeams, includePlayerCounts, includeManagerCounts } =
      queryParams;

    // Base query always includes leagueseason + league data
    // we add division/team information based on qs values
    const leagueSeasons = await prisma.leagueseason.findMany({
      where: {
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
      include: {
        league: {
          select: {
            id: true,
            name: true,
            accountid: true,
          },
        },
        season: {
          select: {
            id: true,
            name: true,
            accountid: true,
          },
        },
        // Conditionally include divisionseason and teamsseason when includeTeams is true
        ...(includeTeams && {
          divisionseason: {
            include: {
              divisiondefs: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              priority: 'asc',
            },
          },
          teamsseason: {
            include: {
              teams: {
                select: {
                  id: true,
                  webaddress: true,
                  youtubeuserid: true,
                  defaultvideo: true,
                  autoplayvideo: true,
                },
              },
            },
            orderBy: {
              name: 'asc',
            },
          },
        }),
      },
      orderBy: {
        league: {
          name: 'asc',
        },
      },
    });

    // Calculate player counts if requested
    let teamPlayerCounts: Map<string, number> = new Map();
    if (includePlayerCounts) {
      teamPlayerCounts = await getTeamCounts(
        leagueSeasons.map((ls) => ls.id),
        accountId,
        'players',
      );
    }

    // Calculate manager counts if requested
    let teamManagerCounts: Map<string, number> = new Map();
    if (includeManagerCounts) {
      teamManagerCounts = await getTeamCounts(
        leagueSeasons.map((ls) => ls.id),
        accountId,
        'managers',
      );
    }

    // Format the response
    const formattedLeagueSeasons = leagueSeasons.map((ls) => {
      const result: LeagueSeasonWithDivisionTeamsAndUnassignedType = {
        id: ls.id.toString(),
        league: {
          id: ls.league.id.toString(),
          name: ls.league.name,
        },
      };

      // Add divisions with teams if includeTeams was requested
      if (includeTeams && hasDivisionSeasons(ls) && hasTeamSeasons(ls)) {
        result.divisions = ls.divisionseason.map(
          (ds: dbDivisionSeasonResult): DivisionSeasonWithTeamsType => ({
            id: ds.id.toString(),
            division: { id: ds.divisiondefs.id.toString(), name: ds.divisiondefs.name },
            priority: ds.priority,
            teams: ls.teamsseason
              .filter((ts: dbTeamSeasonResult) => ts.divisionseasonid === ds.id)
              .map((ts: dbTeamSeasonResult) => ({
                id: ts.id.toString(),
                name: ts.name,
                team: {
                  id: ts.teams.id.toString(),
                  webAddress: ts.teams.webaddress,
                  youtubeUserId: ts.teams.youtubeuserid,
                  defaultVideo: ts.teams.defaultvideo,
                  autoPlayVideo: ts.teams.autoplayvideo,
                  logoUrl: getLogoUrl(accountId.toString(), ts.teams.id.toString()),
                },
                ...(includePlayerCounts && {
                  playerCount: teamPlayerCounts.get(ts.id.toString()) || 0,
                }),
                ...(includeManagerCounts && {
                  managerCount: teamManagerCounts.get(ts.id.toString()) || 0,
                }),
              })),
          }),
        );

        // Add unassigned teams if both includeTeams AND includeUnassignedTeams are true
        if (includeUnassignedTeams && hasTeamSeasons(ls)) {
          result.unassignedTeams = ls.teamsseason
            .filter((ts: dbTeamSeasonResult) => !ts.divisionseasonid)
            .map((ts: dbTeamSeasonResult) => ({
              id: ts.id.toString(),
              team: {
                id: ts.teams.id.toString(),
                webAddress: ts.teams.webaddress,
                youtubeUserId: ts.teams.youtubeuserid,
                defaultVideo: ts.teams.defaultvideo,
                autoPlayVideo: ts.teams.autoplayvideo,
                logoUrl: getLogoUrl(accountId.toString(), ts.teams.id.toString()),
              },
              name: ts.name,
              ...(includePlayerCounts && {
                playerCount: teamPlayerCounts.get(ts.id.toString()) || 0,
              }),
              ...(includeManagerCounts && {
                managerCount: teamManagerCounts.get(ts.id.toString()) || 0,
              }),
            }));
        }
      }

      return result;
    });

    const result: LeagueSetupType = {
      leagueSeasons: formattedLeagueSeasons || [],
      season:
        leagueSeasons.length > 0
          ? {
              id: leagueSeasons[0].season.id.toString(),
              name: leagueSeasons[0].season.name,
              accountId: leagueSeasons[0].season.accountid.toString(),
            }
          : undefined,
    };

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId
 * Get specific league season with its divisions and teams
 */
router.get(
  '/:leagueSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

    // Verify the season belongs to this account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
      },
      include: {
        league: {
          select: {
            id: true,
            name: true,
            accountid: true,
          },
        },
        divisionseason: {
          include: {
            divisiondefs: {
              select: {
                id: true,
                name: true,
              },
            },
            teamsseason: {
              include: {
                teams: {
                  select: {
                    id: true,
                    webaddress: true,
                    youtubeuserid: true,
                    defaultvideo: true,
                    autoplayvideo: true,
                  },
                },
              },
            },
          },
          orderBy: {
            priority: 'asc',
          },
        },
        teamsseason: {
          where: {
            divisionseasonid: null, // Teams not assigned to any division
          },
          include: {
            teams: {
              select: {
                id: true,
                webaddress: true,
                youtubeuserid: true,
                defaultvideo: true,
                autoplayvideo: true,
              },
            },
          },
        },
      },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    const result: LeagueSeasonWithDivisionTeamsAndUnassignedType = {
      id: leagueSeason.id.toString(),
      league: {
        id: leagueSeason.leagueid.toString(),
        name: leagueSeason.league.name,
      },
      divisions: leagueSeason.divisionseason.map((ds) => ({
        id: ds.id.toString(),
        division: {
          id: ds.divisionid.toString(),
          name: ds.divisiondefs.name,
        },
        priority: ds.priority,
        teams: ds.teamsseason.map((ts) => ({
          id: ts.id.toString(),
          name: ts.name,
          team: {
            id: ts.teamid.toString(),
            webAddress: ts.teams.webaddress,
            youtubeUserId: ts.teams.youtubeuserid,
            defaultVideo: ts.teams.defaultvideo,
            autoPlayVideo: ts.teams.autoplayvideo,
            logoUrl: getLogoUrl(season.accountid.toString(), ts.teamid.toString()),
          },
        })),
      })),
      unassignedTeams: leagueSeason.teamsseason.map((ts) => ({
        id: ts.id.toString(),
        team: {
          id: ts.teamid.toString(),
          webAddress: ts.teams.webaddress,
          youtubeUserId: ts.teams.youtubeuserid,
          defaultVideo: ts.teams.defaultvideo,
          autoPlayVideo: ts.teams.autoplayvideo,
          logoUrl: getLogoUrl(season.accountid.toString(), ts.teamid.toString()),
        },
      })),
    };

    res.json(result);
  }),
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/leagues
 * Add a league to a season
 */
router.post(
  '/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const seasonId = BigInt(req.params.seasonId);
    const accountId = BigInt(req.params.accountId);
    const { leagueId } = req.body;

    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    // Verify the season belongs to this account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    // Verify the league belongs to this account
    const league = await prisma.league.findFirst({
      where: {
        id: BigInt(leagueId),
        accountid: accountId,
      },
    });

    if (!league) {
      throw new NotFoundError('League not found');
    }

    // Check if this league is already added to this season
    const existingLeagueSeason = await prisma.leagueseason.findFirst({
      where: {
        seasonid: seasonId,
        leagueid: BigInt(leagueId),
      },
    });

    if (existingLeagueSeason) {
      throw new ConflictError('This league is already added to this season');
    }

    // Add the league to the season
    const newLeagueSeason = await prisma.leagueseason.create({
      data: {
        seasonid: seasonId,
        leagueid: BigInt(leagueId),
      },
    });

    // Get the league details separately
    const leagueDetails = await prisma.league.findUnique({
      where: {
        id: BigInt(leagueId),
      },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });

    const result: LeagueSeasonType = {
      id: newLeagueSeason.id.toString(),
      season: {
        id: seasonId.toString(),
        name: season.name,
      },
      league: {
        id: newLeagueSeason.leagueid.toString(),
        name: leagueDetails!.name,
      },
    };

    res.status(201).json(result);
  }),
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId
 * Remove a league from a season
 */
router.delete(
  '/:leagueSeasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

    // Verify the season belongs to this account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    // Get the league season with league details
    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
      },
      include: {
        league: {
          select: {
            id: true,
            name: true,
            accountid: true,
          },
        },
      },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    // Verify the league belongs to this account
    if (leagueSeason.league.accountid !== accountId) {
      throw new AuthorizationError('Access denied');
    }

    // Check if there are any related records that would prevent deletion
    const hasRelatedData = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
      },
      include: {
        _count: {
          select: {
            divisionseason: true,
            gameejections: true,
            golfmatch: true,
            leagueevents: true,
            leagueschedule: true,
            playoffsetup: true,
            teamsseason: true,
          },
        },
      },
    });

    if (
      hasRelatedData &&
      (hasRelatedData._count.divisionseason > 0 ||
        hasRelatedData._count.gameejections > 0 ||
        hasRelatedData._count.golfmatch > 0 ||
        hasRelatedData._count.leagueevents > 0 ||
        hasRelatedData._count.leagueschedule > 0 ||
        hasRelatedData._count.playoffsetup > 0 ||
        hasRelatedData._count.teamsseason > 0)
    ) {
      throw new ConflictError(
        'Cannot remove league from season because it has related data (divisions, games, teams, etc.). Remove related data first.',
      );
    }

    try {
      // Remove the league from the season
      await prisma.leagueseason.delete({
        where: {
          id: leagueSeasonId,
        },
      });
    } catch (error: unknown) {
      // Check if it's a foreign key constraint error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
        throw new ConflictError(
          'Cannot remove league from season because it has related data. Remove related data first.',
        );
      }
      throw error; // Re-throw other errors for asyncHandler to catch
    }

    res.json(true);
  }),
);

// Division Management Routes

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions
 * Get all divisions for a league season
 */
router.get(
  '/:leagueSeasonId/divisions',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

    // Verify the season belongs to this account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    // Verify the league season exists
    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
      },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    const divisions = await prisma.divisionseason.findMany({
      where: {
        leagueseasonid: leagueSeasonId,
      },
      include: {
        divisiondefs: {
          select: {
            id: true,
            name: true,
          },
        },
        teamsseason: {
          include: {
            teams: {
              select: {
                id: true,
                webaddress: true,
                youtubeuserid: true,
                defaultvideo: true,
                autoplayvideo: true,
              },
            },
          },
        },
      },
      orderBy: {
        priority: 'asc',
      },
    });

    const result: DivisionSeasonWithTeamsType[] = divisions.map((ds: DivisionSeason) => ({
      id: ds.id.toString(),
      division: {
        id: ds.divisionid.toString(),
        name: ds.divisiondefs.name,
      },
      priority: ds.priority,
      teams: ds.teamsseason.map((ts) => ({
        id: ts.id.toString(),
        name: ts.name,
        team: {
          id: ts.teamid.toString(),
          webAddress: ts.teams.webaddress,
          youtubeUserId: ts.teams.youtubeuserid,
          defaultVideo: ts.teams.defaultvideo,
          autoPlayVideo: ts.teams.autoplayvideo,
        },
      })),
    }));

    res.json(result);
  }),
);

// Get all games for a specific league season
router.get(
  '/:leagueSeasonId/games',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { leagueSeasonId } = req.params;
    const { startDate, endDate, teamId } = req.query;

    // Build where clause
    const where: PrismaWhereClause = {
      leagueid: BigInt(leagueSeasonId),
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

    const games = await prisma.leagueschedule.findMany({
      where,
      include: {
        availablefields: true,
        leagueseason: {
          include: {
            league: true,
            season: true,
          },
        },
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

    // Process games to include team names
    const processedGames: GameType[] = [];
    for (const game of games) {
      const teamNames = await getTeamNames(game.hteamid, game.vteamid);
      processedGames.push({
        id: game.id.toString(),
        gameDate: DateUtils.formatDateTimeForResponse(game.gamedate) || '',
        homeTeam: { id: game.hteamid.toString(), name: teamNames.homeTeamName },
        visitorTeam: { id: game.vteamid.toString(), name: teamNames.visitorTeamName },
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
        umpire1: game.umpire1 ? { id: game.umpire1.toString() } : undefined,
        umpire2: game.umpire2 ? { id: game.umpire2.toString() } : undefined,
        umpire3: game.umpire3 ? { id: game.umpire3.toString() } : undefined,
        umpire4: game.umpire4 ? { id: game.umpire4.toString() } : undefined,
        league: {
          id: game.leagueseason.league.id.toString(),
          name: game.leagueseason.league.name,
        },
        season: {
          id: game.leagueseason.season.id.toString(),
          name: game.leagueseason.season.name,
        },
      });
    }

    res.json(processedGames);
  }),
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions
 * Add a division to a league season (supports both existing divisions and creating new ones)
 */
router.post(
  '/:leagueSeasonId/divisions',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

    const input = UpsertDivisionSeasonSchema.parse(req.body);
    const { divisionId, name, priority } = input;

    // Must provide either divisionId (existing) or name (new)
    if (!divisionId && (!name || !name.trim())) {
      throw new ValidationError('Either Division ID or Division name is required');
    }

    // Verify the season belongs to this account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    // Verify the league season exists
    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
      },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    let divisionDef;

    if (divisionId) {
      // Using existing division
      divisionDef = await prisma.divisiondefs.findFirst({
        where: {
          id: BigInt(divisionId),
          accountid: accountId,
        },
      });

      if (!divisionDef) {
        throw new NotFoundError('Division not found');
      }
    } else {
      // Creating new division
      if (!name || !name.trim()) {
        throw new ValidationError('Division name is required to create a new division');
      }

      const trimmedName = name.trim();

      // Check if division with this name already exists
      const existingDivision = await prisma.divisiondefs.findFirst({
        where: {
          name: trimmedName,
          accountid: accountId,
        },
      });

      if (existingDivision) {
        throw new ConflictError('A division with this name already exists');
      }

      // Create new division
      divisionDef = await prisma.divisiondefs.create({
        data: {
          name: trimmedName,
          accountid: accountId,
        },
      });
    }

    // Check if this division is already added to this league season
    const existingDivisionSeason = await prisma.divisionseason.findFirst({
      where: {
        leagueseasonid: leagueSeasonId,
        divisionid: divisionDef.id,
      },
    });

    if (existingDivisionSeason) {
      throw new ConflictError('This division is already added to this league season');
    }

    // Add the division to the league season
    const newDivisionSeason = await prisma.divisionseason.create({
      data: {
        leagueseasonid: leagueSeasonId,
        divisionid: divisionDef.id,
        priority: priority || 0,
      },
      include: {
        divisiondefs: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const result: DivisionSeasonType = {
      id: newDivisionSeason.id.toString(),
      division: {
        id: newDivisionSeason.divisionid.toString(),
        name: newDivisionSeason.divisiondefs.name,
      },
      priority: newDivisionSeason.priority,
    };

    res.status(201).json(result);
  }),
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId
 * Update a division's name and priority within a league season
 */
router.put(
  '/:leagueSeasonId/divisions/:divisionSeasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId, divisionSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
      'divisionSeasonId',
    );

    const input = UpsertDivisionSeasonSchema.parse(req.body);
    const { name, priority } = input;

    // Verify the season belongs to this account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    // Verify the league season exists
    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
      },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    // Verify the division season exists and belongs to this league season
    const divisionSeason = await prisma.divisionseason.findFirst({
      where: {
        id: divisionSeasonId,
        leagueseasonid: leagueSeasonId,
      },
      include: {
        divisiondefs: true,
      },
    });

    if (!divisionSeason) {
      throw new NotFoundError('Division season not found');
    }

    // Verify the division belongs to this account
    if (divisionSeason.divisiondefs.accountid !== accountId) {
      throw new AuthorizationError('Access denied');
    }

    // Update division season priority if provided
    if (priority !== undefined) {
      await prisma.divisionseason.update({
        where: {
          id: divisionSeasonId,
        },
        data: {
          priority: priority,
        },
      });
    }

    // Update division definition name if provided and different
    if (name && name.trim() && name.trim() !== divisionSeason.divisiondefs.name) {
      // Check if another division with this name already exists for this account
      const existingDivision = await prisma.divisiondefs.findFirst({
        where: {
          name: name.trim(),
          accountid: accountId,
          id: {
            not: divisionSeason.divisiondefs.id,
          },
        },
      });

      if (existingDivision) {
        throw new ValidationError('A division with this name already exists');
      }

      // Update the division definition
      await prisma.divisiondefs.update({
        where: {
          id: divisionSeason.divisiondefs.id,
        },
        data: {
          name: name.trim(),
        },
      });
    }

    res.status(200).json(true);
  }),
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId
 * Remove a division from a league season
 */
router.delete(
  '/:leagueSeasonId/divisions/:divisionSeasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId, divisionSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
      'divisionSeasonId',
    );

    // Verify the season belongs to this account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    // Verify the league season exists
    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
      },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    // Get the division season with division details
    const divisionSeason = await prisma.divisionseason.findFirst({
      where: {
        id: divisionSeasonId,
        leagueseasonid: leagueSeasonId,
      },
      include: {
        divisiondefs: {
          select: {
            id: true,
            name: true,
            accountid: true,
          },
        },
      },
    });

    if (!divisionSeason) {
      throw new NotFoundError('Division season not found');
    }

    // Verify the division belongs to this account
    if (divisionSeason.divisiondefs.accountid !== accountId) {
      throw new AuthorizationError('Access denied');
    }

    // Check if there are any teams in this division
    const hasTeams = await prisma.teamsseason.findFirst({
      where: {
        divisionseasonid: divisionSeasonId,
      },
    });

    if (hasTeams) {
      throw new ConflictError(
        'Cannot remove division because it contains teams. Remove teams from division first.',
      );
    }

    // Remove the division from the league season
    await prisma.divisionseason.delete({
      where: {
        id: divisionSeasonId,
      },
    });

    res.json(true);
  }),
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/assign-division
 * Assign a team to a division within a league season
 */
router.put(
  '/:leagueSeasonId/teams/:teamSeasonId/assign-division',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId, teamSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
      'teamSeasonId',
    );
    const { divisionSeasonId } = req.body;

    if (!divisionSeasonId) {
      throw new ValidationError('DivisionSeasonId is required');
    }

    // Verify the season belongs to this account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });
    if (!season) {
      throw new NotFoundError('Season not found');
    }

    // Verify the league season exists
    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
      },
    });
    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    // Verify the division season exists and belongs to this league season
    const divisionSeason = await prisma.divisionseason.findFirst({
      where: {
        id: BigInt(divisionSeasonId),
        leagueseasonid: leagueSeasonId,
      },
    });
    if (!divisionSeason) {
      throw new NotFoundError('Division season not found');
    }

    // Verify the team season exists and belongs to this account and season
    const teamSeason = await teamService.validateTeamSeasonWithDivision(
      teamSeasonId,
      seasonId,
      accountId,
    );

    // Check if the team is currently assigned to a division
    if (teamSeason.divisionseasonid) {
      throw new ConflictError(
        'Team is already assigned to a division. Remove from current division first.',
      );
    }

    // Update the team season to assign it to the division
    await prisma.teamsseason.update({
      where: { id: teamSeasonId },
      data: { divisionseasonid: BigInt(divisionSeasonId) },
    });

    res.json(true);
  }),
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/remove-from-division
 * Remove a team from its current division (make it unassigned)
 */
router.delete(
  '/:leagueSeasonId/teams/:teamSeasonId/remove-from-division',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId, teamSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
      'teamSeasonId',
    );

    // Verify the season belongs to this account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });
    if (!season) {
      throw new NotFoundError('Season not found');
    }

    // Verify the league season exists
    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
      },
    });
    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    // Verify the team season exists and belongs to this account and season
    const teamSeason = await teamService.validateTeamSeasonWithDivision(
      teamSeasonId,
      seasonId,
      accountId,
    );

    // Check if the team is currently assigned to a division
    if (!teamSeason.divisionseasonid) {
      throw new ValidationError('Team is not currently assigned to any division');
    }

    // Update the team season to remove it from the division
    await prisma.teamsseason.update({
      where: { id: teamSeasonId },
      data: { divisionseasonid: null },
    });

    res.json(true);
  }),
);

export default router;
