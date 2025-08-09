import { LocalStorageService } from '../storageService.js';
import fs from 'node:fs';
import sharp from 'sharp';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('sharp', () => ({ default: vi.fn() }));
vi.mock('node:fs', () => {
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  const readFileSync = vi.fn();
  const unlinkSync = vi.fn();
  return {
    ...fs,
    default: { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync },
    existsSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    unlinkSync,
  };
});

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let existsSyncSpy: any;
  let mkdirSyncSpy: any;
  let writeFileSyncSpy: any;
  let readFileSyncSpy: any;
  let unlinkSyncSpy: any;
  let mockSharp: any;

  beforeEach(() => {
    existsSyncSpy = (fs as any).existsSync as any;
    mkdirSyncSpy = (fs as any).mkdirSync as any;
    writeFileSyncSpy = (fs as any).writeFileSync as any;
    readFileSyncSpy = (fs as any).readFileSync as any;
    unlinkSyncSpy = (fs as any).unlinkSync as any;

    mockSharp = sharp as any;
    mockSharp.mockReturnValue({
      resize: () => ({
        png: () => ({
          toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized')),
        }),
      }),
    } as unknown as sharp.Sharp);

    service = new LocalStorageService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should save a logo', async () => {
    existsSyncSpy.mockReturnValue(false);
    mkdirSyncSpy.mockImplementation(() => undefined);
    writeFileSyncSpy.mockImplementation(() => undefined);
    await service.saveLogo('1', '2', Buffer.from('test'));
    expect(mkdirSyncSpy).toHaveBeenCalled();
    expect(writeFileSyncSpy).toHaveBeenCalled();
    expect(mockSharp).toHaveBeenCalledWith(Buffer.from('test'));
  });

  it('should get a logo if it exists', async () => {
    existsSyncSpy.mockReturnValue(true);
    readFileSyncSpy.mockReturnValue(Buffer.from('logo'));
    const result = await service.getLogo('1', '2');
    expect(result).toEqual(Buffer.from('logo'));
  });

  it('should return null if logo does not exist', async () => {
    existsSyncSpy.mockReturnValue(false);
    const result = await service.getLogo('1', '2');
    expect(result).toBeNull();
  });

  it('should delete a logo if it exists', async () => {
    existsSyncSpy.mockReturnValue(true);
    unlinkSyncSpy.mockImplementation(() => undefined);
    await service.deleteLogo('1', '2');
    expect(unlinkSyncSpy).toHaveBeenCalled();
  });

  it('should not throw if deleting a non-existent logo', async () => {
    existsSyncSpy.mockReturnValue(false);
    await expect(service.deleteLogo('1', '2')).resolves.toBeUndefined();
  });
});
