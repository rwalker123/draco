// Season Management Routes for Draco Sports Manager
// Handles season creation, copying, and current season management

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { NotFoundError } from '../utils/customErrors.js';
import { extractAccountParams, extractSeasonParams } from '../utils/paramExtraction.js';
import {
  LeagueSeasonWithDivisionType,
  SeasonParticipantCountDataType,
  SeasonType,
} from '@draco/shared-schemas';

// Type definitions for Prisma query results

interface dbLeagueSeasonWithLeague {
  id: bigint;
  seasonid: bigint;
  leagueid: bigint;
  league: {
    id: bigint;
    name: string;
  };
}

interface dbSeasonWithLeagues {
  id: bigint;
  name: string;
  accountid: bigint;
  leagueseason: Array<{
    id: bigint;
    leagueid: bigint;
    league: {
      id: bigint;
      name: string;
    };
    divisionseason?: Array<{
      id: bigint;
      priority?: number;
      leagueseasonid?: bigint;
      divisionid?: bigint;
      divisiondefs?: {
        id: bigint;
        name: string;
      };
    }>;
  }>;
}

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();

/**
 * GET /api/accounts/:accountId/seasons
 * Lists seasons for the account, including league associations.
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const includeDivisions = req.query.includeDivisions === 'true';

    const seasons = await prisma.season.findMany({
      where: {
        accountid: accountId,
      },
      select: {
        id: true,
        name: true,
        accountid: true,
        leagueseason: {
          select: {
            id: true,
            leagueid: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
            ...(includeDivisions && {
              divisionseason: {
                select: {
                  id: true,
                  divisiondefs: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            }),
          },
        },
      },
      orderBy: {
        name: 'desc', // Most recent first
      },
    });

    // Get current season for this account
    const currentSeason = await prisma.currentseason.findUnique({
      where: {
        accountid: accountId,
      },
      select: {
        seasonid: true,
      },
    });

    const result: LeagueSeasonWithDivisionType[] = seasons.map((season: dbSeasonWithLeagues) => ({
      id: season.id.toString(),
      name: season.name,
      accountId: season.accountid.toString(),
      isCurrent: currentSeason?.seasonid === season.id,
      leagues: season.leagueseason.map((ls) => ({
        id: ls.id.toString(),
        league: { id: ls.leagueid.toString(), name: ls.league.name },
        ...(includeDivisions &&
          ls.divisionseason && {
            divisions: ls.divisionseason.map((ds) => ({
              id: ds.id.toString(), // Use divisionSeason.id for filtering
              division: {
                id: ds.divisiondefs?.id.toString() || '0',
                name: ds.divisiondefs?.name || 'Unknown Division',
              },
              priority: ds.priority || 0,
            })),
          }),
      })),
    }));

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/current
 * Returns the account's current season and its league assignments.
 */
router.get(
  '/current',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const currentSeason = await prisma.currentseason.findUnique({
      where: {
        accountid: accountId,
      },
      select: {
        seasonid: true,
      },
    });

    if (!currentSeason) {
      throw new NotFoundError('No current season set for this account');
    }

    // Get the season details
    const season = await prisma.season.findUnique({
      where: {
        id: currentSeason.seasonid,
      },
      select: {
        id: true,
        name: true,
        accountid: true,
        leagueseason: {
          select: {
            id: true,
            leagueid: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!season) {
      throw new NotFoundError('Current season not found');
    }

    const result: LeagueSeasonWithDivisionType = {
      id: season.id.toString(),
      name: season.name,
      accountId: season.accountid.toString(),
      isCurrent: true,
      leagues: season.leagueseason.map((ls) => ({
        id: ls.id.toString(),
        league: { id: ls.leagueid.toString(), name: ls.league.name },
      })),
    };

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId
 * Retrieves details for a specific season within the account context.
 */
router.get(
  '/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
      select: {
        id: true,
        name: true,
        accountid: true,
        leagueseason: {
          select: {
            id: true,
            leagueid: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!season) {
      res.status(404).json({
        success: false,
        message: 'Season not found',
      });
      return;
    }

    // Check if this is the current season
    const currentSeason = await prisma.currentseason.findUnique({
      where: {
        accountid: accountId,
      },
      select: {
        seasonid: true,
      },
    });

    const result: LeagueSeasonWithDivisionType = {
      id: season.id.toString(),
      name: season.name,
      accountId: season.accountid.toString(),
      isCurrent: currentSeason?.seasonid === season.id,
      leagues: season.leagueseason.map((ls) => ({
        id: ls.id.toString(),
        league: { id: ls.leagueid.toString(), name: ls.league.name },
      })),
    };

    res.json(result);
  }),
);

/**
 * POST /api/accounts/:accountId/seasons
 * Create a new season (requires AccountAdmin or Administrator)
 */
router.post(
  '/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { name } = req.body;
    const { accountId } = extractAccountParams(req.params);

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Season name is required',
      });
      return;
    }

    // Check if season with this name already exists for this account
    const existingSeason = await prisma.season.findFirst({
      where: {
        name: name,
        accountid: accountId,
      },
    });

    if (existingSeason) {
      res.status(409).json({
        success: false,
        message: 'A season with this name already exists for this account',
      });
      return;
    }

    const newSeason = await prisma.season.create({
      data: {
        name: name,
        accountid: accountId,
      },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });

    const result: LeagueSeasonWithDivisionType = {
      id: newSeason.id.toString(),
      name: newSeason.name,
      accountId: newSeason.accountid.toString(),
      isCurrent: false,
      leagues: [],
    };

    res.status(201).json(result);
  }),
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId
 * Update season name (requires AccountAdmin or Administrator)
 */
router.put(
  '/:seasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Season name is required',
      });
      return;
    }

    // Check if season exists and belongs to this account
    const existingSeason = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!existingSeason) {
      res.status(404).json({
        success: false,
        message: 'Season not found',
      });
      return;
    }

    // Check if another season with this name already exists for this account
    const duplicateSeason = await prisma.season.findFirst({
      where: {
        name: name,
        accountid: accountId,
        id: { not: seasonId },
      },
    });

    if (duplicateSeason) {
      res.status(409).json({
        success: false,
        message: 'A season with this name already exists for this account',
      });
      return;
    }

    const updatedSeason = await prisma.season.update({
      where: {
        id: seasonId,
      },
      data: {
        name: name,
      },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });

    const result: SeasonType = {
      id: updatedSeason.id.toString(),
      name: updatedSeason.name,
      accountId: updatedSeason.accountid.toString(),
    };

    res.json(result);
  }),
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/copy
 * Copy a season (creates new season with same name + "Copy") (requires AccountAdmin or Administrator)
 */
