import path from 'node:path';
import { ServiceFactory } from './serviceFactory.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import {
  IAccountInstagramCredentialsRepository,
  IAccountFacebookCredentialsRepository,
  IInstagramIngestionRepository,
  IPhotoGalleryAdminRepository,
  ISeasonsRepository,
} from '../repositories/interfaces/index.js';
import { decryptSecret } from '../utils/secretEncryption.js';
import { PhotoGalleryAssetService } from './photoGalleryAssetService.js';
import type { dbPhotoGalleryAlbum } from '../repositories/types/dbTypes.js';
import type { InstagramIngestionTarget } from '../config/socialIngestion.js';
import { NotFoundError } from '../utils/customErrors.js';
import { fetchJson } from '../utils/fetchJson.js';
import { buildGalleryAssetPaths } from '../utils/photoSubmissionPaths.js';

interface InstagramMediaItem {
  id: string;
  caption?: string | null;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  thumbnail_url?: string;
}

interface InstagramMediaResponse {
  data?: InstagramMediaItem[];
  paging?: { next?: string };
}

const INSTAGRAM_ALBUM_TITLE = 'Instagram';

export interface InstagramIngestionTargetWithAlbum extends InstagramIngestionTarget {
  accessToken: string;
  albumId: bigint;
}

export class InstagramIntegrationService {
  private readonly credentialsRepository: IAccountInstagramCredentialsRepository;
  private readonly facebookCredentialsRepository: IAccountFacebookCredentialsRepository;
  private readonly ingestionRepository: IInstagramIngestionRepository;
  private readonly photoGalleryRepository: IPhotoGalleryAdminRepository;
  private readonly seasonsRepository: ISeasonsRepository;
  private readonly assetService: PhotoGalleryAssetService;
  private readonly ingestionCache = new Map<
    string,
    { seenIds: Set<string>; latestPostedAt?: number }
  >();

  constructor() {
    this.credentialsRepository = RepositoryFactory.getAccountInstagramCredentialsRepository();
    this.facebookCredentialsRepository =
      RepositoryFactory.getAccountFacebookCredentialsRepository();
    this.ingestionRepository = RepositoryFactory.getInstagramIngestionRepository();
    this.photoGalleryRepository = RepositoryFactory.getPhotoGalleryAdminRepository();
    this.seasonsRepository = RepositoryFactory.getSeasonsRepository();
    this.assetService = ServiceFactory.getPhotoGalleryAssetService();
  }

  async listIngestionTargets(): Promise<InstagramIngestionTargetWithAlbum[]> {
    const credentials = await this.credentialsRepository.findAllConfigured();
    const targets: InstagramIngestionTargetWithAlbum[] = [];

    for (const credential of credentials) {
      const season = await this.seasonsRepository.findCurrentSeason(credential.accountid);
      if (!season) {
        continue;
      }

      const album = await this.ensureInstagramAlbum(credential.accountid);
      const accessToken = credential.accesstoken ? decryptSecret(credential.accesstoken) : null;

      if (!accessToken || !credential.instagramuserid) {
        continue;
      }

      targets.push({
        accountId: credential.accountid,
        seasonId: season.id,
        instagramUserId: credential.instagramuserid,
        accessToken,
        albumId: album.id,
      });
    }

    return targets;
  }

  async ingestRecentMedia(target: InstagramIngestionTargetWithAlbum, limit: number): Promise<void> {
    const cache = await this.ensureCache(target);
    const mediaItems = await this.fetchRecentMedia(target, limit, cache.latestPostedAt);
    if (!mediaItems.length) {
      return;
    }

    const freshMedia = mediaItems.filter((item) => {
      if (cache.seenIds.has(item.id)) {
        return false;
      }

      const postedAtMs = item.timestamp ? new Date(item.timestamp).getTime() : undefined;
      if (cache.latestPostedAt !== undefined && postedAtMs !== undefined) {
        return postedAtMs > cache.latestPostedAt;
      }

      return true;
    });

    for (const item of freshMedia) {
      if (!this.isImage(item)) {
        continue;
      }

      const buffer = await this.downloadMedia(item.media_url ?? item.thumbnail_url);
      if (!buffer) {
        continue;
      }

      const created = await this.photoGalleryRepository.createPhoto({
        accountid: target.accountId,
        albumid: target.albumId,
        title: this.resolveTitle(item),
        caption: item.caption?.trim() ?? '',
      });

      try {
        await this.assetService.saveGalleryAssets(target.accountId, created.id, buffer);
        await this.ingestionRepository.createIngestionRecord({
          accountId: target.accountId,
          externalId: item.id,
          photoId: created.id,
          postedAt: item.timestamp ? new Date(item.timestamp) : null,
          permalink: item.permalink ?? null,
        });

        cache.seenIds.add(item.id);
        const postedAtMs = item.timestamp ? new Date(item.timestamp).getTime() : undefined;
        if (postedAtMs !== undefined) {
          cache.latestPostedAt =
            cache.latestPostedAt !== undefined
              ? Math.max(cache.latestPostedAt, postedAtMs)
              : postedAtMs;
        }
      } catch (error) {
        await this.photoGalleryRepository.deletePhoto(created.id).catch(() => undefined);
        throw error;
      }
    }
  }

