import { useEffect, useState } from 'react';
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
  refresh: () => void;
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
  const normalizedAccountId = normalizeId(accountId);
  const normalizedTeamId = normalizeId(teamId);

  const [photos, setPhotos] = useState<PhotoGalleryPhotoType[]>([]);
  const [albums, setAlbums] = useState<PhotoGalleryAlbumType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const canQuery = Boolean(enabled && normalizedAccountId);

  useEffect(() => {
    if (!canQuery || !normalizedAccountId) {
      setPhotos([]);
      setAlbums([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchGallery = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAccountPhotoGallery({
          client: apiClient,
          path: { accountId: normalizedAccountId },
          query: normalizedTeamId ? { teamId: normalizedTeamId } : undefined,
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(result, 'Failed to load photo gallery.');
        setPhotos(Array.isArray(data.photos) ? data.photos : emptyState.photos);
        setAlbums(Array.isArray(data.albums) ? data.albums : emptyState.albums);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof ApiClientError ? err.message : 'Failed to load photo gallery.';
        setError(message);
        setPhotos([]);
        setAlbums([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchGallery();

    return () => {
      controller.abort();
    };
  }, [canQuery, normalizedAccountId, normalizedTeamId, apiClient, refreshKey]);

  return {
    photos,
    albums,
    loading,
    error,
    refresh: () => setRefreshKey((prev) => prev + 1),
  };
};

export default usePhotoGallery;
