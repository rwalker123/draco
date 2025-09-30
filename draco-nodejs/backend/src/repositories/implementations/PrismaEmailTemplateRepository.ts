import { PrismaClient } from '@prisma/client';
import { IEmailTemplateRepository } from '../interfaces/IEmailTemplateRepository.js';
import {
  dbEmailTemplate,
  dbCreateEmailTemplateInput,
  dbUpdateEmailTemplateData,
} from '../types/dbTypes.js';

export class PrismaEmailTemplateRepository implements IEmailTemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  createTemplate(data: dbCreateEmailTemplateInput): Promise<dbEmailTemplate> {
    return this.prisma.email_templates.create({
      data,
      select: {
        id: true,
        account_id: true,
        name: true,
        description: true,
        subject_template: true,
        body_template: true,
        created_by_user_id: true,
        created_at: true,
        updated_at: true,
        is_active: true,
      },
    });
  }

  updateTemplate(
    templateId: bigint,
    accountId: bigint,
    data: dbUpdateEmailTemplateData,
  ): Promise<dbEmailTemplate> {
    return this.prisma.email_templates.update({
      where: {
        id: templateId,
        account_id: accountId,
      },
      data,
      select: {
        id: true,
        account_id: true,
        name: true,
        description: true,
        subject_template: true,
        body_template: true,
        created_by_user_id: true,
        created_at: true,
        updated_at: true,
        is_active: true,
      },
    });
  }

  findTemplateById(templateId: bigint, accountId: bigint): Promise<dbEmailTemplate | null> {
    return this.prisma.email_templates.findFirst({
      where: {
        id: templateId,
        account_id: accountId,
      },
      select: {
        id: true,
        account_id: true,
        name: true,
        description: true,
        subject_template: true,
        body_template: true,
        created_by_user_id: true,
        created_at: true,
        updated_at: true,
        is_active: true,
      },
    });
  }

  listTemplates(accountId: bigint, activeOnly: boolean = false): Promise<dbEmailTemplate[]> {
    return this.prisma.email_templates.findMany({
      where: {
        account_id: accountId,
        ...(activeOnly && { is_active: true }),
      },
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        account_id: true,
        name: true,
        description: true,
        subject_template: true,
        body_template: true,
        created_by_user_id: true,
        created_at: true,
        updated_at: true,
        is_active: true,
      },
    });
  }

  async deleteTemplate(templateId: bigint, accountId: bigint): Promise<void> {
    await this.prisma.email_templates.delete({
      where: {
        id: templateId,
        account_id: accountId,
      },
    });
  }
}
