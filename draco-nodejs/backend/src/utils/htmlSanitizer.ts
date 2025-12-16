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

  // Allow only specific inline style properties; strip others
  sanitized = sanitized.replace(/\s+style="([^"]*)"/gi, (_m, styleContent) => {
    const filtered = filterAllowedStyles(styleContent);
    return filtered ? ` style="${filtered}"` : '';
  });
  sanitized = sanitized.replace(/\s+style='([^']*)'/gi, (_m, styleContent) => {
    const filtered = filterAllowedStyles(styleContent);
    return filtered ? ` style="${filtered}"` : '';
  });

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
 * Sanitizes HTML from trusted system templates while preserving safe styling.
 *
 * This is intended for internally generated emails (not user-authored content).
 * It preserves <style> blocks but sanitizes CSS to strip dangerous constructs
 * like @import, url(), and expression().
 */
export const sanitizeSystemEmailHtml = (raw: string | null | undefined): string => {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  let sanitized = raw.trim();
  if (!sanitized) {
    return '';
  }

  // Remove dangerous tags entirely (but preserve style for system templates)
  sanitized = sanitized.replace(
    /<(script|iframe|object|embed|svg|math)[\s\S]*?>[\s\S]*?<\/\1>/gi,
    '',
  );

  // Sanitize CSS in <style> blocks
  sanitized = sanitized.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, cssContent) => {
    const safeCss = sanitizeEmailCss(cssContent);
    return safeCss ? `<style>${safeCss}</style>` : '';
  });

  // Remove event handler attributes (onload, onclick, etc.)
  sanitized = sanitized.replace(/\s+on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/\s+on\w+='[^']*'/gi, '');
  sanitized = sanitized.replace(/\s+on\w+=\S+/gi, '');

  // Allow only specific inline style properties; strip others
  sanitized = sanitized.replace(/\s+style="([^"]*)"/gi, (_m, styleContent) => {
    const filtered = filterAllowedStyles(styleContent);
    return filtered ? ` style="${filtered}"` : '';
  });
  sanitized = sanitized.replace(/\s+style='([^']*)'/gi, (_m, styleContent) => {
    const filtered = filterAllowedStyles(styleContent);
    return filtered ? ` style="${filtered}"` : '';
  });

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

const ALLOWED_STYLE_PROPERTIES = new Set([
  'font-family',
  'font-size',
  'font-weight',
  'color',
  'background-color',
  'text-align',
  'line-height',
]);

const sanitizeEmailCss = (raw: string): string => {
  if (!raw) {
    return '';
  }

  let sanitized = raw;
  sanitized = sanitized.replace(/@import[\s\S]*?;/gi, '');
  sanitized = sanitized.replace(/url\s*\([\s\S]*?\)/gi, '');
  sanitized = sanitized.replace(/expression\s*\([\s\S]*?\)/gi, '');
  sanitized = sanitized.replace(/behaviou?r\s*:[^;]+;/gi, '');
  sanitized = sanitized.replace(/-moz-binding\s*:[^;]+;/gi, '');

  return sanitized.trim();
};

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
    if (ALLOWED_STYLE_PROPERTIES.has(normalizedProp)) {
      // Basic protocol guard inside styles (e.g., background-image: url(javascript:...))
      if (/url\s*\(/i.test(value)) {
        continue;
      }
      const safeValue = value
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .trim();
      if (safeValue) {
        allowed.push(`${normalizedProp}: ${safeValue}`);
      }
    }
  }

  return allowed.join('; ');
};
