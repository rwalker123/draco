import { describe, expect, it } from 'vitest';
import {
  formatAddress,
  getPhoneNumbers,
  getFullName,
  getFormattedName,
  getContactDisplayName,
  hasContactDetails,
} from '../contactUtils';
import type { ContactDetailsType, NamedContactType } from '@draco/shared-schemas';

const emptyDetails: ContactDetailsType = {
  phone1: '',
  phone2: '',
  phone3: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  dateOfBirth: '',
};

describe('formatAddress', () => {
  it('joins all address parts', () => {
    const details: ContactDetailsType = {
      ...emptyDetails,
      streetAddress: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
    };
    expect(formatAddress(details)).toBe('123 Main St, Springfield, IL, 62701');
  });

  it('omits empty parts', () => {
    const details: ContactDetailsType = {
      ...emptyDetails,
      city: 'Springfield',
      state: 'IL',
    };
    expect(formatAddress(details)).toBe('Springfield, IL');
  });

  it('returns empty string when all parts empty', () => {
    expect(formatAddress(emptyDetails)).toBe('');
  });
});

describe('getPhoneNumbers', () => {
  it('returns all filled phone numbers with types', () => {
    const details: ContactDetailsType = {
      ...emptyDetails,
      phone1: '5551234567',
      phone2: '5559876543',
      phone3: '5555555555',
    };
    const result = getPhoneNumbers(details);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'Home', number: '(555) 123-4567' });
    expect(result[1]).toEqual({ type: 'Cell', number: '(555) 987-6543' });
    expect(result[2]).toEqual({ type: 'Work', number: '(555) 555-5555' });
  });

  it('skips empty phone numbers', () => {
    const details: ContactDetailsType = {
      ...emptyDetails,
      phone1: '5551234567',
    };
    const result = getPhoneNumbers(details);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('Home');
  });

  it('returns empty array when no phones', () => {
    expect(getPhoneNumbers(emptyDetails)).toEqual([]);
  });
});

describe('getFullName', () => {
  it('joins first, middle, and last', () => {
    expect(getFullName('John', 'Doe', 'Michael')).toBe('John Michael Doe');
  });

  it('skips null/empty middle name', () => {
    expect(getFullName('John', 'Doe', null)).toBe('John Doe');
    expect(getFullName('John', 'Doe', '')).toBe('John Doe');
    expect(getFullName('John', 'Doe')).toBe('John Doe');
  });
});

describe('getFormattedName', () => {
  it('formats as LastName, FirstName MiddleName', () => {
    expect(getFormattedName('John', 'Doe', 'Michael')).toBe('Doe, John Michael');
  });

  it('omits middle name when empty', () => {
    expect(getFormattedName('John', 'Doe')).toBe('Doe, John');
  });

  it('handles missing first name', () => {
    expect(getFormattedName('', 'Doe')).toBe('Doe');
  });

  it('handles missing last name', () => {
    expect(getFormattedName('John', '')).toBe(', John');
  });
});

describe('getContactDisplayName', () => {
  const contact: NamedContactType = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Michael',
  };

  it('returns formatted name by default', () => {
    expect(getContactDisplayName(contact)).toBe('Doe, John Michael');
  });

  it('returns short name when requested', () => {
    expect(getContactDisplayName(contact, true)).toBe('John Doe');
  });

  it('returns empty string for undefined contact', () => {
    expect(getContactDisplayName(undefined)).toBe('');
  });
});

describe('hasContactDetails', () => {
  it('returns false for undefined', () => {
    expect(hasContactDetails(undefined)).toBe(false);
  });

  it('returns false when all fields empty', () => {
    expect(hasContactDetails(emptyDetails)).toBe(false);
  });

  it('returns true when phone1 has value', () => {
    expect(hasContactDetails({ ...emptyDetails, phone1: '555' })).toBe(true);
  });

  it('returns true when city has value', () => {
    expect(hasContactDetails({ ...emptyDetails, city: 'Springfield' })).toBe(true);
  });

  it('returns true when dateOfBirth has value', () => {
    expect(hasContactDetails({ ...emptyDetails, dateOfBirth: '1990-01-01' })).toBe(true);
  });
});
