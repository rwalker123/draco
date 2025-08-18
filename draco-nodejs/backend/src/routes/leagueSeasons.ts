// LeagueSeason Management Routes for Draco Sports Manager
// Handles league-season relationships, divisions, and teams within leagues

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { RouteProtection } from '../middleware/routeProtection.js';
import { RoleService } from '../services/roleService.js';
import { getLogoUrl } from '../config/logo.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/customErrors.js';
import {
  extractSeasonParams,
  extractLeagueSeasonParams,
  extractBigIntParams,
} from '../utils/paramExtraction.js';
import { validateTeamSeasonWithDivision } from '../utils/teamValidation.js';
import prisma from '../lib/prisma.js';
import { DivisionSeason } from '../interfaces/divisionInterfaces.js';
import { LeagueSeasonWithRelations, PrismaWhereClause } from '../interfaces/leagueInterfaces.js';

const router = Router({ mergeParams: true });
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues
 * Get leagues for a specific season with optional teams and divisions data
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const includeTeams = req.query.includeTeams !== undefined;
    const includeUnassignedTeams = req.query.includeTeams === 'includeUnassigned';

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

    // Format the response
    const formattedLeagueSeasons = leagueSeasons.map((ls) => {
      const result: {
        id: string;
        leagueId: string;
        leagueName: string;
        accountId: string;
        divisions?: Array<{
          id: string;
          divisionId: string;
          divisionName: string;
          priority: number;
          teams: Array<{
            id: string;
            teamId: string;
            name: string;
            webAddress: string | null;
            youtubeUserId: string | null;
            defaultVideo: string | null;
            autoPlayVideo: boolean;
            logoUrl: string;
          }>;
        }>;
        unassignedTeams?: Array<{
          id: string;
          teamId: string;
          name: string;
          webAddress: string | null;
          youtubeUserId: string | null;
          defaultVideo: string | null;
          autoPlayVideo: boolean;
          logoUrl: string;
        }>;
      } = {
        id: ls.id.toString(),
        leagueId: ls.league.id.toString(),
        leagueName: ls.league.name,
        accountId: ls.league.accountid.toString(),
      };

      // Add divisions with teams if includeTeams was requested
      if (includeTeams) {
        result.divisions = ((ls as unknown as LeagueSeasonWithRelations).divisionseason || []).map(
          (ds) => ({
            id: ds.id.toString(),
            divisionId: ds.divisiondefs.id.toString(),
            divisionName: ds.divisiondefs.name,
            priority: ds.priority,
            teams: ((ls as unknown as LeagueSeasonWithRelations).teamsseason || [])
              .filter((ts) => ts.divisionseasonid === ds.id)
              .map((ts) => ({
                id: ts.id.toString(),
                teamId: ts.teams.id.toString(),
                name: ts.name,
                webAddress: ts.teams.webaddress,
                youtubeUserId: ts.teams.youtubeuserid,
                defaultVideo: ts.teams.defaultvideo,
                autoPlayVideo: ts.teams.autoplayvideo,
                logoUrl: getLogoUrl(accountId.toString(), ts.teams.id.toString()),
              })),
          }),
        );

        // Add unassigned teams if both includeTeams AND includeUnassignedTeams are true
        if (includeUnassignedTeams) {
          result.unassignedTeams = ((ls as unknown as LeagueSeasonWithRelations).teamsseason || [])
            .filter((ts) => !ts.divisionseasonid)
            .map((ts) => ({
              id: ts.id.toString(),
              teamId: ts.teams.id.toString(),
              name: ts.name,
              webAddress: ts.teams.webaddress,
              youtubeUserId: ts.teams.youtubeuserid,
              defaultVideo: ts.teams.defaultvideo,
              autoPlayVideo: ts.teams.autoplayvideo,
              logoUrl: getLogoUrl(accountId.toString(), ts.teams.id.toString()),
            }));
        }
      }

      return result;
    });

    res.json({
      success: true,
      data: {
        leagueSeasons: formattedLeagueSeasons,
        season:
          leagueSeasons.length > 0
            ? {
                id: leagueSeasons[0].season.id.toString(),
                name: leagueSeasons[0].season.name,
                accountId: leagueSeasons[0].season.accountid.toString(),
              }
            : null,
      },
    });
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

    res.json({
      success: true,
      data: {
        leagueSeason: {
          id: leagueSeason.id.toString(),
          leagueId: leagueSeason.leagueid.toString(),
          leagueName: leagueSeason.league.name,
          accountId: leagueSeason.league.accountid.toString(),
          divisions: leagueSeason.divisionseason.map((ds) => ({
            id: ds.id.toString(),
            divisionId: ds.divisionid.toString(),
            divisionName: ds.divisiondefs.name,
            priority: ds.priority,
            teams: ds.teamsseason.map((ts) => ({
              id: ts.id.toString(),
              teamId: ts.teamid.toString(),
              name: ts.name,
              webAddress: ts.teams.webaddress,
              youtubeUserId: ts.teams.youtubeuserid,
              defaultVideo: ts.teams.defaultvideo,
              autoPlayVideo: ts.teams.autoplayvideo,
              logoUrl: getLogoUrl(season.accountid.toString(), ts.teamid.toString()),
            })),
          })),
          unassignedTeams: leagueSeason.teamsseason.map((ts) => ({
            id: ts.id.toString(),
            teamId: ts.teamid.toString(),
            name: ts.name,
            webAddress: ts.teams.webaddress,
            youtubeUserId: ts.teams.youtubeuserid,
            defaultVideo: ts.teams.defaultvideo,
            autoPlayVideo: ts.teams.autoplayvideo,
            logoUrl: getLogoUrl(season.accountid.toString(), ts.teamid.toString()),
          })),
        },
      },
    });
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

    res.status(201).json({
      success: true,
      data: {
        leagueSeason: {
          id: newLeagueSeason.id.toString(),
          seasonId: seasonId.toString(),
          seasonName: season.name,
          leagueId: newLeagueSeason.leagueid.toString(),
          leagueName: leagueDetails!.name,
          accountId: leagueDetails!.accountid.toString(),
        },
        message: `League "${leagueDetails!.name}" has been added to season "${season.name}"`,
      },
    });
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
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId,
        },
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found',
        });
        return;
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
        res.status(404).json({
          success: false,
          message: 'League season not found',
        });
        return;
      }

      // Verify the league belongs to this account
      if (leagueSeason.league.accountid !== accountId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
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
        res.status(400).json({
          success: false,
          message:
            'Cannot remove league from season because it has related data (divisions, games, teams, etc.). Remove related data first.',
        });
        return;
      }

      // Remove the league from the season
      await prisma.leagueseason.delete({
        where: {
          id: leagueSeasonId,
        },
      });

      res.json({
        success: true,
        data: {
          message: `League "${leagueSeason.league.name}" has been removed from season "${season.name}"`,
        },
      });
    } catch (error: unknown) {
      console.error('Error removing league from season:', error);

      // Check if it's a foreign key constraint error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
        res.status(400).json({
          success: false,
          message:
            'Cannot remove league from season because it has related data. Remove related data first.',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
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
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId,
        },
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found',
        });
        return;
      }

      // Verify the league season exists
      const leagueSeason = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId,
          seasonid: seasonId,
        },
      });

      if (!leagueSeason) {
        res.status(404).json({
          success: false,
          message: 'League season not found',
        });
        return;
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

      res.json({
        success: true,
        data: {
          divisions: divisions.map((ds: DivisionSeason) => ({
            id: ds.id.toString(),
            divisionId: ds.divisionid.toString(),
            divisionName: ds.divisiondefs.name,
            priority: ds.priority,
            teams: ds.teamsseason.map((ts) => ({
              id: ts.id.toString(),
              teamId: ts.teamid.toString(),
              name: ts.name,
              webAddress: ts.teams.webaddress,
              youtubeUserId: ts.teams.youtubeuserid,
              defaultVideo: ts.teams.defaultvideo,
              autoPlayVideo: ts.teams.autoplayvideo,
            })),
          })),
        },
      });
    } catch (error) {
      console.error('Error getting divisions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

// Get all games for a specific league season
router.get(
  '/:leagueSeasonId/games',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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
        });
      }

      res.json({
        success: true,
        data: {
          games: processedGames,
        },
      });
    } catch (error) {
      console.error('Error fetching schedule:', error);
      next(error);
    }
  },
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions
 * Add a division to a league season (supports both existing divisions and creating new ones)
 */
