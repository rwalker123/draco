// Email Template Service
// Follows SRP - handles template processing and management only

import { IEmailTemplateEngine, TemplateValidationResult } from '../interfaces/emailInterfaces.js';
import {
  EmailTemplatesListType,
  EmailTemplateType,
  UpsertEmailTemplateType,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { IEmailTemplateRepository } from '../repositories/interfaces/IEmailTemplateRepository.js';
import {
  dbCreateEmailTemplateInput,
  dbUpdateEmailTemplateData,
} from '../repositories/types/dbTypes.js';
import { EmailTemplateResponseFormatter } from '../responseFormatters/EmailTemplateResponseFormatter.js';

export class EmailTemplateService implements IEmailTemplateEngine {
  private emailTemplateRepository: IEmailTemplateRepository;

  constructor() {
    this.emailTemplateRepository = RepositoryFactory.getEmailTemplateRepository();
  }

  /**
   * Process template with variable substitution
   */
  processTemplate(template: string, variables: Record<string, unknown>): string {
    let processed = template;

    Object.keys(variables).forEach((key) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const value = variables[key] ?? '';
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
      const variableMatches = template.match(/{{[^}]*}}/g);

      if (variableMatches) {
        for (const match of variableMatches) {
          const variableName = match.replace(/[{}]/g, '').trim();

          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variableName)) {
            errors.push(`Invalid variable name: ${variableName}`);
          } else if (!variables.includes(variableName)) {
            variables.push(variableName);
          }
        }
      }

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

  private validateInputFields(request: UpsertEmailTemplateType): void {
    if (request.name !== undefined) {
      if (request.name.length > 100) {
        throw new Error('Template name must be 100 characters or less');
      }
      if (request.name.trim().length === 0) {
        throw new Error('Template name cannot be empty');
      }
    }

    if (request.description !== undefined && request.description.length > 500) {
      throw new Error('Template description must be 500 characters or less');
    }

    if (request.subjectTemplate !== undefined && request.subjectTemplate.length > 255) {
      throw new Error('Subject template must be 255 characters or less');
    }

    if (request.bodyTemplate !== undefined) {
      if (request.bodyTemplate.length > 50000) {
        throw new Error('Body template must be 50,000 characters or less');
      }
      if (request.bodyTemplate.trim().length === 0) {
        throw new Error('Body template cannot be empty');
      }
    }
  }

  async createTemplate(
    accountId: bigint,
    createdByUserId: string,
    request: UpsertEmailTemplateType,
  ): Promise<EmailTemplateType> {
    this.validateInputFields(request);

    const subjectValidation = request.subjectTemplate
      ? this.validateTemplate(request.subjectTemplate)
      : { isValid: true, errors: [], variables: [] };

    const bodyValidation = this.validateTemplate(request.bodyTemplate || '');

    if (!subjectValidation.isValid || !bodyValidation.isValid) {
      const allErrors = [...subjectValidation.errors, ...bodyValidation.errors];
      throw new Error(`Template validation failed: ${allErrors.join(', ')}`);
    }

    const payload: dbCreateEmailTemplateInput = {
      account_id: accountId,
      name: request.name || 'Untitled Template',
      description: request.description || '',
      subject_template: request.subjectTemplate || '',
      body_template: request.bodyTemplate || '',
      created_by_user_id: createdByUserId,
      is_active: true,
    };

    const template = await this.emailTemplateRepository.createTemplate(payload);
    return EmailTemplateResponseFormatter.formatEmailTemplate(template);
  }

  async updateTemplate(
    templateId: bigint,
    accountId: bigint,
    request: UpsertEmailTemplateType,
  ): Promise<EmailTemplateType> {
    this.validateInputFields(request);

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

    const updateData: dbUpdateEmailTemplateData = { updated_at: new Date() };

    if (request.name !== undefined) {
      updateData.name = request.name;
    }
    if (request.description !== undefined) {
      updateData.description = request.description;
    }
    if (request.subjectTemplate !== undefined) {
      updateData.subject_template = request.subjectTemplate;
    }
    if (request.bodyTemplate !== undefined) {
      updateData.body_template = request.bodyTemplate;
    }
    if (request.isActive !== undefined) {
      updateData.is_active = request.isActive;
    }

    const template = await this.emailTemplateRepository.updateTemplate(
      templateId,
      accountId,
      updateData,
    );

    return EmailTemplateResponseFormatter.formatEmailTemplate(template);
  }

  async getTemplate(templateId: bigint, accountId: bigint): Promise<EmailTemplateType | null> {
    const template = await this.emailTemplateRepository.findTemplateById(templateId, accountId);
    return template ? EmailTemplateResponseFormatter.formatEmailTemplate(template) : null;
  }

  async listTemplates(
    accountId: bigint,
    activeOnly: boolean = false,
  ): Promise<EmailTemplatesListType> {
    const templates = await this.emailTemplateRepository.listTemplates(accountId, activeOnly);

    return {
      templates: EmailTemplateResponseFormatter.formatEmailTemplates(templates),
      commonVariables: this.getCommonVariables(),
    };
  }

  async deleteTemplate(templateId: bigint, accountId: bigint): Promise<void> {
    await this.emailTemplateRepository.deleteTemplate(templateId, accountId);
  }

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
}
