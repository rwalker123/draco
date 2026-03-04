// Webhook Routes for Email Provider Events
// Public endpoints (no authentication) for receiving webhooks from email providers

import type { Request, Response } from 'express';
import { Router } from 'express';
import { SendGridProvider } from '../services/email/providers/SendGridProvider.js';
import { ResendProvider } from '../services/email/providers/ResendProvider.js';
import { EmailProviderFactory } from '../services/email/EmailProviderFactory.js';
import { DateUtils } from '../utils/dateUtils.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  AuthenticationError,
  InternalServerError,
  ValidationError,
} from '../utils/customErrors.js';
import { EmailConfigFactory } from '../config/email.js';
import { ServiceFactory } from '../services/serviceFactory.js';

const router = Router();
const emailService = ServiceFactory.getEmailService();

/**
 * POST /api/webhooks/sendgrid
 * Receives webhook events from SendGrid and processes delivery updates.
 */
router.post(
  '/sendgrid',
  asyncHandler(async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
      if (!publicKey) {
        throw new InternalServerError('SendGrid webhook public key not configured');
      }

      const signature = req.get('X-Twilio-Email-Event-Webhook-Signature');
      const timestamp = req.get('X-Twilio-Email-Event-Webhook-Timestamp');
      if (!signature || !timestamp) {
        throw new AuthenticationError('Missing webhook signature headers');
      }

      const payload = JSON.stringify(req.body);
      if (!SendGridProvider.verifyWebhookSignature(payload, signature, timestamp, publicKey)) {
        throw new AuthenticationError('Invalid webhook signature');
      }
    }

    const settings = EmailConfigFactory.getEmailSettings();
    if (settings.provider !== 'sendgrid') {
      throw new InternalServerError('SendGrid webhook provider mismatch');
    }

    const events: unknown[] = Array.isArray(req.body) ? req.body : [req.body];

    if (events.length === 0) {
      console.warn('Empty SendGrid webhook payload received');
      throw new ValidationError('Empty webhook payload');
    }

    console.log(`📨 Received ${events.length} SendGrid webhook events`);

    const provider = await EmailProviderFactory.getProvider();
    const result = await provider.processWebhookEvents(events);

    console.log(`✅ Processed ${result.processed}/${events.length} SendGrid webhook events`);

    if (result.errors.length > 0) {
      console.warn('SendGrid webhook processing errors:', result.errors);
    }

    res.status(200).json({
      message: 'Webhook processed successfully',
      processed: result.processed,
      total: events.length,
      errors: result.errors.length,
    });

    if (result.contactBounces.length > 0) {
      emailService.sendBounceNotifications(result.contactBounces).catch((err) => {
        console.error('Failed to send SendGrid bounce notifications:', err);
      });
    }
  }),
);

/**
 * POST /api/webhooks/resend
 * Receives webhook events from Resend and processes delivery updates.
 */
router.post(
  '/resend',
  asyncHandler(async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      const secret = process.env.RESEND_WEBHOOK_SECRET;
      if (!secret) {
        throw new InternalServerError('Resend webhook secret not configured');
      }

      const payload = JSON.stringify(req.body);
      const headers = {
        'svix-id': req.get('svix-id') ?? undefined,
        'svix-timestamp': req.get('svix-timestamp') ?? undefined,
        'svix-signature': req.get('svix-signature') ?? undefined,
      };

      if (!ResendProvider.verifyWebhookSignature(payload, headers, secret)) {
        throw new AuthenticationError('Invalid webhook signature');
      }
    }

    const settings = EmailConfigFactory.getEmailSettings();
    if (settings.provider !== 'resend') {
      throw new InternalServerError('Resend webhook provider mismatch');
    }

    const events: unknown[] = Array.isArray(req.body) ? req.body : [req.body];

    if (events.length === 0) {
      console.warn('Empty Resend webhook payload received');
      throw new ValidationError('Empty webhook payload');
    }

    console.log(`📨 Received ${events.length} Resend webhook events`);

    const provider = await EmailProviderFactory.getProvider();
    const result = await provider.processWebhookEvents(events);

    console.log(`✅ Processed ${result.processed}/${events.length} Resend webhook events`);

    if (result.errors.length > 0) {
      console.warn('Resend webhook processing errors:', result.errors);
    }

    res.status(200).json({
      message: 'Webhook processed successfully',
      processed: result.processed,
      total: events.length,
      errors: result.errors.length,
    });

    if (result.contactBounces.length > 0) {
      emailService.sendBounceNotifications(result.contactBounces).catch((err) => {
        console.error('Failed to send Resend bounce notifications:', err);
      });
    }
  }),
);

/**
 * GET /api/webhooks/health
 * Provides a basic health check for webhook integrations.
 */
router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const settings = EmailConfigFactory.getEmailSettings();

    res.status(200).json({
      status: 'healthy',
      timestamp: DateUtils.formatDateTimeForResponse(new Date()),
      provider: settings.provider,
      webhooks: {
        sendgrid: {
          enabled: settings.provider === 'sendgrid',
          endpoint: '/api/webhooks/sendgrid',
        },
        resend: {
          enabled: settings.provider === 'resend',
          endpoint: '/api/webhooks/resend',
        },
      },
    });
  }),
);

/**
 * GET /api/webhooks/stats
 * Returns aggregate statistics about processed webhook events.
 */
router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const settings = EmailConfigFactory.getEmailSettings();

    const stats = {
      total_events_processed: 0,
      last_event_timestamp: null,
      provider_status: {
        sendgrid: settings.provider === 'sendgrid',
        ses: settings.provider === 'ses',
        ethereal: settings.provider === 'ethereal',
        resend: settings.provider === 'resend',
        none: settings.provider === 'none',
      },
    };

    res.status(200).json(stats);
  }),
);

export default router;
