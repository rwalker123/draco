import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EmailService } from '../emailService.js';
import prisma from '../../lib/prisma.js';

// Mock dependencies
vi.mock('../../lib/prisma.js', () => ({
  default: {
    emails: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    email_recipients: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../emailAttachmentService.js');

describe('EmailService - Scheduling Functionality', () => {
  let emailService: EmailService;
  let mockPrisma: typeof prisma;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = prisma as any;
    emailService = new EmailService();
  });

  afterEach(() => {
    emailService.stopAllProcessors();
  });

  describe('processScheduledEmails', () => {
    it('should process emails scheduled for current time', async () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 60000); // 1 minute ago

      const mockScheduledEmail = {
        id: BigInt(1),
        subject: 'Test Email',
        body_html: '<p>Test content</p>',
        template_id: null,
        scheduled_send_at: pastTime,
      };

      const mockRecipients = [
        {
          id: BigInt(1),
          email_id: BigInt(1),
          contact_id: BigInt(100),
          email_address: 'test@example.com',
          contact_name: 'Test User',
          recipient_type: 'individual',
        },
      ];

      mockPrisma.emails.findMany.mockResolvedValue([mockScheduledEmail]);
      mockPrisma.email_recipients.findMany.mockResolvedValue(mockRecipients);
      mockPrisma.emails.update.mockResolvedValue({ id: BigInt(1) });

      // Mock the private method by calling it through reflection
      const processScheduledEmails = (emailService as any).processScheduledEmails.bind(
        emailService,
      );

      await processScheduledEmails();

      // Verify database queries
      expect(mockPrisma.emails.findMany).toHaveBeenCalledWith({
        where: {
          status: 'scheduled',
          scheduled_send_at: {
            lte: expect.any(Date),
          },
        },
        orderBy: {
          scheduled_send_at: 'asc',
        },
      });

      expect(mockPrisma.emails.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { status: 'sending' },
      });

      expect(mockPrisma.email_recipients.findMany).toHaveBeenCalledWith({
        where: { email_id: BigInt(1) },
      });
    });

    it('should handle emails with no existing recipients gracefully', async () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 60000);

      const mockScheduledEmail = {
        id: BigInt(2),
        subject: 'Test Email No Recipients',
        body_html: '<p>Test content</p>',
        template_id: null,
        scheduled_send_at: pastTime,
      };

      mockPrisma.emails.findMany.mockResolvedValue([mockScheduledEmail]);
      mockPrisma.email_recipients.findMany.mockResolvedValue([]); // No recipients
      mockPrisma.emails.update.mockResolvedValue({ id: BigInt(2) });

      const processScheduledEmails = (emailService as any).processScheduledEmails.bind(
        emailService,
      );

      await processScheduledEmails();

      // Should mark email as failed
      expect(mockPrisma.emails.update).toHaveBeenCalledWith({
        where: { id: BigInt(2) },
        data: { status: 'sending' },
      });

      expect(mockPrisma.emails.update).toHaveBeenCalledWith({
        where: { id: BigInt(2) },
        data: {
          status: 'failed',
          sent_at: expect.any(Date),
        },
      });
    });

    it('should skip processing if no scheduled emails found', async () => {
      mockPrisma.emails.findMany.mockResolvedValue([]);

      const processScheduledEmails = (emailService as any).processScheduledEmails.bind(
        emailService,
      );

      await processScheduledEmails();

      expect(mockPrisma.emails.findMany).toHaveBeenCalledOnce();
      expect(mockPrisma.emails.update).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.emails.findMany.mockRejectedValue(dbError);

      const processScheduledEmails = (emailService as any).processScheduledEmails.bind(
        emailService,
      );

      await expect(processScheduledEmails()).resolves.not.toThrow();
    });

    it('should handle individual email processing errors', async () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 60000);

      const mockScheduledEmail = {
        id: BigInt(3),
        subject: 'Test Email Error',
        body_html: '<p>Test content</p>',
        template_id: null,
        scheduled_send_at: pastTime,
      };

      mockPrisma.emails.findMany.mockResolvedValue([mockScheduledEmail]);
      mockPrisma.email_recipients.findMany.mockResolvedValue([]); // No recipients
      mockPrisma.emails.update
        .mockResolvedValueOnce({ id: BigInt(3) }) // First update (status='sending') succeeds
        .mockRejectedValueOnce(new Error('Update failed')); // Second update (marking as failed) fails

      const processScheduledEmails = (emailService as any).processScheduledEmails.bind(
        emailService,
      );

      await processScheduledEmails();

      // Should attempt multiple updates: 1) set to sending, 2) set to failed (in no recipients path), 3) set to failed (in error handler)
      expect(mockPrisma.emails.update).toHaveBeenCalledTimes(3);
    });

    it('should process multiple scheduled emails in order', async () => {
      const now = new Date();
      const time1 = new Date(now.getTime() - 120000); // 2 minutes ago
      const time2 = new Date(now.getTime() - 60000); // 1 minute ago

      const mockScheduledEmails = [
        {
          id: BigInt(1),
          subject: 'First Email',
          body_html: '<p>First content</p>',
          template_id: null,
          scheduled_send_at: time1,
        },
        {
          id: BigInt(2),
          subject: 'Second Email',
          body_html: '<p>Second content</p>',
          template_id: null,
          scheduled_send_at: time2,
        },
      ];

      const mockRecipients = [
        {
          id: BigInt(1),
          email_id: BigInt(1),
          contact_id: BigInt(100),
          email_address: 'test1@example.com',
          contact_name: 'Test User 1',
          recipient_type: 'individual',
        },
      ];

      mockPrisma.emails.findMany.mockResolvedValue(mockScheduledEmails);
      mockPrisma.email_recipients.findMany.mockResolvedValue(mockRecipients);
      mockPrisma.emails.update.mockResolvedValue({ id: BigInt(1) });

      const processScheduledEmails = (emailService as any).processScheduledEmails.bind(
        emailService,
      );

      await processScheduledEmails();

      // Should process both emails
      expect(mockPrisma.emails.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.email_recipients.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('scheduled email processor lifecycle', () => {
    it('should start scheduled email processor on initialization', () => {
      const newEmailService = new EmailService();

      // Check that the processor interval is set
      expect((newEmailService as any).scheduledEmailProcessor).not.toBeNull();

      newEmailService.stopAllProcessors();
    });

    it('should stop scheduled email processor', () => {
      emailService.stopScheduledEmailProcessor();

      expect((emailService as any).scheduledEmailProcessor).toBeNull();
    });

    it('should restart scheduled email processor if already running', () => {
      const originalProcessor = (emailService as any).scheduledEmailProcessor;

      // Start again (should clear the old one)
      (emailService as any).startScheduledEmailProcessor();

      const newProcessor = (emailService as any).scheduledEmailProcessor;
      expect(newProcessor).not.toBe(originalProcessor);
      expect(newProcessor).not.toBeNull();
    });

    it('should stop all processors including scheduled email processor', () => {
      emailService.stopAllProcessors();

      expect((emailService as any).scheduledEmailProcessor).toBeNull();
      expect((emailService as any).queueProcessor).toBeNull();
    });
  });

  describe('integration with attachment service', () => {
    it('should load attachments when processing scheduled emails', async () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 60000);

      const mockScheduledEmail = {
        id: BigInt(1),
        subject: 'Email with Attachments',
        body_html: '<p>Content with attachments</p>',
        template_id: null,
        scheduled_send_at: pastTime,
      };

      const mockRecipients = [
        {
          id: BigInt(1),
          email_id: BigInt(1),
          contact_id: BigInt(100),
          email_address: 'test@example.com',
          contact_name: 'Test User',
          recipient_type: 'individual',
        },
      ];

      const mockAttachments = [
        {
          filename: 'test.pdf',
          content: Buffer.from('test content'),
          contentType: 'application/pdf',
        },
      ];

      mockPrisma.emails.findMany.mockResolvedValue([mockScheduledEmail]);
      mockPrisma.email_recipients.findMany.mockResolvedValue(mockRecipients);
      mockPrisma.emails.update.mockResolvedValue({ id: BigInt(1) });

      // Mock attachment service
      const mockAttachmentService = {
        getAttachmentsForSending: vi.fn().mockResolvedValue(mockAttachments),
      };
      (emailService as any).attachmentService = mockAttachmentService;

      const processScheduledEmails = (emailService as any).processScheduledEmails.bind(
        emailService,
      );

      await processScheduledEmails();

      expect(mockAttachmentService.getAttachmentsForSending).toHaveBeenCalledWith('1');
    });
  });
});
