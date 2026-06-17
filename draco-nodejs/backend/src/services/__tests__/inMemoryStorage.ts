import { vi } from 'vitest';
import type { StorageService } from '../baseStorageService.js';

export class InMemoryStorage implements StorageService {
  readonly objects = new Map<string, { buffer: Buffer; contentType: string }>();

  readonly saveObject = vi.fn(async (key: string, buffer: Buffer, contentType: string) => {
    this.objects.set(key, { buffer, contentType });
  });

  readonly getObject = vi.fn(async (key: string): Promise<Buffer | null> => {
    return this.objects.get(key)?.buffer ?? null;
  });

  readonly deleteObject = vi.fn(async (key: string) => {
    this.objects.delete(key);
  });

  private notImplemented(): never {
    throw new Error('not implemented');
  }

  saveLogo = this.notImplemented;
  getLogo = this.notImplemented;
  deleteLogo = this.notImplemented;
  saveAccountLogo = this.notImplemented;
  getAccountLogo = this.notImplemented;
  deleteAccountLogo = this.notImplemented;
  saveContactPhoto = this.notImplemented;
  getContactPhoto = this.notImplemented;
  deleteContactPhoto = this.notImplemented;
  saveSponsorPhoto = this.notImplemented;
  getSponsorPhoto = this.notImplemented;
  deleteSponsorPhoto = this.notImplemented;
  saveAttachment = this.notImplemented;
  getAttachment = this.notImplemented;
  deleteAttachment = this.notImplemented;
  deleteAllAttachments = this.notImplemented;
  saveHandout = this.notImplemented;
  getHandout = this.notImplemented;
  deleteHandout = this.notImplemented;
}
