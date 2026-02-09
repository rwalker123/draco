import { useEffect, useState } from 'react';
import { useApiClient } from './useApiClient';
import {
  approveAccountPhotoSubmission,
  approveTeamPhotoSubmission,
  denyAccountPhotoSubmission,
  denyTeamPhotoSubmission,
  listPendingAccountPhotoSubmissions,
  listPendingTeamPhotoSubmissions,
  updateAccountGalleryPhoto,
} from '@draco/shared-api-client';
import type { PhotoSubmissionDetailType } from '@draco/shared-schemas';
import { ApiClientError, unwrapApiResult } from '../utils/apiResult';
import { getPhotoEmailWarningMessage } from '../utils/photoSubmissionWarnings';

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
  approve: (submissionId: string, albumId?: string | null) => Promise<boolean>;
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

const normalizeAlbumSelection = (value?: string | null): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
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
  const normalizedAccountId = normalizeId(accountId);
  const normalizedTeamId = normalizeId(teamId);

  const [submissions, setSubmissions] = useState<PhotoSubmissionDetailType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<ReadonlySet<string>>(() => new Set());

  const canQuery = Boolean(enabled && normalizedAccountId);

  useEffect(() => {
    if (!canQuery || !normalizedAccountId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const doFetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = normalizedTeamId
          ? await listPendingTeamPhotoSubmissions({
              client: apiClient,
              path: { accountId: normalizedAccountId, teamId: normalizedTeamId },
              signal: controller.signal,
              throwOnError: false,
            })
          : await listPendingAccountPhotoSubmissions({
              client: apiClient,
              path: { accountId: normalizedAccountId },
              signal: controller.signal,
              throwOnError: false,
            });

        if (controller.signal.aborted) return;
        const data = unwrapApiResult(result, 'Failed to load pending photo submissions');
        setSubmissions(data.submissions ?? []);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof ApiClientError ? err.message : 'Failed to load pending photo submissions';
        setError(message);
        setSubmissions([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void doFetch();
    return () => {
      controller.abort();
    };
  }, [canQuery, normalizedAccountId, normalizedTeamId, apiClient]);

  const reloadSubmissions = async (signal?: AbortSignal) => {
    if (!canQuery || !normalizedAccountId) return;

    setLoading(true);
    setError(null);

    try {
      const result = normalizedTeamId
        ? await listPendingTeamPhotoSubmissions({
            client: apiClient,
            path: { accountId: normalizedAccountId, teamId: normalizedTeamId },
            signal,
            throwOnError: false,
          })
        : await listPendingAccountPhotoSubmissions({
            client: apiClient,
            path: { accountId: normalizedAccountId },
            signal,
            throwOnError: false,
          });

      if (signal?.aborted) return;
      const data = unwrapApiResult(result, 'Failed to load pending photo submissions');
      setSubmissions(data.submissions ?? []);
    } catch (err: unknown) {
      if (signal?.aborted) return;
      const message =
        err instanceof ApiClientError ? err.message : 'Failed to load pending photo submissions';
      setError(message);
      setSubmissions([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const clearStatus = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const approve = async (submissionId: string, albumId?: string | null): Promise<boolean> => {
    if (!canQuery || !normalizedAccountId) {
      setError('Account information is required to approve submissions.');
      return false;
    }

    setProcessingIds((current) => createProcessingSet(current, submissionId, true));
    setError(null);

    const submission = submissions.find((item) => item.id === submissionId);
    const normalizedAlbumSelection = normalizeAlbumSelection(albumId);

    try {
      const apiResult = normalizedTeamId
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

      const detail = unwrapApiResult(apiResult, 'Failed to approve photo submission');
      const warningMessage = getPhotoEmailWarningMessage(
        apiResult.response?.headers.get('x-photo-email-warning') ?? null,
      );

      let albumAssignmentError: string | null = null;
      if (normalizedAlbumSelection !== undefined && detail?.approvedPhoto?.id) {
        try {
          const updateResult = await updateAccountGalleryPhoto({
            client: apiClient,
            path: {
              accountId: normalizedAccountId,
              photoId: detail.approvedPhoto.id,
            },
            body: {
              albumId: normalizedAlbumSelection,
            },
            throwOnError: false,
          });

          unwrapApiResult(updateResult, 'Failed to assign approved photo to the album.');
        } catch (assignmentError) {
          albumAssignmentError =
            assignmentError instanceof ApiClientError
              ? assignmentError.message
              : 'Approved photo but failed to assign it to the selected album.';
        }
      }

      await reloadSubmissions();
      if (warningMessage) {
        setError(warningMessage);
        setSuccessMessage(null);
      } else if (albumAssignmentError) {
        setError(albumAssignmentError);
        setSuccessMessage(null);
      } else if (submission) {
        setSuccessMessage(`Approved "${submission.title}".`);
        setError(null);
      } else {
        setSuccessMessage('Submission approved.');
        setError(null);
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
  };

  const deny = async (submissionId: string, reason: string): Promise<boolean> => {
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
      const warningMessage = getPhotoEmailWarningMessage(
        result.response?.headers.get('x-photo-email-warning') ?? null,
      );

      await reloadSubmissions();
      if (warningMessage) {
        setError(warningMessage);
        setSuccessMessage(null);
      } else if (submission) {
        setSuccessMessage(`Denied "${submission.title}".`);
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
  };

  const refresh = async () => {
    await reloadSubmissions();
  };

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
