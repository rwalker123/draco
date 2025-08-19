// Webhook Controller for Email Provider Events
// Handles webhooks from SendGrid and other email providers

import { Request, Response } from 'express';
import { SendGridProvider } from '../services/email/providers/SendGridProvider.js';
import { SendGridWebhookEvent } from '../interfaces/emailInterfaces.js';
import { EmailProviderFactory } from '../services/email/EmailProviderFactory.js';
import { DateUtils } from '../utils/dateUtils.js';

export class WebhookController {
  /**
   * Handle SendGrid webhook events
   * POST /api/webhooks/sendgrid
   */
  static async handleSendGridWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify webhook signature (in production)
      const signature = req.get('X-Twilio-Email-Event-Webhook-Signature');
      const timestamp = req.get('X-Twilio-Email-Event-Webhook-Timestamp');

      // For development, skip signature verification
      if (process.env.NODE_ENV === 'production' && signature && timestamp) {
        const payload = JSON.stringify(req.body);
        const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || '';

        if (!SendGridProvider.verifyWebhookSignature(payload, signature, publicKey)) {
          console.warn('Invalid SendGrid webhook signature');
          res.status(401).json({ error: 'Invalid webhook signature' });
          return;
        }
      }

      // Parse webhook events
      const events: SendGridWebhookEvent[] = Array.isArray(req.body) ? req.body : [req.body];

      if (events.length === 0) {
        console.warn('Empty SendGrid webhook payload received');
        res.status(400).json({ error: 'Empty webhook payload' });
        return;
      }

      console.log(`📨 Received ${events.length} SendGrid webhook events`);

      // Get SendGrid provider instance
      const provider = await EmailProviderFactory.getProvider();

      if (!(provider instanceof SendGridProvider)) {
        console.error('SendGrid webhook received but current provider is not SendGrid');
        res.status(500).json({ error: 'Provider mismatch' });
        return;
      }

      // Process webhook events
      const result = await provider.processWebhookEvents(events);

      console.log(`✅ Processed ${result.processed}/${events.length} SendGrid webhook events`);

      if (result.errors.length > 0) {
        console.warn('SendGrid webhook processing errors:', result.errors);
      }

      // Respond to SendGrid
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
  }

  /**
   * Health check endpoint for webhooks
   * GET /api/webhooks/health
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * Get webhook statistics
   * GET /api/webhooks/stats
   */
  static async getWebhookStats(req: Request, res: Response): Promise<void> {
    try {
      // This would typically come from a cache or database
      // For now, return basic info
      const stats = {
        total_events_processed: 0, // Would be tracked in production
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
  }
}
