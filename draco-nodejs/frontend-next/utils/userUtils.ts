import { ContactType } from '@draco/shared-schemas';
import { Role } from '../types/users';

/**
 * Get display name for a role by roleId
 */
export const getRoleDisplayName = (roleId: string, roles: Role[]): string => {
  const role = roles.find((r) => r.id === roleId);
  return role ? role.name : roleId;
};

/**
 * Format user's full name
 */
export const formatUserName = (user: ContactType): string => {
  return `${user.firstName} ${user.lastName}`.trim();
};

/**
 * Validate user data
 */
export const validateUserData = (user: ContactType): boolean => {
  return !!(user.id && user.firstName && user.lastName && user.email && user.userId);
};

/**
 * Sort users by specified field
 */
export const sortUsers = (
  users: ContactType[],
  sortBy: 'firstName' | 'lastName' | 'email' = 'lastName',
): ContactType[] => {
  return [...users].sort((a, b) => {
    const aValue = a[sortBy]?.toLowerCase() || '';
    const bValue = b[sortBy]?.toLowerCase() || '';
    return aValue.localeCompare(bValue);
  });
};

/**
 * Filter users by search term
 */
export const filterUsersBySearch = (users: ContactType[], searchTerm: string): ContactType[] => {
  if (!searchTerm.trim()) return users;

  const term = searchTerm.toLowerCase();
  return users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      formatUserName(user).toLowerCase().includes(term),
  );
};

/**
 * Get user's role count
 */
export const getUserRoleCount = (user: ContactType): number => {
  return user.contactroles?.length || 0;
};

/**
 * Check if user has specific role
 */
export const userHasRole = (user: ContactType, roleId: string): boolean => {
  return user.contactroles?.some((role) => role.roleId === roleId) || false;
};

/**
 * Get user's role names as array
 */
export const getUserRoleNames = (user: ContactType, roles: Role[]): string[] => {
  return user.contactroles?.map((role) => getRoleDisplayName(role.roleId, roles)) || [];
};

/**
 * Format user for display in autocomplete
 */
export const formatUserForAutocomplete = (user: ContactType): { label: string; value: string } => {
  return {
    label: `${formatUserName(user)} (${user.email || ''})`,
    value: user.id,
  };
};
