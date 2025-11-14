import validator from 'validator';

/**
 * Sanitizes rich HTML content while preserving safe formatting.
 * Removes dangerous tags, inline event handlers, and javascript/data protocols.
 */
export const sanitizeRichHtml = (raw: string | null | undefined): string => {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  let sanitized = raw.trim();
  if (!sanitized) {
    return '';
  }

  // Remove dangerous tags entirely
  sanitized = sanitized.replace(
    /<(script|style|iframe|object|embed|svg|math)[\s\S]*?>[\s\S]*?<\/\1>/gi,
    '',
  );

  // Remove event handler attributes (onload, onclick, etc.)
  sanitized = sanitized.replace(/\s+on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/\s+on\w+='[^']*'/gi, '');
  sanitized = sanitized.replace(/\s+on\w+=\S+/gi, '');

  // Remove inline styles
  sanitized = sanitized.replace(/\s+style="[^"]*"/gi, '');
  sanitized = sanitized.replace(/\s+style='[^']*'/gi, '');

  // Neutralize dangerous protocols in href/src
  sanitized = sanitized.replace(
    /(href|src)\s*=\s*"([^"]*)"/gi,
    (_match, attr, value) => `${attr}="${removeDangerousProtocols(value)}"`,
  );
  sanitized = sanitized.replace(
    /(href|src)\s*=\s*'([^']*)'/gi,
    (_match, attr, value) => `${attr}='${removeDangerousProtocols(value)}'`,
  );
  sanitized = sanitized.replace(
    /(href|src)\s*=\s*([^\s>]+)/gi,
    (_match, attr, value) => `${attr}=${removeDangerousProtocols(value)}`,
  );

  return sanitized.trim();
};

/**
 * Converts HTML/text input into safe plain text for logs/emails.
 */
export const sanitizePlainText = (raw: string | null | undefined): string => {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  let sanitized = raw;
  sanitized = sanitized.replace(/[\r\n]/g, ' ');
  sanitized = sanitized.replace(/<[^>]*>/g, ' ');
  sanitized = sanitized.replace(/\s+/g, ' ');
  return validator.escape(sanitized.trim());
};

const removeDangerousProtocols = (value: string): string => {
  if (!value) {
    return value;
  }

  const normalized = value.trim();
  if (/^(javascript|vbscript|data):/i.test(normalized)) {
    return '#';
  }

  return normalized;
};
