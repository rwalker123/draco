'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUserManagementService } from '../services/userManagementService';
import { DependencyCheckResult } from '../types/users';

export interface ContactDeletionResult {
  success: boolean;
  message?: string;
  error?: string;
  contactId?: string;
  dependenciesDeleted?: number;
  wasForced?: boolean;
}

export interface DependencyCheckResponse {
  success: boolean;
  dependencyCheck?: DependencyCheckResult;
  error?: string;
}

/**
 * Hook for contact deletion operations
 * Self-contained hook for managing contact deletion and dependency checking
 */
export function useContactDeletion(accountId: string) {
  const [loading, setLoading] = useState(false);
  const [checkingDependencies, setCheckingDependencies] = useState(false);
  const { token } = useAuth();
  const userService = token ? createUserManagementService(token) : null;

  const checkDependencies = async (contactId: string): Promise<DependencyCheckResponse> => {
    if (!userService) {
      return { success: false, error: 'User service not available' };
    }

    try {
      setCheckingDependencies(true);
      const result = await userService.checkContactDependencies(accountId, contactId);
      return {
        success: true,
        dependencyCheck: result.dependencyCheck,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check dependencies';
      return { success: false, error: errorMessage };
    } finally {
      setCheckingDependencies(false);
    }
  };

  const deleteContact = async (
    contactId: string,
    force: boolean = false,
  ): Promise<ContactDeletionResult> => {
    if (!userService) {
      return { success: false, error: 'User service not available' };
    }

    try {
      setLoading(true);

      const result = await userService.deleteContact(accountId, contactId, force);

      return {
        success: true,
        message: result.message,
        contactId,
        dependenciesDeleted: result.dependenciesDeleted,
        wasForced: force,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteContact,
    checkDependencies,
    loading,
    checkingDependencies,
  };
}
