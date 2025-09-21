'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUserManagementService } from '../services/userManagementService';
import { ContactType, ContactRoleType } from '@draco/shared-schemas';

export interface RoleRemovalData {
  user: ContactType;
  role: ContactRoleType;
}

export interface RoleRemovalResult {
  success: boolean;
  message?: string;
  error?: string;
  removedRole?: {
    contactId: string;
    roleId: string;
    id: string; // The unique database ID
  };
}

/**
 * Hook for role removal operations
 * Self-contained hook for removing roles from users
 */
export function useRoleRemoval(accountId: string) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const userService = token ? createUserManagementService(token) : null;

  const removeRole = useCallback(
    async (data: RoleRemovalData): Promise<RoleRemovalResult> => {
      if (!userService) {
        return { success: false, error: 'User service not available' };
      }

      const { user, role } = data;

      try {
        setLoading(true);

        const removedRoleData = await userService.removeRole(
          accountId,
          user.id,
          role.roleId,
          role.roleData,
        );

        return {
          success: true,
          message: 'Role removed successfully',
          removedRole: {
            contactId: user.id,
            roleId: role.roleId,
            id: removedRoleData.id, // Extract unique ID from backend response
          },
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [userService, accountId],
  );

  return {
    removeRole,
    loading,
  };
}
