'use client';

import { useCallback, useState } from 'react';
import type { BaseContactType, ContactType } from '@draco/shared-schemas';
import { validateContactPhotoFile } from '../config/contacts';
import { mapContactToCreateValues } from '../utils/contactFormUtils';
import { useContactOperations } from './useContactOperations';

export interface ContactPhotoUploadResult {
  success: boolean;
  contact?: ContactType;
  message?: string;
  error?: string;
}

export const useContactPhotoUpload = (accountId: string) => {
  const { updateContact, loading } = useContactOperations(accountId);
  const [error, setError] = useState<string | null>(null);

  const uploadContactPhoto = useCallback(
    async (contact: BaseContactType, file: File): Promise<ContactPhotoUploadResult> => {
      const validationError = validateContactPhotoFile(file);
      if (validationError) {
        setError(validationError);
        return { success: false, error: validationError };
      }

      const payload = mapContactToCreateValues(contact);
      const result = await updateContact(contact.id, { contactData: payload, photoFile: file });

      if (result.success && result.contact) {
        setError(null);
        return {
          success: true,
          contact: result.contact,
          message: result.message,
        };
      }

      const fallbackError = result.error || 'Failed to update contact photo';
      setError(fallbackError);
      return { success: false, error: fallbackError };
    },
    [updateContact],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    uploadContactPhoto,
    loading,
    error,
    clearError,
  };
};
