/**
 * Email Recipient Data Transformation Utilities
 *
 * This module provides utilities to transform backend API responses into frontend component types.
 * It handles data validation, normalization, and grouping logic while following DRY principles.
 */

import { RecipientContact } from '../types/emails/recipients';
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
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.contactDetails?.phone1, // TODO: add back in consolidated phone numbers
    ]
      .filter(Boolean)
      .map((field) => field?.toLowerCase() || '');

    return searchFields.some((field) => field.includes(searchTerm));
  });
}
