// Webhook Routes for Email Provider Events
// Public endpoints (no authentication) for receiving webhooks from email providers

import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController.js';
import { asyncHandler } from './utils/asyncHandler.js';

const router = Router();

/**
 * @swagger
 * /api/webhooks/sendgrid:
 *   post:
 *     tags: [Webhooks]
 *     summary: Handle SendGrid webhook events
 *     description: Receives and processes webhook events from SendGrid for email delivery tracking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 timestamp:
 *                   type: number
 *                 event:
 *                   type: string
 *                   enum: [delivered, bounce, dropped, open, click, processed, deferred]
 *                 sg_event_id:
 *                   type: string
 *                 sg_message_id:
 *                   type: string
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 processed:
 *                   type: number
 *                 total:
 *                   type: number
 *                 errors:
 *                   type: number
 *       401:
 *         description: Invalid webhook signature
 *       400:
 *         description: Invalid webhook payload
 *       500:
 *         description: Internal server error
 */
router.post('/sendgrid', asyncHandler(WebhookController.handleSendGridWebhook));

/**
 * @swagger
 * /api/webhooks/health:
 *   get:
 *     tags: [Webhooks]
 *     summary: Webhook health check
 *     description: Health check endpoint for webhook system
 *     responses:
 *       200:
 *         description: Webhook system is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 provider:
 *                   type: string
 *                 webhooks:
 *                   type: object
 */
router.get('/health', asyncHandler(WebhookController.healthCheck));

/**
 * @swagger
 * /api/webhooks/stats:
 *   get:
 *     tags: [Webhooks]
 *     summary: Get webhook statistics
 *     description: Returns statistics about webhook processing
 *     responses:
 *       200:
 *         description: Webhook statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_events_processed:
 *                   type: number
 *                 last_event_timestamp:
 *                   type: string
 *                 provider_status:
 *                   type: object
 *       500:
 *         description: Failed to get statistics
 */
router.get('/stats', asyncHandler(WebhookController.getWebhookStats));

export default router;
