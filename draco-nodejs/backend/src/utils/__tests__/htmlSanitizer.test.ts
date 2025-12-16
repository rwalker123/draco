import { describe, expect, it } from 'vitest';
import { sanitizeRichHtml, sanitizeSystemEmailHtml } from '../htmlSanitizer.js';

describe('htmlSanitizer', () => {
  it('sanitizeRichHtml strips style blocks', () => {
    const input = '<div>ok</div><style>.header{color:red}</style>';
    expect(sanitizeRichHtml(input)).toBe('<div>ok</div>');
  });

  it('sanitizeSystemEmailHtml preserves style blocks but strips dangerous CSS constructs', () => {
    const input = [
      '<div class="header">ok</div>',
      '<style>',
      '.header{color:red}',
      '@import url("https://evil.example/x.css");',
      '.x{background-image:url(javascript:alert(1))}',
      '.y{width: expression(alert(1))}',
      '</style>',
    ].join('');

    const result = sanitizeSystemEmailHtml(input);
    expect(result).toContain('<style>');
    expect(result).toContain('.header{color:red}');
    expect(result).not.toMatch(/@import/i);
    expect(result).not.toMatch(/url\s*\(/i);
    expect(result).not.toMatch(/expression\s*\(/i);
  });

  it('sanitizeSystemEmailHtml removes script tags and inline event handlers', () => {
    const input =
      '<div onclick="alert(1)">click</div><script>alert(1)</script><a href="javascript:alert(1)">x</a>';
    const result = sanitizeSystemEmailHtml(input);
    expect(result).not.toMatch(/onclick=/i);
    expect(result).not.toMatch(/<script/i);
    expect(result).toContain('href="#"');
  });
});
