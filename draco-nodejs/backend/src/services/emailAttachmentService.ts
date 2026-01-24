// Email Attachment Service
// Handles attachment upload, storage, and retrieval

import fs from 'fs/promises';

import { StorageService } from './storageService.js';
import {
  ATTACHMENT_CONFIG,
  validateAttachmentFile,
  validateAttachments,
  generateSafeFilename,
  getMimeTypeFromFilename,
  verifyFileType,
} from '../config/attachments.js';
import { NotFoundError, PayloadTooLargeError, ValidationError } from '../utils/customErrors.js';
import { AttachmentWithBuffer, ServerEmailAttachment } from '../interfaces/emailInterfaces.js';
import { AttachmentUploadResultType } from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { IEmailAttachmentRepository } from '../repositories/interfaces/IEmailAttachmentRepository.js';
import { dbCreateEmailAttachmentInput } from '../repositories/types/dbTypes.js';
import { ServiceFactory } from './serviceFactory.js';

export class EmailAttachmentService {
  private storageService: StorageService;
  private attachmentRepository: IEmailAttachmentRepository;

  constructor() {
    this.storageService = ServiceFactory.getStorageService();
    this.attachmentRepository = RepositoryFactory.getEmailAttachmentRepository();
  }

  /**
   * Upload attachment for an email
   */
  async uploadAttachment(
    accountId: string,
    emailId: string,
    file: Express.Multer.File,
    options?: { skipStatusCheck?: boolean },
  ): Promise<AttachmentUploadResultType> {
    // Validate file
    const validationError = validateAttachmentFile({
      mimetype: file.mimetype,
      size: file.size,
      originalname: file.originalname,
    });
    if (validationError) {
      throw new ValidationError(validationError);
    }

    // Check if email exists and belongs to account
    const email = await this.attachmentRepository.findEmail(BigInt(accountId), BigInt(emailId));

    if (!email) {
      throw new NotFoundError('Email not found');
    }

    // Check if email is in draft or scheduled status (can't add attachments to sent emails)
    // Skip this check when attachments are uploaded during compose (email is in 'sending' status)
    if (!options?.skipStatusCheck) {
      if (email.status !== 'draft' && email.status !== 'scheduled') {
        throw new ValidationError('Cannot add attachments to sent emails');
      }
    }

    // Check existing attachments count
    const existingAttachmentsCount = await this.attachmentRepository.countAttachments(
      BigInt(emailId),
    );

    if (existingAttachmentsCount >= 10) {
      throw new ValidationError('Maximum 10 attachments allowed per email');
    }

    // Generate safe filename
    const safeFilename = generateSafeFilename(file.originalname);

    // Save to storage
    const storagePath = await this.storageService.saveAttachment(
      accountId,
      emailId,
      safeFilename,
      file.buffer,
    );

    // Create database record
    const createPayload: dbCreateEmailAttachmentInput = {
      email_id: BigInt(emailId),
      filename: safeFilename,
      original_name: file.originalname,
      file_size: BigInt(file.size),
      mime_type:
        file.mimetype || getMimeTypeFromFilename(file.originalname) || 'application/octet-stream',
      storage_path: storagePath,
    };

    const attachment = await this.attachmentRepository.createAttachment(createPayload);

    return {
      id: attachment.id.toString(),
      filename: attachment.filename,
      originalName: attachment.original_name,
      fileSize: Number(attachment.file_size),
      mimeType: attachment.mime_type || 'application/octet-stream',
      storagePath: attachment.storage_path,
    };
  }

