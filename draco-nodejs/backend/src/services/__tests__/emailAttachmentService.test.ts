import { EmailAttachmentService } from '../emailAttachmentService.js';
import { createStorageService } from '../storageService.js';
import { NotFoundError, ValidationError } from '../../utils/customErrors.js';
import { vi, describe, it, expect, beforeEach, afterEach, type MockedFunction } from 'vitest';

// Mock dependencies
vi.mock('../storageService.js', () => ({
  createStorageService: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  default: {
    emails: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    email_attachments: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../../config/attachments.js', () => ({
  validateAttachmentFile: vi.fn(),
  validateAttachments: vi.fn(),
  generateSafeFilename: vi.fn(),
  getMimeTypeFromFilename: vi.fn(),
}));

// Import mocked modules
import prisma from '../../lib/prisma.js';
import {
  validateAttachmentFile,
  validateAttachments,
  generateSafeFilename,
  getMimeTypeFromFilename,
} from '../../config/attachments.js';

describe('EmailAttachmentService', () => {
  let service: EmailAttachmentService;
  let mockStorageService: any;

  // Mock file objects
  const mockFile: Express.Multer.File = {
    fieldname: 'attachment',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('mock pdf content'),
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    stream: {} as any,
  };

  // Test files for specific validation scenarios (unused in current tests but kept for future expansion)

  beforeEach(() => {
    // Setup storage service mock
    mockStorageService = {
      saveAttachment: vi.fn(),
      getAttachment: vi.fn(),
      deleteAttachment: vi.fn(),
      deleteAllAttachments: vi.fn(),
    };
    (createStorageService as MockedFunction<typeof createStorageService>).mockReturnValue(
      mockStorageService,
    );

    // Setup validation mocks
    (validateAttachmentFile as MockedFunction<typeof validateAttachmentFile>).mockReturnValue(null);
    (validateAttachments as MockedFunction<typeof validateAttachments>).mockReturnValue(null);
    (generateSafeFilename as MockedFunction<typeof generateSafeFilename>).mockReturnValue(
      'test-document_1234567890.pdf',
    );
    (getMimeTypeFromFilename as MockedFunction<typeof getMimeTypeFromFilename>).mockReturnValue(
      'application/pdf',
    );

    service = new EmailAttachmentService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadAttachment', () => {
    const accountId = '123';
    const emailId = '456';

    beforeEach(() => {
      // Mock email exists and is in draft status
      (prisma.emails.findFirst as MockedFunction<any>).mockResolvedValue({
        id: BigInt(456),
        account_id: BigInt(123),
        status: 'draft',
      });

      // Mock attachment count
      (prisma.email_attachments.count as MockedFunction<any>).mockResolvedValue(2);

      // Mock storage service save
      mockStorageService.saveAttachment.mockResolvedValue('storage/path/test-document.pdf');

      // Mock database create
      (prisma.email_attachments.create as MockedFunction<any>).mockResolvedValue({
        id: BigInt(789),
        filename: 'test-document_1234567890.pdf',
        original_name: 'test-document.pdf',
        file_size: BigInt(1024),
        mime_type: 'application/pdf',
        storage_path: 'storage/path/test-document.pdf',
      });
    });

    it('should upload attachment successfully', async () => {
      const result = await service.uploadAttachment(accountId, emailId, mockFile);

      expect(result).toEqual({
        id: '789',
        filename: 'test-document_1234567890.pdf',
        originalName: 'test-document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        storagePath: 'storage/path/test-document.pdf',
      });

      expect(validateAttachmentFile).toHaveBeenCalledWith({
        mimetype: 'application/pdf',
        size: 1024,
        originalname: 'test-document.pdf',
      });
      expect(mockStorageService.saveAttachment).toHaveBeenCalledWith(
        accountId,
        emailId,
        'test-document_1234567890.pdf',
        mockFile.buffer,
      );
      expect(prisma.email_attachments.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid file', async () => {
      (validateAttachmentFile as MockedFunction<typeof validateAttachmentFile>).mockReturnValue(
        'File too large',
      );

      await expect(service.uploadAttachment(accountId, emailId, mockFile)).rejects.toThrow(
        ValidationError,
      );
      await expect(service.uploadAttachment(accountId, emailId, mockFile)).rejects.toThrow(
        'File too large',
      );

      expect(mockStorageService.saveAttachment).not.toHaveBeenCalled();
      expect(prisma.email_attachments.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError for non-existent email', async () => {
      (prisma.emails.findFirst as MockedFunction<any>).mockResolvedValue(null);

      await expect(service.uploadAttachment(accountId, emailId, mockFile)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.uploadAttachment(accountId, emailId, mockFile)).rejects.toThrow(
        'Email not found',
      );
    });

    it('should throw ValidationError for sent email', async () => {
      (prisma.emails.findFirst as MockedFunction<any>).mockResolvedValue({
        id: BigInt(456),
        account_id: BigInt(123),
        status: 'sent',
      });

      await expect(service.uploadAttachment(accountId, emailId, mockFile)).rejects.toThrow(
        ValidationError,
      );
      await expect(service.uploadAttachment(accountId, emailId, mockFile)).rejects.toThrow(
        'Cannot add attachments to sent emails',
      );
    });

    it('should throw ValidationError when attachment limit exceeded', async () => {
      (prisma.email_attachments.count as MockedFunction<any>).mockResolvedValue(10);

      await expect(service.uploadAttachment(accountId, emailId, mockFile)).rejects.toThrow(
        ValidationError,
      );
      await expect(service.uploadAttachment(accountId, emailId, mockFile)).rejects.toThrow(
        'Maximum 10 attachments allowed per email',
      );
    });
  });

  describe('uploadMultipleAttachments', () => {
    const accountId = '123';
    const emailId = '456';
    const mockFiles = [mockFile, { ...mockFile, originalname: 'document2.txt' }];

    beforeEach(() => {
      // Mock successful single uploads
      service.uploadAttachment = vi.fn().mockImplementation((aid, eid, file) => ({
        id: '789',
        filename: `${file.originalname}_safe`,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: `storage/path/${file.originalname}`,
      }));
    });

    it('should upload multiple attachments successfully', async () => {
      const results = await service.uploadMultipleAttachments(accountId, emailId, mockFiles);

      expect(results).toHaveLength(2);
      expect(service.uploadAttachment).toHaveBeenCalledTimes(2);
      expect(validateAttachments).toHaveBeenCalledWith([
        { mimetype: mockFile.mimetype, size: mockFile.size, originalname: mockFile.originalname },
        {
          mimetype: mockFiles[1].mimetype,
          size: mockFiles[1].size,
          originalname: mockFiles[1].originalname,
        },
      ]);
    });

    it('should throw ValidationError for invalid batch', async () => {
      (validateAttachments as MockedFunction<typeof validateAttachments>).mockReturnValue(
        'Too many files',
      );

      await expect(
        service.uploadMultipleAttachments(accountId, emailId, mockFiles),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.uploadMultipleAttachments(accountId, emailId, mockFiles),
      ).rejects.toThrow('Too many files');

      expect(service.uploadAttachment).not.toHaveBeenCalled();
    });
  });

  describe('getAttachment', () => {
    const accountId = '123';
    const emailId = '456';
    const attachmentId = '789';

    beforeEach(() => {
      // Mock attachment record
      (prisma.email_attachments.findFirst as MockedFunction<any>).mockResolvedValue({
        id: BigInt(789),
        filename: 'test-document_safe.pdf',
        original_name: 'test-document.pdf',
        file_size: BigInt(1024),
        mime_type: 'application/pdf',
        uploaded_at: new Date('2024-01-01T10:00:00Z'),
      });

      // Mock storage service
      mockStorageService.getAttachment.mockResolvedValue(Buffer.from('file content'));
    });

    it('should get attachment with buffer successfully', async () => {
      const result = await service.getAttachment(accountId, emailId, attachmentId);

      expect(result).toEqual({
        attachment: {
          id: '789',
          filename: 'test-document_safe.pdf',
          originalName: 'test-document.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedAt: new Date('2024-01-01T10:00:00Z'),
        },
        buffer: Buffer.from('file content'),
      });

      expect(prisma.email_attachments.findFirst).toHaveBeenCalledWith({
        where: {
          id: BigInt(789),
          email_id: BigInt(456),
          email: { account_id: BigInt(123) },
        },
      });
      expect(mockStorageService.getAttachment).toHaveBeenCalledWith(
        accountId,
        emailId,
        'test-document_safe.pdf',
      );
    });

    it('should throw NotFoundError for non-existent attachment', async () => {
      (prisma.email_attachments.findFirst as MockedFunction<any>).mockResolvedValue(null);

      await expect(service.getAttachment(accountId, emailId, attachmentId)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getAttachment(accountId, emailId, attachmentId)).rejects.toThrow(
        'Attachment not found',
      );
    });

    it('should throw NotFoundError when file not in storage', async () => {
      mockStorageService.getAttachment.mockResolvedValue(null);

      await expect(service.getAttachment(accountId, emailId, attachmentId)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getAttachment(accountId, emailId, attachmentId)).rejects.toThrow(
        'Attachment file not found in storage',
      );
    });
  });

  describe('getEmailAttachments', () => {
    const accountId = '123';
    const emailId = '456';

    beforeEach(() => {
      // Mock email exists
      (prisma.emails.findFirst as MockedFunction<any>).mockResolvedValue({
        id: BigInt(456),
        account_id: BigInt(123),
      });

      // Mock attachments
      (prisma.email_attachments.findMany as MockedFunction<any>).mockResolvedValue([
        {
          id: BigInt(789),
          filename: 'doc1_safe.pdf',
          original_name: 'doc1.pdf',
          file_size: BigInt(1024),
          mime_type: 'application/pdf',
          storage_path: 'storage/path/doc1.pdf',
        },
        {
          id: BigInt(790),
          filename: 'doc2_safe.txt',
          original_name: 'doc2.txt',
          file_size: BigInt(512),
          mime_type: 'text/plain',
          storage_path: 'storage/path/doc2.txt',
        },
      ]);
    });

    it('should list email attachments successfully', async () => {
      const results = await service.getEmailAttachments(accountId, emailId);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: '789',
        filename: 'doc1_safe.pdf',
        originalName: 'doc1.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        storagePath: 'storage/path/doc1.pdf',
      });
      expect(results[1]).toEqual({
        id: '790',
        filename: 'doc2_safe.txt',
        originalName: 'doc2.txt',
        fileSize: 512,
        mimeType: 'text/plain',
        storagePath: 'storage/path/doc2.txt',
      });

      expect(prisma.email_attachments.findMany).toHaveBeenCalledWith({
        where: { email_id: BigInt(456) },
        orderBy: { uploaded_at: 'asc' },
      });
    });

    it('should throw NotFoundError for non-existent email', async () => {
      (prisma.emails.findFirst as MockedFunction<any>).mockResolvedValue(null);

      await expect(service.getEmailAttachments(accountId, emailId)).rejects.toThrow(NotFoundError);
      await expect(service.getEmailAttachments(accountId, emailId)).rejects.toThrow(
        'Email not found',
      );
    });
  });

  describe('deleteAttachment', () => {
    const accountId = '123';
    const emailId = '456';
    const attachmentId = '789';

    beforeEach(() => {
      // Mock attachment with draft email
      (prisma.email_attachments.findFirst as MockedFunction<any>).mockResolvedValue({
        id: BigInt(789),
        filename: 'test-document_safe.pdf',
        email: { status: 'draft' },
      });
    });

    it('should delete attachment successfully', async () => {
      await service.deleteAttachment(accountId, emailId, attachmentId);

      expect(mockStorageService.deleteAttachment).toHaveBeenCalledWith(
        accountId,
        emailId,
        'test-document_safe.pdf',
      );
      expect(prisma.email_attachments.delete).toHaveBeenCalledWith({
        where: { id: BigInt(789) },
      });
    });

    it('should throw NotFoundError for non-existent attachment', async () => {
      (prisma.email_attachments.findFirst as MockedFunction<any>).mockResolvedValue(null);

      await expect(service.deleteAttachment(accountId, emailId, attachmentId)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.deleteAttachment(accountId, emailId, attachmentId)).rejects.toThrow(
        'Attachment not found',
      );
    });

    it('should throw ValidationError for sent email', async () => {
      (prisma.email_attachments.findFirst as MockedFunction<any>).mockResolvedValue({
        id: BigInt(789),
        filename: 'test-document_safe.pdf',
        email: { status: 'sent' },
      });

      await expect(service.deleteAttachment(accountId, emailId, attachmentId)).rejects.toThrow(
        ValidationError,
      );
      await expect(service.deleteAttachment(accountId, emailId, attachmentId)).rejects.toThrow(
        'Cannot delete attachments from sent emails',
      );
    });
  });

  describe('getAttachmentsForSending', () => {
    const emailId = '456';

    beforeEach(() => {
      // Mock attachments
      (prisma.email_attachments.findMany as MockedFunction<any>).mockResolvedValue([
        {
          email_id: BigInt(456),
          filename: 'doc1_safe.pdf',
          original_name: 'doc1.pdf',
          mime_type: 'application/pdf',
        },
      ]);

      // Mock email
      (prisma.emails.findUnique as MockedFunction<any>).mockResolvedValue({
        id: BigInt(456),
        account_id: BigInt(123),
      });

      // Mock storage service
      mockStorageService.getAttachment.mockResolvedValue(Buffer.from('file content'));
    });

    it('should get attachments formatted for email sending', async () => {
      const results = await service.getAttachmentsForSending(emailId);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        filename: 'doc1.pdf',
        content: Buffer.from('file content'),
        contentType: 'application/pdf',
      });

      expect(mockStorageService.getAttachment).toHaveBeenCalledWith(
        '123',
        emailId,
        'doc1_safe.pdf',
      );
    });

    it('should handle missing files gracefully', async () => {
      mockStorageService.getAttachment.mockResolvedValue(null);

      const results = await service.getAttachmentsForSending(emailId);

      expect(results).toHaveLength(0);
    });
  });
});
