import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computeKeepSet,
  parseEntryNumber,
  getTimezoneOffsetMs,
  localTimeToUtc,
  getNextBackupTime,
  BackupService,
} from '../backupService.js';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import fs from 'node:fs';

const mockSpawn = vi.fn();
vi.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}

describe('parseEntryNumber', () => {
  it('parses a valid entry name', () => {
    expect(parseEntryNumber('42.2023-01-01')).toBe(42);
  });

  it('returns null for invalid entries', () => {
    expect(parseEntryNumber('2023-01-01')).toBeNull();
    expect(parseEntryNumber('abc.2023-01-01')).toBeNull();
    expect(parseEntryNumber('42')).toBeNull();
    expect(parseEntryNumber('')).toBeNull();
  });
});

describe('computeKeepSet', () => {
  it('returns an empty set for an empty input', () => {
    expect(computeKeepSet([]).size).toBe(0);
  });

  it('keeps all entries when fewer than 7 exist', () => {
    const keepSet = computeKeepSet([1, 2, 3]);
    expect(keepSet).toEqual(new Set([1, 2, 3]));
  });

  it('keeps all 7 when exactly 7 exist', () => {
    const keepSet = computeKeepSet(range(1, 7));
    expect(keepSet.size).toBe(7);
  });

  it('drops the oldest when 8 exist and it is not weekly-eligible', () => {
    const keepSet = computeKeepSet(range(1, 8));
    expect(keepSet).toEqual(new Set([2, 3, 4, 5, 6, 7, 8]));
  });

  it('keeps backup #7 as weekly when 14 exist', () => {
    const keepSet = computeKeepSet(range(1, 14));
    expect(keepSet).toEqual(new Set([7, 8, 9, 10, 11, 12, 13, 14]));
  });

  it('keeps 3 weekly slots with 28 backups', () => {
    const keepSet = computeKeepSet(range(1, 28));
    expect(keepSet).toEqual(new Set([7, 14, 21, 22, 23, 24, 25, 26, 27, 28]));
  });

  it('fills all 4 weekly slots with 35 backups', () => {
    const keepSet = computeKeepSet(range(1, 35));
    expect(keepSet).toEqual(new Set([7, 14, 21, 28, 29, 30, 31, 32, 33, 34, 35]));
  });

  it('evicts oldest weekly when a 5th arrives (42 backups)', () => {
    const keepSet = computeKeepSet(range(1, 42));
    expect(keepSet.has(35)).toBe(true);
    expect(keepSet.has(28)).toBe(true);
    expect(keepSet.has(21)).toBe(true);
    expect(keepSet.has(14)).toBe(true);
    expect(keepSet.has(7)).toBe(false);
  });

  it('promotes #28 to monthly when evicted from weekly (63 backups)', () => {
    const keepSet = computeKeepSet(range(1, 63));
    expect(keepSet).toEqual(new Set([28, 35, 42, 49, 56, 57, 58, 59, 60, 61, 62, 63]));
  });

  it('always keeps the most recent entry', () => {
    expect(computeKeepSet(range(1, 90)).has(90)).toBe(true);
    expect(computeKeepSet(range(1, 600)).has(600)).toBe(true);
  });

  it('caps at 23 retained entries for a large dataset', () => {
    const keepSet = computeKeepSet(range(1, 600));
    expect(keepSet.size).toBeLessThanOrEqual(23);
    expect(keepSet.size).toBeGreaterThan(0);
  });

  it('is stable — running retention twice produces the same result', () => {
    const keepSet1 = computeKeepSet(range(1, 90));
    const keepSet2 = computeKeepSet([...keepSet1]);
    expect([...keepSet2].sort((a, b) => a - b)).toEqual([...keepSet1].sort((a, b) => a - b));
  });

  it('simulates 90 daily backups with retention after each', () => {
    let store: number[] = [];

    for (let day = 1; day <= 90; day++) {
      store.push(day);
      const keepSet = computeKeepSet(store);
      store = store.filter((n) => keepSet.has(n));
    }

    expect(store.length).toBeGreaterThan(7);
    expect(store.length).toBeLessThanOrEqual(23);
    expect(store.includes(90)).toBe(true);

    const keepSet = computeKeepSet(store);
    const stableStore = store.filter((n) => keepSet.has(n));
    expect(stableStore).toEqual(store);
  });
});