router.post(
  '/:leagueSeasonId/divisions',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, leagueSeasonId } = extractLeagueSeasonParams(req.params);
      const { divisionId, name, priority } = req.body;

      // Must provide either divisionId (existing) or name (new)
      if (!divisionId && (!name || !name.trim())) {
        res.status(400).json({
          success: false,
          message: 'Either Division ID or Division name is required',
        });
        return;
      }

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId,
        },
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found',
        });
        return;
      }

      // Verify the league season exists
      const leagueSeason = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId,
          seasonid: seasonId,
        },
      });

      if (!leagueSeason) {
        res.status(404).json({
          success: false,
          message: 'League season not found',
        });
        return;
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
          res.status(404).json({
            success: false,
            message: 'Division not found',
          });
          return;
        }
      } else {
        // Creating new division
        const trimmedName = name.trim();

        // Check if division with this name already exists
        const existingDivision = await prisma.divisiondefs.findFirst({
          where: {
            name: trimmedName,
            accountid: accountId,
          },
        });

        if (existingDivision) {
          res.status(400).json({
            success: false,
            message: 'A division with this name already exists',
          });
          return;
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
        res.status(409).json({
          success: false,
          message: 'This division is already added to this league season',
        });
        return;
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

      res.status(201).json({
        success: true,
        data: {
          divisionSeason: {
            id: newDivisionSeason.id.toString(),
            divisionId: newDivisionSeason.divisionid.toString(),
            divisionName: newDivisionSeason.divisiondefs.name,
            priority: newDivisionSeason.priority,
            teams: [],
          },
          message: `Division "${newDivisionSeason.divisiondefs.name}" has been ${divisionId ? 'added to' : 'created and added to'} the league season`,
        },
      });
    } catch (error: unknown) {
      console.error('Error adding division to league season:', error);

      // Check if it's a unique constraint violation
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        res.status(409).json({
          success: false,
          message: 'This division is already added to this league season',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId
 * Update a division's name and priority within a league season
 */
router.put(
  '/:leagueSeasonId/divisions/:divisionSeasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, leagueSeasonId, divisionSeasonId } = extractBigIntParams(
        req.params,
        'accountId',
        'seasonId',
        'leagueSeasonId',
        'divisionSeasonId',
      );
      const { name, priority } = req.body;

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId,
        },
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found',
        });
        return;
      }

      // Verify the league season exists
      const leagueSeason = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId,
          seasonid: seasonId,
        },
      });

      if (!leagueSeason) {
        res.status(404).json({
          success: false,
          message: 'League season not found',
        });
        return;
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
        res.status(404).json({
          success: false,
          message: 'Division season not found',
        });
        return;
      }

      // Verify the division belongs to this account
      if (divisionSeason.divisiondefs.accountid !== accountId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Update division season priority if provided
      if (priority !== undefined) {
        await prisma.divisionseason.update({
          where: {
            id: divisionSeasonId,
          },
          data: {
            priority: parseInt(priority),
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
          res.status(400).json({
            success: false,
            message: 'A division with this name already exists',
          });
          return;
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

      res.status(200).json({
        success: true,
        data: {
          message: 'Division updated successfully',
        },
      });
    } catch (error: unknown) {
      console.error('Error updating division season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/divisions/:divisionSeasonId
 * Remove a division from a league season
 */
router.delete(
  '/:leagueSeasonId/divisions/:divisionSeasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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
        res.status(404).json({
          success: false,
          message: 'Season not found',
        });
        return;
      }

      // Verify the league season exists
      const leagueSeason = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId,
          seasonid: seasonId,
        },
      });

      if (!leagueSeason) {
        res.status(404).json({
          success: false,
          message: 'League season not found',
        });
        return;
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
        res.status(404).json({
          success: false,
          message: 'Division season not found',
        });
        return;
      }

      // Verify the division belongs to this account
      if (divisionSeason.divisiondefs.accountid !== accountId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Check if there are any teams in this division
      const hasTeams = await prisma.teamsseason.findFirst({
        where: {
          divisionseasonid: divisionSeasonId,
        },
      });

      if (hasTeams) {
        res.status(400).json({
          success: false,
          message:
            'Cannot remove division because it contains teams. Remove teams from division first.',
        });
        return;
      }

      // Remove the division from the league season
      await prisma.divisionseason.delete({
        where: {
          id: divisionSeasonId,
        },
      });

      res.json({
        success: true,
        data: {
          message: `Division "${divisionSeason.divisiondefs.name}" has been removed from the league season`,
        },
      });
    } catch (error: unknown) {
      console.error('Error removing division from league season:', error);

      // Check if it's a foreign key constraint error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
        res.status(400).json({
          success: false,
          message: 'Cannot remove division because it has related data. Remove related data first.',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/assign-division
 * Assign a team to a division within a league season
 */
router.put(
  '/:leagueSeasonId/teams/:teamSeasonId/assign-division',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { accountId, seasonId, leagueSeasonId, teamSeasonId } = extractBigIntParams(
        req.params,
        'accountId',
        'seasonId',
        'leagueSeasonId',
        'teamSeasonId',
      );
      const { divisionSeasonId } = req.body;

      if (!divisionSeasonId) {
        res.status(400).json({
          success: false,
          message: 'DivisionSeasonId is required',
        });
        return;
      }

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId,
        },
      });
      if (!season) {
        res.status(404).json({ success: false, message: 'Season not found' });
        return;
      }

      // Verify the league season exists
      const leagueSeason = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId,
          seasonid: seasonId,
        },
      });
      if (!leagueSeason) {
        res.status(404).json({ success: false, message: 'League season not found' });
        return;
      }

      // Verify the division season exists and belongs to this league season
      const divisionSeason = await prisma.divisionseason.findFirst({
        where: {
          id: BigInt(divisionSeasonId),
          leagueseasonid: leagueSeasonId,
        },
      });
      if (!divisionSeason) {
        res.status(404).json({ success: false, message: 'Division season not found' });
        return;
      }

      // Verify the team season exists and belongs to this account and season
      const teamSeason = await validateTeamSeasonWithDivision(
        prisma,
        teamSeasonId,
        seasonId,
        accountId,
      );

      // Check if the team is currently assigned to a division
      if (teamSeason.divisionseasonid) {
        res.status(400).json({
          success: false,
          message: 'Team is already assigned to a division. Remove from current division first.',
        });
        return;
      }

      // Update the team season to assign it to the division
      await prisma.teamsseason.update({
        where: { id: teamSeasonId },
        data: { divisionseasonid: BigInt(divisionSeasonId) },
      });

      res.json({
        success: true,
        data: {
          message: 'Team assigned to division successfully',
        },
      });
    } catch (error) {
      console.error('Error assigning team to division:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId/teams/:teamSeasonId/remove-from-division
 * Remove a team from its current division (make it unassigned)
 */
router.delete(
  '/:leagueSeasonId/teams/:teamSeasonId/remove-from-division',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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
        res.status(404).json({ success: false, message: 'Season not found' });
        return;
      }

      // Verify the league season exists
      const leagueSeason = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId,
          seasonid: seasonId,
        },
      });
      if (!leagueSeason) {
        res.status(404).json({ success: false, message: 'League season not found' });
        return;
      }

      // Verify the team season exists and belongs to this account and season
      const teamSeason = await validateTeamSeasonWithDivision(
        prisma,
        teamSeasonId,
        seasonId,
        accountId,
      );

      // Check if the team is currently assigned to a division
      if (!teamSeason.divisionseasonid) {
        res.status(400).json({
          success: false,
          message: 'Team is not currently assigned to any division',
        });
        return;
      }

      // Update the team season to remove it from the division
      await prisma.teamsseason.update({
        where: { id: teamSeasonId },
        data: { divisionseasonid: null },
      });

      res.json({
        success: true,
        data: {
          message: `Team "${teamSeason.name}" has been removed from division "${teamSeason.divisionseason?.divisiondefs.name || 'Unknown Division'}"`,
        },
      });
    } catch (error) {
      console.error('Error removing team from division:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

export default router;
