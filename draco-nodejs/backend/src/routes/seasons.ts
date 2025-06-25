// Season Management Routes for Draco Sports Manager
// Handles season creation, copying, and current season management

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
 * GET /api/accounts/:accountId/seasons
 * Get all seasons for an account (requires account access)
 */
router.get('/', 
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      
      const seasons = await prisma.season.findMany({
        where: {
          accountid: accountId
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
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'desc' // Most recent first
        }
      });

      // Get current season for this account
      const currentSeason = await prisma.currentseason.findUnique({
        where: {
          accountid: accountId
        },
        select: {
          seasonid: true
        }
      });

      res.json({
        success: true,
        data: {
          seasons: seasons.map((season: any) => ({
            id: season.id.toString(),
            name: season.name,
            accountId: season.accountid.toString(),
            isCurrent: currentSeason?.seasonid === season.id,
            leagues: season.leagueseason.map((ls: any) => ({
              id: ls.id.toString(),
              leagueId: ls.leagueid.toString(),
              leagueName: ls.league.name
            }))
          }))
        }
      });
    } catch (error) {
      console.error('Error getting seasons:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/accounts/:accountId/seasons/current
 * Get the current season for an account
 */
router.get('/current',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

      const currentSeason = await prisma.currentseason.findUnique({
        where: {
          accountid: accountId
        },
        select: {
          seasonid: true
        }
      });

      if (!currentSeason) {
        res.status(404).json({
          success: false,
          message: 'No current season set for this account'
        });
        return;
      }

      // Get the season details
      const season = await prisma.season.findUnique({
        where: {
          id: currentSeason.seasonid
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
                  name: true
                }
              }
            }
          }
        }
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Current season not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          season: {
            id: season.id.toString(),
            name: season.name,
            accountId: season.accountid.toString(),
            isCurrent: true,
            leagues: season.leagueseason.map((ls: any) => ({
              id: ls.id.toString(),
              leagueId: ls.leagueid.toString(),
              leagueName: ls.league.name
            }))
          }
        }
      });
    } catch (error) {
      console.error('Error getting current season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/accounts/:accountId/seasons/:seasonId
 * Get specific season details (requires account access)
 */
router.get('/:seasonId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);

      const season = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId
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
                  name: true
                }
              }
            }
          }
        }
      });

      if (!season) {
        res.status(404).json({
          success: false,
          message: 'Season not found'
        });
        return;
      }

      // Check if this is the current season
      const currentSeason = await prisma.currentseason.findUnique({
        where: {
          accountid: accountId
        },
        select: {
          seasonid: true
        }
      });

      res.json({
        success: true,
        data: {
          season: {
            id: season.id.toString(),
            name: season.name,
            accountId: season.accountid.toString(),
            isCurrent: currentSeason?.seasonid === season.id,
            leagues: season.leagueseason.map((ls: any) => ({
              id: ls.id.toString(),
              leagueId: ls.leagueid.toString(),
              leagueName: ls.league.name
            }))
          }
        }
      });
    } catch (error) {
      console.error('Error getting season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts/:accountId/seasons
 * Create a new season (requires AccountAdmin or Administrator)
 */
router.post('/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;
      const accountId = BigInt(req.params.accountId);

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Season name is required'
        });
        return;
      }

      // Check if season with this name already exists for this account
      const existingSeason = await prisma.season.findFirst({
        where: {
          name: name,
          accountid: accountId
        }
      });

      if (existingSeason) {
        res.status(409).json({
          success: false,
          message: 'A season with this name already exists for this account'
        });
        return;
      }

      const newSeason = await prisma.season.create({
        data: {
          name: name,
          accountid: accountId
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
          season: {
            id: newSeason.id.toString(),
            name: newSeason.name,
            accountId: newSeason.accountid.toString(),
            isCurrent: false,
            leagues: []
          }
        }
      });
    } catch (error) {
      console.error('Error creating season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * PUT /api/accounts/:accountId/seasons/:seasonId
 * Update season name (requires AccountAdmin or Administrator)
 */
router.put('/:seasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);
      const { name } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Season name is required'
        });
        return;
      }

      // Check if season exists and belongs to this account
      const existingSeason = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId
        }
      });

      if (!existingSeason) {
        res.status(404).json({
          success: false,
          message: 'Season not found'
        });
        return;
      }

      // Check if another season with this name already exists for this account
      const duplicateSeason = await prisma.season.findFirst({
        where: {
          name: name,
          accountid: accountId,
          id: { not: seasonId }
        }
      });

      if (duplicateSeason) {
        res.status(409).json({
          success: false,
          message: 'A season with this name already exists for this account'
        });
        return;
      }

      const updatedSeason = await prisma.season.update({
        where: {
          id: seasonId
        },
        data: {
          name: name
        },
        select: {
          id: true,
          name: true,
          accountid: true
        }
      });

      res.json({
        success: true,
        data: {
          season: {
            id: updatedSeason.id.toString(),
            name: updatedSeason.name,
            accountId: updatedSeason.accountid.toString()
          }
        }
      });
    } catch (error) {
      console.error('Error updating season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/copy
 * Copy a season (creates new season with same name + "Copy") (requires AccountAdmin or Administrator)
 */
router.post('/:seasonId/copy',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);

      // Get the source season
      const sourceSeason = await prisma.season.findFirst({
        where: {
          id: seasonId,
          accountid: accountId
        },
        include: {
          leagueseason: {
            include: {
              league: true
            }
          }
        }
      });

      if (!sourceSeason) {
        res.status(404).json({
          success: false,
          message: 'Source season not found'
        });
        return;
      }

      // Generate new season name
      const newSeasonName = `${sourceSeason.name} Copy`;

      // Check if copy name already exists
      const existingCopy = await prisma.season.findFirst({
        where: {
          name: newSeasonName,
          accountid: accountId
        }
      });

      if (existingCopy) {
        res.status(409).json({
          success: false,
          message: 'A season with this copy name already exists'
        });
        return;
      }

      // Create new season
      const newSeason = await prisma.season.create({
        data: {
          name: newSeasonName,
          accountid: accountId
        },
        select: {
          id: true,
          name: true,
          accountid: true
        }
      });

      // Copy league seasons (without teams/divisions for now)
      const copiedLeagueSeasons = [];
      for (const leagueSeason of sourceSeason.leagueseason) {
        const newLeagueSeason = await prisma.leagueseason.create({
          data: {
            seasonid: newSeason.id,
            leagueid: leagueSeason.leagueid
          },
          select: {
            id: true,
            seasonid: true,
            leagueid: true,
            league: {
              select: {
                id: true,
                name: true
              }
            }
          }
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
            leagues: copiedLeagueSeasons.map((ls: any) => ({
              id: ls.id.toString(),
              leagueId: ls.leagueid.toString(),
              leagueName: ls.league.name
            }))
          },
          copiedLeagues: copiedLeagueSeasons.length
        }
      });
    } catch (error) {
      console.error('Error copying season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/accounts/:accountId/seasons/:seasonId/set-current
 * Set a season as the current season for an account (requires AccountAdmin or Administrator)
 */
router.post('/:seasonId/set-current',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);

      // Check if season exists and belongs to this account
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

      // Use upsert to either create or update the current season
      await prisma.currentseason.upsert({
        where: {
          accountid: accountId
        },
        update: {
          seasonid: seasonId
        },
        create: {
          accountid: accountId,
          seasonid: seasonId
        }
      });

      res.json({
        success: true,
        data: {
          message: `Season "${season.name}" is now the current season`,
          seasonId: seasonId.toString(),
          accountId: accountId.toString()
        }
      });
    } catch (error) {
      console.error('Error setting current season:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/accounts/:accountId/seasons/:seasonId
 * Delete a season (requires AccountAdmin or Administrator)
 * Note: This will fail if the season has any related data
 */
router.delete('/:seasonId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const seasonId = BigInt(req.params.seasonId);
      const accountId = BigInt(req.params.accountId);

      // Check if season exists and belongs to this account
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

      // Check if this is the current season
      const currentSeason = await prisma.currentseason.findUnique({
        where: {
          accountid: accountId
        }
      });

      if (currentSeason && currentSeason.seasonid === seasonId) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete the current season. Set a different season as current first.'
        });
        return;
      }

      // Delete the season (this will cascade to related data)
      await prisma.season.delete({
        where: {
          id: seasonId
        }
      });

      res.json({
        success: true,
        data: {
          message: `Season "${season.name}" has been deleted`
        }
      });
    } catch (error: any) {
      console.error('Error deleting season:', error);
      
      // Check if it's a foreign key constraint error
      if (error.code === 'P2003') {
        res.status(400).json({
          success: false,
          message: 'Cannot delete season because it has related data (teams, games, etc.). Remove related data first.'
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