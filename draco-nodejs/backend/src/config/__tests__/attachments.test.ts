import { describe, it, expect } from 'vitest';
import {
  ATTACHMENT_CONFIG,
  validateAttachmentFile,
  validateAttachments,
  generateSafeFilename,
  getMimeTypeFromFilename,
} from '../attachments.js';

describe('Attachment Configuration', () => {
  describe('ATTACHMENT_CONFIG', () => {
    it('should have correct configuration values', () => {
      expect(ATTACHMENT_CONFIG.MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
      expect(ATTACHMENT_CONFIG.MAX_ATTACHMENTS_PER_EMAIL).toBe(10);
      expect(ATTACHMENT_CONFIG.MAX_TOTAL_ATTACHMENTS_SIZE).toBe(25 * 1024 * 1024); // 25MB
      expect(ATTACHMENT_CONFIG.ALLOWED_MIME_TYPES).toContain('application/pdf');
      expect(ATTACHMENT_CONFIG.ALLOWED_MIME_TYPES).toContain('image/jpeg');
      expect(ATTACHMENT_CONFIG.ALLOWED_EXTENSIONS).toContain('.pdf');
      expect(ATTACHMENT_CONFIG.ALLOWED_EXTENSIONS).toContain('.jpg');
    });
  });

  describe('validateAttachmentFile', () => {
    it('should accept valid PDF file', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 1024 * 1024, // 1MB
        originalname: 'document.pdf',
      };

      const result = validateAttachmentFile(file);
      expect(result).toBeNull();
    });

    it('should accept valid image file', () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 512 * 1024, // 512KB
        originalname: 'photo.jpg',
      };

      const result = validateAttachmentFile(file);
      expect(result).toBeNull();
    });

    it('should reject file exceeding size limit', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 15 * 1024 * 1024, // 15MB - exceeds 10MB limit
        originalname: 'large-document.pdf',
      };

      const result = validateAttachmentFile(file);
      expect(result).toBe('File size exceeds maximum allowed size of 10MB');
    });

    it('should reject disallowed MIME type', () => {
      const file = {
        mimetype: 'application/exe',
        size: 1024,
        originalname: 'malware.exe',
      };

      const result = validateAttachmentFile(file);
      expect(result).toBe("File type 'application/exe' is not allowed");
    });

    it('should reject disallowed file extension', () => {
      const file = {
        mimetype: 'application/pdf', // MIME type is OK
        size: 1024,
        originalname: 'document.exe', // But extension is not
      };

      const result = validateAttachmentFile(file);
      expect(result).toBe("File extension '.exe' is not allowed");
    });

    it('should handle missing file', () => {
      const result = validateAttachmentFile(null as any);
      expect(result).toBe('No file provided');
    });

    it('should handle file without extension', () => {
      const file = {
        mimetype: 'text/plain',
        size: 1024,
        originalname: 'README', // No extension
      };

      const result = validateAttachmentFile(file);
      expect(result).toBeNull(); // Should pass if MIME type is valid
    });

    it('should handle case-insensitive extension matching', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 1024,
        originalname: 'document.PDF', // Uppercase extension
      };

      const result = validateAttachmentFile(file);
      expect(result).toBeNull();
    });
  });

  describe('validateAttachments', () => {
    it('should accept empty array', () => {
      const result = validateAttachments([]);
      expect(result).toBeNull();
    });

    it('should accept valid files array', () => {
      const files = [
        { mimetype: 'application/pdf', size: 1024, originalname: 'doc1.pdf' },
        { mimetype: 'image/jpeg', size: 2048, originalname: 'image.jpg' },
        { mimetype: 'text/plain', size: 512, originalname: 'notes.txt' },
      ];

      const result = validateAttachments(files);
      expect(result).toBeNull();
    });

    it('should reject too many files', () => {
      const files = Array(15).fill({
        mimetype: 'text/plain',
        size: 1024,
        originalname: 'file.txt',
      });

      const result = validateAttachments(files);
      expect(result).toBe('Maximum 10 attachments allowed per email');
    });

    it('should reject total size exceeding limit', () => {
      const files = [
        { mimetype: 'application/pdf', size: 15 * 1024 * 1024, originalname: 'large1.pdf' }, // 15MB
        { mimetype: 'application/pdf', size: 15 * 1024 * 1024, originalname: 'large2.pdf' }, // 15MB - Total 30MB
      ];

      const result = validateAttachments(files);
      expect(result).toBe('Total attachment size exceeds maximum allowed size of 25MB');
    });

    it('should reject individual invalid file in array', () => {
      const files = [
        { mimetype: 'application/pdf', size: 1024, originalname: 'valid.pdf' },
        { mimetype: 'application/exe', size: 1024, originalname: 'invalid.exe' },
      ];

      const result = validateAttachments(files);
      expect(result).toBe("File type 'application/exe' is not allowed");
    });

    it('should handle missing file properties gracefully', () => {
      const files = [
        { mimetype: 'application/pdf', originalname: 'doc.pdf' }, // Missing size
      ];

      const result = validateAttachments(files);
      expect(result).toBeNull(); // Should pass with size treated as 0
    });
  });

  describe('generateSafeFilename', () => {
    it('should generate safe filename with timestamp', () => {
      const originalName = 'My Document.pdf';
      const result = generateSafeFilename(originalName);

      expect(result).toMatch(/^My_Document_\d+\.pdf$/);
      expect(result).not.toContain(' ');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
    });

    it('should handle special characters', () => {
      const originalName = 'File@Name#With$Special%Characters!.txt';
      const result = generateSafeFilename(originalName);

      expect(result).toMatch(/^File_Name_With_Special_Characters_+\d+\.txt$/);
    });

    it('should handle unicode characters', () => {
      const originalName = 'Файл с русскими символами.pdf';
      const result = generateSafeFilename(originalName);

      expect(result).toMatch(/^[a-zA-Z0-9_]+_\d+\.pdf$/);
    });

    it('should limit filename length', () => {
      const longName = 'A'.repeat(100) + '.txt';
      const result = generateSafeFilename(longName);

      // Should be limited to 50 chars base name + timestamp + extension
      const baseName = result.replace(/_\d+\.txt$/, '');
      expect(baseName.length).toBeLessThanOrEqual(50);
    });

    it('should handle files without extension', () => {
      const originalName = 'README';
      const result = generateSafeFilename(originalName);

      expect(result).toMatch(/^README_\d+$/);
      expect(result).not.toContain('.');
    });

    it('should preserve common file extensions', () => {
      const testCases = [
        { input: 'doc.pdf', expected: /\.pdf$/ },
        { input: 'image.jpg', expected: /\.jpg$/ },
        { input: 'archive.zip', expected: /\.zip$/ },
        { input: 'data.json', expected: /\.json$/ },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = generateSafeFilename(input);
        expect(result).toMatch(expected);
      });
    });
  });

  describe('getMimeTypeFromFilename', () => {
    it('should return correct MIME types for common extensions', () => {
      const testCases = [
        { filename: 'document.pdf', expected: 'application/pdf' },
        { filename: 'image.jpg', expected: 'image/jpeg' },
        { filename: 'image.jpeg', expected: 'image/jpeg' },
        { filename: 'image.png', expected: 'image/png' },
        { filename: 'data.json', expected: 'application/json' },
        { filename: 'notes.txt', expected: 'text/plain' },
        {
          filename: 'spreadsheet.xlsx',
          expected: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        {
          filename: 'presentation.pptx',
          expected: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
      ];

      testCases.forEach(({ filename, expected }) => {
        const result = getMimeTypeFromFilename(filename);
        expect(result).toBe(expected);
      });
    });

    it('should handle case-insensitive extensions', () => {
      expect(getMimeTypeFromFilename('Document.PDF')).toBe('application/pdf');
      expect(getMimeTypeFromFilename('Image.JPG')).toBe('image/jpeg');
      expect(getMimeTypeFromFilename('NOTES.TXT')).toBe('text/plain');
    });

    it('should return undefined for unknown extensions', () => {
      expect(getMimeTypeFromFilename('file.unknown')).toBeUndefined();
      expect(getMimeTypeFromFilename('malware.exe')).toBeUndefined();
    });

    it('should return undefined for files without extension', () => {
      expect(getMimeTypeFromFilename('README')).toBeUndefined();
      expect(getMimeTypeFromFilename('Makefile')).toBeUndefined();
    });

    it('should handle multiple dots in filename', () => {
      expect(getMimeTypeFromFilename('file.backup.pdf')).toBe('application/pdf');
      expect(getMimeTypeFromFilename('data.2024.json')).toBe('application/json');
    });

    it('should handle empty filename', () => {
      expect(getMimeTypeFromFilename('')).toBeUndefined();
    });

    it('should handle filename with only extension', () => {
      expect(getMimeTypeFromFilename('.pdf')).toBe('application/pdf');
      expect(getMimeTypeFromFilename('.gitignore')).toBeUndefined();
    });
  });
});
