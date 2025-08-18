/**
 * Common sanitization utilities for preventing XSS attacks
 * Centralized sanitization logic to follow DRY principles
 */

import DOMPurify from 'dompurify';

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
 * Used for templates and rich content where formatting should be preserved
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

/**
 * Sanitizes HTML content with minimal restrictions for trusted content
 * WARNING: Only use this for content from trusted sources
 * Allows most formatting but still removes dangerous scripts and attributes
 */
export const sanitizeTrustedContent = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'div',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'title', 'class'],
    FORBID_CONTENTS: ['script', 'style', 'object', 'embed', 'iframe'],
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true,
  }).trim();
};
