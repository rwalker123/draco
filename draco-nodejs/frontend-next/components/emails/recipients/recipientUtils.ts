import { Contact } from '../../../types/emails/email';
import {
  RecipientContact,
  TeamGroup,
  RoleGroup,
  RecipientSelectionState,
  RecipientValidationResult,
} from '../../../types/emails/recipients';
import { hasValidEmail, getContactDisplayName } from '../common/mailtoUtils';

/**
 * Transform a Contact to RecipientContact with computed properties
 */
export function transformToRecipientContact(contact: Contact): RecipientContact {
  return {
    ...contact,
    displayName: getContactDisplayName(contact),
    hasValidEmail: hasValidEmail(contact),
  };
}

/**
 * Validate email address format
 */
export function isValidEmailAddress(email?: string): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Get all effective recipients (deduplicating overlapping selections)
 */
export function getEffectiveRecipients(
  state: RecipientSelectionState,
  allContacts: RecipientContact[],
): RecipientContact[] {
  const recipientIds = new Set<string>();

  // Add all contacts if selected
  if (state.allContacts) {
    allContacts.forEach((contact) => {
      if (contact.hasValidEmail) {
        recipientIds.add(contact.id);
      }
    });
  } else {
    // Add individually selected contacts
    state.selectedContactIds.forEach((id) => {
      const contact = allContacts.find((c) => c.id === id);
      if (contact && contact.hasValidEmail) {
        recipientIds.add(id);
      }
    });

    // Add contacts from team groups
    state.selectedTeamGroups.forEach((team) => {
      team.members.forEach((member) => {
        if (hasValidEmail(member)) {
          recipientIds.add(member.id);
        }
      });
    });

    // Add contacts from role groups
    state.selectedRoleGroups.forEach((role) => {
      role.members.forEach((member) => {
        if (hasValidEmail(member)) {
          recipientIds.add(member.id);
        }
      });
    });
  }

  return allContacts.filter((contact) => recipientIds.has(contact.id));
}

/**
 * Calculate recipient counts and validation
 */
export function validateRecipientSelection(
  state: RecipientSelectionState,
  allContacts: RecipientContact[],
  maxRecipients?: number,
): RecipientValidationResult {
  const effectiveRecipients = getEffectiveRecipients(state, allContacts);
  const validEmailCount = effectiveRecipients.filter((r) => r.hasValidEmail).length;
  const invalidEmailCount = effectiveRecipients.filter((r) => !r.hasValidEmail).length;
  const totalRecipients = effectiveRecipients.length;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if any recipients are selected
  if (totalRecipients === 0) {
    errors.push('No recipients selected');
  }

  // Check for valid emails
  if (validEmailCount === 0 && totalRecipients > 0) {
    errors.push('No recipients with valid email addresses');
  }

  // Check maximum recipients
  if (maxRecipients && totalRecipients > maxRecipients) {
    errors.push(
      `Too many recipients selected (${totalRecipients}). Maximum allowed: ${maxRecipients}`,
    );
  }

  // Warnings
  if (invalidEmailCount > 0) {
    warnings.push(`${invalidEmailCount} recipients will be skipped due to missing email addresses`);
  }

  if (totalRecipients > 100) {
    warnings.push('Large recipient count - consider using smaller, targeted groups');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalRecipients,
    validEmailCount,
    invalidEmailCount,
  };
}

/**
 * Filter contacts based on search query
 */
export function filterContactsBySearch(
  contacts: RecipientContact[],
  searchQuery: string,
): RecipientContact[] {
  if (!searchQuery.trim()) return contacts;

  const query = searchQuery.toLowerCase().trim();

  return contacts.filter((contact) => {
    return (
      contact.displayName.toLowerCase().includes(query) ||
      contact.firstname.toLowerCase().includes(query) ||
      contact.lastname.toLowerCase().includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      (contact.phone && contact.phone.includes(query))
    );
  });
}

/**
 * Group contacts by first letter for display
 */
export function groupContactsByFirstLetter(
  contacts: RecipientContact[],
): Map<string, RecipientContact[]> {
  const groups = new Map<string, RecipientContact[]>();

  contacts.forEach((contact) => {
    const firstLetter = contact.displayName.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(contact);
  });

  // Sort each group
  groups.forEach((group) => {
    group.sort((a, b) => a.displayName.localeCompare(b.displayName));
  });

  return groups;
}

/**
 * Get recipient selection summary for display
 */
export function getSelectionSummary(
  state: RecipientSelectionState,
  allContacts: RecipientContact[],
): {
  individual: number;
  groups: number;
  total: number;
  description: string;
} {
  const individualCount = state.selectedContactIds.size;
  const groupCount =
    state.selectedTeamGroups.length + state.selectedRoleGroups.length + (state.allContacts ? 1 : 0);
  const totalRecipients = getEffectiveRecipients(state, allContacts).length;

  let description = '';

  if (state.allContacts) {
    description = 'All Contacts';
  } else if (individualCount > 0 && groupCount > 0) {
    description = `${individualCount} individuals + ${groupCount} groups`;
  } else if (individualCount > 0) {
    description = `${individualCount} individuals`;
  } else if (groupCount > 0) {
    description = `${groupCount} groups`;
  } else {
    description = 'No recipients selected';
  }

  return {
    individual: individualCount,
    groups: groupCount,
    total: totalRecipients,
    description,
  };
}

/**
 * Create a team group from user data
 */
export function createTeamGroup(
  teamId: string,
  teamName: string,
  type: 'managers' | 'players' | 'all',
  contacts: RecipientContact[],
): TeamGroup {
  // Filter contacts based on team type
  const teamContacts = contacts.filter((contact) => {
    if (!contact.teams) return false;

    const isInTeam = contact.teams.includes(teamId);
    if (!isInTeam) return false;

    if (type === 'all') return true;

    if (type === 'managers') {
      return (
        contact.roles?.some(
          (role) =>
            role.roleName.toLowerCase().includes('manager') ||
            role.roleName.toLowerCase().includes('coach'),
        ) ?? false
      );
    }

    if (type === 'players') {
      const hasManagerRole =
        contact.roles?.some(
          (role) =>
            role.roleName.toLowerCase().includes('manager') ||
            role.roleName.toLowerCase().includes('coach'),
        ) ?? false;
      return !hasManagerRole;
    }

    return false;
  });

  return {
    id: `${teamId}-${type}`,
    name: `${teamName} ${type === 'all' ? 'All' : type === 'managers' ? 'Managers' : 'Players'}`,
    type,
    members: teamContacts,
    description: `${type === 'all' ? 'All team members' : type === 'managers' ? 'Team managers' : 'Team players'}`,
  };
}

/**
 * Create a role group from role data
 */
export function createRoleGroup(
  roleId: string,
  roleName: string,
  contacts: RecipientContact[],
): RoleGroup {
  const roleContacts = contacts.filter(
    (contact) => contact.roles?.some((role) => role.roleId === roleId) ?? false,
  );

  return {
    id: roleId, // Use roleId as the id
    roleId,
    name: roleName,
    roleType: 'contact', // Default role type
    members: roleContacts,
    permissions: ['view'], // Default permissions
  };
}
