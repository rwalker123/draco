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
    const where: Prisma.photogallerysubmissionWhereInput = {
      accountid: options.accountId,
      status: 'Approved',
      photogallery: { isNot: null },
    };

    if (options.albumId !== undefined) {
      where.albumid = options.albumId ?? null;
    }

    if (options.teamId !== undefined && options.teamId !== null) {
      where.OR = [
        { teamid: options.teamId },
        { photogalleryalbum: { teamid: options.teamId } },
      ];
    }

    return this.prisma.photogallerysubmission.findMany({
      where,
      select: {
        id: true,
        accountid: true,
        teamid: true,
        albumid: true,
        title: true,
        caption: true,
        originalfilepath: true,
        submittedat: true,
        photogallery: {
          select: {
            id: true,
            title: true,
            caption: true,
            albumid: true,
          },
        },
        photogalleryalbum: {
          select: {
            id: true,
            title: true,
            teamid: true,
          },
        },
      },
      orderBy: { submittedat: 'desc' },
    });
  }
}
