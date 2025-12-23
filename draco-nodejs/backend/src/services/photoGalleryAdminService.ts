import type {
  CreatePhotoGalleryAlbumType,
  CreatePhotoGalleryPhotoType,
  PhotoGalleryAdminAlbumListType,
  PhotoGalleryAdminAlbumType,
  PhotoGalleryListType,
  PhotoGalleryPhotoType,
  UpdatePhotoGalleryAlbumType,
  UpdatePhotoGalleryPhotoType,
} from '@draco/shared-schemas';
import { ServiceFactory } from '../services/serviceFactory.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import {
  GalleryQueryOptions,
  IPhotoGalleryAdminRepository,
} from '../repositories/interfaces/IPhotoGalleryRepository.js';
import { PhotoGalleryResponseFormatter } from '../responseFormatters/photoGalleryResponseFormatter.js';
import { PhotoGalleryAdminResponseFormatter } from '../responseFormatters/photoGalleryAdminResponseFormatter.js';
import type { dbPhotoGalleryAlbum, dbPhotoGalleryEntry } from '../repositories/types/dbTypes.js';
import { PhotoGalleryAssetService } from './photoGalleryAssetService.js';
import { ALBUM_PHOTO_LIMIT } from './photoGalleryLimits.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import { ValidationUtils } from '../utils/validationUtils.js';
import { buildGalleryAssetPaths } from '../utils/photoSubmissionPaths.js';
import { InstagramIntegrationService } from './instagramIntegrationService.js';

const GALLERY_EXTENSION = '.jpg';
type AdminCreatePhotoPayload = Omit<CreatePhotoGalleryPhotoType, 'photo'>;

