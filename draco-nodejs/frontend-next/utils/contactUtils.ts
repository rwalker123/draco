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
    phones.push({ type: 'Work', number: formatPhoneNumber(contactDetails.phone2) });
  }
  if (contactDetails.phone3) {
    phones.push({ type: 'Cell', number: formatPhoneNumber(contactDetails.phone3) });
  }

  return phones;
};

/**
 * Format date of birth for display
 */
export const formatDateOfBirth = (dateString: string | null): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
    contactDetails.dateofbirth ||
    contactDetails.middlename
  );
};
