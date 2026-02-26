import { describe, expect, it } from 'vitest';
import {
  sanitizeDisplayText,
  sanitizeFormData,
  sanitizeRichContent,
  sanitizeHandoutContent,
  sanitizeTrustedContent,
  filterAllowedInlineStyles,
} from '../sanitization';

describe('sanitizeDisplayText', () => {
  it('returns empty for empty/null input', () => {
    expect(sanitizeDisplayText('')).toBe('');
    expect(sanitizeDisplayText(null as unknown as string)).toBe('');
  });

  it('strips all HTML tags', () => {
    expect(sanitizeDisplayText('<b>Bold</b>')).toBe('Bold');
    expect(sanitizeDisplayText('<p>Paragraph</p>')).toBe('Paragraph');
  });

  it('removes script tags and their content', () => {
    expect(sanitizeDisplayText('<script>alert("xss")</script>Hello')).toBe('Hello');
  });

  it('preserves plain text', () => {
    expect(sanitizeDisplayText('Hello World')).toBe('Hello World');
  });
});

describe('sanitizeFormData', () => {
  it('returns empty for empty input', () => {
    expect(sanitizeFormData('')).toBe('');
  });

  it('preserves normal text', () => {
    expect(sanitizeFormData('John Doe')).toBe('John Doe');
  });

  it('removes javascript: protocol', () => {
    const result = sanitizeFormData('javascript:alert(1)');
    expect(result).not.toContain('javascript:');
  });

  it('removes event handlers', () => {
    const result = sanitizeFormData('onclick=alert(1)');
    expect(result).not.toMatch(/on\w+\s*=/i);
  });

  it('removes data: protocol', () => {
    const result = sanitizeFormData('data:text/html,<script>alert(1)</script>');
    expect(result).not.toContain('data:');
  });

  it('preserves special characters in normal text', () => {
    expect(sanitizeFormData('test@email.com')).toBe('test@email.com');
    expect(sanitizeFormData("O'Brien")).toBe("O'Brien");
  });
});

describe('sanitizeRichContent', () => {
  it('returns empty for empty input', () => {
    expect(sanitizeRichContent('')).toBe('');
  });

  it('allows safe formatting HTML', () => {
    const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
    const result = sanitizeRichContent(input);
    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('removes script tags', () => {
    const result = sanitizeRichContent('<p>Hello</p><script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('strips javascript: from result', () => {
    const result = sanitizeRichContent('<a href="javascript:alert(1)">Click</a>');
    expect(result).not.toContain('javascript:');
  });

  it('forbids SVG elements', () => {
    const result = sanitizeRichContent('<svg onload="alert(1)"></svg>');
    expect(result).not.toContain('<svg');
  });

  it('filters inline styles to allowed properties', () => {
    const result = sanitizeRichContent('<p style="color: red; position: absolute;">Text</p>');
    expect(result).toContain('color');
    expect(result).not.toContain('position');
  });
});

describe('sanitizeHandoutContent', () => {
  it('returns empty for empty input', () => {
    expect(sanitizeHandoutContent('')).toBe('');
  });

  it('allows basic formatting tags', () => {
    const input = '<p><strong>Title</strong></p><ul><li>Item</li></ul>';
    const result = sanitizeHandoutContent(input);
    expect(result).toContain('<strong>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });

  it('allows links with href', () => {
    const result = sanitizeHandoutContent('<a href="https://example.com">Link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  it('removes style attributes', () => {
    const result = sanitizeHandoutContent('<p style="color:red">Styled</p>');
    expect(result).not.toContain('style=');
  });

  it('removes script and iframe tags', () => {
    const result = sanitizeHandoutContent(
      '<iframe src="evil.com"></iframe><script>alert(1)</script>',
    );
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('<script');
  });
});

describe('sanitizeTrustedContent', () => {
  it('allows a wider set of tags', () => {
    const input = '<table><tr><td>Cell</td></tr></table>';
    const result = sanitizeTrustedContent(input);
    expect(result).toContain('<table>');
    expect(result).toContain('<td>');
  });

  it('allows images with src', () => {
    const result = sanitizeTrustedContent('<img src="photo.jpg" alt="Photo">');
    expect(result).toContain('src="photo.jpg"');
  });

  it('still removes script tags', () => {
    const result = sanitizeTrustedContent('<div><script>alert(1)</script></div>');
    expect(result).not.toContain('<script>');
  });
});

describe('filterAllowedInlineStyles', () => {
  it('returns empty for empty input', () => {
    expect(filterAllowedInlineStyles('')).toBe('');
  });

  it('allows permitted properties', () => {
    expect(filterAllowedInlineStyles('color: red; font-size: 14px')).toBe(
      'color: red; font-size: 14px',
    );
  });

  it('strips disallowed properties', () => {
    const result = filterAllowedInlineStyles('color: red; position: absolute; display: none');
    expect(result).toContain('color: red');
    expect(result).not.toContain('position');
    expect(result).not.toContain('display');
  });

  it('strips url() values', () => {
    const result = filterAllowedInlineStyles('color: red; background-color: url(evil.js)');
    expect(result).toBe('color: red');
  });

  it('strips javascript: in values', () => {
    const result = filterAllowedInlineStyles('color: javascript:alert(1)');
    expect(result).toBe('color: alert(1)');
  });
});
