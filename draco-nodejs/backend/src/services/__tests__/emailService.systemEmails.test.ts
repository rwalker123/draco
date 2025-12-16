import { describe, expect, it, vi } from 'vitest';

import { EmailService } from '../emailService.js';

describe('EmailService composeAndSendEmailToAddresses', () => {
  it('creates an email with external recipients and queues it', async () => {
    const service = Object.create(EmailService.prototype) as EmailService;

    const emailRepository = {
      createEmail: vi.fn().mockImplementation(async (data) => ({
        id: BigInt(1),
        subject: data.subject,
        body_html: data.body_html,
      })),
      createEmailRecipients: vi.fn().mockResolvedValue(undefined),
      updateEmail: vi.fn().mockResolvedValue(undefined),
    };

    const queueEmailBatches = vi.fn().mockResolvedValue(undefined);

    (service as any).emailRepository = emailRepository;
    (service as any).queueEmailBatches = queueEmailBatches;
    (service as any).resolveSystemSenderContext = () => ({
      displayName: 'System',
      settings: {
        fromEmail: 'noreply@example.com',
        fromName: 'System',
        provider: 'none',
      },
    });

    const emailId = await service.composeAndSendSystemEmailToAddresses(
      BigInt(1),
      {
        subject: 'System email',
        bodyHtml: '<style>.x{color:red}</style><div>ok</div>',
        recipients: { emails: ['USER@EXAMPLE.COM', 'not-an-email'] },
      },
      { isSystemEmail: true },
    );

    expect(emailId).toBe(BigInt(1));
    expect(emailRepository.createEmail).toHaveBeenCalledTimes(1);
    expect(emailRepository.createEmailRecipients).toHaveBeenCalledTimes(1);
    expect(queueEmailBatches).toHaveBeenCalledTimes(1);

    const createdEmail = emailRepository.createEmail.mock.calls[0]?.[0];
    expect(createdEmail.body_html).toContain('<style>');

    const createdRecipients = emailRepository.createEmailRecipients.mock.calls[0]?.[0];
    expect(createdRecipients).toEqual([
      expect.objectContaining({
        contact_id: null,
        email_address: 'user@example.com',
        recipient_type: 'external',
      }),
    ]);
  });
});
