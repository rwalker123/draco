import { ContactDetails } from '../types/users';

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string | null): string => {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return original if can't format
  return phone;
};

/**
 * Format address for display
 */
export const formatAddress = (contactDetails: ContactDetails): string => {
  const parts = [
    contactDetails.streetaddress,
    contactDetails.city,
    contactDetails.state,
    contactDetails.zip,
  ].filter(Boolean);

  return parts.join(', ');
};

/**
 * Get formatted phone numbers
 */
export const getPhoneNumbers = (
  contactDetails: ContactDetails,
): Array<{ type: string; number: string }> => {
  const phones = [];

  if (contactDetails.phone1) {
    phones.push({ type: 'Home', number: formatPhoneNumber(contactDetails.phone1) });
  }
  if (contactDetails.phone2) {
    phones.push({ type: 'Cell', number: formatPhoneNumber(contactDetails.phone2) });
  }
  if (contactDetails.phone3) {
    phones.push({ type: 'Work', number: formatPhoneNumber(contactDetails.phone3) });
  }

  return phones;
};

/**
 * Format date of birth for display
 */
export const formatDateOfBirth = (dateString: string | null): string => {
  if (!dateString) return '';

  try {
    // If we get a date-only string (YYYY-MM-DD), avoid timezone conversion
    const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    if (dateOnlyMatch) {
      const [year, month, day] = dateString.split('-').map((p) => parseInt(p, 10));
      // Format using Intl without constructing a Date in local TZ
      // Construct a UTC date to avoid off-by-one and format in UTC
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(utcDate);
    }

    // Legacy ISO timestamps (with time/Z): format in UTC to avoid shifting the day
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateString;
  }
};

/**
 * Get full name including middle name
 */
export const getFullName = (
  firstName: string,
  lastName: string,
  middleName?: string | null,
): string => {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  return parts.join(' ');
};

/**
 * Get formatted name as "LastName, FirstName MiddleName"
 */
export const getFormattedName = (
  firstName: string,
  lastName: string,
  middleName?: string | null,
): string => {
  const lastNamePart = lastName || '';
  const firstNamePart = firstName || '';
  const middleNamePart = middleName || '';

  let formattedName = lastNamePart;
  if (firstNamePart) {
    formattedName += `, ${firstNamePart}`;
  }
  if (middleNamePart) {
    formattedName += ` ${middleNamePart}`;
  }

  return formattedName;
};

/**
 * Check if contact has any contact details
 */
export const hasContactDetails = (contactDetails?: ContactDetails): boolean => {
  if (!contactDetails) return false;

  return !!(
    contactDetails.phone1 ||
    contactDetails.phone2 ||
    contactDetails.phone3 ||
    contactDetails.streetaddress ||
    contactDetails.city ||
    contactDetails.state ||
    contactDetails.zip ||
    contactDetails.dateofbirth
  );
};
