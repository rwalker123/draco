/**
 * Email Recipient Data Transformation Utilities
 *
 * This module provides utilities to transform backend API responses into frontend component types.
 * It handles data validation, normalization, and grouping logic while following DRY principles.
 */

import { RecipientContact, TeamGroup, RoleGroup } from '../types/emails/recipients';
import { UserRole, ContactRole } from '../types/users';
import { BackendContact, BackendTeam } from '../services/emailRecipientService';
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
      return transformationCache.get(key);
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
 * Groups contacts by their role types to create role-based selection groups
 * @param contacts - Array of RecipientContact objects
 * @returns Array of RoleGroup objects for role-based selection
 */
export function transformContactsToRoleGroups(contacts: RecipientContact[]): RoleGroup[] {
  // Group contacts by role type
  const roleMap = new Map<
    string,
    {
      roleId: string;
      roleName: string;
      roleData: string;
      contacts: RecipientContact[];
    }
  >();

  contacts.forEach((contact) => {
    if (!contact.roles) return;

    contact.roles.forEach((role) => {
      const key = role.roleId;

      if (!roleMap.has(key)) {
        roleMap.set(key, {
          roleId: role.roleId,
          roleName: role.roleName,
          roleData: role.roleData,
          contacts: [],
        });
      }

      // Avoid duplicate contacts in the same role group
      const group = roleMap.get(key)!;
      if (!group.contacts.find((c) => c.id === contact.id)) {
        group.contacts.push(contact);
      }
    });
  });

  // Convert map to RoleGroup array
  return Array.from(roleMap.entries()).map(([key, group]) => ({
    id: key,
    name: group.roleName || 'Unknown Role',
    roleType: group.roleName,
    roleId: group.roleId,
    permissions: [], // Would need role definition data to populate this
    members: group.contacts.sort((a, b) => a.displayName.localeCompare(b.displayName)),
  }));
}

/**
 * Creates team groups from backend team data with rosters and managers
 * Handles deduplication and creates separate groups for players, managers, and combined
 * Uses optimized transformations for better performance
 * @param teams - Array of backend team objects
 * @param rosters - Map of team ID to player contacts
 * @param managers - Map of team ID to manager contacts
 * @returns Array of TeamGroup objects for team-based selection
 */
