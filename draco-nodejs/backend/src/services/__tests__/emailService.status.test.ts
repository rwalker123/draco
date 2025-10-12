import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@draco/shared-schemas', () => ({
  EmailListPagedType: {},
  EmailRecipientGroupsType: {},
  EmailSendType: {},
  PagingType: {},
}));

import { EmailService } from '../emailService.js';

describe('EmailService email status updates', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const buildService = () => {
    const service = Object.create(EmailService.prototype) as EmailService;

    const emailRepository = {
      getRecipientStatusCounts: vi.fn(),
      updateEmail: vi.fn(),
      updateRecipientStatus: vi.fn(),
    };

    Object.assign(
      service as unknown as {
        jobQueue: Map<string, { emailId: bigint }>;
        processingQueue: Set<string>;
        emailRepository: typeof emailRepository;
      },
      {
        jobQueue: new Map(),
        processingQueue: new Set(),
        emailRepository,
      },
    );

    return { service, emailRepository };
  };

  it('ignores batches that are still processing when checking completion', async () => {
    const { service, emailRepository } = buildService();

    const emailId = BigInt(42);
    (service as unknown as { jobQueue: Map<string, { emailId: bigint }> }).jobQueue.set('job-1', {
      emailId,
    });
    (service as unknown as { processingQueue: Set<string> }).processingQueue.add('job-1');

    emailRepository.getRecipientStatusCounts.mockResolvedValue([{ status: 'sent', count: 3 }]);

    await (
      service as unknown as { checkAndUpdateEmailStatus(id: bigint): Promise<void> }
    ).checkAndUpdateEmailStatus(emailId);

    expect(emailRepository.getRecipientStatusCounts).toHaveBeenCalledWith(emailId);
    expect(emailRepository.updateEmail).toHaveBeenCalledWith(
      emailId,
      expect.objectContaining({
        status: 'sent',
        successful_deliveries: 3,
        failed_deliveries: 0,
      }),
    );
  });

  it('waits for other pending batches before marking an email complete', async () => {
    const { service, emailRepository } = buildService();

    const emailId = BigInt(55);
    (service as unknown as { jobQueue: Map<string, { emailId: bigint }> }).jobQueue.set('job-1', {
      emailId,
    });

    await (
      service as unknown as { checkAndUpdateEmailStatus(id: bigint): Promise<void> }
    ).checkAndUpdateEmailStatus(emailId);

    expect(emailRepository.getRecipientStatusCounts).not.toHaveBeenCalled();
    expect(emailRepository.updateEmail).not.toHaveBeenCalled();
  });
});
