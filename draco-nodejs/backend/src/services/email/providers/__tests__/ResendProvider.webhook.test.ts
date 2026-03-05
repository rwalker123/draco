import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResendProvider } from '../ResendProvider.js';
import { ResendWebhookEvent } from '../../../../interfaces/emailInterfaces.js';
import type { EmailSettings } from '../../../../config/email.js';

const hoisted = vi.hoisted(() => {
  const mockPrisma = {
    email_recipients: {
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    email_events: {
      create: vi.fn(),
    },
    emails: {
      update: vi.fn(),
    },
  };

  class MockResend {
    emails = {
      send: vi.fn().mockResolvedValue({ data: { id: 'test' } }),
    };

    domains = {
      list: vi.fn().mockResolvedValue({ data: [] }),
    };
  }

  const mockWebhookVerify = vi.fn();
  class MockWebhook {
    verify = mockWebhookVerify;
  }

  return {
    mockPrisma,
    MockResend,
    MockWebhook,
    mockWebhookVerify,
  };
});

vi.mock('../../../../lib/prisma.js', () => ({ default: hoisted.mockPrisma }));
vi.mock('resend', () => ({
  Resend: hoisted.MockResend,
}));

vi.mock('svix', () => ({
  Webhook: hoisted.MockWebhook,
}));

const mockEmailRepository = {
  markContactBounced: vi.fn().mockResolvedValue(true),
  incrementSuccessfulDeliveries: vi.fn().mockResolvedValue(undefined),
};

describe('ResendProvider - Webhook Processing', () => {
  let provider: ResendProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailRepository.markContactBounced.mockResolvedValue(true);

    const testSettings: EmailSettings = {
      provider: 'resend',
      fromEmail: 'test@example.com',
      fromName: 'Test',
    };

    provider = new ResendProvider(
      {
        service: 'Resend',
        // pragma: allowlist secret
        resendApiKey: 'resend_mock_api_key_for_tests_only', // pragma: allowlist secret
      },
      testSettings,
      mockEmailRepository as any,
    );
  });

  it('processes webhook events and updates recipients', async () => {
    const events: ResendWebhookEvent[] = [
      {
        type: 'email.delivered',
        created_at: '2024-01-01T00:00:00.000Z',
        data: {
          to: ['recipient@example.com'],
          from: 'sender@example.com',
          subject: 'Test Email',
          email_id: 'test-email-id',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      },
    ];

    const mockRecipient = {
      id: BigInt(1),
      email_id: BigInt(10),
      email_address: 'recipient@example.com',
    };

    hoisted.mockPrisma.email_recipients.findMany.mockResolvedValue([mockRecipient]);
    hoisted.mockPrisma.email_recipients.update.mockResolvedValue({});
    hoisted.mockPrisma.email_events.create.mockResolvedValue({});
    hoisted.mockPrisma.emails.update.mockResolvedValue({});

    const result = await provider.processWebhookEvents(events);

    expect(result.processed).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(hoisted.mockPrisma.email_recipients.update).toHaveBeenCalledTimes(1);
    expect(hoisted.mockPrisma.email_events.create).toHaveBeenCalledTimes(1);
    expect(mockEmailRepository.incrementSuccessfulDeliveries).toHaveBeenCalledWith(BigInt(10));
  });

  it('skips processing when no recipients are found', async () => {
    const events: ResendWebhookEvent[] = [
      {
        type: 'email.delivered',
        created_at: '2024-01-01T00:00:00.000Z',
        data: {
          to: ['missing@example.com'],
          from: 'sender@example.com',
          subject: 'Test Email',
          email_id: 'test-email-id',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      },
    ];

    hoisted.mockPrisma.email_recipients.findMany.mockResolvedValue([]);

    const result = await provider.processWebhookEvents(events);

    expect(result.processed).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(hoisted.mockPrisma.email_recipients.update).not.toHaveBeenCalled();
  });

  describe('contact bounce marking', () => {
    const bounceRecipient = {
      id: BigInt(1),
      email_id: BigInt(10),
      email_address: 'contact@example.com',
      contact_id: BigInt(200),
      contact_name: 'Test Contact',
      email: {
        subject: 'Test Subject',
        sender_contact: {
          email: 'sender@example.com',
          firstname: 'Test',
          lastname: 'Sender',
        },
      },
    };

    it('pushes to contactBounces for email.bounced when markContactBounced returns true', async () => {
      hoisted.mockPrisma.email_recipients.findMany.mockResolvedValue([bounceRecipient]);
      hoisted.mockPrisma.email_recipients.update.mockResolvedValue({});
      hoisted.mockPrisma.email_events.create.mockResolvedValue({});
      hoisted.mockPrisma.emails.update.mockResolvedValue({});
      mockEmailRepository.markContactBounced.mockResolvedValue(true);

      const event: ResendWebhookEvent = {
        type: 'email.bounced',
        created_at: '2024-01-01T00:00:00.000Z',
        data: {
          to: ['contact@example.com'],
          from: 'sender@example.com',
          subject: 'Test Subject',
          email_id: 'eid1',
          created_at: '2024-01-01T00:00:00.000Z',
          bounce: { message: 'Mailbox full' },
        },
      };

      const result = await provider.processWebhookEvents([event]);

      expect(mockEmailRepository.markContactBounced).toHaveBeenCalledWith(BigInt(200));
      expect(result.contactBounces).toHaveLength(1);
      expect(result.contactBounces[0]).toMatchObject({
        contactId: BigInt(200),
        emailAddress: 'contact@example.com',
        senderEmail: 'sender@example.com',
        bounceReason: 'Mailbox full',
        emailSubject: 'Test Subject',
      });
    });

    it('pushes to contactBounces for email.complained when markContactBounced returns true', async () => {
      hoisted.mockPrisma.email_recipients.findMany.mockResolvedValue([bounceRecipient]);
      hoisted.mockPrisma.email_recipients.update.mockResolvedValue({});
      hoisted.mockPrisma.email_events.create.mockResolvedValue({});
      hoisted.mockPrisma.emails.update.mockResolvedValue({});
      mockEmailRepository.markContactBounced.mockResolvedValue(true);

      const event: ResendWebhookEvent = {
        type: 'email.complained',
        created_at: '2024-01-01T00:00:00.000Z',
        data: {
          to: ['contact@example.com'],
          from: 'sender@example.com',
          subject: 'Test Subject',
          email_id: 'eid2',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = await provider.processWebhookEvents([event]);

      expect(mockEmailRepository.markContactBounced).toHaveBeenCalledWith(BigInt(200));
      expect(result.contactBounces).toHaveLength(1);
    });

    it('does not push to contactBounces when markContactBounced returns false', async () => {
      hoisted.mockPrisma.email_recipients.findMany.mockResolvedValue([bounceRecipient]);
      hoisted.mockPrisma.email_recipients.update.mockResolvedValue({});
      hoisted.mockPrisma.email_events.create.mockResolvedValue({});
      hoisted.mockPrisma.emails.update.mockResolvedValue({});
      mockEmailRepository.markContactBounced.mockResolvedValue(false);

      const event: ResendWebhookEvent = {
        type: 'email.bounced',
        created_at: '2024-01-01T00:00:00.000Z',
        data: {
          to: ['contact@example.com'],
          from: 'sender@example.com',
          subject: 'Test Subject',
          email_id: 'eid3',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = await provider.processWebhookEvents([event]);

      expect(mockEmailRepository.markContactBounced).toHaveBeenCalledWith(BigInt(200));
      expect(result.contactBounces).toHaveLength(0);
    });

    it('does not call markContactBounced when contact_id is null', async () => {
      const recipientWithoutContact = { ...bounceRecipient, contact_id: null };
      hoisted.mockPrisma.email_recipients.findMany.mockResolvedValue([recipientWithoutContact]);
      hoisted.mockPrisma.email_recipients.update.mockResolvedValue({});
      hoisted.mockPrisma.email_events.create.mockResolvedValue({});
      hoisted.mockPrisma.emails.update.mockResolvedValue({});

      const event: ResendWebhookEvent = {
        type: 'email.bounced',
        created_at: '2024-01-01T00:00:00.000Z',
        data: {
          to: ['contact@example.com'],
          from: 'sender@example.com',
          subject: 'Test Subject',
          email_id: 'eid4',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = await provider.processWebhookEvents([event]);

      expect(mockEmailRepository.markContactBounced).not.toHaveBeenCalled();
      expect(result.contactBounces).toHaveLength(0);
    });
  });

  it('collects errors when updates fail', async () => {
    const events: ResendWebhookEvent[] = [
      {
        type: 'email.delivered',
        created_at: '2024-01-01T00:00:00.000Z',
        data: {
          to: ['recipient@example.com'],
          from: 'sender@example.com',
          subject: 'Test Email',
          email_id: 'test-email-id',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      },
    ];

    const mockRecipient = {
      id: BigInt(1),
      email_id: BigInt(10),
      email_address: 'recipient@example.com',
    };

    hoisted.mockPrisma.email_recipients.findMany.mockResolvedValue([mockRecipient]);
    hoisted.mockPrisma.email_recipients.update.mockRejectedValue(new Error('update failed'));

    const result = await provider.processWebhookEvents(events);

    expect(result.processed).toBe(0);
    expect(result.errors).toHaveLength(1);
  });
});

describe('ResendProvider.verifyWebhookSignature', () => {
  const validHeaders = {
    'svix-id': 'msg_123',
    'svix-timestamp': '1700000000',
    'svix-signature': 'v1,abc123',
  };

  it('returns false when secret is empty', () => {
    expect(ResendProvider.verifyWebhookSignature('payload', validHeaders, '')).toBe(false);
  });

  it('returns true when Webhook.verify does not throw', () => {
    hoisted.mockWebhookVerify.mockReturnValue(undefined);
    expect(ResendProvider.verifyWebhookSignature('payload', validHeaders, 'whsec_testsecret')).toBe(
      true,
    );
  });

  it('returns false when Webhook.verify throws', () => {
    hoisted.mockWebhookVerify.mockImplementation(() => {
      throw new Error('invalid signature');
    });
    expect(ResendProvider.verifyWebhookSignature('payload', validHeaders, 'whsec_testsecret')).toBe(
      false,
    );
  });
});
