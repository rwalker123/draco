// League Season Management Routes for Draco Sports Manager
// Handles adding/removing leagues to/from seasons

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import { PrismaClient } from '@prisma/client';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues
 * Get all leagues for a specific season (requires account access)
 */
router.get('/', 
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId
        }
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found'
        });
        return;
      }

      const leagueSeasons = await prisma.leagueseason.findMany({
        where: {
          seasonid: seasonId
        },
        include: {
          league: {
            select: {
              id: true,
              name: true,
              accountid: true
            }
          }
        },
        orderBy: {
          league: {
            name: 'asc'
          }
        }
      });

      res.json({
        success: true,
        data: {
          seasonId: seasonId.toString(),
          seasonName: season.name,
          leagues: leagueSeasons.map((ls: any) => ({
            id: ls.id.toString(),
            leagueId: ls.leagueid.toString(),
            leagueName: ls.league.name,
            accountId: ls.league.accountid.toString()
          }))
        }
      });
    } catch (error) {
      console.error('Error getting league seasons:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId
 * Get specific league season details (requires account access)
 */
router.get('/:leagueSeasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const leagueSeasonId = BigInt(req.params.leagueSeasonId);

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId
        }
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found'
        });
        return;
      }

      const leagueSeason = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId,
          seasonid: seasonId
        },
        include: {
          league: {
            select: {
              id: true,
              name: true,
              accountid: true
            }
          }
        }
      });

      if (!leagueSeason) {
        res.status(404).json({
          success: false,
          message: 'League season not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          leagueSeason: {
            id: leagueSeason.id.toString(),
            seasonId: seasonId.toString(),
            seasonName: season.name,
            leagueId: leagueSeason.leagueid.toString(),
            leagueName: leagueSeason.league.name,
            accountId: leagueSeason.league.accountid.toString()
          }
        }
      });
    } catch (error) {
      console.error('Error getting league season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/leagues
 * Add a league to a season (requires AccountAdmin or Administrator)
 */
router.post('/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const { leagueId } = req.body;

      if (!leagueId) {
        res.status(400).json({
          success: false,
          message: 'League ID is required'
        });
        return;
      }

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId
        }
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found'
        });
        return;
      }

      // Verify the league exists and belongs to this account
      const league = await prisma.league.findFirst({
        where: {
          id: BigInt(leagueId),
          accountid: accountId
        }
      });

      if (!league) {
        res.status(404).json({
          success: false,
          message: 'League not found'
        });
        return;
      }

      // Check if this league is already added to this season
      const existingLeagueSeason = await prisma.leagueseason.findFirst({
        where: {
          seasonid: seasonId,
          leagueid: BigInt(leagueId)
        }
      });

      if (existingLeagueSeason) {
        res.status(409).json({
          success: false,
          message: 'This league is already added to this season'
        });
        return;
      }

      // Add the league to the season
      const newLeagueSeason = await prisma.leagueseason.create({
        data: {
          seasonid: seasonId,
          leagueid: BigInt(leagueId)
        }
      });

      // Get the league details separately
      const leagueDetails = await prisma.league.findUnique({
        where: {
          id: BigInt(leagueId)
        },
        select: {
          id: true,
          name: true,
          accountid: true
        }
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
            accountId: leagueDetails!.accountid.toString()
          },
          message: `League "${leagueDetails!.name}" has been added to season "${season.name}"`
        }
      });
    } catch (error: any) {
      console.error('Error adding league to season:', error);
      
      // Check if it's a unique constraint violation
      if (error.code === 'P2002') {
        res.status(409).json({
          success: false,
          message: 'This league is already added to this season'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId/leagues/:leagueSeasonId
 * Remove a league from a season (requires AccountAdmin or Administrator)
 */
router.delete('/:leagueSeasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const leagueSeasonId = BigInt(req.params.leagueSeasonId);

      // Verify the season belongs to this account
      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId
        }
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found'
        });
        return;
      }

      // Get the league season with league details
      const leagueSeason = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId,
          seasonid: seasonId
        },
        include: {
          league: {
            select: {
              id: true,
              name: true,
              accountid: true
            }
          }
        }
      });

      if (!leagueSeason) {
        res.status(404).json({
          success: false,
          message: 'League season not found'
        });
        return;
      }

      // Verify the league belongs to this account
      if (leagueSeason.league.accountid !== accountId) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      // Check if there are any related records that would prevent deletion
      const hasRelatedData = await prisma.leagueseason.findFirst({
        where: {
          id: leagueSeasonId
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
              teamsseason: true
            }
          }
        }
      });

      if (hasRelatedData && (
        hasRelatedData._count.divisionseason > 0 ||
        hasRelatedData._count.gameejections > 0 ||
        hasRelatedData._count.golfmatch > 0 ||
        hasRelatedData._count.leagueevents > 0 ||
        hasRelatedData._count.leagueschedule > 0 ||
        hasRelatedData._count.playoffsetup > 0 ||
        hasRelatedData._count.teamsseason > 0
      )) {
        res.status(400).json({
          success: false,
          message: 'Cannot remove league from season because it has related data (divisions, games, teams, etc.). Remove related data first.'
        });
        return;
      }

      // Remove the league from the season
      await prisma.leagueseason.delete({
        where: {
          id: leagueSeasonId
        }
      });

      res.json({
        success: true,
        data: {
          message: `League "${leagueSeason.league.name}" has been removed from season "${season.name}"`
        }
      });
    } catch (error: any) {
      console.error('Error removing league from season:', error);
      
      // Check if it's a foreign key constraint error
      if (error.code === 'P2003') {
        res.status(400).json({
          success: false,
          message: 'Cannot remove league from season because it has related data. Remove related data first.'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

export default router; 