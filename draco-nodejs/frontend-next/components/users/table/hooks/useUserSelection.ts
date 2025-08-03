import { useMemo } from 'react';
import {
  EnhancedUser,
  UserSelectionConfig,
  SelectionMode,
  UserSelectionState,
  UserAdvancedFilters,
} from '../../../../types/userTable';
import { User } from '../../../../types/users';

// Utility functions for user enhancement and selection
export const enhanceUser = (user: User): EnhancedUser => {
  const displayName = `${user.firstName} ${user.lastName}`.trim();

  // Build full address from contact details
  const contact = user.contactDetails;
  const addressParts = [contact?.streetaddress, contact?.city, contact?.state, contact?.zip].filter(
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
      contact?.streetaddress ||
      fullAddress ||
      contact?.dateofbirth,
  );

  // Get active role names
  const activeRoleNames = user.roles?.map((role) => role.roleName).filter(Boolean) || [];

  return {
    ...user,
    displayName,
    fullAddress,
    primaryPhone,
    roleCount: user.roles?.length || 0,
    hasContactInfo,
    activeRoleNames,
    selected: false,
    selectable: true,
  };
};

// Hook for creating enhanced users from regular users
export const useEnhancedUsers = (users: User[]): EnhancedUser[] => {
  return useMemo(() => users.map(enhanceUser), [users]);
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

// Hook for managing user filtering and sorting
export const useUserFiltering = (
  users: EnhancedUser[],
  searchTerm: string = '',
  filters: UserAdvancedFilters = {},
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'asc',
) => {
  return useMemo(() => {
    let filteredUsers = [...users];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          (user.displayName?.toLowerCase() || '').includes(searchLower) ||
          (user.email?.toLowerCase() || '').includes(searchLower) ||
          (user.primaryPhone?.toLowerCase() || '').includes(searchLower) ||
          user.activeRoleNames?.some((role) => role?.toLowerCase()?.includes(searchLower)) ||
          false,
      );
    }

    // Apply advanced filters
    if (filters.roles && filters.roles.length > 0) {
      filteredUsers = filteredUsers.filter(
        (user) => user.activeRoleNames?.some((role) => filters.roles!.includes(role)) || false,
      );
    }

    if (filters.hasContactInfo !== undefined) {
      filteredUsers = filteredUsers.filter(
        (user) => user.hasContactInfo === filters.hasContactInfo,
      );
    }

    if (filters.contactMethods && filters.contactMethods.length > 0) {
      filteredUsers = filteredUsers.filter((user) => {
        const methods = filters.contactMethods!;
        return methods.some((method) => {
          switch (method) {
            case 'email':
              return Boolean(user.email);
            case 'phone':
              return Boolean(user.primaryPhone);
            case 'address':
              return Boolean(user.fullAddress);
            default:
              return false;
          }
        });
      });
    }

    // Apply sorting
    if (sortField) {
      filteredUsers = sortEnhancedUsers(filteredUsers, sortField, sortDirection);
    }

    return filteredUsers;
  }, [users, searchTerm, filters, sortField, sortDirection]);
};
