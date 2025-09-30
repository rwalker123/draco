import {
  dbEmailTemplate,
  dbCreateEmailTemplateInput,
  dbUpdateEmailTemplateData,
} from '../types/dbTypes.js';

export interface IEmailTemplateRepository {
  createTemplate(data: dbCreateEmailTemplateInput): Promise<dbEmailTemplate>;
  updateTemplate(
    templateId: bigint,
    accountId: bigint,
    data: dbUpdateEmailTemplateData,
  ): Promise<dbEmailTemplate>;
  findTemplateById(templateId: bigint, accountId: bigint): Promise<dbEmailTemplate | null>;
  listTemplates(accountId: bigint, activeOnly?: boolean): Promise<dbEmailTemplate[]>;
  deleteTemplate(templateId: bigint, accountId: bigint): Promise<void>;
}
