import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams, extractBigIntParams } from '../utils/paramExtraction.js';
import {
  DiscordAccountConfigUpdateSchema,
  DiscordRoleMappingUpdateSchema,
  DiscordChannelMappingCreateSchema,
  DiscordFeatureSyncFeatureEnum,
  DiscordFeatureSyncUpdateSchema,
  DiscordTeamForumQuerySchema,
  DiscordTeamForumSyncRequestSchema,
  DiscordTeamForumRemoveRequestSchema,
} from '@draco/shared-schemas';
import { AuthenticationError, ValidationError } from '../utils/customErrors.js';

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

const parseFeature = (featureParam: string) => {
  const result = DiscordFeatureSyncFeatureEnum.safeParse(featureParam);
  if (!result.success) {
    throw new ValidationError('Unsupported Discord feature sync feature.');
  }
  return result.data;
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

router.delete(
  '/:accountId/discord/config',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const config = await discordIntegrationService.disconnectAccountGuild(accountId);
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
  '/:accountId/discord/install/start',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = requireUserId(req);
    const response = await discordIntegrationService.startGuildInstall(accountId, userId);
    res.status(201).json(response);
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

router.get(
  '/:accountId/discord/channel-mappings',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const mappings = await discordIntegrationService.listChannelMappings(accountId);
    res.json(mappings);
  }),
);

router.post(
  '/:accountId/discord/channel-mappings',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = DiscordChannelMappingCreateSchema.parse(req.body);
    const mapping = await discordIntegrationService.createChannelMapping(accountId, payload);
    res.status(201).json(mapping);
  }),
);

router.get(
  '/:accountId/discord/team-forums',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const query = DiscordTeamForumQuerySchema.parse(req.query);
    const forums = await discordIntegrationService.listTeamForums(accountId, query);
    res.json(forums);
  }),
);

router.post(
  '/:accountId/discord/team-forums/repair',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const result = await discordIntegrationService.repairTeamForums(accountId);
    res.json(result);
  }),
);

router.post(
  '/:accountId/discord/team-forums/sync-members',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = DiscordTeamForumSyncRequestSchema.parse(req.body);
    const result = await discordIntegrationService.syncTeamForumMembers(accountId, payload);
    res.json(result);
  }),
);

router.post(
  '/:accountId/discord/team-forums/remove-team',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const payload = DiscordTeamForumRemoveRequestSchema.parse(req.body);
    await discordIntegrationService.removeTeamForum(accountId, BigInt(payload.teamId));
    res.json({ message: 'Team forum removed.' });
  }),
);

router.delete(
  '/:accountId/discord/channel-mappings/:mappingId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.settings.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { mappingId } = extractBigIntParams(req.params, 'mappingId');
    await discordIntegrationService.deleteChannelMapping(accountId, mappingId);
    res.status(204).send();
  }),
);

router.get(
  '/:accountId/discord/available-channels',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requireAnyPermission([
    'account.settings.manage',
    'account.communications.manage',
  ]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const channels = await discordIntegrationService.listAvailableChannels(accountId);
    res.json(channels);
  }),
);

router.get(
  '/:accountId/discord/feature-sync/:feature',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.communications.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const feature = parseFeature(req.params.feature);
    const status = await discordIntegrationService.getFeatureSyncStatus(accountId, feature);
    res.json(status);
  }),
);

router.put(
  '/:accountId/discord/feature-sync/:feature',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.communications.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const feature = parseFeature(req.params.feature);
    const payload = DiscordFeatureSyncUpdateSchema.parse(req.body);
    const status = await discordIntegrationService.updateFeatureSync(accountId, feature, payload);
    res.json(status);
  }),
);

export default router;
