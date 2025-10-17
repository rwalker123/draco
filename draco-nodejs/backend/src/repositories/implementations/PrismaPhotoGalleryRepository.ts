import { PrismaClient } from '@prisma/client';
import { IPhotoGalleryRepository } from '../interfaces/IPhotoGalleryRepository.js';
import { dbCreatePhotoGalleryInput, dbPhotoGallery } from '../types/dbTypes.js';

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
}
