import { PrismaClient } from '@prisma/client';
import { IEmailAttachmentRepository } from '../interfaces/IEmailAttachmentRepository.js';
import {
  dbEmail,
  dbEmailAttachment,
  dbEmailAttachmentWithEmail,
  dbAttachmentForSending,
  dbCreateEmailAttachmentInput,
} from '../types/dbTypes.js';

export class PrismaEmailAttachmentRepository implements IEmailAttachmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findEmail(accountId: bigint, emailId: bigint): Promise<dbEmail | null> {
    return this.prisma.emails.findFirst({
      where: {
        id: emailId,
        account_id: accountId,
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

  countAttachments(emailId: bigint): Promise<number> {
    return this.prisma.email_attachments.count({ where: { email_id: emailId } });
  }

  createAttachment(data: dbCreateEmailAttachmentInput): Promise<dbEmailAttachment> {
    return this.prisma.email_attachments.create({
      data,
      select: {
        id: true,
        email_id: true,
        filename: true,
        original_name: true,
        file_size: true,
        mime_type: true,
        uploaded_at: true,
        storage_path: true,
      },
    });
  }

  findAttachment(
    accountId: bigint,
    emailId: bigint,
    attachmentId: bigint,
  ): Promise<dbEmailAttachmentWithEmail | null> {
    return this.prisma.email_attachments.findFirst({
      where: {
        id: attachmentId,
        email_id: emailId,
        email: {
          account_id: accountId,
        },
      },
      include: {
        email: true,
      },
    });
  }

  findAttachments(emailId: bigint): Promise<dbEmailAttachment[]> {
    return this.prisma.email_attachments.findMany({
      where: { email_id: emailId },
      orderBy: { uploaded_at: 'asc' },
      select: {
        id: true,
        email_id: true,
        filename: true,
        original_name: true,
        file_size: true,
        mime_type: true,
        uploaded_at: true,
        storage_path: true,
      },
    });
  }

  deleteAttachment(attachmentId: bigint): Promise<void> {
    return this.prisma.email_attachments
      .delete({ where: { id: attachmentId } })
      .then(() => undefined);
  }

  deleteAttachments(emailId: bigint): Promise<void> {
    return this.prisma.email_attachments
      .deleteMany({ where: { email_id: emailId } })
      .then(() => undefined);
  }

  findAttachmentsForSending(emailId: bigint): Promise<dbAttachmentForSending[]> {
    return this.prisma.email_attachments.findMany({
      where: { email_id: emailId },
      select: {
        id: true,
        email_id: true,
        filename: true,
        original_name: true,
        file_size: true,
        mime_type: true,
        storage_path: true,
        email: {
          select: {
            account_id: true,
          },
        },
      },
    });
  }

  findAttachmentsForCopy(fromEmailId: bigint, accountId: bigint): Promise<dbEmailAttachment[]> {
    return this.prisma.email_attachments.findMany({
      where: {
        email_id: fromEmailId,
        email: {
          account_id: accountId,
        },
      },
      select: {
        id: true,
        email_id: true,
        filename: true,
        original_name: true,
        file_size: true,
        mime_type: true,
        uploaded_at: true,
        storage_path: true,
      },
    });
  }
}
