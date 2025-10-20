import { Prisma, PrismaClient } from '@prisma/client';
import {
  GalleryQueryOptions,
  IPhotoGalleryRepository,
} from '../interfaces/IPhotoGalleryRepository.js';
import {
  dbCreatePhotoGalleryInput,
  dbPhotoGallery,
  dbPhotoGalleryEntry,
} from '../types/dbTypes.js';

const normalizeTeamId = (value: bigint | null | undefined): bigint | null => {
  if (value === undefined || value === null) {
    return null;
  }

  return value === 0n ? null : value;
};

export class PrismaPhotoGalleryRepository implements IPhotoGalleryRepository {
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
}
