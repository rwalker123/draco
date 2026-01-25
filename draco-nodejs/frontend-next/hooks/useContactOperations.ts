'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { createUserManagementService } from '../services/userManagementService';
import { ContactType, CreateContactType } from '@draco/shared-schemas';
import { updateContact as apiUpdateContact } from '@draco/shared-api-client';
import { addCacheBuster } from '../config/contacts';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { unwrapApiResult } from '../utils/apiResult';

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

  const createContact = async (data: ContactOperationData): Promise<ContactOperationResult> => {
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
  };

  const updateContact = async (
    contactId: string,
    data: ContactOperationData,
  ): Promise<ContactOperationResult> => {
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

      const updatedContact = unwrapApiResult(result, 'Failed to update contact');

      // Apply cache busting to photo URL if present
      const updatedPhotoUrl = updatedContact.photoUrl
        ? addCacheBuster(updatedContact.photoUrl, Date.now())
        : undefined;

      const contactWithCacheBustedPhoto: ContactType = {
        ...updatedContact,
        photoUrl: updatedPhotoUrl,
        contactDetails: updatedContact.contactDetails
          ? {
              phone1: updatedContact.contactDetails.phone1 || '',
              phone2: updatedContact.contactDetails.phone2 || '',
              phone3: updatedContact.contactDetails.phone3 || '',
              streetAddress: updatedContact.contactDetails.streetAddress || '',
              city: updatedContact.contactDetails.city || '',
              state: updatedContact.contactDetails.state || '',
              zip: updatedContact.contactDetails.zip || '',
              dateOfBirth: updatedContact.contactDetails.dateOfBirth || '',
            }
          : undefined,
      };

      return {
        success: true,
        message: 'Contact updated successfully',
        contact: contactWithCacheBustedPhoto,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    createContact,
    updateContact,
    loading,
  };
}
