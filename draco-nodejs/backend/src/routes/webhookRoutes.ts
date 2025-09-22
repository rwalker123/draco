// Webhook Routes for Email Provider Events
// Public endpoints (no authentication) for receiving webhooks from email providers

import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * POST /api/webhooks/sendgrid
 * Receives webhook events from SendGrid and processes delivery updates.
 */
router.post('/sendgrid', asyncHandler(WebhookController.handleSendGridWebhook));

/**
 * GET /api/webhooks/health
 * Provides a basic health check for webhook integrations.
 */
router.get('/health', asyncHandler(WebhookController.healthCheck));

/**
 * GET /api/webhooks/stats
 * Returns aggregate statistics about processed webhook events.
 */
router.get('/stats', asyncHandler(WebhookController.getWebhookStats));

export default router;
