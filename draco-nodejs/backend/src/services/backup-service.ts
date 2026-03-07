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

export class BackupService {
  private backupInterval: NodeJS.Timeout | null = null;
  private readonly backupHour = 3;
  private readonly DAY_MS = 24 * 60 * 60 * 1000;
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  public start(): void {
    if (!process.env.R2_BACKUP_BUCKET && !process.env.BACKUP_LOCAL_DIR) {
      console.warn(
        '⚠️ Backup service disabled: neither R2_BACKUP_BUCKET nor BACKUP_LOCAL_DIR is set',
      );
      return;
    }

    if (this.backupInterval) {
      this.stop();
    }

    this.backupInterval = setInterval(() => {}, 1000);

    const now = new Date();
    const nextBackup = new Date();
    nextBackup.setHours(this.backupHour, 0, 0, 0);
    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }

    const initialDelay = nextBackup.getTime() - now.getTime();

    setTimeout(() => {
      if (this.backupInterval) {
        clearInterval(this.backupInterval);
      }

      const runBackup = () => {
        this.performBackup().catch(console.error);
      };

      runBackup();
      this.backupInterval = setInterval(runBackup, this.DAY_MS);
    }, initialDelay);

    console.log(
      `💾 Backup service started. First backup scheduled for ${nextBackup.toISOString()}`,
    );
  }

  public stop(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
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

    await this.runProcess('pg_dump', ['--format=custom', `--file=${tmpPath}`, databaseUrl]);

    console.log(`💾 Database dump created: ${tmpPath}`);

    const fileBuffer = await fs.promises.readFile(tmpPath);
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: backupBucket,
        Key: `${entryPrefix}/db.dump`,
        Body: fileBuffer,
        ContentType: 'application/octet-stream',
      }),
    );

    await fs.promises.unlink(tmpPath);
    console.log(`💾 Database backup uploaded: ${entryPrefix}/db.dump`);
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
        fs.rmSync(path.join(localDir, entry), { recursive: true });
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
