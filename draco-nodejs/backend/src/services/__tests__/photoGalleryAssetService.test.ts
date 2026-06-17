import { describe, it, expect, beforeEach } from 'vitest';
import sharp from 'sharp';
import { PhotoGalleryAssetService } from '../photoGalleryAssetService.js';
import { InMemoryStorage } from './inMemoryStorage.js';

const createSourceImage = (): Promise<Buffer> =>
  sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r: 10, g: 120, b: 200 } },
  })
    .png()
    .toBuffer();

describe('PhotoGalleryAssetService', () => {
  let storage: InMemoryStorage;
  let service: PhotoGalleryAssetService;

  beforeEach(() => {
    storage = new InMemoryStorage();
    service = new PhotoGalleryAssetService(storage);
  });

  it('stores resized primary and thumbnail JPEGs under the gallery keys', async () => {
    const source = await createSourceImage();

    await service.saveGalleryAssets(1n, 25n, source);

    const primary = storage.objects.get('1/photo-gallery/25/photo.jpg');
    const thumbnail = storage.objects.get('1/photo-gallery/25/photo-thumb.jpg');

    expect(primary?.contentType).toBe('image/jpeg');
    expect(thumbnail?.contentType).toBe('image/jpeg');

    const primaryMeta = await sharp(primary!.buffer).metadata();
    expect(primaryMeta.format).toBe('jpeg');
    expect(primaryMeta.width).toBe(800);
    expect(primaryMeta.height).toBe(450);

    const thumbnailMeta = await sharp(thumbnail!.buffer).metadata();
    expect(thumbnailMeta.width).toBe(160);
    expect(thumbnailMeta.height).toBe(90);
  });

  it('removes both gallery keys on delete', async () => {
    const source = await createSourceImage();
    await service.saveGalleryAssets(1n, 25n, source);

    await service.deleteGalleryAssets(1n, 25n);

    expect(storage.objects.has('1/photo-gallery/25/photo.jpg')).toBe(false);
    expect(storage.objects.has('1/photo-gallery/25/photo-thumb.jpg')).toBe(false);
  });

  it('cleans up partial writes when storage fails mid-save', async () => {
    const source = await createSourceImage();
    storage.saveObject.mockImplementationOnce(async (key, buffer, contentType) => {
      storage.objects.set(key, { buffer, contentType });
    });
    storage.saveObject.mockImplementationOnce(async () => {
      throw new Error('R2 unavailable');
    });

    await expect(service.saveGalleryAssets(1n, 25n, source)).rejects.toThrow('R2 unavailable');

    expect(storage.deleteObject).toHaveBeenCalledWith('1/photo-gallery/25/photo.jpg');
    expect(storage.deleteObject).toHaveBeenCalledWith('1/photo-gallery/25/photo-thumb.jpg');
    expect(storage.objects.size).toBe(0);
  });
});
