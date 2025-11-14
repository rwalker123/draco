import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { UpsertWelcomeMessageSchema } from '@draco/shared-schemas';
import type { WelcomeMessageService } from '../services/welcomeMessageService.js';

type TeamContext = Awaited<ReturnType<WelcomeMessageService['resolveTeamContext']>>;

declare module 'express-serve-static-core' {
  interface Request {
    welcomeMessageTeamContext?: TeamContext;
  }
}

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const welcomeMessageService = ServiceFactory.getWelcomeMessageService();

const attachTeamContext = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const context = await welcomeMessageService.resolveTeamContext(accountId, teamSeasonId);
    req.welcomeMessageTeamContext = context;
    req.params.seasonId = context.seasonId.toString();
    req.params.teamId = context.teamId.toString();
    next();
  },
);

router.get(
  '/:accountId/teams/:teamSeasonId/welcome-messages',
  attachTeamContext,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const context = req.welcomeMessageTeamContext;
    const welcomeMessages = await welcomeMessageService.listTeamMessages(
      accountId,
      teamSeasonId,
      context,
    );
    res.json({ welcomeMessages });
  }),
);

router.get(
  '/:accountId/teams/:teamSeasonId/welcome-messages/:messageId',
  attachTeamContext,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId, messageId } = extractBigIntParams(
      req.params,
      'teamSeasonId',
      'messageId',
    );
    const context = req.welcomeMessageTeamContext;
    const welcomeMessage = await welcomeMessageService.getTeamMessage(
      accountId,
      teamSeasonId,
      messageId,
      context,
    );
    res.json(welcomeMessage);
  }),
);

router.post(
  '/:accountId/teams/:teamSeasonId/welcome-messages',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  attachTeamContext,
  routeProtection.requireAnyPermission([
    'account.communications.manage',
    'league.manage',
    'team.manage',
  ]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId } = extractBigIntParams(req.params, 'teamSeasonId');
    const context = req.welcomeMessageTeamContext;
    const payload = UpsertWelcomeMessageSchema.parse(req.body);
    const welcomeMessage = await welcomeMessageService.createTeamMessage(
      accountId,
      teamSeasonId,
      payload,
      context,
    );
    res.status(201).json(welcomeMessage);
  }),
);

router.put(
  '/:accountId/teams/:teamSeasonId/welcome-messages/:messageId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  attachTeamContext,
  routeProtection.requireAnyPermission([
    'account.communications.manage',
    'league.manage',
    'team.manage',
  ]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId, messageId } = extractBigIntParams(
      req.params,
      'teamSeasonId',
      'messageId',
    );
    const context = req.welcomeMessageTeamContext;
    const payload = UpsertWelcomeMessageSchema.parse(req.body);
    const welcomeMessage = await welcomeMessageService.updateTeamMessage(
      accountId,
      teamSeasonId,
      messageId,
      payload,
      context,
    );
    res.json(welcomeMessage);
  }),
);

router.delete(
  '/:accountId/teams/:teamSeasonId/welcome-messages/:messageId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  attachTeamContext,
  routeProtection.requireAnyPermission([
    'account.communications.manage',
    'league.manage',
    'team.manage',
  ]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { teamSeasonId, messageId } = extractBigIntParams(
      req.params,
      'teamSeasonId',
      'messageId',
    );
    const context = req.welcomeMessageTeamContext;
    await welcomeMessageService.deleteTeamMessage(accountId, teamSeasonId, messageId, context);
    res.status(204).send();
  }),
);

export default router;