const trimOrEmpty = (value: string | null | undefined): string => {
  if (value === undefined || value === null) {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? '' : trimmed;
};

export class PhotoGalleryAdminService {
  constructor(
    private readonly repository: IPhotoGalleryAdminRepository = RepositoryFactory.getPhotoGalleryAdminRepository(),
    private readonly assetService: PhotoGalleryAssetService = ServiceFactory.getPhotoGalleryAssetService(),
    private readonly instagramIntegrationService: InstagramIntegrationService = ServiceFactory.getInstagramIntegrationService(),
  ) {}

  async listGalleryEntries(
    accountId: bigint,
    query: { albumId?: string | null; teamId?: string | null },
  ): Promise<PhotoGalleryListType> {
    const options = this.buildQueryOptions(accountId, query);
    const entries = await this.repository.listGalleryEntries(options);
    return PhotoGalleryResponseFormatter.formatAccountGallery(entries);
  }

  async createPhoto(
    accountId: bigint,
    payload: AdminCreatePhotoPayload,
    fileBuffer: Buffer,
  ): Promise<PhotoGalleryPhotoType> {
    this.ensureFileProvided(fileBuffer);

    const title = payload.title.trim();
    const caption = trimOrEmpty(payload.caption ?? null);

    const albumId = await this.parseOptionalAlbumId(payload.albumId, accountId);
    await this.enforceAlbumCapacity(accountId, albumId);

    const created = await this.repository.createPhoto({
      accountid: accountId,
      albumid: albumId ?? null,
      title,
      caption,
    });

    try {
      await this.assetService.saveGalleryAssets(accountId, created.id, fileBuffer);
    } catch (error) {
      await this.repository.deletePhoto(created.id).catch(() => undefined);
      throw error;
    }

    const entry = await this.requirePhoto(accountId, created.id);
    await this.uploadToInstagram(accountId, created.id, caption).catch((error) => {
      console.error('[instagram] Failed to mirror photo upload', {
        accountId: accountId.toString(),
        photoId: created.id.toString(),
        error,
      });
    });
    return this.formatPhoto(entry);
  }

  async updatePhoto(
    accountId: bigint,
    photoId: bigint,
    payload: UpdatePhotoGalleryPhotoType,
  ): Promise<PhotoGalleryPhotoType> {
    const existing = await this.requirePhoto(accountId, photoId);

    const updateData: { title?: string; caption?: string; albumid?: bigint | null } = {};

    if (payload.title !== undefined) {
      updateData.title = payload.title.trim();
    }

    if (payload.caption !== undefined) {
      updateData.caption = trimOrEmpty(payload.caption);
    }

    if (payload.albumId !== undefined) {
      const albumId = await this.parseOptionalAlbumId(payload.albumId, accountId);

      if (albumId !== null) {
        await this.enforceAlbumCapacity(accountId, albumId, existing.albumid ?? null);
      }

      updateData.albumid = albumId ?? null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No updates were provided');
    }

    await this.repository.updatePhoto(photoId, updateData);

    const entry = await this.requirePhoto(accountId, photoId);
    return this.formatPhoto(entry);
  }

  async deletePhoto(accountId: bigint, photoId: bigint): Promise<void> {
    await this.requirePhoto(accountId, photoId);
    await this.repository.deletePhoto(photoId);
    await this.assetService.deleteGalleryAssets(accountId, photoId);
  }

  async listAlbums(accountId: bigint): Promise<PhotoGalleryAdminAlbumListType> {
    const [accountAlbums, defaultAlbums] = await Promise.all([
      this.repository.listAlbums(accountId),
      this.repository.listAlbums(0n),
    ]);

    const combined = [...defaultAlbums, ...accountAlbums];
    return PhotoGalleryAdminResponseFormatter.formatAlbumList(combined);
  }

  async createAlbum(
    accountId: bigint,
    payload: CreatePhotoGalleryAlbumType,
  ): Promise<PhotoGalleryAdminAlbumType> {
    const title = payload.title.trim();
    await this.ensureUniqueAlbumTitle(accountId, title);

    const teamId = this.parseOptionalTeamId(payload.teamId);
    const parentAlbumId = await this.parseOptionalParentAlbumId(payload.parentAlbumId, accountId);

    const created = await this.repository.createAlbum({
      accountid: accountId,
      title,
      teamid: teamId ?? 0n,
      parentalbumid: parentAlbumId ?? 0n,
    });

    return PhotoGalleryAdminResponseFormatter.formatAlbum(created);
  }

  async updateAlbum(
    accountId: bigint,
    albumId: bigint,
    payload: UpdatePhotoGalleryAlbumType,
  ): Promise<PhotoGalleryAdminAlbumType> {
    if (accountId === 0n) {
      throw new ValidationError('Default albums cannot be modified');
    }

    const current = await this.requireAlbum(accountId, albumId);

    const updateData: {
      title?: string;
      teamid?: bigint;
      parentalbumid?: bigint;
    } = {};

    if (payload.title !== undefined) {
      const title = payload.title.trim();
      if (title !== current.title.trim()) {
        await this.ensureUniqueAlbumTitle(accountId, title, albumId);
      }
      updateData.title = title;
    }

    if (payload.teamId !== undefined) {
      const teamId = this.parseOptionalTeamId(payload.teamId);
      updateData.teamid = teamId ?? 0n;
    }

    if (payload.parentAlbumId !== undefined) {
      const parentAlbumId = await this.parseOptionalParentAlbumId(payload.parentAlbumId, accountId);
      if (parentAlbumId !== null && parentAlbumId === albumId) {
        throw new ValidationError('Album cannot be its own parent');
      }
      updateData.parentalbumid = parentAlbumId ?? 0n;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No updates were provided');
    }

    const updated = await this.repository.updateAlbum(albumId, updateData);
    return PhotoGalleryAdminResponseFormatter.formatAlbum(updated);
  }

  async deleteAlbum(accountId: bigint, albumId: bigint): Promise<void> {
    if (accountId === 0n) {
      throw new ValidationError('Default albums cannot be deleted');
    }

    await this.requireAlbum(accountId, albumId);

    const [photoCount, childAlbumCount] = await Promise.all([
      this.repository.countPhotosInAlbum(accountId, albumId),
      this.repository.countChildAlbums(accountId, albumId),
    ]);

    if (photoCount > 0) {
      throw new ConflictError('Album cannot be deleted while it contains photos');
    }

    if (childAlbumCount > 0) {
      throw new ConflictError('Album cannot be deleted while it has child albums');
    }

    await this.repository.deleteAlbum(albumId);
  }

  private ensureFileProvided(fileBuffer: Buffer | undefined): void {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new ValidationError('Photo file is required');
    }
  }

  private buildQueryOptions(
    accountId: bigint,
    query: { albumId?: string | null; teamId?: string | null },
  ): GalleryQueryOptions {
    const options: GalleryQueryOptions = {
      accountId,
    };

    if (query.albumId !== undefined) {
      options.albumId = this.parseNullableIdentifier(query.albumId, 'Album');
    }

    if (query.teamId !== undefined) {
      const parsed = this.parseNullableIdentifier(query.teamId, 'Team');
      options.teamId = parsed ?? null;
    }

    return options;
  }

  private async parseOptionalAlbumId(
    value: string | null | undefined,
    accountId: bigint,
  ): Promise<bigint | null> {
    if (value === undefined) {
      return null;
    }

    const albumId = this.parseNullableIdentifier(value, 'Album');
    if (albumId === null) {
      return null;
    }

    const album = await this.repository.findAlbumById(accountId, albumId);
    if (!album) {
      throw new NotFoundError('Photo album not found');
    }

    return album.id;
  }

  private parseNullableIdentifier(value: string | null, label: string): bigint | null {
    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = this.parseBigInt(trimmed, label);
    if (parsed <= 0n) {
      throw new ValidationError(`${label} identifier must be a positive value`);
    }
    return parsed;
  }

  private parseOptionalTeamId(value: string | null | undefined): bigint | null {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = this.parseBigInt(trimmed, 'Team');
    return parsed === 0n ? null : parsed;
  }

  private async parseOptionalParentAlbumId(
    value: string | null | undefined,
    accountId: bigint,
  ): Promise<bigint | null> {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = this.parseBigInt(trimmed, 'Parent album');
    if (parsed === 0n) {
      return null;
    }

    const parent = await this.repository.findAlbumById(accountId, parsed);
    if (!parent) {
      throw new NotFoundError('Parent album not found');
    }

    return parent.id;
  }

  private parseBigInt(value: string, label: string): bigint {
    return ValidationUtils.parseBigInt(value, `${label} identifier`);
  }

  private async enforceAlbumCapacity(
    accountId: bigint,
    targetAlbumId: bigint | null,
    currentAlbumId: bigint | null = null,
  ): Promise<void> {
    if (targetAlbumId === null) {
      return;
    }

    if (currentAlbumId !== null && currentAlbumId === targetAlbumId) {
      return;
    }

    const photoCount = await this.repository.countPhotosInAlbum(accountId, targetAlbumId);
    if (photoCount >= ALBUM_PHOTO_LIMIT) {
      throw new ValidationError('Album has reached the maximum number of photos');
    }
  }

  private async requirePhoto(accountId: bigint, photoId: bigint): Promise<dbPhotoGalleryEntry> {
    const entry = await this.repository.findPhotoById(accountId, photoId);
    if (!entry) {
      throw new NotFoundError('Gallery photo not found');
    }
    return entry;
  }

  private async requireAlbum(accountId: bigint, albumId: bigint): Promise<dbPhotoGalleryAlbum> {
    const album = await this.repository.findAlbumById(accountId, albumId);
    if (!album) {
      throw new NotFoundError('Photo album not found');
    }
    return album;
  }

  private async ensureUniqueAlbumTitle(
    accountId: bigint,
    title: string,
    excludeAlbumId?: bigint,
  ): Promise<void> {
    const existing = await this.repository.findAlbumByTitle(accountId, title);
    if (!existing) {
      return;
    }

    if (excludeAlbumId && existing.id === excludeAlbumId) {
      return;
    }

    throw new ConflictError('An album with this title already exists');
  }

  private async uploadToInstagram(
    accountId: bigint,
    photoId: bigint,
    caption?: string,
  ): Promise<void> {
    await this.instagramIntegrationService.uploadPhotoFromGallery(accountId, photoId, caption);
  }

  private formatPhoto(entry: dbPhotoGalleryEntry): PhotoGalleryPhotoType {
    const formatted = PhotoGalleryResponseFormatter.formatPhotoEntry(entry);
    if (!formatted) {
      throw new ValidationError('Gallery photo could not be formatted');
    }

    const galleryPaths = buildGalleryAssetPaths(entry.accountid, entry.id, GALLERY_EXTENSION);

    return {
      ...formatted,
      originalUrl: formatted.originalUrl ?? `/uploads/${galleryPaths.originalFilePath}`,
      primaryUrl: formatted.primaryUrl ?? `/uploads/${galleryPaths.primaryImagePath}`,
      thumbnailUrl: formatted.thumbnailUrl ?? `/uploads/${galleryPaths.thumbnailImagePath}`,
    };
  }
}
