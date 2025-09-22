import { BaseContactType } from '@draco/shared-schemas';

export interface MailtoOptions {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
}

/**
 * Generate a mailto URL from email options
 */
export function generateMailtoUrl(options: MailtoOptions): string {
  const params = new URLSearchParams();

  if (options.cc && options.cc.length > 0) {
    params.append('cc', options.cc.join(','));
  }

  if (options.bcc && options.bcc.length > 0) {
    params.append('bcc', options.bcc.join(','));
  }

  if (options.subject) {
    params.append('subject', options.subject);
  }

  if (options.body) {
    params.append('body', options.body);
  }

  const toAddresses = options.to ? options.to.join(',') : '';
  const queryString = params.toString();

  return `mailto:${toAddresses}${queryString ? '?' + queryString : ''}`;
}

/**
 * Generate mailto URL for single contact
 */
export function generateContactMailto(
  contact: BaseContactType,
  subject?: string,
  body?: string,
): string {
  if (!contact.email) {
    throw new Error(`Contact ${contact.firstName} ${contact.lastName} has no email address`);
  }

  return generateMailtoUrl({
    to: [contact.email],
    subject,
    body,
  });
}

/**
 * Generate mailto URL for multiple contacts
 */
export function generateBulkMailto(
  contacts: BaseContactType[],
  options: Omit<MailtoOptions, 'to'> = {},
): string {
  const emailAddresses = contacts
    .filter((contact) => contact.email)
    .map((contact) => contact.email!);

  if (emailAddresses.length === 0) {
    throw new Error('No valid email addresses found in selected contacts');
  }

  // For bulk emails, use BCC to protect privacy
  return generateMailtoUrl({
    bcc: emailAddresses,
    ...options,
  });
}

/**
 * Check if contact has valid email address
 */
export function hasValidEmail(contact: BaseContactType): boolean {
  return Boolean(contact.email && contact.email.trim().length > 0);
}
