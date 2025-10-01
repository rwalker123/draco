// League Management Routes for Draco Sports Manager
// Handles league CRUD operations and provides available leagues for account management

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/customErrors.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { LeagueType, UpsertLeagueSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();

/**
 * GET /api/accounts/:accountId/leagues
 * Returns all leagues for the specified account (requires authentication).
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

    const result: LeagueType[] = leagues.map((league) => ({
      id: league.id.toString(),
      name: league.name,
      accountId: league.accountid.toString(),
    }));

    res.json(result);
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

    const result: LeagueType[] = leaguesWithSeasons.map((league) => ({
      id: league.id.toString(), // This is league.id for all-time queries
      name: league.name,
      accountId: accountId.toString(),
    }));

    res.json(result);
  }),
);

/**
 * GET /api/accounts/:accountId/leagues/:leagueId
 * Retrieves details for a single league within the account.
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

    const result: LeagueType = {
      id: league.id.toString(),
      name: league.name,
      accountId: league.accountid.toString(),
    };

    res.json(result);
  }),
);

/**
 * POST /api/accounts/:accountId/leagues
 * Creates a new league for the account (requires account admin privileges).
 */
router.post(
  '/',
  authenticateToken,
  routeProtection.requireAccountAdmin(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);

    const input = UpsertLeagueSchema.parse(req.body);

    const { name } = input;

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

    const result: LeagueType = {
      id: newLeague.id.toString(),
      name: newLeague.name,
      accountId: newLeague.accountid.toString(),
    };

    res.status(201).json(result);
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

    const input = UpsertLeagueSchema.parse(req.body);

    const { name } = input;

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

    const result: LeagueType = {
      id: updatedLeague.id.toString(),
      name: updatedLeague.name,
      accountId: updatedLeague.accountid.toString(),
    };

    res.json(result);
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

    res.json(true);
  }),
);

export default router;
