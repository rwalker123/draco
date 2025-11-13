import { Router, Request, Response } from 'express';
import { DiscordOAuthCallbackSchema } from '@draco/shared-schemas';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/customErrors.js';
import { decryptSecret } from '../utils/secretEncryption.js';

const router = Router();
const discordIntegrationService = ServiceFactory.getDiscordIntegrationService();

const frontendBase = process.env.FRONTEND_URL?.replace(/\/$/, '') ?? '';
const linkResultBase =
  process.env.DISCORD_LINK_RESULT_URL ?? `${frontendBase}/profile/discord/callback`;
const installResultTemplate =
  process.env.DISCORD_INSTALL_RESULT_URL ?? `${frontendBase}/account/{accountId}/settings`;

const buildLinkResultUrl = (status: 'success' | 'error', message?: string): string => {
  const url = new URL(linkResultBase);
  url.searchParams.set('status', status);
  if (message) {
    url.searchParams.set('message', message);
  }
  return url.toString();
};

const buildInstallResultUrl = (
  accountId: string,
  status: 'success' | 'error',
  message?: string,
): string => {
  const base = installResultTemplate.replace('{accountId}', accountId);
  const url = new URL(base);
  url.searchParams.set('discordInstallStatus', status);
  if (message) {
    url.searchParams.set('discordInstallMessage', message);
  }
  return url.toString();
};

const extractAccountIdFromState = (state: unknown): string | null => {
  if (!state) {
    return null;
  }
  const raw = Array.isArray(state) ? state[0] : state;
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    const decoded = decryptSecret(raw);
    const payload = JSON.parse(decoded) as { accountId?: string };
    return payload.accountId ?? null;
  } catch {
    return null;
  }
};

router.get(
  '/oauth/callback',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { error, error_description: errorDescription } = req.query;

    if (error) {
      res.redirect(buildLinkResultUrl('error', String(errorDescription || error)));
      return;
    }

    try {
      const { code, state } = DiscordOAuthCallbackSchema.parse({
        code: req.query.code,
        state: req.query.state,
      });

      await discordIntegrationService.completeUserLink(code, state);
      res.redirect(buildLinkResultUrl('success'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to complete Discord linking.';
      res.redirect(buildLinkResultUrl('error', message));
    }
  }),
);

router.get(
  '/install/callback',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { error, error_description: errorDescription, guild_id: guildId } = req.query;

    if (error) {
      const accountId = extractAccountIdFromState(req.query.state);
      if (accountId) {
        res.redirect(buildInstallResultUrl(accountId, 'error', String(errorDescription || error)));
        return;
      }
      res.redirect(buildLinkResultUrl('error', String(errorDescription || error)));
      return;
    }

    try {
      const state = String(req.query.state ?? '');
      await discordIntegrationService.completeGuildInstall(state, guildId as string | undefined);
      const accountId = extractAccountIdFromState(state) ?? '';
      res.redirect(buildInstallResultUrl(accountId, 'success'));
    } catch (err) {
      const accountId = extractAccountIdFromState(req.query.state);
      const message =
        err instanceof ApiError ? err.message : 'Unable to install the Discord bot for this guild.';
      if (accountId) {
        res.redirect(buildInstallResultUrl(accountId, 'error', message));
      } else {
        res.redirect(buildLinkResultUrl('error', message));
      }
    }
  }),
);

export default router;
