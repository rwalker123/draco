// Email Template Service for Draco Sports Manager
// Follows SRP - handles template processing and management only

import prisma from '../lib/prisma.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  IEmailTemplateEngine,
  TemplateValidationResult,
  EmailTemplateDbRecord,
} from '../interfaces/emailInterfaces.js';
import {
  EmailTemplatesListType,
  EmailTemplateType,
  UpsertEmailTemplateType,
} from '@draco/shared-schemas';

export class EmailTemplateService implements IEmailTemplateEngine {
  /**
   * Process template with variable substitution
   */
  processTemplate(template: string, variables: Record<string, unknown>): string {
    let processed = template;

    // Replace variables in {{variableName}} format
    Object.keys(variables).forEach((key) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const value = variables[key] || '';
      processed = processed.replace(placeholder, String(value));
    });

    return processed;
  }

  /**
   * Validate template syntax and extract variables
   */
  validateTemplate(template: string): TemplateValidationResult {
    const errors: string[] = [];
    const variables: string[] = [];

    try {
      // Find all variables in {{variable}} format
      const variableMatches = template.match(/{{[^}]*}}/g);

      if (variableMatches) {
        for (const match of variableMatches) {
          // Extract variable name
          const variableName = match.replace(/[{}]/g, '').trim();

          // Validate variable name (alphanumeric and underscore only)
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variableName)) {
            errors.push(`Invalid variable name: ${variableName}`);
          } else {
            if (!variables.includes(variableName)) {
              variables.push(variableName);
            }
          }
        }
      }

      // Check for unclosed brackets
      const openBrackets = (template.match(/{{/g) || []).length;
      const closeBrackets = (template.match(/}}/g) || []).length;

      if (openBrackets !== closeBrackets) {
        errors.push('Mismatched template brackets');
      }

      return {
        isValid: errors.length === 0,
        errors,
        variables,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Template validation error: ${error}`],
        variables: [],
      };
    }
  }

  /**
   * Validate input fields for security and constraints
   */
  private validateInputFields(request: UpsertEmailTemplateType): void {
    if ('name' in request && request.name !== undefined) {
      if (request.name.length > 100) {
        throw new Error('Template name must be 100 characters or less');
      }
      if (request.name.trim().length === 0) {
        throw new Error('Template name cannot be empty');
      }
    }

    if ('description' in request && request.description !== undefined) {
      if (request.description.length > 500) {
        throw new Error('Template description must be 500 characters or less');
      }
    }

    if ('subjectTemplate' in request && request.subjectTemplate !== undefined) {
      if (request.subjectTemplate.length > 255) {
        throw new Error('Subject template must be 255 characters or less');
      }
    }

    if ('bodyTemplate' in request && request.bodyTemplate !== undefined) {
      if (request.bodyTemplate.length > 50000) {
        throw new Error('Body template must be 50,000 characters or less');
      }
      if (request.bodyTemplate.trim().length === 0) {
        throw new Error('Body template cannot be empty');
      }
    }
  }

  /**
   * Create new email template
   */
  async createTemplate(
    accountId: bigint,
    createdByUserId: string,
    request: UpsertEmailTemplateType,
  ): Promise<EmailTemplateType> {
    // Validate input fields
    this.validateInputFields(request);

    // Validate template syntax
    const subjectValidation = request.subjectTemplate
      ? this.validateTemplate(request.subjectTemplate)
      : { isValid: true, errors: [], variables: [] };

    const bodyValidation = this.validateTemplate(request.bodyTemplate || '');

    if (!subjectValidation.isValid || !bodyValidation.isValid) {
      const allErrors = [...subjectValidation.errors, ...bodyValidation.errors];
      throw new Error(`Template validation failed: ${allErrors.join(', ')}`);
    }

    const template = await prisma.email_templates.create({
      data: {
        account_id: accountId,
        name: request.name || 'Untitled Template',
        description: request.description || '',
        subject_template: request.subjectTemplate || '',
        body_template: request.bodyTemplate || '',
        created_by_user_id: createdByUserId,
        is_active: true,
      },
    });

    return this.mapToEmailTemplate(template);
  }

  /**
   * Update existing email template
   */
  async updateTemplate(
    templateId: bigint,
    accountId: bigint,
    request: UpsertEmailTemplateType,
  ): Promise<EmailTemplateType> {
    // Validate input fields
    this.validateInputFields(request);

    // Validate template syntax if templates are being updated
    if (request.subjectTemplate !== undefined) {
      const validation = this.validateTemplate(request.subjectTemplate);
      if (!validation.isValid) {
        throw new Error(`Subject template validation failed: ${validation.errors.join(', ')}`);
      }
    }

    if (request.bodyTemplate !== undefined) {
      const validation = this.validateTemplate(request.bodyTemplate);
      if (!validation.isValid) {
        throw new Error(`Body template validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const template = await prisma.email_templates.update({
      where: {
        id: templateId,
        account_id: accountId, // Ensure account boundary
      },
      data: {
        ...(request.name !== undefined && { name: request.name }),
        ...(request.description !== undefined && { description: request.description }),
        ...(request.subjectTemplate !== undefined && { subject_template: request.subjectTemplate }),
        ...(request.bodyTemplate !== undefined && { body_template: request.bodyTemplate }),
        ...(request.isActive !== undefined && { is_active: request.isActive }),
        updated_at: new Date(),
      },
    });

    return this.mapToEmailTemplate(template);
  }

  /**
   * Get template by ID (with account boundary check)
   */
  async getTemplate(templateId: bigint, accountId: bigint): Promise<EmailTemplateType | null> {
    const template = await prisma.email_templates.findFirst({
      where: {
        id: templateId,
        account_id: accountId,
      },
    });

    return template ? this.mapToEmailTemplate(template) : null;
  }

  /**
   * List templates for account
   */
  async listTemplates(
    accountId: bigint,
    activeOnly: boolean = false,
  ): Promise<EmailTemplatesListType> {
    const templates = await prisma.email_templates.findMany({
      where: {
        account_id: accountId,
        ...(activeOnly && { is_active: true }),
      },
      orderBy: [{ name: 'asc' }],
    });

    return {
      templates: templates.map(this.mapToEmailTemplate),
      commonVariables: this.getCommonVariables(),
    };
  }

  /**
   * Delete template (permanent delete)
   */
  async deleteTemplate(templateId: bigint, accountId: bigint): Promise<void> {
    await prisma.email_templates.delete({
      where: {
        id: templateId,
        account_id: accountId, // Ensure account boundary
      },
    });
  }

  /**
   * Preview template with sample variables
   */
  async previewTemplate(
    templateId: bigint,
    accountId: bigint,
    variables: Record<string, string>,
  ): Promise<{ subject: string; body: string }> {
    const template = await this.getTemplate(templateId, accountId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const subject = template.subjectTemplate
      ? this.processTemplate(template.subjectTemplate, variables)
      : '';

    const body = this.processTemplate(template.bodyTemplate, variables);

    return { subject, body };
  }

  /**
   * Get common template variables for the account
   */
  getCommonVariables(): Record<string, string> {
    return {
      firstName: 'Contact first name',
      lastName: 'Contact last name',
      parentName: 'Parent/guardian name',
      playerName: 'Player name',
      teamName: 'Team name',
      leagueName: 'League name',
      seasonName: 'Season name',
      gameDate: 'Game date',
      gameTime: 'Game time',
      fieldName: 'Field/venue name',
      accountName: 'Account/organization name',
      managerName: 'Team manager name',
      coachName: 'Coach name',
    };
  }

  /**
   * Map database record to EmailTemplate interface
   */
  private mapToEmailTemplate(template: EmailTemplateDbRecord): EmailTemplateType {
    return {
      id: template.id.toString(),
      accountId: template.account_id.toString(),
      name: template.name,
      description: template.description || undefined,
      subjectTemplate: template.subject_template || undefined,
      bodyTemplate: template.body_template,
      createdByUserId: template.created_by_user_id || undefined,
      createdAt: DateUtils.formatDateTimeForResponse(template.created_at) || '',
      updatedAt: DateUtils.formatDateTimeForResponse(template.updated_at) || '',
      isActive: template.is_active,
    };
  }
}
