import { LocalStorageService } from '../storageService.js';
import sharp from 'sharp';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const hoisted = vi.hoisted(() => {
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  const readFileSync = vi.fn();
  const unlinkSync = vi.fn();
  return { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync };
});

vi.mock('sharp', () => ({ default: vi.fn() }));
vi.mock('node:fs', () => ({
  existsSync: hoisted.existsSync,
  mkdirSync: hoisted.mkdirSync,
  writeFileSync: hoisted.writeFileSync,
  readFileSync: hoisted.readFileSync,
  unlinkSync: hoisted.unlinkSync,
  default: {
    existsSync: hoisted.existsSync,
    mkdirSync: hoisted.mkdirSync,
    writeFileSync: hoisted.writeFileSync,
    readFileSync: hoisted.readFileSync,
    unlinkSync: hoisted.unlinkSync,
  },
}));

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let existsSyncSpy: any;
  let mkdirSyncSpy: any;
  let writeFileSyncSpy: any;
  let readFileSyncSpy: any;
  let unlinkSyncSpy: any;
  let mockSharp: any;

  beforeEach(() => {
    existsSyncSpy = hoisted.existsSync;
    mkdirSyncSpy = hoisted.mkdirSync;
    writeFileSyncSpy = hoisted.writeFileSync;
    readFileSyncSpy = hoisted.readFileSync;
    unlinkSyncSpy = hoisted.unlinkSync;

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
