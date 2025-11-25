import { dbInstagramIngestionRecord } from '../types/dbTypes.js';

export interface InstagramIngestionRecordInput {
  accountId: bigint;
  externalId: string;
  photoId: bigint;
  postedAt?: Date | null;
  permalink?: string | null;
}

export interface IInstagramIngestionRepository {
  findExistingExternalIds(accountId: bigint, externalIds: string[]): Promise<string[]>;
  createIngestionRecord(input: InstagramIngestionRecordInput): Promise<dbInstagramIngestionRecord>;
  listRecentIngestions(accountId: bigint, limit?: number): Promise<dbInstagramIngestionRecord[]>;
  deleteByPhotoIds(accountId: bigint, photoIds: bigint[]): Promise<void>;
}
