import path from 'node:path';
import type {
  PhotoGalleryAlbumType,
  PhotoGalleryListType,
  PhotoGalleryPhotoType,
} from '@draco/shared-schemas';
import type { dbPhotoGalleryEntry } from '../repositories/types/dbTypes.js';
import { buildGalleryAssetPaths } from '../utils/photoSubmissionPaths.js';
import { DateUtils } from '../utils/dateUtils.js';

const toStringOrNull = (value: bigint | null | undefined): string | null => {
  if (value === undefined || value === null || value === 0n) {
    return null;
  }

  return value.toString();
};

const buildAssetUrl = (relativePath: string): string => {
  const normalized = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `/uploads/${normalized}`;
};

const formatPhoto = (entry: dbPhotoGalleryEntry): PhotoGalleryPhotoType | null => {
  const gallery = entry.photogallery;

  if (!gallery) {
    return null;
  }

  const album = entry.photogalleryalbum;
  const albumId = album?.id ?? gallery.albumid ?? entry.albumid ?? null;
  const teamId = album?.teamid ?? entry.teamid ?? null;
  const caption = gallery.caption?.trim() || entry.caption?.trim() || '';
  const albumTitle = album?.title?.trim() || (teamId ? 'Team Album' : 'Main Album');
  const extension = path.extname(entry.originalfilepath) || '.jpg';
  const galleryPaths = buildGalleryAssetPaths(entry.accountid, BigInt(gallery.id), extension);

  return {
    id: gallery.id.toString(),
    submissionId: entry.id.toString(),
    accountId: entry.accountid.toString(),
    teamId: toStringOrNull(teamId),
    albumId: toStringOrNull(albumId),
    albumTitle,
    title: gallery.title,
    caption: caption.length > 0 ? caption : null,
    submittedAt: DateUtils.formatDateTimeForResponse(entry.submittedat),
    originalUrl: buildAssetUrl(galleryPaths.originalFilePath),
    primaryUrl: buildAssetUrl(galleryPaths.primaryImagePath),
    thumbnailUrl: buildAssetUrl(galleryPaths.thumbnailImagePath),
  };
};

const aggregateAlbums = (photos: PhotoGalleryPhotoType[]): PhotoGalleryAlbumType[] => {
  const albumMap = new Map<string, PhotoGalleryAlbumType>();

  photos.forEach((photo) => {
    const key = photo.albumId ?? 'null';
    const existing = albumMap.get(key);

    if (existing) {
      existing.photoCount += 1;
      return;
    }

    albumMap.set(key, {
      id: photo.albumId,
      title: photo.albumTitle,
      teamId: photo.teamId,
      photoCount: 1,
    });
  });

  return Array.from(albumMap.values());
};

export class PhotoGalleryResponseFormatter {
  static formatAccountGallery(entries: dbPhotoGalleryEntry[]): PhotoGalleryListType {
    const photos: PhotoGalleryPhotoType[] = [];

    entries.forEach((entry) => {
      const formatted = formatPhoto(entry);
      if (formatted) {
        photos.push(formatted);
      }
    });

    const albums = aggregateAlbums(photos);

    return {
      photos,
      albums,
    };
  }
}