  /**
   * Upload multiple attachments
   */
  async uploadMultipleAttachments(
    accountId: string,
    emailId: string,
    files: Express.Multer.File[],
    options?: { skipStatusCheck?: boolean },
  ): Promise<AttachmentUploadResultType[]> {
    // Validate all files
    const validationError = validateAttachments(
      files.map((f) => ({
        mimetype: f.mimetype,
        size: f.size,
        originalname: f.originalname,
      })),
    );
    if (validationError) {
      throw new ValidationError(validationError);
    }

    // Upload each file
    const results: AttachmentUploadResultType[] = [];
    for (const file of files) {
      const result = await this.uploadAttachment(accountId, emailId, file, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Get attachment by ID
   */
  async getAttachment(
    accountId: string,
    emailId: string,
    attachmentId: string,
  ): Promise<AttachmentWithBuffer> {
    // Get attachment record
    const attachment = await this.attachmentRepository.findAttachment(
      BigInt(accountId),
      BigInt(emailId),
      BigInt(attachmentId),
    );

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    const buffer = await this.storageService.getAttachment(accountId, emailId, attachment.filename);

    if (!buffer) {
      throw new NotFoundError('Attachment file not found in storage');
    }

    return {
      attachment: {
        id: attachment.id.toString(),
        filename: attachment.filename,
        originalName: attachment.original_name,
        fileSize: Number(attachment.file_size),
        mimeType: attachment.mime_type,
        uploadedAt: attachment.uploaded_at,
      },
      buffer,
    };
  }

  /**
   * Get all attachments for an email
   */
  async getEmailAttachments(
    accountId: string,
    emailId: string,
  ): Promise<AttachmentUploadResultType[]> {
    // Check if email exists and belongs to account
    const email = await this.attachmentRepository.findEmail(BigInt(accountId), BigInt(emailId));

    if (!email) {
      throw new NotFoundError('Email not found');
    }

    // Get attachments
    const attachments = await this.attachmentRepository.findAttachments(BigInt(emailId));

    return attachments.map((att) => ({
      id: att.id.toString(),
      filename: att.filename,
      originalName: att.original_name,
      fileSize: Number(att.file_size),
      mimeType: att.mime_type || 'application/octet-stream',
      storagePath: att.storage_path,
    }));
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(accountId: string, emailId: string, attachmentId: string): Promise<void> {
    // Get attachment record
    const attachment = await this.attachmentRepository.findAttachment(
      BigInt(accountId),
      BigInt(emailId),
      BigInt(attachmentId),
    );

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    // Check if email is in draft or scheduled status
    if (attachment.email.status !== 'draft' && attachment.email.status !== 'scheduled') {
      throw new ValidationError('Cannot delete attachments from sent emails');
    }

    // Delete from storage
    await this.storageService.deleteAttachment(accountId, emailId, attachment.filename);

    // Delete from database
    await this.attachmentRepository.deleteAttachment(BigInt(attachmentId));
  }

  /**
   * Delete all attachments for an email
   */
  async deleteAllEmailAttachments(accountId: string, emailId: string): Promise<void> {
    // Check if email exists and belongs to account
    const email = await this.attachmentRepository.findEmail(BigInt(accountId), BigInt(emailId));

    if (!email) {
      throw new NotFoundError('Email not found');
    }

    // Delete from storage
    await this.storageService.deleteAllAttachments(accountId, emailId);

    // Delete from database
    await this.attachmentRepository.deleteAttachments(BigInt(emailId));
  }

  /**
   * Get attachments for email sending
   */
  async getAttachmentsForSending(emailId: string): Promise<ServerEmailAttachment[]> {
    // Get all attachments for the email
    const attachments = await this.attachmentRepository.findAttachmentsForSending(BigInt(emailId));

    const results: ServerEmailAttachment[] = [];
    for (const attachment of attachments) {
      const buffer = await this.storageService.getAttachment(
        attachment.email.account_id.toString(),
        emailId,
        attachment.filename,
      );

      if (buffer) {
        results.push({
          filename: attachment.original_name,
          content: buffer,
          contentType: attachment.mime_type || 'application/octet-stream',
        });
      }
    }

    return results;
  }

  /**
   * Copy attachments from one email to another (for templates)
   */
  async copyAttachments(fromEmailId: string, toEmailId: string, accountId: string): Promise<void> {
    const sourceAttachments = await this.attachmentRepository.findAttachmentsForCopy(
      BigInt(fromEmailId),
      BigInt(accountId),
    );

    for (const sourceAtt of sourceAttachments) {
      // Get the file from storage
      const buffer = await this.storageService.getAttachment(
        accountId,
        fromEmailId,
        sourceAtt.filename,
      );

      if (buffer) {
        // Save to new location
        const newFilename = generateSafeFilename(sourceAtt.original_name);
        const storagePath = await this.storageService.saveAttachment(
          accountId,
          toEmailId,
          newFilename,
          buffer,
        );

        // Create new database record
        await this.attachmentRepository.createAttachment({
          email_id: BigInt(toEmailId),
          filename: newFilename,
          original_name: sourceAtt.original_name,
          file_size: sourceAtt.file_size,
          mime_type: sourceAtt.mime_type,
          storage_path: storagePath,
        });
      }
    }
  }

  /**
   * Prepare attachments from disk storage and upload them.
   * Used when attachments are uploaded via multer disk storage (for memory efficiency).
   * Validates total size, loads files sequentially, uploads, then cleans up temp files.
   */
  async prepareAndUploadFromDisk(
    accountId: string,
    emailId: string,
    rawFiles: Express.Multer.File[],
    options?: { skipStatusCheck?: boolean },
  ): Promise<AttachmentUploadResultType[]> {
    if (!rawFiles.length) {
      return [];
    }

    const totalSize = rawFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > ATTACHMENT_CONFIG.MAX_TOTAL_ATTACHMENTS_SIZE) {
      const maxSizeMB = ATTACHMENT_CONFIG.MAX_TOTAL_ATTACHMENTS_SIZE / (1024 * 1024);
      await this.cleanupTempFiles(rawFiles);
      throw new PayloadTooLargeError(`Total attachment size exceeds maximum of ${maxSizeMB}MB`);
    }

    const filesWithBuffers = await this.loadFileBuffers(rawFiles);

    // Verify file types using magic numbers to prevent MIME type spoofing
    for (const file of filesWithBuffers) {
      const verification = await verifyFileType(file.buffer, file.mimetype);
      if (!verification.valid) {
        await this.cleanupTempFiles(rawFiles);
        throw new ValidationError(verification.error || 'Invalid file type');
      }
    }

    try {
      return await this.uploadMultipleAttachments(accountId, emailId, filesWithBuffers, options);
    } finally {
      await this.cleanupTempFiles(rawFiles);
    }
  }

  /**
   * Read file buffers from disk sequentially to reduce memory pressure.
   * Processing one at a time avoids loading all files into memory simultaneously.
   */
  private async loadFileBuffers(files: Express.Multer.File[]): Promise<Express.Multer.File[]> {
    const result: Express.Multer.File[] = [];
    try {
      for (const file of files) {
        if (!file.path) {
          throw new ValidationError(`File path missing for uploaded file: ${file.originalname}`);
        }
        const buffer = await fs.readFile(file.path);
        result.push({ ...file, buffer });
      }
      return result;
    } catch (error) {
      // Clean up temp files on failure to prevent disk leak
      await this.cleanupTempFiles(files);
      throw error;
    }
  }

  /**
   * Clean up temporary files after request processing.
   */
  private async cleanupTempFiles(files: Express.Multer.File[]): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        try {
          if (file.path) {
            await fs.unlink(file.path);
          }
        } catch (error) {
          console.warn('Failed to cleanup temp file', {
            path: file.path,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }),
    );
  }
}
