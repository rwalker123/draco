// Email Routes for Draco Sports Manager
// Follows SRP - handles HTTP routing for email endpoints only

import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../lib/serviceFactory.js';

const router = Router();
const emailController = new EmailController();
const routeProtection = ServiceFactory.getRouteProtection();

/**
 * @route POST /api/accounts/:accountId/emails/compose
 * @desc Compose and send email
 * @access Private - requires ContactAdmin or higher permissions
 */
router.post(
  '/accounts/:accountId/emails/compose',
  authenticateToken,
  routeProtection.requirePermission('account.manage'),
  emailController.composeEmail,
);

/**
 * @route GET /api/accounts/:accountId/emails
 * @desc List emails for account
 * @access Private - requires Contact or higher permissions
 */
router.get(
  '/accounts/:accountId/emails',
  authenticateToken,
  routeProtection.requirePermission('account.view'),
  emailController.listEmails,
);

/**
 * @route GET /api/accounts/:accountId/emails/:emailId
 * @desc Get email details
 * @access Private - requires Contact or higher permissions
 */
router.get(
  '/accounts/:accountId/emails/:emailId',
  authenticateToken,
  routeProtection.requirePermission('account.view'),
  emailController.getEmail,
);

// Email Template Routes

/**
 * @route POST /api/accounts/:accountId/email-templates
 * @desc Create email template
 * @access Private - requires ContactAdmin or higher permissions
 */
router.post(
  '/accounts/:accountId/email-templates',
  authenticateToken,
  routeProtection.requirePermission('account.manage'),
  emailController.createTemplate,
);

/**
 * @route GET /api/accounts/:accountId/email-templates
 * @desc List email templates
 * @access Private - requires Contact or higher permissions
 */
router.get(
  '/accounts/:accountId/email-templates',
  authenticateToken,
  routeProtection.requirePermission('account.view'),
  emailController.listTemplates,
);

/**
 * @route GET /api/accounts/:accountId/email-templates/:templateId
 * @desc Get email template
 * @access Private - requires Contact or higher permissions
 */
router.get(
  '/accounts/:accountId/email-templates/:templateId',
  authenticateToken,
  routeProtection.requirePermission('account.view'),
  emailController.getTemplate,
);

/**
 * @route PUT /api/accounts/:accountId/email-templates/:templateId
 * @desc Update email template
 * @access Private - requires ContactAdmin or higher permissions
 */
router.put(
  '/accounts/:accountId/email-templates/:templateId',
  authenticateToken,
  routeProtection.requirePermission('account.manage'),
  emailController.updateTemplate,
);

/**
 * @route DELETE /api/accounts/:accountId/email-templates/:templateId
 * @desc Delete email template (soft delete)
 * @access Private - requires ContactAdmin or higher permissions
 */
router.delete(
  '/accounts/:accountId/email-templates/:templateId',
  authenticateToken,
  routeProtection.requirePermission('account.manage'),
  emailController.deleteTemplate,
);

/**
 * @route POST /api/accounts/:accountId/email-templates/:templateId/preview
 * @desc Preview template with variables
 * @access Private - requires Contact or higher permissions
 */
router.post(
  '/accounts/:accountId/email-templates/:templateId/preview',
  authenticateToken,
  routeProtection.requirePermission('account.view'),
  emailController.previewTemplate,
);

export default router;
