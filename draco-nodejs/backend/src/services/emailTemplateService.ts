// Email Template Service for Draco Sports Manager
// Follows SRP - handles template processing and management only

import {
  IEmailTemplateEngine,
  TemplateValidationResult,
  EmailTemplate,
  EmailTemplateCreateRequest,
  EmailTemplateUpdateRequest,
  EmailTemplateDbRecord,
} from '../interfaces/emailInterfaces.js';
import prisma from '../lib/prisma.js';

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
   * Create new email template
   */
  async createTemplate(
    accountId: bigint,
    createdByUserId: string,
    request: EmailTemplateCreateRequest,
  ): Promise<EmailTemplate> {
    // Validate template syntax
    const subjectValidation = request.subjectTemplate
      ? this.validateTemplate(request.subjectTemplate)
      : { isValid: true, errors: [], variables: [] };

    const bodyValidation = this.validateTemplate(request.bodyTemplate);

    if (!subjectValidation.isValid || !bodyValidation.isValid) {
      const allErrors = [...subjectValidation.errors, ...bodyValidation.errors];
      throw new Error(`Template validation failed: ${allErrors.join(', ')}`);
    }

    const template = await prisma.email_templates.create({
      data: {
        account_id: accountId,
        name: request.name,
        description: request.description,
        subject_template: request.subjectTemplate,
        body_template: request.bodyTemplate,
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
    request: EmailTemplateUpdateRequest,
  ): Promise<EmailTemplate> {
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
  async getTemplate(templateId: bigint, accountId: bigint): Promise<EmailTemplate | null> {
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
  async listTemplates(accountId: bigint, activeOnly: boolean = false): Promise<EmailTemplate[]> {
    const templates = await prisma.email_templates.findMany({
      where: {
        account_id: accountId,
        ...(activeOnly && { is_active: true }),
      },
      orderBy: [{ name: 'asc' }],
    });

    return templates.map(this.mapToEmailTemplate);
  }

  /**
   * Delete template (soft delete by setting inactive)
   */
  async deleteTemplate(templateId: bigint, accountId: bigint): Promise<void> {
    await prisma.email_templates.update({
      where: {
        id: templateId,
        account_id: accountId, // Ensure account boundary
      },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Preview template with sample variables
   */
  async previewTemplate(
    templateId: bigint,
    accountId: bigint,
    variables: Record<string, unknown>,
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
  private mapToEmailTemplate(template: EmailTemplateDbRecord): EmailTemplate {
    return {
      id: template.id,
      accountId: template.account_id,
      name: template.name,
      description: template.description || undefined,
      subjectTemplate: template.subject_template || undefined,
      bodyTemplate: template.body_template,
      createdByUserId: template.created_by_user_id || undefined,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      isActive: template.is_active,
    };
  }
}
