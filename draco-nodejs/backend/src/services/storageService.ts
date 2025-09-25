import fs from 'node:fs';
import path from 'node:path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BaseStorageService, StorageService } from './baseStorageService.js';

// AWS Error interface for better type safety
interface AWSError extends Error {
  name: string;
  $metadata?: {
    httpStatusCode?: number;
  };
}

// Re-export the StorageService interface from baseStorageService
export { StorageService } from './baseStorageService.js';

export class LocalStorageService extends BaseStorageService {
  private uploadsDir: string;

  constructor() {
    super();
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDir();
  }

  private ensureUploadsDir(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async saveLogo(accountId: string, teamId: string, buffer: Buffer): Promise<void> {
    try {
      const accountDir = path.join(this.uploadsDir, accountId, 'team-logos');
      if (!fs.existsSync(accountDir)) {
        fs.mkdirSync(accountDir, { recursive: true });
      }

      const resizedBuffer = await this.processTeamLogo(buffer);
      const filePath = path.join(accountDir, `${teamId}-logo.png`);
      fs.writeFileSync(filePath, resizedBuffer);
      console.log(`Logo saved to local storage: ${filePath}`);
    } catch (error) {
      this.handleStorageError(error, 'save logo to local storage');
    }
  }

  async getLogo(accountId: string, teamId: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.uploadsDir, accountId, 'team-logos', `${teamId}-logo.png`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Error reading logo from local storage:', error);
      return null;
    }
  }

