import { useCallback, useMemo, useState } from 'react';
import { useApiClient } from './useApiClient';
import {
  createAccountPhotoSubmission,
  createTeamPhotoSubmission,
} from '@draco/shared-api-client';
import type { PhotoSubmissionRecordType } from '@draco/shared-schemas';
import { ApiClientError, unwrapApiResult } from '../utils/apiResult';

interface UsePhotoSubmissionOptions {
  accountId?: string | null;
  teamId?: string | null;
}

export interface SubmitPhotoInput {
  title: string;
  caption?: string | null;
  albumId?: string | null;
  photo: File;
}

interface UsePhotoSubmissionState {
  submitPhoto: (input: SubmitPhotoInput) => Promise<PhotoSubmissionRecordType | null>;
  submitting: boolean;
  error: string | null;
  clearError: () => void;
}

const normalizeId = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const appendOptionalField = (formData: FormData, key: string, value?: string | null) => {
  if (!value) {
    return;
  }

  const trimmed = value.trim();
  if (trimmed.length > 0) {
    formData.append(key, trimmed);
  }
};

export const usePhotoSubmission = ({
  accountId,
  teamId,
}: UsePhotoSubmissionOptions): UsePhotoSubmissionState => {
  const apiClient = useApiClient();
  const normalizedAccountId = useMemo(() => normalizeId(accountId), [accountId]);
  const normalizedTeamId = useMemo(() => normalizeId(teamId), [teamId]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPhoto = useCallback(
    async ({ title, caption, albumId, photo }: SubmitPhotoInput): Promise<PhotoSubmissionRecordType | null> => {
      if (!normalizedAccountId) {
        setError('Account information is required to submit photos.');
        return null;
      }

      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', title.trim());
      appendOptionalField(formData, 'caption', caption ?? null);
      appendOptionalField(formData, 'albumId', albumId ?? null);
      formData.append('photo', photo);

      try {
        const result = normalizedTeamId
          ? await createTeamPhotoSubmission({
              client: apiClient,
              path: { accountId: normalizedAccountId, teamId: normalizedTeamId },
              body: formData,
              throwOnError: false,
            })
          : await createAccountPhotoSubmission({
              client: apiClient,
              path: { accountId: normalizedAccountId },
              body: formData,
              throwOnError: false,
            });

        return unwrapApiResult<PhotoSubmissionRecordType>(
          result,
          'Failed to submit photo for review',
        );
      } catch (err: unknown) {
        const message =
          err instanceof ApiClientError ? err.message : 'Failed to submit photo for review';
        setError(message);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [apiClient, normalizedAccountId, normalizedTeamId],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { submitPhoto, submitting, error, clearError };
};

export default usePhotoSubmission;
