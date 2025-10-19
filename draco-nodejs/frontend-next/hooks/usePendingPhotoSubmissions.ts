import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApiClient } from './useApiClient';
import {
  approveAccountPhotoSubmission,
  approveTeamPhotoSubmission,
  denyAccountPhotoSubmission,
  denyTeamPhotoSubmission,
  listPendingAccountPhotoSubmissions,
  listPendingTeamPhotoSubmissions,
} from '@draco/shared-api-client';
import type { PhotoSubmissionDetailType } from '@draco/shared-schemas';
import { ApiClientError, unwrapApiResult } from '../utils/apiResult';

interface UsePendingPhotoSubmissionsOptions {
  accountId?: string | null;
  teamId?: string | null;
  enabled?: boolean;
}

export interface PendingPhotoSubmissionsState {
  submissions: PhotoSubmissionDetailType[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  processingIds: ReadonlySet<string>;
  refresh: () => Promise<void>;
  approve: (submissionId: string) => Promise<boolean>;
  deny: (submissionId: string, reason: string) => Promise<boolean>;
  clearStatus: () => void;
}

const normalizeId = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const createProcessingSet = (current: ReadonlySet<string>, submissionId: string, add: boolean) => {
  const next = new Set(current);
  if (add) {
    next.add(submissionId);
  } else {
    next.delete(submissionId);
  }
  return next;
};

export const usePendingPhotoSubmissions = ({
  accountId,
  teamId,
  enabled = true,
}: UsePendingPhotoSubmissionsOptions): PendingPhotoSubmissionsState => {
  const apiClient = useApiClient();
  const normalizedAccountId = useMemo(() => normalizeId(accountId), [accountId]);
  const normalizedTeamId = useMemo(() => normalizeId(teamId), [teamId]);

  const [submissions, setSubmissions] = useState<PhotoSubmissionDetailType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<ReadonlySet<string>>(() => new Set());

  const canQuery = Boolean(enabled && normalizedAccountId);

  const fetchSubmissions = useCallback(async () => {
    if (!canQuery) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = normalizedTeamId
        ? await listPendingTeamPhotoSubmissions({
            client: apiClient,
            path: { accountId: normalizedAccountId!, teamId: normalizedTeamId },
            throwOnError: false,
          })
        : await listPendingAccountPhotoSubmissions({
            client: apiClient,
            path: { accountId: normalizedAccountId! },
            throwOnError: false,
          });

      const data = unwrapApiResult(result, 'Failed to load pending photo submissions');
      setSubmissions(data.submissions ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError ? err.message : 'Failed to load pending photo submissions';
      setError(message);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient, canQuery, normalizedAccountId, normalizedTeamId]);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  const clearStatus = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const approve = useCallback(
    async (submissionId: string): Promise<boolean> => {
      if (!canQuery || !normalizedAccountId) {
        setError('Account information is required to approve submissions.');
        return false;
      }

      setProcessingIds((current) => createProcessingSet(current, submissionId, true));
      setError(null);

      const submission = submissions.find((item) => item.id === submissionId);

      try {
        const result = normalizedTeamId
          ? await approveTeamPhotoSubmission({
              client: apiClient,
              path: { accountId: normalizedAccountId, teamId: normalizedTeamId, submissionId },
              throwOnError: false,
            })
          : await approveAccountPhotoSubmission({
              client: apiClient,
              path: { accountId: normalizedAccountId, submissionId },
              throwOnError: false,
            });

        unwrapApiResult(result, 'Failed to approve photo submission');
        await fetchSubmissions();
        if (submission) {
          setSuccessMessage(`Approved “${submission.title}”.`);
        } else {
          setSuccessMessage('Submission approved.');
        }
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof ApiClientError ? err.message : 'Failed to approve photo submission';
        setError(message);
        return false;
      } finally {
        setProcessingIds((current) => createProcessingSet(current, submissionId, false));
      }
    },
    [apiClient, canQuery, fetchSubmissions, normalizedAccountId, normalizedTeamId, submissions],
  );

  const deny = useCallback(
    async (submissionId: string, reason: string): Promise<boolean> => {
      if (!canQuery || !normalizedAccountId) {
        setError('Account information is required to deny submissions.');
        return false;
      }

      setProcessingIds((current) => createProcessingSet(current, submissionId, true));
      setError(null);

      const submission = submissions.find((item) => item.id === submissionId);

      try {
        const result = normalizedTeamId
          ? await denyTeamPhotoSubmission({
              client: apiClient,
              path: { accountId: normalizedAccountId, teamId: normalizedTeamId, submissionId },
              body: { denialReason: reason },
              throwOnError: false,
            })
          : await denyAccountPhotoSubmission({
              client: apiClient,
              path: { accountId: normalizedAccountId, submissionId },
              body: { denialReason: reason },
              throwOnError: false,
            });

        unwrapApiResult(result, 'Failed to deny photo submission');
        await fetchSubmissions();
        if (submission) {
          setSuccessMessage(`Denied “${submission.title}”.`);
        } else {
          setSuccessMessage('Submission denied.');
        }
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof ApiClientError ? err.message : 'Failed to deny photo submission';
        setError(message);
        return false;
      } finally {
        setProcessingIds((current) => createProcessingSet(current, submissionId, false));
      }
    },
    [apiClient, canQuery, fetchSubmissions, normalizedAccountId, normalizedTeamId, submissions],
  );

  const refresh = useCallback(async () => {
    await fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    loading,
    error,
    successMessage,
    processingIds,
    refresh,
    approve,
    deny,
    clearStatus,
  };
};

export default usePendingPhotoSubmissions;
