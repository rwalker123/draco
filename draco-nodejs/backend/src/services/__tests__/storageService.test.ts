import { LocalStorageService } from '../storageService';
import * as fs from 'fs';
import * as sharp from 'sharp';

jest.mock('sharp', () => jest.fn());

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let existsSyncSpy: jest.SpyInstance;
  let mkdirSyncSpy: jest.SpyInstance;
  let writeFileSyncSpy: jest.SpyInstance;
  let readFileSyncSpy: jest.SpyInstance;
  let unlinkSyncSpy: jest.SpyInstance;
  let mockSharp: jest.MockedFunction<typeof sharp>;

  beforeEach(() => {
    existsSyncSpy = jest.spyOn(fs, 'existsSync');
    mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
    unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync');

    mockSharp = sharp as jest.MockedFunction<typeof sharp>;
    mockSharp.mockReturnValue({
      resize: () => ({
        png: () => ({
          toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
        }),
      }),
    } as unknown as sharp.Sharp);

    service = new LocalStorageService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