  async uploadPhotoFromGallery(
    accountId: bigint,
    photoId: bigint,
    caption?: string,
  ): Promise<void> {
    const credentials = await this.credentialsRepository.findByAccountId(accountId);
    const facebookCredentials = await this.facebookCredentialsRepository.findByAccountId(accountId);

    if (!credentials?.instagramuserid) {
      return;
    }

    const pageToken = facebookCredentials?.pagetoken
      ? decryptSecret(facebookCredentials.pagetoken)
      : null;
    const userToken = facebookCredentials?.useraccesstoken
      ? decryptSecret(facebookCredentials.useraccesstoken)
      : null;
    const tokenType = pageToken ? 'page' : userToken ? 'user' : null;
    const accessToken = pageToken || userToken;

    if (!accessToken) {
      console.info('[instagram] Skipping upload, no Facebook access token available', {
        accountId: accountId.toString(),
        photoId: photoId.toString(),
      });
      return;
    }

    const albumPhoto = await this.photoGalleryRepository.findPhotoById(accountId, photoId);
    if (!albumPhoto) {
      throw new NotFoundError('Photo not found for Instagram sync');
    }

    const frontendBase = process.env.FRONTEND_URL?.replace(/\/$/, '');
    if (!frontendBase) {
      return;
    }

    const submission = albumPhoto.photogallerysubmission[0];
    const submissionExtension =
      submission?.originalfilepath && path.extname(submission.originalfilepath);
    const normalizedExtension = submissionExtension || '.jpg';

    const galleryPaths = buildGalleryAssetPaths(accountId, photoId, normalizedExtension);
    const imageUrl = `${frontendBase}/uploads/${galleryPaths.originalFilePath}`;

    console.info('[instagram] Uploading photo from gallery', {
      accountId: accountId.toString(),
      photoId: photoId.toString(),
      imageUrl,
      tokenType,
    });

    const createRequest = new URL(
      `https://graph.facebook.com/v18.0/${credentials.instagramuserid}/media`,
    );
    createRequest.searchParams.set('image_url', imageUrl);
    if (caption) {
      createRequest.searchParams.set('caption', caption);
    }

    try {
      const createResponse = await fetchJson<{ id?: string }>(createRequest, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const creationId = createResponse?.id;
      if (!creationId) {
        console.error('[instagram] Missing creation_id when creating media container', {
          accountId: accountId.toString(),
          photoId: photoId.toString(),
        });
        return;
      }

      const publishRequest = new URL(
        `https://graph.facebook.com/v18.0/${credentials.instagramuserid}/media_publish`,
      );
      publishRequest.searchParams.set('creation_id', creationId);

      await fetchJson(publishRequest, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      console.error('[instagram] Failed to publish photo', {
        accountId: accountId.toString(),
        photoId: photoId.toString(),
        error,
      });
    }
  }

  async ensureInstagramAlbum(accountId: bigint): Promise<dbPhotoGalleryAlbum> {
    const existing = await this.photoGalleryRepository.findAlbumByTitle(
      accountId,
      INSTAGRAM_ALBUM_TITLE,
    );
    if (existing) {
      if (!existing.issystem) {
        return this.photoGalleryRepository.updateAlbum(existing.id, { issystem: true });
      }
      return existing;
    }

    return this.photoGalleryRepository.createAlbum({
      accountid: accountId,
      title: INSTAGRAM_ALBUM_TITLE,
      teamid: 0n,
      parentalbumid: 0n,
      issystem: true,
    });
  }

  private async fetchRecentMedia(
    target: InstagramIngestionTargetWithAlbum,
    limit: number,
    latestKnownPostedAt?: number,
  ): Promise<InstagramMediaItem[]> {
    const media: InstagramMediaItem[] = [];
    const toAuthorizedUrl = (url: string): string => {
      const parsed = new URL(url);
      parsed.searchParams.delete('access_token');
      return parsed.toString();
    };

    let nextUrl: string | undefined =
      `https://graph.instagram.com/${target.instagramUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url`;

    while (nextUrl && media.length < limit) {
      const authorizedUrl = toAuthorizedUrl(nextUrl);
      const payload: InstagramMediaResponse = await fetchJson<InstagramMediaResponse>(
        authorizedUrl,
        {
          headers: { Authorization: `Bearer ${target.accessToken}` },
        },
      );
      if (!payload.data?.length) {
        break;
      }

      const remainingCapacity = limit - media.length;
      const itemsToAdd = payload.data.slice(0, remainingCapacity);
      media.push(...itemsToAdd);

      if (media.length >= limit) {
        break;
      }

      if (latestKnownPostedAt !== undefined) {
        const hasNewer = itemsToAdd.some((item) => {
          if (!item.timestamp) {
            return true;
          }
          const postedAtMs = new Date(item.timestamp).getTime();
          return postedAtMs > latestKnownPostedAt;
        });

        if (!hasNewer) {
          break;
        }
      }
      nextUrl = payload.paging?.next;
    }

    return media.slice(0, limit);
  }

  private async ensureCache(
    target: InstagramIngestionTargetWithAlbum,
  ): Promise<{ seenIds: Set<string>; latestPostedAt?: number }> {
    const cacheKey = target.accountId.toString();
    const existing = this.ingestionCache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const seenIds = new Set<string>();
    let latestPostedAt: number | undefined;

    const records = await this.ingestionRepository.listRecentIngestions(target.accountId, 500);
    for (const record of records) {
      seenIds.add(record.externalid);
      const postedMs = record.postedat?.getTime();
      if (postedMs !== undefined) {
        latestPostedAt =
          latestPostedAt !== undefined ? Math.max(latestPostedAt, postedMs) : postedMs;
      }
    }

    const cache = { seenIds, latestPostedAt };
    this.ingestionCache.set(cacheKey, cache);
    return cache;
  }

  private isImage(item: InstagramMediaItem): boolean {
    return item.media_type === 'IMAGE' || item.media_type === 'CAROUSEL_ALBUM';
  }

  private resolveTitle(item: InstagramMediaItem): string {
    const caption = item.caption?.trim();
    if (caption) {
      return caption.slice(0, 50);
    }
    return 'Instagram Photo';
  }

  private async downloadMedia(url?: string | null): Promise<Buffer | null> {
    if (!url) {
      return null;
    }

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
