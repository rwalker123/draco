'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { createUserManagementService } from '../services/userManagementService';
import { ContactType, CreateContactType } from '@draco/shared-schemas';
import { updateContact as apiUpdateContact } from '@draco/shared-api-client';
import { addCacheBuster } from '../config/contacts';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';

export interface ContactOperationData {
  contactData: CreateContactType;
  photoFile?: File | null;
}

export interface ContactOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  contact?: ContactType;
}

/**
 * Hook for contact create/edit operations
 * Self-contained hook for managing contact operations
 */
export function useContactOperations(accountId: string) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const apiClient = useApiClient();
  const userService = token ? createUserManagementService(token) : null;

  const createContact = useCallback(
    async (data: ContactOperationData): Promise<ContactOperationResult> => {
      if (!userService) {
        return { success: false, error: 'User service not available' };
      }

      try {
        setLoading(true);

        const newContact = await userService.createContact(
          accountId,
          data.contactData,
          data.photoFile,
        );

        return {
          success: true,
          message: 'Contact created successfully',
          contact: newContact,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create contact';
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [userService, accountId],
  );

  const updateContact = useCallback(
    async (contactId: string, data: ContactOperationData): Promise<ContactOperationResult> => {
      if (!userService) {
        return { success: false, error: 'User service not available' };
      }

      try {
        setLoading(true);

        // Use the same API pattern as the original implementation
        const result = data.photoFile
          ? await apiUpdateContact({
              path: { accountId, contactId },
              client: apiClient,
              throwOnError: false,
              body: { ...data.contactData, photo: data.photoFile },
              ...formDataBodySerializer,
              headers: { 'Content-Type': null },
            })
          : await apiUpdateContact({
              path: { accountId, contactId },
              client: apiClient,
              throwOnError: false,
              body: { ...data.contactData, photo: undefined },
            });

        if (result.data) {
          const updatedContact = result.data;

          // Apply cache busting to photo URL if present
          const updatedPhotoUrl = updatedContact.photoUrl
            ? addCacheBuster(updatedContact.photoUrl, Date.now())
            : undefined;

          const contactWithCacheBustedPhoto: ContactType = {
            ...updatedContact,
            photoUrl: updatedPhotoUrl,
            contactDetails: updatedContact.contactDetails
              ? {
                  phone1: updatedContact.contactDetails.phone1 || null,
                  phone2: updatedContact.contactDetails.phone2 || null,
                  phone3: updatedContact.contactDetails.phone3 || null,
                  streetAddress: updatedContact.contactDetails.streetAddress || null,
                  city: updatedContact.contactDetails.city || null,
                  state: updatedContact.contactDetails.state || null,
                  zip: updatedContact.contactDetails.zip || null,
                  dateOfBirth: updatedContact.contactDetails.dateOfBirth || null,
                }
              : undefined,
          };

          return {
            success: true,
            message: 'Contact updated successfully',
            contact: contactWithCacheBustedPhoto,
          };
        } else {
          return {
            success: false,
            error: result.error?.message || 'Failed to update contact',
          };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [userService, accountId, apiClient],
  );

  return {
    createContact,
    updateContact,
    loading,
  };
}
