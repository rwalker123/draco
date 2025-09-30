// Email Routes for Draco Sports Manager
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';

import { ATTACHMENT_CONFIG } from '../config/attachments.js';
import { EmailStatus } from '../interfaces/emailInterfaces.js';
import { EmailComposeSchema, UpsertEmailTemplateSchema } from '@draco/shared-schemas';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import { PaginationHelper } from '../utils/pagination.js';
import { extractAccountParams } from '../utils/paramExtraction.js';

const router = Router();
const emailService = ServiceFactory.getEmailService();
const templateService = ServiceFactory.getEmailTemplateService();
const attachmentService = ServiceFactory.getEmailAttachmentService();
const routeProtection = ServiceFactory.getRouteProtection();

// Configure multer for attachment uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: ATTACHMENT_CONFIG.MAX_FILE_SIZE,
    files: ATTACHMENT_CONFIG.MAX_ATTACHMENTS_PER_EMAIL,
  },
});

/**
 * @route POST /api/accounts/:accountId/emails/compose
 * @desc Compose and send email
 * @access Private - requires ContactAdmin or higher permissions
 */
router.post(
  '/accounts/:accountId/emails/compose',
  authenticateToken,
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const request = EmailComposeSchema.parse(req.body);

    if (!request.subject || !request.body || !request.recipients) {
      throw new ValidationError('Subject, body, and recipients are required');
    }

    const emailId = await emailService.composeAndSendEmail(accountId, userId, request);

    res.status(201).json({
      emailId: emailId.toString(),
      status: request.scheduledSend ? 'scheduled' : 'sending',
    });
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { page = '1', limit = '20', status } = req.query;

    const paginationParams = PaginationHelper.parseParams({ page, limit });
    return emailService
      .listAccountEmails(accountId, paginationParams, status as EmailStatus)
      .then((result) => {
        res.json(result);
      });
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const emailId = BigInt(req.params.emailId);

    return emailService.getEmailDetails(accountId, emailId).then((email) => {
      res.json(email);
    });
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const request = UpsertEmailTemplateSchema.parse(req.body);

    if (!request.name || !request.bodyTemplate) {
      throw new ValidationError('Name and body template are required');
    }

    const template = await templateService.createTemplate(accountId, userId, request);

    res.status(201).json(template);
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { activeOnly = 'false' } = req.query;

    const templates = await templateService.listTemplates(accountId, activeOnly === 'true');

    res.json(templates);
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const templateId = BigInt(req.params.templateId);

    const template = await templateService.getTemplate(templateId, accountId);

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    res.json(template);
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const templateId = BigInt(req.params.templateId);
    const request = UpsertEmailTemplateSchema.parse(req.body);

    const template = await templateService.updateTemplate(templateId, accountId, request);

    res.json(template);
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const templateId = BigInt(req.params.templateId);

    await templateService.deleteTemplate(templateId, accountId);

    res.json(true);
  }),
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const templateId = BigInt(req.params.templateId);
    const variables = req.body.variables || {};

    const preview = await templateService.previewTemplate(templateId, accountId, variables);

    res.json(preview);
  }),
);

// Email Attachment Routes

/**
 * @route POST /api/accounts/:accountId/emails/:emailId/attachments
 * @desc Upload attachments for an email
 * @access Private - requires ContactAdmin or higher permissions
 */
router.post(
  '/accounts/:accountId/emails/:emailId/attachments',
  authenticateToken,
  routeProtection.requirePermission('account.manage'),
  (req: Request, res: Response, next: NextFunction) => {
    upload.array('attachments')(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ message: (err as Error).message });
        return;
      }
      next();
    });
  },
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { emailId } = req.params;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new ValidationError('No files uploaded');
    }

    const files = req.files as Express.Multer.File[];
    const results = await attachmentService.uploadMultipleAttachments(
      accountId.toString(),
      emailId,
      files,
    );

    res.status(201).json(results);
  }),
);

/**
 * @route GET /api/accounts/:accountId/emails/:emailId/attachments
 * @desc List attachments for an email
 * @access Private - requires Contact or higher permissions
 */
router.get(
  '/accounts/:accountId/emails/:emailId/attachments',
  authenticateToken,
  routeProtection.requirePermission('account.view'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { emailId } = req.params;

    const attachments = await attachmentService.getEmailAttachments(accountId.toString(), emailId);

    res.json(attachments);
  }),
);

/**
 * @route GET /api/accounts/:accountId/emails/:emailId/attachments/:attachmentId
 * @desc Download an attachment
 * @access Private - requires Contact or higher permissions
 */
router.get(
  '/accounts/:accountId/emails/:emailId/attachments/:attachmentId',
  authenticateToken,
  routeProtection.requirePermission('account.view'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { emailId, attachmentId } = req.params;

    const { attachment, buffer } = await attachmentService.getAttachment(
      accountId.toString(),
      emailId,
      attachmentId,
    );

    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Length', buffer.length.toString());

    res.send(buffer);
  }),
);

/**
 * @route DELETE /api/accounts/:accountId/emails/:emailId/attachments/:attachmentId
 * @desc Delete an attachment
 * @access Private - requires ContactAdmin or higher permissions
 */
router.delete(
  '/accounts/:accountId/emails/:emailId/attachments/:attachmentId',
  authenticateToken,
  routeProtection.requirePermission('account.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const { emailId, attachmentId } = req.params;

    await attachmentService.deleteAttachment(accountId.toString(), emailId, attachmentId);

    res.json(true);
  }),
);

export default router;
