import { LocalStorageService } from '../storageService.js';
import sharp from 'sharp';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const hoisted = vi.hoisted(() => {
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  const readFileSync = vi.fn();
  const unlinkSync = vi.fn();
  const rmSync = vi.fn();
  return {
    default: { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, rmSync },
    existsSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    unlinkSync,
    rmSync,
  };
});

vi.mock('sharp', () => ({ default: vi.fn() }));
vi.mock('node:fs', () => ({
  existsSync: hoisted.existsSync,
  mkdirSync: hoisted.mkdirSync,
  writeFileSync: hoisted.writeFileSync,
  readFileSync: hoisted.readFileSync,
  unlinkSync: hoisted.unlinkSync,
  rmSync: hoisted.rmSync,
  default: {
    existsSync: hoisted.existsSync,
    mkdirSync: hoisted.mkdirSync,
    writeFileSync: hoisted.writeFileSync,
    readFileSync: hoisted.readFileSync,
    unlinkSync: hoisted.unlinkSync,
    rmSync: hoisted.rmSync,
  },
}));

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let existsSyncSpy: any;
  let mkdirSyncSpy: any;
  let writeFileSyncSpy: any;
  let readFileSyncSpy: any;
  let unlinkSyncSpy: any;
  let rmSyncSpy: any;
  let mockSharp: any;

  beforeEach(() => {
    existsSyncSpy = hoisted.existsSync;
    mkdirSyncSpy = hoisted.mkdirSync;
    writeFileSyncSpy = hoisted.writeFileSync;
    readFileSyncSpy = hoisted.readFileSync;
    unlinkSyncSpy = hoisted.unlinkSync;
    rmSyncSpy = hoisted.rmSync;

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

  describe('attachment methods', () => {
    const accountId = '123';
    const emailId = '456';
    const filename = 'test-document.pdf';
    const testBuffer = Buffer.from('attachment content');

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('saveAttachment', () => {
      it('should save attachment and return storage path', async () => {
        existsSyncSpy.mockReturnValue(false);
        mkdirSyncSpy.mockImplementation(() => undefined);
        writeFileSyncSpy.mockImplementation(() => undefined);

        const result = await service.saveAttachment(accountId, emailId, filename, testBuffer);

        expect(result).toBe('123/email-attachments/456/test-document.pdf');
        expect(mkdirSyncSpy).toHaveBeenCalledWith(
          expect.stringContaining('123/email-attachments/456'),
          { recursive: true },
        );
        expect(writeFileSyncSpy).toHaveBeenCalledWith(
          expect.stringContaining('123/email-attachments/456/test-document.pdf'),
          testBuffer,
        );
      });

      it('should not create directory if it already exists', async () => {
        existsSyncSpy.mockReturnValue(true);
        writeFileSyncSpy.mockImplementation(() => undefined);

        await service.saveAttachment(accountId, emailId, filename, testBuffer);

        expect(mkdirSyncSpy).not.toHaveBeenCalled();
        expect(writeFileSyncSpy).toHaveBeenCalled();
      });
    });

    describe('getAttachment', () => {
      it('should return attachment buffer if file exists', async () => {
        existsSyncSpy.mockReturnValue(true);
        readFileSyncSpy.mockReturnValue(testBuffer);

        const result = await service.getAttachment(accountId, emailId, filename);

        expect(result).toEqual(testBuffer);
        expect(readFileSyncSpy).toHaveBeenCalledWith(
          expect.stringContaining('123/email-attachments/456/test-document.pdf'),
        );
      });

      it('should return null if file does not exist', async () => {
        existsSyncSpy.mockReturnValue(false);

        const result = await service.getAttachment(accountId, emailId, filename);

        expect(result).toBeNull();
        expect(readFileSyncSpy).not.toHaveBeenCalled();
      });

      it('should return null and log error if read fails', async () => {
        existsSyncSpy.mockReturnValue(true);
        readFileSyncSpy.mockImplementation(() => {
          throw new Error('Read error');
        });

        const result = await service.getAttachment(accountId, emailId, filename);

        expect(result).toBeNull();
      });
    });

    describe('deleteAttachment', () => {
      it('should delete attachment if file exists', async () => {
        existsSyncSpy.mockReturnValue(true);
        unlinkSyncSpy.mockImplementation(() => undefined);

        await service.deleteAttachment(accountId, emailId, filename);

        expect(unlinkSyncSpy).toHaveBeenCalledWith(
          expect.stringContaining('123/email-attachments/456/test-document.pdf'),
        );
      });

      it('should not throw if file does not exist', async () => {
        existsSyncSpy.mockReturnValue(false);

        await expect(
          service.deleteAttachment(accountId, emailId, filename),
        ).resolves.toBeUndefined();
        expect(unlinkSyncSpy).not.toHaveBeenCalled();
      });
    });

    describe('deleteAllAttachments', () => {
      it('should delete entire attachment directory if it exists', async () => {
        existsSyncSpy.mockReturnValue(true);
        rmSyncSpy.mockImplementation(() => undefined);

        await service.deleteAllAttachments(accountId, emailId);

        expect(rmSyncSpy).toHaveBeenCalledWith(
          expect.stringContaining('123/email-attachments/456'),
          { recursive: true, force: true },
        );
      });

      it('should not throw if directory does not exist', async () => {
        existsSyncSpy.mockReturnValue(false);

        await expect(service.deleteAllAttachments(accountId, emailId)).resolves.toBeUndefined();
        expect(rmSyncSpy).not.toHaveBeenCalled();
      });
    });
  });
});
