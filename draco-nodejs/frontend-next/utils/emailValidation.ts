/**
 * Email validation utilities for recipient management
 * Centralized validation logic to follow DRY principles
 */

import { RecipientContact } from '../types/emails/recipients';

/**
 * Validates email recipients and returns counts
 */
export const validateEmailRecipients = (recipients: RecipientContact[]) => {
  const validEmails = recipients.filter((r) => r.email && r.email.trim());
  const invalidEmails = recipients.length - validEmails.length;

  return {
    validCount: validEmails.length,
    invalidCount: invalidEmails,
    validEmails: validEmails,
    recipientsWithoutEmail: recipients.filter((r) => !r.email || !r.email.trim()),
  };
};

/**
 * Validates email input for header injection prevention
 */
export const validateEmailInput = (input: string): boolean => {
  // Prevent email header injection
  const headerInjectionPattern = /[\r\n]/;
  return !headerInjectionPattern.test(input);
};

/**
 * Basic email format validation
 */
export const isValidEmailFormat = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
};

/**
 * Sanitizes text to prevent XSS in user-controlled content
 */
export const sanitizeDisplayText = (text: string): string => {
  if (!text) return '';

  // Basic HTML entity encoding for display
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
