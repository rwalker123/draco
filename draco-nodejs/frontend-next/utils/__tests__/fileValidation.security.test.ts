/**
 * Security-focused test suite for file validation utilities
 * Tests critical security vulnerabilities and their fixes
 */

import {
  validateFileSecure,
  validateFilesSecure,
  validateFilePath,
  validateMimeType,
  validateFileContent,
} from '../fileValidation';

// Mock File API for testing
class MockFile {
  name: string;
  type: string;
  size: number;

  constructor(name: string, type: string, size: number = 1024) {
    this.name = name;
    this.type = type;
    this.size = size;
  }

  slice(_start: number, _end: number): { arrayBuffer: () => Promise<ArrayBuffer> } {
    // Mock different file signatures based on type (4100 bytes for file-type library)
    const signatures: { [key: string]: number[] } = {
      'image/jpeg': [0xff, 0xd8, 0xff, 0xe0],
      'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      'image/gif': [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
      'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d],
      'application/zip': [0x50, 0x4b, 0x03, 0x04],
      'text/plain': [0x48, 0x65, 0x6c, 0x6c, 0x6f], // "Hello"
    };

    const signature = signatures[this.type] || [0x00, 0x00, 0x00, 0x00];

    // Create array buffer with appropriate signature (4100 bytes for file-type library)
    const bufferSize = Math.max(_end - _start, 4100);
    const buffer = new ArrayBuffer(bufferSize);
    const view = new Uint8Array(buffer);
    signature.forEach((byte, index) => {
      if (index < bufferSize) view[index] = byte;
    });

    return {
      arrayBuffer: () => Promise.resolve(buffer),
    };
  }
}

// Mock malicious file with script content
class MockMaliciousFile extends MockFile {
  slice(_start: number, _end: number): { arrayBuffer: () => Promise<ArrayBuffer> } {
    const maliciousContent = '<script>alert("xss")</script>';
    const encoder = new TextEncoder();
    const maliciousBuffer = encoder.encode(maliciousContent);

    // Create 4100-byte buffer for file-type library with malicious content at start
    const bufferSize = Math.max(_end - _start, 4100);
    const buffer = new ArrayBuffer(bufferSize);
    const view = new Uint8Array(buffer);

    // Copy malicious content to beginning of buffer
    maliciousBuffer.forEach((byte, index) => {
      if (index < bufferSize) view[index] = byte;
    });

    return {
      arrayBuffer: () => Promise.resolve(buffer),
    };
  }
}

