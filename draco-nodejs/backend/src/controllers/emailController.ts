// Email Controller for Draco Sports Manager
// Follows SRP - handles HTTP requests only

import { Request, Response } from 'express';
import { EmailService } from '../services/emailService.js';
import { EmailTemplateService } from '../services/emailTemplateService.js';
import {
  EmailComposeRequest,
  EmailTemplateCreateRequest,
  EmailTemplateUpdateRequest,
} from '../interfaces/emailInterfaces.js';
import { EmailQueryFilter } from '../interfaces/emailInterfaces.js';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import { extractAccountParams } from '../utils/paramExtraction.js';
import { PaginationHelper } from '../utils/pagination.js';
import prisma from '../lib/prisma.js';

export class EmailController {
  private emailService: EmailService;
  private templateService: EmailTemplateService;

  constructor() {
    this.emailService = new EmailService();
    this.templateService = new EmailTemplateService();
  }

  /**
   * POST /api/accounts/:accountId/emails/compose
   * Compose and send email
   */
  composeEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = extractAccountParams(req.params);
      const userId = req.user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const request: EmailComposeRequest = req.body;

      // Basic validation
      if (!request.subject || !request.body || !request.recipients) {
        throw new ValidationError('Subject, body, and recipients are required');
      }

      // Compose and send email
      const emailId = await this.emailService.composeAndSendEmail(accountId, userId, request);

