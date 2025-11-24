import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';
import type { dbSocialFeedItem } from '../../../repositories/types/dbTypes.js';

export interface FeedCacheKey {
  source: string;
  accountId: bigint;
  seasonId: bigint;
  teamId?: bigint;
  teamSeasonId?: bigint;
}

interface CacheEntry {
  initialized: boolean;
  latestPostedAt?: number;
  seenIds: Set<string>;
}

interface CachedFeedItem {
  id: string;
  postedat: Date;
}

export class SocialFeedCache {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly repository: ISocialContentRepository,
    private readonly preloadLimit = 200,
  ) {}

  async filterNewItems<T extends CachedFeedItem>(key: FeedCacheKey, items: T[]): Promise<T[]> {
    const entry = await this.ensureEntry(key);

    const fresh: T[] = [];
    for (const item of items) {
      if (entry.seenIds.has(item.id)) {
        continue;
      }

      const postedAtMs = item.postedat.getTime();
      if (entry.latestPostedAt !== undefined && postedAtMs <= entry.latestPostedAt) {
        continue;
      }

      entry.seenIds.add(item.id);
      entry.latestPostedAt = entry.latestPostedAt
        ? Math.max(entry.latestPostedAt, postedAtMs)
        : postedAtMs;

      fresh.push(item);
    }

    return fresh;
  }

  private async ensureEntry(key: FeedCacheKey): Promise<CacheEntry> {
    const cacheKey = this.serializeKey(key);
    const existing = this.cache.get(cacheKey);
    if (existing?.initialized) {
      return existing;
    }

    const seeded = await this.seedEntry(key);
    this.cache.set(cacheKey, seeded);
    return seeded;
  }

  private async seedEntry(key: FeedCacheKey): Promise<CacheEntry> {
    const entry: CacheEntry = { initialized: true, seenIds: new Set() };

    const records: dbSocialFeedItem[] = await this.repository.listFeedItems({
      accountId: key.accountId,
      seasonId: key.seasonId,
      teamId: key.teamId,
      teamSeasonId: key.teamSeasonId,
      sources: [key.source],
      limit: this.preloadLimit,
    });

    for (const record of records) {
      entry.seenIds.add(record.id);
      const postedMs = record.postedat.getTime();
      entry.latestPostedAt = entry.latestPostedAt
        ? Math.max(entry.latestPostedAt, postedMs)
        : postedMs;
    }

    return entry;
  }

  private serializeKey(key: FeedCacheKey): string {
    return [
      key.source,
      key.accountId.toString(),
      key.seasonId.toString(),
      key.teamId ? key.teamId.toString() : 'none',
      key.teamSeasonId ? key.teamSeasonId.toString() : 'none',
    ].join(':');
  }
}
