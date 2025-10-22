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

const normalizeExtension = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith('.') ? trimmed.toLowerCase() : `.${trimmed.toLowerCase()}`;
};

const normalizeTeamId = (value?: bigint | null): bigint | null => {
  if (value === undefined || value === null) {
    return null;
  }

  return value === 0n ? null : value;
};

const formatPhoto = (entry: dbPhotoGalleryEntry): PhotoGalleryPhotoType | null => {
  const submission = entry.photogallerysubmission[0] ?? null;
  const album = entry.photogalleryalbum ?? null;

  const albumId = entry.albumid ?? album?.id ?? submission?.albumid ?? null;
  const teamId =
    normalizeTeamId(album?.teamid ?? null) ?? normalizeTeamId(submission?.teamid ?? null);

  const resolveAlbumTitle = (): string => {
    if (!album) {
      return teamId ? 'Team Album' : 'Default Album';
    }

    const rawTitle = album.title?.trim() ?? '';
    if (rawTitle.length === 0) {
      return teamId ? 'Team Album' : 'Default Album';
    }

    return rawTitle;
  };

  const caption = entry.caption?.trim() ?? '';
  const normalizedCaption = caption.length > 0 ? caption : null;

  const extensionHint = submission?.originalfilepath
    ? path.extname(submission.originalfilepath)
    : null;
  const extension = normalizeExtension(extensionHint) ?? '.jpg';
  const galleryPaths = buildGalleryAssetPaths(entry.accountid, entry.id, extension);

  return {
    id: entry.id.toString(),
    submissionId: (submission?.id ?? entry.id).toString(),
    accountId: entry.accountid.toString(),
    teamId: toStringOrNull(teamId),
    albumId: toStringOrNull(albumId),
    albumTitle: resolveAlbumTitle(),
    title: entry.title.trim(),
    caption: normalizedCaption,
    submittedAt: submission?.submittedat
      ? DateUtils.formatDateTimeForResponse(submission.submittedat)
      : null,
    originalUrl: buildAssetUrl(galleryPaths.originalFilePath),
    primaryUrl: buildAssetUrl(galleryPaths.primaryImagePath),
    thumbnailUrl: buildAssetUrl(galleryPaths.thumbnailImagePath),
  };
};

const aggregateAlbums = (photos: PhotoGalleryPhotoType[]): PhotoGalleryAlbumType[] => {
  const albumMap = new Map<string, PhotoGalleryAlbumType>();

  photos.forEach((photo) => {
    const key = photo.albumId ?? 'null';
    const normalizedTeamId = photo.teamId && photo.teamId !== '0' ? photo.teamId : null;
    const accountId =
      (photo.albumId === null || photo.albumId === undefined) && normalizedTeamId === null
        ? '0'
        : photo.accountId;

    const existing = albumMap.get(key);

    if (existing) {
      existing.photoCount += 1;
      return;
    }

    albumMap.set(key, {
      id: photo.albumId,
      accountId,
      title: photo.albumTitle,
      teamId: normalizedTeamId,
      photoCount: 1,
    });
  });

  if (!albumMap.has('null')) {
    albumMap.set('null', {
      id: null,
      accountId: '0',
      title: 'Default Album',
      teamId: null,
      photoCount: 0,
    });
  }

  return Array.from(albumMap.values());
};

export class PhotoGalleryResponseFormatter {
  static formatPhotoEntry(entry: dbPhotoGalleryEntry): PhotoGalleryPhotoType | null {
    return formatPhoto(entry);
  }

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
