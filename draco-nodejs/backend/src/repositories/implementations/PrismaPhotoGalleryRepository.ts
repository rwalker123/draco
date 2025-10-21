import { Prisma, PrismaClient } from '@prisma/client';
import {
  GalleryQueryOptions,
  IPhotoGalleryAdminRepository,
  IPhotoGalleryModerationRepository,
  IPhotoGalleryReadRepository,
} from '../interfaces/IPhotoGalleryRepository.js';
import {
  dbCreatePhotoGalleryAlbumInput,
  dbCreatePhotoGalleryInput,
  dbPhotoGallery,
  dbPhotoGalleryAlbum,
  dbPhotoGalleryAlbumWithCount,
  dbPhotoGalleryEntry,
  dbUpdatePhotoGalleryAlbumInput,
  dbUpdatePhotoGalleryInput,
} from '../types/dbTypes.js';

const normalizeTeamId = (value: bigint | null | undefined): bigint | null => {
  if (value === undefined || value === null) {
    return null;
  }

  return value === 0n ? null : value;
};

export class PrismaPhotoGalleryRepository
  implements
    IPhotoGalleryAdminRepository,
    IPhotoGalleryModerationRepository,
    IPhotoGalleryReadRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async createPhoto(data: dbCreatePhotoGalleryInput): Promise<dbPhotoGallery> {
    return this.prisma.photogallery.create({
      data: {
        accountid: data.accountid,
        albumid: data.albumid ?? null,
        title: data.title,
        caption: data.caption,
      },
      select: {
        id: true,
        accountid: true,
        albumid: true,
        title: true,
        caption: true,
      },
    });
  }

  async updatePhoto(photoId: bigint, data: dbUpdatePhotoGalleryInput): Promise<dbPhotoGallery> {
    const updateData: Prisma.photogalleryUncheckedUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.caption !== undefined) {
      updateData.caption = data.caption ?? '';
    }

    if (data.albumid !== undefined) {
      updateData.albumid = data.albumid ?? null;
    }

    return this.prisma.photogallery.update({
      where: { id: photoId },
      data: updateData,
      select: {
        id: true,
        accountid: true,
        albumid: true,
        title: true,
        caption: true,
      },
    });
  }

  async countPhotosInAlbum(accountId: bigint, albumId: bigint | null): Promise<number> {
    return this.prisma.photogallery.count({
      where: {
        accountid: accountId,
        albumid: albumId ?? null,
      },
    });
  }

  async deletePhoto(photoId: bigint): Promise<void> {
    await this.prisma.photogallery.delete({
      where: { id: photoId },
    });
  }

  async findPhotoById(accountId: bigint, photoId: bigint): Promise<dbPhotoGalleryEntry | null> {
    return this.prisma.photogallery.findFirst({
      where: {
        id: photoId,
        accountid: accountId,
      },
      select: {
        id: true,
        accountid: true,
        albumid: true,
        title: true,
        caption: true,
        photogalleryalbum: {
          select: {
            id: true,
            title: true,
            teamid: true,
          },
        },
        photogallerysubmission: {
          select: {
            id: true,
            teamid: true,
            albumid: true,
            submittedat: true,
            originalfilepath: true,
          },
          orderBy: {
            submittedat: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  async listGalleryEntries(options: GalleryQueryOptions): Promise<dbPhotoGalleryEntry[]> {
    const where: Prisma.photogalleryWhereInput = {
      accountid: options.accountId,
    };

    if (options.albumId !== undefined) {
      where.albumid = options.albumId ?? null;
    }

    const entries = await this.prisma.photogallery.findMany({
      where,
      select: {
        id: true,
        accountid: true,
        albumid: true,
        title: true,
        caption: true,
        photogalleryalbum: {
          select: {
            id: true,
            title: true,
            teamid: true,
          },
        },
        photogallerysubmission: {
          select: {
            id: true,
            teamid: true,
            albumid: true,
            submittedat: true,
            originalfilepath: true,
          },
          orderBy: {
            submittedat: 'desc',
          },
          take: 1,
        },
      },
      orderBy: { id: 'desc' },
    });

    if (options.teamId === undefined) {
      return entries;
    }

    const targetTeamId = normalizeTeamId(options.teamId);

    return entries.filter((entry) => {
      const albumTeamId = normalizeTeamId(entry.photogalleryalbum?.teamid ?? null);
      const submissionTeamId = normalizeTeamId(entry.photogallerysubmission[0]?.teamid ?? null);

      if (targetTeamId === null) {
        return albumTeamId === null && submissionTeamId === null;
      }

      return albumTeamId === targetTeamId || submissionTeamId === targetTeamId;
    });
  }

  async listAlbums(accountId: bigint): Promise<dbPhotoGalleryAlbumWithCount[]> {
    return this.prisma.photogalleryalbum.findMany({
      where: {
        accountid: accountId,
      },
      select: {
        id: true,
        accountid: true,
        teamid: true,
        parentalbumid: true,
        title: true,
        _count: {
          select: {
            photogallery: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async createAlbum(data: dbCreatePhotoGalleryAlbumInput): Promise<dbPhotoGalleryAlbumWithCount> {
    return this.prisma.photogalleryalbum.create({
      data: {
        accountid: data.accountid,
        title: data.title,
        teamid: data.teamid,
        parentalbumid: data.parentalbumid,
      },
      select: {
        id: true,
        accountid: true,
        teamid: true,
        parentalbumid: true,
        title: true,
        _count: {
          select: {
            photogallery: true,
          },
        },
      },
    });
  }

  async updateAlbum(
    albumId: bigint,
    data: dbUpdatePhotoGalleryAlbumInput,
  ): Promise<dbPhotoGalleryAlbumWithCount> {
    const updateData: Prisma.photogalleryalbumUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.teamid !== undefined) {
      updateData.teamid = data.teamid;
    }

    if (data.parentalbumid !== undefined) {
      updateData.parentalbumid = data.parentalbumid;
    }

    return this.prisma.photogalleryalbum.update({
      where: { id: albumId },
      data: updateData,
      select: {
        id: true,
        accountid: true,
        teamid: true,
        parentalbumid: true,
        title: true,
        _count: {
          select: {
            photogallery: true,
          },
        },
      },
    });
  }

  async deleteAlbum(albumId: bigint): Promise<void> {
    await this.prisma.photogalleryalbum.delete({
      where: { id: albumId },
    });
  }

  async findAlbumById(accountId: bigint, albumId: bigint): Promise<dbPhotoGalleryAlbum | null> {
    return this.prisma.photogalleryalbum.findFirst({
      where: {
        id: albumId,
        accountid: accountId,
      },
      select: {
        id: true,
        accountid: true,
        teamid: true,
        parentalbumid: true,
        title: true,
      },
    });
  }

  async findAlbumByTitle(accountId: bigint, title: string): Promise<dbPhotoGalleryAlbum | null> {
    return this.prisma.photogalleryalbum.findFirst({
      where: {
        accountid: accountId,
        title: {
          equals: title,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        accountid: true,
        teamid: true,
        parentalbumid: true,
        title: true,
      },
    });
  }

  async countChildAlbums(accountId: bigint, parentAlbumId: bigint): Promise<number> {
    return this.prisma.photogalleryalbum.count({
      where: {
        accountid: accountId,
        parentalbumid: parentAlbumId,
      },
    });
  }
}
