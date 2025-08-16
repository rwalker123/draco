/**
 * Email validation utilities for recipient management
 * Centralized validation logic to follow DRY principles
 */

import { RecipientContact } from '../types/emails/recipients';
import { hasValidEmail } from '../components/emails/common/mailtoUtils';

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
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
};

/**
 * Sanitizes text to prevent XSS in user-controlled content
 */
export const sanitizeDisplayText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  // Comprehensive XSS protection
  let sanitized = text;

  // 1. Remove dangerous script tags and content
  sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
  sanitized = sanitized.replace(/<applet[^>]*>[\s\S]*?<\/applet>/gi, '');

  // 2. Remove dangerous attributes and event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, ''); // onclick, onload, etc.
  sanitized = sanitized.replace(/\s*javascript\s*:/gi, '');
  sanitized = sanitized.replace(/\s*vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/\s*data\s*:/gi, '');
  sanitized = sanitized.replace(/\s*expression\s*\(/gi, '');

  // 3. Remove potentially dangerous tags
  const dangerousTags = [
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'applet',
    'form',
    'input',
    'textarea',
    'select',
    'button',
    'link',
    'meta',
    'base',
    'frame',
    'frameset',
  ];

  dangerousTags.forEach((tag) => {
    const tagRegex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
    sanitized = sanitized.replace(tagRegex, '');
  });

  // 4. Enhanced HTML entity encoding
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');

  // 5. Remove control characters and non-printable characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 6. Prevent CSS injection
  sanitized = sanitized.replace(/expression\s*\(/gi, '');
  sanitized = sanitized.replace(/-moz-binding/gi, '');
  sanitized = sanitized.replace(/behavior\s*:/gi, '');

  // 7. Remove URL schemes that could be dangerous
  sanitized = sanitized.replace(/(?:javascript|vbscript|data|file|chrome|about):/gi, '');

  return sanitized;
};
