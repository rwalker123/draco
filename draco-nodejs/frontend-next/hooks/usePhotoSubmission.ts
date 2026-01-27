import { useState } from 'react';
import { useApiClient } from './useApiClient';
import {
  createAccountPhotoSubmission,
  createTeamPhotoSubmission,
  type CreatePhotoSubmissionForm,
} from '@draco/shared-api-client';
import type { PhotoSubmissionRecordType } from '@draco/shared-schemas';
import { ApiClientError, unwrapApiResult } from '../utils/apiResult';
import { getPhotoEmailWarningMessage } from '../utils/photoSubmissionWarnings';

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

export const usePhotoSubmission = ({
  accountId,
  teamId,
}: UsePhotoSubmissionOptions): UsePhotoSubmissionState => {
  const apiClient = useApiClient();
  const normalizedAccountId = normalizeId(accountId);
  const normalizedTeamId = normalizeId(teamId);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPhoto = async ({
    title,
    caption,
    albumId,
    photo,
  }: SubmitPhotoInput): Promise<PhotoSubmissionRecordType | null> => {
    if (!normalizedAccountId) {
      setError('Account information is required to submit photos.');
      return null;
    }

    setSubmitting(true);
    setError(null);

    const submissionBody: CreatePhotoSubmissionForm = {
      title: title.trim(),
      photo,
    };

    const trimmedCaption = caption?.trim();
    if (trimmedCaption) {
      submissionBody.caption = trimmedCaption;
    }

    const trimmedAlbumId = albumId?.trim();
    if (trimmedAlbumId) {
      submissionBody.albumId = trimmedAlbumId;
    }

    try {
      const result = normalizedTeamId
        ? await createTeamPhotoSubmission({
            client: apiClient,
            path: { accountId: normalizedAccountId, teamId: normalizedTeamId },
            body: submissionBody,
            throwOnError: false,
          })
        : await createAccountPhotoSubmission({
            client: apiClient,
            path: { accountId: normalizedAccountId },
            body: submissionBody,
            throwOnError: false,
          });

      const submission = unwrapApiResult<PhotoSubmissionRecordType>(
        result,
        'Failed to submit photo for review',
      );

      const warning = getPhotoEmailWarningMessage(
        result.response?.headers.get('x-photo-email-warning') ?? null,
      );
      if (warning) {
        setError(warning);
      }

      return submission;
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError ? err.message : 'Failed to submit photo for review';
      setError(message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return { submitPhoto, submitting, error, clearError };
};

export default usePhotoSubmission;
