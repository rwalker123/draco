import { EmailTemplateType } from '@draco/shared-schemas';
import { dbEmailTemplate } from '../repositories/types/dbTypes.js';
import { DateUtils } from '../utils/dateUtils.js';

export class EmailTemplateResponseFormatter {
  static formatEmailTemplate(template: dbEmailTemplate): EmailTemplateType {
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

  static formatEmailTemplates(templates: dbEmailTemplate[]): EmailTemplateType[] {
    return templates.map((template) => this.formatEmailTemplate(template));
  }
}
