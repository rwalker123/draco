import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getContactPhotoUrlMock, formatDateOfBirthMock } = vi.hoisted(() => ({
  getContactPhotoUrlMock: vi.fn(() => 'https://example.com/photo.png'),
  formatDateOfBirthMock: vi.fn((value: Date | string | null) => {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      return `formatted-${value.toISOString()}`;
    }

    return `formatted-${value}`;
  }),
}));

vi.mock('../../config/logo.js', () => ({
  getContactPhotoUrl: getContactPhotoUrlMock,
}));

vi.mock('../../utils/dateUtils.js', () => ({
  DateUtils: {
    formatDateOfBirthForResponse: formatDateOfBirthMock,
  },
}));

import type { dbBaseContact } from '../../repositories/index.js';
import { ContactResponseFormatter } from '../responseFormatters.js';

describe('ContactResponseFormatter.formatContactResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns normalized contact details ready for the profile page', () => {
    const contact: dbBaseContact = {
      id: BigInt(1024),
      firstname: 'Jamie',
      lastname: 'Rivera',
      middlename: 'A',
      email: 'jamie.rivera@example.com',
      phone1: '5551234567',
      phone2: null,
      phone3: null,
      streetaddress: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      dateofbirth: new Date('1990-05-21T00:00:00.000Z'),
      creatoraccountid: BigInt(77),
      userid: 'user-77',
    };

    const result = ContactResponseFormatter.formatContactResponse(contact);

    expect(result).toEqual({
      id: '1024',
      firstName: 'Jamie',
      lastName: 'Rivera',
      middleName: 'A',
      email: 'jamie.rivera@example.com',
      userId: 'user-77',
      photoUrl: 'https://example.com/photo.png',
      contactDetails: {
        phone1: '5551234567',
        phone2: '',
        phone3: '',
        streetAddress: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        dateOfBirth: 'formatted-1990-05-21T00:00:00.000Z',
        firstYear: null,
      },
    });

    expect(getContactPhotoUrlMock).toHaveBeenCalledWith('77', '1024');
    expect(formatDateOfBirthMock).toHaveBeenCalledWith(new Date('1990-05-21T00:00:00.000Z'));
  });
});
