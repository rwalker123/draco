import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import {
  IAccountInstagramCredentialsRepository,
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
  private readonly ingestionRepository: IInstagramIngestionRepository;
  private readonly photoGalleryRepository: IPhotoGalleryAdminRepository;
  private readonly seasonsRepository: ISeasonsRepository;
  private readonly assetService: PhotoGalleryAssetService;

  constructor(
    credentialsRepository?: IAccountInstagramCredentialsRepository,
    ingestionRepository?: IInstagramIngestionRepository,
    photoGalleryRepository?: IPhotoGalleryAdminRepository,
    seasonsRepository?: ISeasonsRepository,
    assetService?: PhotoGalleryAssetService,
  ) {
    this.credentialsRepository =
      credentialsRepository ?? RepositoryFactory.getAccountInstagramCredentialsRepository();
    this.ingestionRepository = ingestionRepository ?? RepositoryFactory.getInstagramIngestionRepository();
    this.photoGalleryRepository =
      photoGalleryRepository ?? RepositoryFactory.getPhotoGalleryAdminRepository();
    this.seasonsRepository = seasonsRepository ?? RepositoryFactory.getSeasonsRepository();
    this.assetService = assetService ?? new PhotoGalleryAssetService();
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
    const mediaItems = await this.fetchRecentMedia(target, limit);
    if (!mediaItems.length) {
      return;
    }

    const existingIds = await this.ingestionRepository.findExistingExternalIds(
      target.accountId,
      mediaItems.map((item) => item.id),
    );

    const freshMedia = mediaItems.filter((item) => !existingIds.includes(item.id));

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
      } catch (error) {
        await this.photoGalleryRepository.deletePhoto(created.id).catch(() => undefined);
        throw error;
      }
    }
  }

  async uploadPhotoFromGallery(accountId: bigint, photoId: bigint, caption?: string): Promise<void> {
    const credentials = await this.credentialsRepository.findByAccountId(accountId);
    if (!credentials?.instagramuserid || !credentials.accesstoken) {
      return;
    }

    const accessToken = decryptSecret(credentials.accesstoken);
    if (!accessToken) {
      return;
    }

    const albumPhoto = await this.photoGalleryRepository.findPhotoById(accountId, photoId);
    if (!albumPhoto) {
      throw new NotFoundError('Photo not found for Instagram sync');
    }

    const publicUrlBase = process.env.SOCIAL_INGESTION_INSTAGRAM_UPLOAD_BASE_URL;
    if (!publicUrlBase) {
      return;
    }

    const submission = albumPhoto.photogallerysubmission[0];
    if (!submission?.originalfilepath) {
      return;
    }

    const imageUrl = new URL(submission.originalfilepath, publicUrlBase).toString();
    const request = new URL(`https://graph.facebook.com/v18.0/${credentials.instagramuserid}/media`);
    request.searchParams.set('image_url', imageUrl);
    if (caption) {
      request.searchParams.set('caption', caption);
    }
    request.searchParams.set('access_token', accessToken);

    try {
      await fetchJson(request, { method: 'POST' });
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
  ): Promise<InstagramMediaItem[]> {
    const media: InstagramMediaItem[] = [];
    let nextUrl: string | undefined = `https://graph.instagram.com/${target.instagramUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url&access_token=${encodeURIComponent(target.accessToken)}`;

    while (nextUrl && media.length < limit) {
      const payload = await fetchJson<InstagramMediaResponse>(nextUrl);
      if (!payload.data?.length) {
        break;
      }

      media.push(...payload.data);
      nextUrl = payload.paging?.next;
    }

    return media.slice(0, limit);
  }

  private isImage(item: InstagramMediaItem): boolean {
    return item.media_type === 'IMAGE' || item.media_type === 'CAROUSEL_ALBUM';
  }

  private resolveTitle(item: InstagramMediaItem): string {
    const caption = item.caption?.trim();
    if (caption) {
      return caption.slice(0, 50);
    }

    const permalink = item.permalink?.trim();
    if (permalink) {
      return 'Instagram Photo';
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
