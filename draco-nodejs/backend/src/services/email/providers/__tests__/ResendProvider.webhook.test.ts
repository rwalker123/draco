import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResendProvider } from '../ResendProvider.js';
import { ResendWebhookEvent } from '../../../../interfaces/emailInterfaces.js';

const hoisted = vi.hoisted(() => ({
  mockPrisma: {
    email_recipients: {
      findMany: vi.fn(),
      update: vi.fn(),
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
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'test' } }),
    },
    domains: {
      list: vi.fn().mockResolvedValue({ data: [] }),
    },
  })),
}));

vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn(),
  })),
}));

describe('ResendProvider - Webhook Processing', () => {
  let provider: ResendProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    provider = new ResendProvider({
      service: 'Resend',
      // pragma: allowlist secret
      resendApiKey: 'resend_mock_api_key_for_tests_only', // pragma: allowlist secret
    });
  });

  it('processes webhook events and updates recipients', async () => {
    const events: ResendWebhookEvent[] = [
      {
        type: 'email.delivered',
        data: {
          created_at: '2024-01-01T00:00:00.000Z',
          email: {
            to: ['recipient@example.com'],
          },
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
  });

  it('skips processing when no recipients are found', async () => {
    const events: ResendWebhookEvent[] = [
      {
        type: 'email.delivered',
        data: {
          email: {
            to: ['missing@example.com'],
          },
        },
      },
    ];

    hoisted.mockPrisma.email_recipients.findMany.mockResolvedValue([]);

    const result = await provider.processWebhookEvents(events);

    expect(result.processed).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(hoisted.mockPrisma.email_recipients.update).not.toHaveBeenCalled();
  });

  it('collects errors when updates fail', async () => {
    const events: ResendWebhookEvent[] = [
      {
        type: 'email.delivered',
        data: {
          email: {
            to: ['recipient@example.com'],
          },
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