describe('getTimezoneOffsetMs', () => {
  it('returns a negative offset for America/New_York (west of UTC)', () => {
    const date = new Date('2026-01-15T12:00:00Z');
    const offset = getTimezoneOffsetMs('America/New_York', date);
    expect(offset).toBe(-5 * 60 * 60 * 1000);
  });

  it('returns EDT offset during summer', () => {
    const date = new Date('2026-07-15T12:00:00Z');
    const offset = getTimezoneOffsetMs('America/New_York', date);
    expect(offset).toBe(-4 * 60 * 60 * 1000);
  });

  it('returns zero for UTC', () => {
    const date = new Date('2026-06-15T12:00:00Z');
    const offset = getTimezoneOffsetMs('UTC', date);
    expect(offset).toBe(0);
  });
});

describe('localTimeToUtc', () => {
  it('converts 3AM EST to 8AM UTC in winter', () => {
    const result = localTimeToUtc(2026, 1, 15, 3, 'America/New_York');
    expect(result.toISOString()).toBe('2026-01-15T08:00:00.000Z');
  });

  it('converts 3AM EDT to 7AM UTC in summer', () => {
    const result = localTimeToUtc(2026, 7, 15, 3, 'America/New_York');
    expect(result.toISOString()).toBe('2026-07-15T07:00:00.000Z');
  });

  it('handles DST spring-forward correctly (March 8, 2026)', () => {
    const result = localTimeToUtc(2026, 3, 8, 3, 'America/New_York');
    expect(result.toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });

  it('handles DST fall-back correctly (Nov 1, 2026)', () => {
    const result = localTimeToUtc(2026, 11, 1, 3, 'America/New_York');
    expect(result.toISOString()).toBe('2026-11-01T08:00:00.000Z');
  });

  it('handles month boundary (Jan 31 -> next day uses Feb 1)', () => {
    const result = localTimeToUtc(2026, 2, 1, 3, 'America/New_York');
    expect(result.toISOString()).toBe('2026-02-01T08:00:00.000Z');
  });
});

describe('getNextBackupTime', () => {
  const tz = 'America/New_York';

  it('returns today 3AM ET when now is before 3AM ET', () => {
    const now = new Date('2026-01-15T06:00:00Z');
    const result = getNextBackupTime(now, 3, tz);
    expect(result.toISOString()).toBe('2026-01-15T08:00:00.000Z');
  });

  it('returns tomorrow 3AM ET when now is after 3AM ET', () => {
    const now = new Date('2026-01-15T10:00:00Z');
    const result = getNextBackupTime(now, 3, tz);
    expect(result.toISOString()).toBe('2026-01-16T08:00:00.000Z');
  });

  it('returns tomorrow when now is exactly 3AM ET', () => {
    const now = new Date('2026-01-15T08:00:00.000Z');
    const result = getNextBackupTime(now, 3, tz);
    expect(result.toISOString()).toBe('2026-01-16T08:00:00.000Z');
  });

  it('handles month boundary (March 31 after 3AM → April 1)', () => {
    const now = new Date('2026-03-31T10:00:00Z');
    const result = getNextBackupTime(now, 3, tz);
    expect(result.toISOString()).toBe('2026-04-01T07:00:00.000Z');
  });

  it('handles year boundary (Dec 31 after 3AM → Jan 1)', () => {
    const now = new Date('2026-12-31T10:00:00Z');
    const result = getNextBackupTime(now, 3, tz);
    expect(result.toISOString()).toBe('2027-01-01T08:00:00.000Z');
  });

  it('handles DST spring-forward day', () => {
    const now = new Date('2026-03-08T06:00:00Z');
    const result = getNextBackupTime(now, 3, tz);
    expect(result.toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });

  it('shifts from EST to EDT across spring-forward', () => {
    const now = new Date('2026-03-07T09:00:00Z');
    const result = getNextBackupTime(now, 3, tz);
    expect(result.toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });

  it('schedules next day when called near midnight (not day after)', () => {
    const now = new Date('2026-01-16T04:17:00Z');
    const result = getNextBackupTime(now, 3, tz);
    expect(result.toISOString()).toBe('2026-01-16T08:00:00.000Z');
  });

  it('schedules next day near midnight on DST spring-forward eve', () => {
    const now = new Date('2026-03-08T04:17:00Z');
    const result = getNextBackupTime(now, 3, tz);
    expect(result.toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });

  it('result is always in the future', () => {
    const testDates = [
      '2026-01-01T00:00:00Z',
      '2026-03-08T07:00:00Z',
      '2026-06-15T23:59:59Z',
      '2026-11-01T06:30:00Z',
      '2026-12-31T23:59:59Z',
    ];
    for (const iso of testDates) {
      const now = new Date(iso);
      const result = getNextBackupTime(now, 3, tz);
      expect(result.getTime()).toBeGreaterThan(now.getTime());
    }
  });
});

function createMockChildProcess(exitCode: number, stderrData?: string) {
  const proc = new EventEmitter();
  const stderr = new Readable({ read() {} });
  Object.assign(proc, { stderr, stdout: new Readable({ read() {} }), stdin: null });

  process.nextTick(() => {
    if (stderrData) {
      stderr.push(Buffer.from(stderrData));
      stderr.push(null);
    }
    proc.emit('close', exitCode);
  });

  return proc;
}

function createEnoentProcess() {
  const proc = new EventEmitter();
  Object.assign(proc, {
    stderr: new Readable({ read() {} }),
    stdout: new Readable({ read() {} }),
    stdin: null,
  });

  process.nextTick(() => {
    const err = new Error('spawn pg_dump ENOENT') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    proc.emit('error', err);
  });

  return proc;
}

function mockS3Client(service: BackupService, sendMock: ReturnType<typeof vi.fn>) {
  Object.defineProperty(service, 's3Client', {
    get: () => ({ send: sendMock }),
    configurable: true,
  });
}

describe('BackupService.performBackup (local mode)', () => {
  let service: BackupService;
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp('/tmp/backup-test-');
    process.env.BACKUP_LOCAL_DIR = tmpDir;
    delete process.env.R2_BACKUP_BUCKET;
    service = new BackupService();
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates backup entry in local directory', async () => {
    await service.performBackup();

    const entries = await fs.promises.readdir(tmpDir);
    expect(entries.length).toBe(1);
    expect(entries[0]).toMatch(/^1\.\d{4}-\d{2}-\d{2}$/);

    const entryDir = `${tmpDir}/${entries[0]}`;
    const files = await fs.promises.readdir(entryDir);
    expect(files).toContain('db.dump');
    expect(files).toContain('uploads-skipped.txt');
  });

  it('increments sequence number for subsequent backups', async () => {
    await service.performBackup();
    await service.performBackup();

    const entries = await fs.promises.readdir(tmpDir);
    const numbers = entries.map((e) => parseInt(e.split('.')[0], 10)).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2]);
  });
});

