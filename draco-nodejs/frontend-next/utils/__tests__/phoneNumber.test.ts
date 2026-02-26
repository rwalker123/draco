import { describe, expect, it } from 'vitest';
import {
  stripPhoneDigits,
  isValidPhoneNumber,
  formatPhoneNumber,
  formatPhoneInput,
} from '../phoneNumber';

describe('stripPhoneDigits', () => {
  it('removes non-digit characters', () => {
    expect(stripPhoneDigits('(555) 123-4567')).toBe('5551234567');
  });

  it('returns empty string for empty input', () => {
    expect(stripPhoneDigits('')).toBe('');
  });

  it('removes letters and special characters', () => {
    expect(stripPhoneDigits('abc-123-xyz')).toBe('123');
  });

  it('returns digits unchanged', () => {
    expect(stripPhoneDigits('5551234567')).toBe('5551234567');
  });
});

describe('isValidPhoneNumber', () => {
  it('returns true for null/undefined/empty', () => {
    expect(isValidPhoneNumber(null)).toBe(true);
    expect(isValidPhoneNumber(undefined)).toBe(true);
    expect(isValidPhoneNumber('')).toBe(true);
  });

  it('returns true for a 10-digit phone number', () => {
    expect(isValidPhoneNumber('5551234567')).toBe(true);
    expect(isValidPhoneNumber('(555) 123-4567')).toBe(true);
  });

  it('returns false for too few digits', () => {
    expect(isValidPhoneNumber('12345')).toBe(false);
  });

  it('returns false for too many digits', () => {
    expect(isValidPhoneNumber('123456789012')).toBe(false);
  });

  it('returns true for zero digits (only non-digit chars)', () => {
    expect(isValidPhoneNumber('---')).toBe(true);
  });
});

describe('formatPhoneNumber', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(formatPhoneNumber(null)).toBe('');
    expect(formatPhoneNumber(undefined)).toBe('');
    expect(formatPhoneNumber('')).toBe('');
  });

  it('formats 10-digit number', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('formats 10-digit number with existing formatting', () => {
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
  });

  it('formats 11-digit number starting with 1', () => {
    expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
  });

  it('returns original for non-standard lengths', () => {
    expect(formatPhoneNumber('12345')).toBe('12345');
  });
});

describe('formatPhoneInput', () => {
  it('returns empty for empty input', () => {
    expect(formatPhoneInput('')).toBe('');
  });

  it('returns raw digits for fewer than 4', () => {
    expect(formatPhoneInput('55')).toBe('55');
    expect(formatPhoneInput('555')).toBe('555');
  });

  it('adds area code formatting for 4-6 digits', () => {
    expect(formatPhoneInput('5551')).toBe('(555) 1');
    expect(formatPhoneInput('555123')).toBe('(555) 123');
  });

  it('adds full formatting for 7+ digits', () => {
    expect(formatPhoneInput('5551234')).toBe('(555) 123-4');
    expect(formatPhoneInput('5551234567')).toBe('(555) 123-4567');
  });

  it('truncates to 10 digits', () => {
    expect(formatPhoneInput('555123456789')).toBe('(555) 123-4567');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatPhoneInput('(555) 123-4567')).toBe('(555) 123-4567');
  });
});
