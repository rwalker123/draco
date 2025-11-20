#!/usr/bin/env tsx

/**
 * File Migration Script for Draco Sports Manager
 *
 * This script downloads files from the old FTP server and uploads them
 * to the new storage provider using the existing StorageService.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Client as FTPClient, type AccessOptions, type FileInfo as FtpFileInfo } from 'basic-ftp';
// PrismaClient will be imported dynamically from the backend
import * as dotenv from 'dotenv';
import sharp from 'sharp';

// Load environment variables, preferring migration overrides before backend defaults
const migrationEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(migrationEnvPath)) {
  dotenv.config({ path: migrationEnvPath, quiet: true });
}

const backendEnvPath = path.join(__dirname, '../draco-nodejs/backend/.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath, quiet: true });
}

// Types for our migration
interface CategoryStats {
  downloaded: number;
  uploaded: number;
  skipped: number;
  errors: number;
}

interface MigrationStats {
  accountLogos: CategoryStats;
  teamLogos: CategoryStats;
  contactPhotos: CategoryStats;
  sponsorLogos: CategoryStats;
  handouts: CategoryStats;
  galleryPhotos: CategoryStats;
  whereHeardOptions: CategoryStats;
  messageBoards: CategoryStats;
}

const GALLERY_PRIMARY_DIMENSIONS = { width: 800, height: 450 } as const;
const GALLERY_THUMBNAIL_DIMENSIONS = { width: 160, height: 90 } as const;
const EXTENSION_FORMAT_MAP: Record<string, 'jpeg' | 'png' | 'webp'> = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.webp': 'webp',
};

const matchesTargetDimensions = (
  metadata: sharp.Metadata | null | undefined,
  dimensions: { width: number; height: number },
) => {
  if (!metadata?.width || !metadata?.height) {
    return false;
  }
  return metadata.width === dimensions.width && metadata.height === dimensions.height;
};

interface FileInfo {
  remotePath: string;
  localPath: string;
  fileName: string;
}

interface FileMigrationOptions {
  testMode?: boolean;
  testAccounts?: number;
  testTeams?: number;
  testContacts?: number;
  testFilesPerDirectory?: number;
}

interface TestLimits {
  accounts: number;
  teams: number;
  contacts: number;
  filesPerDirectory: number;
}

type DbAccountHandoutRecord = {
  id: bigint;
  description: string;
  filename: string;
  accountid: bigint;
};

type DbTeamHandoutRecord = {
  id: bigint;
  description: string;
  filename: string;
  teamid: bigint;
};

class FileMigrationService {
  private prisma: any; // Will import dynamically
  private storageService: any; // Will import dynamically
  private ftpClient: FTPClient;
  private ftpConfig: AccessOptions | null = null;
  private tempDir: string;
  private stats: MigrationStats;
  private teamToAccountMap: Map<string, string> = new Map();
  private contactToAccountMap: Map<string, string> = new Map();
  private readonly maxFtpRetries: number;
  private readonly ftpRetryDelayMs: number;
  private progressFilePath: string;
  private processedFiles: Set<string> = new Set();
  private failedFiles: Set<string> = new Set();
  private readonly isTestMode: boolean;
  private readonly testLimits: TestLimits;

  constructor(options: FileMigrationOptions = {}) {
    this.ftpClient = new FTPClient();
    this.tempDir = path.join(process.cwd(), 'temp-migration');
    this.stats = {
      accountLogos: this.createEmptyStats(),
      teamLogos: this.createEmptyStats(),
      contactPhotos: this.createEmptyStats(),
      sponsorLogos: this.createEmptyStats(),
      handouts: this.createEmptyStats(),
      galleryPhotos: this.createEmptyStats(),
      whereHeardOptions: this.createEmptyStats(),
      messageBoards: this.createEmptyStats(),
    };

    const resolveBooleanEnv = (raw?: string): boolean | undefined => {
      if (!raw) {
        return undefined;
      }

      const normalized = raw.trim().toLowerCase();

      if (['true', '1', 'yes', 'y'].includes(normalized)) {
        return true;
      }

      if (['false', '0', 'no', 'n'].includes(normalized)) {
        return false;
      }

      return undefined;
    };

    const resolveTestModeFromEnv = (): boolean | undefined => {
      const explicit = resolveBooleanEnv(process.env.MIGRATION_TEST_MODE);
      if (typeof explicit === 'boolean') {
        return explicit;
      }

      const migrationMode = process.env.MIGRATION_MODE?.trim().toLowerCase();
      if (migrationMode === 'test') {
        return true;
      }

      return undefined;
    };

    const parsePositiveInt = (raw: string | number | undefined, fallback: number): number => {
      if (typeof raw === 'number') {
        return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
      }

      if (typeof raw === 'string') {
        const parsed = Number.parseInt(raw, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
      }

      return fallback;
    };

    const defaultSampleLimit = parsePositiveInt(process.env.MIGRATION_TEST_SAMPLE_LIMIT, 2);
    const defaultFileLimit = parsePositiveInt(
      process.env.MIGRATION_TEST_FILES_PER_DIRECTORY,
      defaultSampleLimit,
    );

    this.isTestMode = options.testMode ?? resolveTestModeFromEnv() ?? false;
    this.testLimits = {
      accounts: parsePositiveInt(
        options.testAccounts ?? process.env.MIGRATION_TEST_ACCOUNTS,
        defaultSampleLimit,
      ),
      teams: parsePositiveInt(
        options.testTeams ?? process.env.MIGRATION_TEST_TEAMS,
        defaultSampleLimit,
      ),
      contacts: parsePositiveInt(
        options.testContacts ?? process.env.MIGRATION_TEST_CONTACTS,
        defaultSampleLimit,
      ),
      filesPerDirectory: parsePositiveInt(
        options.testFilesPerDirectory ?? process.env.MIGRATION_TEST_FILES_PER_DIRECTORY,
        defaultFileLimit,
      ),
    };

    if (this.isTestMode) {
      console.log(
        `🧪 Test mode enabled. Limits -> accounts: ${this.testLimits.accounts}, teams: ${this.testLimits.teams}, contacts: ${this.testLimits.contacts}, files per directory: ${this.testLimits.filesPerDirectory}`,
      );
    }

    const retryEnv = Number(process.env.MIGRATION_FTP_MAX_RETRIES);
    this.maxFtpRetries = Number.isFinite(retryEnv) && retryEnv > 0 ? retryEnv : 3;

    const retryDelayEnv = Number(process.env.MIGRATION_FTP_RETRY_DELAY_MS);
    this.ftpRetryDelayMs =
      Number.isFinite(retryDelayEnv) && retryDelayEnv >= 0 ? retryDelayEnv : 2000;
    this.progressFilePath = path.join(__dirname, 'migration-progress.json');

    this.loadProgress();
  }

  private createEmptyStats(): CategoryStats {
    return { downloaded: 0, uploaded: 0, skipped: 0, errors: 0 };
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing file migration service...');

    // Create temp directory
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Import and create Prisma client from backend
    try {
      console.log(`🔍 DATABASE_URL: ${process.env.DATABASE_URL}`);
      const { PrismaClient } = await import('@prisma/client');
      this.prisma = new PrismaClient();
      console.log('✅ Prisma client initialized');
    } catch (error) {
      console.error(
        '❌ Failed to load Prisma client. Make sure Prisma is generated with: cd ../draco-nodejs/backend && npx prisma generate',
      );
      throw error;
    }

    // Import and create storage service
    try {
      const storageModule = await import(
        '../draco-nodejs/backend/dist/src/services/storageService.js'
      );
      this.storageService = storageModule.createStorageService();
      console.log('✅ Storage service initialized');
    } catch (error) {
      console.error(
        '❌ Failed to load storage service. Make sure backend is built with: cd ../draco-nodejs/backend && npm run build',
      );
      throw error;
    }

    // Connect to FTP
    await this.connectToFTP();

    // Build ID mapping
    await this.buildIdMappings();
  }

  private async buildIdMappings(): Promise<void> {
    console.log('🗃️ Building team and contact to account mappings...');

    try {
      // Build team to account mapping
      const teams = await this.prisma.teams.findMany({
        select: {
          id: true,
          accountid: true,
        },
      });

      for (const team of teams) {
        this.teamToAccountMap.set(team.id.toString(), team.accountid.toString());
      }

      console.log(`✅ Mapped ${teams.length} teams to accounts`);

      // Build contact to account mapping
      const contacts = await this.prisma.contacts.findMany({
        select: {
          id: true,
          creatoraccountid: true,
        },
      });

      for (const contact of contacts) {
        this.contactToAccountMap.set(contact.id.toString(), contact.creatoraccountid.toString());
      }

      console.log(`✅ Mapped ${contacts.length} contacts to accounts`);
    } catch (error) {
      console.error('❌ Failed to build ID mappings:', error);
      throw error;
    }
  }

  private async connectToFTP(): Promise<void> {
    const ftpHost = process.env.FTP_HOST;
    const ftpUser = process.env.FTP_USER;
    const ftpPassword = process.env.FTP_PASSWORD;

    if (!ftpHost || !ftpUser || !ftpPassword) {
      throw new Error('FTP credentials not found in environment variables');
    }

    console.log(`🔗 Connecting to FTP server: ${ftpHost}`);

    try {
      const config: AccessOptions = {
        host: ftpHost,
        user: ftpUser,
        password: ftpPassword,
        secure: false, // Adjust if needed
      };
      this.ftpConfig = config;
      await this.ftpClient.access(config);
      console.log('✅ Connected to FTP server');
    } catch (error) {
      console.error('❌ Failed to connect to FTP server:', error);
      throw error;
    }
  }

  private async downloadFile(remotePath: string, localPath: string): Promise<boolean> {
    try {
      // Ensure local directory exists
      const localDir = path.dirname(localPath);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      await this.withFtpRetry(
        () => this.ftpClient.downloadTo(localPath, remotePath),
        `download ${remotePath}`,
      );
      return true;
    } catch (error) {
      console.error(`❌ Failed to download ${remotePath}:`, error);
      this.markFileFailed(remotePath);
      return false;
    }
  }

  private async getFileBuffer(localPath: string): Promise<Buffer | null> {
    try {
      if (!fs.existsSync(localPath)) {
        return null;
      }
      return fs.readFileSync(localPath);
    } catch (error) {
      console.error(`❌ Failed to read file ${localPath}:`, error);
      return null;
    }
  }

  private async cleanupTempFile(localPath: string): Promise<void> {
    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (error) {
      console.error(`⚠️ Failed to cleanup temp file ${localPath}:`, error);
    }
  }

  private loadProgress(): void {
    if (!fs.existsSync(this.progressFilePath)) {
      return;
    }

    try {
      const raw = fs.readFileSync(this.progressFilePath, 'utf-8');
      if (!raw) {
        return;
      }

      const data = JSON.parse(raw) as {
        processedFiles?: unknown;
        failedFiles?: unknown;
      };

      if (Array.isArray(data.processedFiles)) {
        for (const item of data.processedFiles) {
          if (typeof item === 'string') {
            this.processedFiles.add(item);
          }
        }
      }

      if (Array.isArray(data.failedFiles)) {
        for (const item of data.failedFiles) {
          if (typeof item === 'string') {
            this.failedFiles.add(item);
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Failed to load migration progress file:', error);
    }
  }

  private saveProgress(): void {
    try {
      const payload = {
        processedFiles: Array.from(this.processedFiles),
        failedFiles: Array.from(this.failedFiles),
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(this.progressFilePath, JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error('⚠️ Failed to persist migration progress:', error);
    }
  }

  private isFileAlreadyProcessed(remotePath: string): boolean {
    return this.processedFiles.has(remotePath);
  }

  private markFileProcessed(remotePath: string): void {
    if (!this.processedFiles.has(remotePath)) {
      this.processedFiles.add(remotePath);
      this.failedFiles.delete(remotePath);
      this.saveProgress();
    }
  }

  private markFileFailed(remotePath: string): void {
    this.failedFiles.add(remotePath);
    this.saveProgress();
  }

  private parseBigIntId(value: string, context: string): bigint | null {
    try {
      return BigInt(value);
    } catch (error) {
      console.error(`❌ Unable to parse ${context} as bigint: ${value}`);
      return null;
    }
  }

  private async delay(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private isRecoverableFtpError(error: unknown): error is NodeJS.ErrnoException {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const err = error as NodeJS.ErrnoException & { message?: string };
    const message = (err.message ?? '').toLowerCase();
    const code = err.code ?? '';

    return (
      code === 'ETIMEDOUT' ||
      code === 'ECONNRESET' ||
      code === 'EPIPE' ||
      code === 'ECONNABORTED' ||
      message.includes('client is closed') ||
      message.includes('socket') ||
      message.includes('timed out')
    );
  }

  private async reconnectToFTP(): Promise<void> {
    if (!this.ftpConfig) {
      throw new Error('Missing FTP configuration for reconnection');
    }

    try {
      this.ftpClient.close();
    } catch (error) {
      console.warn('⚠️ Error while closing FTP client during reconnect:', error);
    }

    this.ftpClient = new FTPClient();
    console.log('🔁 Attempting to reconnect to FTP server...');
    await this.ftpClient.access(this.ftpConfig);
    console.log('✅ Reconnected to FTP server');
  }

  private async withFtpRetry<T>(operation: () => Promise<T>, description: string): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt += 1;

        if (!this.isRecoverableFtpError(error) || attempt > this.maxFtpRetries) {
          throw error;
        }

        console.warn(
          `⚠️ FTP ${description} failed (attempt ${attempt} of ${this.maxFtpRetries}). Retrying...`,
        );

        try {
          await this.reconnectToFTP();
        } catch (reconnectError) {
          console.error('❌ Failed to reconnect to FTP server:', reconnectError);
          throw error;
        }

        await this.delay(this.ftpRetryDelayMs);
      }
    }
  }

  private async listDirectory(remotePath: string): Promise<FtpFileInfo[]> {
    return this.withFtpRetry(() => this.ftpClient.list(remotePath), `list ${remotePath}`);
  }

  async migrateAccountAssets(): Promise<void> {
    console.log('📁 Migrating account assets from /Uploads/Accounts...');

    try {
      const accountDirs = await this.listDirectory('/Uploads/Accounts');
      let processedAccounts = 0;

      for (const dir of accountDirs) {
        if (!dir.isDirectory) {
          continue;
        }

        const accountId = dir.name;
        if (!accountId || accountId === '.' || accountId === '..') {
          continue;
        }

        if (this.isTestMode && processedAccounts >= this.testLimits.accounts) {
          console.log(
            '🧪 Test mode: reached account directory limit, skipping remaining accounts.',
          );
          break;
        }

        processedAccounts += 1;

        console.log(`📂 Processing account ${accountId}...`);

        try {
          await this.processAccountDirectory(accountId);
        } catch (error) {
          console.error(`❌ Error processing account ${accountId}:`, error);
          this.stats.accountLogos.errors++;
        }
      }
    } catch (error) {
      console.error('❌ Error migrating account assets:', error);
    }
  }

  private async processAccountDirectory(accountId: string): Promise<void> {
    const accountBasePath = `/Uploads/Accounts/${accountId}`;
    const entries = await this.listDirectory(accountBasePath);
    let rootFileCount = 0;

    for (const entry of entries) {
      if (entry.isDirectory) {
        const dirName = entry.name;
        const normalizedDirName = dirName.toLowerCase();
        const remoteDirPath = `${accountBasePath}/${dirName}`;

        switch (normalizedDirName) {
          case 'logo':
            await this.processAccountLogoDirectory(accountId, remoteDirPath);
            break;
          case 'handouts':
            await this.processAccountHandouts(accountId, remoteDirPath);
            break;
          case 'photogallery':
            await this.processAccountPhotoGallery(accountId, remoteDirPath);
            break;
          case 'sponsors':
            await this.processAccountSponsors(accountId, remoteDirPath);
            break;
          default:
            console.log(
              `ℹ️ Unhandled subdirectory for account ${accountId}: ${dirName}. Skipping for now.`,
            );
            break;
        }
      } else if (entry.isFile) {
        if (this.isTestMode && rootFileCount >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached root file limit for account ${accountId}, skipping remaining files.`,
          );
          break;
        }

        rootFileCount += 1;

        const fileName = entry.name;
        const normalizedFileName = fileName.toLowerCase();
        const remoteFilePath = `${accountBasePath}/${fileName}`;

        if (normalizedFileName === 'whereheardoptions.xml') {
          await this.processWhereHeardOptions(accountId, remoteFilePath);
        } else if (normalizedFileName === 'messageboard.xml') {
          await this.processMessageBoard(accountId, remoteFilePath);
        } else if (this.isImageFile(fileName)) {
          await this.processLegacyAccountLogo(accountId, remoteFilePath);
        } else {
          console.log(`ℹ️ Skipping unrecognized account file for ${accountId}: ${fileName}.`);
        }
      }
    }
  }

  private async processAccountLogoDirectory(
    accountId: string,
    remoteDirPath: string,
  ): Promise<void> {
    try {
      const logoFiles = await this.listDirectory(remoteDirPath);
      let processedFiles = 0;
      let uploadedPrimaryLogo = false;

      for (const file of logoFiles) {
        if (!file.isFile) {
          continue;
        }

        if (this.isTestMode && processedFiles >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached logo file limit for account ${accountId}, skipping remaining logo files.`,
          );
          break;
        }

        processedFiles += 1;

        const remotePath = `${remoteDirPath}/${file.name}`;
        const localPath = path.join(this.tempDir, 'accounts', accountId, 'Logo', file.name);

        console.log(`⬇️ Downloading account logo asset: ${accountId}/Logo/${file.name}`);

        if (this.isFileAlreadyProcessed(remotePath)) {
          console.log(`⏭️ Account logo asset already migrated: ${remotePath}`);
          this.stats.accountLogos.skipped++;
          continue;
        }

        if (!(await this.downloadFile(remotePath, localPath))) {
          this.stats.accountLogos.errors++;
          continue;
        }

        this.stats.accountLogos.downloaded++;

        const buffer = await this.getFileBuffer(localPath);
        const normalizedName = file.name.toLowerCase();
        const isSmallVariant = normalizedName.includes('small') || normalizedName.includes('thumb');

        if (!buffer) {
          this.stats.accountLogos.errors++;
          await this.cleanupTempFile(localPath);
          continue;
        }

        if (isSmallVariant) {
          console.log(
            `📝 Small account logo detected for account ${accountId}; upload not implemented yet.`,
          );
          this.stats.accountLogos.skipped++;
          this.markFileProcessed(remotePath);
        } else if (!uploadedPrimaryLogo) {
          try {
            await this.storageService.saveAccountLogo(accountId, buffer);
            console.log(`✅ Uploaded primary account logo for account ${accountId}`);
            this.stats.accountLogos.uploaded++;
            this.markFileProcessed(remotePath);
            uploadedPrimaryLogo = true;
          } catch (error) {
            console.error(`❌ Failed to upload account logo for ${accountId}:`, error);
            this.stats.accountLogos.errors++;
            this.markFileFailed(remotePath);
          }
        } else {
          console.log(
            `📝 Additional account logo variant found for account ${accountId}; retaining for future processing.`,
          );
          this.stats.accountLogos.skipped++;
          this.markFileProcessed(remotePath);
        }

        await this.cleanupTempFile(localPath);
      }
    } catch (error) {
      console.error(`❌ Error processing logo directory for account ${accountId}:`, error);
      this.stats.accountLogos.errors++;
    }
  }

  private async processAccountHandouts(accountId: string, remoteDirPath: string): Promise<void> {
    try {
      const accountIdBigInt = this.parseBigIntId(
        accountId,
        `account handouts (account ${accountId})`,
      );
      if (accountIdBigInt === null) {
        this.stats.handouts.errors++;
        return;
      }

      const dbHandouts = (await this.prisma.accounthandouts.findMany({
        where: { accountid: accountIdBigInt },
      })) as DbAccountHandoutRecord[];

      if (dbHandouts.length === 0) {
        console.log(
          `⚠️ Found handout files for account ${accountId}, but no accounthandouts records exist in the database.`,
        );
      }

      const usedHandoutIds = new Set<bigint>();
      const normalizeName = (name: string) => name.trim().toLowerCase();

      const pickLatestRecord = (records: DbAccountHandoutRecord[]): DbAccountHandoutRecord => {
        let latest = records[0];
        for (const record of records) {
          if (record.id > latest.id) {
            latest = record;
          }
        }
        return latest;
      };

      const findMatchingHandoutRecord = (fileName: string): DbAccountHandoutRecord | null => {
        const availableExactMatches = dbHandouts.filter(
          (record) => record.filename === fileName && !usedHandoutIds.has(record.id),
        );

        if (availableExactMatches.length > 0) {
          if (availableExactMatches.length > 1) {
            console.warn(
              `⚠️ Multiple account handout rows match filename "${fileName}" for account ${accountId}. Using the most recent record.`,
            );
          }
          return pickLatestRecord(availableExactMatches);
        }

        const normalizedTarget = normalizeName(fileName);
        const availableNormalizedMatches = dbHandouts.filter(
          (record) =>
            normalizeName(record.filename) === normalizedTarget && !usedHandoutIds.has(record.id),
        );

        if (availableNormalizedMatches.length > 0) {
          if (availableNormalizedMatches.length > 1) {
            console.warn(
              `⚠️ Multiple account handout rows match filename "${fileName}" (case-insensitive) for account ${accountId}. Using the most recent record.`,
            );
          }
          return pickLatestRecord(availableNormalizedMatches);
        }

        return null;
      };

      const handoutFiles = await this.listDirectory(remoteDirPath);
      let processedFiles = 0;

      for (const file of handoutFiles) {
        if (!file.isFile) {
          console.log(
            `ℹ️ Nested directory found under Handouts for account ${accountId}: ${file.name}. Skipping.`,
          );
          continue;
        }

        if (this.isTestMode && processedFiles >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached handout file limit for account ${accountId}, skipping remaining handouts.`,
          );
          break;
        }

        processedFiles += 1;

        const remotePath = `${remoteDirPath}/${file.name}`;
        const localPath = path.join(this.tempDir, 'accounts', accountId, 'Handouts', file.name);

        const matchingRecord = findMatchingHandoutRecord(file.name);

        if (!matchingRecord) {
          console.warn(
            `⚠️ No database handout record found for account ${accountId} matching file "${file.name}". Skipping upload.`,
          );
          this.stats.handouts.skipped++;
          this.markFileFailed(remotePath);
          continue;
        }

        const handoutId = matchingRecord.id.toString();
        const storageFileName = matchingRecord.filename;

        if (this.isFileAlreadyProcessed(remotePath)) {
          try {
            const existing = await this.storageService.getHandout(
              accountId,
              handoutId,
              storageFileName,
            );

            if (existing) {
              console.log(
                `⏭️ Account handout already migrated for account ${accountId}, handout ${handoutId} (${storageFileName}).`,
              );
              this.stats.handouts.skipped++;
              usedHandoutIds.add(matchingRecord.id);
              continue;
            }

            console.log(
              `🔁 Handout ${remotePath} was previously marked as migrated but is missing from storage. Reprocessing.`,
            );
            this.processedFiles.delete(remotePath);
          } catch (error) {
            console.warn(
              `⚠️ Unable to verify existing handout for account ${accountId}, handout ${handoutId}. Proceeding with upload.`,
            );
          }
        }

        console.log(`⬇️ Downloading handout for account ${accountId}: ${file.name}`);

        if (!(await this.downloadFile(remotePath, localPath))) {
          this.stats.handouts.errors++;
          continue;
        }

        this.stats.handouts.downloaded++;

        const buffer = await this.getFileBuffer(localPath);
        if (!buffer) {
          this.stats.handouts.errors++;
          await this.cleanupTempFile(localPath);
          continue;
        }

        try {
          await this.storageService.saveHandout(accountId, handoutId, storageFileName, buffer);
          console.log(
            `✅ Uploaded account handout ${storageFileName} (ID ${handoutId}) for account ${accountId}`,
          );
          this.stats.handouts.uploaded++;
          this.markFileProcessed(remotePath);
          usedHandoutIds.add(matchingRecord.id);
        } catch (error) {
          console.error(
            `❌ Failed to upload account handout ${storageFileName} (ID ${handoutId}) for account ${accountId}:`,
            error,
          );
          this.stats.handouts.errors++;
          this.markFileFailed(remotePath);
        } finally {
          await this.cleanupTempFile(localPath);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing handouts for account ${accountId}:`, error);
      this.stats.handouts.errors++;
    }
  }

  private async processAccountPhotoGallery(
    accountId: string,
    remoteDirPath: string,
  ): Promise<void> {
    try {
      const galleryDirs = await this.listDirectory(remoteDirPath);
      let processedGalleries = 0;

      for (const galleryDir of galleryDirs) {
        if (!galleryDir.isDirectory) {
          continue;
        }

        if (this.isTestMode && processedGalleries >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached gallery folder limit for account ${accountId}, skipping remaining galleries.`,
          );
          break;
        }

        processedGalleries += 1;

        const galleryId = galleryDir.name;
        const galleryPath = `${remoteDirPath}/${galleryId}`;
        const galleryFiles = await this.listDirectory(galleryPath);
        const originalFile = this.findGalleryOriginalFile(galleryFiles);
        if (!originalFile) {
          console.log(
            `⚠️ No PhotoGallery original found for account ${accountId}, gallery ${galleryId}. Skipping.`,
          );
          this.stats.galleryPhotos.skipped++;
          continue;
        }

        const thumbnailFile = this.findGalleryThumbnailFile(galleryFiles);

        await this.migrateGalleryPhoto({
          accountId,
          galleryId,
          ownerSegments: ['accounts', accountId, 'PhotoGallery', galleryId],
          remoteOriginalPath: `${galleryPath}/${originalFile.name}`,
          remoteThumbnailPath: thumbnailFile ? `${galleryPath}/${thumbnailFile.name}` : undefined,
        });
      }
    } catch (error) {
      console.error(`❌ Error processing photo gallery for account ${accountId}:`, error);
      this.stats.galleryPhotos.errors++;
    }
  }

  private async processAccountSponsors(accountId: string, remoteDirPath: string): Promise<void> {
    try {
      const sponsorDirs = await this.listDirectory(remoteDirPath);
      let processedSponsors = 0;

      for (const sponsorDir of sponsorDirs) {
        if (!sponsorDir.isDirectory) {
          continue;
        }

        if (this.isTestMode && processedSponsors >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached sponsor directory limit for account ${accountId}, skipping remaining sponsors.`,
          );
          break;
        }

        processedSponsors += 1;

        const sponsorId = sponsorDir.name;
        const sponsorPath = `${remoteDirPath}/${sponsorId}`;
        const sponsorFiles = await this.listDirectory(sponsorPath);
        let processedFiles = 0;

        for (const file of sponsorFiles) {
          if (!file.isFile || !this.isImageFile(file.name)) {
            continue;
          }

          if (this.isTestMode && processedFiles >= this.testLimits.filesPerDirectory) {
            console.log(
              `🧪 Test mode: reached sponsor logo limit for sponsor ${sponsorId}, skipping remaining files.`,
            );
            break;
          }

          processedFiles += 1;

          const remotePath = `${sponsorPath}/${file.name}`;
          const localPath = path.join(
            this.tempDir,
            'accounts',
            accountId,
            'Sponsors',
            sponsorId,
            file.name,
          );

          console.log(
            `⬇️ Downloading sponsor logo for account ${accountId}, sponsor ${sponsorId}: ${file.name}`,
          );

          if (this.isFileAlreadyProcessed(remotePath)) {
            console.log(`⏭️ Sponsor logo already migrated: ${remotePath}`);
            this.stats.sponsorLogos.skipped++;
            continue;
          }

          if (!(await this.downloadFile(remotePath, localPath))) {
            this.stats.sponsorLogos.errors++;
            continue;
          }

          this.stats.sponsorLogos.downloaded++;

          const buffer = await this.getFileBuffer(localPath);
          if (!buffer) {
            this.stats.sponsorLogos.errors++;
            await this.cleanupTempFile(localPath);
            continue;
          }

          try {
            await this.storageService.saveSponsorPhoto(accountId, sponsorId, buffer);
            console.log(`✅ Uploaded sponsor logo for account ${accountId}, sponsor ${sponsorId}`);
            this.stats.sponsorLogos.uploaded++;
            this.markFileProcessed(remotePath);
          } catch (error) {
            console.error(
              `❌ Failed to upload sponsor logo for account ${accountId}/${sponsorId}:`,
              error,
            );
            this.stats.sponsorLogos.errors++;
            this.markFileFailed(remotePath);
          }

          await this.cleanupTempFile(localPath);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing sponsors for account ${accountId}:`, error);
      this.stats.sponsorLogos.errors++;
    }
  }

  private async processTeamDirectory(teamId: string, accountId: string): Promise<void> {
    const teamBasePath = `/Uploads/Teams/${teamId}`;
    const entries = await this.listDirectory(teamBasePath);
    let rootFileCount = 0;

    for (const entry of entries) {
      if (entry.isDirectory) {
        const dirName = entry.name;
        const normalizedDirName = dirName.toLowerCase();
        const remoteDirPath = `${teamBasePath}/${dirName}`;

        switch (normalizedDirName) {
          case 'logo':
            await this.processTeamLogoDirectory(teamId, accountId, remoteDirPath);
            break;
          case 'handouts':
            await this.processTeamHandouts(teamId, remoteDirPath);
            break;
          case 'photogallery':
            await this.processTeamPhotoGallery(teamId, remoteDirPath);
            break;
          case 'sponsors':
            await this.processTeamSponsors(teamId, accountId, remoteDirPath);
            break;
          default:
            console.log(
              `ℹ️ Unhandled subdirectory for team ${teamId}: ${dirName}. Skipping for now.`,
            );
            break;
        }
      } else if (entry.isFile) {
        if (this.isTestMode && rootFileCount >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached root file limit for team ${teamId}, skipping remaining files.`,
          );
          break;
        }

        rootFileCount += 1;

        const fileName = entry.name;
        const normalizedFileName = fileName.toLowerCase();
        const remoteFilePath = `${teamBasePath}/${fileName}`;

        if (this.isImageFile(fileName)) {
          await this.processTeamLegacyLogo(teamId, accountId, remoteFilePath);
        } else {
          console.log(`ℹ️ Skipping unrecognized team file for ${teamId}: ${fileName}.`);
        }
      }
    }
  }

  private async processTeamLogoDirectory(
    teamId: string,
    accountId: string,
    remoteDirPath: string,
  ): Promise<void> {
    try {
      const logoFiles = await this.listDirectory(remoteDirPath);
      let processedFiles = 0;
      let uploadedPrimaryLogo = false;

      for (const file of logoFiles) {
        if (!file.isFile) {
          continue;
        }

        if (this.isTestMode && processedFiles >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached logo file limit for team ${teamId}, skipping remaining logo files.`,
          );
          break;
        }

        processedFiles += 1;

        const remotePath = `${remoteDirPath}/${file.name}`;
        const localPath = path.join(this.tempDir, 'teams', teamId, 'Logo', file.name);

        console.log(`⬇️ Downloading team logo asset: ${teamId}/Logo/${file.name}`);

        if (this.isFileAlreadyProcessed(remotePath)) {
          console.log(`⏭️ Team logo asset already migrated: ${remotePath}`);
          this.stats.teamLogos.skipped++;
          continue;
        }

        if (!(await this.downloadFile(remotePath, localPath))) {
          this.stats.teamLogos.errors++;
          continue;
        }

        this.stats.teamLogos.downloaded++;

        const buffer = await this.getFileBuffer(localPath);
        const normalizedName = file.name.toLowerCase();
        const isSmallVariant = normalizedName.includes('small') || normalizedName.includes('thumb');

        if (!buffer) {
          this.stats.teamLogos.errors++;
          await this.cleanupTempFile(localPath);
          continue;
        }

        if (isSmallVariant) {
          console.log(
            `📝 Small team logo detected for team ${teamId}; upload not implemented yet.`,
          );
          this.stats.teamLogos.skipped++;
          this.markFileProcessed(remotePath);
        } else if (!uploadedPrimaryLogo) {
          try {
            await this.storageService.saveLogo(accountId, teamId, buffer);
            console.log(`✅ Uploaded primary team logo for account ${accountId}, team ${teamId}`);
            this.stats.teamLogos.uploaded++;
            this.markFileProcessed(remotePath);
            uploadedPrimaryLogo = true;
          } catch (error) {
            console.error(`❌ Failed to upload team logo for ${accountId}/${teamId}:`, error);
            this.stats.teamLogos.errors++;
            this.markFileFailed(remotePath);
          }
        } else {
          console.log(
            `📝 Additional team logo variant found for team ${teamId}; retaining for future processing.`,
          );
          this.stats.teamLogos.skipped++;
          this.markFileProcessed(remotePath);
        }

        await this.cleanupTempFile(localPath);
      }
    } catch (error) {
      console.error(`❌ Error processing logo directory for team ${teamId}:`, error);
      this.stats.teamLogos.errors++;
    }
  }

  private async processTeamHandouts(teamId: string, remoteDirPath: string): Promise<void> {
    try {
      const accountId = this.teamToAccountMap.get(teamId);
      if (!accountId) {
        console.warn(
          `⚠️ Unable to determine account for team ${teamId} while migrating team handouts.`,
        );
        this.stats.handouts.errors++;
        return;
      }

      const teamIdBigInt = this.parseBigIntId(teamId, `team handouts (team ${teamId})`);
      if (teamIdBigInt === null) {
        this.stats.handouts.errors++;
        return;
      }

      const dbHandouts = (await this.prisma.teamhandouts.findMany({
        where: { teamid: teamIdBigInt },
      })) as DbTeamHandoutRecord[];

      if (dbHandouts.length === 0) {
        console.log(
          `⚠️ Found handout files for team ${teamId}, but no teamhandouts records exist in the database.`,
        );
      }

      const usedHandoutIds = new Set<bigint>();
      const normalizeName = (name: string) => name.trim().toLowerCase();

      const pickLatestRecord = (records: DbTeamHandoutRecord[]): DbTeamHandoutRecord => {
        let latest = records[0];
        for (const record of records) {
          if (record.id > latest.id) {
            latest = record;
          }
        }
        return latest;
      };

      const findMatchingHandoutRecord = (fileName: string): DbTeamHandoutRecord | null => {
        const exactMatches = dbHandouts.filter(
          (record) => record.filename === fileName && !usedHandoutIds.has(record.id),
        );

        if (exactMatches.length > 0) {
          if (exactMatches.length > 1) {
            console.warn(
              `⚠️ Multiple team handout rows match filename "${fileName}" for team ${teamId}. Using the most recent record.`,
            );
          }
          return pickLatestRecord(exactMatches);
        }

        const normalizedTarget = normalizeName(fileName);
        const normalizedMatches = dbHandouts.filter(
          (record) =>
            normalizeName(record.filename) === normalizedTarget && !usedHandoutIds.has(record.id),
        );

        if (normalizedMatches.length > 0) {
          if (normalizedMatches.length > 1) {
            console.warn(
              `⚠️ Multiple team handout rows match filename "${fileName}" (case-insensitive) for team ${teamId}. Using the most recent record.`,
            );
          }
          return pickLatestRecord(normalizedMatches);
        }

        return null;
      };

      const handoutFiles = await this.listDirectory(remoteDirPath);
      let processedFiles = 0;

      for (const file of handoutFiles) {
        if (!file.isFile) {
          console.log(
            `ℹ️ Nested directory found under Handouts for team ${teamId}: ${file.name}. Skipping.`,
          );
          continue;
        }

        if (this.isTestMode && processedFiles >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached handout file limit for team ${teamId}, skipping remaining handouts.`,
          );
          break;
        }

        processedFiles += 1;

        const remotePath = `${remoteDirPath}/${file.name}`;
        const localPath = path.join(this.tempDir, 'teams', teamId, 'Handouts', file.name);

        const matchingRecord = findMatchingHandoutRecord(file.name);

        if (!matchingRecord) {
          console.warn(
            `⚠️ No database handout record found for team ${teamId} matching file "${file.name}". Skipping upload.`,
          );
          this.stats.handouts.skipped++;
          this.markFileFailed(remotePath);
          continue;
        }

        const handoutId = matchingRecord.id.toString();
        const storageFileName = matchingRecord.filename;

        if (this.isFileAlreadyProcessed(remotePath)) {
          try {
            const existing = await this.storageService.getHandout(
              accountId,
              handoutId,
              storageFileName,
              teamId,
            );

            if (existing) {
              console.log(
                `⏭️ Team handout already migrated for account ${accountId}, team ${teamId}, handout ${handoutId} (${storageFileName}).`,
              );
              this.stats.handouts.skipped++;
              usedHandoutIds.add(matchingRecord.id);
              continue;
            }

            console.log(
              `🔁 Handout ${remotePath} was previously marked as migrated but is missing from storage. Reprocessing.`,
            );
            this.processedFiles.delete(remotePath);
          } catch (error) {
            console.warn(
              `⚠️ Unable to verify existing team handout for team ${teamId}, handout ${handoutId}. Proceeding with upload.`,
            );
          }
        }

        console.log(`⬇️ Downloading handout for team ${teamId}: ${file.name}`);

        if (!(await this.downloadFile(remotePath, localPath))) {
          this.stats.handouts.errors++;
          continue;
        }

        this.stats.handouts.downloaded++;

        const buffer = await this.getFileBuffer(localPath);
        if (!buffer) {
          this.stats.handouts.errors++;
          await this.cleanupTempFile(localPath);
          continue;
        }

        try {
          await this.storageService.saveHandout(
            accountId,
            handoutId,
            storageFileName,
            buffer,
            teamId,
          );
          console.log(
            `✅ Uploaded team handout ${storageFileName} (ID ${handoutId}) for account ${accountId}, team ${teamId}`,
          );
          this.stats.handouts.uploaded++;
          this.markFileProcessed(remotePath);
          usedHandoutIds.add(matchingRecord.id);
        } catch (error) {
          console.error(
            `❌ Failed to upload team handout ${storageFileName} (ID ${handoutId}) for account ${accountId}, team ${teamId}:`,
            error,
          );
          this.stats.handouts.errors++;
          this.markFileFailed(remotePath);
        } finally {
          await this.cleanupTempFile(localPath);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing handouts for team ${teamId}:`, error);
      this.stats.handouts.errors++;
    }
  }

  private async processTeamPhotoGallery(teamId: string, remoteDirPath: string): Promise<void> {
    try {
      const galleryDirs = await this.listDirectory(remoteDirPath);
      let processedGalleries = 0;

      for (const galleryDir of galleryDirs) {
        if (!galleryDir.isDirectory) {
          continue;
        }

        if (this.isTestMode && processedGalleries >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached gallery folder limit for team ${teamId}, skipping remaining galleries.`,
          );
          break;
        }

        processedGalleries += 1;

        const galleryId = galleryDir.name;
        const galleryPath = `${remoteDirPath}/${galleryId}`;
        const galleryFiles = await this.listDirectory(galleryPath);
        const originalFile = this.findGalleryOriginalFile(galleryFiles);
        if (!originalFile) {
          console.log(
            `⚠️ No PhotoGallery original found for team ${teamId}, gallery ${galleryId}. Skipping.`,
          );
          this.stats.galleryPhotos.skipped++;
          continue;
        }

        const accountId = this.teamToAccountMap.get(teamId);
        if (!accountId) {
          console.log(
            `⚠️ Unable to determine account for team ${teamId} when migrating gallery ${galleryId}. Skipping.`,
          );
          this.stats.galleryPhotos.skipped++;
          continue;
        }

        const thumbnailFile = this.findGalleryThumbnailFile(galleryFiles);

        await this.migrateGalleryPhoto({
          accountId,
          galleryId,
          ownerSegments: ['teams', teamId, 'PhotoGallery', galleryId],
          remoteOriginalPath: `${galleryPath}/${originalFile.name}`,
          remoteThumbnailPath: thumbnailFile ? `${galleryPath}/${thumbnailFile.name}` : undefined,
        });
      }
    } catch (error) {
      console.error(`❌ Error processing photo gallery for team ${teamId}:`, error);
      this.stats.galleryPhotos.errors++;
    }
  }

  private async processTeamSponsors(
    teamId: string,
    accountId: string,
    remoteDirPath: string,
  ): Promise<void> {
    try {
      const sponsorDirs = await this.listDirectory(remoteDirPath);
      let processedSponsors = 0;

      for (const sponsorDir of sponsorDirs) {
        if (!sponsorDir.isDirectory) {
          continue;
        }

        if (this.isTestMode && processedSponsors >= this.testLimits.filesPerDirectory) {
          console.log(
            `🧪 Test mode: reached sponsor directory limit for team ${teamId}, skipping remaining sponsors.`,
          );
          break;
        }

        processedSponsors += 1;

        const sponsorId = sponsorDir.name;
        const sponsorPath = `${remoteDirPath}/${sponsorId}`;
        const sponsorFiles = await this.listDirectory(sponsorPath);
        let processedFiles = 0;

        for (const file of sponsorFiles) {
          if (!file.isFile || !this.isImageFile(file.name)) {
            continue;
          }

          if (this.isTestMode && processedFiles >= this.testLimits.filesPerDirectory) {
            console.log(
              `🧪 Test mode: reached sponsor logo limit for team ${teamId}, sponsor ${sponsorId}, skipping remaining files.`,
            );
            break;
          }

          processedFiles += 1;

          const remotePath = `${sponsorPath}/${file.name}`;
          const localPath = path.join(
            this.tempDir,
            'teams',
            teamId,
            'Sponsors',
            sponsorId,
            file.name,
          );

          console.log(
            `⬇️ Downloading team sponsor logo for team ${teamId}, sponsor ${sponsorId}: ${file.name}`,
          );

          if (this.isFileAlreadyProcessed(remotePath)) {
            console.log(`⏭️ Team sponsor logo already migrated: ${remotePath}`);
            this.stats.sponsorLogos.skipped++;
            continue;
          }

          if (!(await this.downloadFile(remotePath, localPath))) {
            this.stats.sponsorLogos.errors++;
            continue;
          }

          this.stats.sponsorLogos.downloaded++;

          const buffer = await this.getFileBuffer(localPath);
          if (!buffer) {
            this.stats.sponsorLogos.errors++;
            await this.cleanupTempFile(localPath);
            continue;
          }

          try {
            await this.storageService.saveSponsorPhoto(accountId, sponsorId, buffer);
            console.log(
              `✅ Uploaded team sponsor logo for account ${accountId}, team ${teamId}, sponsor ${sponsorId}`,
            );
            this.stats.sponsorLogos.uploaded++;
            this.markFileProcessed(remotePath);
          } catch (error) {
            console.error(
              `❌ Failed to upload team sponsor logo for account ${accountId}, team ${teamId}, sponsor ${sponsorId}:`,
              error,
            );
            this.stats.sponsorLogos.errors++;
            this.markFileFailed(remotePath);
          }

          await this.cleanupTempFile(localPath);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing sponsors for team ${teamId}:`, error);
      this.stats.sponsorLogos.errors++;
    }
  }

  private async processTeamLegacyLogo(
    teamId: string,
    accountId: string,
    remoteFilePath: string,
  ): Promise<void> {
    console.log(`⬇️ Processing legacy team logo location for team ${teamId}`);

    if (this.isFileAlreadyProcessed(remoteFilePath)) {
      console.log(`⏭️ Legacy team logo already migrated: ${remoteFilePath}`);
      this.stats.teamLogos.skipped++;
      return;
    }

    const fileName = remoteFilePath.split('/').pop() ?? 'logo';
    const localPath = path.join(this.tempDir, 'teams', teamId, `legacy-${fileName}`);

    if (!(await this.downloadFile(remoteFilePath, localPath))) {
      this.stats.teamLogos.errors++;
      return;
    }

    this.stats.teamLogos.downloaded++;

    const buffer = await this.getFileBuffer(localPath);
    if (!buffer) {
      this.stats.teamLogos.errors++;
      await this.cleanupTempFile(localPath);
      return;
    }

    try {
      await this.storageService.saveLogo(accountId, teamId, buffer);
      console.log(`✅ Uploaded legacy team logo for account ${accountId}, team ${teamId}`);
      this.stats.teamLogos.uploaded++;
      this.markFileProcessed(remoteFilePath);
    } catch (error) {
      console.error(
        `❌ Failed to upload legacy team logo for account ${accountId}, team ${teamId}:`,
        error,
      );
      this.stats.teamLogos.errors++;
      this.markFileFailed(remoteFilePath);
    }

    await this.cleanupTempFile(localPath);
  }

  private async processWhereHeardOptions(accountId: string, remoteFilePath: string): Promise<void> {
    console.log(`⬇️ Downloading whereheard options (stub) for account ${accountId}`);

    if (this.isFileAlreadyProcessed(remoteFilePath)) {
      console.log(`⏭️ Where heard options already processed: ${remoteFilePath}`);
      this.stats.whereHeardOptions.skipped++;
      return;
    }

    const localPath = path.join(this.tempDir, 'accounts', accountId, 'whereheardoptions.xml');

    if (!(await this.downloadFile(remoteFilePath, localPath))) {
      this.stats.whereHeardOptions.errors++;
      return;
    }

    this.stats.whereHeardOptions.downloaded++;
    this.stats.whereHeardOptions.skipped++;
    console.log(
      `📝 Where heard options upload not yet implemented. File retained for future migration: ${remoteFilePath}`,
    );
    this.markFileProcessed(remoteFilePath);

    await this.cleanupTempFile(localPath);
  }

  private async processMessageBoard(accountId: string, remoteFilePath: string): Promise<void> {
    console.log(`⬇️ Downloading message board (stub) for account ${accountId}`);

    if (this.isFileAlreadyProcessed(remoteFilePath)) {
      console.log(`⏭️ Message board already processed: ${remoteFilePath}`);
      this.stats.messageBoards.skipped++;
      return;
    }

    const localPath = path.join(this.tempDir, 'accounts', accountId, 'messageboard.xml');

    if (!(await this.downloadFile(remoteFilePath, localPath))) {
      this.stats.messageBoards.errors++;
      return;
    }

    this.stats.messageBoards.downloaded++;
    this.stats.messageBoards.skipped++;
    console.log(
      `📝 Message board migration not yet implemented. File retained for future processing: ${remoteFilePath}`,
    );
    this.markFileProcessed(remoteFilePath);

    await this.cleanupTempFile(localPath);
  }

  private async processLegacyAccountLogo(accountId: string, remoteFilePath: string): Promise<void> {
    console.log(`⬇️ Processing legacy account logo location for account ${accountId}`);

    if (this.isFileAlreadyProcessed(remoteFilePath)) {
      console.log(`⏭️ Legacy account logo already migrated: ${remoteFilePath}`);
      this.stats.accountLogos.skipped++;
      return;
    }

    const fileName = remoteFilePath.split('/').pop() ?? 'logo';
    const localPath = path.join(this.tempDir, 'accounts', accountId, `legacy-${fileName}`);

    if (!(await this.downloadFile(remoteFilePath, localPath))) {
      this.stats.accountLogos.errors++;
      return;
    }

    this.stats.accountLogos.downloaded++;

    const buffer = await this.getFileBuffer(localPath);
    if (!buffer) {
      this.stats.accountLogos.errors++;
      await this.cleanupTempFile(localPath);
      return;
    }

    try {
      await this.storageService.saveAccountLogo(accountId, buffer);
      console.log(`✅ Uploaded legacy account logo for account ${accountId}`);
      this.stats.accountLogos.uploaded++;
      this.markFileProcessed(remoteFilePath);
    } catch (error) {
      console.error(`❌ Failed to upload legacy account logo for ${accountId}:`, error);
      this.stats.accountLogos.errors++;
      this.markFileFailed(remoteFilePath);
    }

    await this.cleanupTempFile(localPath);
  }

  async migrateTeamAssets(): Promise<void> {
    console.log('📁 Migrating team assets from /Uploads/Teams...');

    try {
      const teamDirs = await this.listDirectory('/Uploads/Teams');
      let processedTeams = 0;

      for (const dir of teamDirs) {
        if (!dir.isDirectory) {
          continue;
        }

        const teamId = dir.name;
        if (!teamId || teamId === '.' || teamId === '..') {
          continue;
        }

        const accountId = this.teamToAccountMap.get(teamId);

        if (!accountId) {
          console.log(`⚠️ Team ${teamId} not found in database, skipping...`);
          this.stats.teamLogos.skipped++;
          continue;
        }

        if (this.isTestMode && processedTeams >= this.testLimits.teams) {
          console.log('🧪 Test mode: reached team directory limit, skipping remaining teams.');
          break;
        }

        processedTeams += 1;

        console.log(`📂 Processing team ${teamId} (account ${accountId})...`);

        try {
          await this.processTeamDirectory(teamId, accountId);
        } catch (error) {
          console.error(`❌ Error processing team ${teamId}:`, error);
          this.stats.teamLogos.errors++;
        }
      }
    } catch (error) {
      console.error('❌ Error migrating team assets:', error);
    }
  }

  async migrateContactPhotos(): Promise<void> {
    console.log('📁 Migrating contact photos from /Uploads/Contacts...');

    try {
      // List contact directories
      const contactDirs = await this.listDirectory('/Uploads/Contacts');
      let processedContacts = 0;

      for (const dir of contactDirs) {
        if (!dir.isDirectory) {
          continue;
        }

        const contactId = dir.name;
        if (!contactId || contactId === '.' || contactId === '..') {
          continue;
        }

        const accountId = this.contactToAccountMap.get(contactId);

        if (!accountId) {
          console.log(`⚠️ Contact ${contactId} not found in database, skipping...`);
          this.stats.contactPhotos.skipped++;
          continue;
        }

        if (this.isTestMode && processedContacts >= this.testLimits.contacts) {
          console.log(
            '🧪 Test mode: reached contact directory limit, skipping remaining contacts.',
          );
          break;
        }

        processedContacts += 1;

        console.log(`📂 Processing contact ${contactId} (account ${accountId})...`);

        try {
          // List files in this contact directory
          const contactFiles = await this.listDirectory(`/Uploads/Contacts/${contactId}`);
          let processedFiles = 0;

          for (const file of contactFiles) {
            if (!file.isFile || !this.isImageFile(file.name)) {
              continue;
            }

            if (this.isTestMode && processedFiles >= this.testLimits.filesPerDirectory) {
              console.log(
                `🧪 Test mode: reached file limit for contact ${contactId}, skipping remaining files.`,
              );
              break;
            }

            processedFiles += 1;

            const remotePath = `/Uploads/Contacts/${contactId}/${file.name}`;
            const localPath = path.join(this.tempDir, 'contacts', contactId, file.name);

            console.log(`⬇️ Downloading contact photo: ${contactId}/${file.name}`);

            if (this.isFileAlreadyProcessed(remotePath)) {
              console.log(`⏭️ Contact photo already migrated: ${remotePath}`);
              this.stats.contactPhotos.skipped++;
              continue;
            }

            if (await this.downloadFile(remotePath, localPath)) {
              this.stats.contactPhotos.downloaded++;

              const buffer = await this.getFileBuffer(localPath);
              if (buffer) {
                try {
                  await this.storageService.saveContactPhoto(accountId, contactId, buffer);
                  console.log(
                    `✅ Uploaded contact photo for account ${accountId}, contact ${contactId}`,
                  );
                  this.stats.contactPhotos.uploaded++;
                  this.markFileProcessed(remotePath);
                } catch (error) {
                  console.error(
                    `❌ Failed to upload contact photo for ${accountId}/${contactId}:`,
                    error,
                  );
                  this.stats.contactPhotos.errors++;
                  this.markFileFailed(remotePath);
                }
              }

              await this.cleanupTempFile(localPath);
            } else {
              this.stats.contactPhotos.errors++;
            }
          }
        } catch (error) {
          console.error(`❌ Error processing contact ${contactId}:`, error);
          this.stats.contactPhotos.errors++;
        }
      }
    } catch (error) {
      console.error('❌ Error migrating contact photos:', error);
    }
  }

  private findGalleryOriginalFile(files: FtpFileInfo[]): FtpFileInfo | undefined {
    return files.find(
      (file) =>
        file.isFile &&
        ['photogallery.jpg', 'photogallery.jpeg', 'photogallery.png'].includes(
          file.name.toLowerCase(),
        ),
    );
  }

  private findGalleryThumbnailFile(files: FtpFileInfo[]): FtpFileInfo | undefined {
    return files.find(
      (file) =>
        file.isFile &&
        ['photogallerythumb.jpg', 'photogallerythumb.jpeg', 'photogallerythumb.png'].includes(
          file.name.toLowerCase(),
        ),
    );
  }

  private tryParseBigInt(value: string, context: string): bigint | null {
    try {
      const normalized = value.trim();
      if (!normalized) {
        console.log(`⚠️ ${context}: identifier is empty.`);
        return null;
      }

      return BigInt(normalized);
    } catch (_error) {
      console.log(`⚠️ ${context}: invalid identifier '${value}', skipping.`);
      return null;
    }
  }

  private normalizeGalleryExtension(originalPath: string): {
    extension: string;
    format: 'jpeg' | 'png' | 'webp';
  } {
    const rawExtension = path.extname(originalPath).toLowerCase();
    if (rawExtension === '.jpeg') {
      return { extension: '.jpg', format: 'jpeg' };
    }

    const format = EXTENSION_FORMAT_MAP[rawExtension];
    if (format) {
      return { extension: rawExtension as '.jpg' | '.png' | '.webp', format };
    }

    return { extension: '.jpg', format: 'jpeg' };
  }

  private buildGalleryDestinationPaths(
    accountId: bigint,
    galleryId: bigint,
    extension: string,
  ): { photo: string; thumbnail: string } {
    const accountSegment = accountId.toString();
    const gallerySegment = galleryId.toString();
    const normalizedExtension = extension.startsWith('.')
      ? extension.toLowerCase()
      : `.${extension.toLowerCase()}`;
    const basePath = path.join(accountSegment, 'photo-gallery', gallerySegment);

    return {
      photo: path.join(basePath, `photo${normalizedExtension}`),
      thumbnail: path.join(basePath, `photo-thumb${normalizedExtension}`),
    };
  }

  private resolveUploadsAbsolutePath(relativePath: string): string {
    return path.join(process.cwd(), 'uploads', relativePath);
  }

  private async migrateGalleryPhoto(options: {
    accountId: string;
    galleryId: string;
    ownerSegments: string[];
    remoteOriginalPath: string;
    remoteThumbnailPath?: string;
  }): Promise<void> {
    const { accountId, galleryId, ownerSegments, remoteOriginalPath, remoteThumbnailPath } =
      options;

    const accountIdBigInt = this.tryParseBigInt(accountId, `Gallery ${galleryId}`);
    const galleryIdBigInt = this.tryParseBigInt(galleryId, `Gallery ${galleryId}`);

    if (!accountIdBigInt || !galleryIdBigInt) {
      this.stats.galleryPhotos.errors++;
      return;
    }

    if (this.isFileAlreadyProcessed(remoteOriginalPath)) {
      console.log(`⏭️ Gallery photo already migrated: ${remoteOriginalPath}`);
      this.stats.galleryPhotos.skipped++;
      return;
    }

    const originalLocalPath = path.join(
      this.tempDir,
      ...ownerSegments,
      path.basename(remoteOriginalPath),
    );

    if (!(await this.downloadFile(remoteOriginalPath, originalLocalPath))) {
      this.stats.galleryPhotos.errors++;
      return;
    }

    this.stats.galleryPhotos.downloaded++;

    const originalBuffer = await this.getFileBuffer(originalLocalPath);
    if (!originalBuffer) {
      this.stats.galleryPhotos.errors++;
      await this.cleanupTempFile(originalLocalPath);
      return;
    }

    let thumbnailBuffer: Buffer | null = null;
    let thumbnailLocalPath: string | null = null;
    let thumbnailRemotePath = remoteThumbnailPath;

    if (thumbnailRemotePath) {
      if (this.isFileAlreadyProcessed(thumbnailRemotePath)) {
        console.log(`⏭️ Gallery thumbnail already migrated: ${thumbnailRemotePath}`);
        thumbnailRemotePath = undefined;
      } else {
        thumbnailLocalPath = path.join(
          this.tempDir,
          ...ownerSegments,
          path.basename(thumbnailRemotePath),
        );

        if (await this.downloadFile(thumbnailRemotePath, thumbnailLocalPath)) {
          this.stats.galleryPhotos.downloaded++;
          thumbnailBuffer = await this.getFileBuffer(thumbnailLocalPath);
          if (!thumbnailBuffer) {
            this.stats.galleryPhotos.errors++;
          }
        } else {
          this.stats.galleryPhotos.errors++;
          thumbnailRemotePath = undefined;
        }
      }
    }

    try {
      const { extension, format } = this.normalizeGalleryExtension(remoteOriginalPath);
      const destinations = this.buildGalleryDestinationPaths(
        accountIdBigInt,
        galleryIdBigInt,
        extension,
      );
      const originalDestination = this.resolveUploadsAbsolutePath(destinations.photo);
      const thumbnailDestination = this.resolveUploadsAbsolutePath(destinations.thumbnail);

      await fs.promises.mkdir(path.dirname(originalDestination), { recursive: true });

      const originalMetadata = await sharp(originalBuffer)
        .metadata()
        .catch(() => null);
      const shouldResizePrimary = !matchesTargetDimensions(
        originalMetadata,
        GALLERY_PRIMARY_DIMENSIONS,
      );

      if (shouldResizePrimary) {
        const resizedPhotoBuffer = await sharp(originalBuffer)
          .resize(GALLERY_PRIMARY_DIMENSIONS.width, GALLERY_PRIMARY_DIMENSIONS.height, {
            fit: 'cover',
            position: 'centre',
            withoutEnlargement: true,
          })
          .toFormat(format)
          .toBuffer();
        await fs.promises.writeFile(originalDestination, resizedPhotoBuffer);
      } else {
        await fs.promises.writeFile(originalDestination, originalBuffer);
      }

      await fs.promises.mkdir(path.dirname(thumbnailDestination), { recursive: true });

      const thumbnailMetadata = thumbnailBuffer
        ? await sharp(thumbnailBuffer)
            .metadata()
            .catch(() => null)
        : null;

      let thumbnailSourceBuffer = thumbnailBuffer ?? originalBuffer;
      let shouldResizeThumbnail = true;

      if (
        thumbnailBuffer &&
        matchesTargetDimensions(thumbnailMetadata, GALLERY_THUMBNAIL_DIMENSIONS)
      ) {
        shouldResizeThumbnail = false;
        thumbnailSourceBuffer = thumbnailBuffer;
      } else if (
        !thumbnailBuffer &&
        matchesTargetDimensions(originalMetadata, GALLERY_THUMBNAIL_DIMENSIONS)
      ) {
        shouldResizeThumbnail = false;
        thumbnailSourceBuffer = originalBuffer;
      }

      if (shouldResizeThumbnail) {
        const resizedThumbnailBuffer = await sharp(thumbnailSourceBuffer)
          .resize(GALLERY_THUMBNAIL_DIMENSIONS.width, GALLERY_THUMBNAIL_DIMENSIONS.height, {
            fit: 'cover',
            position: 'centre',
          })
          .toFormat(format)
          .toBuffer();
        await fs.promises.writeFile(thumbnailDestination, resizedThumbnailBuffer);
      } else {
        await fs.promises.writeFile(thumbnailDestination, thumbnailSourceBuffer);
      }

      this.stats.galleryPhotos.uploaded++;
      this.markFileProcessed(remoteOriginalPath);
      if (thumbnailRemotePath) {
        this.markFileProcessed(thumbnailRemotePath);
      }

      console.log(
        `✅ Migrated gallery photo ${galleryId} for account ${accountId} into uploads/${destinations.photo}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to migrate gallery photo ${galleryId} for account ${accountId}:`,
        error,
      );
      this.stats.galleryPhotos.errors++;
      this.markFileFailed(remoteOriginalPath);
      if (thumbnailRemotePath) {
        this.markFileFailed(thumbnailRemotePath);
      }
    } finally {
      await this.cleanupTempFile(originalLocalPath);
      if (thumbnailLocalPath) {
        await this.cleanupTempFile(thumbnailLocalPath);
      }
    }
  }

  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  private printStats(): void {
    console.log('\n📊 Migration Statistics:');
    console.log('========================');

    this.printCategoryStats('👥 Account Logos', this.stats.accountLogos);
    this.printCategoryStats('🏆 Team Logos', this.stats.teamLogos);
    this.printCategoryStats('👤 Contact Photos', this.stats.contactPhotos);
    this.printCategoryStats('🤝 Sponsor Logos', this.stats.sponsorLogos);
    this.printCategoryStats('📄 Handouts', this.stats.handouts);
    this.printCategoryStats('🖼️ Gallery Photos', this.stats.galleryPhotos);
    this.printCategoryStats('📋 Where Heard Options', this.stats.whereHeardOptions);
    this.printCategoryStats('💬 Message Boards', this.stats.messageBoards);

    const totals = Object.values(this.stats).reduce((acc, item) => {
      acc.downloaded += item.downloaded;
      acc.uploaded += item.uploaded;
      acc.skipped += item.skipped;
      acc.errors += item.errors;
      return acc;
    }, this.createEmptyStats());

    console.log('\n📈 Totals:');
    console.log(`  Total Downloaded: ${totals.downloaded}`);
    console.log(`  Total Uploaded: ${totals.uploaded}`);
    console.log(`  Total Skipped: ${totals.skipped}`);
    console.log(`  Total Errors: ${totals.errors}`);
  }

  private printCategoryStats(label: string, stats: CategoryStats): void {
    console.log(`\n${label}:`);
    console.log(`  Downloaded: ${stats.downloaded}`);
    console.log(`  Uploaded: ${stats.uploaded}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Errors: ${stats.errors}`);
  }

  async run(): Promise<void> {
    try {
      await this.initialize();

      console.log('🎯 Starting file migration...\n');

      await this.migrateAccountAssets();
      await this.migrateTeamAssets();
      await this.migrateContactPhotos();

      this.printStats();

      console.log('\n✅ File migration completed!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.saveProgress();
      process.exit(1);
    } finally {
      // Cleanup
      if (this.prisma?.$disconnect) {
        try {
          await this.prisma.$disconnect();
        } catch (error) {
          console.error('⚠️ Failed to disconnect Prisma client:', error);
        }
      }

      try {
        this.ftpClient.close();
      } catch (error) {
        console.error('⚠️ Failed to close FTP client:', error);
      }

      // Remove temp directory
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }

      this.saveProgress();
    }
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: FileMigrationOptions = {};

  const hasTestFlag = args.some((arg) => arg === '--test' || arg === '--test-mode');
  if (hasTestFlag) {
    options.testMode = true;
  }

  const parseNumericArg = (name: string): number | undefined => {
    const prefix = `${name}=`;
    const match = args.find((arg) => arg.startsWith(prefix));
    if (!match) {
      return undefined;
    }

    const rawValue = match.slice(prefix.length);
    const value = Number.parseInt(rawValue, 10);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    console.warn(`⚠️ Ignoring invalid value for ${name}: '${rawValue}'`);
    return undefined;
  };

  let testLimitArgProvided = false;

  const testAccounts = parseNumericArg('--test-accounts');
  if (typeof testAccounts === 'number') {
    options.testAccounts = testAccounts;
    testLimitArgProvided = true;
  }

  const testTeams = parseNumericArg('--test-teams');
  if (typeof testTeams === 'number') {
    options.testTeams = testTeams;
    testLimitArgProvided = true;
  }

  const testContacts = parseNumericArg('--test-contacts');
  if (typeof testContacts === 'number') {
    options.testContacts = testContacts;
    testLimitArgProvided = true;
  }

  const testFiles =
    parseNumericArg('--test-files') ?? parseNumericArg('--test-files-per-directory');
  if (typeof testFiles === 'number') {
    options.testFilesPerDirectory = testFiles;
    testLimitArgProvided = true;
  }

  if (testLimitArgProvided && options.testMode === undefined) {
    options.testMode = true;
  }

  const migration = new FileMigrationService(options);
  migration.run().catch(console.error);
}

export default FileMigrationService;
