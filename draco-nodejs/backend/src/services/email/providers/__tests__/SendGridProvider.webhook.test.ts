import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SendGridProvider } from '../SendGridProvider.js';
import { SendGridWebhookEvent } from '../../../../interfaces/emailInterfaces.js';
import type { EmailSettings } from '../../../../config/email.js';

// Mock the centralized prisma module (hoisted)
const hoisted = vi.hoisted(() => ({
  mockPrisma: {
    email_recipients: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    email_events: {
      create: vi.fn(),
    },
    emails: {
      update: vi.fn(),
    },
  },
}));

vi.mock('../../../../lib/prisma.js', () => ({ default: hoisted.mockPrisma }));
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(),
      verify: vi.fn(),
    })),
  },
}));

const mockPrisma = hoisted.mockPrisma as any;

describe('SendGridProvider - Webhook Processing', () => {
  let provider: SendGridProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockConfig = {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: { user: 'apikey', pass: 'test-key' },
    };

    const testSettings: EmailSettings = {
      provider: 'sendgrid',
      fromEmail: 'test@example.com',
      fromName: 'Test',
    };

    provider = new SendGridProvider(mockConfig, testSettings);
  });

  describe('processWebhookEvents', () => {
    it('should process multiple webhook events successfully', async () => {
      const events: SendGridWebhookEvent[] = [
        {
          email: 'test1@example.com',
          timestamp: 1640995200, // 2022-01-01 00:00:00 UTC
          event: 'delivered',
          sg_event_id: 'event1',
          sg_message_id: 'msg1',
        },
        {
          email: 'test2@example.com',
          timestamp: 1640995260, // 2022-01-01 00:01:00 UTC
          event: 'open',
          sg_event_id: 'event2',
          sg_message_id: 'msg2',
        },
      ];

      const mockRecipient = {
        id: BigInt(1),
        email_id: BigInt(100),
        email_address: 'test1@example.com',
        contact_id: BigInt(200),
      };

      hoisted.mockPrisma.email_recipients.findFirst.mockResolvedValue(mockRecipient);
      hoisted.mockPrisma.email_recipients.update.mockResolvedValue({});
      hoisted.mockPrisma.email_events.create.mockResolvedValue({});
      hoisted.mockPrisma.emails.update.mockResolvedValue({});

      const result = await provider.processWebhookEvents(events);

      expect(result.processed).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(hoisted.mockPrisma.email_recipients.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should handle events with no matching recipient', async () => {
      const events: SendGridWebhookEvent[] = [
        {
          email: 'nonexistent@example.com',
          timestamp: 1640995200,
          event: 'delivered',
          sg_event_id: 'event1',
          sg_message_id: 'msg1',
        },
      ];

      hoisted.mockPrisma.email_recipients.findFirst.mockResolvedValue(null);

      const result = await provider.processWebhookEvents(events);

      expect(result.processed).toBe(1); // Still counts as processed (no error)
      expect(result.errors).toHaveLength(0);
      expect(hoisted.mockPrisma.email_recipients.update).not.toHaveBeenCalled();
    });

    it('should collect errors for failed event processing', async () => {
      const events: SendGridWebhookEvent[] = [
        {
          email: 'test@example.com',
          timestamp: 1640995200,
          event: 'delivered',
          sg_event_id: 'event1',
          sg_message_id: 'msg1',
        },
      ];

      const mockRecipient = {
        id: BigInt(1),
        email_id: BigInt(100),
        email_address: 'test@example.com',
        contact_id: BigInt(200),
      };

      hoisted.mockPrisma.email_recipients.findFirst.mockResolvedValue(mockRecipient);
      hoisted.mockPrisma.email_recipients.update.mockRejectedValue(new Error('Database error'));

      const result = await provider.processWebhookEvents(events);

      expect(result.processed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Database error');
    });
  });

  describe('event type mapping and processing', () => {
    let mockRecipient: any;

    beforeEach(() => {
      mockRecipient = {
        id: BigInt(1),
        email_id: BigInt(100),
        email_address: 'test@example.com',
        contact_id: BigInt(200),
      };

      hoisted.mockPrisma.email_recipients.findFirst.mockResolvedValue(mockRecipient);
      hoisted.mockPrisma.email_recipients.update.mockResolvedValue({});
      hoisted.mockPrisma.email_events.create.mockResolvedValue({});
      hoisted.mockPrisma.emails.update.mockResolvedValue({});
    });

    it('should process delivered event correctly', async () => {
      const event: SendGridWebhookEvent = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'delivered',
        sg_event_id: 'delivered1',
        sg_message_id: 'msg1',
      };

      await provider.processWebhookEvents([event]);

      expect(mockPrisma.email_recipients.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          status: 'delivered',
          delivered_at: new Date(1640995200 * 1000),
        },
      });
    });

    it('should process bounce event correctly', async () => {
      const event: SendGridWebhookEvent = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'bounce',
        sg_event_id: 'bounce1',
        sg_message_id: 'msg1',
        reason: 'Mailbox does not exist',
      };

      await provider.processWebhookEvents([event]);

      expect(mockPrisma.email_recipients.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          status: 'bounced',
          bounce_reason: 'Mailbox does not exist',
          error_message: 'Mailbox does not exist',
        },
      });

      // Should update email bounce count
      expect(mockPrisma.emails.update).toHaveBeenCalledWith({
        where: { id: BigInt(100) },
        data: {
          bounce_count: { increment: 1 },
        },
      });
    });

    it('should process open event correctly', async () => {
      const event: SendGridWebhookEvent = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'open',
        sg_event_id: 'open1',
        sg_message_id: 'msg1',
        useragent: 'Mozilla/5.0',
        ip: '192.168.1.1',
      };

      await provider.processWebhookEvents([event]);

      expect(mockPrisma.email_recipients.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          status: 'opened',
          opened_at: new Date(1640995200 * 1000),
        },
      });

      expect(mockPrisma.email_events.create).toHaveBeenCalledWith({
        data: {
          email_recipient_id: BigInt(1),
          event_type: 'open',
          event_data: {
            sg_event_id: 'open1',
            sg_message_id: 'msg1',
            smtp_id: undefined,
            reason: undefined,
            status: undefined,
            response: undefined,
            url: undefined,
            category: undefined,
            unique_args: undefined,
          },
          occurred_at: new Date(1640995200 * 1000),
          user_agent: 'Mozilla/5.0',
          ip_address: '192.168.1.1',
        },
      });

      // Should update email open count
      expect(mockPrisma.emails.update).toHaveBeenCalledWith({
        where: { id: BigInt(100) },
        data: {
          open_count: { increment: 1 },
        },
      });
    });

    it('should process click event correctly', async () => {
      const event: SendGridWebhookEvent = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'click',
        sg_event_id: 'click1',
        sg_message_id: 'msg1',
        url: 'https://example.com/link',
        useragent: 'Mozilla/5.0',
        ip: '192.168.1.1',
      };

      await provider.processWebhookEvents([event]);

      expect(mockPrisma.email_recipients.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          status: 'clicked',
          clicked_at: new Date(1640995200 * 1000),
        },
      });

      expect(mockPrisma.email_events.create).toHaveBeenCalledWith({
        data: {
          email_recipient_id: BigInt(1),
          event_type: 'click',
          event_data: expect.objectContaining({
            url: 'https://example.com/link',
          }),
          occurred_at: new Date(1640995200 * 1000),
          user_agent: 'Mozilla/5.0',
          ip_address: '192.168.1.1',
        },
      });

      // Should update email click count
      expect(mockPrisma.emails.update).toHaveBeenCalledWith({
        where: { id: BigInt(100) },
        data: {
          click_count: { increment: 1 },
        },
      });
    });

    it('should handle unknown event types gracefully', async () => {
      const event = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'unknown_event' as any,
        sg_event_id: 'unknown1',
        sg_message_id: 'msg1',
      };

      const result = await provider.processWebhookEvents([event]);

      expect(result.processed).toBe(1); // Still processes without error
      expect(result.errors).toHaveLength(0);
      expect(mockPrisma.email_recipients.update).not.toHaveBeenCalled();
    });

    it('should process spam_report event correctly', async () => {
      const event: SendGridWebhookEvent = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'spam_report',
        sg_event_id: 'spam1',
        sg_message_id: 'msg1',
      };

      await provider.processWebhookEvents([event]);

      expect(mockPrisma.email_recipients.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          status: 'bounced',
          bounce_reason: 'SendGrid spam_report',
          error_message: 'SendGrid spam_report event',
        },
      });
    });

    it('should process unsubscribe event correctly', async () => {
      const event: SendGridWebhookEvent = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'unsubscribe',
        sg_event_id: 'unsub1',
        sg_message_id: 'msg1',
      };

      await provider.processWebhookEvents([event]);

      expect(mockPrisma.email_recipients.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          status: 'bounced',
          error_message: 'SendGrid unsubscribe event',
        },
      });
    });
  });

  describe('findRecipientByEvent', () => {
    it('should find recipient by email address within time window', async () => {
      const mockRecipient = {
        id: BigInt(1),
        email_address: 'test@example.com',
        sent_at: new Date(),
      };

      mockPrisma.email_recipients.findFirst.mockResolvedValue(mockRecipient);

      const event: SendGridWebhookEvent = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'delivered',
        sg_event_id: 'event1',
        sg_message_id: 'msg1',
      };

      await provider.processWebhookEvents([event]);

      expect(mockPrisma.email_recipients.findFirst).toHaveBeenCalledWith({
        where: {
          email_address: 'test@example.com',
          sent_at: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          sent_at: 'desc',
        },
      });
    });
  });

  describe('webhook signature verification', () => {
    it('should have placeholder verification that returns true', () => {
      const result = SendGridProvider.verifyWebhookSignature(
        'test-payload',
        'test-signature',
        'test-key',
      );

      expect(result).toBe(true);
    });

    it('should log warning about unimplemented verification', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      SendGridProvider.verifyWebhookSignature('payload', 'sig', 'key');

      expect(consoleSpy).toHaveBeenCalledWith(
        'SendGrid webhook signature verification not implemented - accepting all requests',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle database errors in recipient update', async () => {
      const event: SendGridWebhookEvent = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'delivered',
        sg_event_id: 'event1',
        sg_message_id: 'msg1',
      };

      const mockRecipient = {
        id: BigInt(1),
        email_id: BigInt(100),
        email_address: 'test@example.com',
      };

      mockPrisma.email_recipients.findFirst.mockResolvedValue(mockRecipient);
      mockPrisma.email_recipients.update.mockRejectedValue(new Error('DB Update failed'));

      const result = await provider.processWebhookEvents([event]);

      expect(result.processed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('DB Update failed');
    });

    it('should handle database errors in event creation', async () => {
      const event: SendGridWebhookEvent = {
        email: 'test@example.com',
        timestamp: 1640995200,
        event: 'delivered',
        sg_event_id: 'event1',
        sg_message_id: 'msg1',
      };

      const mockRecipient = {
        id: BigInt(1),
        email_id: BigInt(100),
        email_address: 'test@example.com',
      };

      mockPrisma.email_recipients.findFirst.mockResolvedValue(mockRecipient);
      mockPrisma.email_recipients.update.mockResolvedValue({});
      mockPrisma.email_events.create.mockRejectedValue(new Error('Event creation failed'));

      const result = await provider.processWebhookEvents([event]);

      expect(result.processed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Event creation failed');
    });
  });
});
