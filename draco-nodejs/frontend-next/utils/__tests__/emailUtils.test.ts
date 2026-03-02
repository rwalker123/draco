import { describe, expect, it } from 'vitest';
import {
  validateEmail,
  validateEmails,
  formatContactDisplayName,
  extractEmailFromContact,
  getEmailStatusLabel,
  getRecipientStatusLabel,
  getEmailStatusColor,
  getRecipientStatusColor,
  calculateEmailMetrics,
  formatFileSize,
  processTemplateVariables,
  extractTemplateVariables,
  truncateText,
  stripHtml,
  generateMailtoUrl,
} from '../emailUtils';
import type { ContactType } from '@draco/shared-schemas';

describe('validateEmail', () => {
  it('validates correct email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('first.last@domain.org')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
  });
});

describe('validateEmails', () => {
  it('separates valid and invalid emails', () => {
    const result = validateEmails(['good@example.com', 'bad', 'ok@test.org']);
    expect(result.valid).toEqual(['good@example.com', 'ok@test.org']);
    expect(result.invalid).toEqual(['bad']);
  });

  it('trims whitespace', () => {
    const result = validateEmails([' user@test.com ']);
    expect(result.valid).toEqual(['user@test.com']);
  });
});

describe('formatContactDisplayName', () => {
  it('formats name with email', () => {
    const contact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    } as ContactType;
    expect(formatContactDisplayName(contact)).toBe('John Doe <john@example.com>');
  });

  it('formats name without email', () => {
    const contact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: '',
    } as ContactType;
    expect(formatContactDisplayName(contact)).toBe('John Doe');
  });
});

describe('extractEmailFromContact', () => {
  it('extracts email from angle brackets', () => {
    expect(extractEmailFromContact('John Doe <john@test.com>')).toBe('john@test.com');
  });

  it('returns null when no angle brackets', () => {
    expect(extractEmailFromContact('John Doe')).toBeNull();
  });
});

describe('getEmailStatusLabel', () => {
  it('maps all status types', () => {
    expect(getEmailStatusLabel('draft')).toBe('Draft');
    expect(getEmailStatusLabel('sending')).toBe('Sending');
    expect(getEmailStatusLabel('sent')).toBe('Sent');
    expect(getEmailStatusLabel('failed')).toBe('Failed');
    expect(getEmailStatusLabel('scheduled')).toBe('Scheduled');
    expect(getEmailStatusLabel('partial')).toBe('Partially Sent');
  });
});

describe('getRecipientStatusLabel', () => {
  it('maps all recipient status types', () => {
    expect(getRecipientStatusLabel('pending')).toBe('Pending');
    expect(getRecipientStatusLabel('sent')).toBe('Sent');
    expect(getRecipientStatusLabel('delivered')).toBe('Delivered');
    expect(getRecipientStatusLabel('bounced')).toBe('Bounced');
    expect(getRecipientStatusLabel('failed')).toBe('Failed');
    expect(getRecipientStatusLabel('opened')).toBe('Opened');
    expect(getRecipientStatusLabel('clicked')).toBe('Clicked');
  });
});

describe('getEmailStatusColor', () => {
  it('returns appropriate colors', () => {
    expect(getEmailStatusColor('draft')).toBe('default');
    expect(getEmailStatusColor('sent')).toBe('success');
    expect(getEmailStatusColor('failed')).toBe('error');
    expect(getEmailStatusColor('scheduled')).toBe('warning');
  });
});

describe('getRecipientStatusColor', () => {
  it('returns appropriate colors', () => {
    expect(getRecipientStatusColor('delivered')).toBe('success');
    expect(getRecipientStatusColor('bounced')).toBe('error');
    expect(getRecipientStatusColor('opened')).toBe('info');
  });
});

describe('calculateEmailMetrics', () => {
  it('calculates all metrics correctly', () => {
    const result = calculateEmailMetrics(100, 90, 10, 5, 45, 10);
    expect(result.deliveryRate).toBe(90);
    expect(result.bounceRate).toBe(5);
    expect(result.openRate).toBe(50);
    expect(result.clickRate).toBeCloseTo(11.11, 1);
  });

  it('handles zero recipients', () => {
    const result = calculateEmailMetrics(0, 0, 0, 0, 0, 0);
    expect(result.deliveryRate).toBe(0);
    expect(result.bounceRate).toBe(0);
    expect(result.openRate).toBe(0);
    expect(result.clickRate).toBe(0);
  });

  it('handles zero deliveries for open/click rate', () => {
    const result = calculateEmailMetrics(100, 0, 100, 0, 0, 0);
    expect(result.openRate).toBe(0);
    expect(result.clickRate).toBe(0);
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
});

describe('processTemplateVariables', () => {
  it('replaces double-brace variables', () => {
    expect(processTemplateVariables('Hello {{name}}!', { name: 'World' })).toBe('Hello World!');
  });

  it('replaces single-brace variables', () => {
    expect(processTemplateVariables('Hello {name}!', { name: 'World' })).toBe('Hello World!');
  });

  it('replaces multiple occurrences', () => {
    expect(processTemplateVariables('{{name}} and {{name}}', { name: 'Test' })).toBe(
      'Test and Test',
    );
  });
});

describe('extractTemplateVariables', () => {
  it('extracts double-brace variables', () => {
    const vars = extractTemplateVariables('Hello {{firstName}} {{lastName}}');
    expect(vars).toContain('firstName');
    expect(vars).toContain('lastName');
  });

  it('deduplicates variables', () => {
    const vars = extractTemplateVariables('{{name}} and {{name}}');
    expect(vars.filter((v) => v === 'name')).toHaveLength(1);
  });
});

describe('truncateText', () => {
  it('returns null/undefined as-is', () => {
    expect(truncateText(null)).toBeNull();
    expect(truncateText(undefined)).toBeUndefined();
  });

  it('does not truncate short text', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates long text with ellipsis', () => {
    const result = truncateText('This is a very long string', 10);
    expect(result).toBe('This is a...');
  });
});

describe('stripHtml', () => {
  it('strips HTML tags', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});

describe('generateMailtoUrl', () => {
  it('generates basic mailto', () => {
    expect(generateMailtoUrl(['user@test.com'])).toBe('mailto:user@test.com');
  });

  it('includes subject and body', () => {
    const url = generateMailtoUrl(['a@b.com'], 'Hello', 'Body text');
    expect(url).toContain('mailto:a@b.com?');
    expect(url).toContain('subject=Hello');
    expect(url).toContain('body=Body+text');
  });

  it('handles multiple recipients', () => {
    const url = generateMailtoUrl(['a@b.com', 'c@d.com']);
    expect(url).toBe('mailto:a@b.com,c@d.com');
  });
});