      res.status(201).json({
        success: true,
        data: {
          emailId: emailId.toString(),
          status: request.scheduledSend ? 'scheduled' : 'sending',
        },
      });
    } catch (error) {
      console.error('Error composing email:', error);

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: (error as Error).message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to compose email',
        });
      }
    }
  };

  /**
   * GET /api/accounts/:accountId/emails
   * List emails for account
   */
  listEmails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = extractAccountParams(req.params);
      const { page = '1', limit = '20', status } = req.query;

      const paginationParams = PaginationHelper.parseParams({ page, limit });
      const pagination = {
        page: paginationParams.page,
        limit: Math.min(paginationParams.limit, 100),
        offset: paginationParams.skip,
      };

      const whereClause: EmailQueryFilter = {
        account_id: accountId,
      };

      if (status && typeof status === 'string') {
        whereClause.status = status;
      }

      const [emails, total] = await Promise.all([
        prisma.emails.findMany({
          where: whereClause,
          include: {
            created_by: {
              select: {
                username: true,
              },
            },
            template: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip: pagination.offset,
          take: pagination.limit,
        }),
        prisma.emails.count({ where: whereClause }),
      ]);

      const paginationInfo = PaginationHelper.createMeta(pagination.page, pagination.limit, total);

      res.json({
        success: true,
        data: {
          emails: emails.map((email) => ({
            id: email.id.toString(),
            subject: email.subject,
            status: email.status,
            createdAt: email.created_at,
            sentAt: email.sent_at,
            totalRecipients: email.total_recipients,
            successfulDeliveries: email.successful_deliveries,
            failedDeliveries: email.failed_deliveries,
            openCount: email.open_count,
            clickCount: email.click_count,
            createdBy: email.created_by?.username,
            templateName: email.template?.name,
          })),
          pagination: paginationInfo,
        },
      });
    } catch (error) {
      console.error('Error listing emails:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list emails',
      });
    }
  };

  /**
   * GET /api/accounts/:accountId/emails/:emailId
   * Get email details
   */
  getEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = extractAccountParams(req.params);
      const emailId = BigInt(req.params.emailId);

      const email = await prisma.emails.findFirst({
        where: {
          id: emailId,
          account_id: accountId,
        },
        include: {
          created_by: {
            select: {
              username: true,
            },
          },
          template: true,
          recipients: {
            include: {
              contact: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
          attachments: true,
        },
      });

      if (!email) {
        throw new NotFoundError('Email not found');
      }

      res.json({
        success: true,
        data: {
          id: email.id.toString(),
          subject: email.subject,
          bodyHtml: email.body_html,
          bodyText: email.body_text,
          status: email.status,
          createdAt: email.created_at,
          sentAt: email.sent_at,
          scheduledSendAt: email.scheduled_send_at,
          totalRecipients: email.total_recipients,
          successfulDeliveries: email.successful_deliveries,
          failedDeliveries: email.failed_deliveries,
          bounceCount: email.bounce_count,
          openCount: email.open_count,
          clickCount: email.click_count,
          createdBy: email.created_by?.username,
          template: email.template
            ? {
                id: email.template.id.toString(),
                name: email.template.name,
              }
            : null,
          recipients: email.recipients.map((recipient) => ({
            id: recipient.id.toString(),
            emailAddress: recipient.email_address,
            contactName: recipient.contact_name,
            recipientType: recipient.recipient_type,
            status: recipient.status,
            sentAt: recipient.sent_at,
            deliveredAt: recipient.delivered_at,
            openedAt: recipient.opened_at,
            clickedAt: recipient.clicked_at,
            bounceReason: recipient.bounce_reason,
            errorMessage: recipient.error_message,
          })),
          attachments: email.attachments.map((attachment) => ({
            id: attachment.id.toString(),
            filename: attachment.filename,
            originalName: attachment.original_name,
            fileSize: attachment.file_size,
            mimeType: attachment.mime_type,
            uploadedAt: attachment.uploaded_at,
          })),
        },
      });
    } catch (error) {
      console.error('Error getting email:', error);

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: (error as Error).message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to get email',
        });
      }
    }
  };

  /**
   * POST /api/accounts/:accountId/email-templates
   * Create email template
   */
  createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = extractAccountParams(req.params);
      const userId = req.user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const request: EmailTemplateCreateRequest = req.body;

      // Basic validation
      if (!request.name || !request.bodyTemplate) {
        throw new ValidationError('Name and body template are required');
      }

      const template = await this.templateService.createTemplate(accountId, userId, request);

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error('Error creating template:', error);

      if (
        error instanceof ValidationError ||
        (error instanceof Error && error.message.includes('validation failed'))
      ) {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create template',
        });
      }
    }
  };

  /**
   * GET /api/accounts/:accountId/email-templates
   * List email templates
   */
  listTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = extractAccountParams(req.params);
      const { activeOnly = 'false' } = req.query;

      const templates = await this.templateService.listTemplates(accountId, activeOnly === 'true');

      res.json({
        success: true,
        data: {
          templates,
          commonVariables: this.templateService.getCommonVariables(),
        },
      });
    } catch (error) {
      console.error('Error listing templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list templates',
      });
    }
  };

  /**
   * GET /api/accounts/:accountId/email-templates/:templateId
   * Get email template
   */
  getTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = extractAccountParams(req.params);
      const templateId = BigInt(req.params.templateId);

      const template = await this.templateService.getTemplate(templateId, accountId);

      if (!template) {
        throw new NotFoundError('Template not found');
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error('Error getting template:', error);

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: (error as Error).message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to get template',
        });
      }
    }
  };

  /**
   * PUT /api/accounts/:accountId/email-templates/:templateId
   * Update email template
   */
  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = extractAccountParams(req.params);
      const templateId = BigInt(req.params.templateId);
      const request: EmailTemplateUpdateRequest = req.body;

      const template = await this.templateService.updateTemplate(templateId, accountId, request);

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error('Error updating template:', error);

      if (
        error instanceof ValidationError ||
        (error instanceof Error && error.message.includes('validation failed'))
      ) {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        });
      } else if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update template',
        });
      }
    }
  };

  /**
   * DELETE /api/accounts/:accountId/email-templates/:templateId
   * Delete email template
   */
  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = extractAccountParams(req.params);
      const templateId = BigInt(req.params.templateId);

      await this.templateService.deleteTemplate(templateId, accountId);

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting template:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete template',
        });
      }
    }
  };

  /**
   * POST /api/accounts/:accountId/email-templates/:templateId/preview
   * Preview template with variables
   */
  previewTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accountId } = extractAccountParams(req.params);
      const templateId = BigInt(req.params.templateId);
      const variables = req.body.variables || {};

      const preview = await this.templateService.previewTemplate(templateId, accountId, variables);

      res.json({
        success: true,
        data: preview,
      });
    } catch (error) {
      console.error('Error previewing template:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to preview template',
        });
      }
    }
  };
}
