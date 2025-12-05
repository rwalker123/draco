'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUserManagementService } from '../services/userManagementService';
import { AutoRegisterContactResponseType } from '@draco/shared-schemas';

export interface RegistrationRevocationResult {
  success: boolean;
  message?: string;
  error?: string;
  contactId?: string;
}

export interface AutoRegistrationResult {
  success: boolean;
  error?: string;
  response?: AutoRegisterContactResponseType;
}

/**
 * Hook for registration operations
 * Self-contained hook for managing user registration operations
 */
export function useRegistrationOperations(accountId: string) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const userService = token ? createUserManagementService(token) : null;

  const revokeRegistration = useCallback(
    async (contactId: string): Promise<RegistrationRevocationResult> => {
      if (!userService) {
        return { success: false, error: 'User service not available' };
      }

      try {
        setLoading(true);

        await userService.revokeRegistration(accountId, contactId);

        return {
          success: true,
          message: 'Registration removed successfully',
          contactId,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to revoke registration';
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [userService, accountId],
  );

  const autoRegisterContact = useCallback(
    async (contactId: string): Promise<AutoRegistrationResult> => {
      if (!userService) {
        return { success: false, error: 'User service not available' };
      }

      try {
        setLoading(true);

        const response = await userService.autoRegisterContact(accountId, contactId);

        return { success: true, response };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to auto-register';
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [userService, accountId],
  );

  return {
    revokeRegistration,
    autoRegisterContact,
    loading,
  };
}
