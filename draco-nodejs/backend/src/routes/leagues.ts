// League Management Routes for Draco Sports Manager
// Handles league CRUD operations and provides available leagues for account management

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { RouteProtection } from '../middleware/routeProtection.js';
import { RoleService } from '../services/roleService.js';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/customErrors.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';

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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

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
  }),
);

/**
 * GET /api/accounts/:accountId/leagues/all-time
 * Get unique leagues for all-time statistics (public endpoint)
 */
router.get(
  '/all-time',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    // Get unique leagues that have been used in seasons
    const leaguesWithSeasons = await prisma.league.findMany({
      where: {
        accountid: accountId,
        leagueseason: {
          some: {}, // League must have at least one season
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: leaguesWithSeasons.map((league) => ({
        id: league.id.toString(), // This is league.id for all-time queries
        name: league.name,
      })),
    });
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueId } = extractBigIntParams(req.params, 'accountId', 'leagueId');

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
      throw new NotFoundError('League not found');
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
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    const { accountId } = extractAccountParams(req.params);

    if (!name) {
      throw new ValidationError('League name is required');
    }

    // Check if league with this name already exists for this account
    const existingLeague = await prisma.league.findFirst({
      where: {
        name: name,
        accountid: accountId,
      },
    });

    if (existingLeague) {
      throw new ConflictError('A league with this name already exists for this account');
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
  }),
);

/**
 * PUT /api/accounts/:accountId/leagues/:leagueId
 * Update league name (requires AccountAdmin or Administrator)
 */
router.put(
  '/:leagueId',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueId } = extractBigIntParams(req.params, 'accountId', 'leagueId');
    const { name } = req.body;

    if (!name) {
      throw new ValidationError('League name is required');
    }

    // Check if league exists and belongs to this account
    const existingLeague = await prisma.league.findFirst({
      where: {
        id: leagueId,
        accountid: accountId,
      },
    });

    if (!existingLeague) {
      throw new NotFoundError('League not found');
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
      throw new ConflictError('A league with this name already exists for this account');
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
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, leagueId } = extractBigIntParams(req.params, 'accountId', 'leagueId');

    // Check if league exists and belongs to this account
    const league = await prisma.league.findFirst({
      where: {
        id: leagueId,
        accountid: accountId,
      },
    });

    if (!league) {
      throw new NotFoundError('League not found');
    }

    // Check if there are any related records that would prevent deletion
    const hasRelatedData = await prisma.leagueseason.findFirst({
      where: {
        leagueid: leagueId,
      },
    });

    if (hasRelatedData) {
      throw new ValidationError(
        'Cannot delete league because it is associated with seasons. Remove league from seasons first.',
      );
    }

    // Delete the league - if Prisma P2003 error occurs, it will be handled by global error handler
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
  }),
);

export default router;
