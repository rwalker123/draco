import React, { useMemo } from 'react';
import type { PhotoGalleryAdminAlbumType } from '@draco/shared-schemas';
import { normalizeEntityId } from '../utils';

export type PhotoGalleryAlbumSectionType = 'account' | 'team';

export interface PhotoGalleryAlbumSection<TAlbum extends PhotoGalleryAdminAlbumType> {
  type: PhotoGalleryAlbumSectionType;
  title: string;
  albums: PhotoGalleryAlbumEntry<TAlbum>[];
}

export interface PhotoGalleryAlbumEntry<TAlbum extends PhotoGalleryAdminAlbumType> {
  id: string;
  title: string;
  photoCount: number;
  isDefault: boolean;
  teamId: string | null;
  album: TAlbum;
}

const buildSections = <TAlbum extends PhotoGalleryAdminAlbumType>(
  albums: TAlbum[],
  accountId: string,
): PhotoGalleryAlbumSection<TAlbum>[] => {
  const accountAlbums: PhotoGalleryAlbumEntry<TAlbum>[] = [];
  const teamAlbums: PhotoGalleryAlbumEntry<TAlbum>[] = [];

  albums.forEach((album) => {
    if (!album.id) {
      return;
    }

    const normalizedTeamId = normalizeEntityId(album.teamId ?? null);
    const albumAccountId = album.accountId ?? null;
    const entry: PhotoGalleryAlbumEntry<TAlbum> = {
      id: album.id,
      title: album.title?.trim() || 'Untitled Album',
      photoCount: album.photoCount ?? 0,
      isDefault: (album.accountId ?? '') === '0',
      teamId: normalizedTeamId,
      album,
    };

    const belongsToAccount =
      normalizedTeamId === null && (albumAccountId === accountId || albumAccountId === '0');
    const belongsToTeam = normalizedTeamId !== null && albumAccountId === accountId;

    if (belongsToAccount) {
      accountAlbums.push(entry);
      return;
    }

    if (belongsToTeam) {
      teamAlbums.push(entry);
    }
  });

  accountAlbums.sort((a, b) => {
    if (a.isDefault && !b.isDefault) {
      return -1;
    }
    if (!a.isDefault && b.isDefault) {
      return 1;
    }
    return a.title.localeCompare(b.title);
  });

  teamAlbums.sort((a, b) => a.title.localeCompare(b.title));

  const sections: PhotoGalleryAlbumSection<TAlbum>[] = [];
  if (accountAlbums.length > 0) {
    sections.push({
      type: 'account',
      title: 'Account Albums',
      albums: accountAlbums,
    });
  }
  if (teamAlbums.length > 0) {
    sections.push({
      type: 'team',
      title: 'Team Albums',
      albums: teamAlbums,
    });
  }

  return sections;
};

interface PhotoGalleryAlbumSectionsProps<TAlbum extends PhotoGalleryAdminAlbumType> {
  albums: TAlbum[];
  accountId: string;
  renderSectionHeader?: (section: PhotoGalleryAlbumSection<TAlbum>) => React.ReactNode;
  renderAlbum: (
    albumEntry: PhotoGalleryAlbumEntry<TAlbum>,
    section: PhotoGalleryAlbumSection<TAlbum>,
  ) => React.ReactNode;
  emptyState?: React.ReactNode;
}

export const PhotoGalleryAlbumSections = <TAlbum extends PhotoGalleryAdminAlbumType>({
  albums,
  accountId,
  renderSectionHeader,
  renderAlbum,
  emptyState = null,
}: PhotoGalleryAlbumSectionsProps<TAlbum>) => {
  const sections = useMemo(() => buildSections(albums, accountId), [albums, accountId]);

  if (sections.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {sections.map((section) => (
        <React.Fragment key={section.type}>
          {renderSectionHeader ? renderSectionHeader(section) : null}
          {section.albums.map((albumEntry) => (
            <React.Fragment key={albumEntry.id}>{renderAlbum(albumEntry, section)}</React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </>
  );
};

export default PhotoGalleryAlbumSections;
