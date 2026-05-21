import { Router, Request, Response, NextFunction } from 'express';
import contentDisposition from 'content-disposition';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const csvExportService = ServiceFactory.getCsvExportService();

router.get(
  '/teams/:teamSeasonId/roster/waivers/export',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('manage-users'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
    );

    const result = await csvExportService.exportTeamWaivers(accountId, seasonId, teamSeasonId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      contentDisposition(result.fileName, { type: 'attachment' }),
    );
    res.send(result.buffer);
  }),
);

router.get(
  '/leagues/:leagueSeasonId/roster/waivers/export',
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

    const result = await csvExportService.exportLeagueWaivers(accountId, seasonId, leagueSeasonId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      contentDisposition(result.fileName, { type: 'attachment' }),
    );
    res.send(result.buffer);
  }),
);

router.get(
  '/teams/:teamSeasonId/roster/waivers/missing/export',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('manage-users'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractBigIntParams(
      req.params,
      'accountId',
      'seasonId',
      'teamSeasonId',
    );

    const result = await csvExportService.exportTeamMissingWaivers(
      accountId,
      seasonId,
      teamSeasonId,
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
  '/leagues/:leagueSeasonId/roster/waivers/missing/export',
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

    const result = await csvExportService.exportLeagueMissingWaivers(
      accountId,
      seasonId,
      leagueSeasonId,
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

    const result = await csvExportService.exportLeagueRoster(accountId, seasonId, leagueSeasonId);

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

    const result = await csvExportService.exportLeagueManagers(accountId, seasonId, leagueSeasonId);

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

    const result = await csvExportService.exportSeasonRoster(accountId, seasonId);

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

    const result = await csvExportService.exportSeasonManagers(accountId, seasonId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      contentDisposition(result.fileName, { type: 'attachment' }),
    );
    res.send(result.buffer);
  }),
);

export default router;
