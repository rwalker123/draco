import { Router, Request, Response } from 'express';

import { EmailStatus } from '../interfaces/emailInterfaces.js';
import { EmailSendSchema, EmailSendType } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, AuthorizationError } from '../utils/customErrors.js';
import { PagingSchema } from '@draco/shared-schemas';
import { extractTeamParams, extractBigIntParams } from '../utils/paramExtraction.js';

const router = Router({ mergeParams: true });
const emailService = ServiceFactory.getEmailService();
const routeProtection = ServiceFactory.getRouteProtection();
const roleService = ServiceFactory.getRoleService();
const accountSettingsService = ServiceFactory.getAccountSettingsService();

async function ensureTeamEmailEnabled(accountId: bigint): Promise<void> {
  const settings = await accountSettingsService.getAccountSettings(accountId);
  const match = settings.find((setting) => setting.definition.key === 'EnableTeamEmail');
  const value = match?.effectiveValue ?? match?.value ?? true;
  if (value !== true) {
    throw new AuthorizationError('Team email is disabled for this account');
  }
}

function validateTeamScopePayload(body: EmailSendType, teamSeasonId: string): void {
  if (body.attachments && body.attachments.length > 0) {
    throw new ValidationError('Attachments are not supported for team emails');
  }

  const { recipients } = body;

  if (recipients.workoutRecipients && recipients.workoutRecipients.length > 0) {
    throw new ValidationError('Workout recipients are not supported for team emails');
  }

  if (recipients.umpireRecipients && recipients.umpireRecipients.length > 0) {
    throw new ValidationError('Umpire recipients are not supported for team emails');
  }

  if (recipients.teamsWantedRecipients && recipients.teamsWantedRecipients.length > 0) {
    throw new ValidationError('Teams wanted recipients are not supported for team emails');
  }

  if (recipients.seasonSelection) {
    const { season, leagues, divisions, managersOnly } = recipients.seasonSelection;

    if (season) {
      throw new ValidationError('Season-wide selection is not supported for team emails');
    }

    if (leagues && leagues.length > 0) {
      throw new ValidationError('League selection is not supported for team emails');
    }

    if (divisions && divisions.length > 0) {
      throw new ValidationError('Division selection is not supported for team emails');
    }

    if (managersOnly) {
      throw new ValidationError('managersOnly is not supported for team emails');
    }

    if (recipients.seasonSelection.teams) {
      for (const teamId of recipients.seasonSelection.teams) {
        if (teamId !== teamSeasonId) {
          throw new ValidationError(
            `Recipient team ${teamId} does not match the route team ${teamSeasonId}`,
          );
        }
      }
    }
  }
}

router.post(
  '/:teamSeasonId/emails/compose',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  routeProtection.requirePermission('team.communications.send'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, teamSeasonId } = extractTeamParams(req.params);
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const hasTeamPermission = await roleService.hasPermission(userId, 'team.communications.send', {
      accountId,
      teamId: teamSeasonId,
    });

    if (!hasTeamPermission) {
      throw new AuthorizationError('You do not have permission to send emails for this team');
    }

    await ensureTeamEmailEnabled(accountId);

    const request = EmailSendSchema.parse(req.body);

    validateTeamScopePayload(request, teamSeasonId.toString());

    if (request.recipients.seasonSelection) {
      request.recipients.seasonSelection.managersOnly = false;
    }

    const emailId = await emailService.composeAndSendEmailFromUser(accountId, userId, request, {
      teamSeasonId,
    });

    res.status(201).json({
      emailId: emailId.toString(),
      status: request.scheduledSend ? 'scheduled' : 'sending',
    });
  }),
);

router.get(
  '/:teamSeasonId/emails/roster-contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  routeProtection.requirePermission('team.communications.send'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, seasonId, teamSeasonId } = extractTeamParams(req.params);

    await ensureTeamEmailEnabled(accountId);

    const contacts = await emailService.getGroupContacts(
      accountId,
      seasonId,
      'team',
      teamSeasonId.toString(),
      false,
    );

    res.json(contacts);
  }),
);

router.get(
  '/:teamSeasonId/emails/history',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  routeProtection.requirePermission('team.communications.send'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, teamSeasonId } = extractTeamParams(req.params);
    const { page = '1', limit = '20', status } = req.query;

    await ensureTeamEmailEnabled(accountId);

    const pagingParams = PagingSchema.parse({ page, limit });

    const result = await emailService.listTeamEmails(
      accountId,
      teamSeasonId,
      pagingParams,
      status as EmailStatus | undefined,
    );

    res.json(result);
  }),
);

router.get(
  '/:teamSeasonId/emails/history/:emailId',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.enforceTeamBoundary(),
  routeProtection.requirePermission('team.communications.send'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId, teamSeasonId } = extractTeamParams(req.params);
    const { emailId } = extractBigIntParams(req.params, 'emailId');

    await ensureTeamEmailEnabled(accountId);

    const email = await emailService.getTeamEmail(accountId, teamSeasonId, emailId);

    res.json(email);
  }),
);

export default router;
