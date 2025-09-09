/**
 * Email Recipient Data Transformation Utilities
 *
 * This module provides utilities to transform backend API responses into frontend component types.
 * It handles data validation, normalization, and grouping logic while following DRY principles.
 */

import { RecipientContact } from '../types/emails/recipients';
import { UserRole, ContactRole } from '../types/users';
import { BackendContact } from '../services/emailRecipientService';
import { isValidEmailFormat } from './emailValidation';

// Type guards for runtime validation
const isString = (value: unknown): value is string => typeof value === 'string';
const isNonEmptyString = (value: unknown): value is string =>
  isString(value) && value.trim().length > 0;
// Memoization cache for expensive transformation operations
const transformationCache = new Map<string, unknown>();
const CACHE_SIZE_LIMIT = 1000; // Prevent memory leaks

/**
 * Simple memoization helper for transformation functions
 * @param fn - Function to memoize
 * @param keyGenerator - Function to generate cache key
 * @returns Memoized function
 */
function memoize<T extends unknown[], R>(
  fn: (...args: T) => R,
  keyGenerator: (...args: T) => string,
): (...args: T) => R {
  return (...args: T): R => {
    const key = keyGenerator(...args);

    if (transformationCache.has(key)) {
      return transformationCache.get(key) as R;
    }

    const result = fn(...args);

    // Prevent cache from growing too large
    if (transformationCache.size >= CACHE_SIZE_LIMIT) {
      const firstKey = transformationCache.keys().next().value;
      if (firstKey !== undefined) {
        transformationCache.delete(firstKey);
      }
    }

    transformationCache.set(key, result);
    return result;
  };
}

/**
 * Clear transformation cache (useful for testing or memory management)
 */
export function clearTransformationCache(): void {
  transformationCache.clear();
}

// Memoized transformation functions for better performance
const memoizedTransformBackendContact = memoize(
  transformBackendContact,
  (contact: BackendContact) =>
    `contact_${contact.id}_${contact.email || ''}_${contact.firstName || ''}_${contact.lastName || ''}`,
);

const memoizedFilterContactsByQuery = memoize(
  filterContactsByQuery,
  (contacts: RecipientContact[], query: string) =>
    `filter_${contacts.length}_${query}_${contacts
      .map((c) => c.id)
      .join(',')
      .slice(0, 100)}`,
);

const memoizedSortContactsByDisplayName = memoize(
  sortContactsByDisplayName,
  (contacts: RecipientContact[]) =>
    `sort_${contacts.length}_${contacts
      .map((c) => c.id)
      .join(',')
      .slice(0, 100)}`,
);

/**
 * Performance-optimized batch transformation for multiple contacts
 * Uses memoization to avoid re-transforming the same contacts
 * @param contacts - Array of backend contacts to transform
 * @returns Array of transformed recipient contacts
 */
export function batchTransformBackendContacts(contacts: BackendContact[]): RecipientContact[] {
  return contacts.map(memoizedTransformBackendContact);
}

/**
 * Performance-optimized contact filtering with memoization
 * @param contacts - Array of contacts to filter
 * @param query - Search query string
 * @returns Filtered array of contacts
 */
export function optimizedFilterContactsByQuery(
  contacts: RecipientContact[],
  query: string,
): RecipientContact[] {
  if (!query.trim()) {
    return contacts;
  }
  return memoizedFilterContactsByQuery(contacts, query);
}

/**
 * Performance-optimized contact sorting with memoization
 * @param contacts - Array of contacts to sort
 * @returns Sorted array of contacts
 */
export function optimizedSortContactsByDisplayName(
  contacts: RecipientContact[],
): RecipientContact[] {
  if (contacts.length <= 1) {
    return contacts;
  }
  return memoizedSortContactsByDisplayName(contacts);
}

/**
 * Generates a display name from name components, handling null/undefined values gracefully
 * @param firstname - First name (required)
 * @param lastname - Last name (required)
 * @param middlename - Middle name (optional)
 * @returns Formatted display name
 */
export function generateDisplayName(
  firstname: string,
  lastname: string,
  middlename?: string | null,
): string {
  const first = isNonEmptyString(firstname) ? firstname.trim() : '';
  const last = isNonEmptyString(lastname) ? lastname.trim() : '';
  const middle = isNonEmptyString(middlename) ? middlename.trim() : '';

  if (!first && !last) {
    return 'Unknown Contact';
  }

  if (!first) return last;
  if (!last) return first;

  // Include middle name if present
  if (middle) {
    return `${first} ${middle} ${last}`;
  }

  return `${first} ${last}`;
}

/**
 * Validates and normalizes email address
 * @param email - Email address to validate
 * @returns Whether the email is valid for sending
 */
export function validateEmail(email?: string | null): boolean {
  if (!isNonEmptyString(email)) {
    return false;
  }

  return isValidEmailFormat(email);
}

/**
 * Consolidates multiple phone number fields into a single preferred number
 * Prioritizes phone1 > phone2 > phone3, returning first non-empty value
 * @param phone1 - Primary phone number
 * @param phone2 - Secondary phone number
 * @param phone3 - Tertiary phone number
 * @returns Consolidated phone number or empty string
 */
export function consolidatePhoneNumbers(
  phone1?: string | null,
  phone2?: string | null,
  phone3?: string | null,
): string {
  // Check each phone field in priority order
  for (const phone of [phone1, phone2, phone3]) {
    if (isNonEmptyString(phone)) {
      return phone.trim();
    }
  }

  return '';
}

