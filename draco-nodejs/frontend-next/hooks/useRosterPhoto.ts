'use client';

import { useState } from 'react';
import type { ContactType } from '@draco/shared-schemas';
import {
  uploadRosterMemberPhoto as apiUploadRosterMemberPhoto,
  deleteRosterMemberPhoto as apiDeleteRosterMemberPhoto,
} from '@draco/shared-api-client';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { addCacheBuster, validateContactPhotoFile } from '../config/contacts';
import { unwrapApiResult } from '../utils/apiResult';
import { useApiClient } from './useApiClient';

export interface RosterPhotoResult {
  success: boolean;
  contact?: ContactType;
  error?: string;
}

interface ApiContact {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  userId?: string;
  loginEmail?: string;
  photoUrl?: string;
}

const toContact = (contact: ApiContact): ContactType => ({
  id: contact.id,
  firstName: contact.firstName,
  lastName: contact.lastName,
  middleName: contact.middleName,
  email: contact.email,
  userId: contact.userId,
  loginEmail: contact.loginEmail,
  photoUrl: contact.photoUrl ? addCacheBuster(contact.photoUrl, Date.now()) : undefined,
});

/**
 * Hook for uploading and deleting a roster member's photo via the team-scoped
 * roster endpoints. Used from the team roster page so account admins and
 * (when enabled) team admins share a single authorization path.
 */
export const useRosterPhoto = (accountId: string, seasonId: string, teamSeasonId: string) => {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);

  const uploadPhoto = async (rosterMemberId: string, file: File): Promise<RosterPhotoResult> => {
    const validationError = validateContactPhotoFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      setLoading(true);
      const result = await apiUploadRosterMemberPhoto({
        path: { accountId, seasonId, teamSeasonId, rosterMemberId },
        client: apiClient,
        throwOnError: false,
        body: { photo: file },
        ...formDataBodySerializer,
        headers: { 'Content-Type': null },
      });
      const contact = unwrapApiResult(result, 'Failed to update player photo');
      return { success: true, contact: toContact(contact) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update player photo',
      };
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (rosterMemberId: string): Promise<RosterPhotoResult> => {
    try {
      setLoading(true);
      const result = await apiDeleteRosterMemberPhoto({
        path: { accountId, seasonId, teamSeasonId, rosterMemberId },
        client: apiClient,
        throwOnError: false,
      });
      const contact = unwrapApiResult(result, 'Failed to delete player photo');
      return { success: true, contact: toContact(contact) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete player photo',
      };
    } finally {
      setLoading(false);
    }
  };

  return { uploadPhoto, deletePhoto, loading };
};
