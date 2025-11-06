'use client';

import { useCallback, useMemo, useState } from 'react';
import { UpsertAnnouncementType, AnnouncementType } from '@draco/shared-schemas';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { AnnouncementService } from '../services/announcementService';

export type AnnouncementScope =
  | {
      type: 'account';
      accountId: string;
    }
  | {
      type: 'team';
      accountId: string;
      teamId: string;
    };

export function useAnnouncementOperations(scope: AnnouncementScope) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const service = useMemo(() => new AnnouncementService(token, apiClient), [token, apiClient]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listAnnouncements = useCallback(async (): Promise<AnnouncementType[]> => {
    if (scope.type === 'team') {
      return service.listTeamAnnouncements({
        accountId: scope.accountId,
        teamId: scope.teamId,
      });
    }

    return service.listAccountAnnouncements(scope.accountId);
  }, [scope, service]);

  const createAnnouncement = useCallback(
    async (input: UpsertAnnouncementType): Promise<AnnouncementType> => {
      setLoading(true);
      setError(null);

      try {
        if (scope.type === 'team') {
          return await service.createTeamAnnouncement(
            { accountId: scope.accountId, teamId: scope.teamId },
            input,
          );
        }

        return await service.createAccountAnnouncement(scope.accountId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create announcement';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, service],
  );

  const updateAnnouncement = useCallback(
    async (announcementId: string, input: UpsertAnnouncementType): Promise<AnnouncementType> => {
      setLoading(true);
      setError(null);

      try {
        if (scope.type === 'team') {
          return await service.updateTeamAnnouncement(
            { accountId: scope.accountId, teamId: scope.teamId },
            announcementId,
            input,
          );
        }

        return await service.updateAccountAnnouncement(scope.accountId, announcementId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update announcement';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, service],
  );

  const deleteAnnouncement = useCallback(
    async (announcementId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        if (scope.type === 'team') {
          await service.deleteTeamAnnouncement(
            { accountId: scope.accountId, teamId: scope.teamId },
            announcementId,
          );
        } else {
          await service.deleteAccountAnnouncement(scope.accountId, announcementId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete announcement';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, service],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    listAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    loading,
    error,
    clearError,
  };
}
