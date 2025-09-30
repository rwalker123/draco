import {
  dbEmail,
  dbEmailAttachment,
  dbEmailAttachmentWithEmail,
  dbAttachmentForSending,
  dbCreateEmailAttachmentInput,
} from '../types/dbTypes.js';

export interface IEmailAttachmentRepository {
  findEmail(accountId: bigint, emailId: bigint): Promise<dbEmail | null>;
  countAttachments(emailId: bigint): Promise<number>;
  createAttachment(data: dbCreateEmailAttachmentInput): Promise<dbEmailAttachment>;
  findAttachment(
    accountId: bigint,
    emailId: bigint,
    attachmentId: bigint,
  ): Promise<dbEmailAttachmentWithEmail | null>;
  findAttachments(emailId: bigint): Promise<dbEmailAttachment[]>;
  deleteAttachment(attachmentId: bigint): Promise<void>;
  deleteAttachments(emailId: bigint): Promise<void>;
  findAttachmentsForSending(emailId: bigint): Promise<dbAttachmentForSending[]>;
  findAttachmentsForCopy(fromEmailId: bigint, accountId: bigint): Promise<dbEmailAttachment[]>;
}
