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
 * Sanitizes form data to prevent XSS in form submissions
 * Uses DOMPurify to handle HTML sanitization, then removes dangerous URL schemes
 * Preserves legitimate special characters while removing actual security threats
 */
export const sanitizeFormData = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  // Store original to detect if DOMPurify only did HTML escaping
  const original = text;

  // First use DOMPurify to handle HTML tags and extract safe text content
  let sanitized = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content
    FORBID_CONTENTS: ['script', 'style'], // Remove content of dangerous tags
  });

  // If DOMPurify only HTML-escaped safe characters, restore the original
  // This handles cases where input like "!@#$%^&*()_+-=[]{}|;:,.<>?" gets escaped to
  // "!@#$%^&amp;*()_+-=[]{}|;:,.&lt;&gt;?" - we want to preserve the original
  const htmlEscapedVersion = original
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  if (sanitized === htmlEscapedVersion) {
    // DOMPurify only did HTML escaping of safe content, restore original
    sanitized = original;
  }

  // Then apply additional pattern removal for non-HTML XSS vectors
  sanitized = sanitized
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers

  return sanitized;
};

/**
 * Sanitizes rich content to allow safe HTML while removing dangerous elements
 * Used for templates and rich content where formatting should be preserved
 * Based on the backend sanitizeHtml implementation
 */
export const sanitizeRichContent = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  // Use DOMPurify with HTML profile to allow safe formatting while removing XSS
  let sanitized = DOMPurify.sanitize(text, {
    USE_PROFILES: { html: true }, // Allow only safe HTML elements
    FORBID_TAGS: ['svg', 'math'], // Explicitly forbid SVG and MathML for security
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'style'], // Allow safe attributes including filtered inline styles
    FORBID_ATTR: [], // Do not blanket-forbid style; we'll manually filter allowed properties
    KEEP_CONTENT: true, // Preserve text content when removing tags
    RETURN_DOM: false, // Return string, not DOM object
    SANITIZE_DOM: true, // Enable DOM clobbering protection
    SANITIZE_NAMED_PROPS: true, // Enforce strict DOM clobbering protection
  });

  const applyStyleFiltering = (styleContent: string): string => {
    // Legacy fallback for non-browser environments
    if (typeof window === 'undefined' || !window.document) {
      return filterAllowedStyles(styleContent);
    }

    const el = window.document.createElement('div');
    el.setAttribute('style', styleContent);
    const style = el.style;
    const allowed: string[] = [];

    ALLOWED_STYLE_PROPERTIES.forEach((prop) => {
      const value = style.getPropertyValue(prop);
      if (!value) {
        return;
      }
      if (/url\s*\(/i.test(value)) {
        return;
      }
      let cleanedValue = value.replace(/javascript:/gi, '').trim();
      if (!cleanedValue) {
        return;
      }
      if (prop === 'font-family') {
        // Normalize font family names to avoid stray quotes breaking attributes
        const normalized = cleanedValue.replace(/['"]/g, '').trim();
        if (!normalized) {
          return;
        }
        cleanedValue = normalized.includes(' ') ? `'${normalized}'` : normalized;
      }
      allowed.push(`${prop}: ${cleanedValue}`);
    });

    return allowed.join('; ');
  };

  // Use DOM parsing instead of regex to handle quoted values like "Times New Roman"
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, 'text/html');
    doc.body.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
      const filtered = applyStyleFiltering(element.getAttribute('style') ?? '');
      if (filtered) {
        element.setAttribute('style', filtered);
      } else {
        element.removeAttribute('style');
      }
    });
    sanitized = doc.body.innerHTML;
  } else {
    // Fallback for environments without DOMParser
    sanitized = sanitized.replace(/\sstyle="([^"]*)"/gi, (_match, styleContent) => {
      const filtered = applyStyleFiltering(styleContent);
      return filtered ? ` style="${filtered}"` : '';
    });
    sanitized = sanitized.replace(/\sstyle='([^']*)'/gi, (_match, styleContent) => {
      const filtered = applyStyleFiltering(styleContent);
      return filtered ? ` style="${filtered}"` : '';
    });
  }

  // Additional guard to strip any lingering javascript: url fragments
  return sanitized.replace(/javascript:/gi, '').trim();
};

const ALLOWED_STYLE_PROPERTIES = new Set([
  'font-family',
  'font-size',
  'font-weight',
  'color',
  'background-color',
  'text-align',
  'line-height',
]);

const filterAllowedStyles = (styleContent: string): string => {
  if (!styleContent) return '';
  const declarations = styleContent
    .split(';')
    .map((decl) => decl.trim())
    .filter(Boolean);

  const allowed: string[] = [];
  for (const decl of declarations) {
    const [prop, ...rest] = decl.split(':');
    if (!prop || rest.length === 0) continue;
    const value = rest.join(':').trim();
    const normalizedProp = prop.trim().toLowerCase();
    if (!ALLOWED_STYLE_PROPERTIES.has(normalizedProp)) {
      continue;
    }
    if (/url\s*\(/i.test(value) || /background-image/i.test(normalizedProp)) {
      continue;
    }
    const cleanedValue = value.replace(/javascript:/gi, '').trim();
    if (cleanedValue) {
      allowed.push(`${normalizedProp}: ${cleanedValue}`);
    }
  }

  return allowed.join('; ');
};

/**
 * Sanitizes handout descriptions while keeping the HTML compact so it fits existing limits.
 * Allows basic formatting such as headings, emphasis, and lists, and strips class/style attributes.
 */
export const sanitizeHandoutContent = (text: string): string => {
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
      'a',
      'h1',
      'h2',
      'h3',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'svg', 'math', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style'],
    KEEP_CONTENT: true,
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true,
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
