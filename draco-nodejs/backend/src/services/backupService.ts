import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import type { IBackupService } from '../interfaces/backupInterfaces.js';

const ENTRY_PATTERN = /^(\d+)\.\d{4}-\d{2}-\d{2}$/;

export function parseEntryNumber(entry: string): number | null {
  const match = entry.match(ENTRY_PATTERN);
  return match ? parseInt(match[1], 10) : null;
}

export function computeKeepSet(backupNumbers: number[]): Set<number> {
  const sorted = [...backupNumbers].sort((a, b) => b - a);
  const keepSet = new Set<number>();

  sorted.slice(0, 7).forEach((n) => keepSet.add(n));

  let weeklyCount = 0;
  for (const n of sorted) {
    if (weeklyCount >= 4) break;
    if (keepSet.has(n)) continue;
    if (n % 7 === 0) {
      keepSet.add(n);
      weeklyCount++;
    }
  }

  let monthlyCount = 0;
  for (const n of sorted) {
    if (monthlyCount >= 12) break;
    if (keepSet.has(n)) continue;
    if (n % 28 === 0) {
      keepSet.add(n);
      monthlyCount++;
    }
  }

  return keepSet;
}

export function getTimezoneOffsetMs(tz: string, utcDate: Date): number {
  const utcStr = utcDate.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = utcDate.toLocaleString('en-US', { timeZone: tz });
  return new Date(tzStr).getTime() - new Date(utcStr).getTime();
}

