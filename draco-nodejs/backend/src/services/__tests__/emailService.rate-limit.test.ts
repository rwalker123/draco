import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

vi.mock(
  '@draco/shared-schemas',
  () => ({
    EmailListPagedType: {},
    EmailRecipientGroupsType: {},
    EmailSendType: {},
    PagingType: {},
  }),
  { virtual: true },
);

import { EmailService } from '../emailService.js';
import type { EmailSettings, ResolvedRecipient } from '../../interfaces/emailInterfaces.js';

const BASE_CONFIG = {
  MAX_EMAILS_PER_SECOND: 80,
  MAX_EMAILS_PER_MINUTE: 4800,
  RATE_LIMIT_ENABLED: true,
  EMAIL_DELAY_MS: 12,
  PROCESS_INTERVAL_MS: 100,
} as const;

const createRecipient = (id: number): ResolvedRecipient => ({
  contactId: BigInt(id),
  emailAddress: `user${id}@example.com`,
  contactName: `User ${id}`,
  recipientType: 'individual',
});

const buildJob = (overrides?: Partial<Record<string, unknown>>) => ({
  id: 'job-1',
  emailId: BigInt(1),
  batchIndex: 0,
  recipients: [createRecipient(1), createRecipient(2), createRecipient(3)],
  subject: 'Test subject',
  bodyHtml: '<p>Hello</p>',
  settings: {
    fromEmail: 'from@example.com',
    fromName: 'Draco',
    replyTo: 'reply@example.com',
    provider: 'sendgrid',
  } as EmailSettings,
  retryCount: 0,
  rateLimitRetries: 0,
  scheduledAt: new Date(),
  createdAt: new Date(),
  attachments: [],
  ...overrides,
});

const createService = () => {
  const service = Object.create(EmailService.prototype) as EmailService;

  const emailRepository = {
    updateRecipientStatus: vi.fn().mockResolvedValue(undefined),
    updateEmail: vi.fn(),
    getRecipientStatusCounts: vi.fn().mockResolvedValue([]),
  };

  Object.assign(service, {
    jobQueue: new Map<string, unknown>(),
    processingQueue: new Set<string>(),
    rateLimitWindow: { startTime: new Date(), count: 0 },
    emailRepository,
    stripHtml: vi.fn().mockReturnValue('Plain text'),
    sleep: vi.fn().mockResolvedValue(undefined),
    checkAndUpdateEmailStatus: vi.fn().mockResolvedValue(undefined),
    RATE_LIMIT_BACKOFF_MS: [5000, 10000, 20000],
    MAX_RATE_LIMIT_RETRIES: 3,
    RETRY_DELAYS: [1000, 5000, 15000],
    canSendEmails: vi.fn().mockResolvedValue(true),
    getProviderConfig: vi.fn().mockResolvedValue(BASE_CONFIG),
    getProviderType: vi.fn().mockResolvedValue('sendgrid'),
  });

  return { service, emailRepository };
};

describe('EmailService rate limit handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requeues remaining recipients when provider returns a 429 response', async () => {
    const { service, emailRepository } = createService();
    const sendEmail = vi
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: '429 Rate limited' });

    Object.assign(service, {
      getProvider: vi.fn().mockResolvedValue({ sendEmail }),
    });

    const job = buildJob();
    await (
      service as unknown as { processBatchJob(job: ReturnType<typeof buildJob>): Promise<void> }
    ).processBatchJob(job);

    expect(sendEmail).toHaveBeenCalledTimes(2);

    const updateCalls = (emailRepository.updateRecipientStatus as Mock).mock.calls;
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0][0]).toBe(job.emailId);
    expect(updateCalls[0][1]).toBe(job.recipients[0].contactId);
    expect((updateCalls[0][2] as { status: string }).status).toBe('sent');

    const queuedJobs = Array.from(
      (
        service as unknown as {
          jobQueue: Map<
            string,
            { recipients: ResolvedRecipient[]; rateLimitRetries: number; scheduledAt: Date }
          >;
        }
      ).jobQueue.values(),
    );
    expect(queuedJobs).toHaveLength(1);
    expect(queuedJobs[0].recipients).toHaveLength(2);
    expect(queuedJobs[0].recipients[0].contactId).toBe(job.recipients[1].contactId);
    expect(queuedJobs[0].rateLimitRetries).toBe(1);
    expect(queuedJobs[0].scheduledAt.getTime()).toBeGreaterThan(Date.now());

    expect(
      (service as unknown as { rateLimitWindow: { count: number } }).rateLimitWindow.count,
    ).toBe(BASE_CONFIG.MAX_EMAILS_PER_SECOND);
  });

  it('marks recipients as failed when rate limit retries are exhausted', async () => {
    const { service, emailRepository } = createService();
    Object.assign(service, {
      MAX_RATE_LIMIT_RETRIES: 1,
    });

    const job = buildJob({ rateLimitRetries: 1 });
    const result = await (
      service as unknown as {
        handleRateLimitBackoff(
          job: ReturnType<typeof buildJob>,
          startIndex: number,
          config: typeof BASE_CONFIG,
          error: unknown,
          explicitMessage?: string,
        ): Promise<{ requeued: boolean; failedCount: number }>;
      }
    ).handleRateLimitBackoff(job, 1, BASE_CONFIG, undefined, '429 Rate limited');

    expect(result.requeued).toBe(false);
    expect(result.failedCount).toBe(2);

    const updateCalls = (emailRepository.updateRecipientStatus as Mock).mock.calls;
    expect(updateCalls).toHaveLength(2);
    expect(
      updateCalls.every(
        (call) =>
          call[0] === job.emailId &&
          (call[2] as { status: string; error_message: string }).status === 'failed' &&
          (call[2] as { error_message: string }).error_message.includes('Rate limit exceeded'),
      ),
    ).toBe(true);
  });
});
