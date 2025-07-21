// League Management Routes for Draco Sports Manager
// Handles league CRUD operations and provides available leagues for account management

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { RouteProtection } from '../middleware/routeProtection';
import { RoleService } from '../services/roleService';
import prisma from '../lib/prisma';

// Type definitions for Prisma query results
interface League {
  id: bigint;
  name: string;
  accountid: bigint;
}

const router = Router({ mergeParams: true });
const roleService = new RoleService(prisma);
const routeProtection = new RouteProtection(roleService, prisma);

/**
 * @swagger
 * /api/accounts/{accountId}/leagues:
 *   get:
 *     summary: Get all leagues for an account
 *     description: Retrieve all leagues for a specific account (requires account access)
 *     tags: [Leagues]
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
 *         description: Leagues retrieved successfully
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
 *                     leagues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "101"
 *                           name:
 *                             type: string
 *                             example: "Major League"
 *                           accountId:
 *                             type: string
 *                             example: "123"
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
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);

      const leagues = await prisma.league.findMany({
        where: {
          accountid: accountId,
        },
        select: {
          id: true,
          name: true,
          accountid: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({
        success: true,
        data: {
          leagues: leagues.map((league: League) => ({
            id: league.id.toString(),
            name: league.name,
            accountId: league.accountid.toString(),
          })),
        },
      });
    } catch (error) {
      console.error('Error getting leagues:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * @swagger
 * /api/accounts/{accountId}/leagues/{leagueId}:
 *   get:
 *     summary: Get specific league details
 *     description: Retrieve details for a specific league (requires account access)
 *     tags: [Leagues]
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
 *         name: leagueId
 *         required: true
 *         schema:
 *           type: string
 *         description: League ID
 *         example: "101"
 *     responses:
 *       200:
 *         description: League details retrieved successfully
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
 *                     league:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "101"
 *                         name:
 *                           type: string
 *                           example: "Major League"
 *                         accountId:
 *                           type: string
 *                           example: "123"
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
 *         description: League not found
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
  '/:leagueId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const leagueId = BigInt(req.params.leagueId);
      const accountId = BigInt(req.params.accountId);

      const league = await prisma.league.findFirst({
        where: {
          id: leagueId,
          accountid: accountId,
        },
        select: {
          id: true,
          name: true,
          accountid: true,
        },
      });

      if (!league) {
        res.status(404).json({
          success: false,
          message: 'League not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          league: {
            id: league.id.toString(),
            name: league.name,
            accountId: league.accountid.toString(),
          },
        },
      });
    } catch (error) {
      console.error('Error getting league:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * @swagger
 * /api/accounts/{accountId}/leagues:
 *   post:
 *     summary: Create a new league
 *     description: Create a new league for an account (requires AccountAdmin or Administrator)
 *     tags: [Leagues]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: League name
 *                 example: "Minor League"
 *     responses:
 *       201:
 *         description: League created successfully
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
 *                     league:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "102"
 *                         name:
 *                           type: string
 *                           example: "Minor League"
 *                         accountId:
 *                           type: string
 *                           example: "123"
 *       400:
 *         description: Missing league name
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
 *         description: Forbidden - requires AccountAdmin or Administrator
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: League with this name already exists
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
router.post(
  '/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;
      const accountId = BigInt(req.params.accountId);

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'League name is required',
        });
        return;
      }

      // Check if league with this name already exists for this account
      const existingLeague = await prisma.league.findFirst({
        where: {
          name: name,
          accountid: accountId,
        },
      });

      if (existingLeague) {
        res.status(409).json({
          success: false,
          message: 'A league with this name already exists for this account',
        });
        return;
      }

      const newLeague = await prisma.league.create({
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
          league: {
            id: newLeague.id.toString(),
            name: newLeague.name,
            accountId: newLeague.accountid.toString(),
          },
        },
      });
    } catch (error) {
      console.error('Error creating league:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * PUT /api/accounts/:accountId/leagues/:leagueId
 * Update league name (requires AccountAdmin or Administrator)
 */
router.put(
  '/:leagueId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const leagueId = BigInt(req.params.leagueId);
      const accountId = BigInt(req.params.accountId);
      const { name } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'League name is required',
        });
        return;
      }

      // Check if league exists and belongs to this account
      const existingLeague = await prisma.league.findFirst({
        where: {
          id: leagueId,
          accountid: accountId,
        },
      });

      if (!existingLeague) {
        res.status(404).json({
          success: false,
          message: 'League not found',
        });
        return;
      }

      // Check if another league with this name already exists for this account
      const duplicateLeague = await prisma.league.findFirst({
        where: {
          name: name,
          accountid: accountId,
          id: { not: leagueId },
        },
      });

      if (duplicateLeague) {
        res.status(409).json({
          success: false,
          message: 'A league with this name already exists for this account',
        });
        return;
      }

      const updatedLeague = await prisma.league.update({
        where: {
          id: leagueId,
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
          league: {
            id: updatedLeague.id.toString(),
            name: updatedLeague.name,
            accountId: updatedLeague.accountid.toString(),
          },
        },
      });
    } catch (error) {
      console.error('Error updating league:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);

/**
 * DELETE /api/accounts/:accountId/leagues/:leagueId
 * Delete a league (requires AccountAdmin or Administrator)
 * Note: This will fail if the league has any related data
 */
router.delete(
  '/:leagueId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const leagueId = BigInt(req.params.leagueId);
      const accountId = BigInt(req.params.accountId);

      // Check if league exists and belongs to this account
      const league = await prisma.league.findFirst({
        where: {
          id: leagueId,
          accountid: accountId,
        },
      });

      if (!league) {
        res.status(404).json({
          success: false,
          message: 'League not found',
        });
        return;
      }

      // Check if there are any related records that would prevent deletion
      const hasRelatedData = await prisma.leagueseason.findFirst({
        where: {
          leagueid: leagueId,
        },
      });

      if (hasRelatedData) {
        res.status(400).json({
          success: false,
          message:
            'Cannot delete league because it is associated with seasons. Remove league from seasons first.',
        });
        return;
      }

      // Delete the league
      await prisma.league.delete({
        where: {
          id: leagueId,
        },
      });

      res.json({
        success: true,
        data: {
          message: `League "${league.name}" has been deleted`,
        },
      });
    } catch (error: unknown) {
      console.error('Error deleting league:', error);

      // Check if it's a foreign key constraint error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
        res.status(400).json({
          success: false,
          message: 'Cannot delete league because it has related data. Remove related data first.',
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
 * GET /api/accounts/:accountId/leagues/:leagueId/divisions
 * Get divisions for a specific league (public endpoint for statistics)
 */
router.get(
  '/:leagueId/divisions',
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const accountId = BigInt(req.params.accountId);
      const leagueId = BigInt(req.params.leagueId);

      // Get divisions that are active in this specific league
      const divisionSeasons = await prisma.divisionseason.findMany({
        where: {
          leagueseason: {
            leagueid: leagueId,
            league: {
              accountid: accountId,
            },
          },
        },
        include: {
          divisiondefs: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          divisiondefs: {
            name: 'asc',
          },
        },
      });

      const divisions = divisionSeasons.map((ds) => ({
        id: ds.divisiondefs.id,
        name: ds.divisiondefs.name,
      }));

      res.json({
        success: true,
        data: divisions.map((division: { id: bigint; name: string }) => ({
          ...division,
          id: division.id.toString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching divisions for league:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch divisions',
      });
    }
  },
);

export default router;
