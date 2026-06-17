import { describe, it, expect, beforeEach } from 'vitest';
import sharp from 'sharp';
import type { PhotoSubmissionRecordType } from '@draco/shared-schemas';
import { PhotoSubmissionAssetService } from '../photoSubmissionAssetService.js';
import { InMemoryStorage } from './inMemoryStorage.js';

const submission: PhotoSubmissionRecordType = {
  id: '10',
  accountId: '1',
  teamId: null,
  albumId: null,
  submitterContactId: '5',
  moderatedByContactId: null,
  approvedPhotoId: null,
  title: 'Summer Tournament',
  caption: null,
  originalFileName: 'photo.jpg',
  originalFilePath: '1/photo-submissions/key/original.jpg',
  primaryImagePath: '1/photo-submissions/key/primary.jpg',
  thumbnailImagePath: '1/photo-submissions/key/thumbnail.jpg',
  status: 'Approved',
  denialReason: null,
  submittedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  moderatedAt: null,
};

describe('PhotoSubmissionAssetService.promoteSubmissionAssets', () => {
  let storage: InMemoryStorage;
  let service: PhotoSubmissionAssetService;

  beforeEach(() => {
    storage = new InMemoryStorage();
    service = new PhotoSubmissionAssetService(storage);
    storage.objects.set(submission.originalFilePath, {
      buffer: Buffer.from('original'),
      contentType: 'image/jpeg',
    });
    storage.objects.set(submission.primaryImagePath, {
      buffer: Buffer.from('primary'),
      contentType: 'image/jpeg',
    });
    storage.objects.set(submission.thumbnailImagePath, {
      buffer: Buffer.from('thumbnail'),
      contentType: 'image/jpeg',
    });
  });

  it('promotes the primary into the gallery photo key and the thumbnail into the thumb key', async () => {
    await service.promoteSubmissionAssets(submission, 25n);

    const photo = storage.objects.get('1/photo-gallery/25/photo.jpg');
    const thumb = storage.objects.get('1/photo-gallery/25/photo-thumb.jpg');

    expect(photo?.buffer.toString()).toBe('primary');
    expect(thumb?.buffer.toString()).toBe('thumbnail');
  });

  it('does not redundantly read or copy the submission original', async () => {
    await service.promoteSubmissionAssets(submission, 25n);

    expect(storage.getObject).not.toHaveBeenCalledWith(submission.originalFilePath);
    expect(storage.getObject).toHaveBeenCalledTimes(2);
    expect(storage.saveObject).toHaveBeenCalledTimes(2);
  });

  it('preserves the stored content type when promoting a .bmp-keyed JPEG derivative', async () => {
    const bmpSubmission: PhotoSubmissionRecordType = {
      ...submission,
      originalFilePath: '1/photo-submissions/key/original.bmp',
      primaryImagePath: '1/photo-submissions/key/primary.bmp',
      thumbnailImagePath: '1/photo-submissions/key/thumbnail.bmp',
    };
    storage.objects.set(bmpSubmission.primaryImagePath, {
      buffer: Buffer.from('jpeg-bytes'),
      contentType: 'image/jpeg',
    });
    storage.objects.set(bmpSubmission.thumbnailImagePath, {
      buffer: Buffer.from('jpeg-thumb'),
      contentType: 'image/jpeg',
    });

    await service.promoteSubmissionAssets(bmpSubmission, 25n);

    const photo = storage.objects.get('1/photo-gallery/25/photo.bmp');
    expect(photo?.contentType).toBe('image/jpeg');
  });
});

describe('PhotoSubmissionAssetService.stageSubmissionAssets', () => {
  const bmpSubmission: PhotoSubmissionRecordType = {
    ...submission,
    originalFilePath: '1/photo-submissions/key/original.bmp',
    primaryImagePath: '1/photo-submissions/key/primary.bmp',
    thumbnailImagePath: '1/photo-submissions/key/thumbnail.bmp',
  };

  it('stores the original as image/bmp and transcoded derivatives as image/jpeg', async () => {
    const storage = new InMemoryStorage();
    const service = new PhotoSubmissionAssetService(storage);
    const source = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: { r: 5, g: 90, b: 180 } },
    })
      .png()
      .toBuffer();

    await service.stageSubmissionAssets(bmpSubmission, source);

    expect(storage.objects.get(bmpSubmission.originalFilePath)?.contentType).toBe('image/bmp');
    expect(storage.objects.get(bmpSubmission.primaryImagePath)?.contentType).toBe('image/jpeg');
    expect(storage.objects.get(bmpSubmission.thumbnailImagePath)?.contentType).toBe('image/jpeg');
  });
});