router.post(
  '/:seasonId/copy',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    // Get the source season
    const sourceSeason = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
      include: {
        leagueseason: {
          include: {
            league: true,
          },
        },
      },
    });

    if (!sourceSeason) {
      res.status(404).json({
        success: false,
        message: 'Source season not found',
      });
      return;
    }

    // Generate new season name
    const newSeasonName = `${sourceSeason.name} Copy`;

    // Check if copy name already exists
    const existingCopy = await prisma.season.findFirst({
      where: {
        name: newSeasonName,
        accountid: accountId,
      },
    });

    if (existingCopy) {
      res.status(409).json({
        success: false,
        message: 'A season with this copy name already exists',
      });
      return;
    }

    // Create new season
    const newSeason = await prisma.season.create({
      data: {
        name: newSeasonName,
        accountid: accountId,
      },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });

    // Copy league seasons (without teams/divisions for now)
    const copiedLeagueSeasons = [];
    for (const leagueSeason of sourceSeason.leagueseason) {
      const newLeagueSeason = await prisma.leagueseason.create({
        data: {
          seasonid: newSeason.id,
          leagueid: leagueSeason.leagueid,
        },
        select: {
          id: true,
          seasonid: true,
          leagueid: true,
          league: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      copiedLeagueSeasons.push(newLeagueSeason);
    }

    const result: LeagueSeasonWithDivisionType = {
      id: newSeason.id.toString(),
      name: newSeason.name,
      accountId: newSeason.accountid.toString(),
      isCurrent: false,
      leagues: copiedLeagueSeasons.map((ls: dbLeagueSeasonWithLeague) => ({
        id: ls.id.toString(),
        league: { id: ls.leagueid.toString(), name: ls.league.name },
      })),
    };

    res.status(201).json(result);
  }),
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/set-current
 * Set a season as the current season for an account (requires AccountAdmin or Administrator)
 */
router.post(
  '/:seasonId/set-current',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    // Check if season exists and belongs to this account
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

    // Use upsert to either create or update the current season
    await prisma.currentseason.upsert({
      where: {
        accountid: accountId,
      },
      update: {
        seasonid: seasonId,
      },
      create: {
        accountid: accountId,
        seasonid: seasonId,
      },
    });

    const result: SeasonType = {
      id: seasonId.toString(),
      accountId: accountId.toString(),
      isCurrent: true,
      name: season.name,
    };

    res.json(result);
  }),
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId
 * Delete a season (requires AccountAdmin or Administrator)
 * Note: This will fail if the season has any related data
 */
router.delete(
  '/:seasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    // Check if season exists and belongs to this account
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

    // Check if this is the current season
    const currentSeason = await prisma.currentseason.findUnique({
      where: {
        accountid: accountId,
      },
    });

    if (currentSeason && currentSeason.seasonid === seasonId) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete the current season. Set a different season as current first.',
      });
      return;
    }

    // Delete the season (this will cascade to related data)
    await prisma.season.delete({
      where: {
        id: seasonId,
      },
    });

    res.json(true);
  }),
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/participants/count
 * Get the count of participants (contacts) in a season
 */
router.get(
  '/:seasonId/participants/count',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId } = extractSeasonParams(req.params);

    // Verify season exists and belongs to account
    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    // Count distinct participants (contacts) in the season
    // Participants are contacts who have roster entries for teams in this season
    const participantCount = await prisma.contacts.count({
      where: {
        roster: {
          rosterseason: {
            some: {
              teamsseason: {
                leagueseason: {
                  seasonid: seasonId,
                },
              },
            },
          },
        },
        creatoraccountid: accountId, // Ensure account boundary
      },
    });

    const result: SeasonParticipantCountDataType = {
      seasonId: seasonId.toString(),
      participantCount,
    };

    res.json(result);
  }),
);

export default router;
