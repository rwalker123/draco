import { useMemo } from 'react';
import {
  EnhancedUser,
  UserSelectionConfig,
  SelectionMode,
  UserSelectionState,
} from '../../../../types/userTable';
import { getFullName } from '../../../../utils/contactUtils';
import { ContactType } from '@draco/shared-schemas';

// Utility functions for user enhancement and selection
export const enhanceUser = (user: ContactType): EnhancedUser => {
  const displayName = getFullName(user.firstName, user.lastName, user.middleName);

  // Build full address from contact details
  const contact = user.contactDetails;
  const addressParts = [contact?.streetAddress, contact?.city, contact?.state, contact?.zip].filter(
    Boolean,
  );
  const fullAddress = addressParts.join(', ') || '';

  // Get primary phone number
  const primaryPhone = contact?.phone1 || contact?.phone2 || contact?.phone3 || '';

  // Check if user has any contact information
  const hasContactInfo = Boolean(
    contact?.phone1 ||
      contact?.phone2 ||
      contact?.phone3 ||
      contact?.streetAddress ||
      fullAddress ||
      contact?.dateOfBirth,
  );

  const enhancedUser: EnhancedUser = {
    ...user,
    displayName,
    fullAddress,
    primaryPhone,
    roleCount: user.contactroles?.length || 0,
    hasContactInfo,
    activeRoleNames: user.contactroles?.map((role) => role.roleName || '').filter(Boolean) || [],
    selected: false,
    selectable: true,
  };

  return enhancedUser;
};

// Hook for creating enhanced users from regular users
// Optimized to prevent unnecessary object recreation with individual user memoization
export const useEnhancedUsers = (users: ContactType[]): EnhancedUser[] => {
  return useMemo(() => users.map((user) => enhanceUser(user)), [users]);
};

// Hook for creating selection configuration with defaults
export const useSelectionConfig = (
  mode: SelectionMode = 'none',
  maxSelection?: number,
  onSelectionChange?: (selection: UserSelectionState, users: EnhancedUser[]) => void,
  customDisabled?: (user: EnhancedUser) => boolean,
): UserSelectionConfig => {
  return useMemo<UserSelectionConfig>(
    () => ({
      mode,
      maxSelection,
      disabled: customDisabled,
      onSelectionChange,
      validateSelection: (users: EnhancedUser[]) => {
        // Default validation - ensure all selected users are selectable
        return users.every((user) => user.selectable !== false);
      },
    }),
    [mode, maxSelection, onSelectionChange, customDisabled],
  );
};

// Hook for permission-based selection configuration
export const usePermissionBasedSelection = (
  canManageUsers: boolean,
  mode: SelectionMode = 'none',
  maxSelection?: number,
  onSelectionChange?: (selection: UserSelectionState, users: EnhancedUser[]) => void,
): UserSelectionConfig => {
  const customDisabled = useMemo(() => {
    if (!canManageUsers) {
      return () => true; // Disable all selection if user can't manage
    }
    return undefined;
  }, [canManageUsers]);

  return useSelectionConfig(
    canManageUsers ? mode : 'none',
    maxSelection,
    onSelectionChange,
    customDisabled,
  );
};

// Utility for sorting enhanced users
export const sortEnhancedUsers = (
  users: EnhancedUser[],
  field: keyof EnhancedUser | string,
  direction: 'asc' | 'desc' = 'asc',
): EnhancedUser[] => {
  return [...users].sort((a, b) => {
    let aValue: unknown;
    let bValue: unknown;

    // Handle nested field access
    if (field.includes('.')) {
      const fields = field.split('.');
      aValue = fields.reduce(
        (obj: unknown, key) => (obj as Record<string, unknown>)?.[key],
        a as unknown,
      );
      bValue = fields.reduce(
        (obj: unknown, key) => (obj as Record<string, unknown>)?.[key],
        b as unknown,
      );
    } else {
      aValue = a[field as keyof EnhancedUser];
      bValue = b[field as keyof EnhancedUser];
    }

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return direction === 'asc' ? 1 : -1;
    if (bValue == null) return direction === 'asc' ? -1 : 1;

    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return direction === 'asc' ? comparison : -comparison;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue;
      return direction === 'asc' ? comparison : -comparison;
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      const comparison = aValue.getTime() - bValue.getTime();
      return direction === 'asc' ? comparison : -comparison;
    }

    // Handle arrays (like activeRoleNames)
    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      const comparison = aValue.length - bValue.length;
      return direction === 'asc' ? comparison : -comparison;
    }

    // Fallback to string comparison
    const aStr = String(aValue);
    const bStr = String(bValue);
    const comparison = aStr.localeCompare(bStr);
    return direction === 'asc' ? comparison : -comparison;
  });
};
