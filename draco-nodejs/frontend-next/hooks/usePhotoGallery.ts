import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApiClient } from './useApiClient';
import { getAccountPhotoGallery } from '@draco/shared-api-client';
import type {
  PhotoGalleryAlbumType,
  PhotoGalleryListType,
  PhotoGalleryPhotoType,
} from '@draco/shared-schemas';
import { ApiClientError, unwrapApiResult } from '../utils/apiResult';

interface UsePhotoGalleryOptions {
  accountId?: string | null;
  teamId?: string | null;
  enabled?: boolean;
}

interface UsePhotoGalleryState {
  photos: PhotoGalleryPhotoType[];
  albums: PhotoGalleryAlbumType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const normalizeId = (value?: string | null): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const emptyState: PhotoGalleryListType = {
  photos: [],
  albums: [],
};

export const usePhotoGallery = ({
  accountId,
  teamId,
  enabled = true,
}: UsePhotoGalleryOptions): UsePhotoGalleryState => {
  const apiClient = useApiClient();
  const normalizedAccountId = useMemo(() => normalizeId(accountId), [accountId]);
  const normalizedTeamId = useMemo(() => normalizeId(teamId), [teamId]);

  const [photos, setPhotos] = useState<PhotoGalleryPhotoType[]>([]);
  const [albums, setAlbums] = useState<PhotoGalleryAlbumType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canQuery = Boolean(enabled && normalizedAccountId);

  const fetchGallery = useCallback(async () => {
    if (!canQuery || !normalizedAccountId) {
      setPhotos([]);
      setAlbums([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getAccountPhotoGallery({
        client: apiClient,
        path: { accountId: normalizedAccountId },
        query: normalizedTeamId ? { teamId: normalizedTeamId } : undefined,
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to load photo gallery.');
      setPhotos(Array.isArray(data.photos) ? data.photos : emptyState.photos);
      setAlbums(Array.isArray(data.albums) ? data.albums : emptyState.albums);
    } catch (err: unknown) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load photo gallery.';
      setError(message);
      setPhotos([]);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient, canQuery, normalizedAccountId, normalizedTeamId]);

  useEffect(() => {
    void fetchGallery();
  }, [fetchGallery]);

  const refresh = useCallback(async () => {
    await fetchGallery();
  }, [fetchGallery]);

  return {
    photos,
    albums,
    loading,
    error,
    refresh,
  };
};

export default usePhotoGallery;
