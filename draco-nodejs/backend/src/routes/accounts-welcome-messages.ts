import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import { UpsertWelcomeMessageSchema } from '@draco/shared-schemas';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const welcomeMessageService = ServiceFactory.getWelcomeMessageService();

router.get(
  '/:accountId/welcome-messages',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const welcomeMessages = await welcomeMessageService.listAccountMessages(accountId);
    res.json({ welcomeMessages });
  }),
);

router.get(
  '/:accountId/welcome-messages/:messageId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { messageId } = extractBigIntParams(req.params, 'messageId');
    const welcomeMessage = await welcomeMessageService.getAccountMessage(accountId, messageId);
    res.json(welcomeMessage);
  }),
);

router.post(
  '/:accountId/welcome-messages',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.communications.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = UpsertWelcomeMessageSchema.parse(req.body);
    const welcomeMessage = await welcomeMessageService.createAccountMessage(accountId, payload);
    res.status(201).json(welcomeMessage);
  }),
);

router.put(
  '/:accountId/welcome-messages/:messageId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.communications.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { messageId } = extractBigIntParams(req.params, 'messageId');
    const payload = UpsertWelcomeMessageSchema.parse(req.body);
    const welcomeMessage = await welcomeMessageService.updateAccountMessage(
      accountId,
      messageId,
      payload,
    );
    res.json(welcomeMessage);
  }),
);

router.delete(
  '/:accountId/welcome-messages/:messageId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.communications.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { messageId } = extractBigIntParams(req.params, 'messageId');
    await welcomeMessageService.deleteAccountMessage(accountId, messageId);
    res.status(204).send();
  }),
);

export default router;