export function transformTeamsToGroups(
  teams: BackendTeam[],
  rosters: Map<string, BackendContact[]>,
  managers: Map<string, BackendContact[]>,
): TeamGroup[] {
  const teamGroups: TeamGroup[] = [];

  teams.forEach((team) => {
    const teamRoster = rosters.get(team.id) || [];
    const teamManagers = managers.get(team.id) || [];

    // Transform contacts using optimized batch transformation
    const rosterContacts = batchTransformBackendContacts(teamRoster);
    const managerContacts = batchTransformBackendContacts(teamManagers);

    // Create players group if roster exists
    if (rosterContacts.length > 0) {
      teamGroups.push({
        id: `${team.id}-players`,
        name: `${team.name} - Players`,
        type: 'players',
        description: `All players on ${team.name}${team.leagueName ? ` (${team.leagueName})` : ''}`,
        members: optimizedSortContactsByDisplayName(rosterContacts),
      });
    }

    // Create managers group if managers exist
    if (managerContacts.length > 0) {
      teamGroups.push({
        id: `${team.id}-managers`,
        name: `${team.name} - Managers`,
        type: 'managers',
        description: `All managers for ${team.name}${team.leagueName ? ` (${team.leagueName})` : ''}`,
        members: optimizedSortContactsByDisplayName(managerContacts),
      });
    }

    // Create combined group if both exist
    if (rosterContacts.length > 0 && managerContacts.length > 0) {
      // Deduplicate contacts based on ID
      const allContacts = [...rosterContacts, ...managerContacts];
      const uniqueContacts = deduplicateContacts(allContacts);

      teamGroups.push({
        id: `${team.id}-all`,
        name: `${team.name} - All`,
        type: 'all',
        description: `All players and managers for ${team.name}${team.leagueName ? ` (${team.leagueName})` : ''}`,
        members: optimizedSortContactsByDisplayName(uniqueContacts),
      });
    }

    // Create sports group for general team communication
    if (rosterContacts.length > 0 || managerContacts.length > 0) {
      const allContacts = [...rosterContacts, ...managerContacts];
      const uniqueContacts = deduplicateContacts(allContacts);

      teamGroups.push({
        id: `${team.id}-sports`,
        name: `${team.name} - Team`,
        type: 'sports',
        description: `Team communication group for ${team.name}`,
        members: optimizedSortContactsByDisplayName(uniqueContacts),
      });
    }
  });

  return teamGroups;
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
 * Transforms backend role holder data to RoleGroup format
 * Used for automatic role holders (e.g., account admins, contact admins)
 * @param roleData - Backend role holder response data
 * @returns Array of RoleGroup objects
 */
export function transformAutomaticRoleHolders(
  roleData: Array<{
    roleId: string;
    roleName: string;
    roleData: string;
    contextName?: string;
    contacts: BackendContact[];
  }>,
): RoleGroup[] {
  return roleData.map((role) => ({
    id: role.roleId,
    name: role.roleName,
    roleType: role.roleName,
    roleId: role.roleId,
    permissions: [], // Would need role definition to populate
    members: role.contacts
      .map(transformBackendContact)
      .sort((a, b) => a.displayName.localeCompare(b.displayName)),
  }));
}

// Interface for backend contact from automatic role holders endpoint
interface BaseBackendContact {
  id: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  email: string | null;
}

interface TeamManagerWithTeams extends BaseBackendContact {
  teams: Array<{
    teamSeasonId: string;
    teamName: string;
  }>;
}

/**
 * Transforms backend automatic role holders response to RoleGroup format
 * Handles the actual backend response structure with accountOwner and teamManagers
 * @param accountOwner - Account owner contact
 * @param teamManagers - Array of team managers with teams
 * @returns Array of RoleGroup objects
 */
export function transformBackendAutomaticRoleHolders(
  accountOwner: BaseBackendContact,
  teamManagers: TeamManagerWithTeams[],
): RoleGroup[] {
  const roleGroups: RoleGroup[] = [];

  // Convert account owner to BackendContact format for transformation
  const accountOwnerBackendContact: BackendContact = {
    id: accountOwner.id,
    firstName: accountOwner.firstname,
    lastName: accountOwner.lastname,
    middleName: accountOwner.middlename || null,
    email: accountOwner.email || '',
    userId: accountOwner.id, // Use contact ID as userId for transformation purposes
    contactroles: undefined,
    teams: undefined,
  };

  // Create Account Owner role group
  roleGroups.push({
    id: 'account-owner',
    name: 'Account Owner',
    roleType: 'Account Owner',
    roleId: 'account-owner',
    permissions: [],
    members: [transformBackendContact(accountOwnerBackendContact)],
  });

  // Create Team Managers role group if there are any team managers
  if (teamManagers.length > 0) {
    const teamManagerContacts = teamManagers.map((manager) => {
      const backendContact: BackendContact = {
        id: manager.id,
        firstName: manager.firstname,
        lastName: manager.lastname,
        middleName: manager.middlename || null,
        email: manager.email || '',
        userId: manager.id, // Use contact ID as userId for transformation purposes
        contactroles: undefined,
        teams: manager.teams.map((team) => team.teamSeasonId),
      };
      return transformBackendContact(backendContact);
    });

    roleGroups.push({
      id: 'team-managers',
      name: 'Team Managers',
      roleType: 'Team Manager',
      roleId: 'team-manager',
      permissions: [],
      members: teamManagerContacts.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    });
  }

  return roleGroups;
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
