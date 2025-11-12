import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import {
  DiscordAccountConfigUpdateSchema,
  DiscordOAuthCallbackSchema,
  DiscordRoleMappingUpdateSchema,
} from '@draco/shared-schemas';
import { AuthenticationError } from '../utils/customErrors.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const discordIntegrationService = ServiceFactory.getDiscordIntegrationService();

const requireUserId = (req: Request): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('Authentication required');
  }
  return userId;
};

router.get(
  '/:accountId/discord/config',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const config = await discordIntegrationService.getAccountConfig(accountId);
    res.json(config);
  }),
);

router.put(
  '/:accountId/discord/config',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = DiscordAccountConfigUpdateSchema.parse(req.body);
    const config = await discordIntegrationService.updateAccountConfig(accountId, payload);
    res.json(config);
  }),
);

router.get(
  '/:accountId/discord/link-status',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = requireUserId(req);
    const status = await discordIntegrationService.getLinkStatus(accountId, userId);
    res.json(status);
  }),
);

router.post(
  '/:accountId/discord/link/start',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = requireUserId(req);
    const response = await discordIntegrationService.startLink(accountId, userId);
    res.status(201).json(response);
  }),
);

router.post(
  '/:accountId/discord/link/callback',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = requireUserId(req);
    const payload = DiscordOAuthCallbackSchema.parse(req.body);
    const status = await discordIntegrationService.completeLink(accountId, userId, payload);
    res.json(status);
  }),
);

router.delete(
  '/:accountId/discord/link',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = requireUserId(req);
    const status = await discordIntegrationService.unlinkAccount(accountId, userId);
    res.json(status);
  }),
);

router.get(
  '/:accountId/discord/role-mappings',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const mappings = await discordIntegrationService.listRoleMappings(accountId);
    res.json(mappings);
  }),
);

router.post(
  '/:accountId/discord/role-mappings',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = DiscordRoleMappingUpdateSchema.parse(req.body);
    const mapping = await discordIntegrationService.createRoleMapping(accountId, payload);
    res.status(201).json(mapping);
  }),
);

router.put(
  '/:accountId/discord/role-mappings/:roleMappingId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { roleMappingId } = extractBigIntParams(req.params, 'roleMappingId');
    const payload = DiscordRoleMappingUpdateSchema.parse(req.body);
    const mapping = await discordIntegrationService.updateRoleMapping(
      accountId,
      roleMappingId,
      payload,
    );
    res.json(mapping);
  }),
);

router.delete(
  '/:accountId/discord/role-mappings/:roleMappingId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { roleMappingId } = extractBigIntParams(req.params, 'roleMappingId');
    await discordIntegrationService.deleteRoleMapping(accountId, roleMappingId);
    res.status(204).send();
  }),
);

export default router;