describe('File Security Tests', () => {
  describe('validateFilePath - Path Traversal Protection', () => {
    test('should block basic path traversal attempts', () => {
      expect(validateFilePath('../../../etc/passwd')).toEqual({
        isValid: false,
        error: 'Filename contains illegal path traversal sequences',
        securityRisk: true,
      });

      expect(validateFilePath('..\\..\\..\\windows\\system32\\config\\sam')).toEqual({
        isValid: false,
        error: 'Filename contains illegal path traversal sequences',
        securityRisk: true,
      });

      expect(validateFilePath('test/../config.txt')).toEqual({
        isValid: false,
        error: 'Filename contains illegal path traversal sequences',
        securityRisk: true,
      });
    });

    test('should block URL-encoded path traversal', () => {
      expect(validateFilePath('%2e%2e%2fconfig.txt')).toEqual({
        isValid: false,
        error: 'Filename contains illegal path traversal sequences',
        securityRisk: true,
      });

      expect(validateFilePath('%2e%2e%5cconfig.txt')).toEqual({
        isValid: false,
        error: 'Filename contains illegal path traversal sequences',
        securityRisk: true,
      });
    });

    test('should block double URL-encoded path traversal', () => {
      expect(validateFilePath('%252e%252e%252fconfig.txt')).toEqual({
        isValid: false,
        error: 'Filename contains illegal path traversal sequences',
        securityRisk: true,
      });
    });

    test('should block absolute paths', () => {
      expect(validateFilePath('/etc/passwd')).toEqual({
        isValid: false,
        error: 'Absolute paths are not allowed',
        securityRisk: true,
      });

      expect(validateFilePath('C:\\Windows\\System32\\config\\sam')).toEqual({
        isValid: false,
        error: 'Absolute paths are not allowed',
        securityRisk: true,
      });

      expect(validateFilePath('D:\\sensitive\\data.txt')).toEqual({
        isValid: false,
        error: 'Absolute paths are not allowed',
        securityRisk: true,
      });
    });

    test('should block null bytes and control characters', () => {
      expect(validateFilePath('file\0.txt')).toEqual({
        isValid: false,
        error: 'Filename contains illegal path traversal sequences',
        securityRisk: true,
      });

      expect(validateFilePath('file\x01.txt')).toEqual({
        isValid: false,
        error: 'Filename contains illegal path traversal sequences',
        securityRisk: true,
      });
    });

    test('should block reserved Windows filenames', () => {
      const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'LPT1', 'LPT2'];

      reservedNames.forEach((name) => {
        expect(validateFilePath(`${name}.txt`)).toEqual({
          isValid: false,
          error: 'Filename uses reserved system name',
          securityRisk: true,
        });

        expect(validateFilePath(`${name.toLowerCase()}.txt`)).toEqual({
          isValid: false,
          error: 'Filename uses reserved system name',
          securityRisk: true,
        });
      });
    });

    test('should reject overly long filenames', () => {
      const longName = 'a'.repeat(256) + '.txt';
      expect(validateFilePath(longName)).toEqual({
        isValid: false,
        error: 'Filename too long (max 255 characters)',
      });
    });

    test('should allow valid filenames', () => {
      expect(validateFilePath('document.pdf')).toEqual({ isValid: true });
      expect(validateFilePath('image_2024.jpg')).toEqual({ isValid: true });
      expect(validateFilePath('my-file-name.txt')).toEqual({ isValid: true });
    });
  });

  describe('validateMimeType - MIME Type Validation', () => {
    test('should validate matching MIME types and extensions', () => {
      const jpegFile = new MockFile('image.jpg', 'image/jpeg') as File;
      expect(validateMimeType(jpegFile)).toEqual({ isValid: true });

      const pdfFile = new MockFile('document.pdf', 'application/pdf') as File;
      expect(validateMimeType(pdfFile)).toEqual({ isValid: true });
    });

    test('should reject mismatched MIME types and extensions', () => {
      const mismatchedFile = new MockFile('image.jpg', 'application/pdf') as File;
      expect(validateMimeType(mismatchedFile)).toEqual({
        isValid: false,
        error: "MIME type 'application/pdf' does not match file extension '.jpg'",
      });
    });

    test('should reject unknown file types', () => {
      const unknownFile = new MockFile('script.php', 'application/x-php') as File;
      expect(validateMimeType(unknownFile)).toEqual({
        isValid: false,
        error: "File type '.php' is not allowed",
      });
    });

    test('should require file extensions', () => {
      const noExtFile = new MockFile('filename', 'text/plain') as File;
      expect(validateMimeType(noExtFile)).toEqual({
        isValid: false,
        error: 'File extension required',
      });
    });
  });

  describe('validateFileContent - Content Validation', () => {
    test('should validate file signatures', async () => {
      const jpegFile = new MockFile('image.jpg', 'image/jpeg') as File;
      const result = await validateFileContent(jpegFile);
      expect(result).toEqual({ isValid: true });

      const pdfFile = new MockFile('document.pdf', 'application/pdf') as File;
      const pdfResult = await validateFileContent(pdfFile);
      expect(pdfResult).toEqual({ isValid: true });
    });

    test('should reject files with invalid signatures', async () => {
      const fakeJpeg = new MockFile('fake.jpg', 'image/jpeg', 1024);
      // Override slice to return wrong signature (4100 bytes for file-type library)
      fakeJpeg.slice = () => ({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4100)),
      });

      const result = await validateFileContent(fakeJpeg as File);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unable to determine actual file type from content');
    });

    test('should detect embedded scripts in images', async () => {
      const maliciousImage = new MockMaliciousFile('evil.jpg', 'image/jpeg') as File;
      const result = await validateFileContent(maliciousImage);
      expect(result).toEqual({
        isValid: false,
        error: 'File contains potentially malicious content',
      });
    });

    test('should detect script patterns in files', async () => {
      const scriptPatterns = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'vbscript:msgbox("xss")',
        'onload=alert("xss")',
        'onerror=alert("xss")',
        '%3cscript%3ealert("xss")%3c/script%3e',
      ];

      for (const pattern of scriptPatterns) {
        const maliciousFile = new MockFile('test.jpg', 'image/jpeg');
        maliciousFile.slice = () => ({
          arrayBuffer: () => {
            const encoder = new TextEncoder();
            const maliciousBuffer = encoder.encode(pattern);

            // Create 4100-byte buffer with malicious content at start
            const bufferSize = 4100;
            const buffer = new ArrayBuffer(bufferSize);
            const view = new Uint8Array(buffer);

            // Copy malicious content to beginning of buffer
            maliciousBuffer.forEach((byte, index) => {
              if (index < bufferSize) view[index] = byte;
            });

            return Promise.resolve(buffer);
          },
        });

        const result = await validateFileContent(maliciousFile as File);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('File contains potentially malicious content');
      }
    });
  });

  describe('validateFileSecure - Comprehensive Security', () => {
    test('should block dangerous file extensions', async () => {
      const dangerousFiles = [
        new MockFile('virus.exe', 'application/x-msdownload'),
        new MockFile('script.bat', 'application/x-bat'),
        new MockFile('malware.scr', 'application/x-msdownload'),
        new MockFile('trojan.com', 'application/x-msdownload'),
        new MockFile('evil.vbs', 'text/vbscript'),
        new MockFile('hack.js', 'application/javascript'),
        new MockFile('backdoor.php', 'application/x-php'),
        new MockFile('shell.jsp', 'text/plain'),
      ];

      for (const file of dangerousFiles) {
        const result = await validateFileSecure(file as File, ['*']);
        expect(result.securityRisk).toBe(true);
        expect(result.error).toBe('File type not allowed for security reasons');
      }
    });

    test('should block suspicious file names', async () => {
      const suspiciousFiles = [
        new MockFile('.htaccess', 'text/plain'),
        new MockFile('file.php.jpg', 'image/jpeg'),
        new MockFile('script javascript.txt', 'text/plain'),
        new MockFile('evil.bat.txt', 'text/plain'),
      ];

      for (const file of suspiciousFiles) {
        const result = await validateFileSecure(file as File, ['text/plain', 'image/jpeg']);
        expect(result.securityRisk).toBe(true);
        expect(result.error).toBe('Suspicious file name detected');
      }
    });

    test('should enforce size limits', async () => {
      const largeFile = new MockFile('large.jpg', 'image/jpeg', 50 * 1024 * 1024 + 1);
      const result = await validateFileSecure(largeFile as File, ['image/jpeg']);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    test('should reject empty files', async () => {
      const emptyFile = new MockFile('empty.txt', 'text/plain', 0);
      const result = await validateFileSecure(emptyFile as File, ['text/plain']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Empty files are not allowed');
    });

    test('should validate path traversal in file names', async () => {
      const traversalFile = new MockFile('../../../etc/passwd.txt', 'text/plain');
      const result = await validateFileSecure(traversalFile as File, ['text/plain']);
      expect(result.securityRisk).toBe(true);
      expect(result.error).toBe('Filename contains illegal path traversal sequences');
    });

    test('should allow valid files', async () => {
      const validFile = new MockFile('document.pdf', 'application/pdf', 1024 * 1024);
      const result = await validateFileSecure(validFile as File, ['application/pdf']);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateFilesSecure - Batch Validation', () => {
    test('should validate multiple files and report security risks', async () => {
      const files = [
        new MockFile('valid.pdf', 'application/pdf', 1024),
        new MockFile('virus.exe', 'application/x-msdownload', 1024),
        new MockFile('image.jpg', 'image/jpeg', 1024),
        new MockFile('../../../etc/passwd.txt', 'text/plain', 1024),
      ];

      const result = await validateFilesSecure(files as File[], [
        'application/pdf',
        'image/jpeg',
        'text/plain',
      ]);

      expect(result.validFiles).toHaveLength(2);
      expect(result.errors).toHaveLength(2);
      expect(result.securityRisks).toHaveLength(2);

      expect(result.securityRisks).toContain('virus.exe: Security risk detected');
      expect(result.securityRisks).toContain('../../../etc/passwd.txt: Security risk detected');
    });

    test('should enforce total size limits', async () => {
      const files = [
        new MockFile('file1.txt', 'text/plain', 5 * 1024 * 1024),
        new MockFile('file2.txt', 'text/plain', 4 * 1024 * 1024),
        new MockFile('file3.txt', 'text/plain', 2 * 1024 * 1024),
      ];

      const result = await validateFilesSecure(
        files as File[],
        ['text/plain'],
        undefined,
        8 * 1024 * 1024, // 8MB total limit
      );

      expect(result.validFiles).toHaveLength(2);
      expect(result.errors).toContain('Total file size would exceed 8MB limit');
    });
  });

  describe('Security Integration Tests', () => {
    test('should handle sophisticated attack combinations', async () => {
      const sophisticatedAttacks = [
        new MockFile('../../evil.php%00.jpg', 'image/jpeg'),
        new MockFile('script.bat.pdf', 'application/pdf'),
        new MockFile('CON.txt', 'text/plain'),
        new MockFile('file\0name.txt', 'text/plain'),
      ];

      for (const file of sophisticatedAttacks) {
        const result = await validateFileSecure(file as File, [
          'image/jpeg',
          'application/pdf',
          'text/plain',
        ]);
        expect(result.isValid).toBe(false);
        expect(result.securityRisk).toBe(true);
      }
    });

    test('should maintain performance with large file lists', async () => {
      const files = Array.from(
        { length: 100 },
        (_, i) => new MockFile(`file${i}.txt`, 'text/plain', 1024),
      );

      const startTime = Date.now();
      const result = await validateFilesSecure(files as File[], ['text/plain']);
      const endTime = Date.now();

      expect(result.validFiles).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should prevent all known bypass techniques', async () => {
      const bypassAttempts = [
        // Double extension bypass
        new MockFile('image.jpg.php', 'image/jpeg'),
        // Null byte injection
        new MockFile('image.jpg\0.php', 'image/jpeg'),
        // Case variation bypass
        new MockFile('IMAGE.PHP', 'image/jpeg'),
        // Unicode bypass attempts
        new MockFile('image.ｊｐｇ', 'image/jpeg'),
        // MIME type spoofing
        new MockFile('script.php', 'image/jpeg'),
      ];

      for (const file of bypassAttempts) {
        const result = await validateFileSecure(file as File, ['image/jpeg']);
        expect(result.isValid).toBe(false);
      }
    });
  });
});
