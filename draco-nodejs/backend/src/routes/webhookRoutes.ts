// Webhook Routes for Email Provider Events
// Public endpoints (no authentication) for receiving webhooks from email providers

import type { Request, Response } from 'express';
import { Router } from 'express';
import { SendGridProvider } from '../services/email/providers/SendGridProvider.js';
import { SendGridWebhookEvent } from '../interfaces/emailInterfaces.js';
import { EmailProviderFactory } from '../services/email/EmailProviderFactory.js';
import { DateUtils } from '../utils/dateUtils.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  AuthenticationError,
  InternalServerError,
  ValidationError,
} from '../utils/customErrors.js';
import { EmailConfigFactory } from '../config/email.js';

const router = Router();

/**
 * POST /api/webhooks/sendgrid
 * Receives webhook events from SendGrid and processes delivery updates.
 */
router.post(
  '/sendgrid',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.get('X-Twilio-Email-Event-Webhook-Signature');
    const timestamp = req.get('X-Twilio-Email-Event-Webhook-Timestamp');

    if (process.env.NODE_ENV === 'production' && signature && timestamp) {
      const payload = JSON.stringify(req.body);
      const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || '';

      if (!SendGridProvider.verifyWebhookSignature(payload, signature, publicKey)) {
        console.warn('Invalid SendGrid webhook signature');
        throw new AuthenticationError('Invalid webhook signature');
      }
    }

    const events: SendGridWebhookEvent[] = Array.isArray(req.body) ? req.body : [req.body];

    if (events.length === 0) {
      console.warn('Empty SendGrid webhook payload received');
      throw new ValidationError('Empty webhook payload');
    }

    console.log(`📨 Received ${events.length} SendGrid webhook events`);

    const provider = await EmailProviderFactory.getProvider();

    if (!(provider instanceof SendGridProvider)) {
      console.error('SendGrid webhook received but current provider is not SendGrid');
      throw new InternalServerError('SendGrid webhook provider mismatch');
    }

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
        ethereal: settings.provider === 'ethereal',
      },
    };

    res.status(200).json(stats);
  }),
);

export default router;
