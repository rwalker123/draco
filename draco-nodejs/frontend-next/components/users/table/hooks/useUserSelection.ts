import {
  EnhancedUser,
  UserSelectionConfig,
  SelectionMode,
  UserSelectionState,
} from '../../../../types/userTable';
import { getFullName } from '../../../../utils/contactUtils';
import { ContactType } from '@draco/shared-schemas';

export const enhanceUser = (user: ContactType): EnhancedUser => {
  const displayName = getFullName(user.firstName, user.lastName, user.middleName);

  const contact = user.contactDetails;
  const addressParts = [contact?.streetAddress, contact?.city, contact?.state, contact?.zip].filter(
    Boolean,
  );
  const fullAddress = addressParts.join(', ') || '';

  const primaryPhone = contact?.phone1 || contact?.phone2 || contact?.phone3 || '';

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

export const useEnhancedUsers = (users: ContactType[]): EnhancedUser[] => {
  return users.map((user) => enhanceUser(user));
};

export const useSelectionConfig = (
  mode: SelectionMode = 'none',
  maxSelection?: number,
  onSelectionChange?: (selection: UserSelectionState, users: EnhancedUser[]) => void,
  customDisabled?: (user: EnhancedUser) => boolean,
): UserSelectionConfig => {
  return {
    mode,
    maxSelection,
    disabled: customDisabled,
    onSelectionChange,
    validateSelection: (users: EnhancedUser[]) => {
      return users.every((user) => user.selectable !== false);
    },
  };
};

export const usePermissionBasedSelection = (
  canManageUsers: boolean,
  mode: SelectionMode = 'none',
  maxSelection?: number,
  onSelectionChange?: (selection: UserSelectionState, users: EnhancedUser[]) => void,
): UserSelectionConfig => {
  const customDisabled = !canManageUsers ? () => true as const : undefined;

  return useSelectionConfig(
    canManageUsers ? mode : 'none',
    maxSelection,
    onSelectionChange,
    customDisabled,
  );
};

export const sortEnhancedUsers = (
  users: EnhancedUser[],
  field: keyof EnhancedUser | string,
  direction: 'asc' | 'desc' = 'asc',
): EnhancedUser[] => {
  return [...users].sort((a, b) => {
    let aValue: unknown;
    let bValue: unknown;

    if (field.includes('.')) {
      const fields = field.split('.');
      aValue = fields.reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], a);
      bValue = fields.reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], b);
    } else {
      aValue = a[field as keyof EnhancedUser];
      bValue = b[field as keyof EnhancedUser];
    }

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return direction === 'asc' ? 1 : -1;
    if (bValue == null) return direction === 'asc' ? -1 : 1;

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

    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      const comparison = aValue.length - bValue.length;
      return direction === 'asc' ? comparison : -comparison;
    }

    const aStr = String(aValue);
    const bStr = String(bValue);
    const comparison = aStr.localeCompare(bStr);
    return direction === 'asc' ? comparison : -comparison;
  });
};
