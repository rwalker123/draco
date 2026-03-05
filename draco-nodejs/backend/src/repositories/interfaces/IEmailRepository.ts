import {
  dbBaseContact,
  dbBouncedContact,
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

export interface IEmailRepository {
  createEmail(data: dbCreateEmailInput): Promise<dbEmail>;
  findEmailWithAccount(emailId: bigint): Promise<dbEmailWithAccount | null>;
  createEmailRecipients(recipients: dbCreateEmailRecipientInput[]): Promise<void>;
  updateEmail(emailId: bigint, data: dbEmailUpdateData): Promise<void>;
  incrementSuccessfulDeliveries(emailId: bigint): Promise<void>;
  getEmailDetails(accountId: bigint, emailId: bigint): Promise<dbEmailDetails | null>;
  listAccountEmails(
    accountId: bigint,
    options: dbEmailListOptions,
  ): Promise<{ emails: dbEmailSummary[]; total: number }>;
  findScheduledEmailsReady(now: Date): Promise<dbScheduledEmail[]>;
  updateEmailStatus(emailId: bigint, status: string, sentAt?: Date | null): Promise<void>;
  getEmailRecipients(emailId: bigint): Promise<dbEmailRecipient[]>;
  updateRecipientStatus(
    emailId: bigint,
    contactId: bigint | null,
    emailAddress: string,
    data: dbEmailRecipientUpdateData,
  ): Promise<void>;
  updateRecipientsStatus(emailId: bigint, data: dbEmailRecipientBulkUpdateData): Promise<void>;
  getRecipientStatusCounts(emailId: bigint): Promise<dbRecipientStatusCount[]>;
  findContactsByIds(accountId: bigint, contactIds: bigint[]): Promise<dbBaseContact[]>;
  findBouncedContactIds(contactIds: bigint[]): Promise<bigint[]>;
  getBouncedContactsForAccount(accountId: bigint): Promise<dbBouncedContact[]>;
  markContactBounced(contactId: bigint): Promise<boolean>;
  clearContactEmailBounce(accountId: bigint, contactId: bigint, newEmail?: string): Promise<void>;
  deleteEmail(emailId: bigint, accountId: bigint): Promise<void>;
}
