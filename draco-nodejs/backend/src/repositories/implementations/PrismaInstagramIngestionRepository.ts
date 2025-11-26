import { PrismaClient } from '#prisma/client';
import {
  IInstagramIngestionRepository,
  InstagramIngestionRecordInput,
} from '../interfaces/IInstagramIngestionRepository.js';
import { dbInstagramIngestionRecord } from '../types/dbTypes.js';

export class PrismaInstagramIngestionRepository implements IInstagramIngestionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findExistingExternalIds(accountId: bigint, externalIds: string[]): Promise<string[]> {
    if (!externalIds.length) {
      return [];
    }

    const records = await this.prisma.instagramingestion.findMany({
      where: {
        accountid: accountId,
        externalid: { in: externalIds },
      },
      select: { externalid: true },
    });

    return records.map((record) => record.externalid);
  }

  async createIngestionRecord(
    input: InstagramIngestionRecordInput,
  ): Promise<dbInstagramIngestionRecord> {
    return this.prisma.instagramingestion.create({
      data: {
        accountid: input.accountId,
        externalid: input.externalId,
        photoid: input.photoId,
        postedat: input.postedAt ?? null,
        permalink: input.permalink ?? null,
      },
      select: {
        id: true,
        accountid: true,
        externalid: true,
        photoid: true,
        postedat: true,
        permalink: true,
      },
    });
  }

  listRecentIngestions(accountId: bigint, limit = 20): Promise<dbInstagramIngestionRecord[]> {
    return this.prisma.instagramingestion.findMany({
      where: { accountid: accountId },
      select: {
        id: true,
        accountid: true,
        externalid: true,
        photoid: true,
        postedat: true,
        permalink: true,
      },
      orderBy: { postedat: 'desc' },
      take: limit,
    });
  }

  async deleteByPhotoIds(accountId: bigint, photoIds: bigint[]): Promise<void> {
    if (!photoIds.length) {
      return;
    }

    await this.prisma.instagramingestion.deleteMany({
      where: { accountid: accountId, photoid: { in: photoIds } },
    });
  }
}