describe('BackupService.performBackup (S3 mode with pg_dump)', () => {
  let service: BackupService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockSpawn.mockReset();
    process.env.R2_BACKUP_BUCKET = 'test-bucket';
    process.env.R2_ACCOUNT_ID = 'test-account';
    process.env.R2_ACCESS_KEY_ID = 'test-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret'; // pragma: allowlist secret
    process.env.DATABASE_URL = 'postgresql://test@localhost:5432/testdb';
    delete process.env.BACKUP_LOCAL_DIR;
    service = new BackupService();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('invokes pg_dump with correct arguments', async () => {
    vi.spyOn(fs, 'createReadStream').mockReturnValue(
      new Readable({
        read() {
          this.push(null);
        },
      }) as fs.ReadStream,
    );
    mockSpawn.mockReturnValue(createMockChildProcess(0));
    mockS3Client(service, vi.fn().mockResolvedValue({}));

    await service.performBackup();

    expect(mockSpawn).toHaveBeenCalledWith('pg_dump', [
      '--format=custom',
      expect.stringMatching(/^--file=\/tmp\/draco-db-/),
      'postgresql://test@localhost:5432/testdb',
    ]);
  });

  it('reports ENOENT error when pg_dump is not found', async () => {
    mockSpawn.mockReturnValue(createEnoentProcess());
    mockS3Client(service, vi.fn().mockResolvedValue({ CommonPrefixes: [] }));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await service.performBackup();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Backup failed'),
      expect.objectContaining({
        error: expect.stringContaining('Failed to start pg_dump'),
      }),
    );
  });

  it('reports error when pg_dump exits with non-zero code', async () => {
    mockSpawn.mockReturnValue(createMockChildProcess(1, 'connection refused'));
    mockS3Client(service, vi.fn().mockResolvedValue({ CommonPrefixes: [] }));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await service.performBackup();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Backup failed'),
      expect.objectContaining({
        error: expect.stringContaining('exited with code 1'),
      }),
    );
  });
});
