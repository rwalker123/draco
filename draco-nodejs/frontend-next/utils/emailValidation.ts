/**
 * Email validation utilities for recipient management
 * Centralized validation logic to follow DRY principles
 */

import { RecipientContact } from '../types/emails/recipients';
import { hasValidEmail } from '../components/emails/common/mailtoUtils';
import DOMPurify from 'dompurify';
import validator from 'validator';

/**
 * Validates email recipients and returns counts
 */
export const validateEmailRecipients = (
  recipients: RecipientContact[],
): {
  validCount: number;
  invalidCount: number;
  validEmails: RecipientContact[];
  recipientsWithoutEmail: RecipientContact[];
} => {
  const validEmails = recipients.filter((r) => hasValidEmail(r));
  const invalidEmails = recipients.length - validEmails.length;

  return {
    validCount: validEmails.length,
    invalidCount: invalidEmails,
    validEmails: validEmails,
    recipientsWithoutEmail: recipients.filter((r) => !hasValidEmail(r)),
  };
};

/**
 * Validates email input for header injection prevention
 */
export const validateEmailInput = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Comprehensive header injection protection
  const injectionPatterns = [
    // Direct CRLF injection
    /[\r\n]/,
    // URL-encoded CRLF sequences
    /%0[aAdD]/i,
    /%0[0-9a-fA-F]%0[aAdD]/i,
    // Double URL-encoded
    /%25%30%41/i, // %0A
    /%25%30%44/i, // %0D
    // Unicode variations
    /\u000A|\u000D/,
    // HTML entities
    /&#x0?[aAdD];/i,
    /&#1[03];/,
    // Various encoding schemes
    /\\r|\\n/,
    /\x0A|\x0D/,
    // Email header keywords that shouldn't appear in input fields
    /\b(bcc|cc|to|from|subject|content-type|mime-version):/i,
    // Potential script injection in email headers
    /<script|javascript:|vbscript:|data:/i,
  ];

  return !injectionPatterns.some((pattern) => pattern.test(input));
};

/**
 * Basic email format validation
 */
export const isValidEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmed = email.trim();

  // Use validator.js for more strict email validation
  if (!validator.isEmail(trimmed)) {
    return false;
  }

  // Additional checks for malformed emails
  // Check for consecutive dots in local part
  const [localPart] = trimmed.split('@');
  if (localPart.includes('..')) {
    return false;
  }

  return true;
};

/**
 * Sanitizes text to prevent XSS in user-controlled content
 * Uses DOMPurify to strip all HTML and return safe text content
 */
export const sanitizeDisplayText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  // Use DOMPurify to strip all HTML tags and return safe text content
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content
    FORBID_CONTENTS: ['script', 'style'], // Remove content of dangerous tags
  });
};

/**
 * Sanitizes rich content to allow safe HTML while removing dangerous elements
 * Used for workout announcements where formatting should be preserved
 * Based on the backend sanitizeHtml implementation
 */
export const sanitizeRichContent = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  // Use DOMPurify with HTML profile to allow safe formatting while removing XSS
  return DOMPurify.sanitize(text, {
    USE_PROFILES: { html: true }, // Allow only safe HTML elements
    FORBID_TAGS: ['svg', 'math'], // Explicitly forbid SVG and MathML for security
    FORBID_ATTR: ['style'], // Remove style attributes to prevent CSS injection
    KEEP_CONTENT: true, // Preserve text content when removing tags
    RETURN_DOM: false, // Return string, not DOM object
    SANITIZE_DOM: true, // Enable DOM clobbering protection
    SANITIZE_NAMED_PROPS: true, // Enforce strict DOM clobbering protection
  }).trim();
};