export function localTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  tz: string,
): Date {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`;
  const naive = new Date(dateStr);
  const approxOffset = getTimezoneOffsetMs(tz, naive);
  const approxUtc = new Date(naive.getTime() - approxOffset);
  const refinedOffset = getTimezoneOffsetMs(tz, approxUtc);
  return new Date(naive.getTime() - refinedOffset);
}

export function getNextBackupTime(now: Date, hour: number, tz: string): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const getParts = (d: Date) => {
    const m = Object.fromEntries(formatter.formatToParts(d).map((p) => [p.type, p.value]));
    return { year: Number(m.year), month: Number(m.month), day: Number(m.day) };
  };

  const today = getParts(now);
  const target = localTimeToUtc(today.year, today.month, today.day, hour, tz);
  if (target > now) return target;

  const tomorrowRef = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrow = getParts(tomorrowRef);
  return localTimeToUtc(tomorrow.year, tomorrow.month, tomorrow.day, hour, tz);
}

export class BackupService implements IBackupService {
  private scheduledTimeout: NodeJS.Timeout | null = null;
  private readonly backupHour = 3;
  private readonly backupTimezone = process.env.BACKUP_TIMEZONE || 'America/New_York';
  private _s3Client: S3Client | null = null;

  private get s3Client(): S3Client {
    if (!this._s3Client) {
      const accountId = process.env.R2_ACCOUNT_ID;
      const accessKeyId = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

      if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error(
          'R2 credentials are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.',
        );
      }

      this._s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
    return this._s3Client;
  }

  public start(): void {
    if (!process.env.R2_BACKUP_BUCKET && !process.env.BACKUP_LOCAL_DIR) {
      console.warn(
        '⚠️ Backup service disabled: neither R2_BACKUP_BUCKET nor BACKUP_LOCAL_DIR is set',
      );
      return;
    }

    if (this.scheduledTimeout) {
      this.stop();
    }

    this.scheduleNextBackup();
  }

  private scheduleNextBackup(): void {
    const now = new Date();
    const nextBackup = getNextBackupTime(now, this.backupHour, this.backupTimezone);
    const delay = nextBackup.getTime() - now.getTime();

    this.scheduledTimeout = setTimeout(() => {
      this.performBackup().catch(console.error);
      this.scheduleNextBackup();
    }, delay);

    console.log(`💾 Backup scheduled for ${nextBackup.toISOString()}`);
  }

  public stop(): void {
    if (this.scheduledTimeout) {
      clearTimeout(this.scheduledTimeout);
      this.scheduledTimeout = null;
    }
    console.log('💾 Backup service stopped');
  }

  public async performBackup(): Promise<void> {
    const startTime = Date.now();
    const dateStr = new Date().toISOString().slice(0, 10);
    const nextNumber = await this.getNextSequenceNumber();
    const entryPrefix = `${nextNumber}.${dateStr}`;

    console.log(`💾 Starting backup #${nextNumber} (${dateStr})...`);

    try {
      await this.backupDatabase(entryPrefix);
      await this.backupUploads(entryPrefix);

      const duration = Date.now() - startTime;
      console.log(`💾 Backup #${nextNumber} completed in ${duration}ms`);

      await this.applyRetentionPolicy();
    } catch (error) {
      console.error('❌ Backup failed:', {
        error: error instanceof Error ? error.message : String(error),
        entry: entryPrefix,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async getNextSequenceNumber(): Promise<number> {
    const entries = await this.listEntries();
    if (entries.length === 0) return 1;
    const maxNumber = Math.max(...entries);
    return maxNumber + 1;
  }

  private async listEntries(): Promise<number[]> {
    const localDir = process.env.BACKUP_LOCAL_DIR;

    if (localDir) {
      await fs.promises.mkdir(localDir, { recursive: true });
      const dirEntries = await fs.promises.readdir(localDir);
      return dirEntries.map((e) => parseEntryNumber(e)).filter((n): n is number => n !== null);
    }

    const backupBucket = process.env.R2_BACKUP_BUCKET!;
    const listResponse = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: backupBucket,
        Delimiter: '/',
      }),
    );

    const prefixes = listResponse.CommonPrefixes ?? [];
    return prefixes
      .map((p) => parseEntryNumber(p.Prefix?.replace('/', '') ?? ''))
      .filter((n): n is number => n !== null);
  }

  private async backupDatabase(entryPrefix: string): Promise<void> {
    const localDir = process.env.BACKUP_LOCAL_DIR;

    if (localDir) {
      const entryDir = path.join(localDir, entryPrefix);
      await fs.promises.mkdir(entryDir, { recursive: true });
      await fs.promises.writeFile(path.join(entryDir, 'db.dump'), '');
      console.log(`💾 [local] Database stub created: ${entryDir}/db.dump`);
      return;
    }

    const backupBucket = process.env.R2_BACKUP_BUCKET!;
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    const tmpPath = `/tmp/draco-db-${entryPrefix}.dump`;

    try {
      await this.runProcess('pg_dump', ['--format=custom', `--file=${tmpPath}`, databaseUrl]);
      console.log(`💾 Database dump created: ${tmpPath}`);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: backupBucket,
          Key: `${entryPrefix}/db.dump`,
          Body: fs.createReadStream(tmpPath),
          ContentType: 'application/octet-stream',
        }),
      );

      console.log(`💾 Database backup uploaded: ${entryPrefix}/db.dump`);
    } finally {
      await fs.promises.unlink(tmpPath).catch(() => {});
    }
  }

  private async backupUploads(entryPrefix: string): Promise<void> {
    const localDir = process.env.BACKUP_LOCAL_DIR;

    if (localDir) {
      const entryDir = path.join(localDir, entryPrefix);
      await fs.promises.mkdir(entryDir, { recursive: true });
      await fs.promises.writeFile(path.join(entryDir, 'uploads-skipped.txt'), '');
      console.log(`💾 [local] Uploads skipped (local mode): ${entryDir}/uploads-skipped.txt`);
      return;
    }

    const sourceBucket = process.env.R2_BUCKET;
    const backupBucket = process.env.R2_BACKUP_BUCKET!;

    if (!sourceBucket) {
      throw new Error('R2_BUCKET is not set');
    }

    let continuationToken: string | undefined;
    let totalCopied = 0;

    do {
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: sourceBucket,
          ContinuationToken: continuationToken,
        }),
      );

      const objects = listResponse.Contents ?? [];

      await Promise.all(
        objects.map((obj) =>
          this.s3Client.send(
            new CopyObjectCommand({
              CopySource: `${sourceBucket}/${obj.Key}`,
              Bucket: backupBucket,
              Key: `${entryPrefix}/uploads/${obj.Key}`,
            }),
          ),
        ),
      );

      totalCopied += objects.length;
      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    console.log(
      `💾 Uploads backup complete: ${totalCopied} files copied to ${entryPrefix}/uploads/`,
    );
  }

  public async applyRetentionPolicy(): Promise<void> {
    const localDir = process.env.BACKUP_LOCAL_DIR;

    if (localDir) {
      const dirEntries = await fs.promises.readdir(localDir);
      const entryMap = new Map<number, string>();
      for (const entry of dirEntries) {
        const num = parseEntryNumber(entry);
        if (num !== null) entryMap.set(num, entry);
      }

      const keepSet = computeKeepSet([...entryMap.keys()]);
      const toDrop = [...entryMap.entries()].filter(([num]) => !keepSet.has(num));

      for (const [, entry] of toDrop) {
        await fs.promises.rm(path.join(localDir, entry), { recursive: true });
      }

      if (toDrop.length > 0) {
        console.log(
          `💾 Retention: removed ${toDrop.length} old backup(s): ${toDrop.map(([, e]) => e).join(', ')}`,
        );
      }
      return;
    }

    const backupBucket = process.env.R2_BACKUP_BUCKET!;

    const listResponse = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: backupBucket,
        Delimiter: '/',
      }),
    );

    const prefixes = listResponse.CommonPrefixes ?? [];
    const entryMap = new Map<number, string>();
    for (const prefix of prefixes) {
      const entry = prefix.Prefix?.replace('/', '') ?? '';
      const num = parseEntryNumber(entry);
      if (num !== null) entryMap.set(num, entry);
    }

    const keepSet = computeKeepSet([...entryMap.keys()]);
    const toDrop = [...entryMap.entries()].filter(([num]) => !keepSet.has(num));

    for (const [, entry] of toDrop) {
      await this.deleteBackupEntry(entry, backupBucket);
    }

    if (toDrop.length > 0) {
      console.log(
        `💾 Retention: removed ${toDrop.length} old backup(s): ${toDrop.map(([, e]) => e).join(', ')}`,
      );
    }
  }

  private async deleteBackupEntry(entryPrefix: string, bucket: string): Promise<void> {
    let continuationToken: string | undefined;

    do {
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `${entryPrefix}/`,
          ContinuationToken: continuationToken,
        }),
      );

      const objects = listResponse.Contents ?? [];
      await Promise.all(
        objects.map((obj) =>
          this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: obj.Key!,
            }),
          ),
        ),
      );

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);
  }

  private runProcess(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args);
      const stderr: string[] = [];

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr.push(chunk.toString());
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${command} exited with code ${code}: ${stderr.join('')}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to start ${command}: ${err.message}`));
      });
    });
  }
}