  async deleteLogo(accountId: string, teamId: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, accountId, 'team-logos', `${teamId}-logo.png`);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Logo deleted from local storage: ${filePath}`);
      }
    } catch (error) {
      this.handleStorageError(error, 'delete logo from local storage');
    }
  }

  async saveAccountLogo(accountId: string, buffer: Buffer): Promise<void> {
    try {
      const accountDir = path.join(this.uploadsDir, accountId);
      if (!fs.existsSync(accountDir)) {
        fs.mkdirSync(accountDir, { recursive: true });
      }
      const resizedBuffer = await this.processAccountLogo(buffer);
      const filePath = path.join(accountDir, `logo.png`);
      fs.writeFileSync(filePath, resizedBuffer);
      console.log(`Account logo saved to local storage: ${filePath}`);
    } catch (error) {
      this.handleStorageError(error, 'save account logo to local storage');
    }
  }

  async getAccountLogo(accountId: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.uploadsDir, accountId, `logo.png`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Error reading account logo from local storage:', error);
      return null;
    }
  }

  async deleteAccountLogo(accountId: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, accountId, `logo.png`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Account logo deleted from local storage: ${filePath}`);
      }
    } catch (error) {
      this.handleStorageError(error, 'delete account logo from local storage');
    }
  }

  async saveContactPhoto(accountId: string, contactId: string, buffer: Buffer): Promise<void> {
    try {
      const contactPhotoDir = path.join(this.uploadsDir, accountId, 'contact-photos');
      if (!fs.existsSync(contactPhotoDir)) {
        fs.mkdirSync(contactPhotoDir, { recursive: true });
      }

      const resizedBuffer = await this.processContactPhoto(buffer);
      const filePath = path.join(contactPhotoDir, `${contactId}-photo.png`);
      fs.writeFileSync(filePath, resizedBuffer);
      console.log(`Contact photo saved to local storage: ${filePath}`);
    } catch (error) {
      this.handleStorageError(error, 'save contact photo to local storage');
    }
  }

  async getContactPhoto(accountId: string, contactId: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(
        this.uploadsDir,
        accountId,
        'contact-photos',
        `${contactId}-photo.png`,
      );

      if (!fs.existsSync(filePath)) {
        return null;
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Error reading contact photo from local storage:', error);
      return null;
    }
  }

  async deleteContactPhoto(accountId: string, contactId: string): Promise<void> {
    try {
      const filePath = path.join(
        this.uploadsDir,
        accountId,
        'contact-photos',
        `${contactId}-photo.png`,
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Contact photo deleted from local storage: ${filePath}`);
      }
    } catch (error) {
      this.handleStorageError(error, 'delete contact photo from local storage');
    }
  }

  async saveSponsorPhoto(accountId: string, sponsorId: string, buffer: Buffer): Promise<void> {
    try {
      const sponsorPhotoDir = path.join(this.uploadsDir, accountId, 'sponsor-photos');
      if (!fs.existsSync(sponsorPhotoDir)) {
        fs.mkdirSync(sponsorPhotoDir, { recursive: true });
      }

      const resizedBuffer = await this.processSponsorPhoto(buffer);
      const filePath = path.join(sponsorPhotoDir, `${sponsorId}-photo.png`);
      fs.writeFileSync(filePath, resizedBuffer);
      console.log(`Sponsor photo saved to local storage: ${filePath}`);
    } catch (error) {
      this.handleStorageError(error, 'save sponsor photo to local storage');
    }
  }

  async getSponsorPhoto(accountId: string, sponsorId: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(
        this.uploadsDir,
        accountId,
        'sponsor-photos',
        `${sponsorId}-photo.png`,
      );

      if (!fs.existsSync(filePath)) {
        return null;
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Error reading sponsor photo from local storage:', error);
      return null;
    }
  }

  async deleteSponsorPhoto(accountId: string, sponsorId: string): Promise<void> {
    try {
      const filePath = path.join(
        this.uploadsDir,
        accountId,
        'sponsor-photos',
        `${sponsorId}-photo.png`,
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Sponsor photo deleted from local storage: ${filePath}`);
      }
    } catch (error) {
      this.handleStorageError(error, 'delete sponsor photo from local storage');
    }
  }

  async saveAttachment(
    accountId: string,
    emailId: string,
    filename: string,
    buffer: Buffer,
  ): Promise<string> {
    try {
      const attachmentDir = path.join(this.uploadsDir, accountId, 'email-attachments', emailId);
      if (!fs.existsSync(attachmentDir)) {
        fs.mkdirSync(attachmentDir, { recursive: true });
      }

      const storagePath = this.getAttachmentKey(accountId, emailId, filename);
      const filePath = path.join(this.uploadsDir, storagePath);
      fs.writeFileSync(filePath, buffer);
      console.log(`Email attachment saved to local storage: ${filePath}`);
      return storagePath;
    } catch (error) {
      this.handleStorageError(error, 'save email attachment to local storage');
    }
  }

  async getAttachment(
    accountId: string,
    emailId: string,
    filename: string,
  ): Promise<Buffer | null> {
    try {
      const storagePath = this.getAttachmentKey(accountId, emailId, filename);
      const filePath = path.join(this.uploadsDir, storagePath);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Error reading email attachment from local storage:', error);
      return null;
    }
  }

  async deleteAttachment(accountId: string, emailId: string, filename: string): Promise<void> {
    try {
      const storagePath = this.getAttachmentKey(accountId, emailId, filename);
      const filePath = path.join(this.uploadsDir, storagePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Email attachment deleted from local storage: ${filePath}`);
      }
    } catch (error) {
      this.handleStorageError(error, 'delete email attachment from local storage');
    }
  }

  async deleteAllAttachments(accountId: string, emailId: string): Promise<void> {
    try {
      const attachmentDir = path.join(this.uploadsDir, accountId, 'email-attachments', emailId);

      if (fs.existsSync(attachmentDir)) {
        fs.rmSync(attachmentDir, { recursive: true, force: true });
        console.log(`All email attachments deleted from local storage for email ${emailId}`);
      }
    } catch (error) {
      this.handleStorageError(error, 'delete all email attachments from local storage');
    }
  }
}

export class S3StorageService extends BaseStorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    super();
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET environment variable must be set for S3 storage');
    }
    this.bucketName = process.env.S3_BUCKET;

    this.s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT, // For LocalStack
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for LocalStack
    });

    // Ensure bucket exists on initialization
    this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      console.log(`S3 bucket '${this.bucketName}' already exists`);
    } catch (error: unknown) {
      // If bucket doesn't exist, create it
      const awsError = error as AWSError;
      if (awsError.name === 'NotFound' || awsError.$metadata?.httpStatusCode === 404) {
        try {
          console.log(`Creating S3 bucket '${this.bucketName}'...`);
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
          console.log(`S3 bucket '${this.bucketName}' created successfully`);
        } catch (createError) {
          console.error(`Failed to create S3 bucket '${this.bucketName}':`, createError);
          // Don't throw here - let individual operations handle bucket errors
        }
      } else {
        console.error(`Error checking S3 bucket '${this.bucketName}':`, error);
        // Don't throw here - let individual operations handle bucket errors
      }
    }
  }

  async saveLogo(accountId: string, teamId: string, buffer: Buffer): Promise<void> {
    try {
      const resizedBuffer = await this.processTeamLogo(buffer);
      const key = this.getTeamLogoKey(accountId, teamId);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: resizedBuffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=3600',
      });

      await this.s3Client.send(command);
      console.log(`Logo saved to S3: ${key}`);
    } catch (error: unknown) {
      console.error('Error saving logo to S3:', error);

      // Provide more specific error messages
      const awsError = error as AWSError;
      if (awsError.name === 'NoSuchBucket') {
        throw new Error(
          `S3 bucket '${this.bucketName}' does not exist. Please ensure the bucket is created or check your S3 configuration.`,
        );
      } else if (awsError.name === 'AccessDenied') {
        throw new Error('Access denied to S3. Please check your AWS credentials and permissions.');
      } else {
        throw new Error(`Failed to save logo to S3: ${awsError.message || 'Unknown error'}`);
      }
    }
  }

  async getLogo(accountId: string, teamId: string): Promise<Buffer | null> {
    try {
      const key = this.getS3Key(accountId, teamId);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        return null;
      }
      // Convert the readable stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as NodeJS.ReadableStream;
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        (('name' in error && (error as { name: string }).name === 'NoSuchKey') ||
          ('$metadata' in error &&
            (error as { $metadata: { httpStatusCode?: number } }).$metadata?.httpStatusCode ===
              404))
      ) {
        return null;
      }
      console.error('Error getting logo from S3:', error);
      throw new Error('Failed to get logo from S3');
    }
  }

  async deleteLogo(accountId: string, teamId: string): Promise<void> {
    try {
      const key = this.getS3Key(accountId, teamId);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`Logo deleted from S3: ${key}`);
    } catch (error) {
      console.error('Error deleting logo from S3:', error);
      throw new Error('Failed to delete logo from S3');
    }
  }

  async getSignedUrl(accountId: string, teamId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const key = this.getS3Key(accountId, teamId);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  private getS3Key(accountId: string, teamId: string): string {
    return this.getTeamLogoKey(accountId, teamId);
  }

  async saveAccountLogo(accountId: string, buffer: Buffer): Promise<void> {
    try {
      const resizedBuffer = await this.processAccountLogo(buffer);
      const key = this.getAccountLogoKey(accountId);
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: resizedBuffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=3600',
      });
      await this.s3Client.send(command);
      console.log(`Account logo saved to S3: ${key}`);
    } catch (error: unknown) {
      console.error('Error saving account logo to S3:', error);

      // Provide more specific error messages
      const awsError = error as AWSError;
      if (awsError.name === 'NoSuchBucket') {
        throw new Error(
          `S3 bucket '${this.bucketName}' does not exist. Please ensure the bucket is created or check your S3 configuration.`,
        );
      } else if (awsError.name === 'AccessDenied') {
        throw new Error('Access denied to S3. Please check your AWS credentials and permissions.');
      } else {
        throw new Error(
          `Failed to save account logo to S3: ${awsError.message || 'Unknown error'}`,
        );
      }
    }
  }

  async getAccountLogo(accountId: string): Promise<Buffer | null> {
    try {
      const key = this.getAccountLogoKey(accountId);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        return null;
      }
      const chunks: Buffer[] = [];
      const stream = response.Body as NodeJS.ReadableStream;
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        (('name' in error && (error as { name: string }).name === 'NoSuchKey') ||
          ('$metadata' in error &&
            (error as { $metadata: { httpStatusCode?: number } }).$metadata?.httpStatusCode ===
              404))
      ) {
        return null;
      }
      console.error('Error getting account logo from S3:', error);
      throw new Error('Failed to get account logo from S3');
    }
  }

  async deleteAccountLogo(accountId: string): Promise<void> {
    try {
      const key = this.getAccountLogoKey(accountId);
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      console.log(`Account logo deleted from S3: ${key}`);
    } catch (error) {
      console.error('Error deleting account logo from S3:', error);
      throw new Error('Failed to delete account logo from S3');
    }
  }

  async saveContactPhoto(accountId: string, contactId: string, buffer: Buffer): Promise<void> {
    try {
      const resizedBuffer = await this.processContactPhoto(buffer);
      const key = this.getContactPhotoS3Key(accountId, contactId);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: resizedBuffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=3600',
      });

      await this.s3Client.send(command);
      console.log(`Contact photo saved to S3: ${key}`);
    } catch (error: unknown) {
      console.error('Error saving contact photo to S3:', error);

      // Provide more specific error messages
      const awsError = error as AWSError;
      if (awsError.name === 'NoSuchBucket') {
        throw new Error(
          `S3 bucket '${this.bucketName}' does not exist. Please ensure the bucket is created or check your S3 configuration.`,
        );
      } else if (awsError.name === 'AccessDenied') {
        throw new Error('Access denied to S3. Please check your AWS credentials and permissions.');
      } else {
        throw new Error(
          `Failed to save contact photo to S3: ${awsError.message || 'Unknown error'}`,
        );
      }
    }
  }

  async getContactPhoto(accountId: string, contactId: string): Promise<Buffer | null> {
    try {
      const key = this.getContactPhotoS3Key(accountId, contactId);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        return null;
      }
      // Convert the readable stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as NodeJS.ReadableStream;
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        (('name' in error && (error as { name: string }).name === 'NoSuchKey') ||
          ('$metadata' in error &&
            (error as { $metadata: { httpStatusCode?: number } }).$metadata?.httpStatusCode ===
              404))
      ) {
        return null;
      }
      console.error('Error getting contact photo from S3:', error);
      throw new Error('Failed to get contact photo from S3');
    }
  }

  async deleteContactPhoto(accountId: string, contactId: string): Promise<void> {
    try {
      const key = this.getContactPhotoS3Key(accountId, contactId);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`Contact photo deleted from S3: ${key}`);
    } catch (error) {
      console.error('Error deleting contact photo from S3:', error);
      throw new Error('Failed to delete contact photo from S3');
    }
  }

  private getContactPhotoS3Key(accountId: string, contactId: string): string {
    return this.getContactPhotoKey(accountId, contactId);
  }

  async saveSponsorPhoto(accountId: string, sponsorId: string, buffer: Buffer): Promise<void> {
    try {
      const resizedBuffer = await this.processSponsorPhoto(buffer);
      const key = this.getSponsorPhotoS3Key(accountId, sponsorId);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: resizedBuffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=3600',
      });

      await this.s3Client.send(command);
      console.log(`Sponsor photo saved to S3: ${key}`);
    } catch (error: unknown) {
      console.error('Error saving sponsor photo to S3:', error);

      const awsError = error as AWSError;
      if (awsError.name === 'NoSuchBucket') {
        throw new Error(
          `S3 bucket '${this.bucketName}' does not exist. Please ensure the bucket is created or check your S3 configuration.`,
        );
      } else if (awsError.name === 'AccessDenied') {
        throw new Error('Access denied to S3. Please check your AWS credentials and permissions.');
      } else {
        throw new Error(
          `Failed to save sponsor photo to S3: ${awsError.message || 'Unknown error'}`,
        );
      }
    }
  }

  async getSponsorPhoto(accountId: string, sponsorId: string): Promise<Buffer | null> {
    try {
      const key = this.getSponsorPhotoS3Key(accountId, sponsorId);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        return null;
      }
      const chunks: Buffer[] = [];
      const stream = response.Body as NodeJS.ReadableStream;
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        (('name' in error && (error as { name: string }).name === 'NoSuchKey') ||
          ('$metadata' in error &&
            (error as { $metadata: { httpStatusCode?: number } }).$metadata?.httpStatusCode ===
              404))
      ) {
        return null;
      }
      console.error('Error getting sponsor photo from S3:', error);
      throw new Error('Failed to get sponsor photo from S3');
    }
  }

  async deleteSponsorPhoto(accountId: string, sponsorId: string): Promise<void> {
    try {
      const key = this.getSponsorPhotoS3Key(accountId, sponsorId);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`Sponsor photo deleted from S3: ${key}`);
    } catch (error) {
      console.error('Error deleting sponsor photo from S3:', error);
      throw new Error('Failed to delete sponsor photo from S3');
    }
  }

  private getSponsorPhotoS3Key(accountId: string, sponsorId: string): string {
    return this.getSponsorPhotoKey(accountId, sponsorId);
  }

  async saveAttachment(
    accountId: string,
    emailId: string,
    filename: string,
    buffer: Buffer,
  ): Promise<string> {
    try {
      const key = this.getAttachmentKey(accountId, emailId, filename);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        CacheControl: 'private, max-age=3600',
      });

      await this.s3Client.send(command);
      console.log(`Email attachment saved to S3: ${key}`);
      return key;
    } catch (error: unknown) {
      console.error('Error saving email attachment to S3:', error);

      const awsError = error as AWSError;
      if (awsError.name === 'NoSuchBucket') {
        throw new Error(
          `S3 bucket '${this.bucketName}' does not exist. Please ensure the bucket is created or check your S3 configuration.`,
        );
      } else if (awsError.name === 'AccessDenied') {
        throw new Error('Access denied to S3. Please check your AWS credentials and permissions.');
      } else {
        throw new Error(
          `Failed to save email attachment to S3: ${awsError.message || 'Unknown error'}`,
        );
      }
    }
  }

  async getAttachment(
    accountId: string,
    emailId: string,
    filename: string,
  ): Promise<Buffer | null> {
    try {
      const key = this.getAttachmentKey(accountId, emailId, filename);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        return null;
      }
      const chunks: Buffer[] = [];
      const stream = response.Body as NodeJS.ReadableStream;
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        (('name' in error && (error as { name: string }).name === 'NoSuchKey') ||
          ('$metadata' in error &&
            (error as { $metadata: { httpStatusCode?: number } }).$metadata?.httpStatusCode ===
              404))
      ) {
        return null;
      }
      console.error('Error getting email attachment from S3:', error);
      throw new Error('Failed to get email attachment from S3');
    }
  }

  async deleteAttachment(accountId: string, emailId: string, filename: string): Promise<void> {
    try {
      const key = this.getAttachmentKey(accountId, emailId, filename);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`Email attachment deleted from S3: ${key}`);
    } catch (error) {
      console.error('Error deleting email attachment from S3:', error);
      throw new Error('Failed to delete email attachment from S3');
    }
  }

  async deleteAllAttachments(accountId: string, emailId: string): Promise<void> {
    try {
      const prefix = `${accountId}/email-attachments/${emailId}/`;

      // List all objects with the prefix
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const listResponse = await this.s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log(`No attachments found for email ${emailId}`);
        return;
      }

      // Delete all objects
      const deletePromises = listResponse.Contents.map(async (object) => {
        if (object.Key) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: object.Key,
          });
          await this.s3Client.send(deleteCommand);
        }
      });

      await Promise.all(deletePromises);
      console.log(`All email attachments deleted from S3 for email ${emailId}`);
    } catch (error) {
      console.error('Error deleting all email attachments from S3:', error);
      throw new Error('Failed to delete all email attachments from S3');
    }
  }
}

// Factory function to create the appropriate storage service
export function createStorageService(): StorageService {
  const storageProvider = process.env.STORAGE_PROVIDER || 'local';

  console.log(`Creating storage service with provider: ${storageProvider}`);

  switch (storageProvider.toLowerCase()) {
    case 's3':
      return new S3StorageService();
    case 'local':
    default:
      return new LocalStorageService();
  }
}
