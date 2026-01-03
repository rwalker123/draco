import { Router, Request, Response, NextFunction } from 'express';
import contentDisposition from 'content-disposition';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';
import prisma from '../lib/prisma.js';
import { NotFoundError } from '../utils/customErrors.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const csvExportService = ServiceFactory.getCsvExportService();

router.get(
  '/leagues/:leagueSeasonId/roster/export',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('manage-users'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
    );

    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
        league: { accountid: accountId },
      },
      include: { league: true },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    const result = await csvExportService.exportLeagueRoster(
      leagueSeasonId,
      seasonId,
      leagueSeason.league.name,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      contentDisposition(result.fileName, { type: 'attachment' }),
    );
    res.send(result.buffer);
  }),
);

router.get(
  '/leagues/:leagueSeasonId/managers/export',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('manage-users'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, leagueSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'leagueSeasonId',
    );

    const leagueSeason = await prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
        seasonid: seasonId,
        league: { accountid: accountId },
      },
      include: { league: true },
    });

    if (!leagueSeason) {
      throw new NotFoundError('League season not found');
    }

    const result = await csvExportService.exportLeagueManagers(
      leagueSeasonId,
      leagueSeason.league.name,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      contentDisposition(result.fileName, { type: 'attachment' }),
    );
    res.send(result.buffer);
  }),
);

router.get(
  '/roster/export',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('manage-users'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');

    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    const result = await csvExportService.exportSeasonRoster(seasonId, accountId, season.name);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      contentDisposition(result.fileName, { type: 'attachment' }),
    );
    res.send(result.buffer);
  }),
);

router.get(
  '/managers/export',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('manage-users'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId } = extractBigIntParams(req.params, 'accountId', 'seasonId');

    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        accountid: accountId,
      },
    });

    if (!season) {
      throw new NotFoundError('Season not found');
    }

    const result = await csvExportService.exportSeasonManagers(seasonId, accountId, season.name);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      contentDisposition(result.fileName, { type: 'attachment' }),
    );
    res.send(result.buffer);
  }),
);

export default router;
