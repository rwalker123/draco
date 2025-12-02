import { Router, Request, Response } from 'express';
import {
  AccountFacebookOAuthStartSchema,
  AccountFacebookCredentialsSchema,
  FacebookPageSelectionSchema,
} from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extractAccountParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const routeProtection = ServiceFactory.getRouteProtection();
const facebookIntegrationService = ServiceFactory.getFacebookIntegrationService();

router.post(
  '/:accountId/facebook/credentials',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const body = AccountFacebookCredentialsSchema.parse(req.body ?? {});

    await facebookIntegrationService.saveAppCredentials(accountId, body);
    res.status(204).send();
  }),
);

router.post(
  '/:accountId/facebook/oauth/url',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const body = AccountFacebookOAuthStartSchema.partial().parse(req.body ?? {});
    const authorizationUrl = await facebookIntegrationService.createAuthorizationUrl(
      accountId,
      body.returnUrl,
    );
    res.json({ authorizationUrl });
  }),
);

router.get(
  '/facebook/oauth/callback',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const error = req.query.error ? String(req.query.error) : null;
    const errorDescription = req.query.error_description ? String(req.query.error_description) : '';

    if (error || !code || !state) {
      const redirect = facebookIntegrationService.buildRedirectFromState(
        state,
        'error',
        errorDescription || error || 'Unable to complete Facebook authorization.',
      );
      res.redirect(redirect);
      return;
    }

    try {
      const result = await facebookIntegrationService.completeOAuthCallback(code, state);
      res.redirect(result.redirectUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to complete Facebook authorization.';
      const redirect = facebookIntegrationService.buildRedirectFromState(state, 'error', message);
      res.redirect(redirect);
    }
  }),
);

router.get(
  '/:accountId/facebook/pages',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const pages = await facebookIntegrationService.listPages(accountId);
    res.json({ pages });
  }),
);

router.post(
  '/:accountId/facebook/page',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const body = FacebookPageSelectionSchema.parse(req.body ?? {});
    await facebookIntegrationService.savePageSelection(accountId, body.pageId, body.pageName);
    res.status(204).send();
  }),
);

router.delete(
  '/:accountId/facebook',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    await facebookIntegrationService.disconnect(accountId);
    res.status(204).send();
  }),
);

router.get(
  '/:accountId/facebook/status',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const status = await facebookIntegrationService.getConnectionStatus(accountId);
    res.json(status);
  }),
);

export default router;
