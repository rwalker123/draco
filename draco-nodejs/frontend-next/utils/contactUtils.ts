import { ContactDetailsType, NamedContactType } from '@draco/shared-schemas';

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
export const formatAddress = (contactDetails: ContactDetailsType): string => {
  const parts = [
    contactDetails.streetAddress,
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
  contactDetails: ContactDetailsType,
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
 * Get display name for contact
 */
export const getContactDisplayName = (
  contact: NamedContactType | undefined,
  shortName: boolean = false,
): string => {
  if (!contact) return '';
  if (shortName) {
    return `${contact.firstName} ${contact.lastName}`.trim();
  }

  return getFormattedName(contact.firstName, contact.lastName, contact.middleName);
};

/**
 * Check if contact has any contact details
 */
export const hasContactDetails = (contactDetails?: ContactDetailsType): boolean => {
  if (!contactDetails) return false;

  return !!(
    contactDetails.phone1 ||
    contactDetails.phone2 ||
    contactDetails.phone3 ||
    contactDetails.streetAddress ||
    contactDetails.city ||
    contactDetails.state ||
    contactDetails.zip ||
    contactDetails.dateOfBirth
  );
};
