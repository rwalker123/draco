// Webhook Routes for Email Provider Events
// Public endpoints (no authentication) for receiving webhooks from email providers

import type { Request, Response } from 'express';
import { Router } from 'express';
import { SendGridProvider } from '../services/email/providers/SendGridProvider.js';
import { SendGridWebhookEvent } from '../interfaces/emailInterfaces.js';
import { EmailProviderFactory } from '../services/email/EmailProviderFactory.js';
import { DateUtils } from '../utils/dateUtils.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * POST /api/webhooks/sendgrid
 * Receives webhook events from SendGrid and processes delivery updates.
 */
router.post(
  '/sendgrid',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const signature = req.get('X-Twilio-Email-Event-Webhook-Signature');
      const timestamp = req.get('X-Twilio-Email-Event-Webhook-Timestamp');

      if (process.env.NODE_ENV === 'production' && signature && timestamp) {
        const payload = JSON.stringify(req.body);
        const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || '';

        if (!SendGridProvider.verifyWebhookSignature(payload, signature, publicKey)) {
          console.warn('Invalid SendGrid webhook signature');
          res.status(401).json({ error: 'Invalid webhook signature' });
          return;
        }
      }

      const events: SendGridWebhookEvent[] = Array.isArray(req.body) ? req.body : [req.body];

      if (events.length === 0) {
        console.warn('Empty SendGrid webhook payload received');
        res.status(400).json({ error: 'Empty webhook payload' });
        return;
      }

      console.log(`📨 Received ${events.length} SendGrid webhook events`);

      const provider = await EmailProviderFactory.getProvider();

      if (!(provider instanceof SendGridProvider)) {
        console.error('SendGrid webhook received but current provider is not SendGrid');
        res.status(500).json({ error: 'Provider mismatch' });
        return;
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
    } catch (error) {
      console.error('Error processing SendGrid webhook:', error);
      res.status(500).json({
        error: 'Internal server error processing webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
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
    res.status(200).json({
      status: 'healthy',
      timestamp: DateUtils.formatDateTimeForResponse(new Date()),
      provider: process.env.EMAIL_PROVIDER || 'ethereal',
      webhooks: {
        sendgrid: {
          enabled: process.env.EMAIL_PROVIDER === 'sendgrid',
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
    try {
      const stats = {
        total_events_processed: 0,
        last_event_timestamp: null,
        provider_status: {
          sendgrid: process.env.EMAIL_PROVIDER === 'sendgrid',
        },
      };

      res.status(200).json(stats);
    } catch (error) {
      console.error('Error getting webhook stats:', error);
      res.status(500).json({
        error: 'Failed to get webhook statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }),
);

export default router;
