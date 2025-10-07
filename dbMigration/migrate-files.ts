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

// Load environment variables, preferring migration overrides before backend defaults
const migrationEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(migrationEnvPath)) {
  dotenv.config({ path: migrationEnvPath });
}

const backendEnvPath = path.join(__dirname, '../draco-nodejs/backend/.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}

// Types for our migration
interface MigrationStats {
  accountLogos: { downloaded: number; uploaded: number; skipped: number; errors: number };
  teamLogos: { downloaded: number; uploaded: number; skipped: number; errors: number };
  contactPhotos: { downloaded: number; uploaded: number; skipped: number; errors: number };
}

interface FileInfo {
  remotePath: string;
  localPath: string;
  fileName: string;
}

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

  constructor() {
    this.ftpClient = new FTPClient();
    this.tempDir = path.join(process.cwd(), 'temp-migration');
    this.stats = {
      accountLogos: { downloaded: 0, uploaded: 0, skipped: 0, errors: 0 },
      teamLogos: { downloaded: 0, uploaded: 0, skipped: 0, errors: 0 },
      contactPhotos: { downloaded: 0, uploaded: 0, skipped: 0, errors: 0 },
    };
    const retryEnv = Number(process.env.MIGRATION_FTP_MAX_RETRIES);
    this.maxFtpRetries = Number.isFinite(retryEnv) && retryEnv > 0 ? retryEnv : 3;

    const retryDelayEnv = Number(process.env.MIGRATION_FTP_RETRY_DELAY_MS);
    this.ftpRetryDelayMs =
      Number.isFinite(retryDelayEnv) && retryDelayEnv >= 0 ? retryDelayEnv : 2000;
    this.progressFilePath = path.join(__dirname, 'migration-progress.json');

    this.loadProgress();
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

  async migrateAccountLogos(): Promise<void> {
    console.log('📁 Migrating account logos from /Uploads/Accounts...');

    try {
      // List account directories
      const accountDirs = await this.listDirectory('/Uploads/Accounts');

      for (const dir of accountDirs) {
        if (dir.isDirectory) {
          const accountId = dir.name;
          console.log(`📂 Processing account ${accountId}...`);

          try {
            // List files in this account directory
            const accountFiles = await this.listDirectory(`/Uploads/Accounts/${accountId}`);

            for (const file of accountFiles) {
              if (file.isFile && this.isImageFile(file.name)) {
                const remotePath = `/Uploads/Accounts/${accountId}/${file.name}`;
                const localPath = path.join(this.tempDir, 'accounts', accountId, file.name);

                console.log(`⬇️ Downloading account logo: ${accountId}/${file.name}`);

                if (this.isFileAlreadyProcessed(remotePath)) {
                  console.log(`⏭️ Account logo already migrated: ${remotePath}`);
                  this.stats.accountLogos.skipped++;
                  continue;
                }

                if (await this.downloadFile(remotePath, localPath)) {
                  this.stats.accountLogos.downloaded++;

                  const buffer = await this.getFileBuffer(localPath);
                  if (buffer) {
                    try {
                      await this.storageService.saveAccountLogo(accountId, buffer);
                      console.log(`✅ Uploaded account logo for account ${accountId}`);
                      this.stats.accountLogos.uploaded++;
                      this.markFileProcessed(remotePath);
                    } catch (error) {
                      console.error(`❌ Failed to upload account logo for ${accountId}:`, error);
                      this.stats.accountLogos.errors++;
                      this.markFileFailed(remotePath);
                    }
                  }

                  await this.cleanupTempFile(localPath);
                } else {
                  this.stats.accountLogos.errors++;
                }
              }
            }
          } catch (error) {
            console.error(`❌ Error processing account ${accountId}:`, error);
            this.stats.accountLogos.errors++;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error migrating account logos:', error);
    }
  }

  async migrateTeamLogos(): Promise<void> {
    console.log('📁 Migrating team logos from /Uploads/Teams...');

    try {
      // List team directories
      const teamDirs = await this.listDirectory('/Uploads/Teams');

      for (const dir of teamDirs) {
        if (dir.isDirectory) {
          const teamId = dir.name;
          const accountId = this.teamToAccountMap.get(teamId);

          if (!accountId) {
            console.log(`⚠️ Team ${teamId} not found in database, skipping...`);
            this.stats.teamLogos.skipped++;
            continue;
          }

          console.log(`📂 Processing team ${teamId} (account ${accountId})...`);

          try {
            // List files in this team directory
            const teamFiles = await this.listDirectory(`/Uploads/Teams/${teamId}`);

            for (const file of teamFiles) {
              if (file.isFile && this.isImageFile(file.name)) {
                const remotePath = `/Uploads/Teams/${teamId}/${file.name}`;
                const localPath = path.join(this.tempDir, 'teams', teamId, file.name);

                console.log(`⬇️ Downloading team logo: ${teamId}/${file.name}`);

                if (this.isFileAlreadyProcessed(remotePath)) {
                  console.log(`⏭️ Team logo already migrated: ${remotePath}`);
                  this.stats.teamLogos.skipped++;
                  continue;
                }

                if (await this.downloadFile(remotePath, localPath)) {
                  this.stats.teamLogos.downloaded++;

                  const buffer = await this.getFileBuffer(localPath);
                  if (buffer) {
                    try {
                      await this.storageService.saveLogo(accountId, teamId, buffer);
                      console.log(`✅ Uploaded team logo for account ${accountId}, team ${teamId}`);
                      this.stats.teamLogos.uploaded++;
                      this.markFileProcessed(remotePath);
                    } catch (error) {
                      console.error(
                        `❌ Failed to upload team logo for ${accountId}/${teamId}:`,
                        error,
                      );
                      this.stats.teamLogos.errors++;
                      this.markFileFailed(remotePath);
                    }
                  }

                  await this.cleanupTempFile(localPath);
                } else {
                  this.stats.teamLogos.errors++;
                }
              }
            }
          } catch (error) {
            console.error(`❌ Error processing team ${teamId}:`, error);
            this.stats.teamLogos.errors++;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error migrating team logos:', error);
    }
  }

  async migrateContactPhotos(): Promise<void> {
    console.log('📁 Migrating contact photos from /Uploads/Contacts...');

    try {
      // List contact directories
      const contactDirs = await this.listDirectory('/Uploads/Contacts');

      for (const dir of contactDirs) {
        if (dir.isDirectory) {
          const contactId = dir.name;
          const accountId = this.contactToAccountMap.get(contactId);

          if (!accountId) {
            console.log(`⚠️ Contact ${contactId} not found in database, skipping...`);
            this.stats.contactPhotos.skipped++;
            continue;
          }

          console.log(`📂 Processing contact ${contactId} (account ${accountId})...`);

          try {
            // List files in this contact directory
            const contactFiles = await this.listDirectory(`/Uploads/Contacts/${contactId}`);

            for (const file of contactFiles) {
              if (file.isFile && this.isImageFile(file.name)) {
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
            }
          } catch (error) {
            console.error(`❌ Error processing contact ${contactId}:`, error);
            this.stats.contactPhotos.errors++;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error migrating contact photos:', error);
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

    console.log('\n👥 Account Logos:');
    console.log(`  Downloaded: ${this.stats.accountLogos.downloaded}`);
    console.log(`  Uploaded: ${this.stats.accountLogos.uploaded}`);
    console.log(`  Skipped: ${this.stats.accountLogos.skipped}`);
    console.log(`  Errors: ${this.stats.accountLogos.errors}`);

    console.log('\n🏆 Team Logos:');
    console.log(`  Downloaded: ${this.stats.teamLogos.downloaded}`);
    console.log(`  Uploaded: ${this.stats.teamLogos.uploaded}`);
    console.log(`  Skipped: ${this.stats.teamLogos.skipped}`);
    console.log(`  Errors: ${this.stats.teamLogos.errors}`);

    console.log('\n👤 Contact Photos:');
    console.log(`  Downloaded: ${this.stats.contactPhotos.downloaded}`);
    console.log(`  Uploaded: ${this.stats.contactPhotos.uploaded}`);
    console.log(`  Skipped: ${this.stats.contactPhotos.skipped}`);
    console.log(`  Errors: ${this.stats.contactPhotos.errors}`);

    const totalDownloaded =
      this.stats.accountLogos.downloaded +
      this.stats.teamLogos.downloaded +
      this.stats.contactPhotos.downloaded;
    const totalUploaded =
      this.stats.accountLogos.uploaded +
      this.stats.teamLogos.uploaded +
      this.stats.contactPhotos.uploaded;
    const totalErrors =
      this.stats.accountLogos.errors +
      this.stats.teamLogos.errors +
      this.stats.contactPhotos.errors;

    console.log('\n📈 Totals:');
    console.log(`  Total Downloaded: ${totalDownloaded}`);
    console.log(`  Total Uploaded: ${totalUploaded}`);
    console.log(`  Total Errors: ${totalErrors}`);
  }

  async run(): Promise<void> {
    try {
      await this.initialize();

      console.log('🎯 Starting file migration...\n');

      await this.migrateAccountLogos();
      await this.migrateTeamLogos();
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
  const migration = new FileMigrationService();
  migration.run().catch(console.error);
}

export default FileMigrationService;