/**
 * Transforms a backend contact role to frontend UserRole format
 * @param contactRole - Backend ContactRole object
 * @returns UserRole for frontend use
 */
function transformContactRole(contactRole: ContactRole): UserRole {
  return {
    id: contactRole.id,
    roleId: contactRole.roleId,
    roleName: contactRole.roleName || '',
    roleData: contactRole.roleData || '',
    contextName: contactRole.contextName,
  };
}

/**
 * Transforms backend contact data to frontend RecipientContact format
 * Handles data validation, normalization, and fallback values
 * @param contact - Backend contact object
 * @returns RecipientContact for frontend components
 */
export function transformBackendContact(contact: BackendContact): RecipientContact {
  // Validate required fields
  if (!contact.id) {
    console.warn('Contact missing required ID field:', contact);
  }

  // Extract contact details safely
  const contactDetails = contact.contactDetails;
  const consolidatedPhone = consolidatePhoneNumbers(
    contactDetails?.phone1,
    contactDetails?.phone2,
    contactDetails?.phone3,
  );

  // Generate display name with fallbacks
  const displayName = generateDisplayName(contact.firstName, contact.lastName, contact.middleName);

  // Validate email
  const hasValidEmail = validateEmail(contact.email);

  // Transform roles if present
  const roles = contact.contactroles?.map(transformContactRole) || [];

  return {
    id: contact.id,
    firstname: contact.firstName || '',
    lastname: contact.lastName || '',
    email: contact.email || undefined,
    phone: consolidatedPhone || undefined,
    displayName,
    hasValidEmail,
    roles,
    teams: contact.teams || [],
  };
}

/**
 * Deduplicates an array of RecipientContact objects based on contact ID
 * Preserves the first occurrence of each unique contact
 * Uses memoization for performance with large datasets
 * @param contacts - Array of contacts that may contain duplicates
 * @returns Deduplicated array of contacts
 */
export function deduplicateContacts(contacts: RecipientContact[]): RecipientContact[] {
  // Early return for empty or single-item arrays
  if (contacts.length <= 1) {
    return contacts;
  }

  // Use Map for O(1) lookups and preserve insertion order
  const uniqueContacts = new Map<string, RecipientContact>();

  for (const contact of contacts) {
    if (!uniqueContacts.has(contact.id)) {
      uniqueContacts.set(contact.id, contact);
    }
  }

  return Array.from(uniqueContacts.values());
}

/**
 * Validates a collection of contacts and provides data quality metrics
 * @param contacts - Array of contacts to validate
 * @returns Validation results with counts and quality metrics
 */
export function validateContactCollection(contacts: RecipientContact[]): {
  totalContacts: number;
  validEmailCount: number;
  invalidEmailCount: number;
  contactsWithoutEmail: RecipientContact[];
  contactsWithEmail: RecipientContact[];
  duplicateCount: number;
  dataQualityIssues: string[];
} {
  const totalContacts = contacts.length;
  const contactsWithEmail = contacts.filter((c) => c.hasValidEmail);
  const contactsWithoutEmail = contacts.filter((c) => !c.hasValidEmail);

  // Check for duplicates
  const uniqueIds = new Set(contacts.map((c) => c.id));
  const duplicateCount = totalContacts - uniqueIds.size;

  // Identify data quality issues
  const dataQualityIssues: string[] = [];

  if (duplicateCount > 0) {
    dataQualityIssues.push(`${duplicateCount} duplicate contact(s) detected`);
  }

  const contactsWithoutNames = contacts.filter((c) => !c.firstname?.trim() && !c.lastname?.trim());
  if (contactsWithoutNames.length > 0) {
    dataQualityIssues.push(
      `${contactsWithoutNames.length} contact(s) missing both first and last names`,
    );
  }

  const contactsWithPartialNames = contacts.filter(
    (c) =>
      (!c.firstname?.trim() && c.lastname?.trim()) || (c.firstname?.trim() && !c.lastname?.trim()),
  );
  if (contactsWithPartialNames.length > 0) {
    dataQualityIssues.push(
      `${contactsWithPartialNames.length} contact(s) missing either first or last name`,
    );
  }

  return {
    totalContacts,
    validEmailCount: contactsWithEmail.length,
    invalidEmailCount: contactsWithoutEmail.length,
    contactsWithoutEmail,
    contactsWithEmail,
    duplicateCount,
    dataQualityIssues,
  };
}

/**
 * Sorts contacts by display name in a locale-aware manner
 * @param contacts - Array of contacts to sort
 * @returns Sorted array of contacts
 */
export function sortContactsByDisplayName(contacts: RecipientContact[]): RecipientContact[] {
  return [...contacts].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Filters contacts based on search query
 * Searches across name, email, and phone fields
 * @param contacts - Array of contacts to filter
 * @param query - Search query string
 * @returns Filtered array of contacts matching the query
 */
export function filterContactsByQuery(
  contacts: RecipientContact[],
  query: string,
): RecipientContact[] {
  if (!query.trim()) {
    return contacts;
  }

  const searchTerm = query.toLowerCase().trim();

  return contacts.filter((contact) => {
    const searchFields = [
      contact.displayName,
      contact.firstname,
      contact.lastname,
      contact.email,
      contact.phone,
    ]
      .filter(Boolean)
      .map((field) => field?.toLowerCase() || '');

    return searchFields.some((field) => field.includes(searchTerm));
  });
}
