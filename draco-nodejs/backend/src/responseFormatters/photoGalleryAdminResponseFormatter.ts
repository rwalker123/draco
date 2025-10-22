import type {
  PhotoGalleryAdminAlbumListType,
  PhotoGalleryAdminAlbumType,
} from '@draco/shared-schemas';
import type { dbPhotoGalleryAlbumWithCount } from '../repositories/types/dbTypes.js';

const normalizeIdentifier = (value: bigint | null | undefined): string | null => {
  if (value === undefined || value === null || value === 0n) {
    return null;
  }

  return value.toString();
};

const formatAlbum = (album: dbPhotoGalleryAlbumWithCount): PhotoGalleryAdminAlbumType => {
  const accountId = album.accountid.toString();
  const rawTitle = album.title.trim();
  const title =
    accountId === '0' ? 'Default Album' : rawTitle.length > 0 ? rawTitle : 'Account Album';

  return {
    id: album.id.toString(),
    accountId,
    title,
    teamId: normalizeIdentifier(album.teamid ?? null),
    parentAlbumId: normalizeIdentifier(album.parentalbumid ?? null),
    photoCount: album._count.photogallery,
  };
};

export class PhotoGalleryAdminResponseFormatter {
  static formatAlbum(album: dbPhotoGalleryAlbumWithCount): PhotoGalleryAdminAlbumType {
    return formatAlbum(album);
  }

  static formatAlbumList(albums: dbPhotoGalleryAlbumWithCount[]): PhotoGalleryAdminAlbumListType {
    const sorted = [...albums].sort((a, b) => {
      if (a.accountid === 0n && b.accountid !== 0n) {
        return -1;
      }
      if (a.accountid !== 0n && b.accountid === 0n) {
        return 1;
      }
      return a.title.localeCompare(b.title);
    });

    return {
      albums: sorted.map(formatAlbum),
    };
  }
}
