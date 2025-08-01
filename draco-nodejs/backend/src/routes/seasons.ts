// Season Management Routes for Draco Sports Manager
// Handles season creation, copying, and current season management

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import prisma from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../utils/customErrors';
import { extractAccountParams, extractSeasonParams } from '../utils/paramExtraction';

// Type definitions for Prisma query results

interface LeagueSeasonWithLeague {
  id: bigint;
  seasonid: bigint;
  leagueid: bigint;
  league: {
    id: bigint;
    name: string;
  };
}

interface SeasonWithLeagues {
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
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * @swagger
 * /api/accounts/{accountId}/seasons:
 *   get:
 *     summary: Get all seasons for an account
 *     description: Retrieve all seasons for a specific account (requires account access)
 *     tags: [Seasons]
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
 *     responses:
 *       200:
 *         description: Seasons retrieved successfully
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
 *                     seasons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "456"
 *                           name:
 *                             type: string
 *                             example: "2024 Season"
 *                           accountId:
 *                             type: string
 *                             example: "123"
 *                           isCurrent:
 *                             type: boolean
 *                             example: true
 *                           leagues:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   example: "789"
 *                                 leagueId:
 *                                   type: string
 *                                   example: "101"
 *                                 leagueName:
 *                                   type: string
 *                                   example: "Major League"
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

    res.json({
      success: true,
      data: {
        seasons: seasons.map((season: SeasonWithLeagues) => ({
          id: season.id.toString(),
          name: season.name,
          accountId: season.accountid.toString(),
          isCurrent: currentSeason?.seasonid === season.id,
          leagues: season.leagueseason.map((ls) => ({
            id: ls.id.toString(),
            leagueId: ls.leagueid.toString(),
            leagueName: ls.league.name,
            ...(includeDivisions &&
              ls.divisionseason && {
                divisions: ls.divisionseason.map((ds) => ({
                  id: ds.id.toString(), // Use divisionSeason.id for filtering
                  divisionId: ds.divisiondefs?.id.toString(),
                  name: ds.divisiondefs?.name || 'Unknown Division',
                })),
              }),
          })),
        })),
      },
    });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/seasons/current:
 *   get:
 *     summary: Get current season for an account
 *     description: Retrieve the current season for a specific account
 *     tags: [Seasons]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *         example: "123"
 *     responses:
 *       200:
 *         description: Current season retrieved successfully
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
 *                     season:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "456"
 *                         name:
 *                           type: string
 *                           example: "2024 Season"
 *                         accountId:
 *                           type: string
 *                           example: "123"
 *                         isCurrent:
 *                           type: boolean
 *                           example: true
 *                         leagues:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "789"
 *                               leagueId:
 *                                 type: string
 *                                 example: "101"
 *                               leagueName:
 *                                 type: string
 *                                 example: "Major League"
 *       404:
 *         description: No current season found
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

    res.json({
      success: true,
      data: {
        season: {
          id: season.id.toString(),
          name: season.name,
          accountId: season.accountid.toString(),
          isCurrent: true,
          leagues: season.leagueseason.map((ls) => ({
            id: ls.id.toString(),
            leagueId: ls.leagueid.toString(),
            leagueName: ls.league.name,
          })),
        },
      },
    });
  }),
);

/**
 * @swagger
 * /api/accounts/{accountId}/seasons/{seasonId}:
 *   get:
 *     summary: Get specific season details
 *     description: Retrieve details for a specific season (requires account access)
 *     tags: [Seasons]
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
 *     responses:
 *       200:
 *         description: Season details retrieved successfully
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
 *                     season:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "456"
 *                         name:
 *                           type: string
 *                           example: "2024 Season"
 *                         accountId:
 *                           type: string
 *                           example: "123"
 *                         leagues:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "789"
 *                               leagueId:
 *                                 type: string
 *                                 example: "101"
 *                               leagueName:
 *                                 type: string
 *                                 example: "Major League"
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
 *         description: Season not found
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
router.get(
  '/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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

      res.json({
        success: true,
        data: {
          season: {
            id: season.id.toString(),
            name: season.name,
            accountId: season.accountid.toString(),
            isCurrent: currentSeason?.seasonid === season.id,
            leagues: season.leagueseason.map((ls) => ({
              id: ls.id.toString(),
              leagueId: ls.leagueid.toString(),
              leagueName: ls.league.name,
            })),
          },
        },
      });
    } catch (error) {
      console.error('Error getting season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * POST /api/accounts/:accountId/seasons
 * Create a new season (requires AccountAdmin or Administrator)
 */
router.post(
  '/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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

      res.status(201).json({
        success: true,
        data: {
          season: {
            id: newSeason.id.toString(),
            name: newSeason.name,
            accountId: newSeason.accountid.toString(),
            isCurrent: false,
            leagues: [],
          },
        },
      });
    } catch (error) {
      console.error('Error creating season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId
 * Update season name (requires AccountAdmin or Administrator)
 */
router.put(
  '/:seasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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

      res.json({
        success: true,
        data: {
          season: {
            id: updatedSeason.id.toString(),
            name: updatedSeason.name,
            accountId: updatedSeason.accountid.toString(),
          },
        },
      });
    } catch (error) {
      console.error('Error updating season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/copy
 * Copy a season (creates new season with same name + "Copy") (requires AccountAdmin or Administrator)
 */
router.post(
  '/:seasonId/copy',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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

      res.status(201).json({
        success: true,
        data: {
          season: {
            id: newSeason.id.toString(),
            name: newSeason.name,
            accountId: newSeason.accountid.toString(),
            isCurrent: false,
            leagues: copiedLeagueSeasons.map((ls: LeagueSeasonWithLeague) => ({
              id: ls.id.toString(),
              leagueId: ls.leagueid.toString(),
              leagueName: ls.league.name,
            })),
          },
          copiedLeagues: copiedLeagueSeasons.length,
        },
      });
    } catch (error) {
      console.error('Error copying season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/set-current
 * Set a season as the current season for an account (requires AccountAdmin or Administrator)
 */
router.post(
  '/:seasonId/set-current',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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

      res.json({
        success: true,
        data: {
          message: `Season "${season.name}" is now the current season`,
          seasonId: seasonId.toString(),
          accountId: accountId.toString(),
        },
      });
    } catch (error) {
      console.error('Error setting current season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
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
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
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

      res.json({
        success: true,
        data: {
          message: `Season "${season.name}" has been deleted`,
        },
      });
    } catch (error: unknown) {
      console.error('Error deleting season:', error);

      // Check if it's a foreign key constraint error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
        res.status(400).json({
          success: false,
          message:
            'Cannot delete season because it has related data (teams, games, etc.). Remove related data first.',
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

export default router;
