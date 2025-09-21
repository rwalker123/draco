'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUserManagementService } from '../services/userManagementService';

export interface PhotoDeletionResult {
  success: boolean;
  message?: string;
  error?: string;
  contactId?: string;
}

/**
 * Hook for photo operations
 * Self-contained hook for managing contact photo operations
 */
export function usePhotoOperations(accountId: string) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const userService = token ? createUserManagementService(token) : null;

  const deletePhoto = useCallback(
    async (contactId: string): Promise<PhotoDeletionResult> => {
      if (!userService) {
        return { success: false, error: 'User service not available' };
      }

      try {
        setLoading(true);

        await userService.deleteContactPhoto(accountId, contactId);

        return {
          success: true,
          message: 'Contact photo deleted successfully',
          contactId,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo';
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [userService, accountId],
  );

  return {
    deletePhoto,
    loading,
  };
}
