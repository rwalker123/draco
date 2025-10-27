import { Prisma, PrismaClient } from '@prisma/client';
import { IEmailRepository } from '../interfaces/IEmailRepository.js';
import {
  dbBaseContact,
  dbEmail,
  dbEmailDetails,
  dbEmailRecipient,
  dbEmailSummary,
  dbEmailWithAccount,
  dbScheduledEmail,
  dbCreateEmailInput,
  dbCreateEmailRecipientInput,
  dbEmailUpdateData,
  dbEmailListOptions,
  dbEmailRecipientUpdateData,
  dbEmailRecipientBulkUpdateData,
  dbRecipientStatusCount,
} from '../types/dbTypes.js';

export class PrismaEmailRepository implements IEmailRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createEmail(data: dbCreateEmailInput): Promise<dbEmail> {
    return this.prisma.emails.create({
      data: {
        account_id: data.account_id,
        created_by_user_id: data.created_by_user_id,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text,
        template_id: data.template_id ?? null,
        status: data.status,
        scheduled_send_at: data.scheduled_send_at ?? null,
        created_at: data.created_at,
        sender_contact_id: data.sender_contact_id ?? null,
        sender_contact_name: data.sender_contact_name ?? null,
        reply_to_email: data.reply_to_email ?? null,
        from_name_override: data.from_name_override ?? null,
      },
      select: {
        id: true,
        account_id: true,
        created_by_user_id: true,
        sender_contact_id: true,
        sender_contact_name: true,
        reply_to_email: true,
        from_name_override: true,
        subject: true,
        body_html: true,
        body_text: true,
        template_id: true,
        status: true,
        scheduled_send_at: true,
        created_at: true,
        sent_at: true,
        total_recipients: true,
        successful_deliveries: true,
        failed_deliveries: true,
        bounce_count: true,
        open_count: true,
        click_count: true,
      },
    });
  }

  async findEmailWithAccount(emailId: bigint): Promise<dbEmailWithAccount | null> {
    return this.prisma.emails.findUnique({
      where: { id: emailId },
      include: {
        accounts: true,
      },
    });
  }

  async createEmailRecipients(recipients: dbCreateEmailRecipientInput[]): Promise<void> {
    if (recipients.length === 0) {
      return;
    }

    await this.prisma.email_recipients.createMany({
      data: recipients.map((recipient) => ({
        email_id: recipient.email_id,
        contact_id: recipient.contact_id,
        email_address: recipient.email_address,
        contact_name: recipient.contact_name,
        recipient_type: recipient.recipient_type,
        status: 'pending',
      })),
    });
  }

  async updateEmail(emailId: bigint, data: dbEmailUpdateData): Promise<void> {
    if (Object.keys(data).length === 0) {
      return;
    }

    await this.prisma.emails.update({
      where: { id: emailId },
      data,
    });
  }

  async getEmailDetails(accountId: bigint, emailId: bigint): Promise<dbEmailDetails | null> {
    return this.prisma.emails.findFirst({
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
  }

  async listAccountEmails(
    accountId: bigint,
    options: dbEmailListOptions,
  ): Promise<{ emails: dbEmailSummary[]; total: number }> {
    const where: Prisma.emailsWhereInput = {
      account_id: accountId,
    };

    if (options.status) {
      where.status = options.status;
    }

    const [emails, total] = await Promise.all([
      this.prisma.emails.findMany({
        where,
        select: {
          id: true,
          subject: true,
          status: true,
          created_at: true,
          sent_at: true,
          total_recipients: true,
          successful_deliveries: true,
          failed_deliveries: true,
          open_count: true,
          click_count: true,
          sender_contact_name: true,
          reply_to_email: true,
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
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.emails.count({ where }),
    ]);

    return { emails, total };
  }

  async findScheduledEmailsReady(now: Date): Promise<dbScheduledEmail[]> {
    return this.prisma.emails.findMany({
      where: {
        status: 'scheduled',
        scheduled_send_at: {
          lte: now,
        },
      },
      orderBy: {
        scheduled_send_at: 'asc',
      },
      select: {
        id: true,
        account_id: true,
        subject: true,
        body_html: true,
        status: true,
        scheduled_send_at: true,
        sender_contact_id: true,
        sender_contact_name: true,
        reply_to_email: true,
        from_name_override: true,
      },
    });
  }

  async updateEmailStatus(emailId: bigint, status: string, sentAt?: Date | null): Promise<void> {
    await this.prisma.emails.update({
      where: { id: emailId },
      data: {
        status,
        sent_at: sentAt ?? undefined,
      },
    });
  }

  async getEmailRecipients(emailId: bigint): Promise<dbEmailRecipient[]> {
    return this.prisma.email_recipients.findMany({
      where: { email_id: emailId },
      select: {
        id: true,
        email_id: true,
        contact_id: true,
        email_address: true,
        contact_name: true,
        recipient_type: true,
        status: true,
        sent_at: true,
        delivered_at: true,
        opened_at: true,
        clicked_at: true,
        bounce_reason: true,
        error_message: true,
      },
    });
  }

  async updateRecipientStatus(
    emailId: bigint,
    contactId: bigint,
    data: dbEmailRecipientUpdateData,
  ): Promise<void> {
    await this.prisma.email_recipients.updateMany({
      where: {
        email_id: emailId,
        contact_id: contactId,
      },
      data,
    });
  }

  async updateRecipientsStatus(
    emailId: bigint,
    data: dbEmailRecipientBulkUpdateData,
  ): Promise<void> {
    await this.prisma.email_recipients.updateMany({
      where: { email_id: emailId },
      data,
    });
  }

  async getRecipientStatusCounts(emailId: bigint): Promise<dbRecipientStatusCount[]> {
    const grouped = await this.prisma.email_recipients.groupBy({
      by: ['status'],
      where: { email_id: emailId },
      _count: {
        status: true,
      },
    });

    return grouped.map((entry) => ({
      status: entry.status,
      count: entry._count.status,
    }));
  }

  async findContactsByIds(accountId: bigint, contactIds: bigint[]): Promise<dbBaseContact[]> {
    if (contactIds.length === 0) {
      return [];
    }

    return this.prisma.contacts.findMany({
      where: {
        id: { in: contactIds },
        creatoraccountid: accountId,
        email: { not: null },
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone1: true,
        phone2: true,
        phone3: true,
        streetaddress: true,
        city: true,
        state: true,
        zip: true,
        dateofbirth: true,
        middlename: true,
        creatoraccountid: true,
        userid: true,
      },
    });
  }

  async deleteEmail(emailId: bigint, accountId: bigint): Promise<void> {
    await this.prisma.emails.deleteMany({
      where: {
        id: emailId,
        account_id: accountId,
      },
    });
  }
}
